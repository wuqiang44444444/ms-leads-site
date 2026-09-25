import {
  buildRequestBody,
  buildSubmission,
  detectProvider,
  interpretResponse,
  isPlaceholderEndpoint,
  validateLead,
} from "./form-endpoint.js";

const FIELD_ORDER = ["company", "contactName", "email", "phone", "interests", "overseasEntity", "message", "consent"];

export function initLeadForm(root = document) {
  const form = root.querySelector("[data-lead-form]");
  if (!form || form.dataset.bound === "true") return;
  form.dataset.bound = "true";

  const card = form.closest(".form-card") || form;
  const status = card.querySelector("[data-form-status]");
  const success = card.querySelector("[data-form-success]");
  const fields = card.querySelector("[data-form-fields]");
  const submitButton = form.querySelector("[data-submit]");
  const message = form.querySelector("[name='message']");
  const counter = form.querySelector("[data-message-count]");
  const preset = form.dataset.interest || "";

  if (preset) {
    const box = form.querySelector(`input[name="interest"][value="${CSS.escape(preset)}"]`);
    if (box) box.checked = true;
  }

  const updateCount = () => {
    if (!message || !counter) return;
    counter.textContent = `${message.value.length} / 1000`;
  };
  message?.addEventListener("input", updateCount);
  updateCount();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    await submitLead(form, { status, success, fields, submitButton, live: card.querySelector("[data-live]") });
  });

  const again = card.querySelector("[data-form-again]");
  again?.addEventListener("click", () => {
    form.reset();
    if (preset) {
      const box = form.querySelector(`input[name="interest"][value="${CSS.escape(preset)}"]`);
      if (box) box.checked = true;
    }
    clearErrors(form);
    hideStatus(status);
    success.hidden = true;
    fields.hidden = false;
    updateCount();
    form.querySelector("[name='company']")?.focus();
  });
}

async function submitLead(form, ui) {
  clearErrors(form);
  hideStatus(ui.status);

  if (form.querySelector("[name='website']")?.value) {
    showSuccess(ui);
    return;
  }

  const input = readForm(form);
  const errors = validateLead(input);
  if (Object.keys(errors).length) {
    showErrors(form, errors);
    return;
  }

  const endpoint = (form.dataset.endpoint || "").trim();
  const providerSetting = form.dataset.provider || "auto";
  if (isPlaceholderEndpoint(endpoint)) {
    showStatus(ui, "warn", "咨询通道尚未开通，这次填写的内容没有发送。请稍后再试。");
    return;
  }

  const provider = detectProvider(endpoint, providerSetting);
  const submission = buildSubmission({
    ...input,
    interestLabels: selectedLabels(form),
    pageLabel: form.dataset.pageLabel || document.title,
    pageUrl: window.location.href,
  });
  const body = buildRequestBody(provider, submission);

  setPending(ui.submitButton, true);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
    const payload = await readPayload(response);
    const result = interpretResponse(provider, response.status, payload);
    if (!result.ok) {
      showStatus(ui, "error", result.message || "没有发送成功。请稍后再试。");
      return;
    }
    showSuccess(ui);
  } catch {
    showStatus(
      ui,
      "error",
      "没有发送成功。请检查网络后再试。如果接收地址不允许浏览器直接访问，需要改用支持跨域提交的端点。",
    );
  } finally {
    setPending(ui.submitButton, false);
  }
}

function readForm(form) {
  const data = new FormData(form);
  return {
    company: String(data.get("company") || ""),
    contactName: String(data.get("contactName") || ""),
    email: String(data.get("email") || ""),
    phone: String(data.get("phone") || ""),
    interests: data.getAll("interest").map(String),
    overseasEntity: String(data.get("overseas") || ""),
    message: String(data.get("message") || ""),
    consent: data.get("consent") === "yes",
  };
}

function selectedLabels(form) {
  return [...form.querySelectorAll("input[name='interest']:checked")].map((input) => {
    const label = input.closest("label");
    return (label?.innerText || input.value).replace(/\s+/g, " ").trim();
  });
}

function showErrors(form, errors) {
  const summary = form.querySelector("[data-error-summary]");
  const items = [];

  for (const name of FIELD_ORDER) {
    if (!errors[name]) continue;
    const message = errors[name];
    const slot = form.querySelector(`[data-error-for="${name}"]`);
    if (slot) {
      slot.textContent = message;
      slot.hidden = false;
    }
    markInvalid(form, name, true);
    items.push({ name, message });
  }

  announce(form.closest(".form-card")?.querySelector("[data-live]"), "还有信息需要补充，请按提示修改后再提交。", "error");

  if (!summary) return;
  summary.replaceChildren();
  const title = document.createElement("p");
  title.textContent = "还有信息需要补充：";
  const list = document.createElement("ul");
  for (const item of items) {
    const li = document.createElement("li");
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = item.message;
    button.addEventListener("click", () => focusField(form, item.name));
    li.append(button);
    list.append(li);
  }
  summary.append(title, list);
  summary.hidden = false;
  summary.focus();
}

function clearErrors(form) {
  form.querySelectorAll("[data-error-for]").forEach((slot) => {
    slot.textContent = "";
    slot.hidden = true;
  });
  const summary = form.querySelector("[data-error-summary]");
  if (summary) {
    summary.replaceChildren();
    summary.hidden = true;
  }
  for (const name of FIELD_ORDER) markInvalid(form, name, false);
}

function markInvalid(form, name, invalid) {
  const controls =
    name === "interests"
      ? form.querySelectorAll("input[name='interest']")
      : name === "overseasEntity"
        ? form.querySelectorAll("input[name='overseas']")
        : form.querySelectorAll(`[name='${name}']`);
  controls.forEach((control) => {
    if (invalid) control.setAttribute("aria-invalid", "true");
    else control.removeAttribute("aria-invalid");
  });
}

function focusField(form, name) {
  const map = {
    interests: "input[name='interest']",
    overseasEntity: "input[name='overseas']",
    consent: "[name='consent']",
  };
  const control = form.querySelector(map[name] || `[name='${name}']`);
  control?.focus();
}

function showStatus(ui, tone, message) {
  const status = ui.status;
  if (!status) return;
  status.className = `form-status is-${tone}`;
  status.textContent = message;
  status.hidden = false;
  status.setAttribute("role", tone === "error" ? "alert" : "status");
  announce(ui.live, message, tone);
  status.focus();
}

function hideStatus(status) {
  if (!status) return;
  status.hidden = true;
  status.textContent = "";
  status.className = "form-status";
}

function showSuccess(ui) {
  hideStatus(ui.status);
  ui.fields.hidden = true;
  ui.success.hidden = false;
  const message = "已收到您的咨询。我们只会为了联系您、回复本次咨询而使用这些信息。";
  announce(ui.live, message, "status");
  ui.success.focus();
}

function announce(live, message, tone) {
  if (!live) return;
  live.setAttribute("aria-live", tone === "error" ? "assertive" : "polite");
  live.textContent = "";
  window.setTimeout(() => {
    live.textContent = message;
  }, 30);
}

function setPending(button, pending) {
  if (!button) return;
  button.disabled = pending;
  button.textContent = pending ? "正在提交…" : "提交咨询";
}

async function readPayload(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { error: text };
  }
}
