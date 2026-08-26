export type AdminLeadRow = {
  answers_json: string | null;
  campaign: string | null;
  completed_at: string;
  email: string;
  marketing_consent: number;
  result_type: string;
  session_id: string;
  source: string | null;
  test_id: string | null;
  test_title: string | null;
};

export type AdminAnswerEvent = {
  option_label: string | null;
  question_id: string;
  session_id: string;
};

export type AdminStats = {
  funnel: { event_name: string; users: number }[];
  onlineNow: number;
  popularQuestions: { answers: number; prompt: string; question_id: string; users: number }[];
  popularTests: { test_id: string; title: string; users: number }[];
  sevenDays: { day: string; leads: number; sessions: number }[];
  sources: { source: string; users: number }[];
  today: { leads: number; sessions: number };
  totals: { consented: number; leads: number; sessions: number };
};
