/**
 * STACKLY Government Services — Site-wide Page Preloader
 * Pure Vanilla JavaScript (No frameworks)
 *
 * Shows a branded loading overlay on every page load / refresh, animates a
 * progress bar, then fades the overlay away once the page is fully loaded.
 * A safety timeout guarantees the page is never stuck behind the loader.
 */
(function () {
  'use strict';

  var MAX_PROGRESS = 96;   // never reach 100% until the page actually loads
  var TICK_MS = 180;       // progress animation speed
  var FAILSAFE_MS = 4000;  // absolute maximum time the loader may stay visible

  function initPreloader() {
    var preloader = document.getElementById('page-preloader');
    if (!preloader) return;

    var bar = preloader.querySelector('.preloader-progress-bar');

    var progress = 0;
    var done = false;
    var tickTimer = null;
    var failsafeTimer = null;

    function setBar(value) {
      if (bar) bar.style.width = value + '%';
    }

    function animateProgress() {
      // Ease towards MAX_PROGRESS — fast at first, slower near the end.
      var remaining = MAX_PROGRESS - progress;
      progress += Math.max(0.4, remaining * 0.08);
      if (progress > MAX_PROGRESS) progress = MAX_PROGRESS;
      setBar(progress);
    }

    function hidePreloader() {
      if (done) return;
      done = true;

      if (tickTimer) clearInterval(tickTimer);
      if (failsafeTimer) clearTimeout(failsafeTimer);

      setBar(100);

      // Small delay so the user actually sees the bar reach 100%.
      setTimeout(function () {
        preloader.classList.add('is-hidden');

        // Clear the scroll position restore guard so browser scroll
        // restoration works normally again after the refresh.
        window.removeEventListener('beforeunload', lockScroll);

        // Remove the node from the DOM after the fade-out completes.
        setTimeout(function () {
          if (preloader.parentNode) preloader.parentNode.removeChild(preloader);
        }, 600);
      }, 250);
    }

    // While refreshing, remember where the user was so the browser can
    // restore the exact scroll position after the reload.
    function lockScroll() {
      try {
        sessionStorage.setItem('stackly_scroll_' + location.pathname, String(window.scrollY));
      } catch (e) { /* storage unavailable — ignore */ }
    }

    // Restore previous scroll position on refresh (feels like the page
    // "opens where you left it" once the loader finishes).
    try {
      var key = 'stackly_scroll_' + location.pathname;
      var saved = sessionStorage.getItem(key);
      if (saved !== null && saved !== '0') {
        window.scrollTo(0, parseInt(saved, 10) || 0);
        sessionStorage.removeItem(key);
      }
    } catch (e) { /* storage unavailable — ignore */ }

    window.addEventListener('beforeunload', lockScroll);

    // Start the animated progress bar
    tickTimer = setInterval(animateProgress, TICK_MS);
    setBar(4);

    // Hide as soon as everything (images, fonts, stylesheets) has loaded
    if (document.readyState === 'complete') {
      hidePreloader();
    } else {
      window.addEventListener('load', hidePreloader);
    }

    // Failsafe: never trap the user behind the loader
    failsafeTimer = setTimeout(hidePreloader, FAILSAFE_MS);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPreloader);
  } else {
    initPreloader();
  }
})();
