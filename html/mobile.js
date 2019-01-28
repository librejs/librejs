window.isMobile = !("windows" in browser);
if (isMobile) {
  document.documentElement.classList.add("mobile");
  let s = document.createElement("script");
  s.src = "/html/fastclick.js";
  document.head.appendChild(s);
  window.addEventListener("load", e => FastClick.attach(document.body));
}
