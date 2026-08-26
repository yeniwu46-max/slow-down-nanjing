import type { AgentId } from "@/lib/agents/personas";

export interface LocalEmotionResult {
  moodLabel: string;
  keywords: string[];
  battery: number;
  advice: string;
  recommendAgent: string;
}

const JINLING_STORIES: { keys: string[]; text: string }[] = [
  {
    keys: ["玄武", "湖", "信笺", "白鹭"],
    text:
      "玄武湖是金陵城里最大的那碗水。南朝时它是练水军的湖，后来慢慢变成城里人散步的地方。" +
      "湖心五洲像五封没有寄出的信。你若走环洲到梁洲，不必赶完一圈——坐下来看城墙影子落进水里，就已经把这座城听懂了一半。",
  },
  {
    keys: ["梧桐", "树", "林荫", "成贤"],
    text:
      "南京的梧桐是有来历的。民国时沿中山路、成贤街种下法国梧桐，如今树冠已能把一条街变成绿廊。" +
      "秋天落叶铺路，春天新叶滤光。慢行的意思不是少走，是让树影有时间落在肩膀上。",
  },
  {
    keys: ["秦淮", "夫子庙", "灯", "河"],
    text:
      "秦淮河是被写进诗文最多的那条水。夫子庙一带灯影稠密，白日里却是市井的烟火。" +
      "若只为打卡灯会，容易错过河风。傍晚沿河北岸慢慢走，听船桨和人声叠在一起，才是金陵夜生活更老的一种节奏。",
  },
  {
    keys: ["城墙", "台城", "明城", "鸡鸣"],
    text:
      "明城墙把六朝故都围成可走的线。台城到鸡鸣寺这一段，墙在左、湖在右，脚下是砖，抬头是树。" +
      "城墙不是用来征服的长度，是让人意识到：这座城已经慢了六百年，你不必今天走完。",
  },
  {
    keys: ["颐和", "公馆", "民国", "梧桐深巷"],
    text:
      "颐和路是民国公馆区。法国梧桐夹道，青砖灰瓦，门牌安静得像还在等人回家。" +
      "适合一个人走。不必进每一栋，看一扇铁艺栏杆、听一阵蝉，就已经摸到金陵「宅」与「巷」的脾气。",
  },
  {
    keys: ["紫金", "中山", "陵", "孝陵"],
    text:
      "紫金山把南京的天际线托住。中山陵的台阶是给脚步用的标点，明孝陵的神道则把人放回更早的朝代。" +
      "上山不必一次到顶。选一段林荫道，把呼吸交给松风，也是一种对这座城的敬礼。",
  },
];

const DEFAULT_JINLING =
  "金陵不只是景点名单。梧桐、玄武湖、秦淮、明城墙，都是中国人把日子过慢一点的现场。" +
  "你想听哪一处？湖、树、河，还是墙？我带你走一段，不赶点。";

const NINGNING_DEFAULT =
  "我在。你不必先把心情说得很完整。若觉得赶，就去湖边站两分钟；若觉得空，就去梧桐树下走一段。" +
  "南京会接住你。想听哪个地方的风，我帮你转给金陵小游。";

const FENGXIN_DEFAULT =
  "把今天写成一句可带走的话：在金陵，脚步轻得像落叶，湖把城墙的影子慢慢摊开。" +
  "若要更短——「宁可慢一点，才遇见南京。」";

function pickStory(userText: string): string {
  const t = userText.toLowerCase();
  for (const story of JINLING_STORIES) {
    if (story.keys.some((k) => t.includes(k))) return story.text;
  }
  return DEFAULT_JINLING;
}

export function localAgentReply(agentId: AgentId, userText: string): string {
  if (agentId === "jinling") return pickStory(userText);
  if (agentId === "fengxin") {
    const place = ["玄武湖", "梧桐", "秦淮"].find((k) => userText.includes(k));
    if (place) {
      return `明信片可以这样写：慢行过${place}，风把旧时光吹到今天。落款：宁可慢一点。`;
    }
    return FENGXIN_DEFAULT;
  }
  if (userText.includes("累") || userText.includes("赶") || userText.includes("烦")) {
    return "听得出来你有点赶。先把脚步放下来。玄武湖的岸足够长，不必今天走完——坐下来看一会水，也算抵达。";
  }
  return NINGNING_DEFAULT;
}

export function localEmotionResult(text: string): LocalEmotionResult {
  const tired = /累|赶|烦|焦|卷|忙/.test(text);
  const quiet = /静|空|独|慢|湖|树/.test(text);
  return {
    moodLabel: tired ? "想慢下来" : quiet ? "想走一走" : "平静",
    keywords: tired ? ["匆忙", "想歇", "金陵"] : ["慢行", "金陵", "风物"],
    battery: tired ? 38 : quiet ? 62 : 55,
    advice: tired
      ? "先去玄武湖站两分钟，把赶路的气吐掉。"
      : "去梧桐树下走一段，让树影落在肩膀上。",
    recommendAgent: tired ? "宁宁" : "金陵小游",
  };
}
