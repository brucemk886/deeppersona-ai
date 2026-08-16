export const RESULT_NAMES: Record<string, string> = {
  explorer: "探索者",
  connector: "连接者",
  architect: "架构者",
  creator: "创造者",
};

export const SEGMENT_RECOMMENDATIONS: Record<string, string> = {
  explorer: "自我探索、旅行体验、职业转型、成长课程",
  connector: "亲密关系、沟通训练、情绪陪伴、社群型产品",
  architect: "效率规划、边界管理、压力调节、结构化课程",
  creator: "表达写作、创意练习、个人品牌、艺术体验",
};

export const FUNNEL_STEPS = [
  ["quiz_started", "开始测试"],
  ["answer_selected", "完成答题"],
  ["email_gate_viewed", "到达邮箱页"],
  ["result_viewed", "查看结果"],
] as const;

export const ATLAS_PATHS = [
  "/quiz/landscapes.png",
  "/quiz/doors.png",
  "/quiz/symbols.png",
  "/quiz/rooms.png",
] as const;

export function formatAdminDate(value: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function formatAdminDay(value: string) {
  return new Intl.DateTimeFormat("zh-CN", { month: "numeric", day: "numeric" }).format(
    new Date(`${value}T00:00:00Z`),
  );
}
