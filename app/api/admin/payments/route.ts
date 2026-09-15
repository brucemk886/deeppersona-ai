import { isAdminRequest } from "@/app/admin-auth";
import { ensurePaymentSchema } from "@/db/payment-store";
import { getD1 } from "@/db/quiz-store";
import { paymentError, privateJson } from "@/lib/payment-http";
import { paymentConfig } from "@/lib/stripe";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (!await isAdminRequest(request)) return privateJson({ error: "Unauthorized" }, 401);
  try {
    await ensurePaymentSchema();
    const orders = await getD1().prepare(`SELECT o.id, o.amount_cents, o.currency, o.status, o.livemode, o.created_at,
      o.paid_at, r.email, t.title AS test_title,
      (SELECT status FROM report_emails WHERE report_id = r.id ORDER BY created_at DESC LIMIT 1) AS email_status,
      (SELECT error FROM report_emails WHERE report_id = r.id ORDER BY created_at DESC LIMIT 1) AS email_error,
      (SELECT first_access_at FROM report_emails WHERE report_id = r.id ORDER BY created_at DESC LIMIT 1) AS email_link_access_at
      FROM payment_orders o
      JOIN quiz_reports r ON r.id = o.report_id LEFT JOIN quiz_tests t ON t.id = r.test_id
      UNION ALL
      SELECT o.id, o.amount_cents, o.currency, o.status, o.livemode, o.created_at,
      o.paid_at, r.email, t.title AS test_title,
      (SELECT status FROM report_emails WHERE report_id = r.id ORDER BY created_at DESC LIMIT 1) AS email_status,
      (SELECT error FROM report_emails WHERE report_id = r.id ORDER BY created_at DESC LIMIT 1) AS email_error,
      (SELECT first_access_at FROM report_emails WHERE report_id = r.id ORDER BY created_at DESC LIMIT 1) AS email_link_access_at
      FROM deep_orders o
      JOIN quiz_reports r ON r.id = o.report_id LEFT JOIN quiz_tests t ON t.id = r.test_id
      ORDER BY created_at DESC LIMIT 100`).all();
    return privateJson({ ...paymentConfig(), orders: orders.results });
  } catch (error) { return paymentError(error); }
}
