import type { ReactNode } from "react";
import type { AiInsightReport } from "@/lib/ai-reading-parse";

function Block({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="ap-section ai-insight">
      <span className="ai-insight-kicker">{eyebrow}</span>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export function AiInsightPortrait({ paradox, selfSabotage }: { paradox: string; selfSabotage: string }) {
  return (
    <Block eyebrow="模块一" title="底层自相矛盾画像">
      <p className="ap-essay">{paradox}</p>
      <p className="ap-essay">{selfSabotage}</p>
    </Block>
  );
}

export function AiInsightReport({ reading }: { reading: AiInsightReport }) {
  return (
    <div className="ai-insight-report">
      <AiInsightPortrait paradox={reading.contradiction.paradox} selfSabotage={reading.contradiction.selfSabotage} />
      <Block eyebrow="模块二" title="三大高频暴击分镜拆解">
        <article className="ai-insight-scene">
          <h3>关系升温 / 对方靠近时</h3>
          <p><strong>潜意识警报</strong>{reading.scenes.closeness.alarm}</p>
          <p><strong>下意识破坏动作</strong>{reading.scenes.closeness.action}</p>
        </article>
        <article className="ai-insight-scene">
          <h3>对方冷淡 / 暂缓回复时</h3>
          <p><strong>脑内灾难化弹幕</strong>{reading.scenes.silence.alarm}</p>
          <p><strong>防御性报复行为</strong>{reading.scenes.silence.action}</p>
        </article>
        <article className="ai-insight-scene">
          <h3>冲突爆发时</h3>
          <p><strong>身体生理应激反应</strong>{reading.scenes.conflict.alarm}</p>
          <p><strong>极端应对方式</strong>{reading.scenes.conflict.action}</p>
        </article>
      </Block>
      <Block eyebrow="模块三" title="防御机制心理破译">
        <p className="ap-essay"><strong>真实恐惧　</strong>{reading.defense.fear}</p>
        <p className="ap-essay"><strong>自欺借口　</strong>{reading.defense.excuse}</p>
      </Block>
      <Block eyebrow="模块四" title="自救破局实操工具箱">
        <article className="ai-insight-scene">
          <h3>急救刹车机制</h3>
          <ol>
            {reading.toolkit.brake.map((step) => <li key={step}>{step}</li>)}
          </ol>
        </article>
        <article className="ai-insight-scene">
          <h3>免死金牌沟通话术</h3>
          {reading.toolkit.scripts.map((line) => <blockquote key={line}>{line}</blockquote>)}
        </article>
      </Block>
    </div>
  );
}
