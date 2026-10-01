// usdt.io.kr 실시간 시세 (의존성 없음)
// 브라우저가 거래소 공개 API에서 직접 시세를 받아, 빌드 시점에 찍힌 숫자를 덮어쓴다.
//   업비트   : 웹소켓 (브라우저의 REST 호출은 10초당 1회로 제한되어 폴링 불가)
//   바이낸스 : 웹소켓, 끊기면 REST 폴링으로 대체
//   빗썸     : REST 폴링 (3초)
//   환율     : 빌드 시점 값(#live-config) + /data/latest.json — 환율은 실시간이 아니다
// 사용: <span data-live="usdt-upbit-price" data-live-flash>1,361</span>
//       <td data-live="usdt-upbit-kimp" data-live-cls>+0.38%</td>   (pos/neg/flat 클래스 갱신)
//       <span data-live="usdt-upbit-kimp" data-live-cls="badge">    (badge-pos/neg/flat)
// 설정: <script type="application/json" id="live-config">{"fx":1355.8,"sources":["upbit"],"coins":["BTC"]}</script>
// JS가 꺼져 있거나 연결에 실패하면 빌드 시점 숫자가 그대로 남는다.
(function () {
  "use strict";

  var cfgEl = document.getElementById("live-config");
  if (!cfgEl || !window.WebSocket || !window.fetch || !window.TextDecoder) return;
  var cfg;
  try { cfg = JSON.parse(cfgEl.textContent); } catch (e) { return; }

  var SOURCES = cfg.sources || [];
  var COINS = cfg.coins || [];
  var EX = {
    upbit: { name: "업비트", suffix: "(전일比)" },
    bithumb: { name: "빗썸", suffix: "(24h)" }
  };
  var state = { fx: cfg.fx > 0 ? cfg.fx : null, upbit: {}, bithumb: {}, binance: {} };
  var alive = { upbit: false, bithumb: false, binance: false };
  var decoder = new TextDecoder("utf-8");

  function has(src) { return SOURCES.indexOf(src) !== -1; }

  // ── 포맷 (scripts/build.py 의 fmt_* 와 같은 규칙) ─────────────
  function fmtNum(v, dec) {
    return Number(v).toLocaleString("en-US",
      { minimumFractionDigits: dec, maximumFractionDigits: dec });
  }
  function fmtPriceKrw(v) { return fmtNum(v, v === Math.floor(v) ? 0 : 1); }
  function fmtUsd(v) { return fmtNum(v, v >= 100 ? 0 : (v >= 1 ? 2 : 4)); }
  function fmtPct(v) { return (v >= 0 ? "+" : "") + v.toFixed(2) + "%"; }
  function fmtVol(v) {
    if (v >= 1e12) return fmtNum(v / 1e12, 1) + "조 원";
    if (v >= 1e8) return fmtNum(v / 1e8, 0) + "억 원";
    return fmtNum(v / 1e4, 0) + "만 원";
  }
  function clsOf(v) { return v > 0.05 ? "pos" : (v < -0.05 ? "neg" : "flat"); }
  function premium(krw, usd, fx) {
    var base = usd * fx;
    if (!base) return null;
    return Math.round((krw / base - 1) * 10000) / 100;
  }
  function kstNow() {
    var d = new Date(Date.now() + 9 * 3600 * 1000);
    function p(n) { return String(n).padStart(2, "0"); }
    var hm = p(d.getUTCHours()) + ":" + p(d.getUTCMinutes());
    return {
      date: d.getUTCFullYear() + "년 " + (d.getUTCMonth() + 1) + "월 " + d.getUTCDate() + "일",
      hm: hm,
      hms: hm + ":" + p(d.getUTCSeconds())
    };
  }

  // 반원 게이지 (-3% ~ +5%) — build.py gauge_svg 와 같은 도형
  function gaugeSvg(k) {
    var kc = Math.max(-3, Math.min(5, k));
    function pt(theta, r) {
      var th = theta * Math.PI / 180;
      return [100 - r * Math.cos(th), 100 - r * Math.sin(th)];
    }
    function arc(a, b) {
      var p1 = pt(a, 80), p2 = pt(b, 80);
      return "M " + p1[0].toFixed(2) + " " + p1[1].toFixed(2) +
        " A 80 80 0 0 1 " + p2[0].toFixed(2) + " " + p2[1].toFixed(2);
    }
    var zero = 180 * 3 / 8, val = 180 * (kc + 3) / 8;
    var color = k > 0.05 ? "var(--up)" : (k < -0.05 ? "var(--down)" : "var(--flat)");
    var valArc = Math.abs(val - zero) < 0.6 ? "" :
      '<path d="' + arc(Math.min(zero, val), Math.max(zero, val)) + '" fill="none" stroke="' +
      color + '" stroke-width="13" stroke-linecap="round"/>';
    var n = pt(val, 60), z1 = pt(zero, 88), z2 = pt(zero, 71), zt = pt(zero, 99);
    return '<svg viewBox="0 0 200 114" xmlns="http://www.w3.org/2000/svg" role="img" ' +
      'aria-label="김치프리미엄 게이지 ' + fmtPct(k) + '">' +
      '<path d="' + arc(0, 180) + '" fill="none" stroke="var(--grid)" stroke-width="13" stroke-linecap="round"/>' +
      valArc +
      '<line x1="' + z1[0].toFixed(1) + '" y1="' + z1[1].toFixed(1) + '" x2="' + z2[0].toFixed(1) +
      '" y2="' + z2[1].toFixed(1) + '" stroke="var(--ink-3)" stroke-width="2"/>' +
      '<line x1="100" y1="100" x2="' + n[0].toFixed(1) + '" y2="' + n[1].toFixed(1) +
      '" stroke="var(--ink)" stroke-width="3" stroke-linecap="round"/>' +
      '<circle cx="100" cy="100" r="5.5" fill="var(--ink)"/>' +
      '<text x="20" y="113" font-size="10" fill="var(--ink-3)" text-anchor="middle">-3%</text>' +
      '<text x="' + zt[0].toFixed(0) + '" y="' + zt[1].toFixed(0) +
      '" font-size="10" fill="var(--ink-3)" text-anchor="middle">0%</text>' +
      '<text x="180" y="113" font-size="10" fill="var(--ink-3)" text-anchor="middle">+5%</text>' +
      '</svg>';
  }

  // ── 현재 상태 → 화면에 넣을 값 ────────────────────────────────
  // 실시간으로 받은 항목만 내보낸다. 받지 못한 항목은 빌드 시점 숫자가 유지된다.
  function compute() {
    var out = {}, fx = state.fx, now = kstNow(), kimp = {};
    function put(key, text, num) { out[key] = { text: text, num: num }; }

    if (fx) put("fx", fmtNum(fx, 1), fx);

    ["upbit", "bithumb"].forEach(function (ex) {
      var u = state[ex].USDT;
      if (!u) return;
      var k = "usdt-" + ex + "-";
      put(k + "price", fmtPriceKrw(u.price), u.price);
      if (u.change != null) put(k + "change", fmtPct(u.change) + " " + EX[ex].suffix, u.change);
      if (u.high != null) put(k + "high", fmtPriceKrw(u.high), u.high);
      if (u.low != null) put(k + "low", fmtPriceKrw(u.low), u.low);
      if (u.vol) put(k + "vol", fmtVol(u.vol), u.vol);
      if (!fx) return;
      kimp[ex] = premium(u.price, 1, fx);
      put(k + "usd", fmtNum(u.price / fx, 4), u.price / fx);
      put(k + "kimp", fmtPct(kimp[ex]), kimp[ex]);
      put("summary-" + ex, now.date + " " + now.hm + " 기준 " + EX[ex].name + " USDT는 " +
        fmtPriceKrw(u.price) + "원, 달러 환율 대비 김프는 " + fmtPct(kimp[ex]) + "입니다.");
    });

    var uu = state.upbit.USDT, bu = state.bithumb.USDT;
    if (uu && bu && uu.vol && bu.vol) put("usdt-vol-total", fmtVol(uu.vol + bu.vol), uu.vol + bu.vol);

    COINS.forEach(function (sym) {
      var k = sym.toLowerCase() + "-", u = state.upbit[sym], b = state.binance[sym];
      if (u) put(k + "upbit-price", fmtPriceKrw(u.price), u.price);
      if (b) put(k + "binance-usd", fmtUsd(b), b);
      if (b && fx) put(k + "binance-krw", fmtNum(b * fx, 0), b * fx);
      if (u && b && fx) {
        kimp[sym] = premium(u.price, b, fx);
        put(k + "kimp", fmtPct(kimp[sym]), kimp[sym]);
      }
    });

    if (uu && fx && kimp.upbit != null) {
      var kv = kimp.upbit, diff = uu.price - fx;
      var zone = kv > 0.05 ? "높은 김프 구간" : (kv < -0.05 ? "낮은 역프 구간" : "해외가와 거의 일치하는 구간");
      put("gauge-desc", "1 USDT 적정가(달러 환율)는 " + fmtNum(fx, 1) + "원, 업비트 USDT는 " +
        fmtPriceKrw(uu.price) + "원입니다. 국내 가격이 환율보다 " + fmtNum(Math.abs(diff), 1) + "원 " +
        (diff >= 0 ? "높은" : "낮은") + " — " + zone + "입니다.");
      out["gauge-svg"] = { html: gaugeSvg(kv), num: kv };
      var st = kv > 0.05 ? "프리미엄(김프)" : (kv < -0.05 ? "역프리미엄(역프)" : "해외가와 거의 일치");
      var s = now.date + " " + now.hm + " 기준 업비트 USDT는 " + fmtPriceKrw(uu.price) +
        "원으로 달러 환율(" + fmtNum(fx, 1) + "원) 대비 " + fmtPct(kv) + " " + st + " 상태입니다.";
      if (bu && kimp.bithumb != null) {
        s += " 빗썸 USDT는 " + fmtPriceKrw(bu.price) + "원(" + fmtPct(kimp.bithumb) + ")입니다.";
      }
      if (kimp.BTC != null) s += " 비트코인 김프는 " + fmtPct(kimp.BTC) + "입니다.";
      put("summary-today", s);
    }

    var ub = state.upbit.BTC, bb = state.binance.BTC;
    if (ub && bb && fx && kimp.BTC != null) {
      put("summary-btc", now.date + " " + now.hm + " 기준 업비트 비트코인은 " + fmtPriceKrw(ub.price) +
        "원, 바이낸스는 " + fmtUsd(bb) + "달러(원화 환산 " + fmtNum(bb * fx, 0) + "원)로 김프는 " +
        fmtPct(kimp.BTC) + "입니다.");
    }
    return out;
  }

  // ── 화면 반영 ─────────────────────────────────────────────────
  var els = Array.prototype.slice.call(document.querySelectorAll("[data-live]"));
  var badge = document.querySelector("[data-live-badge]");
  var statusEl = document.querySelector("[data-live-status]");
  var staticStatus = statusEl ? statusEl.textContent : "";
  var builtStale = !!(badge && badge.classList.contains("stale"));

  function setSign(el, sign, prefix) {
    el.classList.remove(prefix + "pos", prefix + "neg", prefix + "flat");
    el.classList.add(prefix + sign);
  }

  function flash(el, up) {
    el.classList.remove("live-up", "live-down");
    void el.offsetWidth;  // 애니메이션 재시작
    el.classList.add(up ? "live-up" : "live-down");
  }

  var lastLive = "";  // 마지막으로 실시간 값을 반영한 시각 (KST)

  function renderStatus() {
    if (!statusEl || !badge) return;
    var on = SOURCES.filter(function (s) { return alive[s]; }).length;
    if (!on) {
      // 한 번이라도 실시간 값을 반영했다면 화면 숫자는 그 시각 기준이다.
      statusEl.textContent = lastLive ? "시세 연결 끊김 · 마지막 갱신 " + lastLive : staticStatus;
      badge.classList.remove("live");
      badge.classList.toggle("stale", lastLive ? true : builtStale);
      return;
    }
    var partial = on !== SOURCES.length;
    lastLive = kstNow().hms;
    statusEl.textContent = (partial ? "실시간 시세 · 일부 지연 · " : "실시간 시세 · ") + lastLive;
    badge.classList.add("live");
    badge.classList.toggle("stale", partial);
  }

  function render() {
    var vals = compute();
    els.forEach(function (el) {
      var v = vals[el.getAttribute("data-live")];
      if (!v) return;
      if (v.html != null) {
        if (el._liveNum !== v.num) { el.innerHTML = v.html; el._liveNum = v.num; }
        return;
      }
      if (el.textContent !== v.text) {
        var prev = el._liveNum;
        el.textContent = v.text;
        if (el.hasAttribute("data-live-flash") && typeof prev === "number" &&
            typeof v.num === "number" && prev !== v.num) flash(el, v.num > prev);
      }
      el._liveNum = v.num;
      var mode = el.getAttribute("data-live-cls");
      if (mode != null && typeof v.num === "number") {
        setSign(el, clsOf(v.num), mode === "badge" ? "badge-" : "");
      }
    });
    renderStatus();
  }

  var pending = false;
  function schedule() {
    if (pending) return;
    pending = true;
    setTimeout(function () { pending = false; render(); }, 300);
  }

  // ── 업비트 (웹소켓, 실패가 이어지면 11초 간격 REST) ───────────
  var stopped = true;
  var upbitWs = null, upbitRetry = 0, upbitLastTry = 0;
  var upbitTimer = null, upbitPoll = null, upbitPing = null;

  function upbitCodes() {
    return ["KRW-USDT"].concat(COINS.map(function (c) { return "KRW-" + c; }));
  }
  function applyUpbit(d) {
    var code = d.code || d.market;
    if (!code || typeof d.trade_price !== "number") return;
    state.upbit[code.replace("KRW-", "")] = {
      price: d.trade_price,
      change: d.signed_change_rate * 100,
      high: d.high_price,
      low: d.low_price,
      vol: d.acc_trade_price_24h
    };
  }
  function pollUpbit() {
    fetch("https://api.upbit.com/v1/ticker?markets=" + upbitCodes().join(","))
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (rows) { rows.forEach(applyUpbit); alive.upbit = true; schedule(); })
      .catch(function () { alive.upbit = false; schedule(); });
  }
  function stopUpbitPoll() { clearInterval(upbitPoll); upbitPoll = null; }
  function connectUpbit() {
    clearTimeout(upbitTimer);
    if (stopped) return;
    // 업비트는 브라우저(Origin 헤더) 요청을 10초당 1회로 제한한다 — 재접속 간격을 지킨다.
    var wait = upbitLastTry ? 11000 - (Date.now() - upbitLastTry) : 0;
    if (wait > 0) { upbitTimer = setTimeout(connectUpbit, wait); return; }
    upbitLastTry = Date.now();
    var ws;
    try { ws = new WebSocket("wss://api.upbit.com/websocket/v1"); }
    catch (e) { upbitTimer = setTimeout(connectUpbit, 60000); return; }
    upbitWs = ws;
    ws.binaryType = "arraybuffer";
    ws.onopen = function () {
      ws.send(JSON.stringify([{ ticket: "tetherview-" + Date.now() },
                              { type: "ticker", codes: upbitCodes() }]));
      clearInterval(upbitPing);
      upbitPing = setInterval(function () { if (ws.readyState === 1) ws.send("PING"); }, 60000);
    };
    ws.onmessage = function (ev) {
      var d;
      try { d = JSON.parse(typeof ev.data === "string" ? ev.data : decoder.decode(ev.data)); }
      catch (e) { return; }
      if (d.type !== "ticker") return;  // PING 응답 등
      applyUpbit(d);
      upbitRetry = 0;
      alive.upbit = true;
      stopUpbitPoll();
      schedule();
    };
    ws.onerror = function () { try { ws.close(); } catch (e) {} };
    ws.onclose = function () {
      clearInterval(upbitPing);
      if (upbitWs !== ws) return;
      upbitWs = null;
      alive.upbit = false;
      schedule();
      if (stopped) return;
      upbitRetry++;
      if (upbitRetry >= 2 && !upbitPoll) upbitPoll = setInterval(pollUpbit, 11000);
      upbitTimer = setTimeout(connectUpbit, Math.min(60000, 11000 * upbitRetry));
    };
  }

  // ── 바이낸스 (웹소켓, 끊긴 동안 5초 간격 REST) ────────────────
  var binanceWs = null, binanceRetry = 0, binanceTimer = null, binancePoll = null;

  function binanceSyms() { return COINS.map(function (c) { return c + "USDT"; }); }
  function pollBinance() {
    fetch("https://data-api.binance.vision/api/v3/ticker/price?symbols=" +
          encodeURIComponent(JSON.stringify(binanceSyms())))
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (rows) {
        rows.forEach(function (row) {
          var p = parseFloat(row.price);
          if (p > 0) state.binance[row.symbol.replace(/USDT$/, "")] = p;
        });
        alive.binance = true;
        schedule();
      })
      .catch(function () { if (!binanceWs || binanceWs.readyState !== 1) { alive.binance = false; schedule(); } });
  }
  function stopBinancePoll() { clearInterval(binancePoll); binancePoll = null; }
  function connectBinance() {
    clearTimeout(binanceTimer);
    if (stopped || !COINS.length) return;
    var streams = binanceSyms().map(function (s) { return s.toLowerCase() + "@miniTicker"; }).join("/");
    var ws;
    try { ws = new WebSocket("wss://data-stream.binance.vision/stream?streams=" + streams); }
    catch (e) { if (!binancePoll) binancePoll = setInterval(pollBinance, 5000); return; }
    binanceWs = ws;
    ws.onmessage = function (ev) {
      var m;
      try { m = JSON.parse(ev.data); } catch (e) { return; }
      var d = m && m.data, p = d && parseFloat(d.c);
      if (!d || !d.s || !(p > 0)) return;
      state.binance[d.s.replace(/USDT$/, "")] = p;
      binanceRetry = 0;
      alive.binance = true;
      stopBinancePoll();
      schedule();
    };
    ws.onerror = function () { try { ws.close(); } catch (e) {} };
    ws.onclose = function () {
      if (binanceWs !== ws) return;
      binanceWs = null;
      if (stopped) return;
      binanceRetry++;
      if (!binancePoll) binancePoll = setInterval(pollBinance, 5000);
      binanceTimer = setTimeout(connectBinance, Math.min(60000, 5000 * binanceRetry));
    };
  }

  // ── 빗썸 (REST 3초) ───────────────────────────────────────────
  var bithumbPoll = null, bithumbFails = 0;

  function pollBithumb() {
    fetch("https://api.bithumb.com/public/ticker/USDT_KRW")
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (j) {
        if (!j || j.status !== "0000" || !j.data) throw new Error("status");
        var d = j.data, p = parseFloat(d.closing_price);
        if (!(p > 0)) throw new Error("price");
        state.bithumb.USDT = {
          price: p,
          change: parseFloat(d.fluctate_rate_24H),
          high: parseFloat(d.max_price),
          low: parseFloat(d.min_price),
          vol: parseFloat(d.acc_trade_value_24H)
        };
        bithumbFails = 0;
        alive.bithumb = true;
        schedule();
      })
      .catch(function () {
        bithumbFails++;
        if (bithumbFails >= 3) { alive.bithumb = false; schedule(); }
      });
  }

  // ── 환율: 실시간 소스가 아니므로 수집 파일을 10분마다 다시 읽는다 ──
  var fxTimer = null;
  function refreshFx() {
    fetch("/data/latest.json", { cache: "no-store" })
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (j) {
        var v = j && j.fx && j.fx.usdkrw;
        if (v > 0 && v !== state.fx) { state.fx = v; schedule(); }
      })
      .catch(function () {});
  }

  // ── 시작/정지: 탭이 30초 넘게 가려지면 연결을 끊고, 돌아오면 다시 잇는다 ──
  function start() {
    if (!stopped) return;
    stopped = false;
    if (has("upbit")) connectUpbit();
    if (has("binance") && COINS.length) { pollBinance(); connectBinance(); }
    if (has("bithumb")) { pollBithumb(); bithumbPoll = setInterval(pollBithumb, 3000); }
    refreshFx();
    fxTimer = setInterval(refreshFx, 600000);
  }
  function stop() {
    if (stopped) return;
    stopped = true;
    [upbitTimer, binanceTimer].forEach(clearTimeout);
    [upbitPoll, upbitPing, binancePoll, bithumbPoll, fxTimer].forEach(clearInterval);
    upbitPoll = binancePoll = bithumbPoll = null;
    [upbitWs, binanceWs].forEach(function (ws) { if (ws) { try { ws.close(); } catch (e) {} } });
    upbitWs = binanceWs = null;
    alive.upbit = alive.bithumb = alive.binance = false;
    renderStatus();
  }

  var hideTimer = null;
  document.addEventListener("visibilitychange", function () {
    clearTimeout(hideTimer);
    if (document.hidden) hideTimer = setTimeout(stop, 30000);
    else start();
  });

  window.TetherViewLive = { state: state, alive: alive, compute: compute, render: render };
  start();
})();
