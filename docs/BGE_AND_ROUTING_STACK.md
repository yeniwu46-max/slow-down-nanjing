# BGE 智能偏好与路由技术栈

> 第一阶段实施基线 · 2026-09-27
> 比赛主流程只正式使用浏览器端 BGE；外部路由和约束求解服务均为可选装配。

## 1. 当前运行链路

1. 用户输入不超过 120 字的路线偏好。
2. 浏览器 Worker 从 `/models/bge-small-zh-v1.5/` 载入本地量化模型。
3. 查询向量与 23 个构建期 POI 向量计算余弦相似度。
4. 规则层把“少走路、雨天室内、无障碍”等明确约束映射到原有结构化选项。
5. 用户手动确认 2–5 个地点，再交给现有本地路线规划器。
6. 语义分最多贡献 15 分软偏好分；时间预算、闭馆状态和用户确认仍是硬约束。

模型不可用时自动切换关键词与标签匹配，并在界面标记“本地规则兜底”。天气、时间和体力变化只复用上次语义结果，不重复推理。

## 2. 固定版本

| 组件 | 固定版本 / revision | 用途 |
|---|---|---|
| Transformers.js | `4.3.0` | 浏览器端 ONNX 推理 |
| BGE | `Xenova/bge-small-zh-v1.5@75c43b069aac4d136ba6bc1122f995fedcfd2781` | 中文语义向量 |
| OR-Tools | `9.15.6755` | 时间窗、预算与可选地点求解服务 |
| Valhalla | `valhalla-scripted:3.8.3` | 构建真实步行路网矩阵；现场读取离线快照 |
| GraphHopper | `11.0` | 独立路由验证 |
| GraphHopper Maps | `e3d66108bffd8714fe6dabeae9b8eef79a5e4b3a` | 独立验证界面 |

开源来源：

- [Transformers.js](https://github.com/huggingface/transformers.js)
- [BGE 模型页](https://huggingface.co/BAAI/bge-small-zh-v1.5)
- [OR-Tools](https://github.com/google/or-tools)
- [Valhalla](https://github.com/valhalla/valhalla)
- [GraphHopper](https://github.com/graphhopper/graphhopper)
- [GraphHopper Maps](https://github.com/graphhopper/graphhopper-maps)

## 3. 本地模型与 POI 向量

```powershell
npm run setup:semantic
npm run build:embeddings
npm run check:embeddings
```

仓库只提交：

- 下载清单、revision 与 SHA-256：`tools/semantic-model-assets.json`
- 可复现下载脚本：`tools/setup-semantic-assets.mjs`
- 23 个 POI 的 512 维归一化向量：`src/data/poi-embeddings.json`

`public/models/` 和 `public/wasm/` 不进入 Git。比赛离线包应包含这两个目录。运行时已关闭远程模型加载，模型文件缺失不会触发 Hugging Face 网络下载。

## 4. 路由数据与可选服务

首次准备南京 OSM 数据：

```powershell
npm run setup:routing
```

脚本会校验 Geofabrik 中国 OSM PBF 的 MD5，使用固定的 `osmium-tool 1.15.0` 容器裁切南京范围，并将同一份 `nanjing.osm.pbf` 复制给 Valhalla 和 GraphHopper。

启动可选路由与验证技术栈：

```powershell
npm run stack:up
```

启动包含 GraphHopper 验证工具的完整技术栈：

```powershell
npm run stack:tools
```

| 服务 | 地址 | 是否影响当前主站 |
|---|---|---|
| OR-Tools | `http://localhost:8010/health` | 否 |
| Valhalla | `http://localhost:8002/status` | 否 |
| GraphHopper | `http://localhost:8989/info` | 否 |
| GraphHopper Maps | `http://localhost:3007` | 否，仅技术验证 |

主站已读取 `src/data/nanjing-walking-matrix.json` 中的 Valhalla 步行时长与距离；本地道路图继续提供地图折线和景观、遮蔽等项目评分。≤5 个地点的比赛主流程由浏览器精确枚举完成硬约束校验，OR-Tools 服务使用同一时间窗契约，作为可选扩展验证。详见 [第三阶段规划算法更新](./PLANNING_ALGORITHM_STAGE3.md)。

## 5. 健康检查

```powershell
npm run health
```

默认模式要求模型清单、WASM 与 POI 向量完整，但允许可选服务离线。完整离线包验收可运行：

```powershell
node tools/check-integrations.mjs --strict
```

## 6. 比赛离线包

离线包应在 Git 仓库内容之外补充：

- `public/models/bge-small-zh-v1.5/`
- `public/wasm/`
- `integrations/data/shared/nanjing.osm.pbf`
- `integrations/data/valhalla/` 的预构建路网
- `integrations/data/graphhopper/graph-cache/`
- 已拉取或导出的固定版本 Docker 镜像

GitHub 不保存模型、原始 OSM PBF 或预构建路网大文件。

## 7. 数据与表述边界

- “相对语义匹配分”只用于当前候选 POI 间排序，不是概率。
- BGE 负责文化语义与 POI 相关度，不决定闭馆、预算等硬约束。
- 开放时间、拥挤与路段体验分仍是项目样本，不表述为实时数据。
- GraphHopper Maps 不进入比赛导航，不替换现有 MapLibre 页面。
