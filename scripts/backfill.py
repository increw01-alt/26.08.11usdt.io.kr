#!/usr/bin/env python3
"""과거 시세 백필 (1회성, 재실행 안전).

업비트 일봉(최대 200일) + ECB 환율(frankfurter.app) + 바이낸스 일봉으로
- site/data/daily.json            장기 차트용 일별 시계열
- site/data/history/YYYY-MM-DD.json  과거 일별 김프 페이지 (없는 날짜만 생성)
을 만든다. 소급 데이터는 source="backfill"로 표시되어 페이지에 집계 기준이 병기된다.

주의: ECB 환율은 주말·공휴일이 없으므로 직전 영업일 환율을 이월(carry-forward)한다.
"""
import json
import os
import urllib.request
from datetime import datetime, timedelta, timezone

KST = timezone(timedelta(hours=9))
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, "site", "data")
HIST_DIR = os.path.join(DATA_DIR, "history")

DAYS = 200

UPBIT_CANDLES = "https://api.upbit.com/v1/candles/days?market={market}&count={count}"
BINANCE_KLINES = "https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1d&limit={count}"
FRANKFURTER = "https://api.frankfurter.app/{start}..{end}?from=USD&to=KRW"


def fetch_json(url, timeout=15):
    req = urllib.request.Request(url, headers={
        "User-Agent": "usdt-io-kr-backfill/1.0 (+https://usdt.io.kr)",
        "Accept": "application/json",
    })
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode("utf-8"))


def save_json(path, obj):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="\n") as f:
        json.dump(obj, f, ensure_ascii=False, separators=(",", ":"))
        f.write("\n")


def kimp(krw, usd, fx):
    if not (krw and usd and fx):
        return None
    return round((krw / (usd * fx) - 1) * 100, 2)


def main():
    today_kst = datetime.now(KST).strftime("%Y-%m-%d")

    # 1) 업비트 일봉 (candle_date_time_kst 기준)
    usdt_candles = {}
    for row in fetch_json(UPBIT_CANDLES.format(market="KRW-USDT", count=DAYS)):
        d = row["candle_date_time_kst"][:10]
        usdt_candles[d] = {"open": row["opening_price"], "high": row["high_price"],
                           "low": row["low_price"], "close": row["trade_price"]}
    btc_candles = {}
    for row in fetch_json(UPBIT_CANDLES.format(market="KRW-BTC", count=DAYS)):
        btc_candles[row["candle_date_time_kst"][:10]] = row["trade_price"]
    print(f"업비트 일봉: USDT {len(usdt_candles)}일, BTC {len(btc_candles)}일")

    # 2) 바이낸스 BTC 일봉 종가 (UTC 일봉 — 하루 단위 근사로 사용)
    btc_usd = {}
    try:
        for row in fetch_json(BINANCE_KLINES.format(count=DAYS)):
            d = datetime.fromtimestamp(row[0] / 1000, tz=timezone.utc).strftime("%Y-%m-%d")
            btc_usd[d] = float(row[4])
        print(f"바이낸스 BTC 일봉: {len(btc_usd)}일")
    except Exception as e:
        print(f"[warn] 바이낸스 일봉 실패 (BTC 김프 백필 생략): {e}")

    # 3) ECB 환율 (주말은 직전 영업일 이월)
    dates = sorted(usdt_candles)
    fx_raw = fetch_json(FRANKFURTER.format(start=dates[0], end=dates[-1]))
    fx_by_day = {d: v["KRW"] for d, v in fx_raw.get("rates", {}).items()}
    fx_filled, last = {}, None
    cur = datetime.strptime(dates[0], "%Y-%m-%d")
    end = datetime.strptime(dates[-1], "%Y-%m-%d")
    while cur <= end:
        ds = cur.strftime("%Y-%m-%d")
        if ds in fx_by_day:
            last = fx_by_day[ds]
        if last is not None:
            fx_filled[ds] = last
        cur += timedelta(days=1)
    print(f"ECB 환율: 원본 {len(fx_by_day)}일 → 이월 포함 {len(fx_filled)}일")

    # 4) daily.json (장기 차트용) — 오늘(미완성 일봉)은 제외
    days_out = []
    for d in dates:
        if d >= today_kst or d not in fx_filled:
            continue
        c = usdt_candles[d]
        fx = fx_filled[d]
        row = {"d": d,
               "usdt_close": c["close"], "usdt_high": c["high"], "usdt_low": c["low"],
               "usdkrw": round(fx, 2),
               "kimp_close": kimp(c["close"], 1.0, fx),
               "kimp_high": kimp(c["high"], 1.0, fx),
               "kimp_low": kimp(c["low"], 1.0, fx)}
        if d in btc_candles and d in btc_usd:
            row["kimp_btc"] = kimp(btc_candles[d], btc_usd[d], fx)
        days_out.append(row)
    save_json(os.path.join(DATA_DIR, "daily.json"), {"days": days_out})
    print(f"daily.json: {len(days_out)}일 저장")

    # 5) history/*.json 소급 생성 (기존 파일은 절대 덮어쓰지 않음)
    created = 0
    for row in days_out:
        path = os.path.join(HIST_DIR, row["d"] + ".json")
        if os.path.exists(path):
            continue
        save_json(path, {
            "date": row["d"],
            "source": "backfill",
            "points": 0,
            "kimp_usdt": {"avg": row["kimp_close"], "max": row["kimp_high"],
                          "min": row["kimp_low"], "close": row["kimp_close"]},
            "usdt_upbit": {"high": row["usdt_high"], "low": row["usdt_low"],
                           "close": row["usdt_close"]},
            "usdkrw_close": row["usdkrw"],
        })
        created += 1
    print(f"히스토리 소급 생성: {created}일 (기존 파일 보존)")


if __name__ == "__main__":
    main()
