// LotLink Indiana — shared site script
// Handles mobile nav toggle, keyboard close, and minor enhancements across all pages.

(function () {
  'use strict';

  // ── MOBILE NAV ──────────────────────────────────────────────
  function initMobileNav() {
    var btn = document.querySelector('.nav-mobile-btn');
    var links = document.querySelector('.nav-links');
    if (!btn || !links) return;

    // Ensure the menu has an id for aria-controls linking
    if (!links.id) links.id = 'nav-links';

    function closeMenu() {
      links.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
      btn.setAttribute('aria-label', 'Open menu');
      document.body.classList.remove('nav-open');
    }
    function openMenu() {
      links.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
      btn.setAttribute('aria-label', 'Close menu');
      document.body.classList.add('nav-open');
    }
    function toggleMenu() {
      if (links.classList.contains('is-open')) closeMenu();
      else openMenu();
    }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleMenu();
    });

    // Close on link click
    links.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') closeMenu();
    });

    // Close on Escape
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && links.classList.contains('is-open')) closeMenu();
    });

    // Close on outside click
    document.addEventListener('click', function (e) {
      if (!links.contains(e.target) && !btn.contains(e.target)) closeMenu();
    });

    // Close on viewport jump to desktop
    var mq = window.matchMedia('(min-width: 769px)');
    mq.addEventListener ? mq.addEventListener('change', closeMenu) : mq.addListener(closeMenu);
  }

  // ── INIT ────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMobileNav);
  } else {
    initMobileNav();
  }
})();
