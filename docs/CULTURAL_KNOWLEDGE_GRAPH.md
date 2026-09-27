# 南京文化知识图谱与路线叙事链

## 范围

第二阶段只深挖现有 23 个 POI，不增加地图点位。运行时使用 `src/data/nanjing-culture-knowledge.json`，不连接远程图数据库；断网时文化覆盖率、路线叙事和来源展开仍可使用。

当前数据规模：

- 23 个地点实体，12 个受控文化主题，7 个历史时期。
- 19 个人物、事件或遗产实体。
- 110 条带来源、核验日期、证据等级和状态的文化关系。
- 14 项来源记录，优先采用政府、博物馆、公共文化机构及 UNESCO 资料。

运营数据与文化事实分离：`MapPoi.dataSources` 继续记录开放时间、无障碍、位置等运营信息；图谱来源只支撑文化事实。页面未标注更新时间时保存为 `null`，界面显示“未标注”，不推测日期。

## 数据文件

- `src/data/nanjing-culture-knowledge.json`：可离线读取的 JSON-LD 图谱。
- `tools/generate-culture-graph.ts`：受控实体、地点事实与来源编目，生成固定顺序的 JSON-LD。
- `src/lib/culture/graph.ts`：只读邻接索引、覆盖率、三跳路径和叙事生成。
- `src/lib/culture/validate.ts`：引用、来源、覆盖门槛和 365 天核验期审计。
- `src/components/culture/knowledge-graph.tsx`：`/about` 中的 Cytoscape.js 交互图及手机分组列表。
- `src/components/map/culture-narrative.tsx`：结果页的覆盖率、叙事、事实与来源。

## 可复现命令

```bash
npm run culture:generate
npm run culture:validate
npm run build:embeddings
npm test
```

修改文化资料后先生成图谱，再重建 BGE 向量。`npm run check:embeddings` 会比较 POI 语义文档的 SHA-256，避免图谱变化后继续使用旧向量。

## 评分规则

覆盖率分母是用户确认候选地点涉及的全部规范主题；文本或控件明确关注的主题权重为 2，其余为 1。路线命中权重除以候选总权重得到覆盖率。文化偏好下最多贡献 15 分，其他偏好下最多贡献 5 分；临时关闭、开放时间、总预算和用户确认始终优先。

## 叙事规则

每站最多选两条高证据关系，按关注主题、证据等级和稳定 ID 排序。相邻站点只在已核验图谱中搜索最多三跳路径；找不到路径时保留独立站点故事，不生成过渡句。慢游文案单独标注“项目原创表达”，并保存其依据的 claim ID。

## 来源治理

新增或修改事实时必须：

1. 为实体和关系填写稳定 ID、来源 ID 与 `lastReviewedAt`。
2. 为来源填写标题、发布者、URL、访问日期与页面更新时间；未知更新时间使用 `null`。
3. 精确年代、人物关联和唯一性/规模性结论使用至少两项权威依据。
4. 运行 `npm run culture:validate`，修复缺失来源、非法引用、孤立实体或过期警告。
