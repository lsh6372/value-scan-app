# Cloudflare Worker 部署指南

## 前置条件

- Node.js 已安装
- Cloudflare 账号（免费即可）
- 已安装 Wrangler CLI

---

## 步骤一：安装 Wrangler CLI

```bash
npm install -g wrangler
```

---

## 步骤二：登录 Cloudflare

```bash
cd C:\Users\jinfe\Desktop\ValueScan\worker
wrangler login
```

这会打开浏览器，登录你的 Cloudflare 账号并授权。

---

## 步骤三：配置 AK/SK 和 Telegram（敏感信息）

使用 Wrangler 的 secret 功能存储密钥：

```bash
# ValueScan API Key
wrangler secret put VALUESCAN_API_KEY
# 然后粘贴你的 API Key

# ValueScan Secret Key
wrangler secret put VALUESCAN_SECRET_KEY
# 然后粘贴你的 Secret Key

# Telegram Bot Token（可选，用于信号推送）
wrangler secret put TELEGRAM_BOT_TOKEN
# 然后粘贴你的 Telegram Bot Token

# Telegram Chat ID（可选，用于信号推送）
wrangler secret put TELEGRAM_CHAT_ID
# 然后粘贴你的 Chat ID
```

> **Telegram 配置说明**：
> - Bot Token：从 @BotFather 获取（格式：`123456789:ABCdef...`）
> - Chat ID：你的 Telegram 用户 ID 或群组 ID（向 @userinfobot 获取）
> - 如果不填，页面中的 Telegram 推送功能将不可用

---

## 步骤四：部署 Worker

```bash
cd C:\Users\jinfe\Desktop\ValueScan\worker
npm install
npm run deploy
```

部署成功后会显示 Worker URL，类似：

```
https://valuescan-sse-proxy.<你的子域>.workers.dev
```

---

## 步骤五：配置前端环境变量

编辑 `C:\Users\jinfe\Desktop\ValueScan\.env.local`：

```env
# HTTP API 配置
VITE_API_KEY=ak_5abf4b0182c14770bcf4a86fef67cbdb
VITE_SECRET_KEY=sk_b3e9ce9dd2924127ad532b247ff035d0

# SSE Worker 地址（替换为你的 Worker URL）
VITE_SSE_WORKER_URL=https://valuescan-sse-proxy.<你的子域>.workers.dev
```

---

## 步骤六：重新部署 Vercel

```bash
cd C:\Users\jinfe\Desktop\ValueScan
npm run build
# 然后 push 到 Git，Vercel 会自动部署
# 或在 Vercel 控制台手动触发部署
```

---

## 验证

1. 访问你的 Vercel 网站
2. 进入"大盘分析"页面
3. 点击"启动订阅"
4. 应该能看到 BTC/ETH 信号卡片和实时消息日志

---

## 常见问题

### Q: Worker 部署失败？
检查 wrangler.toml 中的 name 是否冲突，可以改成唯一的名称。

### Q: 连接失败？
- 检查 .env.local 中的 VITE_SSE_WORKER_URL 是否正确
- 检查 Worker 的 secrets 是否设置成功（`wrangler secret list`）
- 查看浏览器控制台错误信息

### Q: 如何查看 Worker 日志？
```bash
wrangler tail
```
这会实时显示 Worker 的请求日志。

---

## 安全说明

- AK/SK 存储在 Cloudflare Worker 的加密环境变量中
- 前端代码中不包含任何密钥
- Worker 添加了 CORS 头，允许任何域名访问
- 如需限制访问来源，修改 `corsHeaders()` 函数中的 `Access-Control-Allow-Origin`

---

## 文件结构

```
ValueScan/
├── worker/                    # Cloudflare Worker（SSE 代理 + Telegram 推送）
│   ├── src/
│   │   └── index.js          # Worker 代码
│   ├── wrangler.toml         # Worker 配置
│   └── package.json
├── src/
│   ├── api/
│   │   ├── sse-sign.js       # 前端 SSE 工具
│   │   └── telegram.js       # Telegram 推送服务
│   └── pages/
│       └── MarketAnalysis/   # 大盘分析页面（含 Telegram 推送）
└── .env.local                # 环境变量（需配置 VITE_SSE_WORKER_URL）
```

## Telegram 推送功能

页面新增「Telegram 推送」功能：

1. 在大盘分析页面打开开关
2. 填写 Bot Token 和 Chat ID（首次需要，配置保存在浏览器本地）
3. 点击「测试」验证连通性
4. 当 BTC 或 ETH 信号发生变化时，自动推送通知到你的 Telegram

> **注意**：必须先在 Worker 中配置好 `TELEGRAM_BOT_TOKEN` 和 `TELEGRAM_CHAT_ID`（见步骤三），否则测试和推送会失败。
