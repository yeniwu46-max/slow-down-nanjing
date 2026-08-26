/**
 * Download 3 Wikimedia/Wikipedia photos per map POI into public/images/pois.
 * Sources: Wikipedia REST originalimage + media-list, Commons Special:FilePath.
 */
import { mkdir, writeFile, stat, unlink, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "public", "images", "pois");
const UA = "NingKeManYiDian/1.0 (educational contest map photos)";
const MIN_BYTES = 12000;

/** @typedef {{ wiki?: string[], files?: string[], cats?: string[] }} PoiSrc */

/** @type {Record<string, PoiSrc>} */
const POIS = {
  "xuanwu-lake": {
    wiki: ["en:Xuanwu_Lake", "zh:玄武湖"],
    files: [
      "GULOU Nanjing.jpg",
      "Taicheng sunny.jpg",
      "Inside the Xuanwu Gate, Nanjing.jpg",
    ],
    cats: ["Category:Xuanwu Lake"],
  },
  "xuanwu-lake-pavilion": {
    wiki: ["en:Xuanwu_Lake", "zh:玄武湖"],
    files: [
      "Xuanwu Lake, Nanjing.jpg",
      "Nanjing Xuanwu Lake 2017 01.jpg",
      "GULOU Nanjing.jpg",
    ],
  },
  "jiming-temple": {
    wiki: ["en:Jiming_Temple", "zh:鸡鸣寺"],
    files: [
      "Nanjing - Jiming Temple interior.jpg",
      "Jiming Temple Nanjing.jpg",
      "Jimingsi.jpg",
    ],
  },
  taicheng: {
    wiki: ["en:City_Wall_of_Nanjing", "zh:南京城墙"],
    files: [
      "Taicheng sunny.jpg",
      "Nanjing City Wall 2011.jpg",
      "Inside the Xuanwu Gate, Nanjing.jpg",
    ],
  },
  "nanjing-museum": {
    wiki: ["en:Nanjing_Museum", "zh:南京博物院"],
    files: [
      "Nanjing Museum 2011.jpg",
      "Nanjing Museum.jpg",
      "Nanjing Museum History Hall.jpg",
    ],
  },
  "presidential-palace": {
    wiki: ["en:Presidential_Palace_(Nanjing)", "zh:南京总统府"],
    files: [
      "Presidential Palace Nanjing.jpg",
      "Nanjing Presidential Palace 2011.jpg",
      "Gate of Presidential Palace, Nanjing.jpg",
    ],
  },
  "confucius-temple": {
    wiki: ["en:Fuzimiao", "zh:夫子庙"],
    files: [
      "Confucius Temple Nanjing.jpg",
      "Fuzimiao Nanjing.jpg",
      "Qinhuai River Nanjing night.jpg",
    ],
  },
  laomendong: {
    wiki: ["zh:老门东", "en:Qinhuai_River"],
    files: [
      "Laomendong Nanjing.jpg",
      "Old Gate East Nanjing.jpg",
      "Nanjing Confucius Temple area.jpg",
    ],
  },
  "zhonghua-gate": {
    wiki: ["en:Zhonghua_Gate", "zh:中华门"],
    files: [
      "Zhonghua Gate Nanjing.jpg",
      "Zhonghuamen Castle, Nanjing.jpg",
      "Nanjing Zhonghua Gate 2011.jpg",
    ],
  },
  yuhuatai: {
    wiki: ["en:Yuhuatai_Martyrs'_Cemetery", "zh:雨花台"],
    files: [
      "Yuhuatai Nanjing.jpg",
      "Rain Flower Terrace Nanjing.jpg",
      "Yuhuatai Martyrs Cemetery.jpg",
    ],
  },
  zhongshan: {
    wiki: ["en:Purple_Mountain_(Nanjing)", "zh:紫金山"],
    files: [
      "Purple Mountain Nanjing.jpg",
      "Zijinshan Nanjing.jpg",
      "Nanjing Purple Mountain 2011.jpg",
    ],
  },
  "sun-yat-sen": {
    wiki: ["en:Sun_Yat-sen_Mausoleum", "zh:中山陵"],
    files: [
      "Sun Yat-sen Mausoleum.jpg",
      "Nanjing Sun Yat-sen Mausoleum 2011.jpg",
      "Zhongshanling.jpg",
    ],
  },
  "ming-xiaoling": {
    wiki: ["en:Ming_Xiaoling", "zh:明孝陵"],
    files: [
      "Ming Xiaoling Mausoleum, Nanjing.jpg",
      "Ming Xiaoling Mausoleum Spirit Way.jpg",
      "MingXiaoling Animal Elephant 02.jpg",
    ],
  },
  "meihua-hill": {
    wiki: ["zh:梅花山 (南京)", "en:Ming_Xiaoling"],
    files: [
      "Nanjing Meihua Mountain.jpg",
      "MeihuaShan 1.jpg",
      "Meihuashan 2016.7.16-2.jpg",
    ],
  },
  1912: {
    wiki: ["zh:南京1912", "en:Presidential_Palace_(Nanjing)"],
    files: [
      "The 1912 Commercial Street in Nanjing 05 2012-09.JPG",
      "The 1912 Commercial Street in Nanjing 01 2012-09.JPG",
      "The 1912 Commercial Street in Nanjing 02 2012-09.JPG",
    ],
  },
  "pioneer-bookstore": {
    wiki: ["en:Librairie_Avant-Garde", "zh:先锋书店"],
    files: [
      "Librairie Avant-Garde Nanjing.jpg",
      "Pioneer Bookstore Nanjing.jpg",
      "Wutaishan Stadium Nanjing.jpg",
    ],
  },
  "yihe-road": {
    wiki: ["zh:颐和路", "en:Gulou,_Nanjing"],
    files: [
      "Yihe Road Nanjing.jpg",
      "Nanjing villa plane trees.jpg",
      "Gulou Nanjing street.jpg",
    ],
  },
  "yijiu-cafe": {
    wiki: ["zh:颐和路", "en:Gulou,_Nanjing"],
    files: [
      "Nanjing plane trees.jpg",
      "Yihe Road Nanjing.jpg",
      "Nanjing old villa.jpg",
    ],
  },
  "mochou-lake": {
    wiki: ["en:Mochou_Lake", "zh:莫愁湖"],
    files: [
      "Mochou Lake Nanjing.jpg",
      "Mochouhu.jpg",
      "Nanjing Mochou Lake 2011.jpg",
    ],
  },
  "chaotian-palace": {
    wiki: ["en:Chaotian_Palace", "zh:朝天宫"],
    files: [
      "Chaotian Palace Nanjing.jpg",
      "Chaotiangong.jpg",
      "Nanjing Chaotian Palace 2011.jpg",
    ],
  },
  dabaosi: {
    wiki: ["en:Porcelain_Tower_of_Nanjing", "zh:大报恩寺"],
    files: [
      "Porcelain Tower Nanjing replica.jpg",
      "Dabaoensi Nanjing.jpg",
      "Nanjing Porcelain Pagoda.jpg",
    ],
  },
  qixia: {
    wiki: ["en:Qixia_Temple", "zh:栖霞山"],
    files: [
      "Qixia Temple Nanjing.jpg",
      "Qixiashan.jpg",
      "Nanjing Qixia Mountain autumn.jpg",
    ],
  },
  "wutong-avenue": {
    wiki: ["zh:中山东路", "en:Xuanwu,_Nanjing"],
    files: [
      "Zhongshan East Road Nanjing.jpg",
      "Plane trees Nanjing.jpg",
      "Nanjing Zhongshan Road.jpg",
    ],
  },
};

async function fetchJson(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
  });
  if (!res.ok) return null;
  return res.json();
}

function absUrl(url) {
  if (!url) return null;
  let next = String(url).trim();
  if (next.startsWith("//")) next = `https:${next}`;
  if (next.startsWith("/")) next = `https://upload.wikimedia.org${next}`;
  try {
    const parsed = new URL(next);
    if (!parsed.protocol.startsWith("http")) return null;
    return parsed.href.split("?")[0];
  } catch {
    return null;
  }
}

function filePathUrl(name) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(name)}?width=1280`;
}

async function urlsFromWiki(spec) {
  const [lang, ...rest] = spec.split(":");
  const title = rest.join(":");
  const encoded = encodeURIComponent(title);
  const urls = [];
  const summary = await fetchJson(
    `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encoded}`,
  );
  const orig = absUrl(summary?.originalimage?.source ?? summary?.thumbnail?.source);
  if (orig) urls.push(orig);

  const media = await fetchJson(
    `https://${lang}.wikipedia.org/api/rest_v1/page/media-list/${encoded}`,
  );
  let taken = 0;
  for (const item of media?.items ?? []) {
    if (item.type !== "image") continue;
    const raw =
      item.srcset?.at(-1)?.src ??
      item.original?.source ??
      item.thumbnail?.source ??
      item.src;
    const src = absUrl(raw);
    if (!src || src.endsWith(".svg")) continue;
    urls.push(src);
    taken += 1;
    if (taken >= 8) break;
  }
  return urls;
}

async function urlsFromCategory(cat) {
  const api =
    "https://commons.wikimedia.org/w/api.php?action=query&generator=categorymembers" +
    `&gcmtitle=${encodeURIComponent(cat)}&gcmtype=file&gcmlimit=12` +
    "&prop=imageinfo&iiprop=url|mime|size&iiurlwidth=1280&format=json";
  const data = await fetchJson(api);
  const pages = data?.query?.pages ?? {};
  const urls = [];
  for (const page of Object.values(pages)) {
    const info = page.imageinfo?.[0];
    const mime = info?.mime ?? "";
    if (!mime.startsWith("image/") || mime.includes("svg")) continue;
    const url = absUrl(info.thumburl || info.url);
    if (url) urls.push(url);
  }
  return urls;
}

async function urlsFromSearch(query) {
  const api =
    "https://commons.wikimedia.org/w/api.php?action=query&generator=search" +
    `&gsrsearch=${encodeURIComponent(query)}&gsrnamespace=6&gsrlimit=10` +
    "&prop=imageinfo&iiprop=url|mime|size&iiurlwidth=1280&format=json";
  const data = await fetchJson(api);
  const pages = data?.query?.pages ?? {};
  const urls = [];
  for (const page of Object.values(pages)) {
    const info = page.imageinfo?.[0];
    const mime = info?.mime ?? "";
    if (!mime.startsWith("image/") || mime.includes("svg") || mime.includes("pdf")) {
      continue;
    }
    const url = absUrl(info.thumburl || info.url);
    if (url) urls.push(url);
  }
  return urls;
}

function unique(urls) {
  const seen = new Set();
  const out = [];
  for (const url of urls) {
    const key = url.replace(/\/thumb\//, "/").replace(/\/\d+px-[^/]+$/, "");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(url);
  }
  return out;
}

async function download(url, dest) {
  const res = await fetch(url, {
    headers: { "User-Agent": UA },
    redirect: "follow",
  });
  if (!res.ok) return false;
  const type = res.headers.get("content-type") ?? "";
  if (type.includes("html") || type.includes("pdf") || type.includes("svg")) {
    return false;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < MIN_BYTES) return false;
  if (buf[0] === 0x25 && buf[1] === 0x50) return false; // %PDF
  await writeFile(dest, buf);
  return true;
}

async function collect(src) {
  const urls = [];
  for (const file of src.files ?? []) urls.push(filePathUrl(file));
  for (const wiki of src.wiki ?? []) {
    try {
      urls.push(...(await urlsFromWiki(wiki)));
    } catch {
      /* ignore one source */
    }
  }
  for (const cat of src.cats ?? []) {
    try {
      urls.push(...(await urlsFromCategory(cat)));
    } catch {
      /* ignore */
    }
  }
  const searchQ = src.wiki?.[0]?.split(":").slice(1).join(":") || src.files?.[0];
  if (searchQ) {
    try {
      urls.push(...(await urlsFromSearch(`${searchQ} Nanjing`)));
    } catch {
      /* ignore */
    }
  }
  return unique(urls.filter(Boolean));
}

await mkdir(OUT, { recursive: true });

let ok = 0;
let miss = 0;
async function existingCount(id) {
  let n = 0;
  for (const i of [1, 2, 3]) {
    try {
      const info = await stat(join(OUT, `${id}-${i}.jpg`));
      if (info.size >= MIN_BYTES) n = i;
      else break;
    } catch {
      break;
    }
  }
  return n;
}

for (const [id, src] of Object.entries(POIS)) {
  let n = await existingCount(id);
  if (n >= 3) {
    console.log(`skip ${id} (already 3)`);
    ok += 1;
    continue;
  }
  const urls = (await collect(src)).slice(n);
  for (const url of urls) {
    if (n >= 3) break;
    const dest = join(OUT, `${id}-${n + 1}.jpg`);
    try {
      const saved = await download(url, dest);
      if (saved) {
        n += 1;
        const size = (await stat(dest)).size;
        console.log(`  ${id}-${n}.jpg  ${Math.round(size / 1024)}KB`);
      } else {
        await unlink(dest).catch(() => {});
      }
    } catch (err) {
      await unlink(dest).catch(() => {});
      console.log(`  fail ${id}: ${err.message}`);
    }
  }
  if (n >= 3) ok += 1;
  else {
    miss += 1;
    console.log(`MISSING ${id}: only ${n}/3  (tried ${urls.length} urls)`);
  }
}

console.log(`\ndone: ${ok} complete, ${miss} incomplete`);
const leftover = await readdir(OUT);
console.log(`files in pois/: ${leftover.filter((f) => f.endsWith(".jpg")).length}`);
