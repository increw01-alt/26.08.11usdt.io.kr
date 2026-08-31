/* ==========================================================================
   소액결제가이드 — 공통 스크립트
   기능: 모바일 메뉴 / 모바일 하단 고정 CTA(기획안 7장 규칙) /
         dataLayer 이벤트(cta_click, channeltalk_open, phone_click, faq_open) /
         Lucide 아이콘 렌더링 / 현재 메뉴 표시
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- dataLayer 헬퍼 (GTM 미설치 시에도 오류 없이 동작) ---------- */
  function pushEvent(name, params) {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push(Object.assign({ event: name }, params || {}));
  }

  /* ---------- 대표 상세페이지 공통 메인 히어로 ---------- */
  function insertSharedHomeHero() {
    var targetPaths = [
      '/guide/basics/',
      '/guide/vs-content-fee/',
      '/guide/vs-content-fee/google-play/',
      '/guide/vs-content-fee/apple-app-store/',
      '/guide/usdt-buying/',
      '/guide/limit/',
      '/carrier/',
      '/carrier/skt/',
      '/carrier/skt/compare-full/',
      '/carrier/kt/',
      '/carrier/kt/compare-full/',
      '/carrier/lguplus/',
      '/carrier/lguplus/compare-full/',
      '/carrier/mvno/',
      '/carrier/mvno/compare-full/',
      '/help/',
      '/giftcard/charge/',
      '/news/',
      '/faq/'
    ];
    var path = window.location.pathname;
    if (targetPaths.indexOf(path) === -1) return;

    var header = document.querySelector('body > header');
    if (!header || document.querySelector('.detail-home-hero')) return;

    document.body.classList.add('has-detail-home-hero');
    header.classList.add('detail-home-header');

    var brand = header.querySelector('div > a[href="/"]');
    if (brand) {
      brand.className = 'detail-home-brand-logo';
      brand.setAttribute('aria-label', '한국상품권협회 홈');
      brand.innerHTML = '<img src="/assets/img/kgca-official-logo-transparent.png" width="224" height="66" alt="한국상품권협회">';
    }

    var headerConsult = header.querySelector('[data-evt-position="header"]');
    if (headerConsult) {
      headerConsult.href = 'https://koreagiftcard.channel.io/home?page=소액결제.한국';
      headerConsult.setAttribute('data-evt', 'channeltalk_open');
      headerConsult.setAttribute('rel', 'noopener');
      headerConsult.className = 'detail-header-channel-btn hidden md:inline-flex items-center gap-1.5 px-4 py-2 text-white text-sm font-medium';
      headerConsult.innerHTML = '<i data-lucide="message-circle" class="w-4 h-4" aria-hidden="true"></i>채널톡 상담';
    }

    var hero = document.createElement('section');
    hero.className = 'detail-home-hero';
    hero.setAttribute('aria-labelledby', 'detail-home-hero-heading');
    hero.innerHTML =
      '<div class="detail-home-hero__inner max-w-6xl mx-auto px-4 w-full">' +
        '<div class="detail-home-hero__copy">' +
          '<p class="detail-home-hero__eyebrow">한국상품권협회가 제안하는 휴대폰 소액결제</p>' +
          '<p id="detail-home-hero-heading" class="detail-home-hero__title">이제 소액결제도<br>한국상품권협회가<br class="md:hidden"> 공식 절차로<br>안전하게 진행합니다.</p>' +
          '<p class="detail-home-hero__lead">한국상품권협회가 통신사·발행사·공공기관 공식 절차를 기준으로 정리한 정보 사이트입니다.<br class="hidden md:block"> 협회는 소액결제 서비스를 제공·대행하지 않으며, 상품권 관련 문의는 1:1 상담으로 도와드립니다.</p>' +
          '<div class="detail-home-hero__actions" aria-label="메인 바로가기">' +
            '<a href="/carrier/" data-evt="cta_click" data-evt-position="detail-hero" class="detail-home-action detail-home-action--carrier">통신사별 이용 방법 확인</a>' +
            '<a href="/help/" data-evt="cta_click" data-evt-position="detail-hero" class="detail-home-action detail-home-action--help">상황별 대처 방법 확인</a>' +
            '<a href="https://koreagiftcard.channel.io/home?page=소액결제.한국" data-evt="channeltalk_open" data-evt-position="detail-hero" rel="noopener" class="detail-home-action detail-home-action--consult"><i data-lucide="message-circle" aria-hidden="true"></i><span>상담 바로가기</span></a>' +
          '</div>' +
        '</div>' +
      '</div>';

    header.insertAdjacentElement('afterend', hero);
  }

  /* ---------- 내부 페이지 문맥형 아이콘·스크롤 모션 ---------- */
  function includesAny(text, words) {
    return words.some(function (word) { return text.indexOf(word) !== -1; });
  }

  function iconForText(text, fallback) {
    var value = (text || '').replace(/\s+/g, ' ').trim();

    if (includesAny(value, ['피해', '명의도용', '스미싱', '사기', '신고', '의심'])) return 'shield-alert';
    if (includesAny(value, ['차단', '보호', '예방', '개인정보'])) return 'shield-check';
    if (includesAny(value, ['환불', '취소', '해제'])) return 'rotate-ccw';
    if (includesAny(value, ['한도', '상향', '하향'])) return 'gauge';
    if (includesAny(value, ['미납', '납부', '청구', '요금', '결제', '이용내역'])) return 'receipt';
    if (includesAny(value, ['인증', '본인', '승인번호'])) return 'badge-check';
    if (includesAny(value, ['상품권', '충전', '발행사'])) return 'gift';
    if (includesAny(value, ['통신사', '회선', '휴대폰', '알뜰폰'])) return 'smartphone';
    if (includesAny(value, ['법령', '정책', '출처', '기관', '법적'])) return 'landmark';
    if (includesAny(value, ['시간', '시점', '운영'])) return 'clock';
    if (includesAny(value, ['상담', '문의', '채널톡'])) return 'message-square';
    if (includesAny(value, ['준비', '증빙', '캡처', '자료'])) return 'camera';
    if (includesAny(value, ['FAQ', '자주 묻는', '질문'])) return 'help-circle';
    if (includesAny(value, ['차이', '비교', '구분'])) return 'sliders-horizontal';
    if (includesAny(value, ['절차', '방법', '순서', '흐름', '확인할 점'])) return 'check-circle';
    if (includesAny(value, ['뉴스', '소식', '발표'])) return 'calendar-days';
    return fallback || 'book-open-check';
  }

  function iconForPage(path, title) {
    if (path.indexOf('/guide/limit/') === 0) return 'gauge';
    if (path.indexOf('/guide/block/') === 0) return 'shield-check';
    if (path.indexOf('/guide/vs-content-fee/') === 0) return 'sliders-horizontal';
    if (path.indexOf('/guide/') === 0) return 'smartphone';
    if (path.indexOf('/carrier/') === 0) return 'smartphone';
    if (path.indexOf('/help/refund/') === 0) return 'rotate-ccw';
    if (path.indexOf('/help/fraud/') === 0) return 'shield-alert';
    if (path.indexOf('/help/unpaid/') === 0) return 'receipt';
    if (path.indexOf('/help/') === 0) return 'life-buoy';
    if (path.indexOf('/giftcard/') === 0) return 'gift';
    if (path.indexOf('/safety/') === 0) return 'shield-check';
    if (path.indexOf('/news/') === 0) return 'landmark';
    if (path.indexOf('/blog/') === 0) return 'file-text';
    if (path.indexOf('/faq/') === 0) return 'help-circle';
    if (path.indexOf('/contact/') === 0) return 'message-square';
    if (path.indexOf('/about/') === 0) return 'building-2';
    if (path.indexOf('/legal/privacy/') === 0) return 'shield-check';
    if (path.indexOf('/legal/') === 0) return 'scale';
    if (path.indexOf('/404') !== -1) return 'search';
    return iconForText(title, 'book-open-check');
  }

  function contextualizeExistingIcons() {
    var protectedIcons = ['menu', 'x', 'chevron-down', 'arrow-right', 'phone', 'message-circle'];

    document.querySelectorAll('#main [data-lucide]').forEach(function (icon) {
      var current = icon.getAttribute('data-lucide') || '';
      if (protectedIcons.indexOf(current) !== -1) return;

      var context = icon.closest('li, h2, h3, p, summary, a, div');
      var text = context ? (context.textContent || '') : '';
      var next = current;

      if (current === 'info') next = iconForText(text, 'info');
      if (current === 'alert-triangle') next = iconForText(text, 'alert-triangle');
      if (current === 'check' || current === 'check-circle') next = iconForText(text, 'check-circle');
      if (current === 'book-open') next = iconForText(text, 'book-open-check');

      if (next !== current) icon.setAttribute('data-lucide', next);
    });
  }

  function createIconBadge(iconName, className) {
    var badge = document.createElement('span');
    var icon = document.createElement('i');
    badge.className = className;
    badge.setAttribute('aria-hidden', 'true');
    icon.setAttribute('data-lucide', iconName);
    badge.appendChild(icon);
    return badge;
  }

  function decorateInternalHeadings() {
    var main = document.getElementById('main');
    if (!main) return;
    if (main.classList.contains('article-template-v1')) return;

    var title = main.querySelector('h1');
    var previous = title ? title.previousElementSibling : null;
    if (title && (!previous || !previous.classList.contains('page-hero-icon'))) {
      title.parentNode.insertBefore(
        createIconBadge(iconForPage(window.location.pathname, title.textContent || ''), 'page-hero-icon'),
        title
      );
    }

    main.querySelectorAll('h2').forEach(function (heading) {
      var consultSection = heading.closest('section.bg-accent-50.mt-16');
      if (consultSection || heading.querySelector('[data-lucide]')) return;

      heading.classList.add('content-heading');
      heading.insertBefore(
        createIconBadge(iconForText(heading.textContent || '', 'book-open-check'), 'content-heading-icon'),
        heading.firstChild
      );
    });
  }

  function setupInternalMotion() {
    var main = document.getElementById('main');
    if (main && main.classList.contains('article-template-v1')) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    function prepare(selector, motion, step) {
      document.querySelectorAll(selector).forEach(function (item, index) {
        if (item.classList.contains('inner-motion')) return;
        item.classList.add('inner-motion');
        item.setAttribute('data-inner-motion', motion);
        item.style.setProperty('--inner-motion-delay', ((index % 4) * step) + 'ms');
      });
    }

    prepare('.page-hero-icon, #main h1, #main h1 + p', 'fade-up', 90);
    prepare('#main .content-heading', 'slide-left', 45);
    prepare('#main a.rounded-xl.border, #main li.rounded-xl.border, #main .blog-card', 'fade-up', 80);
    prepare('#main details.faq-item', 'fade-up', 70);
    prepare('#main .bg-info-bg, #main .bg-warning-bg, #main .bg-danger-bg, #main .bg-success-bg', 'zoom-in', 55);
    prepare('#main > section.bg-accent-50.mt-16 > div > *', 'zoom-in', 70);

    var items = document.querySelectorAll('.inner-motion');
    document.documentElement.classList.add('inner-motion-ready');

    if (!('IntersectionObserver' in window)) {
      items.forEach(function (item) { item.classList.add('is-inner-visible'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-inner-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -7% 0px' });

    items.forEach(function (item) { observer.observe(item); });
  }

  function articlePathConfig(pathname) {
    var configs = {
      '/guide/limit/': { mode: 'group', root: 'article', eyebrow: 'LIMIT & CONTROL GUIDE' },
      '/carrier/': { mode: 'group', root: 'section:first-of-type', eyebrow: 'CARRIER GUIDE' },
      '/help/': { mode: 'top-sections', eyebrow: 'TROUBLESHOOTING GUIDE' },
      '/giftcard/charge/': { mode: 'group', root: 'div:first-of-type', eyebrow: 'GIFT CARD CHARGE GUIDE' },
      '/news/': { mode: 'top-sections', eyebrow: 'POLICY & NEWS' },
      '/faq/': { mode: 'existing-sections', root: 'div:first-of-type', eyebrow: 'FREQUENTLY ASKED QUESTIONS' }
    };
    return configs[pathname] || null;
  }

  function articleSectionTitle(section) {
    var heading = section.querySelector('h2');
    return heading ? heading.textContent.trim() : '';
  }

  function isArticleSourceSection(section) {
    if (!section || section.tagName !== 'SECTION') return false;
    if (section.getAttribute('aria-label') === '공식 출처') return true;
    var heading = section.querySelector('h2');
    return !!heading && heading.textContent.trim() === '공식 출처';
  }

  function isArticleConsultSection(section) {
    return !!section && section.tagName === 'SECTION' && section.getAttribute('aria-labelledby') === 'consult-heading';
  }

  function articleContentNode(section, headingSelector) {
    var directHeading = Array.prototype.some.call(section.children, function (child) {
      return child.matches && child.matches(headingSelector);
    });
    if (directHeading) return section;
    if (section.children.length === 1 && section.firstElementChild && section.firstElementChild.querySelector(headingSelector)) {
      return section.firstElementChild;
    }
    return section;
  }

  function wrapArticleHeadingGroups(container) {
    var headings = Array.prototype.filter.call(container.children, function (child) {
      return child.tagName === 'H2';
    });
    var sections = [];

    headings.forEach(function (heading, index) {
      var nextHeading = headings[index + 1] || null;
      var section = document.createElement('section');
      section.className = 'article-v1-section';
      container.insertBefore(section, heading);
      while (section.nextSibling && section.nextSibling !== nextHeading) {
        section.appendChild(section.nextSibling);
      }
      sections.push(section);
    });
    return sections;
  }

  function moveArticleIntro(container, firstSection, eyebrowText) {
    var header = document.createElement('header');
    header.className = 'article-v1-intro';
    container.insertBefore(header, firstSection || container.firstChild);

    while (container.firstChild && container.firstChild !== header) {
      header.appendChild(container.firstChild);
    }

    var legacyNav = header.querySelector('nav[aria-label="FAQ 카테고리"]');
    if (legacyNav) legacyNav.remove();

    var h1 = header.querySelector('h1');
    if (h1 && !header.querySelector('.article-v1-eyebrow')) {
      var eyebrow = document.createElement('p');
      eyebrow.className = 'article-v1-eyebrow';
      eyebrow.textContent = eyebrowText;
      header.insertBefore(eyebrow, h1);
    }

    var lead = h1 ? h1.nextElementSibling : null;
    if (lead && lead.tagName === 'P') lead.classList.add('article-v1-lead');

    var topButton = header.querySelector('[data-evt-position="top"]');
    if (topButton) topButton.classList.add('article-v1-button', 'article-v1-button--primary');
    return header;
  }

  function prepareGroupedArticle(main, config) {
    var container = main.querySelector(':scope > ' + config.root);
    if (!container) return null;
    container.classList.add('article-v1-article', 'article-v1-auto-article');
    var sections = wrapArticleHeadingGroups(container);
    if (!sections.length) return null;
    var header = moveArticleIntro(container, sections[0], config.eyebrow);
    return { article: container, header: header, sections: sections };
  }

  function prepareExistingSectionArticle(main, config) {
    var container = main.querySelector(':scope > ' + config.root);
    if (!container) return null;
    container.classList.add('article-v1-article', 'article-v1-auto-article');
    var sections = Array.prototype.filter.call(container.children, function (child) {
      return child.tagName === 'SECTION' && child.querySelector('h2');
    });
    sections.forEach(function (section) { section.classList.add('article-v1-section'); });
    if (!sections.length) return null;
    var header = moveArticleIntro(container, sections[0], config.eyebrow);
    return { article: container, header: header, sections: sections };
  }

  function prepareTopSectionArticle(main, config) {
    var pageSections = Array.prototype.filter.call(main.children, function (child) {
      return child.tagName === 'SECTION' && !isArticleSourceSection(child) && !isArticleConsultSection(child);
    });
    if (!pageSections.length) return null;

    var introSource = pageSections.shift();
    var article = document.createElement('article');
    article.className = 'article-v1-article article-v1-auto-article';
    main.insertBefore(article, introSource);

    var header = document.createElement('header');
    header.className = 'article-v1-intro';
    article.appendChild(header);
    var introContent = articleContentNode(introSource, 'h1');
    while (introContent.firstChild) header.appendChild(introContent.firstChild);
    introSource.remove();

    var h1 = header.querySelector('h1');
    if (h1) {
      var eyebrow = document.createElement('p');
      eyebrow.className = 'article-v1-eyebrow';
      eyebrow.textContent = config.eyebrow;
      header.insertBefore(eyebrow, h1);
      var lead = h1.nextElementSibling;
      if (lead && lead.tagName === 'P') lead.classList.add('article-v1-lead');
    }

    var sections = [];
    pageSections.forEach(function (source) {
      var content = articleContentNode(source, 'h2');
      var heading = content.querySelector('h2');
      if (!heading) {
        var previous = sections[sections.length - 1];
        if (previous) {
          var note = document.createElement('div');
          note.className = 'article-v1-inline-note';
          while (content.firstChild) note.appendChild(content.firstChild);
          previous.appendChild(note);
        }
        source.remove();
        return;
      }

      var section = document.createElement('section');
      section.className = 'article-v1-section';
      if (source.id) section.id = source.id;
      if (source.getAttribute('aria-labelledby')) section.setAttribute('aria-labelledby', source.getAttribute('aria-labelledby'));
      while (content.firstChild) section.appendChild(content.firstChild);
      article.appendChild(section);
      source.remove();
      sections.push(section);
    });
    return { article: article, header: header, sections: sections };
  }

  function createArticleNotice(sections) {
    var notice = document.createElement('aside');
    notice.className = 'article-v1-notice article-v1-auto-notice';
    notice.setAttribute('aria-label', '페이지 핵심 안내');
    var items = sections.slice(0, 4).map(function (section) {
      return '<li><span aria-hidden="true">✓</span>' + articleSectionTitle(section) + '</li>';
    }).join('');
    notice.innerHTML = '<p class="article-v1-notice-label">GUIDE CHECK</p>' +
      '<h2>이 페이지에서 확인할 핵심 내용을 먼저 살펴보세요</h2>' +
      '<ul class="article-v1-check-grid">' + items + '</ul>';
    return notice;
  }

  function createArticleToc(sections) {
    var toc = document.createElement('nav');
    toc.className = 'article-v1-toc';
    toc.setAttribute('aria-label', '페이지 목차');
    var items = sections.map(function (section) {
      return '<li><a href="#' + section.id + '">' + articleSectionTitle(section) + '</a></li>';
    }).join('');
    toc.innerHTML = '<h2>목차</h2><ol>' + items + '</ol>';
    return toc;
  }

  function createArticleChannelStrip() {
    var channel = document.createElement('a');
    channel.className = 'article-v1-channel-strip';
    channel.href = 'https://koreagiftcard.channel.io/home?page=소액결제.한국';
    channel.rel = 'noopener';
    channel.setAttribute('aria-label', '채널톡 상담 바로가기');
    channel.setAttribute('data-evt', 'channeltalk_open');
    channel.setAttribute('data-evt-position', 'toc');
    channel.innerHTML = '<div class="article-v1-channel-strip__message">' +
      '<span class="article-v1-channel-strip__icon" aria-hidden="true"><i data-lucide="message-circle"></i></span>' +
      '<p><span>문의사항은</span><strong>채널톡으로 바로 문의!</strong></p></div>' +
      '<span class="article-v1-channel-strip__link">채널톡 상담 바로가기<i data-lucide="arrow-up-right" aria-hidden="true"></i></span>';
    return channel;
  }

  function createArticleProofBanner() {
    var figure = document.createElement('figure');
    figure.className = 'article-v1-proof-banner';
    figure.setAttribute('aria-label', '소액결제 상품권 구매 안내');
    figure.innerHTML = '<img src="/assets/img/content/association-trust-banner.png" ' +
      'alt="한국상품권협회 소액결제 상품권 구매 안내: 안전·명확, 신속한 진행, 협회 운영" ' +
      'width="1912" height="512" loading="lazy">';
    return figure;
  }

  function decorateAutoArticleSections(result, pathname) {
    result.sections.forEach(function (section, index) {
      var heading = section.querySelector('h2');
      if (!heading) return;
      heading.classList.add('article-v1-section-title');
      if (!section.id) section.id = 'article-' + pathname.replace(/[^a-z0-9]+/gi, '-') + '-' + (index + 1);
      if (!section.querySelector(':scope > .article-v1-kicker')) {
        var kicker = document.createElement('p');
        kicker.className = 'article-v1-kicker';
        kicker.textContent = String(index + 1).padStart(2, '0') + ' · ' + heading.textContent.trim();
        section.insertBefore(kicker, heading);
      }
    });
  }

  function decorateAutoArticleTables(article) {
    article.querySelectorAll('table').forEach(function (table) {
      table.classList.add('article-v1-table');
      var labels = Array.prototype.map.call(table.querySelectorAll('thead th'), function (cell) {
        return cell.textContent.trim();
      });
      table.querySelectorAll('tbody tr').forEach(function (row) {
        Array.prototype.forEach.call(row.children, function (cell, index) {
          cell.setAttribute('data-label', labels[index] || '항목');
        });
      });
    });
  }

  function decorateAutoBottomSections(main) {
    Array.prototype.forEach.call(main.children, function (child) {
      if (isArticleSourceSection(child)) {
        child.classList.add('article-v1-sources', 'article-v1-auto-sources');
      }
      if (isArticleConsultSection(child)) {
        child.classList.add('article-v1-consultation', 'article-v1-auto-consultation');
        var inner = child.firstElementChild || child;
        var heading = child.querySelector('#consult-heading');
        if (heading) {
          heading.textContent = '상품권 소액결제 관련 문의가 있으신가요?';
          if (!inner.querySelector('.article-v1-consultation-label')) {
            var label = document.createElement('p');
            label.className = 'article-v1-consultation-label';
            label.textContent = 'KOREA GIFT CARD ASSOCIATION';
            inner.insertBefore(label, heading);
          }
        }
        var actions = child.querySelectorAll('a');
        if (actions[0]) {
          actions[0].classList.add('article-v1-button', 'article-v1-button--light');
          if (actions[0].parentElement) actions[0].parentElement.classList.add('article-v1-consultation-actions');
        }
        if (actions[1]) actions[1].classList.add('article-v1-button', 'article-v1-button--outline-light');
      }
    });
  }

  function applyAutoArticleTemplate() {
    var pathname = window.location.pathname;
    var config = articlePathConfig(pathname);
    var main = document.getElementById('main');
    if (!config || !main || main.classList.contains('article-template-v1')) return;

    main.classList.add('article-template-v1', 'article-template-auto');
    var result = null;
    if (config.mode === 'group') result = prepareGroupedArticle(main, config);
    if (config.mode === 'existing-sections') result = prepareExistingSectionArticle(main, config);
    if (config.mode === 'top-sections') result = prepareTopSectionArticle(main, config);
    if (!result || !result.sections.length) return;

    decorateAutoArticleSections(result, pathname);
    decorateAutoArticleTables(result.article);

    var notice = createArticleNotice(result.sections);
    var toc = createArticleToc(result.sections);
    var channel = createArticleChannelStrip();
    result.header.insertAdjacentElement('afterend', channel);
    result.header.insertAdjacentElement('afterend', toc);
    result.header.insertAdjacentElement('afterend', notice);

    var thirdSection = result.sections[2];
    if (thirdSection) thirdSection.insertAdjacentElement('afterend', createArticleProofBanner());
    decorateAutoBottomSections(main);
  }

  function setupArticleTemplateMotion() {
    var root = document.querySelector('main.article-template-v1');
    if (!root) return;

    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var targets = root.querySelectorAll(
      '.article-v1-intro, .article-v1-notice, .article-v1-toc, .article-v1-channel-strip, .article-v1-section, .article-v1-proof-banner, .article-v1-sources, .article-v1-consultation'
    );
    var directions = ['up', 'left', 'right', 'scale'];

    root.classList.add('article-v1-motion-ready');
    targets.forEach(function (item, index) {
      item.classList.add('article-v1-reveal');
      if (!item.hasAttribute('data-article-reveal')) {
        item.setAttribute('data-article-reveal', directions[index % directions.length]);
      }
    });

    if (reducedMotion || !('IntersectionObserver' in window)) {
      targets.forEach(function (item) { item.classList.add('is-article-visible'); });
    } else {
      var revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-article-visible');
          revealObserver.unobserve(entry.target);
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -7% 0px' });

      targets.forEach(function (item) { revealObserver.observe(item); });
    }

    var tocLinks = Array.prototype.slice.call(root.querySelectorAll('.article-v1-toc a[href^="#"]'));
    var tocSections = tocLinks.map(function (link) {
      return document.getElementById(link.getAttribute('href').slice(1));
    }).filter(Boolean);

    function setActiveToc(id) {
      tocLinks.forEach(function (link) {
        var active = link.getAttribute('href') === '#' + id;
        link.classList.toggle('is-active', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }

    if (tocSections.length && 'IntersectionObserver' in window) {
      var sectionObserver = new IntersectionObserver(function (entries) {
        var visible = entries.filter(function (entry) { return entry.isIntersecting; });
        if (!visible.length) return;
        visible.sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top; });
        setActiveToc(visible[0].target.id);
      }, { rootMargin: '-20% 0px -64% 0px', threshold: 0 });
      tocSections.forEach(function (section) { sectionObserver.observe(section); });
    }

    if (!reducedMotion && !document.querySelector('.article-v1-reading-progress')) {
      var progress = document.createElement('div');
      progress.className = 'article-v1-reading-progress';
      progress.setAttribute('aria-hidden', 'true');
      document.body.appendChild(progress);

      var ticking = false;
      function updateProgress() {
        var scrollTop = window.scrollY || document.documentElement.scrollTop;
        var available = document.documentElement.scrollHeight - window.innerHeight;
        var ratio = available > 0 ? Math.min(1, Math.max(0, scrollTop / available)) : 0;
        progress.style.transform = 'scaleX(' + ratio + ')';
        ticking = false;
      }
      function requestProgressUpdate() {
        if (ticking) return;
        ticking = true;
        window.requestAnimationFrame(updateProgress);
      }
      window.addEventListener('scroll', requestProgressUpdate, { passive: true });
      window.addEventListener('resize', requestProgressUpdate);
      updateProgress();
    }
  }

  function enhanceInternalPage() {
    if (document.body.classList.contains('home-page')) return;
    document.body.classList.add('inner-page');
    contextualizeExistingIcons();
    decorateInternalHeadings();
    setupInternalMotion();
    setupArticleTemplateMotion();
  }

  function ensureContentFeeNavigation() {
    var contentFeePath = '/guide/vs-content-fee/';

    document.querySelectorAll('nav[aria-label="주요 메뉴"]').forEach(function (nav) {
      if (nav.querySelector('a[data-nav="' + contentFeePath + '"]')) return;

      var helpLink = nav.querySelector('a[data-nav="/help/"]');
      if (!helpLink) return;

      var link = helpLink.cloneNode(true);
      link.href = contentFeePath;
      link.setAttribute('data-nav', contentFeePath);
      link.removeAttribute('aria-current');
      link.classList.remove('font-semibold');
      link.textContent = '콘텐츠 이용료';
      nav.insertBefore(link, helpLink);
    });

    var mobileMenu = document.getElementById('mobile-menu');
    if (!mobileMenu || mobileMenu.querySelector('a[href="' + contentFeePath + '"]')) return;

    var mobileHelpLink = mobileMenu.querySelector('a[href="/help/"]');
    if (!mobileHelpLink || !mobileHelpLink.parentElement) return;

    var mobileItem = mobileHelpLink.parentElement.cloneNode(true);
    var mobileLink = mobileItem.querySelector('a');
    mobileLink.href = contentFeePath;
    mobileLink.textContent = '콘텐츠 이용료';
    mobileHelpLink.parentElement.parentElement.insertBefore(mobileItem, mobileHelpLink.parentElement);
  }

  function enhanceCarrierDropdown() {
    var carrierLinks = document.querySelectorAll('nav[aria-label="주요 메뉴"] > a[data-nav="/carrier/"]');
    var items = [
      { label: 'SKT 소액결제', href: '/carrier/skt/' },
      { label: 'KT 소액결제', href: '/carrier/kt/' },
      { label: 'LG U+ 소액결제', href: '/carrier/lguplus/' },
      { label: '알뜰폰 소액결제', href: '/carrier/mvno/' }
    ];

    carrierLinks.forEach(function (trigger, index) {
      if (trigger.closest('.carrier-dropdown')) return;

      var wrapper = document.createElement('div');
      var panel = document.createElement('div');
      var panelId = 'carrier-dropdown-panel-' + (index + 1);
      var parent = trigger.parentNode;

      wrapper.className = 'carrier-dropdown';
      panel.className = 'carrier-dropdown__panel';
      panel.id = panelId;
      panel.setAttribute('aria-label', '통신사별 소액결제 페이지');

      parent.insertBefore(wrapper, trigger);
      wrapper.appendChild(trigger);

      trigger.classList.add('carrier-dropdown__trigger');
      trigger.setAttribute('aria-haspopup', 'true');
      trigger.setAttribute('aria-expanded', 'false');
      trigger.setAttribute('aria-controls', panelId);
      trigger.innerHTML = '<span>통신사별</span><i data-lucide="chevron-down" class="carrier-dropdown__chevron" aria-hidden="true"></i>';

      items.forEach(function (item) {
        var link = document.createElement('a');
        link.className = 'carrier-dropdown__item';
        link.href = item.href;
        link.textContent = item.label;
        panel.appendChild(link);
      });
      wrapper.appendChild(panel);

      function setOpen(open) {
        wrapper.classList.toggle('is-open', open);
        trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
      }

      wrapper.addEventListener('mouseenter', function () {
        wrapper.classList.remove('is-escape-closed');
        setOpen(true);
      });
      wrapper.addEventListener('mouseleave', function () {
        if (!wrapper.contains(document.activeElement)) setOpen(false);
      });
      wrapper.addEventListener('focusin', function () {
        if (!wrapper.classList.contains('is-escape-closed')) setOpen(true);
      });
      wrapper.addEventListener('focusout', function () {
        window.setTimeout(function () {
          if (!wrapper.contains(document.activeElement)) {
            wrapper.classList.remove('is-escape-closed');
            setOpen(false);
          }
        }, 0);
      });
      wrapper.addEventListener('keydown', function (event) {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        event.stopPropagation();
        wrapper.classList.add('is-escape-closed');
        setOpen(false);
        trigger.focus();
      });
    });
  }

  function enhanceContentFeeDropdown() {
    var contentFeeLinks = document.querySelectorAll('nav[aria-label="주요 메뉴"] > a[data-nav="/guide/vs-content-fee/"]');
    var items = [
      { label: '구글 플레이스토어', href: '/guide/vs-content-fee/google-play/' },
      { label: '애플 앱스토어', href: '/guide/vs-content-fee/apple-app-store/' }
    ];

    contentFeeLinks.forEach(function (trigger, index) {
      if (trigger.closest('.content-fee-dropdown')) return;

      var wrapper = document.createElement('div');
      var panel = document.createElement('div');
      var panelId = 'content-fee-dropdown-panel-' + (index + 1);
      var parent = trigger.parentNode;

      wrapper.className = 'carrier-dropdown content-fee-dropdown';
      panel.className = 'carrier-dropdown__panel';
      panel.id = panelId;
      panel.setAttribute('aria-label', '콘텐츠 이용료 하위페이지');

      parent.insertBefore(wrapper, trigger);
      wrapper.appendChild(trigger);

      trigger.classList.add('carrier-dropdown__trigger');
      trigger.setAttribute('aria-haspopup', 'true');
      trigger.setAttribute('aria-expanded', 'false');
      trigger.setAttribute('aria-controls', panelId);
      trigger.innerHTML = '<span>콘텐츠 이용료</span><i data-lucide="chevron-down" class="carrier-dropdown__chevron" aria-hidden="true"></i>';

      items.forEach(function (item) {
        var link = document.createElement('a');
        link.className = 'carrier-dropdown__item';
        link.href = item.href;
        link.textContent = item.label;
        if (window.location.pathname === item.href) link.setAttribute('aria-current', 'page');
        panel.appendChild(link);
      });
      wrapper.appendChild(panel);

      function setOpen(open) {
        wrapper.classList.toggle('is-open', open);
        trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
      }

      wrapper.addEventListener('mouseenter', function () {
        wrapper.classList.remove('is-escape-closed');
        setOpen(true);
      });
      wrapper.addEventListener('mouseleave', function () {
        if (!wrapper.contains(document.activeElement)) setOpen(false);
      });
      wrapper.addEventListener('focusin', function () {
        if (!wrapper.classList.contains('is-escape-closed')) setOpen(true);
      });
      wrapper.addEventListener('focusout', function () {
        window.setTimeout(function () {
          if (!wrapper.contains(document.activeElement)) {
            wrapper.classList.remove('is-escape-closed');
            setOpen(false);
          }
        }, 0);
      });
      wrapper.addEventListener('keydown', function (event) {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        event.stopPropagation();
        wrapper.classList.add('is-escape-closed');
        setOpen(false);
        trigger.focus();
      });
    });

    var mobileMenu = document.getElementById('mobile-menu');
    if (!mobileMenu || mobileMenu.querySelector('.content-fee-mobile-submenu')) return;

    var mobileParentLink = mobileMenu.querySelector('a[href="/guide/vs-content-fee/"]');
    if (!mobileParentLink || !mobileParentLink.parentElement) return;

    var submenu = document.createElement('ul');
    submenu.className = 'content-fee-mobile-submenu';
    submenu.setAttribute('aria-label', '콘텐츠 이용료 하위메뉴');
    items.forEach(function (item) {
      var listItem = document.createElement('li');
      var link = document.createElement('a');
      link.href = item.href;
      link.textContent = item.label;
      if (window.location.pathname === item.href) link.setAttribute('aria-current', 'page');
      listItem.appendChild(link);
      submenu.appendChild(listItem);
    });
    mobileParentLink.parentElement.appendChild(submenu);
  }

  function enhanceHelpDropdown() {
    var helpLinks = document.querySelectorAll('nav[aria-label="주요 메뉴"] > a[data-nav="/help/"]');
    var items = [
      { label: '소액결제 한도 해결', href: '/help/limit/' },
      { label: '소액결제 미납 해결', href: '/help/unpaid/' }
    ];

    helpLinks.forEach(function (trigger, index) {
      if (trigger.closest('.help-dropdown')) return;

      var wrapper = document.createElement('div');
      var panel = document.createElement('div');
      var panelId = 'help-dropdown-panel-' + (index + 1);
      var parent = trigger.parentNode;

      wrapper.className = 'carrier-dropdown help-dropdown';
      panel.className = 'carrier-dropdown__panel';
      panel.id = panelId;
      panel.setAttribute('aria-label', '문제 해결 하위페이지');

      parent.insertBefore(wrapper, trigger);
      wrapper.appendChild(trigger);

      trigger.classList.add('carrier-dropdown__trigger');
      trigger.setAttribute('aria-haspopup', 'true');
      trigger.setAttribute('aria-expanded', 'false');
      trigger.setAttribute('aria-controls', panelId);
      trigger.innerHTML = '<span>문제 해결</span><i data-lucide="chevron-down" class="carrier-dropdown__chevron" aria-hidden="true"></i>';

      items.forEach(function (item) {
        var link = document.createElement('a');
        link.className = 'carrier-dropdown__item';
        link.href = item.href;
        link.textContent = item.label;
        if (window.location.pathname === item.href) link.setAttribute('aria-current', 'page');
        panel.appendChild(link);
      });
      wrapper.appendChild(panel);

      function setOpen(open) {
        wrapper.classList.toggle('is-open', open);
        trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
      }

      wrapper.addEventListener('mouseenter', function () {
        wrapper.classList.remove('is-escape-closed');
        setOpen(true);
      });
      wrapper.addEventListener('mouseleave', function () {
        if (!wrapper.contains(document.activeElement)) setOpen(false);
      });
      wrapper.addEventListener('focusin', function () {
        if (!wrapper.classList.contains('is-escape-closed')) setOpen(true);
      });
      wrapper.addEventListener('focusout', function () {
        window.setTimeout(function () {
          if (!wrapper.contains(document.activeElement)) {
            wrapper.classList.remove('is-escape-closed');
            setOpen(false);
          }
        }, 0);
      });
      wrapper.addEventListener('keydown', function (event) {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        event.stopPropagation();
        wrapper.classList.add('is-escape-closed');
        setOpen(false);
        trigger.focus();
      });
    });

    var mobileMenu = document.getElementById('mobile-menu');
    if (!mobileMenu || mobileMenu.querySelector('.help-mobile-submenu')) return;

    var mobileParentLink = mobileMenu.querySelector('a[href="/help/"]');
    if (!mobileParentLink || !mobileParentLink.parentElement) return;

    var submenu = document.createElement('ul');
    submenu.className = 'content-fee-mobile-submenu help-mobile-submenu';
    submenu.setAttribute('aria-label', '문제 해결 하위메뉴');
    items.forEach(function (item) {
      var listItem = document.createElement('li');
      var link = document.createElement('a');
      link.href = item.href;
      link.textContent = item.label;
      if (window.location.pathname === item.href) link.setAttribute('aria-current', 'page');
      listItem.appendChild(link);
      submenu.appendChild(listItem);
    });
    mobileParentLink.parentElement.appendChild(submenu);
  }

  document.addEventListener('DOMContentLoaded', function () {
    insertSharedHomeHero();
    applyAutoArticleTemplate();
    enhanceInternalPage();
    ensureContentFeeNavigation();
    enhanceCarrierDropdown();
    enhanceContentFeeDropdown();
    enhanceHelpDropdown();

    /* ---------- Lucide 아이콘 ---------- */
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons();
    }

    /* ---------- 모바일 메뉴 ---------- */
    var menuButton = document.getElementById('menu-button');
    var mobileMenu = document.getElementById('mobile-menu');
    if (menuButton && mobileMenu) {
      menuButton.addEventListener('click', function () {
        var isOpen = mobileMenu.classList.toggle('is-open');
        menuButton.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      });
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && mobileMenu.classList.contains('is-open')) {
          mobileMenu.classList.remove('is-open');
          menuButton.setAttribute('aria-expanded', 'false');
          menuButton.focus();
        }
      });
    }

    /* ---------- 현재 메뉴 강조 ---------- */
    var path = window.location.pathname;
    document.querySelectorAll('[data-nav]').forEach(function (link) {
      var prefix = link.getAttribute('data-nav');
      if (prefix && prefix !== '/' && path.indexOf(prefix) === 0) {
        link.setAttribute('aria-current', 'page');
        link.classList.add('font-semibold');
      }
    });

    /* ---------- CTA·전화·채널톡 이벤트 ---------- */
    document.querySelectorAll('[data-evt]').forEach(function (el) {
      el.addEventListener('click', function () {
        var evt = el.getAttribute('data-evt');
        var pos = el.getAttribute('data-evt-position') || '';
        if (evt === 'channeltalk_open') {
          pushEvent('channeltalk_open', { cta_position: pos });
        } else if (evt === 'phone_click') {
          pushEvent('phone_click', { cta_position: pos });
        } else {
          pushEvent('cta_click', { cta_position: pos, cta_label: (el.textContent || '').trim() });
        }
      });
    });

    /* ---------- FAQ 아코디언 이벤트 ---------- */
    document.querySelectorAll('details.faq-item').forEach(function (item) {
      item.addEventListener('toggle', function () {
        if (item.open) {
          var q = item.querySelector('summary');
          pushEvent('faq_open', { faq_question: q ? (q.textContent || '').trim() : '' });
        }
      });
    });

    /* ---------- 블로그 허브 카테고리 필터 ---------- */
    var filterButtons = document.querySelectorAll('.blog-filter');
    if (filterButtons.length) {
      var cards = document.querySelectorAll('.blog-card');
      var status = document.getElementById('filter-status');
      var ON = ['border-primary-600', 'bg-primary-700', 'text-white'];
      var OFF = ['border-ink-300', 'text-ink-700', 'hover:bg-ink-100'];

      filterButtons.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var want = btn.getAttribute('data-filter');
          var shown = 0;

          filterButtons.forEach(function (other) {
            var active = other === btn;
            other.setAttribute('aria-pressed', active ? 'true' : 'false');
            other.classList.remove.apply(other.classList, active ? OFF : ON);
            other.classList.add.apply(other.classList, active ? ON : OFF);
          });

          cards.forEach(function (card) {
            var match = want === 'all' || card.getAttribute('data-category') === want;
            card.hidden = !match;
            if (match) shown++;
          });

          if (status) {
            status.textContent = want === 'all'
              ? '전체 ' + shown + '편을 표시하고 있습니다.'
              : want + ' 카테고리 ' + shown + '편을 표시하고 있습니다.';
          }
          pushEvent('blog_filter', { blog_category: want, result_count: shown });
        });
      });
    }

    /* ---------- 모바일 하단 고정 CTA (기획안 7장 규칙) ----------
       - 높이 56px 이하, body padding-bottom 동일값(CSS)
       - 첫 화면에서는 숨기고 스크롤 후 노출
       - 입력 요소 포커스 시 숨김
       - 닫기 버튼을 누르면 해당 세션 동안 미노출
       - 푸터 구간에서는 미표시
       - /contact/·/legal/ 페이지에는 마크업 자체를 넣지 않음 */
    var fixedCta = document.getElementById('fixed-cta');
    if (fixedCta) {
      var closed = false;
      try { closed = sessionStorage.getItem('fixedCtaClosed') === '1'; } catch (e) { /* 프라이빗 모드 등 */ }

      if (closed) {
        fixedCta.remove();
      } else {
        var scrolled = false;
        var inputFocused = false;
        var footerVisible = false;

        function update() {
          var visible = scrolled && !inputFocused && !footerVisible;
          fixedCta.classList.toggle('is-visible', visible);
          document.body.classList.toggle('has-fixed-cta', visible);
        }

        window.addEventListener('scroll', function () {
          scrolled = window.scrollY > window.innerHeight * 0.6;
          update();
        }, { passive: true });

        document.addEventListener('focusin', function (e) {
          if (e.target.matches('input, textarea, select')) { inputFocused = true; update(); }
        });
        document.addEventListener('focusout', function (e) {
          if (e.target.matches('input, textarea, select')) { inputFocused = false; update(); }
        });

        var footer = document.querySelector('footer');
        if (footer && 'IntersectionObserver' in window) {
          new IntersectionObserver(function (entries) {
            footerVisible = entries[0].isIntersecting;
            update();
          }, { rootMargin: '0px 0px 0px 0px' }).observe(footer);
        }

        var closeBtn = fixedCta.querySelector('[data-cta-close]');
        if (closeBtn) {
          closeBtn.addEventListener('click', function () {
            try { sessionStorage.setItem('fixedCtaClosed', '1'); } catch (e) { /* noop */ }
            fixedCta.remove();
            document.body.classList.remove('has-fixed-cta');
          });
        }
      }
    }
  });
})();
