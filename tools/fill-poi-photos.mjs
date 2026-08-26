import { mkdir, writeFile, stat, unlink, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "images", "pois");
const UA = "NingKeManYiDian/1.0 (educational contest map photos)";
const MIN = 12000;

function fp(name) {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(name)}?width=1280`;
}

/** Extra Wikimedia files to fill remaining slots. */
const FILL = {
  "presidential-palace": [
    fp("Presidental Palace at Nanjing main gate.JPG"),
    fp("Main Hall, Nanjing Presidential Palace, Oct 2017 (2).jpg"),
    fp("Reception Hall, Presidential Palace, Nanjing (2018).jpg"),
  ],
  "confucius-temple": [
    fp("KuiGuangGe of Nanjing Confucian Temple.jpg"),
    fp("Confucius Temple of Nanjing 2011-12.jpg"),
    fp("Qinhuai River at night.jpg"),
    fp("Fuzimiao Nanjing night.jpg"),
    "https://upload.wikimedia.org/wikipedia/commons/0/0a/KuiGuangGe_of_Nanjing_Confucian_Temple.jpg",
  ],
  "zhonghua-gate": [
    fp("2024Apr - Nanjing City Wall (south section) - img 01.jpg"),
    fp("Zhonghua Gate, Nanjing, 2017.jpg"),
    fp("Nanjing Zhonghua Gate 2011.jpg"),
    fp("Zhonghuamen Castle, Nanjing.jpg"),
  ],
  yuhuatai: [
    fp("Yuhuatai.JPG"),
    fp("Yuhuatai Martyrs Cemetery 2011.jpg"),
    fp("Rain Flower Terrace Nanjing.jpg"),
    "https://upload.wikimedia.org/wikipedia/commons/b/b5/Yuhuatai.JPG",
    fp("Nanjing Yuhuatai 2016.jpg"),
  ],
  zhongshan: [
    fp("PurpleMountain01.JPG"),
    fp("Purple Mountain Observatory.jpg"),
    fp("Zijinshan Nanjing 2011.jpg"),
    "https://upload.wikimedia.org/wikipedia/commons/f/fc/PurpleMountain01.JPG",
  ],
  "sun-yat-sen": [
    fp("Sun Yat-sen Mausoleum - 54400198691.jpg"),
    fp("Sun Yat-sen Mausoleum stairs.jpg"),
    fp("Nanjing Sun Yat-sen Mausoleum 2011.jpg"),
    "https://upload.wikimedia.org/wikipedia/commons/6/64/Sun_Yat-sen_Mausoleum_-_54400198691.jpg",
  ],
  "ming-xiaoling": [
    fp("Nanjing Ming Xiaoling 2017.11.11 08-10-27.jpg"),
    fp("Ming Xiaoling Mausoleum Spirit Way.jpg"),
    fp("MingXiaoling Animal Elephant 02.jpg"),
    fp("Stone Elephant Road - elephants - P1060469.JPG"),
  ],
  "pioneer-bookstore": [
    fp("Librairie Avant-Garde.jpg"),
    fp("Nanjing Pioneer Bookstore.jpg"),
    fp("Wutaishan Nanjing.jpg"),
    fp("Nanjing Wutaishan Gymnasium.jpg"),
  ],
  "yihe-road": [
    fp("No.15 in Yihe Road 2012-11.JPG"),
    fp("Yihe Road Nanjing 2012.jpg"),
    fp("Nanjing Yihe Road villas.jpg"),
    "https://upload.wikimedia.org/wikipedia/commons/e/e7/No.15_in_Yihe_Road_2012-11.JPG",
  ],
  "yijiu-cafe": [
    fp("No.15 in Yihe Road 2012-11.JPG"),
    fp("Nanjing plane tree street.jpg"),
    "https://upload.wikimedia.org/wikipedia/commons/e/e7/No.15_in_Yihe_Road_2012-11.JPG",
  ],
  "mochou-lake": [
    fp("Mochou Lake - cropped.jpg"),
    fp("Mochou Lake Nanjing 2011.jpg"),
    fp("Mochouhu Park.jpg"),
    "https://upload.wikimedia.org/wikipedia/commons/2/20/Mochou_Lake_-_cropped.jpg",
  ],
  "chaotian-palace": [
    fp("朝天宫·南京·航拍.jpg"),
    fp("Chaotian Palace Nanjing 2011.jpg"),
    fp("Chaotiangong Nanjing.jpg"),
    "https://upload.wikimedia.org/wikipedia/commons/7/73/%E6%9C%9D%E5%A4%A9%E5%AE%AB%C2%B7%E5%8D%97%E4%BA%AC%C2%B7%E8%88%AA%E6%8B%8D.jpg",
  ],
  qixia: [
    fp("Pilu Hall.jpg"),
    fp("Qixia Temple Nanjing 2011.jpg"),
    fp("Qixiashan autumn.jpg"),
    "https://upload.wikimedia.org/wikipedia/commons/2/2f/Pilu_Hall.jpg",
  ],
  "wutong-avenue": [
    fp("Zhongshan East Road Nanjing.jpg"),
    fp("Nanjing plane trees Zhongshan Road.jpg"),
    fp("Xinjiekou Nanjing.jpg"),
    fp("Nanjing street plane trees.jpg"),
  ],
};

async function wikiImages(lang, title) {
  const encoded = encodeURIComponent(title);
  const urls = [];
  try {
    const res = await fetch(
      `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encoded}`,
      { headers: { "User-Agent": UA } },
    );
    if (res.ok) {
      const data = await res.json();
      const src = data.originalimage?.source ?? data.thumbnail?.source;
      if (src) urls.push(src.startsWith("//") ? `https:${src}` : src);
    }
  } catch {
    /* ignore */
  }
  await new Promise((r) => setTimeout(r, 400));
  try {
    const res = await fetch(
      `https://${lang}.wikipedia.org/api/rest_v1/page/media-list/${encoded}`,
      { headers: { "User-Agent": UA } },
    );
    if (res.ok) {
      const data = await res.json();
      let n = 0;
      for (const item of data.items ?? []) {
        if (item.type !== "image") continue;
        let src = item.srcset?.at(-1)?.src ?? item.src;
        if (!src) continue;
        if (src.startsWith("//")) src = `https:${src}`;
        urls.push(src);
        n += 1;
        if (n >= 6) break;
      }
    }
  } catch {
    /* ignore */
  }
  return urls;
}

async function download(url, dest) {
  const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
  if (!res.ok) return false;
  const type = res.headers.get("content-type") ?? "";
  if (type.includes("html") || type.includes("pdf") || type.includes("svg")) return false;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < MIN) return false;
  if (buf[0] === 0x25 && buf[1] === 0x50) return false;
  await writeFile(dest, buf);
  return true;
}

await mkdir(OUT, { recursive: true });

const extraWiki = {
  yuhuatai: ["zh:雨花台"],
  "pioneer-bookstore": ["zh:先锋书店"],
  "wutong-avenue": ["en:Xuanwu,_Nanjing"],
  "confucius-temple": ["zh:夫子庙"],
  "mochou-lake": ["zh:莫愁湖"],
  "chaotian-palace": ["zh:朝天宫"],
  qixia: ["zh:栖霞寺"],
  "sun-yat-sen": ["zh:中山陵"],
  zhongshan: ["zh:紫金山"],
};

let miss = 0;
for (const [id, files] of Object.entries(FILL)) {
  let n = 0;
  const haveSizes = new Set();
  for (const i of [1, 2, 3]) {
    try {
      const info = await stat(join(OUT, `${id}-${i}.jpg`));
      if (info.size >= MIN) {
        n = i;
        haveSizes.add(info.size);
      } else break;
    } catch {
      break;
    }
  }
  if (n >= 3) {
    console.log(`skip ${id}`);
    continue;
  }
  const urls = [...files];
  for (const spec of extraWiki[id] ?? []) {
    const [lang, ...rest] = spec.split(":");
    urls.push(...(await wikiImages(lang, rest.join(":"))));
  }
  for (const url of urls) {
    if (n >= 3) break;
    const dest = join(OUT, `${id}-${n + 1}.jpg`);
    try {
      const saved = await download(url, dest);
      if (!saved) {
        await unlink(dest).catch(() => {});
        continue;
      }
      const size = (await stat(dest)).size;
      if (haveSizes.has(size)) {
        await unlink(dest).catch(() => {});
        continue;
      }
      haveSizes.add(size);
      n += 1;
      console.log(`  ${id}-${n}.jpg  ${Math.round(size / 1024)}KB`);
    } catch (err) {
      await unlink(dest).catch(() => {});
      console.log(`  fail ${id}: ${err.message}`);
    }
  }
  if (n < 3) {
    miss += 1;
    console.log(`STILL SHORT ${id}: ${n}/3`);
  }
}

const files = (await readdir(OUT)).filter((f) => f.endsWith(".jpg"));
console.log(`\nshort=${miss}  total files=${files.length}`);
