// usdt.io.kr 미니 라인 차트 (의존성 없음)
// 사용: <div class="chart-box" data-chart="series-data" data-series="kimp_usdt"
//        data-labels="USDT 김프" data-colors="s1" data-unit="%" data-days="7"
//        data-baseline="0">
// 데이터: <script type="application/json" id="series-data">{"points":[{"t":"...","kimp_usdt":1.5},...]}</script>
(function () {
  "use strict";

  var W = 800, H = 260, PAD = { t: 16, r: 14, b: 26, l: 52 };

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function fmt(v, unit) {
    var s;
    if (Math.abs(v) >= 1000) s = Math.round(v).toLocaleString("ko-KR");
    else s = v.toLocaleString("ko-KR", { maximumFractionDigits: 2 });
    if (unit === "%") return (v > 0 ? "+" : "") + s + "%";
    if (unit === "₩") return s + "원";
    return s;
  }

  function timeLabel(iso, dateOnly) {
    var d = new Date(iso);
    if (dateOnly) return (d.getMonth() + 1) + "/" + d.getDate();
    return (d.getMonth() + 1) + "/" + d.getDate() + " " +
      String(d.getHours()).padStart(2, "0") + ":" + String(d.getMinutes()).padStart(2, "0");
  }

  function niceTicks(min, max, n) {
    if (min === max) { min -= 1; max += 1; }
    var span = max - min, step = Math.pow(10, Math.floor(Math.log10(span / n)));
    var err = span / n / step;
    if (err >= 7.5) step *= 10; else if (err >= 3.5) step *= 5; else if (err >= 1.5) step *= 2;
    var ticks = [], v = Math.ceil(min / step) * step;
    for (; v <= max + step * 1e-9; v += step) ticks.push(v);
    return ticks;
  }

  function render(box) {
    var dataEl = document.getElementById(box.getAttribute("data-chart"));
    if (!dataEl) return;
    var data;
    try { data = JSON.parse(dataEl.textContent); } catch (e) { return; }

    var keys = box.getAttribute("data-series").split(",");
    var labels = (box.getAttribute("data-labels") || "").split(",");
    var colorVars = (box.getAttribute("data-colors") || "s1,s2,s3").split(",");
    var unit = box.getAttribute("data-unit") || "";
    var days = parseFloat(box.getAttribute("data-days") || "7");
    var baseline = box.getAttribute("data-baseline");
    var dateOnly = box.getAttribute("data-xdate") === "1";

    var cutoff = Date.now() - days * 86400e3;
    var pts = (data.points || []).filter(function (p) {
      return new Date(p.t).getTime() >= cutoff && keys.every(function (k) { return typeof p[k] === "number"; });
    });

    box.innerHTML = "";
    if (pts.length < 5) {
      var empty = document.createElement("div");
      empty.className = "chart-empty";
      empty.textContent = "차트 데이터 수집 중입니다. 파이프라인 가동 후 10분 단위로 채워집니다.";
      box.appendChild(empty);
      return;
    }

    var t0 = new Date(pts[0].t).getTime(), t1 = new Date(pts[pts.length - 1].t).getTime();
    if (t1 === t0) t1 = t0 + 1;
    var vals = [];
    pts.forEach(function (p) { keys.forEach(function (k) { vals.push(p[k]); }); });
    if (baseline !== null && baseline !== "") vals.push(parseFloat(baseline));
    var vmin = Math.min.apply(null, vals), vmax = Math.max.apply(null, vals);
    var vpad = (vmax - vmin) * 0.12 || Math.abs(vmax) * 0.05 || 1;
    vmin -= vpad; vmax += vpad;

    function x(t) { return PAD.l + (t - t0) / (t1 - t0) * (W - PAD.l - PAD.r); }
    function y(v) { return PAD.t + (vmax - v) / (vmax - vmin) * (H - PAD.t - PAD.b); }

    var NS = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", labels.join(", ") + " 추이 차트");

    var gridColor = cssVar("--grid") || "#eee";
    var inkMuted = cssVar("--ink-3") || "#888";

    // y 그리드 + 눈금
    niceTicks(vmin, vmax, 4).forEach(function (tv) {
      var line = document.createElementNS(NS, "line");
      line.setAttribute("x1", PAD.l); line.setAttribute("x2", W - PAD.r);
      line.setAttribute("y1", y(tv)); line.setAttribute("y2", y(tv));
      line.setAttribute("stroke", gridColor); line.setAttribute("stroke-width", "1");
      svg.appendChild(line);
      var txt = document.createElementNS(NS, "text");
      txt.setAttribute("x", PAD.l - 8); txt.setAttribute("y", y(tv) + 4);
      txt.setAttribute("text-anchor", "end");
      txt.setAttribute("font-size", "11"); txt.setAttribute("fill", inkMuted);
      txt.textContent = fmt(tv, unit === "₩" ? "" : unit);
      svg.appendChild(txt);
    });

    // 기준선 (예: 김프 0%)
    if (baseline !== null && baseline !== "") {
      var bv = parseFloat(baseline);
      if (bv >= vmin && bv <= vmax) {
        var bl = document.createElementNS(NS, "line");
        bl.setAttribute("x1", PAD.l); bl.setAttribute("x2", W - PAD.r);
        bl.setAttribute("y1", y(bv)); bl.setAttribute("y2", y(bv));
        bl.setAttribute("stroke", inkMuted); bl.setAttribute("stroke-width", "1");
        bl.setAttribute("stroke-dasharray", "4 4");
        svg.appendChild(bl);
      }
    }

    // x 눈금 (3개)
    [0, 0.5, 1].forEach(function (f) {
      var tt = t0 + (t1 - t0) * f;
      var txt = document.createElementNS(NS, "text");
      txt.setAttribute("x", x(tt));
      txt.setAttribute("y", H - 8);
      txt.setAttribute("text-anchor", f === 0 ? "start" : f === 1 ? "end" : "middle");
      txt.setAttribute("font-size", "11"); txt.setAttribute("fill", inkMuted);
      txt.textContent = timeLabel(new Date(tt).toISOString(), dateOnly);
      svg.appendChild(txt);
    });

    // 시리즈 라인
    keys.forEach(function (k, i) {
      var color = cssVar("--" + (colorVars[i] || "s1")) || "#26a17b";
      var d = pts.map(function (p, j) {
        return (j === 0 ? "M" : "L") + x(new Date(p.t).getTime()).toFixed(1) + " " + y(p[k]).toFixed(1);
      }).join(" ");
      var path = document.createElementNS(NS, "path");
      path.setAttribute("d", d);
      path.setAttribute("fill", "none");
      path.setAttribute("stroke", color);
      path.setAttribute("stroke-width", "2");
      path.setAttribute("stroke-linejoin", "round");
      path.setAttribute("stroke-linecap", "round");
      svg.appendChild(path);
    });

    // 크로스헤어 + 마커
    var cross = document.createElementNS(NS, "line");
    cross.setAttribute("stroke", inkMuted); cross.setAttribute("stroke-width", "1");
    cross.setAttribute("y1", PAD.t); cross.setAttribute("y2", H - PAD.b);
    cross.style.display = "none";
    svg.appendChild(cross);
    var markers = keys.map(function (k, i) {
      var c = document.createElementNS(NS, "circle");
      c.setAttribute("r", "4");
      c.setAttribute("fill", cssVar("--" + (colorVars[i] || "s1")) || "#26a17b");
      c.setAttribute("stroke", cssVar("--surface") || "#fff");
      c.setAttribute("stroke-width", "2");
      c.style.display = "none";
      svg.appendChild(c);
      return c;
    });

    var tip = document.createElement("div");
    tip.className = "chart-tip";
    box.appendChild(svg);
    box.appendChild(tip);

    function nearest(clientX) {
      var rect = svg.getBoundingClientRect();
      var t = t0 + (clientX - rect.left) / rect.width * W > 0
        ? t0 + ((clientX - rect.left) / rect.width * W - PAD.l) / (W - PAD.l - PAD.r) * (t1 - t0)
        : t0;
      var best = 0, bd = Infinity;
      pts.forEach(function (p, i) {
        var d = Math.abs(new Date(p.t).getTime() - t);
        if (d < bd) { bd = d; best = i; }
      });
      return best;
    }

    function onMove(ev) {
      var cx = ev.touches ? ev.touches[0].clientX : ev.clientX;
      var i = nearest(cx);
      var p = pts[i], px = x(new Date(p.t).getTime());
      cross.setAttribute("x1", px); cross.setAttribute("x2", px);
      cross.style.display = "";
      var rect = svg.getBoundingClientRect(), sx = rect.width / W, sy = rect.height / H;
      var rows = [timeLabel(p.t, dateOnly)];
      keys.forEach(function (k, j) {
        markers[j].setAttribute("cx", px);
        markers[j].setAttribute("cy", y(p[k]));
        markers[j].style.display = "";
        rows.push((labels[j] || k) + " " + fmt(p[k], unit));
      });
      tip.innerHTML = rows.join("<br>");
      tip.style.display = "block";
      tip.style.left = (px * sx) + "px";
      tip.style.top = (y(p[keys[0]]) * sy) + "px";
    }
    function onLeave() {
      cross.style.display = "none";
      markers.forEach(function (m) { m.style.display = "none"; });
      tip.style.display = "none";
    }
    svg.addEventListener("mousemove", onMove);
    svg.addEventListener("touchmove", onMove, { passive: true });
    svg.addEventListener("mouseleave", onLeave);
    svg.addEventListener("touchend", onLeave);
  }

  // 스파크라인: <span class="spark" data-chart="series-data" data-spark="usdt_upbit"></span>
  function renderSpark(el) {
    var dataEl = document.getElementById(el.getAttribute("data-chart"));
    if (!dataEl) return;
    var data;
    try { data = JSON.parse(dataEl.textContent); } catch (e) { return; }
    var key = el.getAttribute("data-spark");
    var days = parseFloat(el.getAttribute("data-days") || "7");
    var cutoff = Date.now() - days * 86400e3;
    var pts = (data.points || []).filter(function (p) {
      return new Date(p.t).getTime() >= cutoff && typeof p[key] === "number";
    });
    el.innerHTML = "";
    if (pts.length < 5) return;
    var vals = pts.map(function (p) { return p[key]; });
    var vmin = Math.min.apply(null, vals), vmax = Math.max.apply(null, vals);
    if (vmax === vmin) { vmax += 1; vmin -= 1; }
    var w = 90, h = 28, pad = 2;
    var NS = "http://www.w3.org/2000/svg";
    var svg = document.createElementNS(NS, "svg");
    svg.setAttribute("viewBox", "0 0 " + w + " " + h);
    svg.setAttribute("aria-hidden", "true");
    var d = pts.map(function (p, i) {
      var x = pad + i / (pts.length - 1) * (w - pad * 2);
      var y = pad + (vmax - p[key]) / (vmax - vmin) * (h - pad * 2);
      return (i === 0 ? "M" : "L") + x.toFixed(1) + " " + y.toFixed(1);
    }).join(" ");
    var path = document.createElementNS(NS, "path");
    path.setAttribute("d", d);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", cssVar("--" + (el.getAttribute("data-color") || "s1")) || "#2ea687");
    path.setAttribute("stroke-width", "1.6");
    path.setAttribute("stroke-linejoin", "round");
    svg.appendChild(path);
    el.appendChild(svg);
  }

  function renderAll() {
    document.querySelectorAll(".chart-box[data-chart]").forEach(render);
    document.querySelectorAll(".spark[data-chart]").forEach(renderSpark);
  }
  renderAll();
  document.addEventListener("themechange", renderAll);
})();
