# usdt.io.kr 콘텐츠 작성 계약서 (article-spec)

이 문서는 /guide/, /insight/ 아티클을 작성하는 모든 작성자(에이전트)가 **반드시 그대로 따라야 하는 계약**이다.
빌더(scripts/build.py)가 이 계약을 전제로 페이지를 조립하므로, 형식 위반은 빌드 경고/누락으로 이어진다.

기준일: 2026-08-11 (모든 날짜·시의성 판단의 기준)

---

## 1. 산출 파일 (아티클 1편당 2개)

```
content/<section>/<slug>.json   ← 메타데이터
content/<section>/<slug>.html   ← 본문 프래그먼트
```

`<section>`은 `guide` 또는 `insight`.

### 1-1. 메타 JSON 스키마

```json
{
  "title": "김치프리미엄이란? 뜻·발생 원인·확인법 총정리",
  "title_short": "김치프리미엄이란",
  "description": "김프(김치프리미엄)의 뜻과 발생 원인, 역프와의 차이, 확인 방법까지 처음 보는 사람 기준으로 정리했습니다.",
  "date_published": "2026-08-11",
  "date_modified": "2026-08-11",
  "order": 1,
  "featured": true,
  "related": ["/guide/reverse-premium/", "/calc/kimp/", "/"],
  "faq": [
    {"q": "질문?", "a": "답변. HTML 태그 없이 순수 텍스트."}
  ]
}
```

규칙:
- `title`: 검색 타이틀(사이트명 제외, 빌더가 " | usdt.io.kr" 자동 부착). **25~35자**, 핵심 키워드 앞쪽 배치.
- `title_short`: 브레드크럼·카드용. 15자 이내.
- `description`: 70~110자. 키워드 자연 포함, 낚시 금지.
- `order`, `featured`, `related`: 아래 §5 배정표의 값을 **그대로** 사용.
- `faq`: 3~5개. 답변은 태그 없는 순수 텍스트 1~3문장. (FAQPage 구조화 데이터로 자동 변환됨)
- JSON은 UTF-8, 유효한 JSON이어야 함 (마지막 쉼표 금지).

### 1-2. 본문 프래그먼트 규칙

- **전체 페이지가 아니라 본문 조각만** 작성한다. `<h1>`, `<html>`, `<head>`, 헤더/푸터, canonical 금지 — 빌더가 붙인다.
- 시작은 반드시 리드 문단: `<p class="lead">...</p>` (2~3문장, 글 전체 요약+후킹).
- 섹션 제목: `<h2 id="영문-케밥-슬러그">제목</h2>` — **id 필수** (목차 자동 생성). 4~7개 권장.
- 하위 제목: `<h3>` (id 선택).
- 표: 반드시 `<div class="table-wrap"><table>...</table></div>` 로 감싼다.
- 강조 박스: `<div class="callout"><p>...</p></div>`
- 경고/리스크 박스: `<div class="callout warn"><p><strong>주의:</strong> ...</p></div>`
- 출처 박스(인사이트는 필수, 가이드는 선택):
  ```html
  <div class="sources">
    <h4>출처·참고</h4>
    <ul>
      <li>매체/기관명, 「자료명」, 발표 시기</li>
    </ul>
  </div>
  ```
- 인라인 스타일, 외부 이미지, 외부 스크립트 금지. `{{` `}}` 문자열 금지 (토큰 충돌).
- 내부 링크는 §6 승인 URL 목록에서만. 본문 중 자연스러운 위치에 2~5개.
- 외부 하이퍼링크는 법령·공식 발표·공식 문서에 한해 최소한으로. 언론 인용은 출처 박스에 텍스트로.
- 분량(공백 포함): **가이드 3,500~6,000자 / 인사이트 4,500~8,000자**.

---

## 2. 톤 & 문체

- 존댓말("~합니다"), 처음 검색해 들어온 독자 기준. 용어는 첫 등장 시 풀어서 설명.
- 문단은 2~4문장으로 짧게. 표·리스트 적극 활용 (검색 스니펫 노출에 유리).
- 数値는 자릿수 구분 쉼표. 날짜는 "2026년 8월" 형식.
- 과장·낚시·단정 금지. "~라는 분석이 있습니다", "~로 알려져 있습니다" 톤 유지.

## 3. 컴플라이언스 (위반 시 게재 불가 — 최우선 규칙)

1. **투자 권유 금지**: "사라/팔아라/지금이 기회" 류 표현 절대 금지. 가격·수익 전망 단정 금지.
2. **재정거래 '따라하기' 금지**: 원리 설명은 가능하나 실행 가이드 톤 금지. 외국환거래법·송금 한도·세금 리스크를 반드시 병기.
3. **매매·중개·환전 연결 금지**: 특정 업체 OTC·구매대행·환전 언급 금지. 해외거래소 가입 유도·레퍼럴 금지 (거래소명 자체는 정보 목적으로 언급 가능).
4. **미출시·해외 코인(NET Dollar 등) 구매 경로 안내 금지**: 정보 소개까지만.
5. **"실시간" 표현 금지**: 본 사이트 데이터는 "10분마다 갱신"으로만 표현.
6. **전망 서술**: 단정 대신 분석 소개 + 출처 명기 + 가능하면 반론 병기.
7. 세금·법률 내용 끝에는 "개인 상황에 따라 다르므로 전문가 확인 필요" 취지 문장 포함.
8. 상품권·기프트카드 관련 언급 일절 금지.

## 4. 사실관계 (지식 기준일 주의)

- 2025년 이전 사실(테더 역사, 2022 디페깅, 김프 역사, TRC20/ERC20 구조 등)은 일반 지식으로 서술 가능.
- **2025~2026년 시사(GENIUS Act 세부, 디지털자산기본법 진행, 스테이블코인 시총, 테더 국채 보유량, NET Dollar, 구글 AP2, 가상자산 과세 시행 시기)는 WebSearch로 확인 후 서술**. 확인 불가 시 구체 숫자 대신 완곡 서술("~돌파한 것으로 알려짐")로 낮춘다.
- 아래 배경 사실은 전략 문서에서 검증된 것으로 사용 가능:
  - 컴퓨트달러: 2026년 7월 말 해외 칼럼(Project Syndicate 계열, Korea Times·Taipei Times 게재)으로 확산 시작한 개념. 페트로달러의 AI 시대 후계 구조론.
  - 에너지→데이터센터→컴퓨트→AI 에이전트 결제→스테이블코인 수요→미 국채 매입→달러 지배력 강화 루프. 페트로달러와 달리 정부 간 합의가 아닌 상업적 결정들의 집합으로 형성.
  - Cloudflare NET Dollar: 2025년 9월 발표, AI 에이전트 결제용 달러 스테이블코인. Coinbase와 x402 재단 설립.
  - Google AP2: 2025년 9월, Coinbase·이더리움재단·PayPal 등 참여한 AI 에이전트 결제 프로토콜.
  - 미국 GENIUS Act: 2025년 통과, 스테이블코인 발행·유통 규제 명확화. 이후 스테이블코인 시총 3,000억 달러 돌파.
  - 한국: 디지털자산기본법·원화 스테이블코인 입법이 2026년 하반기(9월 정기국회 분기점) 추진 중.
- 사이트 자체 데이터 언급 시: "usdt.io.kr 홈에서 10분 단위로 확인할 수 있습니다" 형태로 내부 링크.

---

## 5. 아티클 배정표

### 가이드 (content/guide/)

| slug | 방향(H1 소재) | 주 키워드 | 보조 키워드 | order | featured |
|---|---|---|---|---|---|
| kimchi-premium | 김치프리미엄이란? 뜻·원인·확인법 | 김치프리미엄, 김프 뜻 | 김프란, 김프 원인 | 1 | true |
| reverse-premium | 역프리미엄(역프) 뜻과 역프 때 일어나는 일 | 역프리미엄, 역프 뜻 | 역프 확인 | 2 | true |
| how-to-check-kimp | 김프 보는법 — 확인 사이트·지표 총정리 | 김프 보는법, 김프 확인 | 김프 사이트 | 3 | false |
| what-is-usdt | USDT란? 테더 완전 정리 | USDT란, 테더란 | 테더 코인, USDT 뜻 | 4 | true |
| how-to-buy-usdt | USDT 사는법 — 국내 거래소 비교 | USDT 사는법, 테더 사는법 | 테더 구매 | 5 | true |
| trc20-vs-erc20 | 트론(TRC20) vs 이더리움(ERC20) USDT 차이 | TRC20 ERC20 차이 | USDT 네트워크, 테더 전송 | 6 | false |
| usdt-withdrawal-fees | 거래소별 USDT 출금 수수료 비교 | USDT 출금 수수료 | 테더 출금, 테더 수수료 | 7 | false |
| usdc-vs-usdt | USDC vs USDT 비교 — 무엇이 다른가 | USDC USDT 차이 | USDC란 | 8 | false |
| tether-depegging | 테더 디페깅 사례 정리 — 1달러가 깨질 때 | 테더 디페깅 | USDT 디페깅, 스테이블코인 디페깅 | 9 | false |
| what-is-stablecoin | 스테이블코인이란? 종류·원리 총정리 | 스테이블코인이란 | 스테이블코인 종류 | 10 | true |
| krw-stablecoin | 원화 스테이블코인 총정리 (2026 입법 이슈) | 원화 스테이블코인 | 원화 코인, 한국 스테이블코인 | 11 | true |
| digital-asset-basic-act | 디지털자산기본법 쉽게 정리 | 디지털자산기본법 | 가상자산 규제 | 12 | false |
| kimp-arbitrage-risks | 김프 재정거래 원리와 개인이 함부로 하면 안 되는 이유 | 김프 재정거래 | 재정거래 세금, 재정거래 불법 | 13 | false |
| crypto-tax-2027 | 가상자산 과세 정리 (2027 시행 이슈·테더 포함 여부) | 가상자산 과세 | 코인 세금, 테더 세금 | 14 | false |
| kimp-all-time-records | 역대 김프 기록 TOP — 2017 광풍부터 역프까지 | 역대 김프 | 김프 최고, 2017 김프 | 15 | false |

### 인사이트 (content/insight/)

| slug | 방향(H1 소재) | 주 키워드(선점) | 보조 키워드(현재 트래픽) | order |
|---|---|---|---|---|
| compute-dollar | 컴퓨트달러란? 페트로달러 다음의 달러 패권 | 컴퓨트달러 | 페트로달러, 달러 패권 | 1 |
| energy-compute-dollar-loop | 에너지-컴퓨트-달러 루프: AI가 달러를 강화하는 구조 | 컴퓨트달러 루프 | AI 데이터센터 투자, 달러 전망 | 2 |
| net-dollar | Cloudflare NET Dollar: AI 에이전트를 위한 스테이블코인 | NET Dollar, 넷달러 | 클라우드플레어 스테이블코인 | 3 |
| ai-agent-payments | AI 에이전트 결제 전쟁: x402 vs 구글 AP2 | AI 에이전트 결제 | x402, AP2, 에이전틱 커머스 | 4 |
| genius-act | 미국 GENIUS Act 총정리: 스테이블코인 제도권 진입 | GENIUS Act | 지니어스법, 미국 스테이블코인법 | 5 |
| stablecoin-treasury | 스테이블코인은 왜 미국 국채를 사는가 | 스테이블코인 국채 | 테더 국채 보유, 스테이블코인 준비금 | 6 |
| krw-stablecoin-future | 컴퓨트달러 시대, 원화 스테이블코인의 자리 | 원화 스테이블코인 전망 | 디지털자산기본법 | 7 |

인사이트 전체: `featured` 키 생략(또는 false). **compute-dollar 글에는 "컴퓨트달러(컴퓨터 달러, Compute Dollar)" 병기 1회 포함** — 검색 표기 변형 대응.

### related 배정 (JSON에 그대로 복사)

```
guide/kimchi-premium:        ["/guide/reverse-premium/", "/guide/how-to-check-kimp/", "/calc/kimp/", "/"]
guide/reverse-premium:       ["/guide/kimchi-premium/", "/guide/kimp-all-time-records/", "/price/usdt/", "/"]
guide/how-to-check-kimp:     ["/", "/guide/kimchi-premium/", "/calc/kimp/", "/price/usdt/"]
guide/what-is-usdt:          ["/price/usdt/", "/guide/how-to-buy-usdt/", "/guide/usdc-vs-usdt/", "/insight/compute-dollar/"]
guide/how-to-buy-usdt:       ["/guide/what-is-usdt/", "/guide/trc20-vs-erc20/", "/guide/usdt-withdrawal-fees/", "/price/usdt/"]
guide/trc20-vs-erc20:        ["/guide/usdt-withdrawal-fees/", "/guide/what-is-usdt/", "/guide/how-to-buy-usdt/"]
guide/usdt-withdrawal-fees:  ["/guide/trc20-vs-erc20/", "/guide/how-to-buy-usdt/", "/price/usdt/"]
guide/usdc-vs-usdt:          ["/guide/what-is-usdt/", "/guide/what-is-stablecoin/", "/guide/tether-depegging/"]
guide/tether-depegging:      ["/guide/what-is-usdt/", "/guide/usdc-vs-usdt/", "/guide/what-is-stablecoin/"]
guide/what-is-stablecoin:    ["/guide/what-is-usdt/", "/guide/krw-stablecoin/", "/insight/compute-dollar/"]
guide/krw-stablecoin:        ["/guide/digital-asset-basic-act/", "/guide/what-is-stablecoin/", "/insight/krw-stablecoin-future/"]
guide/digital-asset-basic-act: ["/guide/krw-stablecoin/", "/guide/crypto-tax-2027/", "/insight/genius-act/"]
guide/kimp-arbitrage-risks:  ["/calc/kimp/", "/guide/kimchi-premium/", "/guide/crypto-tax-2027/"]
guide/crypto-tax-2027:       ["/guide/digital-asset-basic-act/", "/guide/kimp-arbitrage-risks/", "/guide/what-is-usdt/"]
guide/kimp-all-time-records: ["/history/", "/guide/kimchi-premium/", "/guide/reverse-premium/"]
insight/compute-dollar:      ["/insight/energy-compute-dollar-loop/", "/insight/stablecoin-treasury/", "/guide/what-is-stablecoin/"]
insight/energy-compute-dollar-loop: ["/insight/compute-dollar/", "/insight/ai-agent-payments/", "/insight/stablecoin-treasury/"]
insight/net-dollar:          ["/insight/ai-agent-payments/", "/insight/compute-dollar/", "/guide/what-is-stablecoin/"]
insight/ai-agent-payments:   ["/insight/net-dollar/", "/insight/compute-dollar/", "/insight/genius-act/"]
insight/genius-act:          ["/insight/stablecoin-treasury/", "/guide/digital-asset-basic-act/", "/insight/compute-dollar/"]
insight/stablecoin-treasury: ["/insight/genius-act/", "/insight/compute-dollar/", "/guide/what-is-usdt/"]
insight/krw-stablecoin-future: ["/guide/krw-stablecoin/", "/insight/compute-dollar/", "/guide/digital-asset-basic-act/"]
```

---

## 6. 내부 링크 승인 URL (이 목록 밖 내부 링크 금지)

도구·시세: `/` `/price/usdt/` `/price/usdt-upbit/` `/price/usdt-bithumb/` `/price/btc/` `/price/compare/` `/chart/` `/history/` `/news/`
계산기: `/calc/` `/calc/kimp/` `/calc/convert/` `/calc/average/` `/calc/profit/` `/calc/compound/`
색인: `/guide/` `/insight/`
가이드: `/guide/<위 배정표의 slug>/` 15개
인사이트: `/insight/<위 배정표의 slug>/` 7개

## 7. 자기 검증 체크리스트 (제출 전 필수)

- [ ] JSON 유효성 (파서로 확인), 필수 키 모두 존재, related/order/featured가 배정표와 일치
- [ ] 본문이 `<p class="lead">`로 시작, h2에 id 존재, 표가 table-wrap으로 감싸짐
- [ ] `{{` 문자열 없음, h1/헤더/푸터 없음, 인라인 스타일 없음
- [ ] 내부 링크가 모두 §6 승인 목록에 있음
- [ ] 컴플라이언스 §3 위반 없음 (투자 권유·따라하기·레퍼럴·실시간 표현)
- [ ] 분량 충족, FAQ 3~5개
- [ ] 시의성 사실은 검색으로 확인했거나 완곡 서술로 낮춤

## 8. 본문 구조 예시 (축약)

```html
<p class="lead">김치프리미엄은 같은 코인이 한국에서 더 비싸게 거래되는 현상입니다. 이 글에서는 김프의 뜻과 발생 원인, 확인 방법을 처음 보는 분 기준으로 정리합니다.</p>

<h2 id="definition">김치프리미엄이란?</h2>
<p>...</p>

<h2 id="why">왜 생기는가 — 3가지 원인</h2>
<p>...</p>
<div class="table-wrap">
  <table>
    <thead><tr><th>원인</th><th>설명</th></tr></thead>
    <tbody><tr><td>...</td><td>...</td></tr></tbody>
  </table>
</div>

<div class="callout"><p><strong>핵심:</strong> ...</p></div>

<h2 id="how-to-check">확인 방법</h2>
<p>지금 김프는 <a href="/">usdt.io.kr 홈</a>에서 10분 단위로 확인할 수 있습니다. ...</p>

<div class="callout warn"><p><strong>주의:</strong> 본 글은 정보 제공 목적이며 투자 권유가 아닙니다. ...</p></div>
```
