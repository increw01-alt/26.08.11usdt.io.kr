/* ==========================================================================
   소액결제가이드 — Tailwind CDN 토큰 설정
   tokens.css 의 CSS 변수와 동일한 값을 Tailwind 유틸리티로 노출합니다.
   반드시 Tailwind CDN 스크립트 로드 "이후"에 로드하세요.
   ========================================================================== */
tailwind.config = {
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#F2F6FB',
          100: '#E3EBF5',
          200: '#C5D6E8',
          300: '#9FBBD8',
          400: '#6E96C0',
          500: '#47739F',
          600: '#345C86',
          700: '#27496D',
          800: '#1D3A59',
          900: '#142A42'
        },
        accent: {
          50:  '#EDF7F5',
          100: '#D5EEE9',
          500: '#12907E',
          600: '#0E7568',
          700: '#0A5F55'
        },
        ink: {
          50:  '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          900: '#0F172A'
        },
        info: {
          bg:     '#EFF6FF',
          border: '#BFDBFE',
          text:   '#1E40AF'
        },
        warning: {
          bg:     '#FFFBEB',
          border: '#FDE68A',
          text:   '#92400E'
        },
        danger: {
          bg:     '#FEF2F2',
          border: '#FECACA',
          text:   '#1F2937'
        },
        success: {
          bg:     '#F0FDF4',
          border: '#BBF7D0',
          text:   '#166534'
        }
      },
      fontFamily: {
        sans: [
          'Pretendard Variable', 'Pretendard', '-apple-system', 'BlinkMacSystemFont',
          'system-ui', 'Roboto', 'Helvetica Neue', 'Segoe UI', 'Apple SD Gothic Neo',
          'Noto Sans KR', 'Malgun Gothic', 'sans-serif'
        ]
      },
      maxWidth: {
        content: '45rem' /* 본문 최대 폭 720px */
      },
      lineHeight: {
        body: '1.7'
      }
    }
  }
};
