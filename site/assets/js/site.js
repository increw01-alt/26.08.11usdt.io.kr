// 테마 토글
(function () {
  var btn = document.getElementById("theme-toggle");
  if (!btn) return;
  function current() {
    // 사이트 기본 테마는 다크 (디자인 시안 기준)
    return document.documentElement.getAttribute("data-theme") || "dark";
  }
  btn.addEventListener("click", function () {
    var next = current() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
    document.dispatchEvent(new CustomEvent("themechange"));
  });
})();
