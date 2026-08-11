#!/usr/bin/env python3
"""코인 로고 수집 (업비트 정적 CDN → site/assets/coins/ 자체 호스팅).

compare.json 에 등장하는 코인 + 주요 코인의 로고 PNG를 없는 것만 내려받는다.
이미 있는 파일은 건너뛰므로 매 크론마다 실행해도 보통 0회 요청이다.
"""
import json
import os
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, "site", "data")
LOGO_DIR = os.path.join(ROOT, "site", "assets", "coins")
LOGO_URL = "https://static.upbit.com/logos/{sym}.png"

ALWAYS = ["USDT", "BTC", "ETH", "XRP", "SOL", "DOGE", "ADA", "TRX"]


def load_json(path):
    try:
        with open(path, encoding="utf-8") as f:
            return json.load(f)
    except (OSError, ValueError):
        return None


def main():
    os.makedirs(LOGO_DIR, exist_ok=True)
    syms = set(ALWAYS)
    compare = load_json(os.path.join(DATA_DIR, "compare.json")) or {}
    for c in compare.get("coins", []):
        syms.add(c["sym"])

    fetched = skipped = failed = 0
    for sym in sorted(syms):
        path = os.path.join(LOGO_DIR, sym + ".png")
        if os.path.exists(path):
            skipped += 1
            continue
        try:
            req = urllib.request.Request(LOGO_URL.format(sym=sym), headers={
                "User-Agent": "usdt-io-kr-logo/1.0 (+https://usdt.io.kr)"})
            with urllib.request.urlopen(req, timeout=10) as resp:
                data = resp.read()
            if data[:8] != b"\x89PNG\r\n\x1a\n":
                raise ValueError("PNG 아님")
            with open(path, "wb") as f:
                f.write(data)
            fetched += 1
        except Exception as e:
            print(f"[warn] {sym} 로고 실패: {e}")
            failed += 1
    print(f"로고: 신규 {fetched} · 보유 {skipped} · 실패 {failed}")


if __name__ == "__main__":
    main()
