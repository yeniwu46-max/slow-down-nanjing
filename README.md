# 宁可慢一点

金陵慢旅行 H5「宁可慢一点」竞赛演示版：主站（Next.js）+ AR 子应用（Vite）。

- 技术文档：[docs/TECHNICAL.md](./docs/TECHNICAL.md)
- 架构说明：[ARCHITECTURE.md](./ARCHITECTURE.md)

## 本地运行

主站默认 **http://localhost:3005**，AR 默认 **http://localhost:3006**。

```powershell
npm install
npm run dev
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
| `/flow` | 智能推荐路线（8 条可轮换） |
| `/map` | 南京地图与 23 个风物点 |
| `/game` | 风物收纳所 |
| `/agents` | 金陵 / 宁宁 / 风信 |
| `/badges` | 徽章（AR 打卡回跳） |

## 部署

- 线上：https://slow-down-nanjing.vercel.app
- GitHub：https://github.com/yeniwu46-max/slow-down-nanjing

主站按 Next.js 项目部署到 Vercel。构建命令为 `npm run build`（`next build --webpack`）。

可选在 Vercel 填写 `SPARK_API_PASSWORD`；不填也能完整演示。

AR 为独立 Vite 应用，如需线上扫描，另外部署 `AR/` 并把 `NEXT_PUBLIC_AR_BASE_URL` 指过去。
