#!/usr/bin/env python3
"""내부 링크 무결성 검사 — site/ 안의 모든 HTML에서 내부 href를 추출해
대상 파일이 실제 존재하는지 확인한다."""
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = os.path.join(ROOT, "site")

ok = True
checked = set()
for dirpath, _, files in os.walk(SITE):
    for name in files:
        if not name.endswith(".html"):
            continue
        path = os.path.join(dirpath, name)
        with open(path, encoding="utf-8") as f:
            html = f.read()
        for m in re.finditer(r'(?:href|src)="(/[^"#]*)', html):
            url = m.group(1)
            if url.startswith("//") or url in checked:
                continue
            checked.add(url)
            rel = url.lstrip("/")
            candidates = [os.path.join(SITE, rel.replace("/", os.sep))]
            if url.endswith("/"):
                candidates = [os.path.join(SITE, rel.replace("/", os.sep), "index.html")]
            if not any(os.path.exists(c) for c in candidates):
                print(f"[깨진 링크] {url}  (발견: {os.path.relpath(path, SITE)})")
                ok = False

print(f"검사한 내부 URL {len(checked)}개 — {'모두 정상' if ok else '문제 발견'}")
sys.exit(0 if ok else 1)
