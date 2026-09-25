export function initNav() {
  const toggle = document.querySelector("[data-nav-toggle]");
  const panel = document.querySelector("[data-nav-panel]");
  if (!toggle || !panel || toggle.dataset.bound === "true") return;
  toggle.dataset.bound = "true";

  const close = ({ focusToggle = false } = {}) => {
    const wasOpen = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", "false");
    panel.classList.remove("is-open");
    if (focusToggle && wasOpen) toggle.focus();
  };

  const open = () => {
    toggle.setAttribute("aria-expanded", "true");
    panel.classList.add("is-open");
  };

  toggle.addEventListener("click", () => {
    if (toggle.getAttribute("aria-expanded") === "true") close();
    else open();
  });

  panel.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => close());
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") close({ focusToggle: true });
  });

  const desktop = window.matchMedia("(min-width: 960px)");
  const onChange = (event) => {
    if (event.matches) close();
  };
  if (typeof desktop.addEventListener === "function") desktop.addEventListener("change", onChange);
}
