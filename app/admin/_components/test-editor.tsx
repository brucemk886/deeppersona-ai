"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { fetchAdminJson, sendAdminJson } from "@/app/admin/_lib/api";
import { PageHeading, Toast, useNotice } from "@/app/admin/_components/ui";
import { ATLAS_PATHS, RESULT_NAMES } from "@/lib/admin/labels";
import { TRAIT_KEYS, type AffiliateProduct, type QuizQuestion, type QuizTest, type TraitKey } from "@/lib/quiz";

const blankOptions = [
  { label: "选项 A", microcopy: "补充说明", meaning: "填写这个选项代表什么", projection: "填写用户选择后的心理投射解读", scoreKey: "explorer" as TraitKey },
  { label: "选项 B", microcopy: "补充说明", meaning: "填写这个选项代表什么", projection: "填写用户选择后的心理投射解读", scoreKey: "connector" as TraitKey },
  { label: "选项 C", microcopy: "补充说明", meaning: "填写这个选项代表什么", projection: "填写用户选择后的心理投射解读", scoreKey: "architect" as TraitKey },
  { label: "选项 D", microcopy: "补充说明", meaning: "填写这个选项代表什么", projection: "填写用户选择后的心理投射解读", scoreKey: "creator" as TraitKey },
];

export function TestEditorPanel({ testId }: { testId: string }) {
  const { notice, showNotice } = useNotice();
  const [test, setTest] = useState<QuizTest | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [products, setProducts] = useState<AffiliateProduct[]>([]);
  const [savingId, setSavingId] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [testsResult, questionsResult, productsResult] = await Promise.all([
        fetchAdminJson<{ tests: QuizTest[] }>("/api/admin/tests"),
        fetchAdminJson<{ questions: QuizQuestion[] }>(`/api/admin/questions?test=${encodeURIComponent(testId)}`),
        fetchAdminJson<{ products: AffiliateProduct[] }>("/api/admin/affiliates"),
      ]);
      const nextTest = (testsResult.tests ?? []).find((item) => item.id === testId) ?? null;
      setTest(nextTest);
      setQuestions(questionsResult.questions ?? []);
      setProducts(productsResult.products ?? []);
      if (!nextTest) showNotice("未找到该测试");
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "测试读取失败");
    } finally {
      setLoading(false);
    }
  }, [showNotice, testId]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  function updateTest(next: Partial<QuizTest>) {
    setTest((current) => (current ? { ...current, ...next } : current));
  }

  function updateQuestion(id: string, next: Partial<QuizQuestion>) {
    setQuestions((current) => current.map((question) => (question.id === id ? { ...question, ...next } : question)));
  }

  function updateOption(
    questionId: string,
    index: number,
    next: { label?: string; meaning?: string; microcopy?: string; projection?: string; scoreKey?: TraitKey },
  ) {
    setQuestions((current) =>
      current.map((question) =>
        question.id === questionId
          ? {
              ...question,
              options: question.options.map((option, optionIndex) =>
                optionIndex === index ? { ...option, ...next } : option,
              ),
            }
          : question,
      ),
    );
  }

  function addQuestion() {
    if (!test) return;
    const id = `question-${Date.now()}`;
    const position = Math.max(0, ...questions.map((question) => question.position)) + 1;
    const question: QuizQuestion = {
      id,
      testId: test.id,
      kicker: "凭第一感觉选择",
      prompt: "在这里填写新题目",
      atlasPath: "/quiz/landscapes.png",
      position,
      active: false,
      options: blankOptions.map((option) => ({ ...option })),
    };
    setQuestions((current) => [...current, question]);
    showNotice("已创建草稿，请填写后保存");
    window.setTimeout(() => document.getElementById(`editor-${id}`)?.scrollIntoView({ behavior: "smooth" }), 80);
  }

  async function saveTest() {
    if (!test) return;
    setSavingId(test.id);
    try {
      await sendAdminJson("/api/admin/tests", "PUT", test);
      showNotice(test.active ? "测试已保存并上线" : "测试草稿已保存");
      await load();
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSavingId("");
    }
  }

  async function saveQuestion(question: QuizQuestion) {
    setSavingId(question.id);
    try {
      await sendAdminJson("/api/admin/questions", "PUT", question);
      showNotice(question.active ? "题目已保存并上线" : "题目草稿已保存");
      await load();
    } catch (error) {
      showNotice(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSavingId("");
    }
  }

  async function removeQuestion(question: QuizQuestion) {
    if (!window.confirm(`确定删除“${question.prompt}”吗？此操作不可撤销。`)) return;
    try {
      await sendAdminJson(`/api/admin/questions?id=${encodeURIComponent(question.id)}`, "DELETE");
      setQuestions((current) => current.filter((item) => item.id !== question.id));
      showNotice("题目已删除");
    } catch {
      showNotice("删除失败");
    }
  }

  if (loading) {
    return (
      <>
        <Toast message={notice} />
        <PageHeading kicker="内容产品" title="正在加载测试…" />
      </>
    );
  }

  if (!test) {
    return (
      <>
        <Toast message={notice} />
        <PageHeading
          action={
            <Link className="admin-ghost-button" href="/admin/tests">
              返回列表
            </Link>
          }
          kicker="内容产品"
          title="测试不存在"
        />
      </>
    );
  }

  return (
    <>
      <Toast message={notice} />
      <PageHeading
        action={
          <Link className="admin-ghost-button" href="/admin/tests">
            ← 返回列表
          </Link>
        }
        description="一个“测试”对应前台的一张测试卡和完整测试入口；这里同时管理基础信息、结果联盟推荐与内部题目。"
        kicker="内容产品"
        title={test.title}
      />

      <section className="admin-card" style={{ marginBottom: 18 }}>
        <div className="test-editor-fields" style={{ padding: 0 }}>
          <div className="test-editor-status">
            <small>ID: {test.id}</small>
            <label className="status-switch">
              <input checked={test.active} onChange={(event) => updateTest({ active: event.target.checked })} type="checkbox" />
              <i />
              <span>{test.active ? "已上线" : "草稿"}</span>
            </label>
          </div>
          <label>
            英文标题
            <input value={test.title} onChange={(event) => updateTest({ title: event.target.value })} />
          </label>
          <label>
            英文分类标签
            <input value={test.kicker} onChange={(event) => updateTest({ kicker: event.target.value })} />
          </label>
          <label>
            英文简介
            <textarea rows={3} value={test.description} onChange={(event) => updateTest({ description: event.target.value })} />
          </label>
          <div className="field-row two">
            <label>
              封面拼图地址
              <input list="atlas-paths" value={test.coverAtlasPath} onChange={(event) => updateTest({ coverAtlasPath: event.target.value })} />
            </label>
            <label>
              排序
              <input min="1" type="number" value={test.position} onChange={(event) => updateTest({ position: Number(event.target.value) })} />
            </label>
          </div>
          <label>
            完整解析价格（USD，填 0 为免费且前台不展示价格）
            <input
              min="0"
              step="0.01"
              type="number"
              value={(test.reportPriceCents / 100).toFixed(2)}
              onChange={(event) => updateTest({ reportPriceCents: Math.max(0, Math.round(Number(event.target.value || 0) * 100)) })}
            />
          </label>
          <details className="affiliate-config" open>
            <summary>按结果选择联盟产品（可选）</summary>
            <p>先在「联盟产品」建立产品库，再为每种结果选择一个产品。不选择则前台不展示。</p>
            <div className="affiliate-result-grid">
              {TRAIT_KEYS.map((key) => {
                const selectedId = test.results[key].affiliateProductId ?? "";
                const exists = !selectedId || products.some((product) => product.id === selectedId);
                return (
                  <fieldset key={key}>
                    <legend>
                      {test.results[key].title}（{RESULT_NAMES[key]}）
                    </legend>
                    <label>
                      关联产品
                      <select
                        value={selectedId}
                        onChange={(event) =>
                          updateTest({
                            results: {
                              ...test.results,
                              [key]: {
                                ...test.results[key],
                                affiliateProductId: event.target.value || undefined,
                              },
                            },
                          })
                        }
                      >
                        <option value="">不展示联盟推荐</option>
                        {!exists ? <option value={selectedId}>已删除产品（请重新选择）</option> : null}
                        {products.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.active ? "" : "已下架 · "}
                            {product.name || "未命名产品"}
                          </option>
                        ))}
                      </select>
                    </label>
                  </fieldset>
                );
              })}
            </div>
          </details>
          <label className="featured-checkbox">
            <input checked={test.featured} onChange={(event) => updateTest({ featured: event.target.checked })} type="checkbox" />
            设为首页主推测试
          </label>
          <button className="admin-primary-button" disabled={savingId === test.id} onClick={() => void saveTest()}>
            {savingId === test.id ? "保存中…" : "保存测试信息"}
          </button>
        </div>
      </section>

      <div className="admin-page-heading question-heading-admin">
        <div>
          <span className="admin-kicker">题目管理</span>
          <h1>本测试题目</h1>
          <p>管理所选测试内部的每一道图片题、A/B/C/D 选项、选择含义和投射解读。保存后用户端立即生效。</p>
        </div>
        <button className="admin-primary-button" onClick={addQuestion}>
          ＋ 新增题目
        </button>
      </div>

      <div className="question-summary-strip">
        <span>
          <strong>{questions.length}</strong>全部题目
        </span>
        <span>
          <strong>{questions.filter((item) => item.active).length}</strong>已上线
        </span>
        <span>
          <strong>{questions.filter((item) => !item.active).length}</strong>草稿
        </span>
        <small>图片使用一张 2×2 拼图，A/B/C/D 对应四个象限。</small>
      </div>

      <datalist id="atlas-paths">
        {ATLAS_PATHS.map((path) => (
          <option key={path} value={path} />
        ))}
      </datalist>

      <div className="question-editor-list">
        {questions.map((question, questionIndex) => (
          <article className="question-editor-cn" id={`editor-${question.id}`} key={question.id}>
            <header>
              <div className="question-index">{String(questionIndex + 1).padStart(2, "0")}</div>
              <div>
                <strong>{question.prompt || "未命名题目"}</strong>
                <small>ID: {question.id}</small>
              </div>
              <label className="status-switch">
                <input checked={question.active} onChange={(event) => updateQuestion(question.id, { active: event.target.checked })} type="checkbox" />
                <i />
                <span>{question.active ? "已上线" : "草稿"}</span>
              </label>
            </header>
            <div className="question-editor-body">
              <aside>
                <div className="question-atlas-preview">
                  {[0, 1, 2, 3].map((index) => (
                    <span className={`atlas-image atlas-${index}`} key={index} style={{ backgroundImage: `url(${question.atlasPath})` }} />
                  ))}
                </div>
                <label>
                  排序
                  <input min="1" type="number" value={question.position} onChange={(event) => updateQuestion(question.id, { position: Number(event.target.value) })} />
                </label>
              </aside>
              <div className="question-form-fields">
                <div className="field-row two">
                  <label>
                    题目前导语
                    <input value={question.kicker} onChange={(event) => updateQuestion(question.id, { kicker: event.target.value })} />
                  </label>
                  <label>
                    图片拼图地址
                    <input list="atlas-paths" value={question.atlasPath} onChange={(event) => updateQuestion(question.id, { atlasPath: event.target.value })} />
                  </label>
                </div>
                <label>
                  题目正文
                  <textarea rows={2} value={question.prompt} onChange={(event) => updateQuestion(question.id, { prompt: event.target.value })} />
                </label>
                <div className="option-editor-grid-cn">
                  {question.options.map((option, optionIndex) => (
                    <section key={optionIndex}>
                      <span>{String.fromCharCode(65 + optionIndex)}</span>
                      <label>
                        选项标题
                        <input value={option.label} onChange={(event) => updateOption(question.id, optionIndex, { label: event.target.value })} />
                      </label>
                      <label>
                        补充说明
                        <input value={option.microcopy} onChange={(event) => updateOption(question.id, optionIndex, { microcopy: event.target.value })} />
                      </label>
                      <label>
                        选择含义
                        <textarea rows={3} value={option.meaning} onChange={(event) => updateOption(question.id, optionIndex, { meaning: event.target.value })} />
                      </label>
                      <label>
                        投射解读
                        <textarea rows={4} value={option.projection} onChange={(event) => updateOption(question.id, optionIndex, { projection: event.target.value })} />
                      </label>
                      <label>
                        计分类型
                        <select value={option.scoreKey} onChange={(event) => updateOption(question.id, optionIndex, { scoreKey: event.target.value as TraitKey })}>
                          <option value="explorer">探索者</option>
                          <option value="connector">连接者</option>
                          <option value="architect">架构者</option>
                          <option value="creator">创造者</option>
                        </select>
                      </label>
                    </section>
                  ))}
                </div>
              </div>
            </div>
            <footer>
              <button className="danger-text-button" onClick={() => void removeQuestion(question)}>
                删除题目
              </button>
              <div>
                <button className="admin-ghost-button" onClick={() => updateQuestion(question.id, { active: !question.active })}>
                  {question.active ? "转为草稿" : "设为上线"}
                </button>
                <button className="admin-primary-button" disabled={savingId === question.id} onClick={() => void saveQuestion(question)}>
                  {savingId === question.id ? "保存中…" : "保存题目"}
                </button>
              </div>
            </footer>
          </article>
        ))}
      </div>
    </>
  );
}
