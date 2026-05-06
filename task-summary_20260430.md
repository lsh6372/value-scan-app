# ValueScan API 集成

## 目标
基于官方 API 文档实现 HTTP 请求层，包含签名认证机制。

## 关键决策
- Base URL 支持正式/预发布环境切换（通过环境变量）
- 签名算法：HMAC-SHA256，签名内容 = TIMESTAMP + RawBody
- 请求头：X-API-KEY / X-TIMESTAMP / X-SIGN
- 响应结构：{ code, message, data, requestId }

## 输出文件
- src/api/http.js - axios 实例 + 签名拦截器
- src/api/config.js - 环境配置
- src/api/sign.js - 签名工具函数
- .env.example - 环境变量模板

## 结论
API 基础层实现完成，等待后续业务接口对接。
