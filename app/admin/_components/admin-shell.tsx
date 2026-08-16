"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

const navigation = [
  { href: "/admin", label: "经营概览", icon: "概", exact: true },
  { href: "/admin/tests", label: "测试内容", icon: "测" },
  { href: "/admin/leads", label: "邮箱线索", icon: "邮" },
  { href: "/admin/affiliates", label: "联盟产品", icon: "链" },
] as const;

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

function titleForPath(pathname: string) {
  if (pathname.startsWith("/admin/tests/")) return "编辑测试";
  const match = navigation.find((item) => isActive(pathname, item.href, "exact" in item && item.exact));
  return match?.label ?? "运营后台";
}

export function AdminShell({
  adminUsername,
  children,
  hasAllowlist,
  leadCount,
}: {
  adminUsername: string;
  children: ReactNode;
  hasAllowlist: boolean;
  leadCount?: number;
}) {
  const pathname = usePathname();
  const title = titleForPath(pathname);

  return (
    <main className="admin-shell admin-cn">
      <aside className="admin-sidebar">
        <Link className="admin-logo" href="/">
          <span className="brand-mark">DP</span>
          <span>
            <strong>DeepPersona AI</strong>
            <small>运营管理后台</small>
          </span>
        </Link>
        <nav className="admin-side-nav" aria-label="后台导航">
          <span className="admin-nav-label">工作台</span>
          {navigation.map((item) => (
            <Link
              className={isActive(pathname, item.href, "exact" in item && item.exact) ? "active" : ""}
              href={item.href}
              key={item.href}
            >
              <span className="side-icon">{item.icon}</span>
              {item.label}
              {item.href === "/admin/leads" && leadCount ? <b>{leadCount}</b> : null}
            </Link>
          ))}
        </nav>
        <div className="admin-account">
          <span className="account-avatar">{adminUsername.slice(0, 1).toUpperCase()}</span>
          <span>
            <strong>管理员</strong>
            <small>{adminUsername}</small>
          </span>
          <a href="/api/admin/login" title="退出登录">
            ↗
          </a>
        </div>
      </aside>

      <div className="admin-workspace">
        <header className="admin-topbar">
          <div>
            <small>DeepPersona AI / {title}</small>
            <strong>{title}</strong>
          </div>
          <div className="topbar-actions">
            <span className="live-indicator">
              <i /> 数据按需刷新
            </span>
            <Link className="admin-primary-button" href="/" target="_blank">
              查看网站 ↗
            </Link>
          </div>
        </header>

        <div className="admin-content">
          {!hasAllowlist ? (
            <div className="admin-security-banner">
              <strong>上线前安全提醒</strong>
              <span>当前未配置 ADMIN_EMAILS。公开投放前建议补齐管理员白名单与强密码。</span>
            </div>
          ) : null}
          {children}
        </div>
      </div>
    </main>
  );
}
