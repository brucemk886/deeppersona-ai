import { fulfillLemonEvent, verifiedLemonEvent } from '@/lib/lemonsqueezy';
import { paymentError, privateJson } from '@/lib/payment-http';

export async function POST(request: Request) {
  try {
    await fulfillLemonEvent(await verifiedLemonEvent(request));
    return privateJson({ received: true });
  } catch (error) { return paymentError(error); }
}
