/**
 * main.js — Brittany Chiang-inspired portfolio
 * Vanilla JS · No frameworks · Production-ready
 */
(function () {
  'use strict';

  /* ------------------------------------------------------------------ */
  /*  Utility helpers                                                    */
  /* ------------------------------------------------------------------ */

  /**
   * Returns true when the user has NOT requested reduced motion.
   */
  function motionAllowed() {
    return !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /**
   * Simple non-empty string validation.
   * @param {string} value
   * @returns {boolean}
   */
  function validateNotEmpty(value) {
    return typeof value === 'string' && value.trim().length > 0;
  }

  /**
   * Basic email validation — must contain "@" and the domain part must
   * include at least one dot.
   * @param {string} value
   * @returns {boolean}
   */
  function validateEmail(value) {
    if (typeof value !== 'string') return false;
    var trimmed = value.trim();
    var atIndex = trimmed.indexOf('@');
    if (atIndex < 1) return false; // must have something before @
    var domain = trimmed.slice(atIndex + 1);
    // domain must have at least one dot and something after it
    var dotIndex = domain.indexOf('.');
    return dotIndex > 0 && dotIndex < domain.length - 1;
  }

  // Expose validators for testing
  window._validateEmail = validateEmail;
  window._validateNotEmpty = validateNotEmpty;

  /* ------------------------------------------------------------------ */
  /*  1. Mouse Spotlight Effect                                          */
  /* ------------------------------------------------------------------ */

  function initSpotlight() {
    var wrapper = document.querySelector('.spotlight-wrapper');
    var overlay = document.querySelector('.spotlight-overlay');
    if (!wrapper || !overlay) return;

    var lgMin = 1024; // desktop breakpoint

    wrapper.addEventListener('mousemove', function (e) {
      if (window.innerWidth < lgMin) return;

      var rect = wrapper.getBoundingClientRect();
      var x = e.clientX - rect.left;
      var y = e.clientY - rect.top;

      overlay.style.setProperty('--mouse-x', x + 'px');
      overlay.style.setProperty('--mouse-y', y + 'px');
    });
  }

  /* ------------------------------------------------------------------ */
  /*  2. Scroll-based Navigation Highlighting                            */
  /* ------------------------------------------------------------------ */

  function initNavHighlighting() {
    if (typeof IntersectionObserver === 'undefined') return;

    var navLinks = document.querySelectorAll('.sidebar-nav a[href^="#"]');
    if (!navLinks.length) return;

    // Build a map from section id → link element
    var linkMap = {};
    navLinks.forEach(function (link) {
      var id = link.getAttribute('href').replace('#', '');
      if (id) linkMap[id] = link;
    });

    var sectionIds = Object.keys(linkMap);
    var sections = sectionIds
      .map(function (id) {
        return document.getElementById(id);
      })
      .filter(Boolean);

    if (!sections.length) return;

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          var id = entry.target.id;
          var link = linkMap[id];
          if (!link) return;

          if (entry.isIntersecting) {
            // Remove active from all links first
            navLinks.forEach(function (l) {
              l.classList.remove('active');
            });
            link.classList.add('active');
          }
        });
      },
      {
        rootMargin: '-20% 0px -70% 0px',
      }
    );

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  /* ------------------------------------------------------------------ */
  /*  3. Smooth Scroll                                                   */
  /* ------------------------------------------------------------------ */

  function initSmoothScroll() {
    var anchors = document.querySelectorAll('a[href^="#"]');
    if (!anchors.length) return;

    anchors.forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        var href = anchor.getAttribute('href');
        if (!href || href === '#') return;

        var target = document.querySelector(href);
        if (!target) return;

        e.preventDefault();

        var behavior = motionAllowed() ? 'smooth' : 'instant';
        target.scrollIntoView({ behavior: behavior });
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /*  4. Scroll Reveal Animation                                         */
  /* ------------------------------------------------------------------ */

  function initScrollReveal() {
    if (typeof IntersectionObserver === 'undefined') return;

    var items = document.querySelectorAll('.scroll-reveal');
    if (!items.length) return;

    // If reduced motion, reveal everything immediately
    if (!motionAllowed()) {
      items.forEach(function (el) {
        el.classList.add('revealed');
      });
      return;
    }

    // Group items by their parent section for stagger calculation
    var sectionMap = new Map();

    items.forEach(function (el) {
      // Find the closest section (or parent with an ID, or direct parent)
      var section = el.closest('section') || el.parentElement;
      if (!sectionMap.has(section)) {
        sectionMap.set(section, []);
      }
      sectionMap.get(section).push(el);
    });

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;

          var el = entry.target;
          var section = el.closest('section') || el.parentElement;
          var siblings = sectionMap.get(section) || [el];
          var index = siblings.indexOf(el);
          if (index < 0) index = 0;

          el.style.transitionDelay = index * 50 + 'ms';
          el.classList.add('revealed');
          observer.unobserve(el);
        });
      },
      {
        threshold: 0.1,
      }
    );

    items.forEach(function (el) {
      observer.observe(el);
    });
  }

  /* ------------------------------------------------------------------ */
  /*  5. Contact Form with Formspree                                     */
  /* ------------------------------------------------------------------ */

  function initContactForm() {
    var form = document.getElementById('contact-form');
    if (!form) return;

    var FORMSPREE_ENDPOINT = 'https://formspree.io/f/mkjoevqv';

    var nameInput = form.querySelector('[name="contact-name"]');
    var emailInput = form.querySelector('[name="contact-email"]');
    var messageInput = form.querySelector('[name="contact-message"]');
    var submitBtn = form.querySelector('button[type="submit"]');

    // Locate or create a status message container
    var statusEl = form.querySelector('.form-status');
    if (!statusEl) {
      statusEl = document.createElement('div');
      statusEl.className = 'form-status';
      statusEl.setAttribute('role', 'alert');
      statusEl.setAttribute('aria-live', 'polite');
      form.appendChild(statusEl);
    }

    /**
     * Show / clear a field-level error.
     * @param {HTMLElement} input
     * @param {string} message  — empty string to clear
     */
    function setFieldError(input, message) {
      if (!input) return;
      var wrapper = input.closest('.form-group') || input.parentElement;
      var errorSpan = wrapper ? wrapper.querySelector('.form-error') : null;

      if (message) {
        input.setAttribute('aria-invalid', 'true');
        if (errorSpan) errorSpan.textContent = message;
      } else {
        input.removeAttribute('aria-invalid');
        if (errorSpan) errorSpan.textContent = '';
      }
    }

    /**
     * Validate all fields. Returns true when everything is valid.
     */
    function validateForm() {
      var valid = true;

      if (!validateNotEmpty(nameInput ? nameInput.value : '')) {
        setFieldError(nameInput, 'Nama tidak boleh kosong.');
        valid = false;
      } else {
        setFieldError(nameInput, '');
      }

      if (!validateEmail(emailInput ? emailInput.value : '')) {
        setFieldError(emailInput, 'Masukkan alamat email yang valid.');
        valid = false;
      } else {
        setFieldError(emailInput, '');
      }

      if (!validateNotEmpty(messageInput ? messageInput.value : '')) {
        setFieldError(messageInput, 'Pesan tidak boleh kosong.');
        valid = false;
      } else {
        setFieldError(messageInput, '');
      }

      return valid;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      statusEl.textContent = '';
      statusEl.className = 'form-status';

      if (!validateForm()) return;

      // Disable button & show loading state
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.dataset.originalText = submitBtn.textContent;
        submitBtn.textContent = 'Mengirim...';
      }

      var payload = {
        name: nameInput ? nameInput.value.trim() : '',
        email: emailInput ? emailInput.value.trim() : '',
        message: messageInput ? messageInput.value.trim() : '',
      };

      fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      })
        .then(function (response) {
          if (!response.ok) {
            throw new Error('Server responded with ' + response.status);
          }
          return response.json();
        })
        .then(function () {
          // Success
          form.reset();
          statusEl.textContent = 'Pesan berhasil dikirim! Terima kasih.';
          statusEl.classList.add('form-status--success');
        })
        .catch(function () {
          statusEl.textContent =
            'Terjadi kesalahan saat mengirim pesan. Silakan coba lagi.';
          statusEl.classList.add('form-status--error');
        })
        .finally(function () {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = submitBtn.dataset.originalText || 'Kirim';
          }
        });
    });
  }

  /* ------------------------------------------------------------------ */
  /*  6. Fade-in on Load                                                 */
  /* ------------------------------------------------------------------ */

  function initFadeIn() {
    var wrapper =
      document.querySelector('.spotlight-wrapper') ||
      document.querySelector('.layout-wrapper');
    if (!wrapper) return;

    // Short delay so the browser has painted the initial state (opacity: 0)
    setTimeout(function () {
      wrapper.style.opacity = '1';
    }, 100);
  }

  /* ------------------------------------------------------------------ */
  /*  Bootstrap everything on DOMContentLoaded                           */
  /* ------------------------------------------------------------------ */

  document.addEventListener('DOMContentLoaded', function () {
    initFadeIn();
    initSpotlight();
    initNavHighlighting();
    initSmoothScroll();
    initScrollReveal();
    initContactForm();
  });
})();