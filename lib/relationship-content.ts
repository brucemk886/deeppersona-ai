import type { AttachmentStyle } from "./attachment";
import type { QuizQuestion } from "./quiz";

const FOCUS: Record<AttachmentStyle, string> = {
  anxious: "reassurance",
  avoidant: "space",
  secure: "planning",
  fearful: "reflection",
};

const STYLE_MEANING: Record<AttachmentStyle, string> = {
  anxious: "This first reaction leans anxious-preoccupied: the body moves toward the bond and scans for what went wrong.",
  avoidant: "This first reaction leans dismissing-avoidant: the body protects space, calm, or self-reliance before staying in the feeling.",
  secure: "This first reaction leans secure: you notice the shift, stay in contact, and leave room for a plain next step.",
  fearful: "This first reaction leans fearful-avoidant (disorganized): closeness and an exit arrive in the same breath.",
};

function option(style: AttachmentStyle, text: string) {
  return {
    label: text,
    microcopy: text,
    meaning: `${STYLE_MEANING[style]} The wording you chose — 「${text}」 — is the honest first hit in this moment, not a later polished story.`,
    projection: `The report can quote 「${text}」 because that is the option your body reached for. It is a snapshot of this relationship moment, not a diagnosis or a promise of change.`,
    styleKey: style,
    readingFocus: FOCUS[style],
  };
}

/** V1.2 attachment bank. A anxious, V avoidant, S secure, D fearful-avoidant. */
export const ATTACHMENT_V12_BANK: Array<{ prompt: string; anxious: string; avoidant: string; secure: string; fearful: string }> = [
  {
    prompt: "对方聊天突然冷淡、字数变少，你第一瞬间的感觉是？",
    anxious: "心猛沉一下：我是不是哪句话说错了？",
    avoidant: "挺好，各自清静，我继续忙自己的。",
    secure: "感觉到了，会顺口问一句：“今天很累吗？”",
    fearful: "一边慌得想去哄，一边骂自己“凭什么每次都是我低头”。",
  },
  {
    prompt: "刚吵完架/关系突然变严肃，你下意识想做什么？",
    anxious: "必须当下说清楚，他不理我我就一直打，拖一秒都像要分手。",
    avoidant: "别烦我。只想关机、睡觉或摔门走人，甚至想直接提分手。",
    secure: "双方都在气头上，先说一句“我们各自冷静半小时再聊”。",
    fearful: "摔门走了，又站在楼道里死死盯着手机，等他追出来。",
  },
  {
    prompt: "对方整整大半天不回消息，你的状态通常是？",
    anxious: "隔两分钟看一次手机，完全没心思干正事，整个人被悬在半空。",
    avoidant: "根本没注意时间，甚至觉得不用秒回别人很轻松。",
    secure: "知道他可能在忙，该干嘛干嘛，晚上再联系。",
    fearful: "气到想拉黑他，但手又忍不住一遍遍点进他的主页。",
  },
  {
    prompt: "对方突然特别黏你、说极度深情的话，你的真实反应是？",
    anxious: "狂喜，但又怕这是暂时的，想让他再多保证几遍。",
    avoidant: "浑身不自在，下意识想后退，觉得“太快了、太沉重了”。",
    secure: "很开心，顺其自然地接住，享受当下的甜蜜。",
    fearful: "前一秒很感动，后一秒脑子里冒出一句：“他以后变心了怎么办？”",
  },
  {
    prompt: "对方今天脸色很臭、爱答不理，你心里闪过的第一句话是？",
    anxious: "“他又生我气了？我今天到底哪里惹到他了？”",
    avoidant: "“谁惹你的找谁去，别把脸色甩给我看。”",
    secure: "“他可能在外面遇到烦心事了，问问怎么了。”",
    fearful: "“行，你甩脸色我也甩，看谁耗得过谁。”",
  },
  {
    prompt: "心里觉得很委屈、堵得慌时，你通常怎么处理？",
    anxious: "疯狂倾诉、发小作文，必须逼对方给出让我安心的回答。",
    avoidant: "咽回去，一个字都不想说，觉得“说了也没用，没人能懂”。",
    secure: "组织一下语言，找个合适的时间把委屈直接告诉他。",
    fearful: "嘴上说着“我没事啊”，心里疯狂演戏，等他主动发现并来哄我。",
  },
  {
    prompt: "对方临时放鸽子或迟到很久，你脑子里冒出的第一个念头是？",
    anxious: "他根本不在乎我，我在他眼里毫无分量。",
    avoidant: "无所谓，正好不用社交了，省得麻烦。",
    secure: "有点烦，不过先听听他怎么解释。",
    fearful: "既委屈又窝火：“我这么不值得被重视？行，下次你也别想让我按时来。”",
  },
  {
    prompt: "关系如果进入很长一段时间的平稳期，你心里会？",
    anxious: "开始胡思乱想：没有激情了，他是不是不爱我了？",
    avoidant: "觉得有点透不过气，想找借口自己待几天。",
    secure: "很踏实，终于能把精力分给工作、朋友和生活。",
    fearful: "会忍不住故意找茬作一下，试探他到底还愿不愿意包容我。",
  },
  {
    prompt: "为了缓解心里的不安，你最容易下意识做出哪种防御行为？",
    anxious: "拐弯抹角地试探，非要逼对方亲口说出那句让我安心的承诺。",
    avoidant: "故意慢回甚至不回，用冷落对方来证明“我一个人也很好”。",
    secure: "直接把不安说出来，坦诚沟通我的需求。",
    fearful: "追问了几句突然玩消失，用冷战来反向试探对方在不在乎。",
  },
  {
    prompt: "对方连续给你发“你在哪”“怎么不理我”，你的第一体感是？",
    anxious: "挺有安全感的，至少说明他心里全是我。",
    avoidant: "窒息感扑面而来，觉得自己的私人空间被严重入侵。",
    secure: "理解他在找我，有空就回，太频繁了会跟他讲清楚界限。",
    fearful: "既享受被人在意，又嫌他烦，回消息全凭心情。",
  },
  {
    prompt: "对方说：“我想一个人静静，需要一点私人空间。” 你听完会？",
    anxious: "感觉天塌了：他不要我了，这是分手的信号。",
    avoidant: "太好了，我也正想说这句话。",
    secure: "“好，那你先休息，等你忙完了随时找我。”",
    fearful: "嘴上大度说“好”，转头就开始脑补他是不是在跟别人聊天。",
  },
  {
    prompt: "吵架后的经典模式通常是？",
    anxious: "我追着要说法、要拥抱、要和好，对方越躲我越疯。",
    avoidant: "我直接静音、睡觉，等这件事自己过去。",
    secure: "情绪平复后，两个人坐下来把事情理清楚。",
    fearful: "每次都是我想追又想逃，一会儿道歉一会儿放狠话。",
  },
  {
    prompt: "对方很久才回一条极其敷衍的简短消息，你的内心OS是？",
    anxious: "“如果真的在乎，洗澡上厕所都能回，他就是不爱了。”",
    avoidant: "“行，那我也敷衍你，直接‘哦’就完事。”",
    secure: "“可能真的在忙，回头问问他今天顺不顺利。”",
    fearful: "“他凭什么这么对我？”但看到他回了，又忍不住秒回过去。",
  },
  {
    prompt: "感觉对方明显在后撤、变淡时，你的行动是？",
    anxious: "疯狂加大投入：发更多消息、送东西、更频繁地找他。",
    avoidant: "撤得比他更快，直接断联，绝不给对方甩我的机会。",
    secure: "踩刹车，找个时机开诚布公地聊聊：“我们最近状态好像不太对？”",
    fearful: "纠缠他两三天，突然某天一瞬间死心，直接拉黑删除。",
  },
  {
    prompt: "等对方回复消息的空档里，你下意识在干什么？",
    anxious: "疯狂刷他的 Instagram、Snapchat 或定位，侦探式分析他到底在干嘛、跟谁在一起。",
    avoidant: "直接划掉聊天框，去刷 TikTok、看视频或打游戏，完全不当回事。",
    secure: "确认没回就锁屏放下手机，继续做手头的事。",
    fearful: "一边反复点进聊天记录重读，一边嫌弃自己没出息、不争气。",
  },
  {
    prompt: "当一段感情迅速升温、马上要确定关系时，你内心的声音是？",
    anxious: "“快点定下来，只有名分和承诺能让我安心。”",
    avoidant: "“进展太快了，我还没准备好，好想找借口溜。”",
    secure: "“感觉挺好的，顺其自然地往前走。”",
    fearful: "“我很想跟他在一起，但我这种烂人肯定会搞砸的。”",
  },
  {
    prompt: "约会突然被临时取消，你的情绪反应更接近？",
    anxious: "瞬间跌入谷底，整天都在想“他是不是有更重要的人要见”。",
    avoidant: "毫无波澜，甚至暗自庆幸今天不用出门社交了。",
    secure: "有点失落，但能理解变故，换个时间再约。",
    fearful: "心里难受得要死，打字却回：“没事啊，我本来今天也挺累的。”",
  },
  {
    prompt: "察觉到关系出现裂痕时，你的第一动作是？",
    anxious: "疯狂讨好、认错、委曲求全，只要能挽回怎样都行。",
    avoidant: "开启防御机制，心理上已经做好了随时离开的准备。",
    secure: "直面问题，看看具体卡在哪里，两个人能不能一起解决。",
    fearful: "先卑微求和，一旦对方态度稍有冷淡，立刻恼羞成怒翻旧账。",
  },
  {
    prompt: "情绪彻底失控大吵的时候，你的表现更接近哪种？",
    anxious: "哭得喘不过气，求对方抱抱自己、别离开自己。",
    avoidant: "一言不发，面无表情地看着对方发疯，彻底封闭自己。",
    secure: "声音可能会变大，但始终在就事论事，不会进行人身攻击。",
    fearful: "哪句话最伤人就挑哪句骂，把最恶毒的话砸向最亲近的人。",
  },
  {
    prompt: "看到伴侣情绪崩溃/大哭时，你的第一本能是？",
    anxious: "极度慌张，觉得全是因为自己没做好，拼尽全力去哄。",
    avoidant: "本能地想后退两步，不想被卷进这个负能量黑洞里。",
    secure: "走过去给他递纸巾、抱抱他，安静地陪着他把情绪发泄完。",
    fearful: "既心疼想抱他，又觉得特别烦躁，甚至想跟着一起发火。",
  },
];

export const relationshipQuestions: QuizQuestion[] = ATTACHMENT_V12_BANK.map((item, index) => ({
  id: `attachment-style-v3-q${String(index + 1).padStart(2, "0")}`,
  testId: "attachment-style",
  kicker: "第一反应",
  prompt: item.prompt,
  atlasPath: "",
  position: index + 1,
  active: true,
  options: [
    option("anxious", item.anxious),
    option("avoidant", item.avoidant),
    option("secure", item.secure),
    option("fearful", item.fearful),
  ],
}));
