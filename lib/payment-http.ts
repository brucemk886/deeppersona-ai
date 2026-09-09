export class PaymentError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

export function privateJson(value: unknown, status = 200) {
  return Response.json(value, { status, headers: { "Cache-Control": "private, no-store" } });
}

export function paymentError(error: unknown) {
  if (error instanceof PaymentError) return privateJson({ error: error.message }, error.status);
  // Do not forward Stripe errors, customer data, or runtime configuration to clients.
  return privateJson({ error: "We couldn't complete this request. Please try again." }, 503);
}

export function requireSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin !== new URL(request.url).origin) throw new PaymentError("Invalid request origin.", 403);
}
