import { processReportEmails } from '../lib/report-email';
import { syncBeehiiv } from '../lib/beehiiv-sync';
export default {
  // Independent jobs: a beehiiv outage must not delay paid report emails, and the other way round.
  async scheduled() { await Promise.allSettled([processReportEmails(), syncBeehiiv()]); },
};
