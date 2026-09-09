import { processReportEmails } from '../lib/report-email';
export default {
  async scheduled() { await processReportEmails(); },
};
