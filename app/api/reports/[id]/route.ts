import { currentPrice, ownedReport, reportOrder, snapshotOf } from "@/db/payment-store";
import { fulfillSession } from "@/lib/payment-fulfillment";
import { paymentError, privateJson } from "@/lib/payment-http";
import { readProfileId } from "@/lib/profile-cookie";
import { paymentConfig, stripeClient } from "@/lib/stripe";
import type { ReportResponse } from "@/lib/payment-types";
import { orderRefundPolicy } from '@/lib/refund-policy';

export const dynamic = "force-dynamic";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const report = await ownedReport((await params).id, readProfileId(request), request);
    let order = await reportOrder(report.id);
    const config = paymentConfig();
    const matchingEnvironment = !order || Boolean(order.livemode) === !config.sandbox;
    if (matchingEnvironment && order?.stripe_session_id && order.status === "pending" && new URL(request.url).searchParams.get("sync") === "1") {
      await fulfillSession(await stripeClient().checkout.sessions.retrieve(order.stripe_session_id));
      order = await reportOrder(report.id);
    }
    const unlocked = Boolean(report.free || (matchingEnvironment && order?.status === "paid"));
    const snapshot = snapshotOf(report);
    const response: ReportResponse = {
      id: report.id, unlocked, status: report.free ? "free" : order?.status ?? "unpaid",
      amountCents: report.free ? 0 : order?.amount_cents ?? await currentPrice(report), currency: "usd",
      sandbox: config.sandbox, checkoutReady: config.ready && matchingEnvironment, test: snapshot.test,
      refundPolicy: await orderRefundPolicy(order?.id),
      result: unlocked ? snapshot.result : {
        key: snapshot.result.key, title: snapshot.result.title, summary: snapshot.result.summary,
        eyebrow: snapshot.result.eyebrow, strength: "", watchout: "", nextStep: "",
        axes: snapshot.result.axes, lockedModules: snapshot.result.lockedModules,
      },
      ...(unlocked ? { questions: snapshot.questions, answerChoices: snapshot.answerChoices, deepResult: snapshot.deepResult } : {}),
    };
    return privateJson(response);
  } catch (error) { return paymentError(error); }
}
