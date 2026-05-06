# ValueScan 项目初始化

## 目标
为 ValueScan 创建 React + Vite + Ant Design 项目框架，包含 HTTP API 层和 SSE 订阅机制。

## 关键决策
- 使用 Vite 作为构建工具（快速启动、HMR）
- Ant Design 按需引入（减少打包体积）
- 区分 HTTP REST 和 SSE 两种后端交互模式
- SSE 封装为独立 Hook（useSubscription）

## 输出文件
- package.json / vite.config.js / index.html
- src/api/{http,services,sse,index}.js
- src/hooks/{useSubscription,useAsyncFetch}.js
- src/utils/{request,errorHandler,index}.js
- src/components/common/* / src/pages/*
- src/main.jsx / src/App.jsx / src/index.css

## 结论
框架搭建完成，等待用户提供 API 文档后实现业务页面。
