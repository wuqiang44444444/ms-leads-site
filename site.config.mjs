/**
 * 站点唯一配置。
 * 品牌名称、隐私联系邮箱、咨询表单接收地址、正式站点 URL 都在这里修改。
 * 各页文案见 src/content/pages.mjs；合规原文见 src/content/compliance.mjs。
 *
 * 表单地址也可以在构建时用环境变量覆盖（公开仓库推荐用 GitHub Actions Secret，
 * 避免把飞书 / Lark Webhook 写进 Git）：
 *   FORM_ENDPOINT  完整 HTTPS 地址
 *   FORM_PROVIDER  auto | formspree | feishu | json
 */

function readEnv(name) {
  const value = process.env[name];
  if (typeof value !== "string") return "";
  return value.trim();
}

export const siteConfig = {
  brandName: "云桥",
  brandFullName: "云桥信息技术",
  brandTagline: "微软云解决方案合作伙伴",
  /** 留空则隐私说明页改为引导访客用咨询表单提出个人信息请求。上线前请改成可接收邮件的地址。 */
  privacyEmail: "",
  formEndpoint: readEnv("FORM_ENDPOINT") || "https://formspree.io/f/yourFormId",
  formProvider: readEnv("FORM_PROVIDER") || "auto",
  siteOrigin: "https://wuqiang44444444.github.io",
  basePath: "/ms-leads-site/",
  updated: "2026-09-25",
};
