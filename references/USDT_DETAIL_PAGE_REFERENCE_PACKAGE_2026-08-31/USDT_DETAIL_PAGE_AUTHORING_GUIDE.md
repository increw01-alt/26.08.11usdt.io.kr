# 테더(USDT) 상세페이지 작성 가이드

## 1. 문서 목적

이 문서는 테더 프로젝트에서 새로운 장문형 상세페이지를 만들 때 현재 테스트 페이지의 작성 형식과 애니메이션 규칙을 동일하게 재현하기 위한 기준서다.

기준 페이지는 `/guide/usdt-buying/`이며 다음 요소를 공통 규칙으로 사용한다.

- 긴 정보를 읽기 쉽게 나눈 카드형 본문
- 제목·요약·핵심 확인·목차·본문·FAQ·출처·문의 순서
- 섹션 성격에 맞춘 한 번만 실행되는 등장 애니메이션
- 카드·표·체크 항목·FAQ의 순차 등장
- 데스크톱과 모바일의 동일한 정보 구조
- `prefers-reduced-motion` 사용자의 애니메이션 제거
- 공식 출처와 위험 고지를 포함한 정보 제공형 문서

이 가이드는 디자인과 동작을 재사용하기 위한 것이며 기존 페이지의 거래소명, 수치, 정책, 본문 표현을 그대로 복사하기 위한 문서가 아니다.

---

## 2. 기본 기술 구성

새로운 프레임워크나 애니메이션 라이브러리를 추가하지 않는다. 프로젝트에 이미 있는 다음 자산을 재사용한다.

```html
<link rel="stylesheet" href="/assets/css/tokens.css">
<script src="https://cdn.tailwindcss.com"></script>
<script src="/assets/js/tailwind.tokens.js"></script>
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js" defer></script>
<script src="/assets/js/site.js"></script>
```

필수 기준은 다음과 같다.

| 항목 | 기준 |
| --- | --- |
| 문서 형식 | 정적 HTML5 |
| 본문 디자인 범위 | `main.article-template-v1` |
| 테더 전용 범위 | `body.usdt-guide-page` |
| 공통 글꼴 | 프로젝트의 Pretendard 설정 |
| 콘텐츠 최대 폭 | 1,120px |
| 데스크톱 검증 | 1,440 × 1,000px |
| 모바일 최소 검증 | 390px |
| 아이콘 | Lucide |
| 모션 실행 | CSS + `IntersectionObserver` |

`body`, `h1`, `section`, `details` 같은 전역 선택자로 새 스타일을 작성하지 않는다. 테더 페이지 전용 규칙은 반드시 `.usdt-guide-page` 아래로 제한한다.

---

## 3. 페이지 전체 구성 순서

상세페이지는 아래 순서를 유지한다.

1. 공통 사이트 헤더
2. 공통 상세페이지 히어로
3. 현재 위치 표시
4. 제목·도입문·첫 이동 버튼
5. 핵심 확인 박스
6. 목차
7. 채널톡 상담 띠 배너
8. 장문 본문 섹션
9. 세 번째 본문 항목 뒤 협회 안내 배너
10. FAQ
11. 공식 출처
12. 하단 문의 영역과 서비스 범위 고지
13. 공통 푸터와 고정 상담 버튼

기본 골격은 다음과 같다.

```html
<body class="usdt-guide-page font-sans text-ink-900 leading-body bg-white">
  <!-- 공통 헤더 -->
  <!-- 현재 위치 -->

  <main id="main" class="article-template-v1">
    <article class="article-v1-article">
      <header class="article-v1-intro" data-article-reveal="up">...</header>
      <aside class="article-v1-notice" data-article-reveal="scale">...</aside>
      <nav class="article-v1-toc" data-article-reveal="up">...</nav>
      <a class="article-v1-channel-strip" data-article-reveal="left">...</a>

      <section id="section-01" class="article-v1-section" data-article-reveal="up">...</section>
      <section id="section-02" class="article-v1-section" data-article-reveal="left">...</section>
      <section id="section-03" class="article-v1-section" data-article-reveal="right">...</section>

      <figure class="article-v1-proof-banner" data-article-reveal="scale">...</figure>

      <!-- 나머지 본문과 FAQ -->
    </article>

    <section class="article-v1-sources" data-article-reveal="left">...</section>
    <section class="article-v1-consultation" data-article-reveal="scale">...</section>
  </main>

  <!-- 공통 푸터 -->
  <script src="/assets/js/site.js"></script>
</body>
```

---

## 4. 제목과 검색 정보 작성 규칙

### 문서 제목

- H1은 페이지마다 한 개만 사용한다.
- 핵심 검색어를 제목 앞부분에 자연스럽게 배치한다.
- 제목은 사용자가 페이지에서 실제로 해결할 질문을 표현한다.
- 같은 표현을 반복해 검색어를 억지로 늘리지 않는다.

권장 형식:

```text
[핵심 주제] 방법과 [두 번째 핵심 주제] 안전 가이드
```

### 메타 정보

- `<title>`은 H1보다 조금 구체적으로 작성한다.
- `description`은 페이지가 다루는 범위를 1~2문장으로 요약한다.
- 공개 전 테스트 페이지는 `noindex,nofollow`를 유지한다.
- 공개 승인을 받은 뒤에만 robots와 canonical을 실제 공개 주소에 맞춘다.
- Article 및 FAQ 구조화 데이터의 문구는 화면 본문과 일치해야 한다.
- `dateModified`는 실제 최종 검토일에만 갱신한다.

---

## 5. 도입부 작성 규칙

도입부는 다음 네 요소로 구성한다.

```html
<header class="article-v1-intro" data-article-reveal="up">
  <p class="article-v1-eyebrow">USDT INFORMATION GUIDE</p>
  <h1>페이지 핵심 제목</h1>
  <p class="article-v1-lead">다루는 범위, 확인할 조건, 정보 제공 목적을 2~3문장으로 요약합니다.</p>
  <div class="article-v1-top-action">
    <a href="#section-01" class="article-v1-button article-v1-button--primary">
      기본 개념부터 확인
      <i data-lucide="arrow-down" aria-hidden="true"></i>
    </a>
  </div>
</header>
```

도입문에는 다음 내용을 포함한다.

- 페이지가 설명하는 핵심 범위
- 실제 조건은 이용 시점의 공식 화면에서 확인해야 한다는 안내
- 특정 거래소·상품 추천이나 투자 권유가 아니라는 범위 고지

---

## 6. 핵심 확인 박스와 목차

### 핵심 확인 박스

페이지 전체에서 가장 먼저 확인해야 할 3~4개 기준만 넣는다.

```html
<aside class="article-v1-notice" data-article-reveal="scale" aria-labelledby="core-check">
  <p class="article-v1-notice-label">USDT CORE CHECK</p>
  <h2 id="core-check">진행 전에 네 가지 조건을 확인하세요</h2>
  <ul class="article-v1-check-grid">
    <li><span aria-hidden="true">✓</span>첫 번째 확인 조건</li>
    <li><span aria-hidden="true">✓</span>두 번째 확인 조건</li>
    <li><span aria-hidden="true">✓</span>세 번째 확인 조건</li>
    <li><span aria-hidden="true">✓</span>네 번째 확인 조건</li>
  </ul>
</aside>
```

### 목차

- 모든 본문 H2와 같은 순서로 작성한다.
- 링크의 `href`와 본문 섹션 `id`가 정확히 일치해야 한다.
- 짧고 구분되는 목차명을 사용한다.
- 현재 읽는 섹션은 공통 스크립트가 자동 강조한다.

```html
<nav class="article-v1-toc" data-article-reveal="up" aria-label="페이지 목차">
  <h2>목차</h2>
  <ol>
    <li><a href="#section-01">기본 개념</a></li>
    <li><a href="#section-02">이용 순서</a></li>
    <li><a href="#section-03">비용 비교</a></li>
  </ol>
</nav>
```

---

## 7. 본문 카드 작성 규칙

본문은 한 카드에 하나의 질문만 다룬다.

```html
<section id="section-01" class="article-v1-section" data-article-reveal="up">
  <p class="article-v1-kicker">01 · 기본 개념</p>
  <h2>사용자가 이 항목에서 해결할 질문을 제목으로 작성합니다</h2>
  <p>핵심 답변을 먼저 작성합니다.</p>
  <p>조건, 예외, 위험과 확인 경로를 이어서 설명합니다.</p>

  <aside class="article-v1-key-box">
    <strong>핵심 정리</strong>
    <p>사용자가 기억해야 할 결론을 짧게 정리합니다.</p>
  </aside>
</section>
```

### 문단과 제목

- H2 바로 아래 첫 문단에서 결론을 먼저 말한다.
- 한 문단에는 하나의 핵심 내용만 넣는다.
- 숫자, 정책, 수수료와 지원 조건은 공식 출처가 없으면 확정적으로 쓰지 않는다.
- “항상”, “무조건”, “즉시”, “100%” 같은 단정 표현을 피한다.
- 긴 문단이 연속되면 절차 카드, 체크 목록, 비교표 또는 안내 박스로 나눈다.

### 단계형 정보

절차는 `article-v1-step-list`를 사용한다. 각 단계는 순서대로 등장한다.

```html
<ol class="article-v1-step-list">
  <li class="article-v1-step-item">
    <span class="article-v1-step-num" aria-hidden="true">1</span>
    <div><h3>첫 단계 제목</h3><p>확인할 내용</p></div>
  </li>
  <li class="article-v1-step-item">
    <span class="article-v1-step-num" aria-hidden="true">2</span>
    <div><h3>두 번째 단계 제목</h3><p>확인할 내용</p></div>
  </li>
</ol>
```

### 안전 확인 목록

```html
<ul class="article-v1-safety-list">
  <li><span aria-hidden="true">01</span><p><strong>확인 항목</strong><br>설명</p></li>
  <li><span aria-hidden="true">02</span><p><strong>확인 항목</strong><br>설명</p></li>
</ul>
```

### 비교표

- 데스크톱에서는 표로 표시한다.
- 모바일에서는 각 행이 카드로 바뀐다.
- 모든 `td`에 모바일용 `data-label`을 넣는다.

```html
<div class="article-v1-table-wrap">
  <table>
    <thead><tr><th>비교 항목</th><th>방법 A</th><th>방법 B</th></tr></thead>
    <tbody>
      <tr>
        <td data-label="비교 항목">비용</td>
        <td data-label="방법 A">설명</td>
        <td data-label="방법 B">설명</td>
      </tr>
    </tbody>
  </table>
</div>
```

### 안내 박스 구분

| 용도 | 클래스 |
| --- | --- |
| 핵심 결론 | `article-v1-key-box` |
| 보충 안내 | `article-v1-info-box` |
| 착오·손실·정책 주의 | `article-v1-warning` |

주의 박스는 과도하게 반복하지 않는다. 한 섹션에 핵심 박스 한 개를 기본으로 한다.

---

## 8. 섹션별 애니메이션 지정 규칙

외부 애니메이션 의존성을 추가하지 않는다. Animate.css 계열에서 널리 쓰이는 `fadeInUp`, `fadeInLeft`, `fadeInRight`, `zoomIn`의 원리를 현재 CSS 시스템에 맞게 가볍게 재현한다.

### 기본 등장 효과

| 값 | 동작 | 권장 용도 |
| --- | --- | --- |
| `up` | 아래에서 위로 등장 | 소개, 정의, 일반 설명, FAQ |
| `left` | 왼쪽에서 등장 | 단계, 네트워크, 비교·출처 |
| `right` | 오른쪽에서 등장 | 대안, 방식 비교, 예외 설명 |
| `scale` | 0.965배에서 확대 | 핵심 확인, 협회 배너, 최종 정리, 문의 |

각 대상에 `data-article-reveal`을 직접 지정한다.

```html
<section class="article-v1-section" data-article-reveal="left">...</section>
```

공통 스크립트는 직접 지정된 값을 보존해야 한다.

```javascript
targets.forEach(function (item, index) {
  item.classList.add('article-v1-reveal');
  if (!item.hasAttribute('data-article-reveal')) {
    item.setAttribute('data-article-reveal', directions[index % directions.length]);
  }
});
```

### 권장 모션 순서

| 페이지 영역 | 권장 효과 |
| --- | --- |
| 제목·도입 | `up` |
| 핵심 확인 | `scale` |
| 목차 | `up` |
| 채널톡 띠 배너 | `left` |
| 01 기본 개념 | `up` |
| 02 이용 절차 | `left` |
| 03 대안·비교 | `right` |
| 협회 안내 배너 | `scale` |
| 04 외부 이동·후속 절차 | `up` |
| 05 기술·네트워크 | `left` |
| 06 기타 방식 | `right` |
| 07 정책·제한 | `up` |
| 08 비용 비교 | `left` |
| 09 최종 확인 순서 | `scale` |
| FAQ | `up` |
| 공식 출처 | `left` |
| 하단 문의 | `scale` |

좌우 효과를 연속해서 반복하지 않는다. 문서의 의미와 시선 흐름에 따라 배치한다.

---

## 9. 순차 등장 규칙

큰 섹션이 화면에 들어오면 내부 항목은 읽는 순서대로 나타난다.

순차 등장 대상:

- 도입부의 영문 라벨, H1, 요약, 버튼
- 핵심 확인 항목
- 목차 항목
- 단계 카드
- 안전 확인 목록
- 비교표 행
- FAQ 항목
- 핵심·안내·주의 박스
- 출처 목록
- 하단 문의 문구와 버튼

기준 값:

| 항목 | 값 |
| --- | --- |
| 큰 섹션 등장 시간 | 0.72초 |
| 내부 항목 등장 시간 | 0.55초 |
| 모바일 내부 등장 시간 | 0.44초 |
| 큰 섹션 이동 거리 | 38px |
| 모바일 좌우 효과 | 아래에서 위로 30px |
| 내부 항목 이동 거리 | 데스크톱 16px / 모바일 10px |
| 내부 항목 간격 | 약 0.06초 |
| 곡선 | `cubic-bezier(.2,.75,.25,1)` 계열 공통 토큰 |
| 실행 조건 | 화면 약 8% 진입 |
| 반복 여부 | 한 번만 실행 |

모든 문단을 개별 애니메이션으로 만들지 않는다. 지나치게 많은 움직임은 읽는 흐름을 방해하므로 카드, 행, 목록과 강조 박스에만 순차 효과를 적용한다.

섹션 상단의 파랑·빨강 선과 핵심 확인 박스의 왼쪽 선은 섹션 등장 시 한 번만 확장한다. 상담 띠 배너의 쉬머 효과 외에는 계속 반복되는 애니메이션을 추가하지 않는다.

---

## 10. 축소 모션과 접근성

`prefers-reduced-motion: reduce` 환경에서는 다음을 반드시 적용한다.

```css
@media (prefers-reduced-motion: reduce) {
  .usdt-guide-page .article-v1-motion-ready .article-v1-reveal,
  .usdt-guide-page .article-v1-motion-ready .article-v1-intro > *,
  .usdt-guide-page .article-v1-motion-ready .article-v1-notice .article-v1-check-grid li,
  .usdt-guide-page .article-v1-motion-ready .article-v1-toc li,
  .usdt-guide-page .article-v1-motion-ready .article-v1-section .article-v1-step-item,
  .usdt-guide-page .article-v1-motion-ready .article-v1-section .article-v1-safety-list li,
  .usdt-guide-page .article-v1-motion-ready .article-v1-section .article-v1-table-wrap tbody tr,
  .usdt-guide-page .article-v1-motion-ready .article-v1-section .article-v1-faq-list .faq-item {
    opacity: 1;
    filter: none;
    transform: none;
    transition: none;
  }
}
```

추가 접근성 기준:

- JavaScript가 실행되지 않아도 본문이 보여야 한다. 초기 숨김은 `.article-v1-motion-ready`가 생긴 뒤에만 적용한다.
- 아이콘만 있는 버튼에는 `aria-label`을 넣는다.
- 장식용 아이콘은 `aria-hidden="true"`를 사용한다.
- 목차 `aria-label`, 핵심 박스 `aria-labelledby`, 현재 위치 `aria-current`를 유지한다.
- 키보드 포커스 표시를 제거하지 않는다.
- 색상만으로 위험·선택 상태를 전달하지 않는다.

---

## 11. FAQ 작성 규칙

- 실제 본문에서 다룬 핵심 질문만 4~6개 선정한다.
- 답변은 2~4문장 이내로 작성한다.
- 화면의 질문·답변과 FAQ 구조화 데이터가 일치해야 한다.
- 답변에 새로운 수치나 본문에 없는 확정 정책을 추가하지 않는다.

```html
<section id="faq" class="article-v1-section" data-article-reveal="up">
  <p class="article-v1-kicker">10 · 자주 묻는 질문</p>
  <h2>테더 USDT 이용 FAQ</h2>
  <div class="article-v1-faq-list">
    <details class="faq-item">
      <summary>질문을 입력합니다</summary>
      <p>본문과 일치하는 짧은 답변을 입력합니다.</p>
    </details>
  </div>
</section>
```

---

## 12. 출처와 안전 고지

가상자산 관련 내용은 변경 가능성이 높으므로 다음 순서로 확인한다.

1. 정부·금융당국·금융정보분석원 자료
2. 발행사 또는 프로토콜 공식 문서
3. 해당 거래소·지갑의 공식 도움말과 공지

검색 결과 요약, 블로그, 광고성 페이지를 최종 근거로 사용하지 않는다.

출처 영역에는 검토일을 표시한다.

```html
<section class="article-v1-sources" data-article-reveal="left" aria-label="공식 출처">
  <div>
    <h2>공식 출처와 확인 기준</h2>
    <p>조건은 변경될 수 있습니다. 공식 자료에서 최종 확인하세요. (검토일: YYYY-MM-DD)</p>
    <ul>
      <li><a href="공식 주소" rel="noopener">공식 자료명</a></li>
    </ul>
  </div>
</section>
```

하단에는 서비스 범위를 명확히 표시한다.

```text
한국상품권협회는 가상자산 거래·중개·보관·투자자문 서비스를 제공하지 않습니다.
본 페이지는 일반 정보 제공용이며 투자 권유가 아닙니다.
```

수익 보장, 손실 없음, 승인 보장, 우회 거래, 타인 명의 거래, 출처가 불분명한 개인 간 거래를 권하는 문구나 기능을 추가하지 않는다.

---

## 13. 이미지와 배너 규칙

- 이미지는 프로젝트의 `assets/img/` 아래에 저장한다.
- 파일명은 의미 있는 영문 소문자와 하이픈을 사용한다.
- 임시 캡처와 로컬 절대경로를 HTML에 넣지 않는다.
- 이미지에는 내용과 목적을 설명하는 `alt`를 작성한다.
- 본문 세 번째 섹션 뒤의 협회 안내 배너는 `article-v1-proof-banner`를 사용한다.
- 상세페이지에 새로운 광고성 팝업이나 자동 재생 영상을 추가하지 않는다.

```html
<figure class="article-v1-proof-banner" data-article-reveal="scale" aria-label="배너 설명">
  <img src="/assets/img/content/banner-name.png" alt="이미지 내용 설명" width="1912" height="512" loading="lazy">
</figure>
```

---

## 14. 반응형 작성 기준

### 데스크톱

- 본문 최대 폭 1,120px
- H1 약 46px
- 본문 카드 H2 약 30px
- 카드 모서리 22px
- 카드 내부 여백 약 48 × 50px
- 표는 일반 테이블 형태

### 모바일

- 최소 검증 폭 390px
- H1 약 31px
- 본문 카드 H2 약 24px
- 카드 모서리 16px
- 카드 내부 여백 약 30 × 22px
- 표 행은 카드로 전환
- 좌우 등장 모션은 상향 모션으로 통일
- 버튼은 한 줄 전체 폭을 기본으로 한다.

어떤 화면에서도 가로 스크롤, 잘린 제목, 겹친 고정 버튼, 빈 이미지 영역이 없어야 한다.

---

## 15. 완료 전 검수 체크리스트

### 콘텐츠

- [ ] H1이 한 개다.
- [ ] 첫 문단에서 핵심 답변을 제시한다.
- [ ] 목차와 모든 섹션 ID가 일치한다.
- [ ] 수치·정책·수수료·지원 조건에 공식 근거가 있다.
- [ ] 화면 FAQ와 구조화 데이터가 일치한다.
- [ ] 검토일과 출처가 표시되어 있다.
- [ ] 정보 제공 목적과 서비스 범위 고지가 있다.

### 디자인

- [ ] 모든 본문 카드가 `article-v1-section` 규칙을 사용한다.
- [ ] 단계·표·주의 박스의 간격이 기존 페이지와 같다.
- [ ] 1,440 × 1,000px에서 잘림이 없다.
- [ ] 390px에서 가로 스크롤이 없다.
- [ ] 표가 모바일 카드로 정상 변환된다.
- [ ] 이미지가 HTTP 200으로 로드된다.

### 애니메이션

- [ ] 모든 큰 영역에 의미에 맞는 `data-article-reveal`이 있다.
- [ ] 직접 지정한 모션 값을 JavaScript가 덮어쓰지 않는다.
- [ ] 단계 카드·체크 항목·표 행·FAQ가 순차 등장한다.
- [ ] 애니메이션은 화면 진입 시 한 번만 실행된다.
- [ ] 모바일 이동 거리가 축소된다.
- [ ] `prefers-reduced-motion`에서 모든 콘텐츠가 즉시 보인다.
- [ ] 애니메이션 때문에 링크나 버튼 클릭이 막히지 않는다.

### 브라우저와 파일

- [ ] `file://`이 아니라 로컬 HTTP 서버에서 확인했다.
- [ ] HTML, CSS, JavaScript와 이미지가 모두 HTTP 200이다.
- [ ] 브라우저 콘솔에 새 오류가 없다.
- [ ] 내부 링크와 채널톡 링크가 정상 동작한다.
- [ ] 테스트 페이지는 공개 전까지 `noindex,nofollow`다.
- [ ] 승인 전에는 커밋·푸시·배포하지 않았다.

---

## 16. 테더 프로젝트에서 새 페이지를 요청할 때 사용할 작업 지시문

다음 문구를 새 작업의 시작 요청으로 사용할 수 있다.

```text
첨부한 원문을 검토해 테더 장문형 상세페이지로 작성해 주세요.
USDT_DETAIL_PAGE_AUTHORING_GUIDE.md의 구조, 글꼴, 폭, 카드 간격, 표, FAQ,
공식 출처, 안전 고지와 애니메이션 규칙을 그대로 적용해 주세요.

본문은 제목·도입·핵심 확인·목차·채널톡 배너·장문 섹션·FAQ·공식 출처·문의 순서로 구성하고,
각 큰 영역에 의미에 맞는 data-article-reveal 값을 지정해 주세요.
단계 카드, 체크 항목, 표 행과 FAQ는 읽는 순서대로 한 번만 나타나게 해 주세요.
모바일 390px과 데스크톱 1440×1000에서 검수하고 prefers-reduced-motion 대체 동작도 확인해 주세요.

확인되지 않은 수치나 정책은 단정하지 말고 공식 출처 기준으로 보완해 주세요.
테스트 페이지는 noindex,nofollow로 만들고, 커밋이나 배포는 별도 요청 전까지 진행하지 마세요.
작업 완료 후 로컬 HTTP 미리보기를 열어 주세요.
```

---

## 17. 기준 파일

새 페이지를 만들기 전에 아래 기준 파일의 최신 상태를 확인한다.

- 기준 페이지: `guide/usdt-buying/index.html`
- 공통 디자인·애니메이션: `assets/css/tokens.css`
- 화면 진입·목차·읽기 진행 처리: `assets/js/site.js`
- 공통 디자인 토큰: `assets/js/tailwind.tokens.js`

기준 페이지와 이 문서의 규칙이 달라졌다면 실제 승인된 최신 페이지를 우선하고, 변경된 규칙을 이 문서에도 함께 반영한다.
