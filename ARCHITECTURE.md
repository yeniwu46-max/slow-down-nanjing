# 宁可慢一点 · 架构说明

> 版本 1.1 · 2026
> 详细模块、API 与部署见 [docs/TECHNICAL.md](./docs/TECHNICAL.md)

本文描述竞赛演示版的运行时结构。编码以 UTF-8 为准。

## 1. 双应用

主站 Next.js（:3005 / Vercel）与 AR Vite 子应用（:3006）分进程。主站不打包 AR。

跨应用约定：`NEXT_PUBLIC_AR_BASE_URL` 跳转扫描页；`returnUrl` 回徽章页；打卡写 `localStorage`。

## 2. 主站分层

- `src/app/` 页面与 API
- `src/components/` 地图、路线流、游戏壳、智能体
- `src/game/` Phaser 场景与存档
- `src/lib/` 地图、推荐、星火、天气、AR 链接
- `public/` POI 图与底图样式

## 3. 构建与发布

开发：`npm run dev`（webpack，端口 3005）
生产：`next build --webpack` → Vercel

GitHub：https://github.com/yeniwu46-max/slow-down-nanjing