/**
 * STACKLY Government Services — Cinematic Broadcast Animation Engine v2
 * Pure vanilla JS. Works with css/animations.css.
 *
 * Every section receives its own entrance choreography (mask risers, signal
 * locks, scanner sweeps, shutter collapses, ledger wipes, shockwave ticks,
 * traveling packets). Effects RE-ARM when a section leaves the viewport and
 * REPLAY every time it re-enters.
 *
 * Public behaviors:
 *  - data-cine        solo choreography: mask-words | signal | scan | editorial
 *  - data-cine-child  child grammar: ledger | riser | pill | wire | shutter
 *  - .cine-owned      engine-managed element (generic mask wipe)
 *  - .is-in           element is on stage; removed on exit => replay
 *  - prefers-reduced-motion: everything renders as a static frame.
 */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var hasIO = 'IntersectionObserver' in window;

  if (!reduceMotion) {
    document.documentElement.classList.add('js-anim');
  }

  /* ================================================================
     1. WORD SPLITTER — wraps words in .cw > .cine-word for mask risers
        Preserves <br>, <em> and nested inline elements.
     ================================================================ */
  function splitWords(el) {
    if (el.dataset.aaSplit === 'done') return;

    var wordIndex = 0;

    function wrapWord(word) {
      var mask = document.createElement('span');
      mask.className = 'cw';
      var wordEl = document.createElement('span');
      wordEl.className = 'cine-word';
      wordEl.style.setProperty('--w', wordIndex++);
      wordEl.textContent = word;
      mask.appendChild(wordEl);
      return mask;
    }

    function processTextNode(node, parent) {
      var frag = document.createDocumentFragment();
      var parts = node.textContent.split(/(\s+)/);
      parts.forEach(function (part) {
        if (part === '') return;
        if (/^\s+$/.test(part)) {
          frag.appendChild(document.createTextNode(' '));
        } else {
          frag.appendChild(wrapWord(part));
        }
      });
      parent.replaceChild(frag, node);
    }

    function processElement(el) {
      Array.prototype.slice.call(el.childNodes).forEach(function (node) {
        if (node.nodeType === 3) {
          processTextNode(node, el);
        } else if (node.nodeType === 1 && node.tagName === 'BR') {
          /* keep line breaks */
        } else if (node.nodeType === 1) {
          processElement(node);
        }
      });
    }

    processElement(el);
    el.dataset.aaSplit = 'done';
  }

  /* ================================================================
     2. SECTION EFFECT MAP — one choreography per section type
     ================================================================ */
  var EFFECTS = {
    /* ---- index.html ---- */
    '.hero': function (hero) {
      hero.setAttribute('data-cine', '');
      var eyebrow = hero.querySelector('.eyebrow');
      if (eyebrow) eyebrow.setAttribute('data-cine', 'signal');
      var title = hero.querySelector('.display-title');
      if (title) title.setAttribute('data-cine', 'mask-words');
      var copy = hero.querySelector('.hero-copy');
      if (copy) copy.setAttribute('data-cine', 'scan');

      /* hero image: blueprint build */
      var img = hero.querySelector('.hero-image-card');
      if (img) img.setAttribute('data-cine-child', 'wire');

      /* floating cards dock as risers */
      hero.querySelectorAll('.hero-float-card').forEach(function (card, i) {
        card.setAttribute('data-cine-child', 'riser');
        card.style.setProperty('--i', i + 3);
      });

      /* buttons: staggered mask wipes */
      var actions = hero.querySelector('.hero-actions');
      if (actions) {
        actions.setAttribute('data-cine', '');
        actions.querySelectorAll('.btn').forEach(function (btn, i) {
          btn.classList.add('cine-owned');
          btn.style.setProperty('--d', 500 + i * 130);
        });
      }
    },

    '.service-search-section': function (sec) {
      sec.setAttribute('data-cine', '');
      var eyebrow = sec.querySelector('.eyebrow');
      if (eyebrow) eyebrow.setAttribute('data-cine', 'signal');
      var title = sec.querySelector('.section-title');
      if (title) title.setAttribute('data-cine', 'mask-words');
      var lead = sec.querySelector('.lead-text');
      if (lead) lead.setAttribute('data-cine', 'scan');

      var panel = sec.querySelector('.search-panel-box');
      if (panel) panel.setAttribute('data-cine-child', 'ledger');

      var count = sec.querySelector('[data-service-count]');
      if (count) {
        count.classList.add('cine-owned');
        count.style.setProperty('--d', 650);
      }

      var pills = sec.querySelector('.categories-grid');
      if (pills) {
        pills.setAttribute('data-cine', '');
        pills.querySelectorAll('.category-pill').forEach(function (pill, i) {
          pill.setAttribute('data-cine-child', 'pill');
          pill.style.setProperty('--i', i);
        });
      }
    },

    '.services-section': function (sec) {
      sec.setAttribute('data-cine', '');

      /* gold bus-lines between grid columns (desktop only) */
      if (window.matchMedia('(min-width: 769px)').matches) {
        var grid = sec.querySelector('.services-grid-8');
        if (grid && getComputedStyle(grid).gridTemplateColumns.split(' ').length === 4) {
          [25, 50, 75].forEach(function (x) {
            var line = document.createElement('span');
            line.className = 'cine-circuit';
            line.style.left = x + '%';
            sec.querySelector('.container').appendChild(line);
          });
        }
      }

      var eyebrow = sec.querySelector('.eyebrow');
      if (eyebrow) eyebrow.setAttribute('data-cine', 'signal');
      var title = sec.querySelector('.section-title');
      if (title) title.setAttribute('data-cine', 'mask-words');
      var link = sec.querySelector('.btn-icon-link');
      if (link) {
        link.classList.add('cine-owned');
        link.style.setProperty('--d', 500);
      }

      sec.querySelectorAll('.service-card-3d').forEach(function (card, i) {
        card.setAttribute('data-cine-child', 'ledger');
        card.style.setProperty('--i', i);
      });
    },

    '.process-section': function (sec) {
      sec.setAttribute('data-cine', '');
      var title = sec.querySelector('.section-title');
      if (title) title.setAttribute('data-cine', 'mask-words');
      var lead = sec.querySelector('.lead-text');
      if (lead) lead.setAttribute('data-cine', 'scan');

      var steps = sec.querySelectorAll('.process-step-node');
      steps.forEach(function (node, i) {
        node.style.setProperty('--i', i);
      });

      /* runner hardware sized to the route line */
      var wrapEl = sec.querySelector('.process-steps-wrap');
      if (wrapEl && steps.length) {
        var route = document.createElement('span');
        route.className = 'cine-runner';
        wrapEl.appendChild(route);

        var last = steps[steps.length - 1];
        var first = steps[0];
        function sizeRunner() {
          var firstBox = first.getBoundingClientRect();
          var lastBox = last.getBoundingClientRect();
          var wrapBox = wrapEl.getBoundingClientRect();
          if (!wrapBox.width) return;
          route.style.left = (firstBox.left - wrapBox.left + firstBox.width * 0.1) + 'px';
          route.style.setProperty('--aa-route', (lastBox.left - firstBox.left) + 'px');
        }
        sizeRunner();
        window.addEventListener('resize', sizeRunner, { passive: true });
      }
    },

    '.featured-services-section': function (sec) {
      sec.setAttribute('data-cine', '');
      var eyebrow = sec.querySelector('.eyebrow');
      if (eyebrow) eyebrow.setAttribute('data-cine', 'signal');
      var title = sec.querySelector('.section-title');
      if (title) title.setAttribute('data-cine', 'mask-words');
      var lead = sec.querySelector('.lead-text');
      if (lead) lead.setAttribute('data-cine', 'scan');

      sec.querySelectorAll('.feature-service-card').forEach(function (card, i) {
        card.setAttribute('data-cine-child', 'shutter');
        card.style.setProperty('--i', i);

        /* navy shutter with gold seam-light */
        var shutter = document.createElement('span');
        shutter.className = 'cine-shutter';
        shutter.setAttribute('aria-hidden', 'true');
        card.appendChild(shutter);
      });
    },

    '.departments-section': function (sec) {
      sec.setAttribute('data-cine', '');
      var eyebrow = sec.querySelector('.eyebrow');
      if (eyebrow) eyebrow.setAttribute('data-cine', 'signal');
      var title = sec.querySelector('.section-title');
      if (title) title.setAttribute('data-cine', 'mask-words');
      var lead = sec.querySelector('.lead-text');
      if (lead) lead.setAttribute('data-cine', 'scan');

      sec.querySelectorAll('.department-card').forEach(function (card, i) {
        card.setAttribute('data-cine-child', 'ledger');
        card.style.setProperty('--i', i);
      });
    },

    '.benefits-section': function (sec) {
      sec.setAttribute('data-cine', '');
      var eyebrow = sec.querySelector('.eyebrow');
      if (eyebrow) eyebrow.setAttribute('data-cine', 'signal');
      var title = sec.querySelector('.section-title');
      if (title) title.setAttribute('data-cine', 'mask-words');
      var lead = sec.querySelector('.lead-text');
      if (lead) lead.setAttribute('data-cine', 'scan');

      sec.querySelectorAll('.benefit-card').forEach(function (card, i) {
        card.setAttribute('data-cine-child', 'ledger');
        card.style.setProperty('--i', i);
      });
    },

    '.statistics-section': function (sec) {
      sec.setAttribute('data-cine', '');
      sec.querySelectorAll('.stat-box').forEach(function (box, i) {
        box.setAttribute('data-cine-child', 'stat'); /* visibility + is-in state */
        box.style.setProperty('--i', i);
      });
    },

    '.security-section': function (sec) {
      sec.setAttribute('data-cine', '');
      var eyebrow = sec.querySelector('.eyebrow');
      if (eyebrow) eyebrow.setAttribute('data-cine', 'signal');
      var title = sec.querySelector('.section-title');
      if (title) title.setAttribute('data-cine', 'mask-words');
      var lead = sec.querySelector('.lead-text');
      if (lead) lead.setAttribute('data-cine', 'scan');

      var wrap = sec.querySelector('.security-flow-wrap');
      if (!wrap) return;
      wrap.setAttribute('data-cine', '');

      var cards = wrap.querySelectorAll('.security-step-card');
      cards.forEach(function (card, i) {
        card.setAttribute('data-cine-child', 'ledger');
        card.style.setProperty('--i', i);
      });

      /* traveling data packet (desktop + tablet) */
      if (cards.length > 1 && window.matchMedia('(min-width: 769px)').matches) {
        var packet = document.createElement('span');
        packet.className = 'cine-packet';
        packet.setAttribute('aria-hidden', 'true');
        wrap.appendChild(packet);

        function sizePacket() {
          var firstBox = cards[0].getBoundingClientRect();
          var lastBox = cards[cards.length - 1].getBoundingClientRect();
          var wrapBox = wrap.getBoundingClientRect();
          if (!wrapBox.width) return;
          packet.style.top = (firstBox.top - wrapBox.top + firstBox.height * 0.28) + 'px';
          packet.style.left = (firstBox.left - wrapBox.left + firstBox.width * 0.5) + 'px';
          packet.style.setProperty('--aa-chain', (lastBox.left - firstBox.left) + 'px');
        }
        sizePacket();
        window.addEventListener('resize', sizePacket, { passive: true });
      }
    },

    '.testimonials-section': function (sec) {
      sec.setAttribute('data-cine', '');
      var eyebrow = sec.querySelector('.eyebrow');
      if (eyebrow) eyebrow.setAttribute('data-cine', 'signal');
      var title = sec.querySelector('.section-title');
      if (title) title.setAttribute('data-cine', 'mask-words');
      var lead = sec.querySelector('.lead-text');
      if (lead) lead.setAttribute('data-cine', 'scan');

      var carousel = sec.querySelector('.carousel-outer');
      if (carousel) carousel.setAttribute('data-cine', '');
    },

    '.final-cta-section': function (sec) {
      sec.setAttribute('data-cine', '');
      var title = sec.querySelector('.display-title');
      if (title) title.setAttribute('data-cine', 'mask-words');

      var actions = sec.querySelector('.final-cta-actions');
      if (actions) {
        actions.setAttribute('data-cine', '');
        actions.querySelectorAll('.btn').forEach(function (btn, i) {
          btn.classList.add('cine-owned');
          btn.style.setProperty('--d', 450 + i * 130);
        });
      }
    },

    /* ---- shared inner-page sections ---- */
    '.page-hero': function (sec) {
      sec.setAttribute('data-cine', '');
      var eyebrow = sec.querySelector('.eyebrow');
      if (eyebrow) eyebrow.setAttribute('data-cine', 'signal');
      var title = sec.querySelector('.display-title, .section-title');
      if (title) title.setAttribute('data-cine', 'mask-words');
      var lead = sec.querySelector('.lead-text') || sec.querySelector('p:not(.eyebrow)');
      if (lead && lead !== eyebrow && !lead.hasAttribute('data-cine')) {
        lead.setAttribute('data-cine', 'scan');
      }
    },

    '.auth-form-side': function (sec) {
      sec.setAttribute('data-cine', '');
      var title = sec.querySelector('.section-title, h1, h2');
      if (title) title.setAttribute('data-cine', 'mask-words');

      sec.querySelectorAll('.form-group').forEach(function (group, i) {
        group.classList.add('cine-owned');
        group.style.setProperty('--d', 150 + i * 90);
      });

      var extras = sec.querySelectorAll('.auth-options, .auth-alt-action, .btn');
      extras.forEach(function (el, i) {
        el.classList.add('cine-owned');
        el.style.setProperty('--d', 700 + i * 90);
      });
    },

    '.auth-banner-side': function (sec) {
      sec.setAttribute('data-cine', 'editorial');
      attachEditorialPanel(sec, false);
      sec.querySelectorAll('h2, h3, p, .auth-stat-row, ul').forEach(function (el, i) {
        el.classList.add('cine-owned');
        el.style.setProperty('--d', 600 + i * 150);
      });
    },

    '.editorial-grid-2': function (sec) {
      sec.setAttribute('data-cine', '');
      var eyebrow = sec.querySelector('.eyebrow');
      if (eyebrow) eyebrow.setAttribute('data-cine', 'signal');
      var title = sec.querySelector('.section-title');
      if (title) title.setAttribute('data-cine', 'mask-words');

      sec.querySelectorAll('.editorial-image-wrap').forEach(function (img, i) {
        img.setAttribute('data-cine', 'editorial');
        img.classList.toggle('dir-left', i % 2 === 1);
        attachEditorialPanel(img, i % 2 === 1);
      });

      var textCol = sec.querySelector('.editorial-content, .editorial-text, p');
      if (textCol) textCol.setAttribute('data-cine', 'scan');
    },

    '.contact-info-grid, .faq-grid, .blog-grid-3': function (sec) {
      sec.setAttribute('data-cine', '');
      Array.prototype.forEach.call(sec.children, function (child, i) {
        child.setAttribute('data-cine-child', 'ledger');
        child.style.setProperty('--i', i);
      });
    },

    '.form-card': function (sec) {
      sec.setAttribute('data-cine-child', 'ledger');
      sec.style.setProperty('--i', 0);
    },

    /* ---- dashboard panes (admin/user) — replays on every pane switch ---- */
    '.dashboard-pane': function (sec) {
      sec.setAttribute('data-cine', '');
      var eyebrow = sec.querySelector('.eyebrow');
      if (eyebrow) eyebrow.setAttribute('data-cine', 'signal');
      var title = sec.querySelector('.display-title, .section-title');
      if (title) title.setAttribute('data-cine', 'mask-words');
      var lead = sec.querySelector('p:not(.eyebrow)');
      if (lead && !lead.hasAttribute('data-cine')) lead.setAttribute('data-cine', 'scan');

      sec.querySelectorAll('.metric-card').forEach(function (card, i) {
        card.setAttribute('data-cine-child', 'riser');
        card.style.setProperty('--i', i);
      });

      sec.querySelectorAll('.table-card').forEach(function (card, i) {
        card.setAttribute('data-cine-child', 'ledger');
        card.style.setProperty('--i', i);
      });

      sec.querySelectorAll('.process-step-node').forEach(function (node, i) {
        node.setAttribute('data-cine-child', 'riser');
        node.style.setProperty('--i', i);
      });

      /* bar charts grow from zero each time the pane appears */
      var chart = sec.querySelector('.chart-container');
      if (chart && !reduceMotion) chart.setAttribute('data-cine-bars', '');
    },

    /* ---- 404 page ---- */
    '.error-page-wrapper': function (sec) {
      sec.setAttribute('data-cine', '');
      var card = sec.querySelector('.error-card-panel');
      if (card) card.setAttribute('data-cine-child', 'riser');
    }
  };

  /* Grid grammars applied on ANY page (about, dashboards, blog, contact) */
  var GENERIC_GRIDS = [
    '.services-grid-8', '.featured-grid-4', '.departments-grid-6',
    '.benefits-grid-6', '.security-flow-wrap', '.process-steps-grid',
    '.stats-grid-4', '.blog-grid-3', '.contact-info-grid', '.faq-grid'
  ];

  /* ================================================================
     2b. EDITORIAL PANEL FACTORY — solid sheet + glowing gold spine
     ================================================================ */
  function attachEditorialPanel(host, mirrored) {
    if (host.querySelector('.cine-panel')) return;
    var panel = document.createElement('span');
    panel.className = 'cine-panel';
    panel.setAttribute('aria-hidden', 'true');
    host.appendChild(panel);
    if (mirrored) host.classList.add('dir-left');
  }

  /* ================================================================
     3. APPLY EFFECTS
     ================================================================ */
  function applyEffects() {
    Object.keys(EFFECTS).forEach(function (selector) {
      if (selector === '.footer') return;
      document.querySelectorAll(selector).forEach(function (el) {
        if (el.dataset.aaCineApplied) return;
        el.dataset.aaCineApplied = '1';
        try {
          EFFECTS[selector](el);
        } catch (err) {
          /* keep the page alive; record for diagnostics */
          (window.__aaEffectErrors = window.__aaEffectErrors || []).push(String(err));
        }
      });
    });

    /* ---- fallback: section titles outside choreographed sections
       (dashboards) still get the broadcast word-mask build ---- */
    document.querySelectorAll('.section-title').forEach(function (title) {
      if (title.hasAttribute('data-cine')) return;
      if (title.closest('[data-cine]')) return;
      title.setAttribute('data-cine', 'mask-words');
    });

    /* ---- split every masked title into word masks (idempotent) ---- */
    document.querySelectorAll('[data-cine="mask-words"]').forEach(splitWords);

    /* ---- footer ---- */
    document.querySelectorAll('.site-footer').forEach(function (footer) {
      if (footer.dataset.aaCineApplied) return;
      footer.dataset.aaCineApplied = '1';
      footer.setAttribute('data-cine', '');

      footer.querySelectorAll('.footer-grid > *').forEach(function (col, i) {
        col.setAttribute('data-cine-child', 'ledger');
        col.style.setProperty('--i', i);
      });

      var bottom = footer.querySelector('.footer-bottom');
      if (bottom) bottom.setAttribute('data-cine-child', '');
    });

    /* ---- legacy reveal classes: engine takes ownership ----
       Owned elements (or descendants of owned elements) lose the legacy
       classes so they never double-animate; the rest get a cinematic mask
       wipe so no page is left with the old fade behavior. */
    document.querySelectorAll(
      '.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-clip'
    ).forEach(function (el) {
      var owned = el.hasAttribute('data-cine') ||
                  el.hasAttribute('data-cine-child') ||
                  el.classList.contains('cine-owned') ||
                  el.closest('[data-cine], [data-cine-child]');

      if (owned) {
        el.classList.remove('reveal', 'reveal-left', 'reveal-right', 'reveal-scale', 'reveal-clip');
        return;
      }

      el.classList.add('cine-owned');
      if (!el.style.getPropertyValue('--d')) {
        var delayClass = Array.prototype.find.call(el.classList, function (c) {
          return /^delay-\d+$/.test(c);
        });
        if (delayClass) {
          el.style.setProperty('--d', parseInt(delayClass.split('-')[1], 10) * 120);
        }
      }
    });

    /* ---- any known grid not already choreographed gets ledger children ----
       Grids living inside an already-choreographed section are skipped so
       the section's own grammar stays in charge. */
    GENERIC_GRIDS.forEach(function (sel) {
      document.querySelectorAll(sel).forEach(function (grid) {
        if (grid.dataset.aaCineApplied) return;
        if (grid.closest('[data-cine]')) return;
        grid.dataset.aaCineApplied = '1';
        grid.setAttribute('data-cine', '');
        Array.prototype.forEach.call(grid.children, function (child, i) {
          if (!child.hasAttribute('data-cine-child')) {
            child.setAttribute('data-cine-child', 'ledger');
            child.style.setProperty('--i', i);
          }
        });
      });
    });
  }

  /* ================================================================
     3b. BAR CHARTS — height var caching + re-trigger on stage/unstage
     ================================================================ */
  function wireBarCharts() {
    document.querySelectorAll('[data-cine-bars]').forEach(function (chart) {
      chart.querySelectorAll('.chart-bar').forEach(function (bar, i) {
        if (bar.style.getPropertyValue('--h')) return;
        var h = bar.style.height || '50%';
        bar.style.height = '0%';
        bar.style.setProperty('--h', h);
        bar.style.setProperty('--i', i);
      });
      chart.classList.add('is-in');
    });

    /* Re-run the growth whenever a hidden dashboard pane is switched in */
    document.querySelectorAll('.dashboard-pane').forEach(function (pane) {
      if (pane.dataset.aaPaneWired) return;
      pane.dataset.aaPaneWired = '1';
      var observer = new MutationObserver(function () {
        var shown = pane.offsetWidth > 0 && pane.offsetHeight > 0;
        if (shown) {
          var bars = pane.querySelectorAll('[data-cine-bars]');
          bars.forEach(function (chart) {
            chart.classList.remove('is-in');
            void chart.offsetWidth; /* flush */
            chart.classList.add('is-in');
          });
        }
        scheduleCheck(); /* re-evaluate the newly visible subtree */
      });
      observer.observe(pane, { attributes: true, attributeFilter: ['style', 'class'] });
    });
  }

  /* ================================================================
     4. STAGE MANAGER — is-in on enter, off on exit (replays forever)
        Primary: IntersectionObserver. Synchronizer: manual viewport
        check on scroll/resize/load so the replay guarantee never
        depends on a single mechanism.
     ================================================================ */
  var tracked = [];
  var checkQueued = false;

  function isOnStage(el) {
    var rect = el.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return false; /* hidden pane */
    var vh = window.innerHeight || document.documentElement.clientHeight;
    var bottomBound = vh * 0.94;
    var visible = Math.min(rect.bottom, bottomBound) - Math.max(rect.top, 0);
    return visible > rect.height * 0.12;
  }

  function runCheck() {
    checkQueued = false;
    for (var i = 0; i < tracked.length; i++) {
      var el = tracked[i];
      if (isOnStage(el)) {
        el.classList.add('is-in');
      } else {
        el.classList.remove('is-in');
      }
    }
  }

  function scheduleCheck() {
    if (checkQueued) return;
    checkQueued = true;
    /* setTimeout (not rAF): fires reliably even in environments where
       no frames are composited (headless captures, background tabs) */
    setTimeout(function () {
      checkQueued = false;
      runCheck();
    }, 90);
  }

  function initStageManager() {
    var targets = document.querySelectorAll(
      '[data-cine], [data-cine-child], .cine-owned, .site-footer'
    );

    if (!targets.length) return;

    if (reduceMotion) {
      targets.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    tracked = Array.prototype.slice.call(targets);

    /* Primary mechanism: IntersectionObserver */
    if (hasIO) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
          } else {
            entry.target.classList.remove('is-in');
          }
        });
      }, {
        threshold: 0.12,
        rootMargin: '0px 0px -6% 0px'
      });
      tracked.forEach(function (el) { observer.observe(el); });
    }

    /* Synchronizer: deterministic geometry check — guarantees staging
       and re-staging even if IO callbacks are delayed or unavailable */
    window.addEventListener('scroll', scheduleCheck, { passive: true });
    window.addEventListener('resize', scheduleCheck, { passive: true });
    setInterval(scheduleCheck, 600);
    runCheck();
  }

  /* ================================================================
     5. ATMOSPHERICS
     ================================================================ */
  function initProgress() {
    if (reduceMotion) return;
    var bar = document.createElement('div');
    bar.className = 'aa-progress';
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
        requestAnimationFrame(update);
      }
    }, { passive: true });
    update();
  }

  function spawnMotes(host, count, goldRatio) {
    if (reduceMotion || host.dataset.aaMotes === 'done') return;
    host.dataset.aaMotes = 'done';

    var field = document.createElement('div');
    field.className = 'aa-motes';
    field.setAttribute('aria-hidden', 'true');

    for (var i = 0; i < count; i++) {
      var mote = document.createElement('span');
      mote.className = 'aa-mote' + (Math.random() < goldRatio ? ' aa-gold' : '');
      mote.style.left = (Math.random() * 100) + '%';
      mote.style.setProperty('--m-dur', (9 + Math.random() * 9).toFixed(1) + 's');
      mote.style.setProperty('--m-delay', (-Math.random() * 14).toFixed(1) + 's');
      mote.style.setProperty('--m-sway', ((Math.random() * 90) - 45).toFixed(0) + 'px');
      field.appendChild(mote);
    }
    host.appendChild(field);
  }

  /* ================================================================
     6. BOOT
     ================================================================ */
  function boot() {
    /* Fault-isolated boot: a failure in one step must never prevent
       the stage manager from running (content must always appear). */
    var steps = [
      applyEffects,
      function () {
        var hero = document.querySelector('.hero, .page-hero');
        if (hero) spawnMotes(hero, 14, 0.4);
        document.querySelectorAll('.site-footer').forEach(function (f) {
          spawnMotes(f, 10, 0.8);
        });
      },
      initProgress,
      initStageManager,
      wireBarCharts
    ];

    steps.forEach(function (step) {
      try {
        step();
      } catch (err) {
        /* last-resort: never leave content hidden */
        document.querySelectorAll('[data-cine], [data-cine-child], .cine-owned')
          .forEach(function (el) { el.classList.add('is-in'); });
        (window.__aaBootErrors = window.__aaBootErrors || []).push(String(err));
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
