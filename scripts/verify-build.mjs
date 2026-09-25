import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { siteConfig } from "../site.config.mjs";
import { isPlaceholderEndpoint } from "../src/scripts/form-endpoint.js";
import { pageUrl } from "../src/lib/urls.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(root, "dist");

const pages = [
  "index.html",
  "azure-openai/index.html",
  "m365/index.html",
  "windows/index.html",
  "copilot/index.html",
  "github-copilot/index.html",
  "azure/index.html",
  "privacy/index.html",
  "404.html",
];

const phrases = [
  "开通在客户自有的 Azure 订阅中",
  "我们收取实施、运维与额度管理费用",
  "我们不转售、不共享 API 密钥，也不提供 API 中转",
  "中国企业的海外主体，以及外商投资企业",
  "OpenAI、Claude 的官方服务不向中国大陆提供",
  "可能需要完成算法备案及大模型备案，相关义务由客户自行承担",
  "我们可以就国产模型方案提供咨询",
  "与由世纪互联运营的 Microsoft 365 中国版是不同产品",
  "我们不宣称数据本地化、数据存储于中国境内、符合信创要求或通过等级保护（等保）认证",
  "本网站不是微软官方网站",
];

const banned = [
  "lorem ipsum",
  "最安全",
  "零风险",
  "行业第一",
  "全国第一",
  "100%",
  "利润主要",
  "最低月度",
  "坏账",
  "A 类",
  "B 类",
  "C 类",
  "满分",
  "打分项",
  "24 小时",
  "线索分级",
  "直接剔除",
];

const titles = new Set();

for (const relative of pages) {
  const file = resolve(dist, relative);
  assert.equal(existsSync(file), true, `missing ${relative}`);
  const html = readFileSync(file, "utf8");
  assert.match(html, /lang="zh-CN"/, `${relative} language`);
  assert.match(html, /<title>[^<]+<\/title>/, `${relative} title`);
  const title = html.match(/<title>([^<]+)<\/title>/)[1];
  assert.equal(titles.has(title), false, `duplicate title ${title}`);
  titles.add(title);
  assert.match(html, /name="description"/, `${relative} description`);
  assert.match(html, /name="keywords"/, `${relative} keywords`);
  assert.match(html, /property="og:title"/, `${relative} open graph`);
  assert.match(html, /\/ms-leads-site\//, `${relative} base path`);
  for (const phrase of phrases) {
    assert.equal(html.includes(phrase), true, `${relative} missing phrase: ${phrase}`);
  }
  const visible = html
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .toLowerCase();
  for (const term of banned) {
    assert.equal(visible.includes(term.toLowerCase()), false, `${relative} contains internal or banned copy: ${term}`);
  }
  if (relative !== "404.html") {
    assert.match(html, /name="robots" content="index,follow"/, `${relative} robots`);
  }
  assert.match(html, /name="company"/, `${relative} company field`);
  assert.match(html, /name="contactName"/, `${relative} contact field`);
  assert.match(html, /name="email"/, `${relative} email field`);
  assert.match(html, /name="phone"/, `${relative} phone field`);
  assert.match(html, /name="interest"/, `${relative} interest field`);
  assert.match(html, /name="overseas"/, `${relative} overseas field`);
  assert.match(html, /name="message"/, `${relative} message field`);
  assert.match(html, /name="consent"/, `${relative} consent field`);
  assert.match(html, /privacy\//, `${relative} privacy link`);
  assert.doesNotMatch(html, /<form[^>]*\saction=/, `${relative} should not post without JavaScript`);
}

const azure = readFileSync(resolve(dist, "azure-openai/index.html"), "utf8");
assert.match(azure, /id="compliance"/);
assert.match(azure, /id="scenarios"/);
assert.match(azure, /约两周|两周/);

const windows = readFileSync(resolve(dist, "windows/index.html"), "utf8");
assert.match(windows, /2025 年 10 月 14 日/);

const home = readFileSync(resolve(dist, "index.html"), "utf8");
if (isPlaceholderEndpoint(siteConfig.formEndpoint)) {
  assert.match(home, /data-configured="false"/);
  assert.match(home, /yourFormId/);
} else {
  assert.match(home, /data-configured="true"/);
}

const sitemap = readFileSync(resolve(dist, "sitemap.xml"), "utf8");
for (const path of ["", "azure-openai/", "m365/", "windows/", "copilot/", "github-copilot/", "azure/", "privacy/"]) {
  assert.equal(sitemap.includes(pageUrl(siteConfig, path)), true, `sitemap missing ${path}`);
}

const robots = readFileSync(resolve(dist, "robots.txt"), "utf8");
assert.match(robots, /Sitemap: https:\/\/wuqiang44444444\.github\.io\/ms-leads-site\/sitemap\.xml/);
assert.equal(existsSync(resolve(dist, "favicon.svg")), true);
assert.equal(existsSync(resolve(dist, "og.png")), true);

console.log(`Verified ${pages.length} pages.`);
