# Cloudflare Workers 部署

前端静态页和 JSON API 共用同一个 Cloudflare Worker（`*.workers.dev`）。

## 一次性准备

```bash
# 1. 安装并登录 wrangler
npm install -g wrangler
wrangler login

# 2. 创建 D1 数据库，把输出里的 database_id 填进 wrangler.toml
wrangler d1 create yiling

# 3. 初始化 users / auth_tokens 表
wrangler d1 execute yiling --file=schema.sql

# 4. 配置 DeepSeek 密钥（不要写进仓库）
wrangler secret put DEEPSEEK_API_KEY
```

`DEEPSEEK_BASE_URL` 和 `DEEPSEEK_MODEL` 已在 `wrangler.toml` 的 `[vars]` 里给出默认值，需要时可直接改。

## 部署

```bash
wrangler deploy
```

部署后访问：

- 前端 / API：`https://yi-ling.<你的 workers.dev 子域>.workers.dev`
- 健康检查：`/health`
- 接口：`/translate`、`/lookup`、`/chat`、`/auth/register`、`/auth/login`、`/auth/me`

## 本地开发

```bash
npx wrangler dev
```

本地启动会把密钥写进 `.dev.vars`（该文件已被 `.gitignore` 忽略）：

```bash
echo "DEEPSEEK_API_KEY=..." > .dev.vars
```
