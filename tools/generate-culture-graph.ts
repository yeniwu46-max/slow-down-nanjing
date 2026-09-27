import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import type {
  KnowledgeClaim,
  KnowledgeEditorial,
  KnowledgeEntity,
  KnowledgeGraphData,
  KnowledgeSource,
} from "../src/lib/culture/types";

const REVIEWED_AT = "2026-09-27";

const sources: KnowledgeSource[] = [
  {
    id: "source:nanjing-scenic-register",
    title: "南京市国家等级旅游景区名录（截至2026年8月）",
    publisher: "南京市文化和旅游局",
    url: "https://wlj.nanjing.gov.cn/zwfw/bszlxz/202601/t20260121_5773976.html",
    accessedAt: REVIEWED_AT,
    pageUpdatedAt: "2026-01-16",
    kind: "government",
  },
  {
    id: "source:nanjing-relic-register",
    title: "南京市文物保护单位名录",
    publisher: "南京市文化和旅游局",
    url: "https://wlj.nanjing.gov.cn/zwgk/wwbhml/202501/P020250919606961064335.pdf",
    accessedAt: REVIEWED_AT,
    pageUpdatedAt: "2025-09-19",
    kind: "government",
  },
  {
    id: "source:xuanwu-evaluation",
    title: "玄武湖免费开放绩效评价报告",
    publisher: "南京市文化和旅游局",
    url: "https://wlj.nanjing.gov.cn/njswhgdxwcbj/202309/P020230918608937688956.pdf",
    accessedAt: REVIEWED_AT,
    pageUpdatedAt: "2023-09-18",
    kind: "government",
  },
  {
    id: "source:nanjing-museum",
    title: "南京博物院馆藏与展陈",
    publisher: "南京博物院",
    url: "https://www.njmuseum.com/?id=163",
    accessedAt: REVIEWED_AT,
    pageUpdatedAt: null,
    kind: "museum",
  },
  {
    id: "source:nanjing-museum-republic",
    title: "南京博物院民国馆",
    publisher: "南京博物院",
    url: "https://www.njmuseum.com/zh/reviewDetails?id=535",
    accessedAt: REVIEWED_AT,
    pageUpdatedAt: null,
    kind: "museum",
  },
  {
    id: "source:citywall-zhonghua",
    title: "天下第一瓮城——南京城墙中华门",
    publisher: "南京市文化和旅游局",
    url: "https://wlj.nanjing.gov.cn/ztzl/mcq/gzqk/202302/t20230228_3838766.html",
    accessedAt: REVIEWED_AT,
    pageUpdatedAt: "2023-02-28",
    kind: "government",
  },
  {
    id: "source:citywall-museum",
    title: "南京城墙博物馆建设与遗产保护",
    publisher: "南京市文化和旅游局",
    url: "https://wlj.nanjing.gov.cn/ztzl/mcq/gzqk/202112/t20211208_3224553.html",
    accessedAt: REVIEWED_AT,
    pageUpdatedAt: "2021-12-08",
    kind: "government",
  },
  {
    id: "source:zhongshan-scenic",
    title: "钟山风景名胜区文化遗产与生态资源",
    publisher: "南京市文化和旅游局",
    url: "https://wlj.nanjing.gov.cn/whyw/202411/t20241107_5002975.html",
    accessedAt: REVIEWED_AT,
    pageUpdatedAt: "2024-11-07",
    kind: "government",
  },
  {
    id: "source:ming-xiaoling-unesco",
    title: "Imperial Tombs of the Ming and Qing Dynasties: Xiaoling Tomb",
    publisher: "UNESCO World Heritage Centre",
    url: "https://whc.unesco.org/uploads/nominations/1004ter.pdf",
    accessedAt: REVIEWED_AT,
    pageUpdatedAt: null,
    kind: "international",
  },
  {
    id: "source:chaotian-palace",
    title: "南京市博物馆（朝天宫）",
    publisher: "南京市文化和旅游局",
    url: "https://wlj.nanjing.gov.cn/whcg/bwg/njsbwg/201807/t20180731_1078652.html",
    accessedAt: REVIEWED_AT,
    pageUpdatedAt: "2018-07-31",
    kind: "government",
  },
  {
    id: "source:qinhuai-culture",
    title: "秦淮创新多元矩阵，助推文化立体发展",
    publisher: "南京市文化和旅游局",
    url: "https://wlj.nanjing.gov.cn/whyw/202306/t20230601_3926084.html",
    accessedAt: REVIEWED_AT,
    pageUpdatedAt: "2023-06-01",
    kind: "government",
  },
  {
    id: "source:nanjing-flower-tour",
    title: "南京赏花游与城市园林资源",
    publisher: "南京市文化和旅游局",
    url: "https://wlj.nanjing.gov.cn/whyw/202503/t20250327_5104835.html",
    accessedAt: REVIEWED_AT,
    pageUpdatedAt: "2025-03-27",
    kind: "government",
  },
  {
    id: "source:meiyuan-memorial",
    title: "中共代表团梅园新村纪念馆资料",
    publisher: "南京市文化和旅游局",
    url: "https://wlj.nanjing.gov.cn/whcg/bwg/zgdbtmyxcjng/201807/t20180731_1078650.html",
    accessedAt: REVIEWED_AT,
    pageUpdatedAt: "2018-07-31",
    kind: "government",
  },
  {
    id: "source:project-curation",
    title: "宁可慢一点文化主题编目与现场核验记录",
    publisher: "宁可慢一点项目组",
    url: "https://github.com/yeniwu46-max/slow-down-nanjing",
    accessedAt: REVIEWED_AT,
    pageUpdatedAt: REVIEWED_AT,
    kind: "project-record",
  },
];

type EntitySeed = Omit<KnowledgeEntity, "sourceIds" | "lastReviewedAt"> & { sourceIds?: string[] };
const commonSources = ["source:nanjing-scenic-register", "source:nanjing-relic-register"];
const entitySeeds: EntitySeed[] = [
  { id: "theme:six-dynasties", type: "theme", label: "六朝文脉", aliases: ["六朝文化", "建康", "台城"] },
  { id: "theme:republican", type: "theme", label: "民国城市记忆", aliases: ["民国文化", "公馆建筑", "民国建筑"] },
  { id: "theme:ming-city", type: "theme", label: "明都与城墙", aliases: ["明代文化", "明城墙", "城门建筑", "明清建筑"] },
  { id: "theme:qinhuai", type: "theme", label: "秦淮与老城南", aliases: ["秦淮文化", "老城南", "市井文化"] },
  { id: "theme:buddhism", type: "theme", label: "佛教文化", aliases: ["佛教文化", "古刹", "禅意"] },
  { id: "theme:landscape", type: "theme", label: "金陵山水", aliases: ["金陵山水", "古典园林", "金陵园林", "江南园林"] },
  { id: "theme:scholarship", type: "theme", label: "书院科举与阅读", aliases: ["科举文化", "儒家文化", "城市阅读", "当代文学"] },
  { id: "theme:heritage", type: "theme", label: "遗产保护与考古", aliases: ["世界遗产", "考古遗址", "博物馆", "金陵文脉", "非遗", "神道文化", "礼制文化"] },
  { id: "theme:memory", type: "theme", label: "革命与纪念", aliases: ["红色文化", "纪念文化", "近代史", "纪念建筑"] },
  { id: "theme:seasonal", type: "theme", label: "四时花木", aliases: ["赏樱文化", "赏梅文化", "赏枫文化", "梧桐文化"] },
  { id: "theme:urban-life", type: "theme", label: "城市慢生活", aliases: ["城市慢生活", "城市更新", "文艺生活"] },
  { id: "theme:ecology", type: "theme", label: "山林与城市生态", aliases: ["生态文化", "山林文化", "城市景观", "园林文化", "钟山文化"] },
  { id: "period:six-dynasties", type: "period", label: "六朝" },
  { id: "period:tang-song", type: "period", label: "唐宋" },
  { id: "period:ming", type: "period", label: "明代" },
  { id: "period:qing", type: "period", label: "清代" },
  { id: "period:republic", type: "period", label: "民国" },
  { id: "period:modern", type: "period", label: "近现代" },
  { id: "period:contemporary", type: "period", label: "当代" },
  { id: "person:confucius", type: "person", label: "孔子" },
  { id: "person:zhu-yuanzhang", type: "person", label: "朱元璋" },
  { id: "person:sun-yat-sen", type: "person", label: "孙中山" },
  { id: "person:zhou-enlai", type: "person", label: "周恩来" },
  { id: "person:mochou", type: "person", label: "莫愁女传说" },
  { id: "event:imperial-exam", type: "event", label: "江南科举传统" },
  { id: "event:six-dynasties-capital", type: "event", label: "六朝建都建康" },
  { id: "event:ming-capital", type: "event", label: "明初营建南京" },
  { id: "event:modern-revolution", type: "event", label: "近代革命与共和" },
  { id: "event:city-renewal", type: "event", label: "历史街区更新" },
  { id: "heritage:nanjing-city-wall", type: "heritage", label: "南京城墙" },
  { id: "heritage:ming-xiaoling", type: "heritage", label: "明孝陵世界遗产" },
  { id: "heritage:republican-architecture", type: "heritage", label: "民国建筑群" },
  { id: "heritage:qinhuai-landscape", type: "heritage", label: "秦淮历史文化景观" },
  { id: "heritage:museum-collections", type: "heritage", label: "博物馆馆藏" },
  { id: "heritage:buddhist-sites", type: "heritage", label: "佛教寺院与遗址" },
  { id: "heritage:memorial-sites", type: "heritage", label: "纪念性遗址" },
  { id: "heritage:historic-gardens", type: "heritage", label: "历史园林" },
  { id: "heritage:urban-forest", type: "heritage", label: "城市山林景观" },
];

interface PlaceSeed {
  id: string;
  label: string;
  themes: [string, string];
  period: string;
  associate: string;
  sourceIds: string[];
  facts: [string, string, string, string];
}

const placeRows: Array<[
  string,
  string,
  [string, string],
  string,
  string,
  string[],
  [string, string, string, string],
]> = [
  ["xuanwu-lake", "玄武湖公园", ["theme:six-dynasties", "theme:landscape"], "period:six-dynasties", "heritage:historic-gardens", ["source:xuanwu-evaluation", "source:nanjing-scenic-register"], ["玄武湖与六朝都城山水格局相互映照。", "湖面、洲岛与城墙共同构成金陵山水视野。", "这里适合从六朝城市空间理解南京的山水关系。", "玄武湖的园林与公共游憩价值延续至今。"]],
  ["xuanwu-lake-pavilion", "玄武湖梁洲", ["theme:landscape", "theme:seasonal"], "period:modern", "heritage:historic-gardens", ["source:xuanwu-evaluation", "source:nanjing-flower-tour"], ["梁洲是观察玄武湖洲岛园林结构的节点。", "花木季相让湖洲景观形成可感知的时间线索。", "近现代公共园林建设延续了玄武湖的游憩功能。", "洲岛园林与环湖水景共同形成慢游空间。"]],
  ["jiming-temple", "鸡鸣寺", ["theme:buddhism", "theme:six-dynasties"], "period:six-dynasties", "heritage:buddhist-sites", ["source:nanjing-relic-register", "source:nanjing-scenic-register"], ["鸡鸣寺是南京佛教文化空间的重要组成。", "寺院与台城、玄武湖共同构成六朝主题游线。", "文物名录将鸡鸣寺的历史时代指向六朝。", "寺院建筑与礼佛空间承载城市宗教文化记忆。"]],
  ["taicheng", "台城", ["theme:six-dynasties", "theme:ming-city"], "period:six-dynasties", "heritage:nanjing-city-wall", ["source:nanjing-relic-register", "source:citywall-museum"], ["台城是理解六朝建康城记忆的关键地名。", "现地城墙景观把六朝叙事与明城墙遗存并置。", "文物名录将台城遗迹时代列为东晋。", "登城视角连接古都城垣与玄武湖山水。"]],
  ["nanjing-museum", "南京博物院", ["theme:heritage", "theme:republican"], "period:republic", "heritage:museum-collections", ["source:nanjing-museum", "source:nanjing-museum-republic"], ["南京博物院以馆藏串联江苏古代文明。", "民国馆通过街景式展陈呈现近代城市生活。", "院史与建筑共同保留民国时期公共文化机构记忆。", "馆藏与展陈让跨时期文化线索可在室内连续阅读。"]],
  ["presidential-palace", "总统府", ["theme:republican", "theme:memory"], "period:republic", "event:modern-revolution", ["source:nanjing-scenic-register", "source:nanjing-relic-register"], ["总统府景区被列为南京中国近代史遗址博物馆。", "建筑与园林共同承载近代南京政治空间记忆。", "民国时期是理解该遗址群的重要历史层次。", "这里可作为近代革命与共和叙事的核心站点。"]],
  ["confucius-temple", "夫子庙", ["theme:qinhuai", "theme:scholarship"], "period:ming", "event:imperial-exam", ["source:qinhuai-culture", "source:nanjing-relic-register"], ["夫子庙是秦淮历史文化景观的核心节点。", "儒学祭祀与科举传统在此形成紧密的空间联系。", "现存遗迹与明清城市文脉相互关联。", "从书声到灯影，夫子庙适合作为科举叙事的起点。"]],
  ["laomendong", "老门东", ["theme:qinhuai", "theme:urban-life"], "period:qing", "event:city-renewal", ["source:qinhuai-culture", "source:nanjing-relic-register"], ["老门东延续南京老城南的街巷尺度。", "传统文化展示与当代公共文化空间在街区并存。", "明清以来的城南生活记忆构成街区叙事底色。", "历史街区更新让非遗与日常消费形成新的相遇方式。"]],
  ["zhonghua-gate", "中华门", ["theme:ming-city", "theme:qinhuai"], "period:ming", "heritage:nanjing-city-wall", ["source:citywall-zhonghua", "source:citywall-museum"], ["中华门原名聚宝门，是明代南京都城城墙的重要城门。", "内外秦淮河与城门共同说明老城南的交通和防御格局。", "瓮城结构展示古代城门防御空间。", "城门遗产把明都营建与秦淮城市生活连接起来。"]],
  ["yuhuatai", "雨花台", ["theme:memory", "theme:landscape"], "period:modern", "heritage:memorial-sites", ["source:nanjing-scenic-register", "source:nanjing-relic-register"], ["雨花台是南京重要的纪念性文化空间。", "纪念景观与城市南部山林环境共同形成肃静氛围。", "近现代历史记忆是这里的主要叙事层次。", "纪念建筑、林地与步行空间共同服务公共教育。"]],
  ["zhongshan", "钟山风景区", ["theme:ecology", "theme:heritage"], "period:modern", "heritage:urban-forest", ["source:zhongshan-scenic", "source:nanjing-scenic-register"], ["钟山将森林生态与多时期文化遗产集中在同一山体。", "景区内世界遗产与多处文保单位形成复合文化景观。", "近现代纪念建筑是钟山文化序列的重要组成。", "山林步行把自然观察与遗产阅读连接起来。"]],
  ["sun-yat-sen", "中山陵", ["theme:memory", "theme:republican"], "period:republic", "person:sun-yat-sen", ["source:zhongshan-scenic", "source:nanjing-scenic-register"], ["中山陵是钟山近代纪念建筑群的核心。", "建筑轴线与山势共同强化纪念空间秩序。", "民国时期的国家纪念表达在此具有代表性。", "孙中山相关历史记忆构成游览叙事中心。"]],
  ["ming-xiaoling", "明孝陵", ["theme:ming-city", "theme:heritage"], "period:ming", "heritage:ming-xiaoling", ["source:ming-xiaoling-unesco", "source:zhongshan-scenic"], ["明孝陵是明代皇家陵寝文化的重要遗产。", "陵寝布局、神道与钟山环境共同形成文化景观。", "明初营建南京的历史可由此向城市空间延伸。", "明孝陵作为世界遗产组成部分具有国际保护价值。"]],
  ["meihua-hill", "梅花山", ["theme:seasonal", "theme:landscape"], "period:contemporary", "heritage:historic-gardens", ["source:nanjing-flower-tour", "source:zhongshan-scenic"], ["梅花山以季节性花木体验丰富钟山游线。", "梅景与山林遗产环境共同构成金陵春日意象。", "当代城市赏花活动延续了公共园林游赏传统。", "慢行观花适合连接明孝陵周边的历史景观。"]],
  ["1912", "1912街区", ["theme:republican", "theme:urban-life"], "period:contemporary", "event:city-renewal", ["source:nanjing-relic-register", "source:project-curation"], ["1912街区以民国风格空间承接长江路近代文化氛围。", "餐饮与夜间活动使历史主题进入当代城市生活。", "街区的现有使用属于当代文旅消费场景。", "其价值更适合作为城市更新观察点，而非单一史迹判断。"]],
  ["pioneer-bookstore", "先锋书店（五台山店）", ["theme:scholarship", "theme:urban-life"], "period:contemporary", "event:city-renewal", ["source:project-curation", "source:nanjing-scenic-register"], ["先锋书店构成南京当代城市阅读空间的一处样本。", "阅读、展陈与公共交往共同塑造慢生活体验。", "其文化意义主要属于当代城市生活层。", "书店可为高强度古迹游览提供室内停留与节奏转换。"]],
  ["yihe-road", "颐和路公馆区", ["theme:republican", "theme:seasonal"], "period:republic", "heritage:republican-architecture", ["source:nanjing-relic-register", "source:project-curation"], ["颐和路片区集中保留多处民国建筑。", "道路、院落与行道树共同构成可步行阅读的街区尺度。", "民国时期是这里最鲜明的城市历史层。", "公馆建筑群让近代南京的居住空间得到连续呈现。"]],
  ["yijiu-cafe", "颐和路咖啡馆", ["theme:urban-life", "theme:republican"], "period:contemporary", "heritage:republican-architecture", ["source:nanjing-relic-register", "source:project-curation"], ["咖啡馆为颐和路慢游提供当代休憩场景。", "周边民国建筑语境使日常消费与历史街区发生联系。", "场所运营属于当代使用层，不替代建筑史实判断。", "它适合作为公馆区步行中的节奏缓冲点。"]],
  ["mochou-lake", "莫愁湖", ["theme:landscape", "theme:seasonal"], "period:ming", "heritage:historic-gardens", ["source:nanjing-scenic-register", "source:nanjing-flower-tour"], ["莫愁湖是南京城西重要的历史园林与公共景区。", "湖景、花木与传说共同塑造金陵园林意象。", "明清文脉是理解园林空间的重要时间层。", "季节性花木让湖区适合低强度慢游。"]],
  ["chaotian-palace", "朝天宫", ["theme:heritage", "theme:ming-city"], "period:ming", "heritage:museum-collections", ["source:chaotian-palace", "source:nanjing-relic-register"], ["朝天宫保存规模完整的明清官式建筑群。", "南京市博物馆馆藏帮助理解南京城市历史。", "明清礼制建筑是院落空间的主要文化线索。", "古建筑与博物馆展陈在此形成双重阅读方式。"]],
  ["dabaosi", "大报恩寺遗址", ["theme:buddhism", "theme:heritage"], "period:ming", "heritage:buddhist-sites", ["source:nanjing-scenic-register", "source:nanjing-relic-register"], ["大报恩寺遗址展示南京佛教建筑与考古遗存。", "遗址博物馆使地下遗存能够在室内被连续阅读。", "明代是这里最突出的历史叙事层。", "佛教文化与城市考古在同一地点形成交叉主题。"]],
  ["qixia", "栖霞山", ["theme:buddhism", "theme:seasonal"], "period:six-dynasties", "heritage:buddhist-sites", ["source:nanjing-scenic-register", "source:nanjing-relic-register"], ["栖霞山以寺院文化与山林景观共同著称。", "秋季红叶使佛教文化游线具有鲜明季相。", "六朝以来的佛教文脉是理解栖霞山的重要线索。", "山地遗产与自然景观需要以较慢节奏阅读。"]],
  ["wutong-avenue", "梧桐大道", ["theme:republican", "theme:ecology"], "period:republic", "heritage:urban-forest", ["source:zhongshan-scenic", "source:project-curation"], ["梧桐大道以连续林荫形成南京标志性的步行景观。", "道路连接近代城市轴线与钟山文化片区。", "民国城市建设记忆是其主要历史语境之一。", "行道树把交通空间转化为可停留的城市绿廊。"]],
];
const places: PlaceSeed[] = placeRows.map(
  ([id, label, themes, period, associate, sourceIds, facts]) => ({
    id,
    label,
    themes,
    period,
    associate,
    sourceIds,
    facts,
  }),
);

const entities: KnowledgeEntity[] = [
  ...entitySeeds.map((entity) => ({
    ...entity,
    sourceIds: entity.sourceIds ?? commonSources,
    lastReviewedAt: REVIEWED_AT,
  })),
  ...places.map((place) => ({
    id: `place:${place.id}`,
    type: "place" as const,
    label: place.label,
    sourceIds: place.sourceIds,
    lastReviewedAt: REVIEWED_AT,
  })),
];

const claims: KnowledgeClaim[] = [];
const editorials: KnowledgeEditorial[] = [];
for (const place of places) {
  const targets = [place.themes[0], place.themes[1], place.period, place.associate];
  const predicates: KnowledgeClaim["predicate"][] = [
    "embodiesTheme",
    "embodiesTheme",
    "belongsToPeriod",
    place.associate.startsWith("heritage:") ? "hasHeritageType" : "associatedWith",
  ];
  const claimIds: string[] = [];
  targets.forEach((objectId, index) => {
    const id = `claim:${place.id}:${index + 1}`;
    claimIds.push(id);
    claims.push({
      id,
      subjectId: `place:${place.id}`,
      predicate: predicates[index],
      objectId,
      text: place.facts[index],
      sourceIds: place.sourceIds,
      lastReviewedAt: REVIEWED_AT,
      evidenceLevel: place.sourceIds.includes("source:project-curation") ? "curated" : "authoritative",
      status: place.sourceIds.includes("source:project-curation") ? "interpretive" : "verified",
    });
  });
  editorials.push({
    id: `editorial:${place.id}`,
    placeId: `place:${place.id}`,
    text: `${place.label}不必匆匆打卡；沿着“${entities.find((entity) => entity.id === place.themes[0])?.label}”的线索停一停，再把目光交给下一站。`,
    version: "1.0.0",
    authoredAt: REVIEWED_AT,
    basedOnClaimIds: claimIds.slice(0, 2),
    label: "项目原创表达",
  });
}

const linkClaims: Array<[string, string, string, string[]]> = [
  ["place:jiming-temple", "place:taicheng", "鸡鸣寺与台城共同指向六朝建康的寺院与城垣记忆。", ["source:nanjing-relic-register"]],
  ["place:taicheng", "place:xuanwu-lake", "从台城望向玄武湖，古都城垣与城市山水在同一视野相遇。", ["source:nanjing-relic-register", "source:xuanwu-evaluation"]],
  ["place:confucius-temple", "place:laomendong", "夫子庙的科举文脉向南延伸为老城南的街巷生活。", ["source:qinhuai-culture"]],
  ["place:laomendong", "place:zhonghua-gate", "老门东街巷通向中华门，日常生活由此接入明都城防体系。", ["source:citywall-zhonghua", "source:qinhuai-culture"]],
  ["place:zhonghua-gate", "place:dabaosi", "中华门与大报恩寺遗址共同保留明代老城南的城市记忆。", ["source:nanjing-relic-register"]],
  ["place:yihe-road", "place:wutong-avenue", "公馆街区与林荫大道共同呈现民国南京的城市空间气质。", ["source:nanjing-relic-register", "source:zhongshan-scenic"]],
  ["place:wutong-avenue", "place:presidential-palace", "林荫城市轴线可将钟山片区的近代景观引向长江路历史空间。", ["source:zhongshan-scenic", "source:nanjing-scenic-register"]],
  ["place:presidential-palace", "place:1912", "总统府的近代史遗址与1912街区的当代使用形成历史与更新的对照。", ["source:nanjing-scenic-register", "source:project-curation"]],
  ["place:ming-xiaoling", "place:meihua-hill", "明孝陵遗产空间与梅花山季节景观共同构成钟山慢游。", ["source:ming-xiaoling-unesco", "source:nanjing-flower-tour"]],
  ["place:nanjing-museum", "place:wutong-avenue", "博物院的民国建筑与馆藏叙事可延伸到中山东路的林荫城市景观。", ["source:nanjing-museum-republic", "source:zhongshan-scenic"]],
];
linkClaims.forEach(([subjectId, objectId, text, sourceIds], index) => {
  claims.push({
    id: `claim:route-link:${index + 1}`,
    subjectId,
    predicate: "connectsTo",
    objectId,
    text,
    sourceIds,
    lastReviewedAt: REVIEWED_AT,
    evidenceLevel: sourceIds.includes("source:project-curation") ? "curated" : "corroborated",
    status: sourceIds.includes("source:project-curation") ? "interpretive" : "verified",
  });
});

const supplementalClaims: Array<[string, string, string, string[]]> = [
  ["place:confucius-temple", "person:confucius", "夫子庙以孔子祭祀与儒学传播为核心文化线索。", ["source:qinhuai-culture", "source:nanjing-relic-register"]],
  ["place:ming-xiaoling", "person:zhu-yuanzhang", "明孝陵的陵寝主人与明初南京营建历史共同指向朱元璋。", ["source:ming-xiaoling-unesco", "source:nanjing-relic-register"]],
  ["place:presidential-palace", "person:zhou-enlai", "周恩来参与的南京国共和谈是近代南京政治史的一条人物线索。", ["source:meiyuan-memorial", "source:nanjing-scenic-register"]],
  ["place:mochou-lake", "person:mochou", "莫愁女传说是莫愁湖名称与地方叙事的重要组成。", ["source:nanjing-scenic-register", "source:project-curation"]],
  ["place:xuanwu-lake", "event:six-dynasties-capital", "玄武湖邻近六朝都城核心区域，是理解建康山水格局的观察点。", ["source:xuanwu-evaluation", "source:nanjing-relic-register"]],
  ["place:zhonghua-gate", "event:ming-capital", "中华门城防空间体现明初南京都城营建。", ["source:citywall-zhonghua", "source:citywall-museum"]],
  ["place:confucius-temple", "heritage:qinhuai-landscape", "夫子庙与秦淮河岸共同构成秦淮历史文化景观。", ["source:qinhuai-culture", "source:nanjing-scenic-register"]],
  ["place:qixia", "period:tang-song", "栖霞山佛教遗存的历史层累延续至唐宋时期。", ["source:nanjing-relic-register", "source:nanjing-scenic-register"]],
];
supplementalClaims.forEach(([subjectId, objectId, text, sourceIds], index) => {
  claims.push({
    id: `claim:supplemental:${index + 1}`,
    subjectId,
    predicate: "associatedWith",
    objectId,
    text,
    sourceIds,
    lastReviewedAt: REVIEWED_AT,
    evidenceLevel: sourceIds.includes("source:project-curation") ? "curated" : "corroborated",
    status: sourceIds.includes("source:project-curation") ? "interpretive" : "verified",
  });
});

const legacyTagMap: Record<string, string[]> = {};
for (const entity of entities.filter((item) => item.type === "theme")) {
  for (const alias of entity.aliases ?? []) legacyTagMap[alias] = [entity.id];
}

const graph: KnowledgeGraphData = {
  "@context": {
    id: "@id",
    type: "@type",
    place: "https://slowdown.example/knowledge/place/",
    theme: "https://slowdown.example/knowledge/theme/",
    period: "https://slowdown.example/knowledge/period/",
    person: "https://slowdown.example/knowledge/person/",
    event: "https://slowdown.example/knowledge/event/",
    heritage: "https://slowdown.example/knowledge/heritage/",
  },
  "@type": "KnowledgeGraph",
  version: "1.0.0",
  generatedAt: `${REVIEWED_AT}T00:00:00+08:00`,
  sources,
  entities,
  claims,
  editorials,
  legacyTagMap,
};

const target = resolve(process.cwd(), "src/data/nanjing-culture-knowledge.json");
mkdirSync(dirname(target), { recursive: true });
writeFileSync(target, `${JSON.stringify(graph, null, 2)}\n`, "utf8");
console.log(`Generated ${target}: ${entities.length} entities, ${claims.length} claims, ${sources.length} sources.`);
