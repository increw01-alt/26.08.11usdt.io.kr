// 테마 토글
(function () {
  var btn = document.getElementById("theme-toggle");
  if (!btn) return;
  function current() {
    // 사이트 기본 테마는 다크 (디자인 시안 기준)
    return document.documentElement.getAttribute("data-theme") || "dark";
  }
  btn.addEventListener("click", function () {
    var next = current() === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("theme", next); } catch (e) {}
    document.dispatchEvent(new CustomEvent("themechange"));
  });
})();

// 메인페이지 카드 섹션 등장 모션
(function () {
  var home = document.querySelector(".home-video-hero");
  if (!home) return;

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var selector = [
    ".home-dashboard-overlap .card",
    "main > .section:not(.home-dashboard-overlap) .card",
    "main > .section:not(.home-dashboard-overlap) .table-wrap",
    "main > .section:not(.home-dashboard-overlap) .cta-box"
  ].join(",");
  var targets = Array.prototype.slice.call(document.querySelectorAll(selector));
  if (!targets.length) return;

  document.body.classList.add("home-motion-ready");
  targets.forEach(function (target, index) {
    target.classList.add("home-reveal");
    if (target.classList.contains("card") || target.classList.contains("cta-box")) {
      target.classList.add("home-card-motion");
    }
    target.style.setProperty("--home-motion-index", index % 4);
  });

  if (reducedMotion || !("IntersectionObserver" in window)) {
    targets.forEach(function (target) { target.classList.add("is-home-visible"); });
    return;
  }

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-home-visible");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.08, rootMargin: "0px 0px -6% 0px" });
  targets.forEach(function (target) { observer.observe(target); });
})();

// 장문형 상세페이지 등장 모션·목차·읽기 진행률
(function () {
  var root = document.querySelector(".article-template-v1");
  if (!root) return;

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var targets = Array.prototype.slice.call(root.querySelectorAll("[data-article-reveal]"));
  root.classList.add("article-v1-motion-ready");

  targets.forEach(function (target) {
    target.classList.add("article-v1-reveal");
    var items = target.querySelectorAll(
      ".article-v1-check-grid li, .article-v1-toc li, .article-v1-step-item, " +
      ".article-v1-safety-list li, .article-v1-table-wrap tbody tr, .faq-item, " +
      ".article-v1-key-box, .article-v1-info-box, .article-v1-warning"
    );
    items.forEach(function (item, index) {
      item.classList.add("article-v1-stagger");
      item.style.setProperty("--article-item-index", index);
    });
  });

  if (reducedMotion || !("IntersectionObserver" in window)) {
    targets.forEach(function (target) { target.classList.add("is-article-visible"); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-article-visible");
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -7% 0px" });
    targets.forEach(function (target) { revealObserver.observe(target); });
  }

  var tocLinks = Array.prototype.slice.call(root.querySelectorAll('.article-v1-toc a[href^="#"]'));
  var tocSections = tocLinks.map(function (link) {
    return document.getElementById(link.getAttribute("href").slice(1));
  }).filter(Boolean);

  function setActiveToc(id) {
    tocLinks.forEach(function (link) {
      var active = link.getAttribute("href") === "#" + id;
      link.classList.toggle("is-active", active);
      if (active) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  }

  if (tocSections.length && "IntersectionObserver" in window) {
    var sectionObserver = new IntersectionObserver(function (entries) {
      var visible = entries.filter(function (entry) { return entry.isIntersecting; });
      if (!visible.length) return;
      visible.sort(function (a, b) { return a.boundingClientRect.top - b.boundingClientRect.top; });
      setActiveToc(visible[0].target.id);
    }, { rootMargin: "-20% 0px -64% 0px", threshold: 0 });
    tocSections.forEach(function (section) { sectionObserver.observe(section); });
  }

  if (!reducedMotion) {
    var progress = document.createElement("div");
    progress.className = "article-v1-reading-progress";
    progress.setAttribute("aria-hidden", "true");
    document.body.appendChild(progress);
    var ticking = false;
    function updateProgress() {
      var top = root.getBoundingClientRect().top + window.scrollY;
      var total = Math.max(1, root.offsetHeight - window.innerHeight);
      var ratio = Math.min(1, Math.max(0, (window.scrollY - top) / total));
      progress.style.width = (ratio * 100) + "%";
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateProgress);
    }, { passive: true });
    updateProgress();
  }
})();
