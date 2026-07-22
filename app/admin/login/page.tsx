import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string; return_to?: string }> }) {
  const params = await searchParams;
  const returnTo = params.return_to?.startsWith("/") && !params.return_to.startsWith("//") ? params.return_to : "/admin";
  return <main className="admin-login-shell"><section className="admin-login-card"><Link href="/" className="admin-login-brand"><span>DP</span><strong>DeepPersona AI</strong></Link><p className="admin-kicker">管理后台</p><h1>管理员登录</h1><p>请输入站内管理员账号和密码。</p>{params.error ? <div className="admin-login-error">账号或密码不正确，请重试。</div> : null}<form action={`/api/admin/login?return_to=${encodeURIComponent(returnTo)}`} method="post"><label>账号<input autoComplete="username" autoFocus name="username" required /></label><label>密码<input autoComplete="current-password" name="password" required type="password" /></label><button className="admin-primary-button" type="submit">登录后台 →</button></form><Link href="/">返回网站首页</Link></section></main>;
}
