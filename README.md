# usdt.io.kr — 테더(USDT) 특화 시세·김프 정보 사이트

전략: [전략 가이드 v2](../usdt-io-kr-전략가이드-v2.md) 기반.
포지셔닝: **오늘의 디지털 달러(USDT 시세·김프·아카이브) + 내일의 디지털 달러(컴퓨트달러 인사이트)**

## 구조

```
.github/workflows/update-data.yml   10분 주기 크론 (수집→빌드→커밋→배포)
scripts/collect.py                  시세·뉴스·시총 수집 (업비트·빗썸·바이낸스·환율·구글뉴스RSS, 표준 라이브러리만)
scripts/build.py                    전체 페이지 + sitemap.xml 렌더러
scripts/backfill.py                 과거 일봉 200일 소급 수집 (1회성, 재실행 안전)
scripts/check_links.py              내부 링크 무결성 검사
templates/                          페이지 셸·본문 템플릿
content/guide/*.json|html           가이드 15편 (메타 + 본문 프래그먼트)
content/insight/*.json|html         인사이트 7편
docs/article-spec.md                콘텐츠 작성 계약서 (새 글 추가 시 필독)
site/                               ← Cloudflare Pages 배포 루트 (빌드 산출물)
site/data/latest.json               최신 시세 (10분마다 덮어쓰기)
site/data/series.json               7일 시계열 (차트용)
site/data/history/YYYY-MM-DD.json   일별 스냅샷 (하루 1회 생성)
```

## 로컬 실행

```bash
python scripts/collect.py   # 시세 수집 (모든 호출 timeout=10)
python scripts/build.py     # site/ 전체 재생성
python -m http.server 8000 --directory site   # 로컬 프리뷰
```

의존성 없음 (Python 3.10+ 표준 라이브러리만).

## 배포 절차 (1회 설정)

1. **GitHub 리포 생성** (private 가능) 후 이 폴더를 push:
   ```bash
   git remote add origin https://github.com/<계정>/usdt-io-kr.git
   git push -u origin main
   ```
2. **GitHub Actions 활성화**: 리포 Settings → Actions → 기본 허용 확인.
   `update-data.yml`이 10분마다 수집·빌드·커밋한다 (`timeout-minutes: 10` 필수 유지).
3. **Cloudflare Pages 연결**: Workers & Pages → Create → Pages → 리포 연결.
   - Build command: **(비움)**
   - Build output directory: **`site`**
4. **커스텀 도메인**: Pages 프로젝트 → Custom domains → `usdt.io.kr` 추가 → 안내에 따라 DNS(CNAME) 설정.
5. **(선택) 공식 환율**: 한국수출입은행 오픈 API 키 발급 → 리포 Settings → Secrets → `EXIM_API_KEY` 등록.
   없으면 무료 대체 소스(exchangerate-api)를 자동 사용한다.
6. **서치콘솔 등록**: 구글 서치콘솔 + 네이버 서치어드바이저에 도메인 등록,
   `templates/shell.html`의 인증 메타태그 주석을 실제 값으로 교체 → 재빌드 → `https://usdt.io.kr/sitemap.xml` 제출.

## 운영 체크리스트

- [ ] **도메인 연장 — usdt.io.kr 만료 2026-09-09 (필수, 최우선)**
- [ ] GA4 속성 + Microsoft Clarity 설치 (shell.html에 스니펫 추가)
- [ ] 콘텐츠 15편+ 시점에 애드센스 신청
- [ ] 9월 정기국회 입법 진행 시 krw-stablecoin·digital-asset-basic-act 글 갱신 (date_modified 갱신)
- [ ] 월 1회 서치콘솔 쿼리 리뷰 → 콘텐츠 보강

## 새 글 추가 방법

1. `docs/article-spec.md` 계약대로 `content/<section>/<slug>.json` + `.html` 작성
2. `python scripts/build.py` → 본문·색인·sitemap 자동 반영

## 하지 말 것 (전략 가이드 §8)

USDT 매매·중개·환전·OTC 연결 / 해외거래소 레퍼럴 / 상품권 브랜드 상호 링크 /
재정거래 "따라하기" 콘텐츠 / "실시간" 표기 / 커뮤니티·로그인 기능 /
단정적 전망·수익 예측 / 미출시 코인 구매 안내
