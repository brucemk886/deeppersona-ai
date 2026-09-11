import type { BlogPost } from "@/lib/blog";
import type { QuizTest } from "@/lib/quiz";

export type AdminBlogPost = BlogPost & { key: string };

export function BlogManager({
  addPost,
  deletingId,
  posts,
  removePost,
  savePost,
  savingId,
  tests,
  updatePost,
}: {
  addPost: () => void;
  deletingId: string;
  posts: AdminBlogPost[];
  removePost: (post: AdminBlogPost) => Promise<void>;
  savePost: (post: AdminBlogPost) => Promise<void>;
  savingId: string;
  tests: QuizTest[];
  updatePost: (key: string, next: Partial<BlogPost>) => void;
}) {
  return (
    <>
      <div className="admin-page-heading question-heading-admin">
        <div>
          <span className="admin-kicker">内容产品</span>
          <h1>博客管理</h1>
          <p>新增、修改或删除英文博客。保存后刷新前台即可查看；草稿不展示。删除后无法恢复。</p>
        </div>
        <button className="admin-primary-button" onClick={addPost} type="button">＋ 新增文章</button>
      </div>
      <div className="question-summary-strip">
        <span><strong>{posts.length}</strong>全部文章</span>
        <span><strong>{posts.filter((item) => item.active).length}</strong>已上线</span>
        <span><strong>{posts.filter((item) => !item.active).length}</strong>草稿</span>
        <small>前台英文展示。正文可用 Markdown，在需要插入测验按钮的位置写 <code>&lt;!-- CTA --&gt;</code>。</small>
      </div>
      <div className="blog-editor-list">
        {posts.map((post) => (
          <article className="question-editor-cn blog-editor-card" id={`blog-${post.key}`} key={post.key}>
            <header>
              <div className="question-index">{post.active ? "上" : "草"}</div>
              <div>
                <strong>{post.title || "未命名文章"}</strong>
                <small>/blog/{post.slug}</small>
              </div>
              <label className="status-switch">
                <input checked={post.active} onChange={(event) => updatePost(post.key, { active: event.target.checked })} type="checkbox" />
                <i />
                <span>{post.active ? "已上线" : "草稿"}</span>
              </label>
            </header>
            <div className="blog-editor-fields">
              <label>英文标题<input value={post.title} onChange={(event) => updatePost(post.key, { title: event.target.value })} /></label>
              <div className="field-row two">
                <label>URL 别名<input value={post.slug} onChange={(event) => updatePost(post.key, { slug: event.target.value })} /></label>
                <label>关联测试
                  <select value={post.primaryTestId} onChange={(event) => updatePost(post.key, { primaryTestId: event.target.value })}>
                    {tests.map((test) => (
                      <option key={test.id} value={test.id}>{test.title}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label>英文摘要<textarea rows={3} value={post.excerpt} onChange={(event) => updatePost(post.key, { excerpt: event.target.value })} /></label>
              <div className="field-row three">
                <label>发布日期<input type="date" value={post.publishedAt} onChange={(event) => updatePost(post.key, { publishedAt: event.target.value })} /></label>
                <label>更新日期<input type="date" value={post.updatedAt} onChange={(event) => updatePost(post.key, { updatedAt: event.target.value })} /></label>
                <label>阅读时长（分钟）<input min="1" max="60" type="number" value={post.readMinutes} onChange={(event) => updatePost(post.key, { readMinutes: Number(event.target.value) })} /></label>
              </div>
              <label>正文（Markdown）<textarea className="blog-body-input" rows={14} value={post.body} onChange={(event) => updatePost(post.key, { body: event.target.value })} /></label>
            </div>
            <footer>
              <button className="admin-ghost-button admin-delete-button" disabled={Boolean(deletingId || savingId)} onClick={() => void removePost(post)} type="button">
                {deletingId === post.key ? "删除中…" : "删除文章"}
              </button>
              <div>
                <a className="admin-ghost-button" href={`/blog/${post.slug}`} rel="noreferrer" target="_blank">预览</a>
                <button className="admin-primary-button" disabled={Boolean(deletingId) || savingId === post.key} onClick={() => void savePost(post)} type="button">
                  {savingId === post.key ? "保存中…" : "保存文章"}
                </button>
              </div>
            </footer>
          </article>
        ))}
      </div>
      {!posts.length ? <div className="admin-empty-state"><strong>还没有博客文章</strong><p>新增一篇后保存。草稿不会出现在前台；删除后无法恢复。</p></div> : null}
    </>
  );
}
