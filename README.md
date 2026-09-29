# 宁可慢一点

金陵慢旅行 H5「宁可慢一点」竞赛演示版：主站（Next.js）+ AR 子应用（Vite）。

- 技术文档：[docs/TECHNICAL.md](./docs/TECHNICAL.md)
- 生产演示版技术更新：[docs/PRODUCTION_TECHNICAL_UPDATE_2026-09-29.md](./docs/PRODUCTION_TECHNICAL_UPDATE_2026-09-29.md)
- 比赛版技术更新：[docs/COMPETITION_TECHNICAL_UPDATE_2026-09-25.md](./docs/COMPETITION_TECHNICAL_UPDATE_2026-09-25.md)
- BGE 与路由技术栈：[docs/BGE_AND_ROUTING_STACK.md](./docs/BGE_AND_ROUTING_STACK.md)
- 文化知识图谱与叙事链：[docs/CULTURAL_KNOWLEDGE_GRAPH.md](./docs/CULTURAL_KNOWLEDGE_GRAPH.md)
- 第三阶段规划算法更新：[docs/PLANNING_ALGORITHM_STAGE3.md](./docs/PLANNING_ALGORITHM_STAGE3.md)
- 架构说明：[ARCHITECTURE.md](./ARCHITECTURE.md)

## 本地运行

主站默认 **http://localhost:3005**，AR 默认 **http://localhost:3006**。

```powershell
npm install
npm run setup:semantic
npm run dev
```

首次下载本地 BGE 模型后，访问 `/planner` 即可离线理解路线偏好。模型实体不提交 Git，比赛离线包需包含 `public/models/` 与 `public/wasm/`。

文化图谱与向量数据检查：

```powershell
npm run culture:validate
npm run check:embeddings
```

```powershell
cd AR
npm install --ignore-scripts
npm run dev
```

或：

```powershell
.\start.ps1 -SkipDocker
```

## 环境变量

复制 `.env.example` 为 `.env.local`：

```
NEXT_PUBLIC_AR_BASE_URL=http://localhost:3006
SPARK_API_PASSWORD=
SPARK_MODEL=lite
```

未配置星火时，智能体仍返回金陵风物典故，不会 502。

## 主要路径

| 路径 | 说明 |
|---|---|
| `/` | 首页 |
| `/planner` | 比赛版智能路线规划与动态重算 |
| `/map` | 经典路线与 23 个南京风物点 |
| `/about` | 项目原理、数据模型与数据边界 |

比赛版导航只保留上述三个入口。原有智能体、情绪分析、AR、游戏、日记和徽章等模块源码仍保留，但已解除比赛主流程入口与运行依赖。

路线规划已接入 23×23 Valhalla / OpenStreetMap 步行矩阵、开放时间窗与预算硬约束，并在结果页比较基准路线、智能路线和精确最优验证路线。

## 部署

- 线上：https://slow-down-nanjing.vercel.app
- GitHub：https://github.com/yeniwu46-max/slow-down-nanjing

主站按 Next.js 项目部署到 Vercel。构建命令为 `npm run build`（`next build --webpack`）。

可选在 Vercel 填写 `SPARK_API_PASSWORD`；不填也能完整演示。

AR 为独立 Vite 应用，如需线上扫描，另外部署 `AR/` 并把 `NEXT_PUBLIC_AR_BASE_URL` 指过去。
