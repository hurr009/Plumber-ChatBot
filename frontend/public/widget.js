/*
 * Plumber Bot embeddable widget loader.
 *
 * Usage on any website (single tag):
 *   <script src="https://your-frontend.vercel.app/widget.js" defer></script>
 *
 * Optional configuration via data- attributes on the script tag:
 *   data-accent="#2563eb"   accent color of the bubble
 *   data-position="right"   "right" (default) or "left"
 *
 * All chat UI lives inside an iframe -> zero CSS conflicts with the host page.
 */
(function () {
  "use strict";

  // Resolve the origin this script was served from, so the iframe points back
  // at the same deployment automatically.
  var current = document.currentScript;
  var origin = current
    ? new URL(current.src).origin
    : window.location.origin;

  var accent = (current && current.getAttribute("data-accent")) || "#2563eb";
  var position =
    (current && current.getAttribute("data-position")) === "left"
      ? "left"
      : "right";

  if (window.__plumberBotLoaded) return;
  window.__plumberBotLoaded = true;

  var WIDGET_URL = origin + "/widget";
  var sideStyle = position === "left" ? "left:20px;" : "right:20px;";

  // --- Floating bubble button ---
  var bubble = document.createElement("button");
  bubble.setAttribute("aria-label", "Open chat");
  bubble.style.cssText =
    "position:fixed;bottom:20px;" +
    sideStyle +
    "z-index:2147483646;width:60px;height:60px;border:none;border-radius:50%;" +
    "background:" +
    accent +
    ";color:#fff;cursor:pointer;box-shadow:0 6px 20px rgba(0,0,0,.25);" +
    "display:flex;align-items:center;justify-content:center;font-size:26px;" +
    "transition:transform .15s ease;";
  bubble.innerHTML = "💬";
  bubble.onmouseenter = function () {
    bubble.style.transform = "scale(1.08)";
  };
  bubble.onmouseleave = function () {
    bubble.style.transform = "scale(1)";
  };

  // --- Chat panel (iframe container) ---
  var panel = document.createElement("div");
  panel.style.cssText =
    "position:fixed;bottom:90px;" +
    sideStyle +
    "z-index:2147483647;width:380px;max-width:calc(100vw - 40px);" +
    "height:600px;max-height:calc(100vh - 120px);" +
    "border-radius:16px;overflow:hidden;box-shadow:0 12px 40px rgba(0,0,0,.3);" +
    "opacity:0;transform:translateY(12px) scale(.98);pointer-events:none;" +
    "transition:opacity .2s ease,transform .2s ease;background:#fff;";

  var iframe = document.createElement("iframe");
  iframe.src = WIDGET_URL;
  iframe.title = "Chat";
  iframe.style.cssText = "width:100%;height:100%;border:none;display:block;";
  iframe.allow = "clipboard-write";
  panel.appendChild(iframe);

  var open = false;
  function setOpen(next) {
    open = next;
    if (open) {
      panel.style.opacity = "1";
      panel.style.transform = "translateY(0) scale(1)";
      panel.style.pointerEvents = "auto";
      bubble.innerHTML = "✕";
    } else {
      panel.style.opacity = "0";
      panel.style.transform = "translateY(12px) scale(.98)";
      panel.style.pointerEvents = "none";
      bubble.innerHTML = "💬";
    }
  }

  bubble.addEventListener("click", function () {
    setOpen(!open);
  });

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
