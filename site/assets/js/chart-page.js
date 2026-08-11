// 차트 페이지 — TradingView 위젯 + 시리즈 선택기
(function () {
  "use strict";
  var host = document.getElementById("tv-chart");
  if (!host) return;

  // value: TradingView 심볼 (수식 지원). line=true면 라인 차트로 표시
  var SERIES = [
    { key: "btc-binance", label: "BTC 바이낸스", symbol: "BINANCE:BTCUSDT" },
    { key: "btc-upbit", label: "BTC 업비트", symbol: "UPBIT:BTCKRW" },
    { key: "btc-kimp", label: "BTC 김치프리미엄 (업비트/바이낸스)", symbol: "100*(UPBIT:BTCKRW/(BINANCE:BTCUSDT*FX_IDC:USDKRW)-1)", line: true },
    { key: "usdt-upbit", label: "USDT 업비트", symbol: "UPBIT:USDTKRW" },
    { key: "usdt-kimp", label: "USDT 김치프리미엄 (환율 대비)", symbol: "100*(UPBIT:USDTKRW/FX_IDC:USDKRW-1)", line: true },
    { key: "eth-binance", label: "ETH 바이낸스", symbol: "BINANCE:ETHUSDT" },
    { key: "xrp-binance", label: "XRP 바이낸스", symbol: "BINANCE:XRPUSDT" },
    { key: "btc-dom", label: "BTC 도미넌스", symbol: "CRYPTOCAP:BTC.D", line: true },
    { key: "usdt-dom", label: "USDT 도미넌스", symbol: "CRYPTOCAP:USDT.D", line: true },
    { key: "usdkrw", label: "달러 환율 (USD/KRW)", symbol: "FX_IDC:USDKRW", line: true },
    { key: "dxy", label: "달러인덱스 (DXY)", symbol: "TVC:DXY", line: true },
    { key: "gold", label: "금 (GOLD)", symbol: "TVC:GOLD" },
    { key: "ndx", label: "나스닥 100", symbol: "NASDAQ:NDX", line: true },
    { key: "spx", label: "S&P 500", symbol: "SP:SPX", line: true }
  ];

  var current = SERIES[0];
  var nav = document.getElementById("tv-series-nav");

  function theme() {
    var attr = document.documentElement.getAttribute("data-theme");
    return attr === "light" ? "light" : "dark";
  }

  function mount() {
    if (typeof TradingView === "undefined") return;
    host.innerHTML = "";
    var div = document.createElement("div");
    div.id = "tv-chart-inner";
    div.style.height = "100%";
    host.appendChild(div);
    new TradingView.widget({
      container_id: "tv-chart-inner",
      symbol: current.symbol,
      interval: "15",
      timezone: "Asia/Seoul",
      theme: theme(),
      style: current.line ? "2" : "1",
      locale: "kr",
      hide_side_toolbar: false,
      allow_symbol_change: true,
      withdateranges: true,
      autosize: true
    });
    document.querySelectorAll("#tv-series-nav button").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-key") === current.key);
    });
    var titleEl = document.getElementById("tv-current-label");
    if (titleEl) titleEl.textContent = current.label;
  }

  // 선택기 렌더
  SERIES.forEach(function (s) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "tv-pick";
    b.setAttribute("data-key", s.key);
    b.textContent = s.label;
    b.addEventListener("click", function () {
      current = s;
      mount();
    });
    nav.appendChild(b);
  });

  // tv.js 로드 후 마운트
  var script = document.createElement("script");
  script.src = "https://s3.tradingview.com/tv.js";
  script.onload = mount;
  script.onerror = function () {
    host.innerHTML = '<div class="chart-empty">차트 모듈(TradingView)을 불러오지 못했습니다. 네트워크 상태를 확인하거나 잠시 후 새로고침해주세요.</div>';
  };
  document.head.appendChild(script);

  document.addEventListener("themechange", mount);
})();
