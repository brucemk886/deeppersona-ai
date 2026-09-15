import { currentDeepPrice, currentPrice, deepOrder, ownedReport, reportOrder, saveReportSnapshot, snapshotOf, type OrderRow } from "@/db/payment-store";
import { upgradeAiReading } from "@/lib/ai-reading";
import { fulfillSession } from "@/lib/payment-fulfillment";
import { paymentError, privateJson } from "@/lib/payment-http";
import { readProfileId } from "@/lib/profile-cookie";
import { paymentConfig, stripeClient } from "@/lib/stripe";
import type { ReportResponse } from "@/lib/payment-types";
import { orderRefundPolicy } from '@/lib/refund-policy';
import { freeResultFromSnapshot, reportPreview } from '@/lib/report-preview';

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const report = await ownedReport((await params).id, readProfileId(request), request);
    let order = await reportOrder(report.id);
    let deep = await deepOrder(report.id);
    const config = paymentConfig();
    const matchingEnvironment = (row?: OrderRow | null) => !row || Boolean(row.livemode) === !config.sandbox;
    const sync = new URL(request.url).searchParams.get("sync") === "1";
    if (sync) {
      for (const pending of [order, deep]) {
        if (matchingEnvironment(pending) && pending?.stripe_session_id && pending.status === "pending") {
          await fulfillSession(await stripeClient().checkout.sessions.retrieve(pending.stripe_session_id));
        }
      }
      order = await reportOrder(report.id);
      deep = await deepOrder(report.id);
    }
    const unlocked = Boolean(report.free || (matchingEnvironment(order) && order?.status === "paid"));
    const deepUnlocked = Boolean(matchingEnvironment(deep) && deep?.status === "paid");
    const snapshot = snapshotOf(report);
    if (deepUnlocked && await upgradeAiReading(snapshot)) await saveReportSnapshot(report.id, snapshot);
    const response: ReportResponse = {
      id: report.id, unlocked, deepUnlocked, status: report.free ? "free" : order?.status ?? "unpaid",
      amountCents: report.free ? 0 : order?.amount_cents ?? await currentPrice(report),
      deepAmountCents: currentDeepPrice(),
      deepStatus: deep?.status,
      currency: "usd",
      sandbox: config.sandbox, checkoutReady: config.ready && matchingEnvironment(order) && matchingEnvironment(deep), test: snapshot.test,
      refundPolicy: await orderRefundPolicy(order?.id),
      deepRefundPolicy: await orderRefundPolicy(deep?.id),
      result: unlocked ? snapshot.result : freeResultFromSnapshot(snapshot),
      ...(unlocked ? { questions: snapshot.questions, answerChoices: snapshot.answerChoices, deepResult: snapshot.deepResult } : { preview: reportPreview(snapshot) }),
    };
    return privateJson(response);
  } catch (error) { return paymentError(error); }
}
