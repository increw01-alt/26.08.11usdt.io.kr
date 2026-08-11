// 김프 계산기 (순수 클라이언트 — 입력값은 어디에도 전송되지 않음)
(function () {
  "use strict";
  var form = document.getElementById("kimp-calc");
  if (!form) return;

  var $krw = document.getElementById("calc-krw");
  var $usd = document.getElementById("calc-usd");
  var $fx = document.getElementById("calc-fx");
  var $out = document.getElementById("calc-out");
  var $desc = document.getElementById("calc-desc");

  function num(el) {
    var v = parseFloat(String(el.value).replace(/,/g, ""));
    return isFinite(v) && v > 0 ? v : null;
  }

  function fmtKrw(v) {
    return v.toLocaleString("ko-KR", { maximumFractionDigits: 1 }) + "원";
  }

  function update() {
    var krw = num($krw), usd = num($usd), fx = num($fx);
    if (krw === null || usd === null || fx === null) {
      $out.textContent = "—";
      $out.className = "big flat";
      $desc.textContent = "세 값을 모두 입력하면 김프가 계산됩니다.";
      return;
    }
    var base = usd * fx;              // 해외 가격의 원화 환산
    var premium = (krw / base - 1) * 100;
    var diff = krw - base;
    var sign = premium > 0 ? "+" : "";
    $out.textContent = sign + premium.toFixed(2) + "%";
    $out.className = "big " + (premium > 0.05 ? "pos" : premium < -0.05 ? "neg" : "flat");
    var label = premium > 0.05 ? "프리미엄(김프)" : premium < -0.05 ? "역프리미엄(역프)" : "해외가와 거의 동일";
    $desc.textContent = "해외 원화 환산가 " + fmtKrw(base) + " 대비 " +
      (diff >= 0 ? "+" : "") + fmtKrw(Math.abs(diff) * (diff < 0 ? -1 : 1)) + " → " + label;
  }

  [$krw, $usd, $fx].forEach(function (el) {
    el.addEventListener("input", update);
  });
  update();
})();
