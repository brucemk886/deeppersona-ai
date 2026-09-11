import type { QuizQuestion } from "./quiz";
import { relationshipQuestions } from "./relationship-content";

/** Chinese quiz surface copy. Left-on-read is 短信/消息已读 — never 邮件. */

export const RELATIONSHIP_KICKERS_ZH: Record<string, string> = {
  Romance: "恋爱",
  "Self-esteem": "自尊",
  Childhood: "童年",
};

export const RELATIONSHIP_ZH: Record<string, { prompt: string; labels: [string, string, string, string] }> = {
  "attachment-style-v3-q01": {
    prompt: "你的短信显示「已读」——已经两小时没回。你先做什么？",
    labels: ["刷新聊天", "手机扣着", "先等着，再发一条", "写了又删，删了再写"],
  },
  "attachment-style-v3-q02": {
    prompt: "对方只回「k」「忙」「待会」。你会…",
    labels: ["翻旧聊天钻牛角尖", "跟着冷下来", "稳住，只问一次", "连发几条，然后突然冷掉"],
  },
  "attachment-style-v3-q03": {
    prompt: "对方说今晚想一个人待着。你会…",
    labels: ["硬要约 FaceTime / 过来", "松一口气；明天再回", "「好——明天聊？」", "嘴上说好，又去看在不在线"],
  },
  "attachment-style-v3-q04": {
    prompt: "你们实际已经专一，但从未定义关系。朋友问你们是不是正式的。你会…",
    labels: ["今晚就提出来", "躲开这个标签", "这个周末平静地问", "既想要，又怕被困住"],
  },
  "attachment-style-v3-q05": {
    prompt: "过了不错的一周，对方变得更亲昵。你会…",
    labels: ["贴得更紧", "往回撤一点", "享受，但保持自己的节奏", "今晚沉进去，明天又冷却"],
  },
  "attachment-style-v3-q06": {
    prompt: "今天很难熬。对方问你怎么了。你会…",
    labels: ["一股脑全倒出来", "说自己没事", "先说重点，再请对方听", "开口了，又突然闭嘴"],
  },
  "attachment-style-v3-q07": {
    prompt: "连着待了三天。周日下午你想要…",
    labels: ["再一起做一个计划", "真正的独处时间", "先分开几小时，晚饭再聚", "先要空间，随后又黏上去"],
  },
  "attachment-style-v3-q08": {
    prompt: "吵完后一片沉默。你的第一步？",
    labels: ["发短信 / 打电话修好", "离开冷静一下", "「二十分钟后再谈」", "先推开，随后又慌"],
  },
  "attachment-style-v3-q09": {
    prompt: "对方道歉了——但没有你想要的每一处细节。你会…",
    labels: ["继续追问", "说没事；心里仍冷", "把缺的那一点说一次", "先接受，过后再翻出来"],
  },
  "attachment-style-v3-q10": {
    prompt: "同一场争吵，第三次。你会…",
    labels: ["抗议得更狠", "彻底闭嘴", "认自己的部分 + 提一个改变", "爆发，然后消失"],
  },
  "attachment-style-v3-q11": {
    prompt: "对方红着眼睛讲一件难事。你会…",
    labels: ["立刻插手 / 急着修好", "开玩笑或讲道理", "听着；问对方需要什么", "觉得亲近，随后又需要透气"],
  },
  "attachment-style-v3-q12": {
    prompt: "特别亲近的一夜之后，早上你会…",
    labels: ["需要短信和计划", "需要安静的空间", "温暖而平常", "夜里很近，中午就疏远"],
  },
  "attachment-style-v3-q13": {
    prompt: "对方真诚地称赞你。你会…",
    labels: ["追问是不是真心的", "躲开 / 换话题", "收下，说谢谢", "先觉得开心，随后又觉得配不上"],
  },
  "attachment-style-v3-q14": {
    prompt: "你回晚了，或说错了话。你会…",
    labels: ["过度道歉", "装作什么都没发生", "认一次，然后继续", "既想解释，又想消失"],
  },
  "attachment-style-v3-q15": {
    prompt: "对方圈子里有人看起来「更好」。你会…",
    labels: ["求确认自己仍被选择", "降温；说自己不在乎", "心里闪一下，仍站得住", "表面上没事；稍后自己内耗"],
  },
  "attachment-style-v3-q16": {
    prompt: "深夜：我配得上稳定的爱吗？",
    labels: ["害怕答案是不", "更想靠自己", "大体相信自己配", "有时相信，有时又觉得会搞砸"],
  },
  "attachment-style-v3-q17": {
    prompt: "小时候害怕或难过时，你通常…",
    labels: ["抓紧，求对方别走", "躲起来；说自己没事", "告诉别人，也给自己空间", "在门口冻住"],
  },
  "attachment-style-v3-q18": {
    prompt: "小时候你哭或发脾气时…",
    labels: ["被安抚——仍怕对方嫌烦", "被要求藏起来", "有人听，没有羞辱", "有时被抱住，有时被吼"],
  },
  "attachment-style-v3-q19": {
    prompt: "小时候需要帮助时，你…",
    labels: ["一直叫，直到有人来", "自己硬扛", "能开口时就清楚说出来", "叫了人，又说不用了"],
  },
  "attachment-style-v3-q20": {
    prompt: "上学道别 / 父母离开时，你是…",
    labels: ["很难分开", "很快离开；看起来没事", "会难过，但相信还会回来", "嘴上说走——心里发慌"],
  },
};

export function quizLocaleFromAcceptLanguage(header: string | null | undefined): "zh" | "en" {
  if (!header) return "en";
  const ranked = header.split(",").map((part) => {
    const [tag, ...params] = part.trim().split(";");
    const q = Number(params.find((param) => param.trim().startsWith("q="))?.slice(2) ?? 1);
    return { tag: tag.trim().toLowerCase(), q: Number.isFinite(q) ? q : 1 };
  }).sort((left, right) => right.q - left.q);
  return ranked.some((item) => item.tag === "zh" || item.tag.startsWith("zh-")) ? "zh" : "en";
}

export function localizeRelationshipQuestion(question: QuizQuestion, locale: "zh" | "en"): QuizQuestion {
  if (locale !== "zh") return question;
  const zh = RELATIONSHIP_ZH[question.id];
  const original = relationshipQuestions.find((item) => item.id === question.id);
  if (!zh || !original) return question;
  // Built-in translations apply only to their original source text. Admin edits
  // must remain visible in every locale rather than being masked by stale copy.
  return {
    ...question,
    kicker: RELATIONSHIP_KICKERS_ZH[question.kicker] ?? question.kicker,
    prompt: question.prompt === original.prompt ? zh.prompt : question.prompt,
    options: question.options.map((option, index) => ({
      ...option,
      label: option.label === original.options[index]?.label ? zh.labels[index] ?? option.label : option.label,
      microcopy: option.microcopy === original.options[index]?.microcopy ? zh.labels[index] ?? option.microcopy : option.microcopy,
    })),
  };
}

export function localizeRelationshipQuestions(questions: QuizQuestion[], locale: "zh" | "en"): QuizQuestion[] {
  return questions.map((question) => localizeRelationshipQuestion(question, locale));
}
