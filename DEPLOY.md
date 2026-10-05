# 译灵翻译云服务器部署

部署目标：前端静态页面 + FastAPI API 走同一个域名，PostgreSQL 保存聚合词库，Redis 留作缓存。

## 1. 准备服务器

- 一台 Linux 云服务器（Ubuntu / Debian 均可）
- 安装 Docker 与 Docker Compose
- 把本目录上传到服务器，例如 `/opt/yiling`

## 2. 配置环境变量

```bash
cd /opt/yiling/backend
cp .env.example .env
```

编辑 `.env`，至少设置：

```bash
DEEPSEEK_API_KEY=你的密钥
DATABASE_URL=postgresql+psycopg://app:app@postgres:5432/yiling
REDIS_URL=redis://redis:6379/0
```

## 3. 启动服务

```bash
cd /opt/yiling/backend
docker compose up -d --build
```

启动后：

- 前端：`http://服务器IP/`
- API 文档：`http://服务器IP/docs`
- 健康检查：`http://服务器IP/health`

Nginx 会把 `/lookup`、`/translate`、`/health` 转发给 FastAPI，其余请求走静态页面。

## 4. 导入词典

```bash
cd /opt/yiling/backend

# 全量中文核心词库
python -m scripts.import_all --cedict /data/cedict_ts.u8

# WordNet
python -m scripts.import_all --wordnet

# Kaikki，可按需要限流控制磁盘占用
python -m scripts.import_all --kaikki /data/kaikki.org-dictionary-English.jsonl --limit 200000
```

如果只在服务器容器内运行导入，也可以先在本机装好依赖再导入 SQLite，或直接连 PostgreSQL 执行：

```bash
DATABASE_URL=postgresql+psycopg://app:app@127.0.0.1:5432/yiling \
python -m scripts.import_all --cedict /data/cedict_ts.u8
```

## 5. HTTPS

生产环境建议用 Caddy、Nginx + Certbot，或云厂商负载均衡签发 TLS 证书；`/backend` 静态目录已在 Nginx 中禁止访问。
