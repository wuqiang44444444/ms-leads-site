import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildRequestBody,
  buildSubmission,
  detectProvider,
  interpretResponse,
  isPlaceholderEndpoint,
  validateLead,
} from "../src/scripts/form-endpoint.js";
import { astroBase, pageUrl } from "../src/lib/urls.mjs";

const validLead = {
  company: "北海示例科技",
  contactName: "林可",
  email: "ke.lin@example-corp.com",
  phone: "",
  interests: ["azure-openai"],
  overseasEntity: "yes",
  message: "希望评估海外客服场景",
  consent: true,
};

describe("isPlaceholderEndpoint", () => {
  it("treats the shipped placeholder and incomplete values as not configured", () => {
    assert.equal(isPlaceholderEndpoint(""), true);
    assert.equal(isPlaceholderEndpoint("http://formspree.io/f/abcdefgh"), true);
    assert.equal(isPlaceholderEndpoint("https://formspree.io/f/yourFormId"), true);
    assert.equal(isPlaceholderEndpoint("https://open.feishu.cn/open-apis/bot/v2/hook/your-token"), true);
    assert.equal(isPlaceholderEndpoint("https://hooks.example.com/lead"), true);
    assert.equal(isPlaceholderEndpoint("not a url"), true);
  });

  it("accepts https endpoints that are not placeholders", () => {
    assert.equal(isPlaceholderEndpoint("https://formspree.io/f/xpwzgkqy"), false);
    assert.equal(
      isPlaceholderEndpoint("https://open.feishu.cn/open-apis/bot/v2/hook/a1b2c3d4-e5f6-7890-abcd-ef1234567890"),
      false,
    );
  });
});

describe("detectProvider", () => {
  it("detects known hosts and honors an explicit provider", () => {
    assert.equal(detectProvider("https://formspree.io/f/xpwzgkqy", "auto"), "formspree");
    assert.equal(detectProvider("https://open.feishu.cn/open-apis/bot/v2/hook/abc", "auto"), "feishu");
    assert.equal(detectProvider("https://open.larksuite.com/open-apis/bot/v2/hook/abc", "auto"), "feishu");
    assert.equal(detectProvider("https://leads.example.net/hook", "auto"), "json");
    assert.equal(detectProvider("https://leads.example.net/hook", "feishu"), "feishu");
  });
});

describe("validateLead", () => {
  it("accepts a complete inquiry and rejects an empty one", () => {
    assert.deepEqual(validateLead(validLead), {});
    const errors = validateLead({
      company: " ",
      contactName: "",
      email: "not-an-email",
      phone: "12",
      interests: [],
      overseasEntity: "",
      message: "",
      consent: false,
    });
    assert.equal(errors.company, "请填写公司名称");
    assert.equal(errors.contactName, "请填写联系人姓名");
    assert.equal(errors.email, "请填写有效的工作邮箱");
    assert.equal(errors.phone, "电话格式不正确，可以留空");
    assert.equal(errors.interests, "请至少选择一项感兴趣的产品");
    assert.equal(errors.overseasEntity, "请选择是否设有海外主体");
    assert.equal(errors.consent, "请阅读并勾选同意隐私说明");
  });
});

describe("request bodies", () => {
  it("builds a flat payload for Formspree and a text message for Feishu", () => {
    const submission = buildSubmission({
      ...validLead,
      interestLabels: ["Azure OpenAI"],
      pageLabel: "Azure OpenAI",
      pageUrl: "https://wuqiang44444444.github.io/ms-leads-site/azure-openai/",
    });
    const formspree = buildRequestBody("formspree", submission);
    assert.equal(formspree._replyto, "ke.lin@example-corp.com");
    assert.match(formspree._subject, /北海示例科技/);
    const feishu = buildRequestBody("feishu", submission);
    assert.equal(feishu.msg_type, "text");
    assert.match(feishu.content.text, /公司：北海示例科技/);
    assert.match(feishu.content.text, /有海外主体/);
    assert.equal(feishu.content.text.includes("利润"), false);
  });
});

describe("interpretResponse", () => {
  it("treats Feishu's non-zero code as failure even when HTTP is 200", () => {
    assert.equal(interpretResponse("feishu", 200, { code: 0 }).ok, true);
    assert.equal(interpretResponse("feishu", 200, { code: 19001 }).ok, false);
    assert.equal(interpretResponse("json", 422, { error: "<html>no</html>" }).message.includes("<"), false);
    assert.equal(interpretResponse("formspree", 200, { ok: true }).ok, true);
  });
});

describe("site urls", () => {
  it("keeps the GitHub Pages project path", () => {
    const config = {
      siteOrigin: "https://wuqiang44444444.github.io",
      basePath: "/ms-leads-site/",
    };
    assert.equal(astroBase(config), "/ms-leads-site");
    assert.equal(pageUrl(config, ""), "https://wuqiang44444444.github.io/ms-leads-site/");
    assert.equal(pageUrl(config, "azure-openai/"), "https://wuqiang44444444.github.io/ms-leads-site/azure-openai/");
  });
});
