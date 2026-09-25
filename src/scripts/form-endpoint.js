const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+0-9][0-9\s().-]{5,19}$/;

const PLACEHOLDER_MARKERS = [
  "yourformid",
  "your-form-id",
  "your_form_id",
  "your-token",
  "your_token",
  "replace_me",
  "replace-me",
  "placeholder",
  "example.com",
  "example.org",
];

export function isPlaceholderEndpoint(url) {
  if (typeof url !== "string") return true;
  const value = url.trim();
  if (!value) return true;

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    return true;
  }

  if (parsed.protocol !== "https:") return true;
  if (parsed.username || parsed.password) return true;

  const haystack = `${parsed.hostname}${parsed.pathname}${parsed.search}`.toLowerCase();
  return PLACEHOLDER_MARKERS.some((marker) => haystack.includes(marker));
}

export function detectProvider(url, configured = "auto") {
  const choice = String(configured || "auto")
    .trim()
    .toLowerCase();
  if (choice && choice !== "auto") {
    if (choice === "formspree" || choice === "feishu" || choice === "json") return choice;
  }

  let hostname = "";
  try {
    hostname = new URL(url).hostname.toLowerCase();
  } catch {
    return "json";
  }

  if (hostname === "formspree.io" || hostname.endsWith(".formspree.io")) return "formspree";
  if (hostname === "open.feishu.cn" || hostname === "open.larksuite.com") return "feishu";
  return "json";
}

export function validateLead(input) {
  const errors = {};
  const company = String(input.company || "");
  const contactName = String(input.contactName || "");
  const email = String(input.email || "");
  const phone = String(input.phone || "");
  const message = String(input.message || "");
  const interests = Array.isArray(input.interests) ? input.interests : [];

  if (!company.trim()) errors.company = "请填写公司名称";
  else if (company.trim().length > 200) errors.company = "公司名称请控制在 200 字以内";

  if (!contactName.trim()) errors.contactName = "请填写联系人姓名";
  else if (contactName.trim().length > 80) errors.contactName = "姓名请控制在 80 字以内";

  if (!email.trim()) errors.email = "请填写工作邮箱";
  else if (email.trim().length > 200 || !EMAIL_RE.test(email.trim())) {
    errors.email = "请填写有效的工作邮箱";
  }

  if (phone.trim() && !PHONE_RE.test(phone.trim())) {
    errors.phone = "电话格式不正确，可以留空";
  }

  if (!interests.length) errors.interests = "请至少选择一项感兴趣的产品";

  if (input.overseasEntity !== "yes" && input.overseasEntity !== "no") {
    errors.overseasEntity = "请选择是否设有海外主体";
  }

  if (message.trim().length > 1000) errors.message = "留言请控制在 1000 字以内";
  if (!input.consent) errors.consent = "请阅读并勾选同意隐私说明";

  return errors;
}

export function buildSubmission(input) {
  const overseasEntity = input.overseasEntity === "yes" ? "yes" : "no";
  return {
    company: String(input.company || "").trim(),
    contactName: String(input.contactName || "").trim(),
    email: String(input.email || "").trim(),
    phone: String(input.phone || "").trim(),
    interests: Array.isArray(input.interests) ? input.interests.slice() : [],
    interestsText: Array.isArray(input.interestLabels) ? input.interestLabels.join("、") : "",
    overseasEntity,
    overseasEntityText: overseasEntity === "yes" ? "有海外主体" : "没有海外主体",
    message: String(input.message || "").trim(),
    consent: true,
    consentText: "同意仅为联系本人并回复本次咨询而使用所提交的信息",
    sourcePage: String(input.pageLabel || ""),
    pageUrl: String(input.pageUrl || ""),
  };
}

export function buildRequestBody(provider, submission) {
  if (provider === "feishu") {
    const lines = [
      "【网站咨询】",
      `页面：${submission.sourcePage}`,
      `链接：${submission.pageUrl}`,
      `公司：${submission.company}`,
      `联系人：${submission.contactName}`,
      `工作邮箱：${submission.email}`,
      `电话：${submission.phone || "未填写"}`,
      `感兴趣的产品：${submission.interestsText}`,
      `海外主体：${submission.overseasEntityText}`,
      `留言：${submission.message || "无"}`,
      `同意：${submission.consentText}`,
    ];
    return {
      msg_type: "text",
      content: {
        text: lines.join("\n"),
      },
    };
  }

  const body = { ...submission };
  if (provider === "formspree") {
    body._subject = `网站咨询：${submission.company} / ${submission.interestsText}`;
    body._replyto = submission.email;
  }
  return body;
}

export function interpretResponse(provider, status, payload) {
  if (status < 200 || status >= 300) {
    const detail = extractErrorDetail(payload);
    return {
      ok: false,
      message: detail || `没有发送成功（${status}）。请稍后再试。`,
    };
  }

  if (provider === "feishu" && payload && typeof payload === "object") {
    if (typeof payload.code === "number" && payload.code !== 0) {
      return { ok: false, message: "接收端没有接受这次咨询，请稍后再试。" };
    }
    if (typeof payload.StatusCode === "number" && payload.StatusCode !== 0) {
      return { ok: false, message: "接收端没有接受这次咨询，请稍后再试。" };
    }
  }

  return { ok: true, message: "" };
}

function extractErrorDetail(payload) {
  if (!payload || typeof payload !== "object") return "";
  if (typeof payload.error === "string") return clip(payload.error);
  if (Array.isArray(payload.errors)) {
    const text = payload.errors
      .map((item) => (item && typeof item.message === "string" ? item.message : ""))
      .filter(Boolean)
      .join(" ");
    return clip(text);
  }
  if (typeof payload.msg === "string") return clip(payload.msg);
  return "";
}

function clip(value) {
  const text = value.replace(/\s+/g, " ").trim();
  if (!text || /<[^>]+>/.test(text)) return "";
  return text.length > 180 ? `${text.slice(0, 180)}…` : text;
}
