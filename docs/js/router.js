(function () {
  'use strict';

  var cache = {};       // url → { main, title, page }
  var current = location.pathname;
  var transitioning = false;

  // ── Fetch and cache a page ────────────────────────────────────────────────
  function fetchPage(url) {
    if (cache[url]) return Promise.resolve(cache[url]);
    return fetch(url)
      .then(function (res) { return res.text(); })
      .then(function (html) {
        var parser = new DOMParser();
        var doc    = parser.parseFromString(html, 'text/html');
        var main   = doc.getElementById('main-content');
        var title  = doc.title;
        var page   = doc.body.dataset.page || '';
        var entry  = { main: main ? main.outerHTML : '', title: title, page: page };
        cache[url] = entry;
        return entry;
      });
  }

  // ── Swap content ──────────────────────────────────────────────────────────
  function navigate(url, isPopState) {
    if (transitioning) return;
    var normalized = url.replace(/^\//, '') || 'index.html';
    if (normalized === current && !isPopState) return;
    transitioning = true;

    var mainEl = document.getElementById('main-content');
    if (mainEl) mainEl.style.opacity = '0';

    fetchPage(url)
      .then(function (entry) {
        // Swap <main> content
        var mainEl = document.getElementById('main-content');
        if (mainEl) {
          var tmp = document.createElement('div');
          tmp.innerHTML = entry.main;
          var newMain = tmp.firstElementChild;
          if (newMain) {
            // Copy attributes (id, class) from new main
            mainEl.id        = newMain.id || 'main-content';
            mainEl.className = newMain.className || '';
            mainEl.innerHTML = newMain.innerHTML;
          }
        }

        // Update title, URL, body data-page
        document.title = entry.title;
        document.body.dataset.page = entry.page;

        if (!isPopState) {
          history.pushState({ url: url }, entry.title, url);
        }
        current = normalized;

        // Scroll to top
        window.scrollTo(0, 0);

        // Fire navigation event so scripts can re-init
        window.dispatchEvent(new CustomEvent('ada-navigate', {
          detail: { page: entry.page, url: url }
        }));

        // Fade in
        var el = document.getElementById('main-content');
        if (el) {
          el.style.transition = 'opacity 0.15s ease';
          el.style.opacity    = '0';
          requestAnimationFrame(function () {
            requestAnimationFrame(function () {
              el.style.opacity = '1';
            });
          });
        }

        transitioning = false;
      })
      .catch(function () {
        // Fallback to normal navigation on error
        transitioning = false;
        window.location.href = url;
      });
  }

  // ── Intercept internal link clicks ────────────────────────────────────────
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href');
    // Only handle same-origin .html links (not # anchors, mailto, external)
    if (!href) return;
    if (href.startsWith('http') || href.startsWith('mailto') || href.startsWith('#')) return;
    if (a.target === '_blank') return;
    if (!href.endsWith('.html') && href !== '/') return;
    // Settings has a complex sidebar layout — let it do a full page load
    if (href.includes('settings.html') || document.body.dataset.page === 'settings') return;
    e.preventDefault();
    navigate(href);
  });

  // ── Prefetch on hover so page is cached before click ─────────────────────
  document.addEventListener('mouseover', function (e) {
    var a = e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href');
    if (!href || !href.endsWith('.html')) return;
    if (!cache[href]) fetchPage(href);
  });

  // ── Handle browser back / forward ─────────────────────────────────────────
  window.addEventListener('popstate', function (e) {
    navigate(location.pathname + location.search, true);
  });

  // ── Expose globally ───────────────────────────────────────────────────────
  window.adaRouter = { navigate: navigate, cache: cache };

}());
