# 线上正在运行的构建快照（不要当源码合并进 main）

这不是 TypeScript 源码。这是 2026-09-09 回退到的生产 Worker 前端资源，用来证明 **GitHub `main` 和线上不一致**。

- Cloudflare Version ID: `ba458007-5ce8-45f7-a3b5-f48d09ae4e4c`
- 创建时间: 2026-09-09T06:18:08Z
- 站点: https://deeppersonaai.com

## 线上有、这个仓库 `main` 没有的后台能力

- 侧栏是「订单」，不是「支付设置」
- `GET /api/admin/payments`（需管理员登录）返回最近订单
- `POST /api/stripe/webhook`
- `POST /api/checkout`
- `/api/reports/...`

订单页标题为「订单管理 / 订单」，表格列：邮箱、测试、金额、环境、状态、报告邮件、创建时间。数据来自 `/api/admin/payments`。

## 为什么不能直接还原成完整仓库

06:18 那次 `wrangler deploy` 的源码没有推到 `brucemk886/deeppersona-ai`。Cloudflare 只保留编译后的 Worker 和静态资源。这里保存的是线上 JS/CSS，方便对照，**不能替代原来的 app/ 源码**。

完整源码需要从当时部署的那台电脑 / 那个工作区再推到 GitHub。
