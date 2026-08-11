// 비교 테이블 정렬·검색 (서버 렌더링된 행을 클라이언트에서 조작)
(function () {
  "use strict";
  var table = document.getElementById("compare-table");
  if (!table) return;
  var tbody = table.querySelector("tbody");
  var search = document.getElementById("compare-search");
  var count = document.getElementById("compare-count");

  function rows() {
    return Array.prototype.slice.call(tbody.querySelectorAll("tr"));
  }

  // 검색 필터
  if (search) {
    search.addEventListener("input", function () {
      var q = search.value.trim().toLowerCase();
      var visible = 0;
      rows().forEach(function (tr) {
        var hit = !q || (tr.getAttribute("data-name") || "").toLowerCase().indexOf(q) >= 0;
        tr.style.display = hit ? "" : "none";
        if (hit) visible++;
      });
      if (count) count.textContent = visible + "개 표시 중";
    });
  }

  // 헤더 클릭 정렬
  var dir = {};
  table.querySelectorAll("th[data-sort]").forEach(function (th) {
    th.style.cursor = "pointer";
    th.addEventListener("click", function () {
      var key = th.getAttribute("data-sort");
      dir[key] = -(dir[key] || -1);  // 첫 클릭 내림차순
      var sorted = rows().sort(function (a, b) {
        var av = parseFloat(a.getAttribute("data-" + key));
        var bv = parseFloat(b.getAttribute("data-" + key));
        if (isNaN(av)) av = -Infinity;
        if (isNaN(bv)) bv = -Infinity;
        return (av - bv) * dir[key];
      });
      sorted.forEach(function (tr) { tbody.appendChild(tr); });
      table.querySelectorAll("th[data-sort]").forEach(function (h) {
        h.textContent = h.textContent.replace(/ [▲▼]$/, "");
      });
      th.textContent = th.textContent.replace(/ [▲▼]$/, "") + (dir[key] > 0 ? " ▲" : " ▼");
    });
  });
})();
