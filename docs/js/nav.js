(function () {
  'use strict';

  // ── Brightness: apply immediately to avoid flash on load ─────────────────
  var BRIGHTNESS_KEY = 'ada-brightness';
  var savedBrightness = parseInt(localStorage.getItem(BRIGHTNESS_KEY) || '100', 10);
  if (savedBrightness !== 100) {
    document.documentElement.style.filter = 'brightness(' + (savedBrightness / 100) + ')';
  }

  document.addEventListener('DOMContentLoaded', function () {
    var wrapper  = document.getElementById('hamburger-wrapper');
    var btn      = document.getElementById('hamburger-btn');
    var dropdown = document.getElementById('hamburger-dropdown');
    if (!btn || !dropdown) return;

    // ── Toggle open/close ─────────────────────────────────────────────────────
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var isOpen = dropdown.classList.contains('is-open');
      dropdown.classList.toggle('is-open', !isOpen);
      btn.setAttribute('aria-expanded', String(!isOpen));
    });
    document.addEventListener('click', function (e) {
      if (wrapper && !wrapper.contains(e.target)) {
        dropdown.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && dropdown.classList.contains('is-open')) {
        dropdown.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
        btn.focus();
      }
    });

    // ── Active state on desktop nav links ────────────────────────────────────
    var page = document.body.dataset.page || '';
    var desktopLinkIds = {
      checker:  'desktop-nav-checker',
      pricing:  'desktop-nav-pricing',
      settings: 'desktop-nav-settings'
    };
    var activeDesktopId = desktopLinkIds[page];
    if (activeDesktopId) {
      var activeDesktopLink = document.getElementById(activeDesktopId);
      if (activeDesktopLink) activeDesktopLink.classList.add('active');
    }

    // ── Hide the link for the current page in hamburger ───────────────────────
    var linkIds = {
      checker:  'nav-checker-link',
      pricing:  'nav-pricing-link',
      settings: 'nav-settings-link'
    };
    var currentLinkId = linkIds[page];
    if (currentLinkId) {
      var currentLink = document.getElementById(currentLinkId);
      if (currentLink) currentLink.style.display = 'none';
    }

    // ── Brightness slider ─────────────────────────────────────────────────────
    var slider = document.getElementById('brightness-slider');
    if (!slider) return;
    slider.value = savedBrightness;
    slider.addEventListener('input', function () {
      var val = parseInt(slider.value, 10);
      document.documentElement.style.filter = val === 100 ? '' : 'brightness(' + (val / 100) + ')';
      localStorage.setItem(BRIGHTNESS_KEY, String(val));
    });
  });

  // ── Re-run active state on client-side navigation ─────────────────────────
  function updateActiveNav(page) {
    var desktopLinkIds = {
      checker:  'desktop-nav-checker',
      pricing:  'desktop-nav-pricing',
      settings: 'desktop-nav-settings'
    };
    // Remove active from all
    Object.values(desktopLinkIds).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.classList.remove('active');
    });
    // Add active to current
    var activeId = desktopLinkIds[page];
    if (activeId) {
      var activeEl = document.getElementById(activeId);
      if (activeEl) activeEl.classList.add('active');
    }
    // Reset hamburger link visibility
    var linkIds = { checker: 'nav-checker-link', pricing: 'nav-pricing-link', settings: 'nav-settings-link' };
    Object.values(linkIds).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) el.style.display = '';
    });
    var hideId = linkIds[page];
    if (hideId) {
      var hideEl = document.getElementById(hideId);
      if (hideEl) hideEl.style.display = 'none';
    }
  }

  window.addEventListener('ada-navigate', function (e) {
    updateActiveNav(e.detail.page);
  });
}());
