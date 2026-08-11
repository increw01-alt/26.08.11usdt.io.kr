#!/usr/bin/env python3
"""usdt.io.kr 시세 수집기.

업비트·빗썸·바이낸스·환율·코인게코·구글뉴스 공개 API/RSS에서 데이터를 수집해
site/data/latest.json, series.json, news.json, history/YYYY-MM-DD.json 을 갱신한다.

- 표준 라이브러리만 사용 (pip install 불필요)
- 모든 API 호출에 timeout=10
- 소스 실패 시 직전 데이터 유지 + stale 표시 (빈 페이지 배포 금지)
- 시총·뉴스는 55분 캐시 (10분 크론에서도 시간당 1회만 원격 호출)
"""
import email.utils
import json
import os
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from datetime import datetime, timedelta, timezone

KST = timezone(timedelta(hours=9))
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, "site", "data")
HIST_DIR = os.path.join(DATA_DIR, "history")

SERIES_KEEP_DAYS = 8  # 차트는 7일 표시, 여유 1일
COINS = ["BTC", "ETH", "XRP", "SOL", "DOGE", "ADA", "TRX"]

UPBIT_URL = ("https://api.upbit.com/v1/ticker?markets=KRW-USDT,"
             + ",".join("KRW-" + c for c in COINS))
BITHUMB_URL = "https://api.bithumb.com/public/ticker/USDT_KRW"
BINANCE_URL = ("https://api.binance.com/api/v3/ticker/price?symbols="
               + urllib.parse.quote(json.dumps([c + "USDT" for c in COINS],
                                               separators=(",", ":"))))
UPBIT_MARKETS_URL = "https://api.upbit.com/v1/market/all"
UPBIT_TICKER_URL = "https://api.upbit.com/v1/ticker?markets={markets}"
BINANCE_ALL_URL = "https://api.binance.com/api/v3/ticker/price"
BINANCE_INFO_URL = ("https://api.binance.com/api/v3/exchangeInfo"
                    "?symbolStatus=TRADING&showPermissionSets=false")
COMPARE_LIMIT = 120  # 거래대금 상위 N개만 비교 테이블에 노출
COMPARE_OUTLIER_PP = 12.0  # 중앙값에서 ±N%p 벗어나면 제외 (상폐 잔가·동명이코인 방지)
ERAPI_URL = "https://open.er-api.com/v6/latest/USD"
EXIM_URL = ("https://oapi.koreaexim.go.kr/site/program/financial/exchangeJSON"
            "?authkey={key}&searchdate={date}&data=AP01")
GECKO_URL = ("https://api.coingecko.com/api/v3/simple/price"
             "?ids=tether&vs_currencies=usd&include_market_cap=true")
LLAMA_URL = "https://stablecoins.llama.fi/stablecoins?includePrices=false"
NEWS_QUERIES = [
    ("테더·USDT", "%ED%85%8C%EB%8D%94%20OR%20USDT"),
    ("스테이블코인", "%EC%8A%A4%ED%85%8C%EC%9D%B4%EB%B8%94%EC%BD%94%EC%9D%B8"),
    ("김치프리미엄", "%EA%B9%80%EC%B9%98%ED%94%84%EB%A6%AC%EB%AF%B8%EC%97%84"),
]
NEWS_URL = "https://news.google.com/rss/search?q={q}&hl=ko&gl=KR&ceid=KR:ko"


def fetch(url, timeout=10):
    req = urllib.request.Request(url, headers={
        "User-Agent": "usdt-io-kr-collector/1.0 (+https://usdt.io.kr)",
        "Accept": "*/*",
    })
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return resp.read()


def fetch_json(url, timeout=10):
    return json.loads(fetch(url, timeout).decode("utf-8"))


def load_json(path, default=None):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return default


def save_json(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(obj, f, ensure_ascii=False, separators=(",", ":"))
        f.write("\n")


def is_fresh(iso_str, minutes):
    try:
        t = datetime.fromisoformat(str(iso_str).replace("Z", "+00:00"))
        return (datetime.now(timezone.utc) - t) < timedelta(minutes=minutes)
    except (ValueError, TypeError):
        return False


# ── 수집기 ─────────────────────────────────────────────────────────

def collect_upbit():
    rows = fetch_json(UPBIT_URL)
    out = {}
    for row in rows:
        sym = row["market"].replace("KRW-", "")
        item = {
            "price": row["trade_price"],
            "change_rate": row["signed_change_rate"] * 100,  # 전일 종가 대비 %
            "high": row["high_price"],                        # 당일(KST 0시~) 고가
            "low": row["low_price"],
            "vol_krw": row["acc_trade_price_24h"],
        }
        if sym == "USDT":
            item["w52_high"] = row.get("highest_52_week_price")
            item["w52_high_date"] = row.get("highest_52_week_date")
            item["w52_low"] = row.get("lowest_52_week_price")
            item["w52_low_date"] = row.get("lowest_52_week_date")
        out[sym] = item
    return out


def collect_bithumb():
    body = fetch_json(BITHUMB_URL)
    if body.get("status") != "0000":
        raise RuntimeError("bithumb status " + str(body.get("status")))
    d = body["data"]
    return {"USDT": {
        "price": float(d["closing_price"]),
        "change_rate": float(d["fluctate_rate_24H"]),          # 24시간 대비 %
        "high": float(d["max_price"]),
        "low": float(d["min_price"]),
        "vol_krw": float(d["acc_trade_value_24H"]),
    }}


def collect_binance():
    rows = fetch_json(BINANCE_URL)
    return {row["symbol"][:-4]: float(row["price"]) for row in rows}


def collect_fx(now_kst):
    """환율. EXIM_API_KEY 가 있으면 한국수출입은행(공식) 우선, 실패 시 무료 대체 소스."""
    key = os.environ.get("EXIM_API_KEY", "").strip()
    if key:
        try:
            url = EXIM_URL.format(key=key, date=now_kst.strftime("%Y%m%d"))
            rows = fetch_json(url)
            for row in rows or []:
                if row.get("cur_unit") == "USD":
                    rate = float(str(row["deal_bas_r"]).replace(",", ""))
                    return {"usdkrw": rate, "source": "한국수출입은행 매매기준율",
                            "date": now_kst.strftime("%Y-%m-%d")}
        except Exception:
            pass  # 주말·공휴일·장전에는 빈 응답 → 대체 소스로
    body = fetch_json(ERAPI_URL)
    if body.get("result") != "success":
        raise RuntimeError("er-api result " + str(body.get("result")))
    return {"usdkrw": float(body["rates"]["KRW"]),
            "source": "환율 공개 API(exchangerate-api)",
            "date": now_kst.strftime("%Y-%m-%d")}


def collect_mcap(prev):
    """USDT 시가총액 (코인게코 → 실패 시 DefiLlama 유통량, 55분 캐시)."""
    cached = (prev or {}).get("usdt_mcap") or {}
    if is_fresh(cached.get("fetched_iso"), 55):
        return cached
    try:
        body = fetch_json(GECKO_URL)
        usd = body["tether"]["usd_market_cap"]
        source = "코인게코"
    except Exception:
        body = fetch_json(LLAMA_URL)
        tether = next(a for a in body["peggedAssets"] if a.get("symbol") == "USDT")
        usd = float(tether["circulating"]["peggedUSD"])
        source = "DefiLlama"
    return {"usd": usd, "source": source,
            "fetched_iso": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")}


def collect_news(prev_news):
    """구글뉴스 RSS 헤드라인 수집 (55분 캐시)."""
    if prev_news and is_fresh(prev_news.get("fetched_iso"), 55):
        return None  # 갱신 불필요
    items, seen = [], set()
    for topic, q in NEWS_QUERIES:
        try:
            xml_bytes = fetch(NEWS_URL.format(q=q))
            root = ET.fromstring(xml_bytes)
        except Exception as e:
            print(f"[warn] 뉴스({topic}) 수집 실패: {e}")
            continue
        for item in root.iter("item"):
            title = (item.findtext("title") or "").strip()
            link = (item.findtext("link") or "").strip()
            src = item.find("source")
            source = src.text.strip() if src is not None and src.text else ""
            pub = item.findtext("pubDate") or ""
            try:
                dt = email.utils.parsedate_to_datetime(pub)
                date_iso = dt.astimezone(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
            except (TypeError, ValueError):
                date_iso = ""
            # 구글뉴스 제목은 "제목 - 매체명" 형태 → 매체명 중복 제거
            if source and title.endswith(" - " + source):
                title = title[: -len(" - " + source)]
            key = title[:60]
            if not title or not link or key in seen:
                continue
            seen.add(key)
            items.append({"title": title, "link": link, "source": source,
                          "date": date_iso, "topic": topic})
    if not items:
        return None
    items.sort(key=lambda x: x["date"], reverse=True)
    return {"fetched_iso": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "items": items[:48]}


def collect_compare(usdkrw, kimp_usdt):
    """업비트 KRW마켓 ∩ 바이낸스 USDT마켓 전 코인 김프 비교."""
    markets = fetch_json(UPBIT_MARKETS_URL)
    krw_markets = [(m["market"], m["korean_name"]) for m in markets
                   if m["market"].startswith("KRW-")]
    names = dict(krw_markets)
    # 업비트 티커 (100개씩 분할 호출)
    tickers = []
    codes = [m for m, _ in krw_markets]
    for i in range(0, len(codes), 100):
        tickers += fetch_json(UPBIT_TICKER_URL.format(markets=",".join(codes[i:i + 100])))
    # 바이낸스: 거래중(TRADING) 심볼만 인정 — 상장폐지 코인의 잔존 가격 배제
    active = {s["symbol"] for s in fetch_json(BINANCE_INFO_URL)["symbols"]}
    busd = {r["symbol"]: float(r["price"]) for r in fetch_json(BINANCE_ALL_URL)
            if r["symbol"] in active}
    coins = []
    for row in tickers:
        sym = row["market"].replace("KRW-", "")
        if sym == "USDT":
            continue
        b = busd.get(sym + "USDT")
        if not b:
            continue
        kimp = premium(row["trade_price"], b, usdkrw)
        coins.append({
            "sym": sym,
            "name": names.get(row["market"], sym).replace("KRW-", ""),
            "krw": row["trade_price"],
            "usd": b,
            "kimp": kimp,
            "change": round(row["signed_change_rate"] * 100, 2),
            "vol": row["acc_trade_price_24h"],
        })
    # 중앙값 이상치 필터 — 동명이코인·일시 거래정지 등 비정상 김프 배제
    kimps = sorted(c["kimp"] for c in coins if c["kimp"] is not None)
    if kimps:
        median = kimps[len(kimps) // 2]
        outliers = [c["sym"] for c in coins
                    if c["kimp"] is None or abs(c["kimp"] - median) > COMPARE_OUTLIER_PP]
        if outliers:
            print(f"[info] 비교 제외(이상치 ±{COMPARE_OUTLIER_PP}%p): {','.join(outliers)}")
        coins = [c for c in coins
                 if c["kimp"] is not None and abs(c["kimp"] - median) <= COMPARE_OUTLIER_PP]
    coins.sort(key=lambda c: c["vol"], reverse=True)
    coins = coins[:COMPARE_LIMIT]
    return {
        "updated_iso": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "usdkrw": round(usdkrw, 2),
        "kimp_usdt": kimp_usdt,
        "coins": coins,
    }


def premium(domestic_krw, overseas_usd, usdkrw):
    base = overseas_usd * usdkrw
    if not base:
        return None
    return round((domestic_krw / base - 1) * 100, 2)


def update_series(series, point):
    pts = [p for p in series.get("points", []) if p["t"] != point["t"]]
    pts.append(point)
    cutoff = (datetime.now(timezone.utc)
              - timedelta(days=SERIES_KEEP_DAYS)).strftime("%Y-%m-%dT%H:%M:%SZ")
    pts = [p for p in pts if p["t"] >= cutoff]
    pts.sort(key=lambda p: p["t"])
    return {"points": pts}


def summarize_day(series, date_str):
    """KST 기준 date_str(YYYY-MM-DD) 하루치 스냅샷 요약."""
    pts = []
    for p in series.get("points", []):
        try:
            t = datetime.fromisoformat(p["t"].replace("Z", "+00:00"))
        except ValueError:
            continue
        if t.astimezone(KST).strftime("%Y-%m-%d") == date_str:
            pts.append(p)
    kimps = [p["kimp_usdt"] for p in pts if isinstance(p.get("kimp_usdt"), (int, float))]
    prices = [p["usdt_upbit"] for p in pts if isinstance(p.get("usdt_upbit"), (int, float))]
    fxs = [p["usdkrw"] for p in pts if isinstance(p.get("usdkrw"), (int, float))]
    if not kimps or not prices:
        return None
    return {
        "date": date_str,
        "source": "intraday",
        "points": len(pts),
        "kimp_usdt": {
            "avg": round(sum(kimps) / len(kimps), 2),
            "max": round(max(kimps), 2),
            "min": round(min(kimps), 2),
            "close": round(kimps[-1], 2),
        },
        "usdt_upbit": {
            "high": max(prices), "low": min(prices), "close": prices[-1],
        },
        "usdkrw_close": round(fxs[-1], 2) if fxs else None,
    }


def main():
    now_utc = datetime.now(timezone.utc)
    now_kst = now_utc.astimezone(KST)
    prev = load_json(os.path.join(DATA_DIR, "latest.json"), {}) or {}
    stale_sources = []

    def try_source(name, fn, fallback):
        try:
            return fn()
        except Exception as e:
            print(f"[warn] {name} 수집 실패: {e}")
            stale_sources.append(name)
            return fallback

    upbit = try_source("upbit", collect_upbit, prev.get("upbit"))
    bithumb = try_source("bithumb", collect_bithumb, prev.get("bithumb"))
    binance = try_source("binance", collect_binance, prev.get("binance"))
    fx = try_source("fx", lambda: collect_fx(now_kst), prev.get("fx"))
    mcap = try_source("mcap", lambda: collect_mcap(prev), prev.get("usdt_mcap"))

    if not upbit or not fx:
        # 첫 실행에서 핵심 소스가 모두 죽은 경우 — 기존 파일을 건드리지 않고 종료
        if not prev:
            raise SystemExit("핵심 소스(upbit/fx) 수집 실패 + 이전 데이터 없음 — 중단")
        upbit = upbit or prev.get("upbit")
        fx = fx or prev.get("fx")

    usdkrw = fx["usdkrw"]
    derived = {}
    if upbit and upbit.get("USDT"):
        derived["kimp_usdt_upbit"] = premium(upbit["USDT"]["price"], 1.0, usdkrw)
    if bithumb and bithumb.get("USDT"):
        derived["kimp_usdt_bithumb"] = premium(bithumb["USDT"]["price"], 1.0, usdkrw)
    if upbit and binance:
        for sym in COINS:
            if upbit.get(sym) and binance.get(sym):
                derived["kimp_" + sym.lower()] = premium(
                    upbit[sym]["price"], binance[sym], usdkrw)

    latest = {
        "updated_iso": now_utc.strftime("%Y-%m-%dT%H:%M:%SZ"),
        "updated_kst": now_kst.strftime("%Y-%m-%d %H:%M"),
        "stale": bool(stale_sources),
        "stale_sources": stale_sources,
        "fx": fx,
        "upbit": upbit,
        "bithumb": bithumb,
        "binance": binance,
        "usdt_mcap": mcap,
        "derived": derived,
    }
    save_json(os.path.join(DATA_DIR, "latest.json"), latest)
    print("latest.json 갱신:", latest["updated_kst"], "KST",
          "(stale: %s)" % ",".join(stale_sources) if stale_sources else "")

    # 전 코인 김프 비교 (실패 시 기존 파일 유지)
    compare = try_source("compare", lambda: collect_compare(
        usdkrw, derived.get("kimp_usdt_upbit")), None)
    if compare and compare["coins"]:
        save_json(os.path.join(DATA_DIR, "compare.json"), compare)
        print("compare.json 갱신:", len(compare["coins"]), "코인")

    # 뉴스 (시간당 1회)
    news_path = os.path.join(DATA_DIR, "news.json")
    prev_news = load_json(news_path)
    news = try_source("news", lambda: collect_news(prev_news), None)
    if news:
        save_json(news_path, news)
        print("news.json 갱신:", len(news["items"]), "건")

    # 시계열 갱신
    series_path = os.path.join(DATA_DIR, "series.json")
    series = load_json(series_path, {"points": []}) or {"points": []}
    point = {"t": latest["updated_iso"]}
    if upbit and upbit.get("USDT"):
        point["usdt_upbit"] = upbit["USDT"]["price"]
    if bithumb and bithumb.get("USDT"):
        point["usdt_bithumb"] = bithumb["USDT"]["price"]
    point["usdkrw"] = round(usdkrw, 2)
    if derived.get("kimp_usdt_upbit") is not None:
        point["kimp_usdt"] = derived["kimp_usdt_upbit"]
    if derived.get("kimp_btc") is not None:
        point["kimp_btc"] = derived["kimp_btc"]
    series = update_series(series, point)
    save_json(series_path, series)
    print("series.json 포인트:", len(series["points"]))

    # 일별 스냅샷 — 어제(KST) 파일이 없으면 생성 (하루 1회만 커밋되도록)
    yesterday = (now_kst - timedelta(days=1)).strftime("%Y-%m-%d")
    ypath = os.path.join(HIST_DIR, yesterday + ".json")
    if not os.path.exists(ypath):
        summary = summarize_day(series, yesterday)
        if summary:
            save_json(ypath, summary)
            print("일별 스냅샷 생성:", yesterday)


if __name__ == "__main__":
    main()
