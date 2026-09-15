import type Stripe from "stripe";
import { ensurePaymentSchema } from "@/db/payment-store";
import { getD1 } from "@/db/quiz-store";
import { fulfillSession } from "@/lib/payment-fulfillment";
import { paymentError, privateJson } from "@/lib/payment-http";
import { verifiedStripeEvent } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const event = await verifiedStripeEvent(request);
    await ensurePaymentSchema();
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      await fulfillSession(event.data.object as Stripe.Checkout.Session);
    } else if (event.type === "checkout.session.expired" || event.type === "checkout.session.async_payment_failed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const status = event.type === "checkout.session.expired" ? "expired" : "failed";
      await getD1().batch([
        getD1().prepare(`UPDATE payment_orders SET status = ?, updated_at = CURRENT_TIMESTAMP
          WHERE stripe_session_id = ? AND status = 'pending' AND livemode = ?`)
          .bind(status, session.id, event.livemode ? 1 : 0),
        getD1().prepare(`UPDATE deep_orders SET status = ?, updated_at = CURRENT_TIMESTAMP
          WHERE stripe_session_id = ? AND status = 'pending' AND livemode = ?`)
          .bind(status, session.id, event.livemode ? 1 : 0),
      ]);
    } else if (event.type === "charge.refunded") {
      const charge = event.data.object as Stripe.Charge;
      if (charge.refunded) {
        const intentId = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
        if (intentId) await getD1().batch([
          getD1().prepare(`UPDATE payment_orders SET status = 'refunded', updated_at = CURRENT_TIMESTAMP
            WHERE payment_intent_id = ? AND livemode = ?`).bind(intentId, event.livemode ? 1 : 0),
          getD1().prepare(`UPDATE deep_orders SET status = 'refunded', updated_at = CURRENT_TIMESTAMP
            WHERE payment_intent_id = ? AND livemode = ?`).bind(intentId, event.livemode ? 1 : 0),
        ]);
      }
    }
    return privateJson({ received: true });
  } catch (error) { return paymentError(error); }
}
