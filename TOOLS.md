# TOOLS.md - 项目开发规范

## ⚠️ 开发纪律（必须遵守）

### 1. 禁止覆盖已有文件
- **services.js** 是 API 服务汇总文件，新增 API 必须**追加**，不能整文件覆盖
- **router.jsx** 是路由汇总文件，新页面必须**追加路由**，不能覆盖
- **任何共享/聚合型文件**（index.js / services.js / router.jsx 等），修改前先读取完整内容

### 2. 首页锁定
- **首页永远是 Home 组件**（`/` 路径）
- 新页面走自己的路由路径，如 `/long-inflow`、`/tokens`
- **禁止**把 App.jsx 改成直接渲染某个业务页面

### 3. 文件修改流程
修改任何文件前：
1. **先 `read` 读一遍当前内容**
2. 确认要保留的现有内容
3. 用 `edit` 精确修改 或 用 `write` 写入时包含所有原有内容
4. 构建验证

### 4. API 必须严格按官方文档
- **禁止自行编造 API 路径**
- 所有接口必须来自官方文档：https://claw.valuescan.io
- 在 services.js 中添加注释：官方文档链接、请求参数、响应字段

### 5. 已有页面清单
| 页面 | 路由 | 文件 |
|------|------|------|
| Home | `/` | src/pages/Home/index.jsx |
| TokenList | `/tokens` | src/pages/TokenList/index.jsx |
| LongInflow (资金异动看涨) | `/long-inflow` | src/pages/LongInflow/index.jsx |
| MarketAnalysis (大盘分析) | `/market-analysis` | src/pages/MarketAnalysis/index.jsx |

### 6. 导航菜单配置
导航菜单在 `src/components/layout/MainLayout/index.jsx` 的 `menuItems` 数组中配置。

新增页面时：
1. 在 `router.jsx` 添加路由
2. 在 `MainLayout/index.jsx` 的 `menuItems` 添加菜单项（需 import 对应图标）

### 7. 移动端响应式规范（必须遵守）

**断点常量**（所有组件共享，统一用这个）：
```js
const BREAKPOINT_MOBILE = 768
```

**响应式检测（每个页面都要写）**：
```js
const [isMobile, setIsMobile] = useState(false)
useEffect(() => {
  const update = () => setIsMobile(window.innerWidth < BREAKPOINT_MOBILE)
  update()
  window.addEventListener('resize', update)
  return () => window.removeEventListener('resize', update)
}, [])
```

**表格列响应式**：
- 用 `useMemo` 包裹 `columns`
- 移动端隐藏次要列，只保留核心列（币种、最新推送时间、当前币价、涨幅、类型）
- 桌面端横向滚动 `scroll={{ x: 1400 }}`，移动端 `scroll={{ x: 600 }}`
- 列宽在移动端相应缩小

**布局响应式**：
- padding：桌面 `24px`，移动 `12px 8px`
- 字体：桌面 `15px`，移动 `13px`
- 按钮：桌面 `middle`，移动 `small`
- 分页：桌面完整，移动简化 `simple: true`

**Card 内边距**：
- `styles={{ body: { padding: isMobile ? '12px 8px 6px' : '16px 16px 8px' } }}`

**MainLayout 导航栏**：
- 已在组件内处理（桌面横向 / 移动抽屉）
- 新页面无需单独处理导航栏

**后续新增页面**：必须默认支持 PC + 移动，参考 `LongInflow/index.jsx` 的实现模式。

## 已对接 API 清单

| 接口名称 | 路径 | 文档链接 |
|----------|------|----------|
| 代币列表 | `/open/v1/vs-token/list` | [官方文档](https://claw.valuescan.io/zh-CN/接口详情/代币列表.html) |
| 资金异动列表 | `/open/v1/ai/getFundsCoinList` | [官方文档](https://claw.valuescan.io/zh-CN/接口详情/AI%20追踪/资金异动列表.html) |
| 大盘分析 SSE | Cloudflare Worker 代理 | `worker/src/index.js` |

## 环境信息

- 框架：Vite + React + Ant Design v5
- API Base: https://api-beta.valuescan.io/api
- 签名: HMAC-SHA256, headers: X-API-KEY / X-TIMESTAMP / X-SIGN
