import { isAdminRequest } from '@/app/admin-auth';
import { getD1 } from '@/db/quiz-store';
import { paymentSettings, providerConfig } from '@/lib/payment-config';
import { PaymentError, paymentError, privateJson, requireSameOrigin } from '@/lib/payment-http';

export const dynamic = 'force-dynamic';

async function settingsResponse() {
  return privateJson({ ...await paymentSettings(), options: [providerConfig('lemonsqueezy'), providerConfig('stripe')] });
}

export async function GET(request: Request) {
  if (!await isAdminRequest(request)) return privateJson({ error: 'Unauthorized' }, 401);
  try { return await settingsResponse(); } catch (error) { return paymentError(error); }
}

export async function PUT(request: Request) {
  if (!await isAdminRequest(request)) return privateJson({ error: 'Unauthorized' }, 401);
  try {
    requireSameOrigin(request);
    const { provider } = await request.json() as {provider?: unknown};
    if (provider !== 'stripe' && provider !== 'lemonsqueezy') throw new PaymentError('请选择有效的支付渠道。');
    if (!providerConfig(provider).ready) throw new PaymentError('该渠道尚未完成支付配置，无法启用。', 409);
    await paymentSettings();
    await getD1().prepare(`INSERT INTO payment_settings (id, provider) VALUES (1, ?)
      ON CONFLICT(id) DO UPDATE SET provider = excluded.provider, updated_at = CURRENT_TIMESTAMP`).bind(provider).run();
    return await settingsResponse();
  } catch (error) { return paymentError(error); }
}
