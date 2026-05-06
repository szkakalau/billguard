# BillGuard MVP

防止 OpenAI API 账单爆炸的智能熔断器（MVP）：定时采集组织总用量、预算阈值提醒（Email/Slack）、超过预算自动将 Key 标记为 `capped` 并在受保护 API 中拒绝继续使用。

## 本地开发

1) 安装依赖

```bash
npm install
```

2) 配置环境变量

复制 `.env.example` 为 `.env`，至少填好：
- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`
- `GITHUB_ID` / `GITHUB_SECRET`
- `ENCRYPTION_KEY`（**32 bytes base64**）
- `CRON_SECRET`

3) 启动数据库（任选其一）

- **推荐（最快）**：使用 Prisma 本地 Postgres

```bash
npx prisma dev
```

然后再（同步 schema）：

```bash
npx prisma db push --accept-data-loss
```

- 或者：使用你自己的 Postgres，直接把 `DATABASE_URL` 指过去，再跑上面的 `db push`。

4) 启动 Web

```bash
npm run dev
```

## 生产部署（Vercel + Render）

### Vercel（Next.js）

在 Vercel 项目里设置环境变量：
- **数据库**：`DATABASE_URL`（Render PostgreSQL 的连接串）
- **NextAuth**：`NEXTAUTH_URL`（你的 Vercel 域名）、`NEXTAUTH_SECRET`
- **GitHub OAuth**：`GITHUB_ID`、`GITHUB_SECRET`
- **加密**：`ENCRYPTION_KEY`（32 bytes base64，所有环境保持一致，否则历史 Key 无法解密）
- **Cron**：`CRON_SECRET`（Render 调用 `/api/cron/fetch` 的鉴权）
- **通知（可选）**：`RESEND_API_KEY`、`RESEND_FROM`

### Render PostgreSQL

创建 PostgreSQL 实例，拿到连接串后填到 Vercel 的 `DATABASE_URL`。

### Render Cron Job（每 30 分钟）

创建 Cron Job，请求 Vercel：
- URL：`POST https://<your-vercel-domain>/api/cron/fetch`
- Header：`Authorization: Bearer <CRON_SECRET>`
- 频率：`*/30 * * * *`

## 关键接口

- `POST /api/cron/fetch`：Render Cron 入口（批量扫描所有活跃 Key，写入 `UsageRecord`，并触发阈值通知/熔断）
- `GET/POST /api/keys`：Key 列表与新增（新增时加密存储，并做一次轻量 test call）
- `POST /api/usage/refresh`：用户手动刷新某个 Key 的用量
- `GET /api/export.csv?days=30&apiKeyId=<optional>`：导出 CSV

## 安全注意

- **不要在日志里打印 Authorization**，不要打印明文 key。
- `ENCRYPTION_KEY` 必须妥善保管，丢失即无法解密历史 Key。
