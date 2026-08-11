// usdt.io.kr 계산기 모음 (순수 클라이언트 — 입력값은 어디에도 전송되지 않음)
(function () {
  "use strict";

  function num(el) {
    if (!el) return null;
    var v = parseFloat(String(el.value).replace(/,/g, ""));
    return isFinite(v) ? v : null;
  }
  function pos(el) {
    var v = num(el);
    return v !== null && v > 0 ? v : null;
  }
  function fmt(v, dec) {
    if (v === null || !isFinite(v)) return "—";
    return v.toLocaleString("ko-KR", { maximumFractionDigits: dec, minimumFractionDigits: 0 });
  }
  function $(id) { return document.getElementById(id); }
  function on(ids, fn) {
    ids.forEach(function (id) {
      var el = $(id);
      if (el) el.addEventListener("input", fn);
    });
    fn();
  }

  // ── 변환 계산기 (원화 ↔ 달러 ↔ USDT) ─────────────────────────
  if ($("conv-form")) {
    var lock = false;
    function convFrom(src) {
      if (lock) return;
      lock = true;
      var fx = pos($("conv-fx")), up = pos($("conv-usdtp"));
      var krw = num($("conv-krw")), usd = num($("conv-usd")), usdt = num($("conv-usdt"));
      if (fx && up) {
        if (src === "usd" && usd !== null) {
          krw = usd * fx;
          $("conv-krw").value = fmt(krw, 0);
          $("conv-usdt").value = fmt(krw / up, 4);
        } else if (src === "usdt" && usdt !== null) {
          krw = usdt * up;
          $("conv-krw").value = fmt(krw, 0);
          $("conv-usd").value = fmt(krw / fx, 2);
        } else if (krw !== null) {
          $("conv-usd").value = fmt(krw / fx, 2);
          $("conv-usdt").value = fmt(krw / up, 4);
        }
        var diff = up - fx;
        $("conv-note").textContent =
          "현재 1 USDT(" + fmt(up, 1) + "원)는 달러 환율(" + fmt(fx, 1) + "원)보다 " +
          fmt(Math.abs(diff), 1) + "원 " + (diff >= 0 ? "비쌉니다 (김프 반영)" : "쌉니다 (역프 반영)") +
          ". 달러↔원은 환율, USDT↔원은 업비트 시세 기준입니다.";
      }
      lock = false;
    }
    on(["conv-krw"], function () { convFrom("krw"); });
    on(["conv-usd"], function () { convFrom("usd"); });
    on(["conv-usdt"], function () { convFrom("usdt"); });
    on(["conv-fx", "conv-usdtp"], function () { convFrom("krw"); });
  }

  // ── 평단가·물타기 계산기 ─────────────────────────────────────
  if ($("avg-form")) {
    on(["avg-q1", "avg-p1", "avg-q2", "avg-p2"], function () {
      var q1 = pos($("avg-q1")), p1 = pos($("avg-p1"));
      var q2 = pos($("avg-q2")), p2 = pos($("avg-p2"));
      var out = $("avg-out"), desc = $("avg-desc");
      if (!q1 || !p1 || !q2 || !p2) {
        out.textContent = "—";
        desc.textContent = "네 값을 모두 입력하면 새 평단가가 계산됩니다.";
        return;
      }
      var total = q1 + q2;
      var cost = q1 * p1 + q2 * p2;
      var avg = cost / total;
      var change = (avg / p1 - 1) * 100;
      out.textContent = fmt(avg, avg >= 100 ? 0 : 4) + "원";
      desc.textContent = "총 " + fmt(total, 8) + "개 · 총 투자금 " + fmt(cost, 0) + "원 · 기존 평단 대비 " +
        (change >= 0 ? "+" : "") + change.toFixed(2) + "%";
    });
  }

  // ── 수익률 계산기 ────────────────────────────────────────────
  if ($("pf-form")) {
    on(["pf-buy", "pf-sell", "pf-qty", "pf-fee"], function () {
      var buy = pos($("pf-buy")), sell = pos($("pf-sell")), qty = pos($("pf-qty"));
      var fee = num($("pf-fee"));
      fee = fee === null || fee < 0 ? 0 : fee / 100;
      var out = $("pf-out"), desc = $("pf-desc"), be = $("pf-breakeven");
      if (!buy || !sell || !qty) {
        out.textContent = "—";
        out.className = "big flat";
        desc.textContent = "매수가·매도가·수량을 입력하면 손익이 계산됩니다.";
        be.textContent = "";
        return;
      }
      var cost = buy * qty * (1 + fee);
      var proceeds = sell * qty * (1 - fee);
      var pnl = proceeds - cost;
      var rate = (pnl / cost) * 100;
      out.textContent = (pnl >= 0 ? "+" : "") + fmt(pnl, 0) + "원";
      out.className = "big " + (pnl > 0 ? "pos" : pnl < 0 ? "neg" : "flat");
      desc.textContent = "수익률 " + (rate >= 0 ? "+" : "") + rate.toFixed(2) + "% · 총 매수 " +
        fmt(cost, 0) + "원 → 실수령 " + fmt(proceeds, 0) + "원 (수수료 " +
        fmt(buy * qty * fee + sell * qty * fee, 0) + "원 차감)";
      var breakeven = buy * (1 + fee) / (1 - fee);
      be.textContent = "본전가(수수료 감안): " + fmt(breakeven, breakeven >= 100 ? 0 : 4) + "원";
    });
  }

  // ── 복리 계산기 ──────────────────────────────────────────────
  if ($("cp-form")) {
    on(["cp-principal", "cp-rate", "cp-periods", "cp-add"], function () {
      var p = pos($("cp-principal")), r = num($("cp-rate")), n = pos($("cp-periods"));
      var add = num($("cp-add"));
      add = add === null || add < 0 ? 0 : add;
      var out = $("cp-out"), desc = $("cp-desc");
      if (!p || r === null || !n || n > 1200) {
        out.textContent = "—";
        desc.textContent = "원금·회당 수익률·횟수를 입력하면 결과가 계산됩니다. (횟수 최대 1,200회)";
        return;
      }
      var rr = r / 100;
      var total = p;
      for (var i = 0; i < Math.floor(n); i++) total = (total + add) * (1 + rr);
      var invested = p + add * Math.floor(n);
      var profit = total - invested;
      var pct = (profit / invested) * 100;
      out.textContent = fmt(total, 0) + "원";
      desc.textContent = "투입 원금 합계 " + fmt(invested, 0) + "원 · 손익 " +
        (profit >= 0 ? "+" : "") + fmt(profit, 0) + "원 (" + (pct >= 0 ? "+" : "") + pct.toFixed(1) + "%)";
    });
  }
})();
