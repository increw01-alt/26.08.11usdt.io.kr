# 테더 상세페이지 기준 파일 묶음

이 폴더는 테더 프로젝트에서 현재 상세페이지의 작성 형식과 애니메이션을 재현할 수 있도록 정리한 첨부용 기준 파일이다.

## 새 프로젝트에 전달하는 방법

1. 이 폴더를 압축한 ZIP 파일을 테더 프로젝트의 새 작업에 첨부한다.
2. `USDT_DETAIL_PAGE_AUTHORING_GUIDE.md`를 먼저 읽도록 요청한다.
3. 새 페이지에 사용할 원문 텍스트를 함께 전달한다.
4. 아래 요청 문구를 사용한다.

```text
첨부한 기준 파일 묶음을 확인하고 USDT_DETAIL_PAGE_AUTHORING_GUIDE.md의 규칙을 적용해
테더 장문형 상세페이지를 작성해 주세요.

guide/usdt-buying/index.html은 승인된 구조 참고용이고,
assets/css/tokens.css와 assets/js/site.js의 디자인·애니메이션 규칙을 재사용해 주세요.
기존 페이지의 본문 내용은 복사하지 말고 새로 제공한 원문을 공식 출처 기준으로 정리해 주세요.

데스크톱 1440×1000과 모바일 390px에서 확인하고,
prefers-reduced-motion 대체 동작과 가로 스크롤 여부도 검수해 주세요.
커밋·푸시·배포는 별도 요청 전까지 진행하지 마세요.
```

## 포함 파일

| 경로 | 용도 |
| --- | --- |
| `USDT_DETAIL_PAGE_AUTHORING_GUIDE.md` | 페이지 구성·콘텐츠·애니메이션·검수 기준 |
| `guide/usdt-buying/index.html` | 완성된 장문형 상세페이지 구조 참고본 |
| `assets/css/tokens.css` | 글꼴·레이아웃·카드·반응형·애니메이션 규칙 |
| `assets/js/site.js` | 화면 진입, 목차 강조, 읽기 진행률, 공통 히어로 처리 |
| `assets/js/tailwind.tokens.js` | 프로젝트 Tailwind 색상·간격 토큰 |
| `assets/fonts/paperlogy-*.woff` | 상세페이지 Paperlogy 글꼴 5개 굵기 |
| `assets/img/hero/hero-city-sunrise.png` | 공통 상세페이지 히어로 배경 |
| `assets/img/content/association-trust-banner.png` | 본문 협회 안내 배너 |
| `assets/img/kgca-official-logo-transparent.png` | 공통 협회 로고 |

## 적용 시 주의사항

- 기준 파일의 기존 본문과 정책 문구는 새 페이지의 콘텐츠로 복사하지 않는다.
- 새 페이지의 수치·정책·수수료·지원 조건은 작업 시점의 공식 출처로 다시 확인한다.
- CSS 규칙은 `.article-template-v1`과 `.usdt-guide-page` 범위를 유지한다.
- 직접 지정한 `data-article-reveal` 값을 `site.js`가 덮어쓰지 않아야 한다.
- 이 묶음은 전체 사이트 백업이 아니다. 테더 상세페이지 작성에 필요한 기준 파일만 포함한다.
- Pretendard, Tailwind CDN, Lucide는 참고 HTML에 외부 주소로 연결되어 있으므로 인터넷 연결이 없는 환경에서는 별도 로컬 자산이 필요하다.
- 실제 공개 전까지 테스트 페이지의 `noindex,nofollow`를 유지한다.
