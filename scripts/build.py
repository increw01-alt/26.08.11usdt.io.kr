#!/usr/bin/env python3
"""usdt.io.kr 정적 페이지 빌더.

templates/ + content/ + site/data/ 를 조합해 site/ 아래 전체 페이지와
sitemap.xml 을 재생성한다. 표준 라이브러리만 사용.
"""
import html
import json
import math
import os
import re
from datetime import datetime, timedelta, timezone

KST = timezone(timedelta(hours=9))
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TPL_DIR = os.path.join(ROOT, "templates")
CONTENT_DIR = os.path.join(ROOT, "content")
SITE_DIR = os.path.join(ROOT, "site")
DATA_DIR = os.path.join(SITE_DIR, "data")
BASE_URL = "https://usdt.io.kr"

NAV_KEYS = ("CHART", "PRICE", "BUY", "EXCHANGE", "CALC", "HISTORY", "NEWS", "GUIDE", "INSIGHT")

COIN_NAMES = {"BTC": "비트코인", "ETH": "이더리움", "XRP": "리플", "SOL": "솔라나",
              "DOGE": "도지코인", "ADA": "에이다", "TRX": "트론"}


# ── 유틸 ──────────────────────────────────────────────────────────

def read(path):
    with open(path, encoding="utf-8") as f:
        return f.read()


def load_json(path, default=None):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return default


def write(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        f.write(text)


def render(template, tokens):
    out = template
    for key, val in tokens.items():
        out = out.replace("{{" + key + "}}", str(val))
    return out


def fmt_num(v, dec=0):
    if v is None:
        return "—"
    if dec == 0:
        return f"{v:,.0f}"
    return f"{v:,.{dec}f}"


def fmt_price_krw(v):
    """원화 가격: 정수면 그대로, 소수면 1자리."""
    if v is None:
        return "—"
    return fmt_num(v, 0 if float(v) == int(v) else 1)


def fmt_usd(v):
    if v is None:
        return "—"
    if v >= 100:
        return fmt_num(v, 0)
    if v >= 1:
        return fmt_num(v, 2)
    return fmt_num(v, 4)


def fmt_pct(v):
    if v is None:
        return "—"
    return f"{v:+.2f}%"


def fmt_vol(v):
    if v is None:
        return "—"
    if v >= 1e12:
        return f"{v / 1e12:,.1f}조 원"
    if v >= 1e8:
        return f"{v / 1e8:,.0f}억 원"
    return f"{v / 1e4:,.0f}만 원"


def cls_of(v, eps=0.05):
    if v is None:
        return "flat"
    return "pos" if v > eps else ("neg" if v < -eps else "flat")


def date_ko(date_str):
    y, m, d = date_str.split("-")
    return f"{int(y)}년 {int(m)}월 {int(d)}일"


def esc(s):
    return html.escape(str(s), quote=True)


def jsonld(obj):
    return ('<script type="application/ld+json">'
            + json.dumps(obj, ensure_ascii=False) + "</script>")


# ── 템플릿·데이터 로드 ─────────────────────────────────────────────

TPL = {}
for name in os.listdir(TPL_DIR):
    if name.endswith(".html"):
        TPL[name[:-5]] = read(os.path.join(TPL_DIR, name))

latest = load_json(os.path.join(DATA_DIR, "latest.json"), {}) or {}
series = load_json(os.path.join(DATA_DIR, "series.json"), {"points": []}) or {"points": []}
series_json = json.dumps(series, ensure_ascii=False, separators=(",", ":"))
daily = load_json(os.path.join(DATA_DIR, "daily.json"), {"days": []}) or {"days": []}
daily_points = {"points": [
    {"t": d["d"] + "T00:00:00Z", "kimp_close": d.get("kimp_close"),
     "usdt_close": d.get("usdt_close")}
    for d in daily.get("days", []) if d.get("kimp_close") is not None]}
daily_json = json.dumps(daily_points, ensure_ascii=False, separators=(",", ":"))
news = load_json(os.path.join(DATA_DIR, "news.json"), {}) or {}
compare = load_json(os.path.join(DATA_DIR, "compare.json"), {}) or {}

today_kst = datetime.now(KST).strftime("%Y-%m-%d")
updated_kst = latest.get("updated_kst", "수집 준비 중")
stale = latest.get("stale", False)


def g(d, *keys):
    for k in keys:
        if not isinstance(d, dict):
            return None
        d = d.get(k)
    return d


# ── 공통 데이터 토큰 ───────────────────────────────────────────────

def coin_tokens(prefix, price, change, high, low, vol, kimp, change_suffix):
    t = {}
    t[prefix + "_PRICE"] = fmt_price_krw(price)
    t[prefix + "_CHANGE_CLASS"] = cls_of(change)
    t[prefix + "_CHANGE_TEXT"] = (fmt_pct(change) + " " + change_suffix) if change is not None else "—"
    t[prefix + "_HIGH"] = fmt_price_krw(high)
    t[prefix + "_LOW"] = fmt_price_krw(low)
    t[prefix + "_VOL"] = fmt_vol(vol)
    return t


def gauge_svg(k):
    """서버 렌더링 반원 게이지 (-3% ~ +5%, 0% 눈금 표시)."""
    kv = 0.0 if k is None else k
    kc = max(-3.0, min(5.0, kv))

    def pt(theta, r=80.0):
        th = math.radians(theta)
        return (100 - r * math.cos(th), 100 - r * math.sin(th))

    def arc(a, b, r=80.0):
        x1, y1 = pt(a, r)
        x2, y2 = pt(b, r)
        return f"M {x1:.2f} {y1:.2f} A {r:.0f} {r:.0f} 0 0 1 {x2:.2f} {y2:.2f}"

    zero = 180.0 * 3 / 8
    val = 180.0 * (kc + 3) / 8
    color = "var(--up)" if kv > 0.05 else ("var(--down)" if kv < -0.05 else "var(--flat)")
    lo, hi = (zero, val) if val >= zero else (val, zero)
    val_arc = "" if abs(val - zero) < 0.6 else (
        f'<path d="{arc(lo, hi)}" fill="none" stroke="{color}" '
        'stroke-width="13" stroke-linecap="round"/>')
    nx, ny = pt(val, 60)
    zx1, zy1 = pt(zero, 88)
    zx2, zy2 = pt(zero, 71)
    ztx, zty = pt(zero, 99)
    return (f'<svg viewBox="0 0 200 114" xmlns="http://www.w3.org/2000/svg" role="img" '
            f'aria-label="김치프리미엄 게이지 {fmt_pct(k)}">'
            f'<path d="{arc(0, 180)}" fill="none" stroke="var(--grid)" stroke-width="13" stroke-linecap="round"/>'
            f'{val_arc}'
            f'<line x1="{zx1:.1f}" y1="{zy1:.1f}" x2="{zx2:.1f}" y2="{zy2:.1f}" stroke="var(--ink-3)" stroke-width="2"/>'
            f'<line x1="100" y1="100" x2="{nx:.1f}" y2="{ny:.1f}" stroke="var(--ink)" stroke-width="3" stroke-linecap="round"/>'
            f'<circle cx="100" cy="100" r="5.5" fill="var(--ink)"/>'
            f'<text x="20" y="113" font-size="10" fill="var(--ink-3)" text-anchor="middle">-3%</text>'
            f'<text x="{ztx:.0f}" y="{zty:.0f}" font-size="10" fill="var(--ink-3)" text-anchor="middle">0%</text>'
            f'<text x="180" y="113" font-size="10" fill="var(--ink-3)" text-anchor="middle">+5%</text>'
            f'</svg>')


def news_time_ko(date_iso):
    try:
        t = datetime.fromisoformat(str(date_iso).replace("Z", "+00:00")).astimezone(KST)
        return f"{t.month}/{t.day} {t.hour:02d}:{t.minute:02d}"
    except (ValueError, TypeError):
        return ""


def news_items_html(items, with_topic=False):
    rows = []
    for it in items:
        meta = " · ".join(x for x in (
            it.get("source", ""), news_time_ko(it.get("date")),
            it.get("topic", "") if with_topic else "") if x)
        rows.append(
            f'          <li><a href="{esc(it["link"])}" target="_blank" rel="nofollow noopener">'
            f'{esc(it["title"])}</a><div class="meta">{esc(meta)}</div></li>')
    return "\n".join(rows)


def build_data_tokens():
    fx = g(latest, "fx", "usdkrw")
    d = latest.get("derived", {}) or {}
    kimp_up = d.get("kimp_usdt_upbit")
    kimp_bi = d.get("kimp_usdt_bithumb")
    kimp_btc = d.get("kimp_btc")

    t = {
        "UPDATED_KST": updated_kst,
        "STALE_CLASS": " stale" if stale else "",
        "STALE_NOTE": " · 일부 데이터 지연" if stale else "",
        "FX_USDKRW": fmt_num(fx, 1) if fx else "—",
        "FX_SOURCE": g(latest, "fx", "source") or "환율 공개 API",
        "FX_DATE": g(latest, "fx", "date") or "—",
        "SERIES_JSON": series_json,
        "FOOT_UPDATED": f"· 갱신 {updated_kst} KST" if latest else "",
    }
    t.update(coin_tokens("USDT_UPBIT",
                         g(latest, "upbit", "USDT", "price"),
                         g(latest, "upbit", "USDT", "change_rate"),
                         g(latest, "upbit", "USDT", "high"),
                         g(latest, "upbit", "USDT", "low"),
                         g(latest, "upbit", "USDT", "vol_krw"),
                         kimp_up, "(전일比)"))
    t.update(coin_tokens("USDT_BITHUMB",
                         g(latest, "bithumb", "USDT", "price"),
                         g(latest, "bithumb", "USDT", "change_rate"),
                         g(latest, "bithumb", "USDT", "high"),
                         g(latest, "bithumb", "USDT", "low"),
                         g(latest, "bithumb", "USDT", "vol_krw"),
                         kimp_bi, "(24h)"))
    for name, kimp in (("UPBIT", kimp_up), ("BITHUMB", kimp_bi)):
        t["USDT_KIMP_" + name] = fmt_pct(kimp)
        t["USDT_KIMP_" + name + "_CLASS"] = cls_of(kimp)
        t["USDT_KIMP_" + name + "_BADGE"] = cls_of(kimp)
    t["BTC_UPBIT_PRICE"] = fmt_price_krw(g(latest, "upbit", "BTC", "price"))
    t["BTC_BINANCE_USD"] = fmt_usd(g(latest, "binance", "BTC"))
    btc_krw = None
    if g(latest, "binance", "BTC") and fx:
        btc_krw = g(latest, "binance", "BTC") * fx
    t["BTC_BINANCE_KRW"] = fmt_num(btc_krw, 0) if btc_krw else "—"
    t["BTC_KIMP"] = fmt_pct(kimp_btc)
    t["BTC_KIMP_CLASS"] = cls_of(kimp_btc)
    coin_rows = []
    for sym, name in COIN_NAMES.items():
        k = d.get("kimp_" + sym.lower())
        t[sym + "_UPBIT_PRICE"] = fmt_price_krw(g(latest, "upbit", sym, "price"))
        t[sym + "_BINANCE_USD"] = fmt_usd(g(latest, "binance", sym))
        t[sym + "_KIMP"] = fmt_pct(k)
        t[sym + "_KIMP_CLASS"] = cls_of(k)
        logo = (f'<img class="coin-logo" src="/assets/coins/{sym}.png" alt="" '
                'width="20" height="20" loading="lazy" onerror="this.style.display=\'none\'">')
        label = (f'{logo}<a href="/price/btc/">{name} ({sym})</a>' if sym == "BTC"
                 else f"{logo}{name} ({sym})")
        coin_rows.append(
            f"          <tr><td>{label}</td>"
            f'<td class="r num">{t[sym + "_UPBIT_PRICE"]}원</td>'
            f'<td class="r num">${t[sym + "_BINANCE_USD"]}</td>'
            f'<td class="r num {t[sym + "_KIMP_CLASS"]}">{t[sym + "_KIMP"]}</td></tr>')
    t["COIN_KIMP_ROWS"] = "\n".join(coin_rows)

    # 달러 환산가
    for name, src in (("UPBIT", "upbit"), ("BITHUMB", "bithumb")):
        p = g(latest, src, "USDT", "price")
        t["USDT_" + name + "_USD"] = fmt_num(p / fx, 4) if (p and fx) else "—"

    # 52주·시총·거래대금 합산
    t["USDT_W52_HIGH"] = fmt_price_krw(g(latest, "upbit", "USDT", "w52_high"))
    t["USDT_W52_LOW"] = fmt_price_krw(g(latest, "upbit", "USDT", "w52_low"))
    mcap_usd = g(latest, "usdt_mcap", "usd")
    t["USDT_MCAP"] = f"{mcap_usd / 1e8:,.0f}억 달러" if mcap_usd else "집계 중"
    t["USDT_MCAP_SOURCE"] = g(latest, "usdt_mcap", "source") or "코인게코"
    vols = [g(latest, "upbit", "USDT", "vol_krw"), g(latest, "bithumb", "USDT", "vol_krw")]
    vols = [v for v in vols if v]
    t["USDT_VOL_TOTAL"] = fmt_vol(sum(vols)) if vols else "—"

    # 게이지
    t["GAUGE_SVG"] = gauge_svg(kimp_up)
    up_price = g(latest, "upbit", "USDT", "price")
    if fx and up_price and kimp_up is not None:
        diff = up_price - fx
        state = ("높은 김프 구간" if kimp_up > 0.05
                 else ("낮은 역프 구간" if kimp_up < -0.05 else "해외가와 거의 일치하는 구간"))
        t["GAUGE_DESC"] = (f"1 USDT 적정가(달러 환율)는 {fmt_num(fx, 1)}원, 업비트 USDT는 "
                           f"{fmt_price_krw(up_price)}원입니다. 국내 가격이 환율보다 "
                           f"{fmt_num(abs(diff), 1)}원 {'높은' if diff >= 0 else '낮은'} — {state}입니다.")
    else:
        t["GAUGE_DESC"] = "데이터 파이프라인 가동 후 요약이 표시됩니다."

    # 뉴스·장기 시계열
    t["NEWS_LIST_HOME"] = (news_items_html(news.get("items", [])[:5])
                           or '          <li><div class="meta">뉴스 수집 준비 중입니다.</div></li>')
    t["DAILY_JSON"] = daily_json

    # 계산기 미니 내비 (모든 계산기 페이지 하단 공용)
    calc_links = [("/calc/kimp/", "김프"), ("/calc/convert/", "변환"),
                  ("/calc/average/", "평단가"), ("/calc/profit/", "수익률"),
                  ("/calc/compound/", "복리")]
    t["CALC_NAV"] = (
        '<section class="section" aria-label="다른 계산기">\n'
        '  <div class="container">\n'
        '    <h2 class="section-title">다른 계산기</h2>\n'
        '    <div class="footer-nav" style="margin-top:12px;">\n'
        + "\n".join(f'      <a class="btn ghost" href="{u}">{n} 계산기</a>' for u, n in calc_links)
        + '\n      <a class="btn ghost" href="/calc/">전체 보기</a>\n'
        '    </div>\n  </div>\n</section>')

    # 요약 문장 (크롤러 노출용 텍스트)
    if fx and kimp_up is not None:
        state = "프리미엄(김프)" if kimp_up > 0.05 else ("역프리미엄(역프)" if kimp_up < -0.05 else "해외가와 거의 일치")
        sent = (f"{date_ko(updated_kst[:10])} {updated_kst[11:]} 기준 업비트 USDT는 "
                f"{t['USDT_UPBIT_PRICE']}원으로 달러 환율({t['FX_USDKRW']}원) 대비 "
                f"{fmt_pct(kimp_up)} {state} 상태입니다.")
        if kimp_bi is not None:
            sent += f" 빗썸 USDT는 {t['USDT_BITHUMB_PRICE']}원({fmt_pct(kimp_bi)})입니다."
        if kimp_btc is not None:
            sent += f" 비트코인 김프는 {fmt_pct(kimp_btc)}입니다."
    else:
        sent = "데이터 파이프라인 가동 후 시세 요약이 표시됩니다."
    t["TODAY_SUMMARY_SENTENCE"] = sent
    t["BTC_SUMMARY_SENTENCE"] = (
        f"{date_ko(updated_kst[:10])} {updated_kst[11:]} 기준 업비트 비트코인은 "
        f"{t['BTC_UPBIT_PRICE']}원, 바이낸스는 {t['BTC_BINANCE_USD']}달러"
        f"(원화 환산 {t['BTC_BINANCE_KRW']}원)로 김프는 {t['BTC_KIMP']}입니다."
        if kimp_btc is not None else "데이터 파이프라인 가동 후 시세 요약이 표시됩니다.")
    t["CALC_DEFAULT_KRW"] = (fmt_price_krw(g(latest, "upbit", "USDT", "price")).replace(",", "")
                             if g(latest, "upbit", "USDT", "price") else "1400")
    t["CALC_DEFAULT_FX"] = (f"{fx:.1f}" if fx else "1380")
    return t


DATA_TOKENS = build_data_tokens()


# ── 페이지 렌더러 ─────────────────────────────────────────────────

def nav_tokens(active=None):
    return {("NAV_" + k): (' aria-current="page"' if k == active else "") for k in NAV_KEYS}


def render_page(out_rel, canonical_path, title, description, body,
                og_type="website", jsonld_html="", nav=None, extra_scripts="",
                robots_meta="", hero_image=""):
    is_subpage = canonical_path not in ("/", "/404.html")
    is_detail_page = is_subpage and og_type == "article"
    if is_subpage:
        video_file = "bitcoin-main.mp4" if is_detail_page else "bitcoin-main-2.mp4"
        page_class = " subpage-detail-video-page" if is_detail_page else ""
        if hero_image:
            page_class += " subpage-image-hero-page"
            hero_media = (
                f'    <img class="subpage-hero-image" src="{esc(hero_image)}" alt="" '
                'decoding="async" fetchpriority="high">\n'
            )
        else:
            hero_media = (
                '    <video class="subpage-hero-video" autoplay muted loop playsinline preload="metadata" tabindex="-1">\n'
                f'      <source src="/assets/video/{video_file}" type="video/mp4">\n'
                '    </video>\n'
            )
        body = (
            f'<div class="subpage-video-page{page_class}">\n'
            '  <div class="subpage-video-stage" aria-hidden="true">\n'
            f'{hero_media}'
            '    <div class="subpage-video-vignette"></div>\n'
            '  </div>\n'
            f'{body}\n'
            '</div>'
        )
    tokens = {
        "TITLE": esc(title),
        "DESCRIPTION": esc(description),
        "ROBOTS_META": robots_meta,
        "CANONICAL_PATH": canonical_path,
        "OG_TYPE": og_type,
        "JSONLD": jsonld_html,
        "BODY_CLASS": (
            "subpage-video-page-body subpage-detail-video-page-body"
            if is_detail_page else "subpage-video-page-body" if is_subpage else ""
        ),
        "BODY": body,
        "EXTRA_SCRIPTS": extra_scripts,
        "FOOT_UPDATED": DATA_TOKENS["FOOT_UPDATED"],
    }
    tokens.update(nav_tokens(nav))
    page = render(TPL["shell"], tokens)
    leftover = re.findall(r"\{\{[A-Z0-9_]+\}\}", page)
    if leftover:
        print(f"[warn] {out_rel}: 미치환 토큰 {sorted(set(leftover))}")
    write(os.path.join(SITE_DIR, out_rel), page)
    return canonical_path


CHART_JS = '<script src="/assets/js/chart-mini.js" defer></script>'
CALC_JS = '<script src="/assets/js/calc.js" defer></script>'
CALC_TOOLS_JS = '<script src="/assets/js/calc-tools.js" defer></script>'


def faq_ld(pairs):
    return jsonld({
        "@context": "https://schema.org", "@type": "FAQPage",
        "mainEntity": [{"@type": "Question", "name": q,
                        "acceptedAnswer": {"@type": "Answer", "text": a}}
                       for q, a in pairs]})

SITEMAP = []  # (canonical_path, lastmod)


def add_map(path, lastmod=None):
    SITEMAP.append((path, lastmod or today_kst))


# ── 정적 페이지 카드 레지스트리 (관련 글 카드용) ────────────────────

STATIC_PAGES = {
    "/": ("도구", "USDT 김프 현황판", "업비트·빗썸 테더 시세와 김치프리미엄을 10분 단위로 확인합니다."),
    "/price/usdt/": ("시세", "USDT 통합 시세", "업비트·빗썸 테더 가격과 달러 환율을 한 화면에서 비교합니다."),
    "/price/usdt-upbit/": ("시세", "업비트 USDT 시세", "업비트 원화마켓의 테더 가격과 김프를 확인합니다."),
    "/price/usdt-bithumb/": ("시세", "빗썸 USDT 시세", "빗썸 원화마켓의 테더 가격과 김프를 확인합니다."),
    "/price/btc/": ("시세", "비트코인 김치프리미엄", "업비트와 바이낸스의 비트코인 가격 차이를 추적합니다."),
    "/calc/": ("도구", "코인 계산기 모음", "김프·변환·평단가·수익률·복리 계산기를 무료로 제공합니다."),
    "/calc/kimp/": ("도구", "김프 계산기", "국내가·해외가·환율만 넣으면 김프가 바로 계산됩니다."),
    "/calc/convert/": ("도구", "원화·달러·USDT 변환기", "환율과 테더 시세를 동시에 반영하는 3단 변환기입니다."),
    "/calc/average/": ("도구", "평단가·물타기 계산기", "추가 매수 후 새 평단가를 즉시 계산합니다."),
    "/calc/profit/": ("도구", "수익률 계산기", "수수료 포함 실제 손익·본전가를 계산합니다."),
    "/calc/compound/": ("도구", "복리 계산기", "회당 수익률 반복 적용 결과를 시뮬레이션합니다."),
    "/history/": ("아카이브", "김치프리미엄 히스토리", "매일의 USDT 김프 기록을 날짜별로 쌓아갑니다."),
    "/news/": ("뉴스", "테더·스테이블코인 뉴스", "테더·스테이블코인·김프 관련 헤드라인을 자동 수집합니다."),
    "/chart/": ("차트", "김프·코인·매크로 차트", "TradingView 기반 고급 차트에서 김프를 수식으로 실계산합니다."),
    "/price/compare/": ("시세", "전 코인 김프 비교", "업비트·바이낸스 공통 상장 코인의 김프를 정렬·검색합니다."),
    "/guide/": ("가이드", "가이드 전체 보기", "김프·테더·스테이블코인 기초부터 차근차근 정리했습니다."),
    "/insight/": ("인사이트", "인사이트 전체 보기", "컴퓨트달러 등 디지털 달러의 다음 구조를 다룹니다."),
    "/exchange/": ("거래소별", "거래소별 테더 구매 방법", "국내 5대 원화 거래소의 USDT 구매 순서를 비교합니다."),
}


# ── 콘텐츠(가이드·인사이트) 로드 ───────────────────────────────────

def load_articles(section):
    """content/<section>/*.json + *.html → 메타 목록."""
    articles = []
    cdir = os.path.join(CONTENT_DIR, section)
    if not os.path.isdir(cdir):
        return articles
    for name in sorted(os.listdir(cdir)):
        if not name.endswith(".json"):
            continue
        slug = name[:-5]
        meta = load_json(os.path.join(cdir, name))
        frag_path = os.path.join(cdir, slug + ".html")
        if not meta or not os.path.exists(frag_path):
            print(f"[warn] {section}/{slug}: 메타 또는 본문 누락 — 건너뜀")
            continue
        meta["slug"] = slug
        meta["section"] = section
        meta["url"] = f"/{section}/{slug}/"
        meta["body"] = read(frag_path)
        articles.append(meta)
    articles.sort(key=lambda a: a.get("order", 99))
    return articles


def card_info(url, guide_map, insight_map, exchange_map=None):
    if url in guide_map:
        a = guide_map[url]
        return ("가이드", a["title_short"], a["description"])
    if url in insight_map:
        a = insight_map[url]
        return ("인사이트", a["title_short"], a["description"])
    if exchange_map and url in exchange_map:
        a = exchange_map[url]
        return ("거래소별", a["title_short"], a["description"])
    if url in STATIC_PAGES:
        return STATIC_PAGES[url]
    return None


def card_html(url, cat, title, desc, max_desc=90):
    if len(desc) > max_desc:
        desc = desc[:max_desc - 1].rstrip() + "…"
    return (f'      <a class="card card-link" href="{url}">\n'
            f'        <div class="card-cat">{esc(cat)}</div>\n'
            f'        <h3>{esc(title)}</h3>\n'
            f'        <p>{esc(desc)}</p>\n'
            f'      </a>')


def toc_items(body):
    items = []
    for m in re.finditer(r'<h2\s+id="([^"]+)"[^>]*>(.*?)</h2>', body, re.S):
        title = re.sub(r"<[^>]+>", "", m.group(2)).strip()
        items.append(f'            <li><a href="#{m.group(1)}">{title}</a></li>')
    return "\n".join(items)


def long_toc_items(body, include_faq=False):
    items = []
    pattern = r'<section\s+id="([^"]+)"[^>]*>.*?<h2[^>]*>(.*?)</h2>'
    for m in re.finditer(pattern, body, re.S):
        title = re.sub(r"<[^>]+>", "", m.group(2)).strip()
        items.append(f'          <li><a href="#{m.group(1)}">{title}</a></li>')
    if include_faq:
        items.append('          <li><a href="#faq">자주 묻는 질문</a></li>')
    return "\n".join(items)


def faq_html_and_ld(faq, long_form=False):
    if not faq:
        return "", None
    if long_form:
        parts = ['      <section id="faq" class="article-v1-section" data-article-reveal="up" aria-label="자주 묻는 질문">',
                 '        <p class="article-v1-kicker">10 · 자주 묻는 질문</p>',
                 '        <h2>테더 구매 FAQ</h2>',
                 '        <div class="article-v1-faq-list">']
    else:
        parts = ['        <section class="faq" aria-label="자주 묻는 질문">',
                 "          <h2 id=\"faq\">자주 묻는 질문</h2>"]
    entities = []
    for item in faq:
        parts.append('          <details class="faq-item">' if long_form else "          <details>")
        parts.append(f"            <summary>{esc(item['q'])}</summary>")
        parts.append(f"            <p>{esc(item['a'])}</p>")
        parts.append("          </details>")
        entities.append({
            "@type": "Question", "name": item["q"],
            "acceptedAnswer": {"@type": "Answer", "text": item["a"]},
        })
    if long_form:
        parts.append("        </div>")
        parts.append("      </section>")
    else:
        parts.append("        </section>")
    ld = {"@context": "https://schema.org", "@type": "FAQPage", "mainEntity": entities}
    return "\n".join(parts), ld


def exchange_tabs(active_slug=""):
    exchanges = (("upbit", "업비트"), ("bithumb", "빗썸"),
                 ("coinone", "코인원"), ("korbit", "코빗"), ("gopax", "고팍스"))
    links = []
    for slug, name in exchanges:
        current = ' aria-current="page"' if slug == active_slug else ""
        links.append(f'    <a href="/exchange/{slug}/"{current}>{name}</a>')
    return ('<nav class="exchange-tabbar" aria-label="거래소별 테더 구매 방법">\n'
            '  <span>거래소 선택</span>\n' + "\n".join(links) + "\n</nav>")


def build_article(a, guide_map, insight_map, exchange_map=None):
    section_names = {"guide": "가이드", "insight": "인사이트", "exchange": "거래소별"}
    section_name = section_names.get(a["section"], a["section"])
    section_url = f"/{a['section']}/"
    related_cards = []
    for url in a.get("related", [])[:4]:
        info = card_info(url, guide_map, insight_map, exchange_map)
        if info:
            related_cards.append(card_html(url, *info))
        else:
            print(f"[warn] {a['url']}: 관련 링크 대상 없음 {url}")
    long_form = a.get("layout") == "long-form"
    faq_section, faq_ld = faq_html_and_ld(a.get("faq"), long_form=long_form)

    cta = a.get("cta") or {
        "title": "지금 USDT 김프 확인하기",
        "desc": "업비트·빗썸 테더 시세와 김프를 10분 단위로 갱신합니다.",
        "url": "/", "label": "김프 현황판 보기",
    }

    template_name = "long-article-body" if long_form else "article-body"
    body_tokens = {
        "SECTION_URL": section_url,
        "SECTION_NAME": section_name,
        "ARTICLE_TITLE_SHORT": esc(a["title_short"]),
        "ARTICLE_H1": esc(a.get("h1", a["title"])),
        "DATE_PUBLISHED": a["date_published"],
        "DATE_MODIFIED": a.get("date_modified", a["date_published"]),
        "TOC_ITEMS": toc_items(a["body"]),
        "ARTICLE_CONTENT": a["body"],
        "FAQ_SECTION": faq_section,
        "CTA_TITLE": esc(cta["title"]),
        "CTA_DESC": esc(cta["desc"]),
        "CTA_URL": cta["url"],
        "CTA_LABEL": esc(cta["label"]),
        "RELATED_CARDS": "\n".join(related_cards),
        "EXCHANGE_TABS": exchange_tabs(a["slug"]) if a["section"] == "exchange" else "",
    }
    if long_form:
        core_checks = "\n".join(
            f'          <li><span aria-hidden="true">✓</span>{esc(item)}</li>'
            for item in a.get("core_checks", [])[:4]
        )
        source_items = "\n".join(
            f'          <li><a href="{item["url"]}" rel="noopener">{esc(item["title"])}</a></li>'
            for item in a.get("sources", [])
        )
        sources_section = (
            '    <section class="article-v1-sources" data-article-reveal="left" aria-label="공식 출처">\n'
            '      <div>\n'
            '        <h2>공식 출처와 확인 기준</h2>\n'
            f'        <p>거래 지원, 수수료, 네트워크와 출금 규정은 변경될 수 있습니다. 공식 자료와 이용 서비스의 최신 화면에서 최종 확인하세요. (검토일: {a.get("date_modified", a["date_published"])})</p>\n'
            '        <ul>\n'
            f'{source_items}\n'
            '        </ul>\n'
            '      </div>\n'
            '    </section>'
        )
        body_tokens.update({
            "ARTICLE_EYEBROW": esc(a.get("eyebrow", "USDT INFORMATION GUIDE")),
            "HERO_LEAD": esc(a.get("hero_lead", a["description"])),
            "CORE_TITLE": esc(a.get("core_title", "진행 전에 핵심 조건을 확인하세요")),
            "CORE_CHECKS": core_checks,
            "TOC_ITEMS": long_toc_items(a["body"], include_faq=bool(a.get("faq"))),
            "SOURCES_SECTION": sources_section,
        })
    body = render(TPL[template_name], body_tokens)

    lds = [{
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": a.get("h1", a["title"]),
        "description": a["description"],
        "datePublished": a["date_published"],
        "dateModified": a.get("date_modified", a["date_published"]),
        "author": {"@type": "Organization", "name": "테더뷰", "url": BASE_URL},
        "publisher": {"@type": "Organization", "name": "테더뷰"},
        "mainEntityOfPage": BASE_URL + a["url"],
        "inLanguage": "ko",
    }, {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "홈", "item": BASE_URL + "/"},
            {"@type": "ListItem", "position": 2, "name": section_name, "item": BASE_URL + section_url},
            {"@type": "ListItem", "position": 3, "name": a["title_short"], "item": BASE_URL + a["url"]},
        ],
    }]
    if faq_ld:
        lds.append(faq_ld)
    if a.get("hero_image"):
        lds[0]["image"] = BASE_URL + a["hero_image"]

    render_page(
        os.path.join(a["section"], a["slug"], "index.html"),
        a["url"], a["title"] + " | 테더뷰", a["description"], body,
        og_type="article", jsonld_html="".join(jsonld(x) for x in lds),
        nav=a.get("nav", a["section"].upper()),
        robots_meta=('<meta name="robots" content="noindex,nofollow">'
                     if a.get("draft_noindex") else ""),
        hero_image=a.get("hero_image", ""),
    )
    add_map(a["url"], a.get("date_modified", a["date_published"]))


# ── 빌드 실행 ─────────────────────────────────────────────────────

def main():
    guides = load_articles("guide")
    insights = load_articles("insight")
    exchanges = load_articles("exchange")
    guide_map = {a["url"]: a for a in guides}
    insight_map = {a["url"]: a for a in insights}
    exchange_map = {a["url"]: a for a in exchanges}

    # 홈 카드
    featured = [a for a in guides if a.get("featured")] or guides
    home_guide_cards = "\n".join(
        card_html(a["url"], "가이드", a["title_short"], a["description"]) for a in featured[:6])
    home_insight_cards = "\n".join(
        card_html(a["url"], "인사이트", a["title_short"], a["description"]) for a in insights[:3])

    dt = dict(DATA_TOKENS)
    dt["HOME_GUIDE_CARDS"] = home_guide_cards or card_html("/guide/", *STATIC_PAGES["/guide/"])
    dt["HOME_INSIGHT_CARDS"] = home_insight_cards or card_html("/insight/", *STATIC_PAGES["/insight/"])

    kimp_now = g(latest, "derived", "kimp_usdt_upbit")
    home_desc = ("업비트·빗썸 테더(USDT) 시세와 달러 환율 대비 김치프리미엄·역프를 10분 단위로 확인하세요."
                 if kimp_now is None else
                 f"지금 업비트 USDT {dt['USDT_UPBIT_PRICE']}원, 김프 {fmt_pct(kimp_now)}. "
                 "업비트·빗썸 테더 시세와 김치프리미엄·역프를 10분 단위로 확인하세요.")
    ld_home = jsonld({
        "@context": "https://schema.org", "@type": "WebSite",
        "name": "테더뷰",
        "alternateName": ["usdt.io.kr", "TetherView", "테더뷰 — 디지털 달러의 기준"],
        "url": BASE_URL,
        "description": "테더(USDT) 특화 시세·김치프리미엄 정보 사이트",
        "inLanguage": "ko",
    })
    render_page("index.html", "/",
                "USDT 시세 · 테더 김치프리미엄 확인 — 10분마다 갱신 | 테더뷰",
                home_desc, render(TPL["home-body"], dt),
                jsonld_html=ld_home, nav=None, extra_scripts=CHART_JS)
    add_map("/")

    # /price/usdt/
    render_page("price/usdt/index.html", "/price/usdt/",
                "USDT 시세 — 테더 원화 가격·김프 통합 비교 | 테더뷰",
                f"테더(USDT) 원화 시세 통합 비교. 업비트 {dt['USDT_UPBIT_PRICE']}원 · 빗썸 "
                f"{dt['USDT_BITHUMB_PRICE']}원 · 달러 환율 {dt['FX_USDKRW']}원. 김프까지 한 화면에서.",
                render(TPL["price-usdt-body"], dt),
                nav="PRICE", extra_scripts=CHART_JS)
    add_map("/price/usdt/")

    # /price/usdt-upbit/, /price/usdt-bithumb/
    ex_blurbs = {
        "upbit": ('<p style="margin-top:0;">업비트는 원화마켓(KRW-USDT)에서 테더를 원화로 직접 사고팔 수 있는 '
                  "국내 대표 거래소 중 하나입니다. 테더 거래대금이 큰 편이라 USDT 김프를 볼 때 기준 시세로 자주 쓰입니다. "
                  "업비트에는 원화마켓 외에 USDT 마켓(테더로 다른 코인을 거래)도 있어, 원화→USDT→해외 코인으로 이어지는 "
                  "수요가 가격에 반영되는 구조입니다.</p>"
                  '<p style="margin-bottom:0;">등락률은 전일 종가 대비, 고가·저가는 당일(KST 0시 기준) 수치입니다. '
                  '거래 수수료·입출금 정책은 수시로 바뀌므로 <a href="/guide/how-to-buy-usdt/">USDT 사는법 가이드</a>와 '
                  "거래소 공지를 함께 확인하세요.</p>"),
        "bithumb": ('<p style="margin-top:0;">빗썸은 원화마켓에 USDT를 상장해 원화로 테더를 직접 거래할 수 있는 '
                    "국내 주요 거래소입니다. 업비트와 함께 국내 USDT 시세의 양대 축을 이루며, 두 거래소의 가격 차이는 "
                    "보통 크지 않지만 시장이 급변할 때는 잠시 벌어지기도 합니다.</p>"
                    '<p style="margin-bottom:0;">등락률·고가·저가는 24시간 기준 수치입니다. '
                    '거래 수수료·이벤트는 수시로 바뀌므로 <a href="/guide/how-to-buy-usdt/">USDT 사는법 가이드</a>와 '
                    "거래소 공지를 함께 확인하세요.</p>"),
    }
    for ex_key, ex_name, other_key, other_name, series_key, kimp_key, suffix in (
            ("upbit", "업비트", "usdt-bithumb", "빗썸", "usdt_upbit", "kimp_usdt_upbit", "(전일比)"),
            ("bithumb", "빗썸", "usdt-upbit", "업비트", "usdt_bithumb", "kimp_usdt_bithumb", "(24h)")):
        src = "upbit" if ex_key == "upbit" else "bithumb"
        kimp = g(latest, "derived", kimp_key)
        ex_tokens = dict(dt)
        ex_tokens.update({
            "EX_NAME": ex_name,
            "EX_PRICE": fmt_price_krw(g(latest, src, "USDT", "price")),
            "EX_CHANGE_CLASS": cls_of(g(latest, src, "USDT", "change_rate")),
            "EX_CHANGE_TEXT": (fmt_pct(g(latest, src, "USDT", "change_rate")) + " " + suffix
                               if g(latest, src, "USDT", "change_rate") is not None else "—"),
            "EX_HIGH": fmt_price_krw(g(latest, src, "USDT", "high")),
            "EX_LOW": fmt_price_krw(g(latest, src, "USDT", "low")),
            "EX_VOL": fmt_vol(g(latest, src, "USDT", "vol_krw")),
            "EX_KIMP": fmt_pct(kimp),
            "EX_KIMP_CLASS": cls_of(kimp),
            "EX_SERIES_KEY": series_key,
            "EX_BLURB": ex_blurbs[ex_key],
            "EX_OTHER_URL": f"/price/{other_key}/",
            "EX_OTHER_NAME": other_name,
            "EX_SUMMARY_SENTENCE": (
                f"{date_ko(updated_kst[:10])} {updated_kst[11:]} 기준 {ex_name} USDT는 "
                f"{fmt_price_krw(g(latest, src, 'USDT', 'price'))}원, 달러 환율 대비 김프는 "
                f"{fmt_pct(kimp)}입니다." if kimp is not None
                else "데이터 파이프라인 가동 후 시세 요약이 표시됩니다."),
        })
        render_page(f"price/usdt-{ex_key}/index.html", f"/price/usdt-{ex_key}/",
                    f"{ex_name} 테더(USDT) 시세 · 김프 | 테더뷰",
                    f"{ex_name} 원화마켓 테더(USDT) 현재가 {ex_tokens['EX_PRICE']}원, "
                    f"달러 환율 대비 김프 {ex_tokens['EX_KIMP']}. 10분마다 갱신됩니다.",
                    render(TPL["price-exchange-body"], ex_tokens),
                    nav="PRICE", extra_scripts=CHART_JS)
        add_map(f"/price/usdt-{ex_key}/")

    # /price/btc/
    render_page("price/btc/index.html", "/price/btc/",
                "비트코인 김치프리미엄 — 업비트 vs 바이낸스 | 테더뷰",
                f"비트코인 김프 {dt['BTC_KIMP']}. 업비트 원화가격과 바이낸스 달러가격(환율 환산)의 "
                "차이를 10분 단위로 추적합니다. USDT 김프와의 비교까지.",
                render(TPL["price-btc-body"], dt),
                nav="PRICE", extra_scripts=CHART_JS)
    add_map("/price/btc/")

    # /calc/kimp/
    calc_faq_ld = jsonld({
        "@context": "https://schema.org", "@type": "FAQPage",
        "mainEntity": [
            {"@type": "Question", "name": "어떤 환율을 넣어야 하나요?",
             "acceptedAnswer": {"@type": "Answer", "text": "일반적으로 매매기준율(공시 환율)을 사용합니다. 은행 송금 환율과는 다를 수 있습니다."}},
            {"@type": "Question", "name": "USDT 김프는 어떻게 계산하나요?",
             "acceptedAnswer": {"@type": "Answer", "text": "해외 가격에 1을 넣으면 됩니다. 국내 USDT 가격을 환율로 나눈 값이 곧 김프입니다."}},
        ]})
    render_page("calc/kimp/index.html", "/calc/kimp/",
                "김프 계산기 — 김치프리미엄 바로 계산 | 테더뷰",
                "국내 가격·해외 가격·환율만 넣으면 김치프리미엄이 바로 계산됩니다. "
                "USDT·비트코인 김프 계산 공식과 주의점까지 정리했습니다.",
                render(TPL["calc-kimp-body"], dt),
                jsonld_html=calc_faq_ld, nav="CALC", extra_scripts=CALC_JS)
    add_map("/calc/kimp/")

    # 계산기 허브 + 추가 계산기 4종
    calc_pages = [
        ("calc-hub-body", "/calc/", "코인 계산기 모음 — 김프·평단가·수익률·변환·복리 | 테더뷰",
         "김프 계산기부터 평단가·물타기, 수수료 포함 수익률, 원화·달러·USDT 변환, 복리 계산기까지 "
         "설치 없이 무료로 쓰는 코인 계산기 모음입니다.", None,
         [("어느 계산기를 써야 하나요?",
           "국내외 가격 차이는 김프 계산기, 단위 변환은 변환기, 추가 매수 검토는 평단가 계산기, 실제 손익은 수익률 계산기를 사용하세요."),
          ("입력한 값이 저장되거나 전송되나요?",
           "아니요. 모든 계산은 브라우저 안에서만 실행되며 서버로 아무것도 전송하지 않습니다.")]),
        ("calc-convert-body", "/calc/convert/", "원화 달러 USDT 변환 계산기 — 환율·테더 시세 자동 반영 | 테더뷰",
         "원화↔달러↔테더(USDT)를 한 번에 변환합니다. 공개 환율과 업비트 USDT 시세가 자동 반영되어 "
         "김프 차이까지 그대로 보입니다.", CALC_TOOLS_JS,
         [("환전 수수료도 반영되나요?",
           "아니요. 기준 시세만 적용합니다. 실제 환전은 우대율 스프레드, 거래소 매매는 거래 수수료가 추가됩니다."),
          ("USDT 시세는 어느 거래소 기준인가요?",
           "업비트 KRW-USDT 체결가 기준이며 10분마다 갱신됩니다. 직접 수정해 다른 가격으로 계산할 수도 있습니다.")]),
        ("calc-average-body", "/calc/average/", "평단가 계산기 (물타기 계산기) — 추가매수 후 평단 바로 계산 | 테더뷰",
         "보유 수량·평단가에 추가 매수를 더하면 새 평단가와 총 투자금이 바로 계산됩니다. "
         "물타기 공식과 주의점까지 정리했습니다.", CALC_TOOLS_JS,
         [("수량 대신 금액으로 계산할 수 있나요?",
           "추가 매수 수량 칸에 매수 금액을 매수 가격으로 나눈 값을 넣으면 됩니다."),
          ("수수료는 반영되나요?",
           "평단가 계산기는 가격만 계산합니다. 수수료 포함 손익은 수익률 계산기를 사용하세요.")]),
        ("calc-profit-body", "/calc/profit/", "코인 수익률 계산기 — 수수료 포함 손익·본전가 계산 | 테더뷰",
         "매수가·매도가·수량에 거래 수수료까지 반영해 실제 손익과 수익률, 본전가를 계산합니다.",
         CALC_TOOLS_JS,
         [("아직 안 팔았는데 평가손익을 보려면요?",
           "매도가 칸에 현재가를 넣으면 지금 매도 기준의 평가손익이 계산됩니다."),
          ("세금도 계산해주나요?",
           "가상자산 과세는 시행 시기와 세부 기준이 확정 단계가 아니라 반영하지 않았습니다.")]),
        ("calc-compound-body", "/calc/compound/", "복리 계산기 — 회차별 복리 수익 시뮬레이션 | 테더뷰",
         "원금·회당 수익률·반복 횟수로 복리 결과를 계산합니다. 추가 납입과 마이너스 수익률 "
         "시나리오도 지원합니다.", CALC_TOOLS_JS,
         [("'회'는 일·월·년 중 뭔가요?",
           "단위는 자유입니다. 회당 수익률과 횟수의 단위만 맞추면 됩니다."),
          ("수익이 보장되는 계산인가요?",
           "아니요. 매회 같은 수익률이라는 가정의 산술 결과일 뿐이며 실제 수익률은 일정하지 않습니다.")]),
    ]
    for tpl_name, path, title, desc, extra, faqs in calc_pages:
        out_rel = "calc/index.html" if path == "/calc/" else path.strip("/").replace("/", os.sep) + os.sep + "index.html"
        render_page(out_rel, path, title, desc,
                    render(TPL[tpl_name], dt),
                    jsonld_html=faq_ld(faqs), nav="CALC",
                    extra_scripts=extra or "")
        add_map(path)

    # /history/ + 일별 페이지
    hist_dir = os.path.join(DATA_DIR, "history")
    days = []
    if os.path.isdir(hist_dir):
        for name in sorted(os.listdir(hist_dir)):
            if re.fullmatch(r"\d{4}-\d{2}-\d{2}\.json", name):
                d = load_json(os.path.join(hist_dir, name))
                if d and d.get("kimp_usdt"):
                    days.append(d)
    days.sort(key=lambda d: d["date"])

    for i, d in enumerate(days):
        ds = d["date"]
        k = d["kimp_usdt"]
        backfill = d.get("source") == "backfill"
        prev_link = (f'<a class="btn ghost" href="/history/{days[i-1]["date"]}/">← {date_ko(days[i-1]["date"])}</a>'
                     if i > 0 else "<span></span>")
        next_link = (f'<a class="btn ghost" href="/history/{days[i+1]["date"]}/">{date_ko(days[i+1]["date"])} →</a>'
                     if i < len(days) - 1 else "<span></span>")
        if backfill:
            basis = ("집계 기준: 업비트 KRW-USDT 일봉(종가·고가·저가)과 ECB 일별 환율로 "
                     "소급 산출한 기록입니다. 주말·공휴일 환율은 직전 영업일 값을 사용합니다.")
            sentence = (f"{date_ko(ds)} 업비트 기준 USDT 김치프리미엄은 종가 {fmt_pct(k['close'])}, "
                        f"장중 최고 {fmt_pct(k['max'])}, 최저 {fmt_pct(k['min'])}로 산출됩니다"
                        " (일봉·ECB 환율 기준).")
        else:
            basis = (f"집계 기준: 10분 단위 스냅샷 {d.get('points', '—')}건 "
                     "(업비트 KRW-USDT · 공개 환율 API)")
            sentence = (f"{date_ko(ds)} 업비트 기준 USDT 김치프리미엄은 평균 {fmt_pct(k['avg'])}, "
                        f"최고 {fmt_pct(k['max'])}, 최저 {fmt_pct(k['min'])}를 기록했습니다.")
        day_tokens = dict(dt)
        day_tokens.update({
            "DAY_DATE_KO": date_ko(ds),
            "DAY_KIMP_LABEL": "종가" if backfill else "평균",
            "DAY_KIMP_AVG": fmt_pct(k["avg"]), "DAY_KIMP_AVG_CLASS": cls_of(k["avg"]),
            "DAY_KIMP_MAX": fmt_pct(k["max"]), "DAY_KIMP_MIN": fmt_pct(k["min"]),
            "DAY_USDT_CLOSE": fmt_price_krw(g(d, "usdt_upbit", "close")),
            "DAY_USDT_HIGH": fmt_price_krw(g(d, "usdt_upbit", "high")),
            "DAY_USDT_LOW": fmt_price_krw(g(d, "usdt_upbit", "low")),
            "DAY_FX": fmt_num(d.get("usdkrw_close"), 1),
            "DAY_BASIS_NOTE": basis,
            "PREV_LINK": prev_link, "NEXT_LINK": next_link,
            "DAY_SUMMARY_SENTENCE": sentence,
        })
        render_page(f"history/{ds}/index.html", f"/history/{ds}/",
                    f"{date_ko(ds)} 김치프리미엄 기록 | 테더뷰",
                    day_tokens["DAY_SUMMARY_SENTENCE"],
                    render(TPL["history-day-body"], day_tokens),
                    og_type="article", nav="HISTORY")
        add_map(f"/history/{ds}/", ds)

    # 히스토리 색인
    if days:
        months = {}
        for d in reversed(days):
            months.setdefault(d["date"][:7], []).append(d)
        groups = []
        for month, items in months.items():
            y, m = month.split("-")
            rows = "\n".join(
                f'      <a class="day-item" href="/history/{d["date"]}/">'
                f'<span>{int(d["date"][8:10])}일</span>'
                f'<span class="kimp num {cls_of(d["kimp_usdt"]["avg"])}">{fmt_pct(d["kimp_usdt"]["avg"])}</span></a>'
                for d in items)
            groups.append(f'    <div class="month-group">\n      <h3>{int(y)}년 {int(m)}월</h3>\n'
                          f'      <div class="day-list">\n{rows}\n      </div>\n    </div>')
        month_groups = "\n".join(groups)
        archive_start = date_ko(days[0]["date"])
    else:
        month_groups = ('    <div class="card"><p style="margin:0;color:var(--ink-2);">'
                        "아직 쌓인 기록이 없습니다. 파이프라인 가동 다음 날부터 매일 자동으로 추가됩니다.</p></div>")
        archive_start = date_ko(today_kst) + " (가동 준비 중)"
    hist_tokens = dict(dt)
    hist_tokens.update({"MONTH_GROUPS": month_groups, "ARCHIVE_START": archive_start})
    ld_dataset = jsonld({
        "@context": "https://schema.org", "@type": "Dataset",
        "name": "USDT 김치프리미엄 일별 기록",
        "description": "업비트 KRW-USDT와 달러 환율 기반 김치프리미엄 일별 요약(평균·최고·최저) 아카이브",
        "url": BASE_URL + "/history/", "inLanguage": "ko",
        "creator": {"@type": "Organization", "name": "테더뷰"},
    })
    render_page("history/index.html", "/history/",
                "김치프리미엄 히스토리 — 일별 김프 기록 아카이브 | 테더뷰",
                "매일의 USDT 김치프리미엄 기록을 날짜별로 축적합니다. 평균·최고·최저 김프를 "
                "날짜별 페이지로 확인하세요.",
                render(TPL["history-index-body"], hist_tokens),
                jsonld_html=ld_dataset, nav="HISTORY", extra_scripts=CHART_JS)
    add_map("/history/")

    # /chart/ — TradingView 고급 차트
    render_page("chart/index.html", "/chart/",
                "김프 차트 — BTC·USDT 김치프리미엄, 코인·매크로 고급 차트 | 테더뷰",
                "TradingView 기반 고급 차트. BTC·USDT 김치프리미엄을 업비트·바이낸스·환율 시세로 "
                "실계산해 그리고, 도미넌스·환율·나스닥·금까지 한 화면에서 봅니다.",
                render(TPL["chart-body"], dt), nav="CHART",
                extra_scripts='<script src="/assets/js/chart-page.js" defer></script>')
    add_map("/chart/")

    # /price/compare/ — 전 코인 김프 비교
    def fmt_price_any(v):
        if v is None:
            return "—"
        if v >= 1000:
            return fmt_price_krw(v)
        if v >= 1:
            return fmt_num(v, 2)
        return fmt_num(v, 4)

    comp_rows = []
    for c in compare.get("coins", []):
        comp_rows.append(
            f'          <tr data-name="{esc(c["name"])} {c["sym"]}" data-krw="{c["krw"]}" '
            f'data-usd="{c["usd"]}" data-kimp="{c["kimp"] if c["kimp"] is not None else ""}" '
            f'data-change="{c["change"]}" data-vol="{c["vol"]:.0f}">'
            f'<td><img class="coin-logo" src="/assets/coins/{c["sym"]}.png" alt="" '
            f'width="20" height="20" loading="lazy" onerror="this.style.display=\'none\'">'
            f'{esc(c["name"])} <span style="color:var(--ink-3);font-size:12px;">{c["sym"]}</span></td>'
            f'<td class="r num">{fmt_price_any(c["krw"])}원</td>'
            f'<td class="r num">${fmt_usd(c["usd"])}</td>'
            f'<td class="r num {cls_of(c["kimp"])}">{fmt_pct(c["kimp"])}</td>'
            f'<td class="r num {cls_of(c["change"])}">{fmt_pct(c["change"])}</td>'
            f'<td class="r num">{fmt_vol(c["vol"])}</td></tr>')
    comp_tokens = dict(dt)
    comp_tokens.update({
        "COMPARE_COUNT": str(len(comp_rows)) if comp_rows else "0",
        "COMPARE_ROWS": ("\n".join(comp_rows) if comp_rows else
                         '          <tr><td colspan="6" style="color:var(--ink-2);">비교 데이터 수집 준비 중입니다. 파이프라인 가동 후 채워집니다.</td></tr>'),
    })
    render_page("price/compare/index.html", "/price/compare/",
                "전 코인 김치프리미엄 비교 — 업비트 vs 바이낸스 | 테더뷰",
                f"업비트·바이낸스 공통 상장 코인 {len(comp_rows)}개의 김프를 한 표에서 비교합니다. "
                "김프·전일比·거래대금으로 정렬하고 코인 이름으로 검색하세요. 10분마다 갱신.",
                render(TPL["price-compare-body"], comp_tokens), nav="PRICE",
                extra_scripts='<script src="/assets/js/table-sort.js" defer></script>')
    add_map("/price/compare/")

    # /news/
    news_updated = "수집 준비 중"
    if news.get("fetched_iso"):
        try:
            news_updated = (datetime.fromisoformat(news["fetched_iso"].replace("Z", "+00:00"))
                            .astimezone(KST).strftime("%Y-%m-%d %H:%M"))
        except ValueError:
            pass
    news_tokens = dict(dt)
    news_tokens.update({
        "NEWS_UPDATED": news_updated,
        "NEWS_LIST_FULL": (news_items_html(news.get("items", []), with_topic=True)
                           or '          <li><div class="meta">뉴스 수집 준비 중입니다. 파이프라인 가동 후 시간당 갱신됩니다.</div></li>'),
    })
    render_page("news/index.html", "/news/",
                "테더·스테이블코인·김프 뉴스 헤드라인 | 테더뷰",
                "테더(USDT)·스테이블코인 규제·김치프리미엄 관련 최신 뉴스 헤드라인을 자동 수집해 "
                "시간당 갱신합니다. 원문은 각 언론사 링크로 연결됩니다.",
                render(TPL["news-body"], news_tokens), nav="NEWS")
    add_map("/news/")

    # 가이드·인사이트 본문
    for a in guides + insights + exchanges:
        build_article(a, guide_map, insight_map, exchange_map)

    # 색인 페이지
    for section, items, eyebrow, title, page_title, desc in (
            ("guide", guides, "가이드",
             "김프·테더·스테이블코인 가이드",
             "가이드 — 김프·테더·스테이블코인 완전 정리 | 테더뷰",
             "김치프리미엄이 뭔지, 테더는 어떻게 사는지, 스테이블코인 규제는 어디로 가는지 — 처음부터 차근차근 정리했습니다."),
            ("insight", insights, "인사이트",
             "디지털 달러 인사이트",
             "인사이트 — 컴퓨트달러와 디지털 달러의 미래 | 테더뷰",
             "컴퓨트달러, AI 에이전트 결제, 스테이블코인과 미국 국채 — 오늘의 시세 너머에서 벌어지는 달러 패권의 재편을 다룹니다."),
            ("exchange", exchanges, "거래소별",
             "거래소별 테더(USDT) 구매 방법",
             "거래소별 테더 구매 방법 — 업비트·빗썸·코인원·코빗·고팍스 | 테더뷰",
             "업비트·빗썸·코인원·코빗·고팍스에서 원화로 테더를 구매하는 순서와 출금 전 확인사항을 거래소별로 정리했습니다.")):
        cards = "\n".join(
            card_html(a["url"], eyebrow, a["title_short"], a["description"]) for a in items) \
            or ('      <div class="card"><p style="margin:0;color:var(--ink-2);">'
                "콘텐츠 준비 중입니다.</p></div>")
        idx_tokens = dict(dt)
        idx_tokens.update({"INDEX_EYEBROW": eyebrow, "INDEX_TITLE": title,
                           "INDEX_DESC": desc,
                           "CARDS": (exchange_tabs() + '\n<div class="exchange-index-cards">' + cards + '</div>'
                                     if section == "exchange" else cards)})
        render_page(f"{section}/index.html", f"/{section}/", page_title, desc,
                    render(TPL["index-listing-body"], idx_tokens), nav=section.upper())
        add_map(f"/{section}/")

    # 404
    render_page("404.html", "/404.html",
                "페이지를 찾을 수 없습니다 | 테더뷰",
                "요청하신 페이지를 찾을 수 없습니다.",
                render(TPL["404-body"], dt))

    # sitemap.xml
    urls = []
    for path, lastmod in sorted(set(SITEMAP)):
        urls.append(f"  <url><loc>{BASE_URL}{path}</loc><lastmod>{lastmod}</lastmod></url>")
    write(os.path.join(SITE_DIR, "sitemap.xml"),
          '<?xml version="1.0" encoding="UTF-8"?>\n'
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
          + "\n".join(urls) + "\n</urlset>\n")

    print(f"빌드 완료: 페이지 {len(SITEMAP)}개 + 404 (가이드 {len(guides)} · 인사이트 {len(insights)} · 거래소 {len(exchanges)} · 히스토리 {len(days)})")


if __name__ == "__main__":
    main()
