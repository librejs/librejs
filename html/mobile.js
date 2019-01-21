window.isMobile = !("windows" in browser);
if (isMobile) {
  let s = document.createElement("script");
  s.src = "/html/fastclick.js";
  document.head.appendChild(s);
  window.addEventListener("DOMContentLoaded", e => FastClick.attach(document.body));
}
