/**
 * Plumber Bot — embeddable chat widget
 *
 * Drop one tag on any site:
 *   <script src="https://your-app.vercel.app/widget.js" defer></script>
 *
 * Optional data- attributes on the script tag:
 *   data-position="left"   bubble position: "right" (default) or "left"
 *   data-accent="#1d4ed8"  override bubble accent color
 */
(function () {
  "use strict";

  if (window.__plumberBotLoaded) return;
  window.__plumberBotLoaded = true;

  var script  = document.currentScript;
  var origin  = script ? new URL(script.src).origin : window.location.origin;
  var accent  = (script && script.getAttribute("data-accent")) || "#172554";
  var copper  = "#b45309";
  var isLeft  = (script && script.getAttribute("data-position")) === "left";
  var side    = isLeft ? "left:20px;" : "right:20px;";

  var WIDGET_URL = origin + "/widget";

  /* ─── Bubble button ─── */
  var bubble = document.createElement("button");
  bubble.setAttribute("aria-label", "Open Plumber Bot");
  bubble.style.cssText = [
    "position:fixed;bottom:24px;", side,
    "z-index:2147483646;",
    "width:56px;height:56px;",
    "border:none;border-radius:16px;",
    "background:", accent, ";",
    "color:#fff;cursor:pointer;",
    "box-shadow:0 4px 24px rgba(23,37,84,.45);",
    "display:flex;align-items:center;justify-content:center;",
    "transition:transform .15s ease, box-shadow .15s ease;",
    "outline:none;",
  ].join("");

  /* Wrench SVG icon */
  bubble.innerHTML = [
    '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"',
    ' stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
    '<path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77',
    'a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91',
    'a6 6 0 017.94-7.94l-3.76 3.76z"/>',
    "</svg>",
  ].join("");

  bubble.onmouseenter = function () {
    bubble.style.transform = "scale(1.08)";
    bubble.style.boxShadow = "0 8px 32px rgba(23,37,84,.55)";
  };
  bubble.onmouseleave = function () {
    bubble.style.transform = "scale(1)";
    bubble.style.boxShadow = "0 4px 24px rgba(23,37,84,.45)";
  };

  /* ─── Panel ─── */
  var panel = document.createElement("div");
  panel.style.cssText = [
    "position:fixed;bottom:92px;", side,
    "z-index:2147483647;",
    "width:380px;max-width:calc(100vw - 32px);",
    "height:600px;max-height:calc(100vh - 110px);",
    "border-radius:20px;overflow:hidden;",
    "box-shadow:0 16px 56px rgba(0,0,0,.22), 0 2px 8px rgba(0,0,0,.12);",
    "opacity:0;transform:translateY(16px) scale(.97);pointer-events:none;",
    "transition:opacity .22s cubic-bezier(.4,0,.2,1), transform .22s cubic-bezier(.4,0,.2,1);",
    "background:#fff;",
    "border:1px solid rgba(0,0,0,.08);",
  ].join("");

  /* Header bar (outside the iframe so it's always visible) */
  var header = document.createElement("div");
  header.style.cssText = [
    "display:flex;align-items:center;gap:10px;",
    "background:", accent, ";",
    "padding:12px 14px;",
    "height:52px;box-sizing:border-box;",
    "flex-shrink:0;",
  ].join("");

  /* Logo mark */
  var logo = document.createElement("div");
  logo.style.cssText = [
    "width:30px;height:30px;border-radius:9px;",
    "background:", copper, ";",
    "display:flex;align-items:center;justify-content:center;",
    "flex-shrink:0;",
  ].join("");
  logo.innerHTML = [
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none"',
    ' stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
    '<path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77',
    'a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91',
    'a6 6 0 017.94-7.94l-3.76 3.76z"/>',
    "</svg>",
  ].join("");

  /* Title block */
  var titleBlock = document.createElement("div");
  titleBlock.style.cssText = "flex:1;min-width:0;";
  titleBlock.innerHTML = [
    '<p style="margin:0;font-size:13px;font-weight:700;color:#fff;',
    'font-family:system-ui,-apple-system,sans-serif;line-height:1.2;">Plumber Bot</p>',
    '<div style="display:flex;align-items:center;gap:4px;margin-top:1px;">',
    '<span style="width:6px;height:6px;border-radius:50%;background:#34d399;flex-shrink:0;"></span>',
    '<span style="font-size:10px;color:rgba(147,197,253,1);font-family:system-ui,sans-serif;">',
    "Online · AI-powered support</span>",
    "</div>",
  ].join("");

  /* Close button */
  var closeBtn = document.createElement("button");
  closeBtn.setAttribute("aria-label", "Close chat");
  closeBtn.style.cssText = [
    "width:28px;height:28px;border:none;border-radius:8px;",
    "background:rgba(255,255,255,.15);color:#fff;cursor:pointer;",
    "display:flex;align-items:center;justify-content:center;",
    "flex-shrink:0;transition:background .15s ease;font-size:14px;",
  ].join("");
  closeBtn.innerHTML = [
    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none"',
    ' stroke="currentColor" stroke-width="2.5" stroke-linecap="round">',
    '<path d="M18 6L6 18M6 6l12 12"/>',
    "</svg>",
  ].join("");
  closeBtn.onmouseenter = function () { closeBtn.style.background = "rgba(255,255,255,.25)"; };
  closeBtn.onmouseleave = function () { closeBtn.style.background = "rgba(255,255,255,.15)"; };

  header.appendChild(logo);
  header.appendChild(titleBlock);
  header.appendChild(closeBtn);

  /* iframe — hides the WidgetChat's own header since we drew it above */
  var iframe = document.createElement("iframe");
  iframe.src = WIDGET_URL + "?embedded=1";
  iframe.title = "Plumber Bot Chat";
  iframe.style.cssText = "width:100%;border:none;display:block;height:calc(100% - 52px);";
  iframe.allow = "clipboard-write";

  /* Outer wrapper to stack header + iframe */
  var inner = document.createElement("div");
  inner.style.cssText = "display:flex;flex-direction:column;height:100%;";
  inner.appendChild(header);
  inner.appendChild(iframe);
  panel.appendChild(inner);

  /* ─── Open / close ─── */
  var isOpen = false;

  function setOpen(next) {
    isOpen = next;
    if (isOpen) {
      panel.style.opacity = "1";
      panel.style.transform = "translateY(0) scale(1)";
      panel.style.pointerEvents = "auto";
      /* swap bubble to X */
      bubble.innerHTML = [
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none"',
        ' stroke="currentColor" stroke-width="2.5" stroke-linecap="round">',
        '<path d="M18 6L6 18M6 6l12 12"/>',
        "</svg>",
      ].join("");
    } else {
      panel.style.opacity = "0";
      panel.style.transform = "translateY(16px) scale(.97)";
      panel.style.pointerEvents = "none";
      /* restore wrench */
      bubble.innerHTML = [
        '<svg width="22" height="22" viewBox="0 0 24 24" fill="none"',
        ' stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">',
        '<path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77',
        'a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91',
        'a6 6 0 017.94-7.94l-3.76 3.76z"/>',
        "</svg>",
      ].join("");
    }
  }

  bubble.addEventListener("click", function () { setOpen(!isOpen); });
  closeBtn.addEventListener("click", function () { setOpen(false); });

  /* Close on Escape */
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && isOpen) setOpen(false);
  });

  /* ─── Mount ─── */
  function mount() {
    document.body.appendChild(panel);
    document.body.appendChild(bubble);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", mount);
  } else {
    mount();
  }
})();
