# 云桥 · 微软云获客网站

面向中国企业海外主体与外商投资企业的静态获客站。主推在**客户自有 Azure 订阅**中开通 Azure OpenAI，并介绍 Microsoft 365 国际版、Windows、Microsoft Copilot、GitHub Copilot、Azure 与 Power BI。

本仓库是公开站点，不包含线索打分、内部利润或最低消费等销售手册内容。

默认品牌名「云桥 / 云桥信息技术」只是占位，上线前请改成贵司法定名称。

## 页面

| 路径 | 内容 |
| --- | --- |
| `/` | 首页，Azure OpenAI 为主推，并链到全部产品 |
| `/azure-openai/` | Azure OpenAI：场景、为何走 CSP、开通步骤、合规说明、常见问题 |
| `/m365/` | Microsoft 365 / Teams / Office（国际版） |
| `/windows/` | Windows 正版授权，以及 Windows 10 停止支持后的升级 |
| `/copilot/` | Microsoft 365 Copilot |
| `/github-copilot/` | GitHub Copilot |
| `/azure/` | Azure 全球云与 Power BI |
| `/privacy/` | 隐私说明 |

正式地址按当前仓库计算为：

`https://wuqiang44444444.github.io/ms-leads-site/`

## 本地预览

```bash
npm ci
npm test
npm run build
npm run preview
```

开发时：

```bash
npm run dev
```

因为站点配置了 GitHub Pages 项目路径，本地也要带前缀打开：

`http://localhost:4321/ms-leads-site/`

## 目录

```text
site.config.mjs          品牌、隐私邮箱、表单接收地址、站点 URL（只改这一处配置）
src/content/pages.mjs    首页与各产品页文案
src/content/compliance.mjs  页脚与 Azure OpenAI 页的合规原文
src/pages/               路由
src/components/          页头、页脚、表单、产品页模板
src/styles/global.css    样式
public/                  favicon、构建时生成的 sitemap.xml 与 robots.txt、og.png
.github/workflows/pages.yml  推送到 main 后部署到 GitHub Pages
```

## 修改文案

- 产品说明、痛点、实施步骤、常见问题：编辑 `src/content/pages.mjs`。
- 法务要求放在全站页脚和 Azure OpenAI 页面的句子：编辑 `src/content/compliance.mjs`。不要写成绝对化承诺（例如“最安全”“零风险”“行业第一”）。
- 品牌名称、标语：编辑 `site.config.mjs` 的 `brandName`、`brandFullName`、`brandTagline`。页面标题会跟着品牌名变化。
- 隐私说明里的机构名称使用 `brandFullName`。保存期限写在 `src/pages/privacy.astro`，若与法务口径不一致，直接改该段。

改完后执行 `npm run build`。构建会重新生成 sitemap，并检查合规句子仍在、内部销售规则没有被写进页面。

## 配置咨询表单

表单在每个页面底部。字段为：公司名称、联系人姓名、工作邮箱、电话（选填）、产品兴趣（多选）、是否设有海外主体、留言（选填），以及必须勾选的隐私同意。

接收地址**只**在 `site.config.mjs` 配置：

```js
formEndpoint: "https://formspree.io/f/yourFormId",
formProvider: "auto",
```

当前仓库里的 `yourFormId` 是占位符。构建结果会带上 `data-configured="false"`。访客填完并通过校验后，页面提示「咨询通道尚未开通」，**不会发出网络请求**。

`formProvider`：

| 值 | 行为 |
| --- | --- |
| `auto` | `formspree.io` 按 Formspree 提交；`open.feishu.cn` 与 `open.larksuite.com` 按飞书 / Lark 文本消息提交；其他 HTTPS 地址提交 JSON |
| `formspree` | 强制 Formspree 字段（含邮件主题） |
| `feishu` | 强制 `{ msg_type: "text", content: { text } }` |
| `json` | 强制提交字段 JSON |

### 方式 A：Formspree（静态站点推荐）

1. 在 [Formspree](https://formspree.io) 新建表单，得到类似 `https://formspree.io/f/abcdefgh` 的地址。
2. 把 `site.config.mjs` 里的 `formEndpoint` 换成该地址。
3. 提交并推送到 `main`，等 GitHub Actions 部署完成。

Formspree 允许浏览器跨域提交，因此页面可以显示成功或失败。

### 方式 B：用 GitHub Secret，避免把地址写进公开仓库

适合飞书 / Lark Webhook。Webhook 出现在公开仓库里时，任何人都能往群里发消息。

1. 打开仓库 **Settings → Secrets and variables → Actions**。
2. 新建 `FORM_ENDPOINT`（完整 HTTPS 地址）和可选的 `FORM_PROVIDER`（`auto`、`formspree`、`feishu` 或 `json`）。
3. 重新运行 **Deploy GitHub Pages** 工作流，或再推一次 `main`。

环境变量非空时覆盖 `site.config.mjs` 里的同名字段。工作流只在构建时注入，源码文件可以继续保留占位符。

### 飞书 / Lark 与浏览器跨域

页面会向 Webhook 发送飞书文本消息格式。飞书和 Lark 的自定义机器人通常**不返回**浏览器跨域许可，纯静态页面往往收不到成功响应，表单会显示发送失败。可选做法：

- 使用 Formspree 收表，再在 Formspree 里把通知转到飞书；或
- 使用允许浏览器跨域、并能把 JSON 转给飞书的转发地址，把 `formProvider` 设为 `feishu` 或 `json`。

### 隐私联系邮箱

`site.config.mjs` 的 `privacyEmail` 默认为空。此时隐私说明引导访客用咨询表单提交“个人信息请求”。填上可接收邮件的地址后，隐私说明会改为显示该邮箱。不要使用 `example.com`。

## 启用 GitHub Pages

工作流文件：`.github/workflows/pages.yml`。它在 pull request 上只构建和测试；推送到 `main` 时额外部署。

仓库管理员需要手动做一次：

1. 把本分支合并到 `main`。
2. 打开仓库 **Settings → Pages → Build and deployment**。
3. **Source** 选 **GitHub Actions**（不是 Deploy from a branch）。
4. 打开 **Actions**，确认 **Deploy GitHub Pages** 成功。
5. 站点地址为 `https://wuqiang44444444.github.io/ms-leads-site/`。

若仓库改名或换了所有者，同时修改 `site.config.mjs` 的 `siteOrigin` 与 `basePath`，再重新构建。`astro.config.mjs` 会读取这两个值。

## 构建检查

`npm test` 覆盖占位地址判断、校验和飞书消息格式。

`npm run build` 在静态导出后检查：8 个内容页加 404 均有中文标题、表单字段和合规原文；不包含线索分级、利润口径和绝对化用语；占位配置下表单不会带 `action` 直接外发。
