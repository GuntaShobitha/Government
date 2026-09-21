/**
 * STACKLY Government Services — Main Application Engine
 * Pure Vanilla JavaScript (No libraries)
 */

(function () {
  'use strict';

  // Check reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 1. Sticky Navigation & Scroll Header
  function initHeader() {
    const header = document.querySelector('[data-header]');
    if (!header) return;

    function onScroll() {
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      if (scrollY > 40) {
        header.classList.add('is-scrolled');
      } else {
        header.classList.remove('is-scrolled');
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Mark current active link
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = header.querySelectorAll('.desktop-nav a, .mobile-nav a');
    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href && (href === currentPath || href === `./${currentPath}`)) {
        link.classList.add('is-active');
      }
    });
  }

  // 2. Mobile Navigation with Background Scroll Lock
  function initMobileMenu() {
    const menuToggle = document.querySelector('[data-menu-toggle]');
    const mobilePanel = document.querySelector('[data-mobile-panel]');
    const closeBtn = document.querySelector('[data-menu-close]');
    const overlay = document.querySelector('[data-menu-overlay]');
    const mobileLinks = document.querySelectorAll('[data-mobile-panel] a');

    if (!menuToggle || !mobilePanel) return;

    function openMenu() {
      mobilePanel.classList.add('is-open');
      if (overlay) overlay.classList.add('is-open');
      document.body.classList.add('menu-open');
      menuToggle.setAttribute('aria-expanded', 'true');
    }

    function closeMenu() {
      mobilePanel.classList.remove('is-open');
      if (overlay) overlay.classList.remove('is-open');
      document.body.classList.remove('menu-open');
      menuToggle.setAttribute('aria-expanded', 'false');
    }

    menuToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      if (mobilePanel.classList.contains('is-open')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    if (closeBtn) closeBtn.addEventListener('click', closeMenu);
    if (overlay) overlay.addEventListener('click', closeMenu);

    mobileLinks.forEach(link => {
      link.addEventListener('click', closeMenu);
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobilePanel.classList.contains('is-open')) {
        closeMenu();
      }
    });
  }

  // 3. Scroll Reveal Animations with IntersectionObserver
  function initScrollReveals() {
    if (prefersReducedMotion) {
      document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-clip').forEach(el => {
        el.classList.add('is-revealed');
      });
      return;
    }

    const revealElements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right, .reveal-scale, .reveal-clip');
    if (!revealElements.length) return;

    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-revealed');
          obs.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(el => observer.observe(el));
  }

  // 4. Hero Parallax & Floating 3D Interaction
  function initHeroParallax() {
    const hero = document.querySelector('.hero');
    const floatingElements = document.querySelectorAll('[data-float-depth]');
    if (!hero || !floatingElements.length || prefersReducedMotion) return;

    hero.addEventListener('mousemove', (e) => {
      const rect = hero.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;

      floatingElements.forEach(el => {
        const depth = parseFloat(el.getAttribute('data-float-depth') || '20');
        const moveX = x * depth;
        const moveY = y * depth;
        el.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
      });
    });

    hero.addEventListener('mouseleave', () => {
      floatingElements.forEach(el => {
        el.style.transform = 'translate3d(0, 0, 0)';
      });
    });
  }

  // 5. 3D Perspective Tilt on Service Cards
  function initCard3DTilt() {
    const tiltCards = document.querySelectorAll('[data-tilt]');
    if (!tiltCards.length || prefersReducedMotion) return;

    tiltCards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -7;
        const rotateY = ((x - centerX) / centerX) * 7;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-6px)`;
      });

      card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateY(0)';
      });
    });
  }

  // 6. Animated Statistics Counters
  function initStatCounters() {
    const counters = document.querySelectorAll('[data-counter]');
    if (!counters.length) return;

    const counterObserver = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseFloat(el.getAttribute('data-counter'));
          const suffix = el.getAttribute('data-suffix') || '';
          const isDecimal = String(target).includes('.');
          const duration = 2000;
          const startTime = performance.now();

          function updateNumber(now) {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out quad
            const ease = 1 - (1 - progress) * (1 - progress);
            const current = ease * target;

            if (isDecimal) {
              el.textContent = current.toFixed(1) + suffix;
            } else {
              el.textContent = Math.floor(current).toLocaleString() + suffix;
            }

            if (progress < 1) {
              requestAnimationFrame(updateNumber);
            } else {
              el.textContent = (isDecimal ? target.toFixed(1) : target.toLocaleString()) + suffix;
            }
          }

          requestAnimationFrame(updateNumber);
          obs.unobserve(el);
        }
      });
    }, { threshold: 0.25 });

    counters.forEach(c => counterObserver.observe(c));
  }

  // 7. Interactive Citizen Journey Process Indicator
  function initProcessJourney() {
    const steps = document.querySelectorAll('[data-process-step]');
    const progressLine = document.querySelector('[data-process-progress]');
    const detailPanels = document.querySelectorAll('[data-step-detail]');
    if (!steps.length) return;

    steps.forEach((step, idx) => {
      step.addEventListener('click', () => {
        steps.forEach(s => s.classList.remove('is-active'));
        step.classList.add('is-active');

        if (progressLine) {
          const percent = (idx / (steps.length - 1)) * 100;
          progressLine.style.width = `${percent}%`;
        }

        if (detailPanels.length) {
          detailPanels.forEach(p => p.classList.remove('is-active'));
          const targetPanel = document.querySelector(`[data-step-detail="${idx + 1}"]`);
          if (targetPanel) targetPanel.classList.add('is-active');
        }
      });
    });
  }

  // 8. Service Search and Live Category Filtering
  function initServiceSearch() {
    const searchInput = document.getElementById('service-search');
    const categoryButtons = document.querySelectorAll('[data-service-category]');
    const serviceCards = document.querySelectorAll('[data-service-card]');
    const resultCount = document.querySelector('[data-service-count]');

    if (!serviceCards.length) return;

    let activeCategory = 'all';

    function filterServices() {
      const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
      let matchCount = 0;

      serviceCards.forEach(card => {
        const title = card.querySelector('h3, strong, .service-title')?.textContent.toLowerCase() || '';
        const desc = card.querySelector('p, small, .service-desc')?.textContent.toLowerCase() || '';
        const cat = card.getAttribute('data-category') || '';

        const matchesQuery = !query || title.includes(query) || desc.includes(query);
        const matchesCategory = activeCategory === 'all' || cat.includes(activeCategory);

        if (matchesQuery && matchesCategory) {
          card.style.display = '';
          card.classList.remove('is-hidden');
          matchCount++;
        } else {
          card.style.display = 'none';
          card.classList.add('is-hidden');
        }
      });

      if (resultCount) {
        resultCount.textContent = `Showing ${matchCount} of ${serviceCards.length} government services`;
      }
    }

    if (searchInput) {
      searchInput.addEventListener('input', filterServices);
    }

    categoryButtons.forEach(btn => {
      btn.addEventListener('click', function () {
        categoryButtons.forEach(b => b.classList.remove('is-active'));
        this.classList.add('is-active');
        activeCategory = this.getAttribute('data-service-category');
        filterServices();
      });
    });
  }

  // 9. Testimonial Interactive Carousel
  function initTestimonialCarousel() {
    const track = document.querySelector('[data-carousel-track]');
    const cards = document.querySelectorAll('[data-carousel-card]');
    const prevBtn = document.querySelector('[data-carousel-prev]');
    const nextBtn = document.querySelector('[data-carousel-next]');
    const dotsContainer = document.querySelector('[data-carousel-dots]');

    if (!track || !cards.length) return;

    let currentIndex = 0;
    const total = cards.length;

    // Create pagination dots
    if (dotsContainer) {
      dotsContainer.innerHTML = '';
      for (let i = 0; i < total; i++) {
        const dot = document.createElement('button');
        dot.className = i === 0 ? 'carousel-dot is-active' : 'carousel-dot';
        dot.setAttribute('aria-label', `Go to testimonial slide ${i + 1}`);
        dot.addEventListener('click', () => goToSlide(i));
        dotsContainer.appendChild(dot);
      }
    }

    function updateCarousel() {
      cards.forEach((card, idx) => {
        card.classList.remove('is-active', 'is-prev', 'is-next');
        if (idx === currentIndex) {
          card.classList.add('is-active');
        } else if (idx === (currentIndex - 1 + total) % total) {
          card.classList.add('is-prev');
        } else if (idx === (currentIndex + 1) % total) {
          card.classList.add('is-next');
        }
      });

      // Update dots
      if (dotsContainer) {
        const dots = dotsContainer.querySelectorAll('.carousel-dot');
        dots.forEach((dot, idx) => {
          dot.classList.toggle('is-active', idx === currentIndex);
        });
      }
    }

    function goToSlide(index) {
      currentIndex = (index + total) % total;
      updateCarousel();
    }

    if (prevBtn) prevBtn.addEventListener('click', () => goToSlide(currentIndex - 1));
    if (nextBtn) nextBtn.addEventListener('click', () => goToSlide(currentIndex + 1));

    // Keyboard navigation
    track.parentElement.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') goToSlide(currentIndex - 1);
      if (e.key === 'ArrowRight') goToSlide(currentIndex + 1);
    });

    // Touch swipe support
    let touchStartX = 0;
    track.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });

    track.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].screenX;
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 40) {
        if (diff > 0) goToSlide(currentIndex + 1);
        else goToSlide(currentIndex - 1);
      }
    }, { passive: true });

    updateCarousel();
  }

  // 10. FAQ Accordion Manager
  function initFaqAccordions() {
    const accordions = document.querySelectorAll('[data-accordion]');
    accordions.forEach(acc => {
      const toggle = acc.querySelector('[data-accordion-toggle]');
      const content = acc.querySelector('[data-accordion-content]');
      const icon = acc.querySelector('.material-symbols-outlined');

      if (!toggle || !content) return;

      toggle.addEventListener('click', () => {
        const isOpen = acc.classList.contains('is-open');

        // Close peer accordions
        const parent = acc.closest('.faq-grid') || document;
        parent.querySelectorAll('[data-accordion]').forEach(peer => {
          if (peer !== acc) {
            peer.classList.remove('is-open');
            const peerContent = peer.querySelector('[data-accordion-content]');
            const peerIcon = peer.querySelector('.material-symbols-outlined');
            if (peerContent) peerContent.style.maxHeight = null;
            if (peerIcon) peerIcon.textContent = 'add';
          }
        });

        if (isOpen) {
          acc.classList.remove('is-open');
          content.style.maxHeight = null;
          if (icon) icon.textContent = 'add';
          toggle.setAttribute('aria-expanded', 'false');
        } else {
          acc.classList.add('is-open');
          content.style.maxHeight = content.scrollHeight + 'px';
          if (icon) icon.textContent = 'remove';
          toggle.setAttribute('aria-expanded', 'true');
        }
      });
    });
  }

  // 11. Contact Form JavaScript Validation
  function initContactForm() {
    const form = document.querySelector('[data-contact-form]');
    if (!form) return;

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      let isValid = true;
      const name = form.querySelector('[name="name"]');
      const email = form.querySelector('[name="email"]');
      const phone = form.querySelector('[name="phone"]');
      const department = form.querySelector('[name="department"]');
      const message = form.querySelector('[name="message"]');
      const feedbackEl = form.querySelector('[data-form-message]');

      function checkField(input, validCondition, errorMsg) {
        if (!input) return;
        const errSpan = input.closest('.form-group')?.querySelector('.field-error');
        if (!validCondition) {
          input.closest('.form-group')?.classList.add('has-error');
          if (errSpan) {
            errSpan.textContent = errorMsg;
            errSpan.style.display = 'block';
          }
          isValid = false;
        } else {
          input.closest('.form-group')?.classList.remove('has-error');
          if (errSpan) {
            errSpan.textContent = '';
            errSpan.style.display = 'none';
          }
        }
      }

      checkField(name, name && name.value.trim().length >= 2, 'Full name is required (min 2 characters)');
      checkField(email, email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()), 'Enter a valid email address');
      if (phone && phone.value.trim().length > 0) {
        checkField(phone, phone.value.replace(/\D/g, '').length >= 7, 'Enter a valid phone number');
      }
      checkField(department, department && department.value !== '', 'Please select a government department');
      checkField(message, message && message.value.trim().length >= 10, 'Message must be at least 10 characters');

      if (!isValid) return;

      if (feedbackEl) {
        feedbackEl.className = 'form-message form-message-success';
        feedbackEl.textContent = 'Thank you. Your inquiry has been routed to the appropriate department. Tracking reference: STK-REQ-' + Math.floor(100000 + Math.random() * 900000);
      }

      form.reset();
    });
  }

  // 12. Smooth Scroll & Back to Top
  function initBackToTop() {
    const backBtn = document.querySelector('[data-back-top]');
    if (!backBtn) return;

    window.addEventListener('scroll', () => {
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      if (scrollY > 400) {
        backBtn.classList.add('is-visible');
      } else {
        backBtn.classList.remove('is-visible');
      }
    }, { passive: true });

    backBtn.addEventListener('click', () => {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

  // Initialize all features on DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    initHeader();
    initMobileMenu();
    initScrollReveals();
    initHeroParallax();
    initCard3DTilt();
    initStatCounters();
    initProcessJourney();
    initServiceSearch();
    initTestimonialCarousel();
    initFaqAccordions();
    initContactForm();
    initBackToTop();
  });
})();


const searchInput = document.getElementById("service-search");
  const searchBtn = document.getElementById("search-btn");
  const searchError = document.getElementById("search-error");

  searchBtn.addEventListener("click", function () {
    const value = searchInput.value.trim();

    if (value.length === 0) {
      // Show error
      searchError.style.display = "block";
      searchInput.classList.add("error");
      return;
    }

    // Hide error
    searchError.style.display = "none";
    searchInput.classList.remove("error");

    // Redirect
    window.location.href = "404.html";
    value = "";
  });

  // Remove error while typing
  searchInput.addEventListener("input", function () {
    if (searchInput.value.trim().length > 0) {
      searchError.style.display = "none";
      searchInput.classList.remove("error");
    }
  });