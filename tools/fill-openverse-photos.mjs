import { mkdir, writeFile, stat, unlink, readdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "images", "pois");
const UA = "NingKeManYiDian/1.0 (educational contest map photos)";
const MIN = 12000;

const IDS = [
  "xuanwu-lake",
  "xuanwu-lake-pavilion",
  "jiming-temple",
  "taicheng",
  "nanjing-museum",
  "presidential-palace",
  "confucius-temple",
  "laomendong",
  "zhonghua-gate",
  "yuhuatai",
  "zhongshan",
  "sun-yat-sen",
  "ming-xiaoling",
  "meihua-hill",
  "1912",
  "pioneer-bookstore",
  "yihe-road",
  "yijiu-cafe",
  "mochou-lake",
  "chaotian-palace",
  "dabaosi",
  "qixia",
  "wutong-avenue",
];

const QUERY = {
  "xuanwu-lake": "Xuanwu Lake Nanjing",
  "xuanwu-lake-pavilion": "Xuanwu Lake Nanjing island",
  "jiming-temple": "Jiming Temple Nanjing",
  taicheng: "Nanjing City Wall Taicheng",
  "nanjing-museum": "Nanjing Museum",
  "presidential-palace": "Presidential Palace Nanjing",
  "confucius-temple": "Fuzimiao Nanjing Confucius Temple",
  laomendong: "Laomendong Nanjing",
  "zhonghua-gate": "Zhonghua Gate Nanjing",
  yuhuatai: "Yuhuatai Nanjing",
  zhongshan: "Purple Mountain Nanjing",
  "sun-yat-sen": "Sun Yat-sen Mausoleum Nanjing",
  "ming-xiaoling": "Ming Xiaoling Nanjing",
  "meihua-hill": "Meihua Hill Nanjing plum",
  1912: "Nanjing 1912 district",
  "pioneer-bookstore": "Librairie Avant-Garde Nanjing bookstore",
  "yihe-road": "Yihe Road Nanjing villa",
  "yijiu-cafe": "Nanjing plane tree street villa",
  "mochou-lake": "Mochou Lake Nanjing",
  "chaotian-palace": "Chaotian Palace Nanjing",
  dabaosi: "Porcelain Tower Nanjing Dabaoen",
  qixia: "Qixia Temple Nanjing",
  "wutong-avenue": "Nanjing plane trees Zhongshan Road",
};

async function existing(id) {
  let n = 0;
  const sizes = new Set();
  for (const i of [1, 2, 3]) {
    try {
      const info = await stat(join(OUT, `${id}-${i}.jpg`));
      if (info.size >= MIN) {
        n = i;
        sizes.add(info.size);
      } else break;
    } catch {
      break;
    }
  }
  return { n, sizes };
}

async function openverseUrls(query) {
  const url = `https://api.openverse.org/v1/images/?q=${encodeURIComponent(query)}&page_size=12`;
  const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
  if (!res.ok) return [];
  const data = await res.json();
  const flickr = [];
  const other = [];
  for (const item of data.results ?? []) {
    const src = item.url;
    if (!src) continue;
    if (/wikimedia|wikipedia/.test(src)) continue; // currently 429
    if (/flickr/.test(src)) flickr.push(src);
    else other.push(src);
  }
  return [...flickr, ...other];
}

async function download(url, dest) {
  const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "follow" });
  if (!res.ok) return false;
  const type = res.headers.get("content-type") ?? "";
  if (!type.includes("image") || type.includes("svg") || type.includes("gif")) return false;
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.length < MIN) return false;
  await writeFile(dest, buf);
  return true;
}

await mkdir(OUT, { recursive: true });
let miss = 0;
for (const id of IDS) {
  const state = await existing(id);
  if (state.n >= 3) continue;
  const urls = await openverseUrls(QUERY[id]);
  for (const url of urls) {
    if (state.n >= 3) break;
    const dest = join(OUT, `${id}-${state.n + 1}.jpg`);
    try {
      const saved = await download(url, dest);
      if (!saved) {
        await unlink(dest).catch(() => {});
        continue;
      }
      const size = (await stat(dest)).size;
      if (state.sizes.has(size)) {
        await unlink(dest).catch(() => {});
        continue;
      }
      state.sizes.add(size);
      state.n += 1;
      console.log(`  ${id}-${state.n}.jpg  ${Math.round(size / 1024)}KB`);
    } catch (err) {
      await unlink(dest).catch(() => {});
      console.log(`  fail ${id}: ${err.message}`);
    }
  }
  if (state.n < 3) {
    miss += 1;
    console.log(`STILL SHORT ${id}: ${state.n}/3  urls=${urls.length}`);
  }
  await new Promise((r) => setTimeout(r, 250));
}

const files = (await readdir(OUT)).filter((f) => f.endsWith(".jpg") && !f.startsWith("_"));
console.log(`\nshort=${miss}  total=${files.length}`);
