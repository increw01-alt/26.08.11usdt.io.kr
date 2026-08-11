# 프로젝트 핸드오프 — 테더뷰 (usdt.io.kr)

> 다른 컴퓨터·다른 세션에서 이어서 작업할 때 이 문서 하나만 읽으면 되도록 정리한 현황 문서.
> 최종 갱신: 2026-08-11

## 1. 프로젝트가 무엇인가

- **테더뷰(TetherView)** — 테더(USDT) 특화 시세·김치프리미엄 정보 사이트. 태그라인 "디지털 달러의 기준"
- 도메인: **https://usdt.io.kr** (www 포함, Cloudflare Pages 배포, **라이브 상태**)
- 전략: [docs/strategy/usdt-io-kr-전략가이드-v2.md](strategy/usdt-io-kr-전략가이드-v2.md) 가 확정 스펙
  (요지: 김프가(kimpga)는 실시간 대시보드로 이기고 검색을 버렸다 → 우리는 USDT 특화 × SEO × 아카이브로 검색을 먹는다)
- 디자인 시안: [docs/design/](design/) (다크 핀테크 대시보드 — 이미 반영됨)

## 2. 현재 상태 (2026-08-11 기준)

**배포 완료·자동 운영 중.** GitHub Actions가 10분마다: 시세·뉴스 수집 → 236페이지 재빌드 → 커밋 → Cloudflare Pages 자동 배포.

| 영역 | 상태 |
|---|---|
| 홈 대시보드 | 김프 게이지·거래소 비교(달러 환산+스파크라인)·뉴스·52주/시총·장기차트 |
| /chart/ | TradingView 위젯 14종 시리즈 (BTC/USDT 김프는 수식 실계산) |
| /price/compare/ | 업비트↔바이낸스 120코인 김프 비교 (로고·정렬·검색) |
| /price/ | usdt·usdt-upbit·usdt-bithumb·btc 4페이지 |
| /calc/ | 김프·변환(원↔달러↔USDT)·평단가·수익률·복리 5종+허브 |
| /history/ | 197일 백필(일봉·ECB 환율) + 매일 자동 누적 |
| /news/ | 구글뉴스 RSS 시간당 자동 수집 (테더·스테이블코인·김프) |
| /guide/ 15편 | 김프·테더·스테이블코인·규제·세금 (article-spec 계약 준수) |
| /insight/ 7편 | 컴퓨트달러 선점 필러 (앵커: compute-dollar) |
| SEO | 페이지별 title/canonical/JSON-LD, sitemap 236URL, 코인 로고 121종 자체 호스팅 |

## 3. 계정·인프라 (모두 사용자 소유)

- GitHub: `increw01-alt/26.08.11usdt.io.kr` (main 브랜치, Actions 크론 활성)
- Cloudflare: Pages 프로젝트 `26-08-11usdt-io-kr`, 빌드 출력 디렉터리 `site`, 커스텀 도메인 usdt.io.kr·www
- 선택 시크릿: `EXIM_API_KEY` (미등록 — 등록 시 수출입은행 공식 환율 사용, 없어도 무료 소스로 동작)
- 네이버 서치어드바이저: 메타태그+확인파일 배포됨 → **[소유확인] 버튼 클릭 대기 중**
- 구글 서치콘솔: 미등록 (진행 방법 §5)

## 4. 다른 컴퓨터에서 시작하는 법

```bash
git clone https://github.com/increw01-alt/26.08.11usdt.io.kr.git usdt-io-kr
cd usdt-io-kr
python scripts/collect.py   # 시세 수집 (표준 라이브러리만, 의존성 없음)
python scripts/build.py     # 전체 재빌드
python -m http.server 8788 --directory site   # 로컬 프리뷰
```

- 필요 도구: git, Python 3.10+ (그 외 의존성 없음). GitHub 푸시 권한은 increw01 계정 로그인(`gh auth login` 권장)
- Claude Code로 이어서 할 경우: 이 저장소를 열고 **"docs/HANDOFF.md 읽고 이어서 진행해줘"** 라고 하면 됨

### 작업 규칙 (중요)

1. **로컬 빌드·커밋 전에 반드시 `git pull --rebase`** — 크론 봇이 10분마다 site/를 커밋하므로 순서를 지키지 않으면 충돌
2. site/ 생성 파일에서 충돌 시: 로컬 빌드본(`--theirs`)으로 해소 후 `build.py` 재실행으로 재생성 확인. **커밋 전 `grep -r "<<<<<<<" site`로 충돌 마커 검사**
3. 새 글 추가는 [docs/article-spec.md](article-spec.md) 계약 필수 (프래그먼트+메타 JSON → build.py가 조립)
4. 컴플라이언스(전략 v2 §8): 투자 권유·재정거래 따라하기·거래소 레퍼럴·"실시간" 표기·상품권 언급 금지

## 5. 남은 일 (우선순위순)

1. **★ 도메인 연장 — usdt.io.kr 만료 2026-09-09.** k-coin.kr도 연장 권장 (전략 v2 §1)
2. **네이버 소유확인 클릭** → 요청>사이트맵 제출: `https://usdt.io.kr/sitemap.xml` → 웹마스터도구>수집 요청(홈)
3. **구글 서치콘솔 등록** — 도메인 속성 권장: Cloudflare DNS에 TXT 레코드(이름 @) 추가 방식. URL 접두어 방식이면 메타태그를 `templates/shell.html`의 구글 주석 자리에 넣고 빌드·푸시
4. 서치콘솔 sitemap 제출 + 주요 페이지 색인 요청
5. ~~GA4 설치~~ (완료 — G-1TH4CMK8VW, shell.html에 적용) · Microsoft Clarity는 미설치 (선택)
6. 애드센스 신청 (콘텐츠 22편으로 요건 충족)
7. 2026년 9월 정기국회 — 디지털자산기본법·원화 스테이블코인 입법 진행 시
   `content/guide/krw-stablecoin`·`digital-asset-basic-act` 갱신(date_modified) + 속보 글
8. 백링크 시드: 티스토리/네이버 블로그 요약글
9. (선택) 토큰포스트식 추가 계산기: '그때 샀다면'(과거 시세 보유), 이동비용 등
10. (선택) OG 이미지 1200×630 제작 (`templates/shell.html`에 og:image 태그 추가)

## 6. 저장소 구조 요약

```
.github/workflows/update-data.yml   10분 크론 (수집→로고→빌드→커밋)
scripts/collect.py    시세·비교(120코인)·뉴스·시총 수집 — 모든 호출 timeout=10, 실패 시 이전값 유지
scripts/build.py      전 페이지+sitemap 렌더러 (템플릿 {{토큰}} 치환)
scripts/backfill.py   과거 일봉 백필 (1회성, 재실행 안전)
scripts/fetch_logos.py 코인 로고 자동 보충
scripts/check_links.py 내부 링크 검사 (빌드 후 실행 습관화)
templates/            셸+페이지 본문 템플릿
content/{guide,insight}/  아티클 (slug.json + slug.html 프래그먼트)
site/                 배포 루트 (생성물 — 직접 수정 금지, 템플릿·스크립트를 수정)
docs/article-spec.md  콘텐츠 작성 계약 (키워드·related·컴플라이언스 배정표)
docs/strategy/        전략 가이드 v1·v2 (v2가 확정 스펙)
docs/design/          디자인 시안
```

## 7. 이 세션에서 겪은 함정 (반복 금지)

- 코인게코 API: 이 환경에서 SSL 인증서 만료 → **DefiLlama 폴백**이 실동작 경로 (collect.py에 구현됨)
- 바이낸스 상장폐지 코인의 잔존 가격 → TRADING 심볼 필터 + 중앙값 ±12%p 이상치 제거로 해결 (동명이코인 'AI'도 걸러짐)
- 업비트 등락률은 전일 종가 대비, 빗썸은 24h 대비 — 표기 구분 유지할 것
- git stash 기반 우회 금지 — pull-rebase 먼저, 그 다음 빌드
