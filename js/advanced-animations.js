/**
 * STACKLY Government Services — Advanced Animation Engine
 * Pure vanilla JS. Works with css/animations.css.
 *
 * - [data-aa-group]  containers stagger their children via --i
 * - [data-anim]      single-element effects: rise | fade | pop | left | right | words
 * - [data-anim-clip] clip-path wipe + light sweep (hero/editorial images)
 * - .aa-particles    gold dust particle fields (hero + footer)
 * - .aa-scroll-progress thin gold reading bar at the very top
 * - Honors prefers-reduced-motion; everything degrades to visible content.
 */
(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Mark <html> so CSS can safely pre-hide animated elements */
  if (!prefersReducedMotion) {
    document.documentElement.classList.add('js-anim');
  }

  /* ------------------------------------------------------------------ */
  /* 1. Word-mask splitter for display titles                           */
  /*    Keeps <br> line breaks and <em> italic accents intact.          */
  /* ------------------------------------------------------------------ */
  function splitWords(el) {
    if (el.dataset.aaSplit === 'done') return;

    var nodes = Array.prototype.slice.call(el.childNodes);
    var wordIndex = 0;

    function makeWordWrapper(word) {
      var wrap = document.createElement('span');
      wrap.className = 'wm';
      var inner = document.createElement('span');
      inner.className = 'anim-child';
      inner.style.setProperty('--w', wordIndex++);
      inner.textContent = word;
      wrap.appendChild(inner);
      return wrap;
    }

    nodes.forEach(function (node) {
      if (node.nodeType === 3) { // text node
        var frag = document.createDocumentFragment();
        var parts = node.textContent.split(/(\s+)/);
        parts.forEach(function (part) {
          if (part === '') return;
          if (/^\s+$/.test(part)) {
            frag.appendChild(document.createTextNode(' '));
          } else {
            frag.appendChild(makeWordWrapper(part));
          }
        });
        el.replaceChild(frag, node);
      } else if (node.nodeType === 1 && node.tagName === 'BR') {
        // keep line breaks as-is
      } else if (node.nodeType === 1) {
        // <em> etc: split its inner words too, preserving the element style
        var innerNodes = Array.prototype.slice.call(node.childNodes);
        var innerFrag = document.createDocumentFragment();
        innerNodes.forEach(function (child) {
          if (child.nodeType === 3) {
            var parts2 = child.textContent.split(/(\s+)/);
            parts2.forEach(function (part) {
              if (part === '') return;
              if (/^\s+$/.test(part)) {
                innerFrag.appendChild(document.createTextNode(' '));
              } else {
                innerFrag.appendChild(makeWordWrapper(part));
              }
            });
            node.replaceChild(innerFrag, child);
          }
        });
      }
    });

    el.dataset.aaSplit = 'done';
  }

  /* ------------------------------------------------------------------ */
  /* 2. Particle field spawner                                          */
  /* ------------------------------------------------------------------ */
  function spawnParticles(host, count, goldRatio) {
    if (prefersReducedMotion) return;
    if (host.dataset.aaParticles === 'done') return;
    host.dataset.aaParticles = 'done';

    var field = document.createElement('div');
    field.className = 'aa-particles';
    field.setAttribute('aria-hidden', 'true');

    for (var i = 0; i < count; i++) {
      var p = document.createElement('span');
      p.className = 'aa-particle' + (Math.random() < goldRatio ? ' aa-gold' : '');
      p.style.left = (Math.random() * 100) + '%';
      p.style.setProperty('--p-dur', (9 + Math.random() * 9).toFixed(1) + 's');
      p.style.setProperty('--p-delay', (-Math.random() * 14).toFixed(1) + 's');
      p.style.setProperty('--p-sway', ((Math.random() * 90) - 45).toFixed(0) + 'px');
      var s = (0.6 + Math.random() * 0.9).toFixed(2);
      p.style.transform = 'scale(' + s + ')';
      field.appendChild(p);
    }

    host.appendChild(field);
  }

  /* ------------------------------------------------------------------ */
  /* 3. Scroll progress bar                                             */
  /* ------------------------------------------------------------------ */
  function initScrollProgress() {
    if (prefersReducedMotion) return;

    var bar = document.createElement('div');
    bar.className = 'aa-scroll-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.appendChild(bar);

    var ticking = false;
    function update() {
      ticking = false;
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      var ratio = max > 0 ? Math.min(window.pageYOffset / max, 1) : 0;
      bar.style.transform = 'scaleX(' + ratio + ')';
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(update);
      }
    }, { passive: true });

    update();
  }

  /* ------------------------------------------------------------------ */
  /* 4. Reveal engine                                                   */
  /* ------------------------------------------------------------------ */

  /* Existing markup containers that get staggered entrances automatically */
  var AUTO_GROUPS = [
    '.services-grid-8', '.process-steps-grid', '.featured-grid-4',
    '.departments-grid-6', '.benefits-grid-6', '.stats-grid-4',
    '.security-flow-wrap', '.categories-grid', '.search-panel-box',
    '.hero-actions', '.final-cta-actions'
  ];

  function initRevealEngine() {
    /* 4a. Auto-tag group containers (no HTML edits needed) */
    AUTO_GROUPS.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (el) {
        if (!el.hasAttribute('data-aa-group')) el.setAttribute('data-aa-group', '');
      });
    });

    /* 4b. Word-mask the big display titles in hero / page-hero */
    document.querySelectorAll('.hero h1.display-title, .page-hero h1.display-title').forEach(function (t) {
      t.setAttribute('data-anim', 'words');
    });
    document.querySelectorAll('[data-anim="words"]').forEach(splitWords);

    /* Clip-wipe for feature imagery */
    document.querySelectorAll('.hero-image-card, .editorial-image-wrap').forEach(function (el) {
      if (!el.hasAttribute('data-anim-clip')) el.setAttribute('data-anim-clip', '');
    });

    /* 4b. Stagger indices inside group containers */
    document.querySelectorAll('[data-aa-group]').forEach(function (group) {
      Array.prototype.forEach.call(group.children, function (child, i) {
        child.style.setProperty('--i', i);
      });
    });

    /* Footer columns get their own stagger */
    document.querySelectorAll('.footer-grid').forEach(function (grid) {
      Array.prototype.forEach.call(grid.children, function (child, i) {
        child.style.setProperty('--i', i);
      });
    });

    /* 4c. Solo indices for elements animated individually */
    document.querySelectorAll('[data-anim]:not([data-aa-group] *)').forEach(function (el, i) {
      if (!el.style.getPropertyValue('--i')) {
        el.style.setProperty('--i', i % 6);
      }
    });

    /* 4d. Observe everything */
    var targets = document.querySelectorAll(
      '[data-anim], [data-anim-clip], [data-aa-group], .footer-grid > *, .footer-bottom, .process-line-bg'
    );

    if (!targets.length) return;

    if (prefersReducedMotion || !('IntersectionObserver' in window)) {
      targets.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          obs.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.12,
      rootMargin: '0px 0px -8% 0px'
    });

    targets.forEach(function (el) { observer.observe(el); });
  }

  /* ------------------------------------------------------------------ */
  /* 5. Security connector line (desktop only marker)                   */
  /* ------------------------------------------------------------------ */
  function initSecurityConnector() {
    var wrap = document.querySelector('.security-flow-wrap');
    if (!wrap) return;
    if (window.matchMedia('(min-width: 1025px)').matches && !prefersReducedMotion) {
      wrap.setAttribute('data-connector-ready', '');
    }
  }

  /* ------------------------------------------------------------------ */
  /* Boot                                                               */
  /* ------------------------------------------------------------------ */
  function boot() {
    /* Hero ambience */
    var hero = document.querySelector('.hero');
    if (hero) spawnParticles(hero, 16, 0.4);

    /* Footer gold dust */
    var footer = document.querySelector('.site-footer');
    if (footer) spawnParticles(footer, 12, 0.8);

    initSecurityConnector();
    initScrollProgress();
    initRevealEngine();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
