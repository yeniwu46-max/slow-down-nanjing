# 第三阶段技术更新：真实步行路网与硬约束规划

> 更新日期：2026-09-27
> 适用范围：比赛版 `/planner`，现有 23 个南京 POI

## 1. 本阶段结论

规划器已从“地点间直线距离估计”升级为“Valhalla + OpenStreetMap 步行路网矩阵”。主流程在浏览器离线执行时间窗求解，并同步给出基准路线、智能路线和精确最优验证路线。可选 OR-Tools 服务采用同一组输入约束，服务未启动时不影响比赛演示。

本阶段没有把历史快照描述为实时交通：矩阵记录了生成时间、引擎版本、坐标哈希和数据署名；拥挤、体力、景观、遮蔽等仍明确标为项目样本估计。

## 2. 真实步行路网矩阵

### 2.1 数据产物

- 文件：`src/data/nanjing-walking-matrix.json`
- 地点：23 个 POI
- 地点对：23 × 23，共 529 对
- 出行方式：`pedestrian`
- 引擎：Valhalla `3.9.0-e8b4007`
- 路网：OpenStreetMap walking network
- 生成时间：`2026-09-27T08:27:22.676Z`
- POI 源数据 SHA-256：`1bc4f8e4b919605e2ba98765422a89dd3de4e57aed674204702e159ed94c0298`
- 不可达地点对：0

构建脚本 `tools/build-walking-matrix.ts` 将请求按服务限制分批，验证矩阵维度、可达性和非负数值后才写入产物。默认参考端点可通过 `VALHALLA_MATRIX_URL` 替换为本机 `valhalla-scripted` 服务。运行：

```bash
npm run routing:matrix
npm run routing:validate
```

运行时只读取已提交的矩阵快照，不依赖网络。POI 之间的距离和步行时间来自路网；用户临时定位到首站的接入段暂用本地距离估算，并在界面中显式标注。

## 3. 时间窗与硬约束

浏览器端 `src/lib/optimization/exact-solver.ts` 和 OR-Tools 服务共享以下约束：

1. 每个地点具有开放时间和闭馆时间。
2. 到达过早时允许等待，等待时间计入总预算。
3. `到达 + 建议停留时间` 不得晚于闭馆时间。
4. `步行 + 停留 + 等待` 不得超过剩余游玩时间。
5. 临时关闭地点在求解前移除。
6. 明确起点时，起点固定；未指定地点起点时允许从候选 POI 中选择首站。
7. 用户最多确认 5 个地点，因此浏览器可穷举所有子集和顺序，给出可复现的精确验证结果。

精确验证采用词典式目标：先最大化可完成地点数，再最小化总用时，再最小化步行时间；稳定 ID 顺序负责平局决胜。该目标用于核验，不替代智能路线的文化、天气、体力和景观软偏好。

OR-Tools 容器服务位于 `integrations/optimizer/app.py`，时间维度允许等待，并返回每站到达、离开和等待时间。非起点默认可在预算不足时以高惩罚省略；`mandatory_indices` 可将指定地点设为不可省略的硬约束。

## 4. 三类路线对比

| 路线 | 生成方式 | 作用 |
|---|---|---|
| 基准路线 | 用户勾选顺序 + 时间窗截断 | 作为无智能排序的对照组 |
| 智能路线 | 多目标评分 + Valhalla 步行矩阵 | 综合效率、天气、体力、文化、语义和体验偏好 |
| 最优验证路线 | ≤5 POI 全子集、全排列精确枚举 | 验证可完成地点数与最短可行用时 |

结果页显示三者的地点数、总时长、步行时间、距离、可行性、求解引擎和枚举序列数。只有智能路线与最优解覆盖相同数量地点时才显示用时差距；覆盖数不同时不制造不可比的百分比。

原有“效率优先 / 体验优先”两条推荐继续保留，用于解释不同软偏好下的量化差异；三类算法对比则负责证明智能规划优于固定顺序，并接受精确解校验。

## 5. 离线与降级策略

- 主站、路网矩阵、知识图谱、BGE 模型和精确求解器均可随比赛离线包运行。
- Valhalla 只在重新生成矩阵时需要；现场不会请求公共路由服务。
- OR-Tools 是可选验证服务，未启动不会阻塞主站。
- 定位被拒绝时使用南京默认起点；临时定位接入段会显示为估算。
- 路网快照不是实时路况，更新时间和来源会随结果显示。

## 6. 验证命令

```bash
npm run routing:validate
npm run culture:validate
npm run check:embeddings
npm test
npm run lint
npx tsc --noEmit
npm run build
python -m py_compile integrations/optimizer/app.py
```

关键自动化测试覆盖：真实矩阵数值、开馆前等待、闭馆前完成、预算上限、三算法对比、精确枚举规模和单次规划低于 500ms。

## 7. 可追溯依据

- [Valhalla Matrix API](https://valhalla.github.io/valhalla/api/matrix/)
- [Valhalla Matrix response reference](https://valhalla.github.io/valhalla/api/matrix/api-reference/)
- [OR-Tools VRPTW](https://developers.google.com/optimization/routing/vrptw)
- [OR-Tools routing dimensions](https://developers.google.com/optimization/routing/dimensions)

OpenStreetMap 数据署名：© OpenStreetMap contributors。
