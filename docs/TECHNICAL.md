# 宁可慢一点 · 技术文档

> 版本 1.0 · 2026  
> 产品：金陵慢旅行 H5「宁可慢一点」竞赛演示版  
> 配套：[生产演示版技术更新（2026-09-29）](./PRODUCTION_TECHNICAL_UPDATE_2026-09-29.md) · [比赛版技术更新（2026-09-25）](./COMPETITION_TECHNICAL_UPDATE_2026-09-25.md) · [BGE 与路由技术栈](./BGE_AND_ROUTING_STACK.md) · [算法对照实验与复现](./ROUTE_PLANNING_EXPERIMENTS.md) · [ARCHITECTURE.md](../ARCHITECTURE.md) · [README.md](../README.md)

> **当前比赛版说明：** 2026-09-25 起，比赛主流程已收敛为“智能路线规划、经典路线、项目原理与数据说明”三个一级入口。本文件后续章节仍保留完整产品和历史模块说明；当前比赛版的数据模型、动态重算、解释输出、弱网策略与实测结果以[比赛版技术更新](./COMPETITION_TECHNICAL_UPDATE_2026-09-25.md)为准。

本文沉淀当前可运行代码的模块边界、数据流与部署约定，方便后续接手与扩容。

---

## 1. 仓库结构

```
源码/
├── src/                 # Next.js 主站（App Router）
│   ├── app/             # 页面与 API Route
│   ├── components/      # 地图 / 路线流 / 游戏壳 / 智能体 UI
│   ├── game/            # Phaser 风物收纳所：数据、场景、存档
│   └── lib/             # 地图、推荐、星火、天气、AR 桥接
├── public/              # 静态资源（POI 图、底图样式、游戏碎片图）
├── AR/                  # 独立 Vite AR 子应用（MindAR + 手势）
├── docs/                # 技术文档（本目录）
└── scripts/             # 本地启动与辅助脚本
```

主站与 AR **分进程**：主站默认 `3005`，AR 默认 `3006`。主站通过 `NEXT_PUBLIC_AR_BASE_URL` 跳转到 AR 扫描页，打卡结果写回 `localStorage` 后回到主站徽章页。

---

## 2. 技术栈

| 层 | 选型 | 用途 |
|---|---|---|
| 主站 | Next.js 16 App Router + React 19 + TypeScript | 页面、API Route、Vercel 部署 |
| 样式 | Tailwind CSS v4 + CSS 变量 | 水墨纸色、青绿、暖金 |
| 动效 | Motion / GSAP | 转场、盖章、抽屉 |
| 状态 | Zustand + localforage / localStorage | 地图到访、游戏进度、本地档案 |
| 地图 | MapLibre GL JS | 南京 POI、沿路折线、到访态 |
| 游戏 | Phaser 4 | 四条发现手感（涟漪 / 风 / 雾 / 光） |
| AI | 讯飞星火 OpenAI 兼容接口 | 智能体对话；未配置密钥时本地典故兜底 |
| 天气 | Open-Meteo | `/api/weather`，无需密钥 |
| AR | Vite + MindAR + MediaPipe Hands | 玄武湖识别与手势体验 |
| 部署 | Vercel（主站） | 生产环境；AR 仍为独立子项目 |

---

## 3. 产品模块

### 3.1 首页与登录

- `/` 品牌首页，入口导向路线流、地图、游戏、智能体。
- `/login`、`/profile` 使用本地档案（`src/lib/user/local-profile.ts`），演示不接真实账号体系。

### 3.2 智能推荐路线流 `/flow`

路径：`/flow` → 文本 / 语音 / 照片 / 电量 → `/flow/analyzing` → `/flow/result`。

- 展示与切换逻辑：`src/lib/flow/mock.ts`
- 当前 **8 条**可切换路线：梧桐慢行、颐和路巷弄、玄武湖环线、秦淮灯影、紫金林荫、明城墙段、栖霞半日、雨花台静思
- 「重新生成」按 `pickNextMockRoute()` 顺序轮换，避免连续重复
- 结果页计数为 `n / 8`（`src/components/flow/route-result-view.tsx`）
- 对应地图折线在 `src/lib/map/routes.ts`（含 `yuhua-quiet`）

未接真实大模型规划；演示层用本地路线库保证稳定可讲。

### 3.3 城市地图 `/map`

- **23 个 POI**，数据在 `src/lib/map/pois.ts`
- 沿路折线、路网吸附：`road-graph.ts`、`routes.ts`
- 到访态（未探索 / 计划中 / 已到访）：`visit-store.ts`
- 智能推荐面板：`src/lib/map/recommend.ts` + `recommend-panel.tsx`
- 底图样式按 `MAP_STYLE_CANDIDATES` 依次尝试本地 JSON → MapLibre demo → OpenFreeMap，避免单一瓦片源失效

玄武湖 POI 可跳转 AR 打卡（`src/lib/ar/links.ts`）。

### 3.4 风物收纳所 `/game`

Phaser 场景 `src/game/scenes/collection-scene.ts`：

| 路线 | 手感 |
|---|---|
| 玄武湖 · 湖光缓行 | `ripple` 轻点涟漪 |
| 颐和路 · 梧桐回血 | `wind` 拖动风向 |
| 紫金山 · 林间拾光 | `light` 光斑 |
| 秦淮 · 灯影入怀 | `mist` 雾中探物 |

- 12 件风物（图 + 短物语）：`src/game/data/routes.ts`
- 盖章、手机底部抽屉、Hub 进度环：`src/components/game/game-shell.tsx`
- 存档 hydrate 时 **不以本地存档覆盖 URL `?route=`**，保证分享/入口选中的路线生效
- Phaser 等待容器有尺寸后再挂载，避免 0×0 canvas

### 3.5 智能体 `/agents`

三位人设：金陵、宁宁、风信（`src/lib/agents/personas.ts`）。

- `POST /api/agents/chat`：优先星火；失败或无密钥 → `localAgentReply`
- `POST /api/agents/emotion`：情绪侧接口，同样可走本地兜底

**演示约束**：未配置 `SPARK_API_PASSWORD` 时不得 502，必须返回金陵风物典故。

### 3.6 AR 子应用 `AR/`

独立 Vite 应用，不并入 Next 打包。

1. 主站生成扫描 URL：`getArScanUrl("xuanwu-lake")`
2. AR 识别海报 / 演示模式跳过识别
3. 手势阶段可用键盘 `1–4` 模拟
4. 打卡写 `localStorage`，经 `returnUrl` 回到主站 `/badges`

详见 `AR/AR_ARCHITECTURE.md`。线上主站若未部署 AR，打卡按钮会指向 `localhost:3006` 或你配置的 `NEXT_PUBLIC_AR_BASE_URL`。

### 3.7 其它页面

| 路径 | 说明 |
|---|---|
| `/experience/*` | 沉浸体验（风向、徽章馆、向导、路线） |
| `/feel-city` | 感知城市 |
| `/diary` `/records` | 札记 / 足迹 |
| `/badges` `/share` | 徽章与分享卡 |
| `/emotion-weather` | 静态情绪天气页（rewrite 到 `public/emotion-weather`） |

Journiv 相关 API（`/api/journiv/*`）保留对接能力；本地演示可不启 Docker。

---

## 4. API 一览

| 方法 | 路径 | 说明 |
|---|---|---|
| POST | `/api/agents/chat` | 智能体对话 |
| POST | `/api/agents/emotion` | 情绪接口 |
| POST | `/api/copy/generate` | 文案生成 |
| GET | `/api/weather` | Open-Meteo 南京天气 |
| * | `/api/journiv/*` | 可选日志/媒体后端代理 |

密钥只放服务端环境变量，不要写入 `NEXT_PUBLIC_*`。

---

## 5. 环境变量

复制 `.env.example` 为 `.env.local`（本地）或在 Vercel Project Settings 填写：

| 变量 | 必需 | 说明 |
|---|---|---|
| `NEXT_PUBLIC_AR_BASE_URL` | 否 | AR 基址，默认 `http://localhost:3006` |
| `SPARK_API_PASSWORD` | 否 | 讯飞星火 APIPassword；空则走本地典故 |
| `SPARK_MODEL` | 否 | 默认 `lite` |
| `JOURNIV_API_URL` | 否 | 见 `.env.local.example`，演示可不配 |

`.env*` 已加入 `.gitignore`；仅提交 `.env.example` 与 `.env.local.example`。

---

## 6. 本地运行

```powershell
npm install
npm run dev
```

主站：http://localhost:3005

```powershell
cd AR
npm install --ignore-scripts
npm run dev
```

AR：http://localhost:3006

一键脚本：`.\start.ps1 -SkipDocker`

---

## 7. 部署（Vercel）

只部署 **Next 主站**。构建命令 `next build --webpack`（与本地 `npm run dev` 一致），输出由 Vercel 自动识别。

当前生产地址：https://slow-down-nanjing.vercel.app

注意：

1. 不要上传 `.env.local`。
2. 星火密钥在 Vercel 环境变量中配置；不配也能完整演示（智能体走兜底）。
3. `public/` 约 50MB 图片，属演示素材，需纳入仓库。
4. AR 若要上线，需另建 Vercel 项目指向 `AR/`，并把主站 `NEXT_PUBLIC_AR_BASE_URL` 改成该域名。
5. 地图瓦片走公开/本地样式候选，生产环境无需 MapTiler 密钥即可打开 `/map`。

---

## 8. 已知边界

- 推荐路线是精选本地库，不是实时路径规划。
- 用户数据在浏览器本地，清缓存即丢失。
- AR 依赖摄像头与 HTTPS；桌面可用演示模式与键盘手势。
- `ARCHITECTURE.md` 曾因编码损坏；以本文与仓库现状为准。

---

## 9. 2026-09-28：路线规划算法对照实验

- 建立 12 个 POI 模板 × 5 种条件的 60 场景固定基准，其中 56 个可行、4 个故意不可行。
- 新增 BGE、文化知识图谱和天气规则三个独立消融开关；关闭规划贡献时仍保留统一后验指标。
- 完成 240 组功能实验和 1,200 个动态重算性能样本，独立复核预算、闭馆和临时关闭约束。
- 报告由原始结果自动生成 Markdown、自包含 HTML、9 页 A4 PDF 和 6 张 SVG 图表。
- 当前完整配置的可行生成率与不可行正确拒绝率均为 100%，各类硬约束违规率为 0%，动态重算 P95 为 8.11ms。
- 距离、总时间及雨天遮蔽的零结果或不稳定结果均如实保留，不以筛选案例制造算法改进。

完整方法、结果、边界和复现命令见 [路线规划算法对照实验与复现说明](./ROUTE_PLANNING_EXPERIMENTS.md)，设计取舍见 [ADR-001](./decisions/ADR-001-REPRODUCIBLE-ROUTE-BENCHMARK.md)。
