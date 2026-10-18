// assets/main.js
(function () {
  'use strict';

  function validateEmail(email) {
    if (typeof email !== 'string') return false;
    var atIndex = email.indexOf('@');
    if (atIndex < 0) return false;
    var domain = email.slice(atIndex + 1);
    return domain.indexOf('.') >= 0;
  }

  function validateNotEmpty(str) {
    if (typeof str !== 'string') return false;
    return str.trim() !== '';
  }

  function initDarkMode() {
    var btn = document.getElementById('theme-toggle-btn');
    if (!btn) return;

    function updateToggleLabel(theme) {
      if (theme === 'dark') {
        btn.setAttribute('aria-label', 'Aktifkan light mode');
      } else {
        btn.setAttribute('aria-label', 'Aktifkan dark mode');
      }
    }

    var currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    updateToggleLabel(currentTheme);

    btn.addEventListener('click', function () {
      var theme = document.documentElement.getAttribute('data-theme');
      var nextTheme = theme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', nextTheme);
      try {
        localStorage.setItem('theme', nextTheme);
      } catch (e) {
        // SecurityError in private browsing
      }
      updateToggleLabel(nextTheme);
    });
  }

  function initNavbar() {
    var navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
    if (!navLinks.length) return;

    var sectionIds = [];
    navLinks.forEach(function (link) {
      var id = link.getAttribute('href').slice(1);
      if (id) sectionIds.push(id);
    });

    var sections = sectionIds
      .map(function (id) { return document.getElementById(id); })
      .filter(Boolean);

    if (!sections.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var id = entry.target.id;
          navLinks.forEach(function (link) {
            if (link.getAttribute('href') === '#' + id) {
              link.classList.add('active');
            } else {
              link.classList.remove('active');
            }
          });
        }
      });
    }, {
      rootMargin: '-40% 0px -55% 0px'
    });

    sections.forEach(function (section) {
      observer.observe(section);
    });
  }

  function initHamburger() {
    var btn = document.getElementById('hamburger-btn');
    var nav = document.getElementById('main-nav');
    var navLinks = document.getElementById('nav-links');
    if (!btn || !nav || !navLinks) return;

    function openMenu() {
      nav.classList.add('nav-open');
      btn.setAttribute('aria-expanded', 'true');
    }

    function closeMenu() {
      nav.classList.remove('nav-open');
      btn.setAttribute('aria-expanded', 'false');
    }

    function toggleMenu() {
      if (nav.classList.contains('nav-open')) {
        closeMenu();
      } else {
        openMenu();
      }
    }

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      toggleMenu();
    });

    navLinks.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        closeMenu();
      });
    });

    document.addEventListener('click', function (e) {
      if (nav.classList.contains('nav-open') && !nav.contains(e.target)) {
        closeMenu();
      }
    });
  }

  function initSmoothScroll() {
    var nav = document.getElementById('main-nav');

    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
      anchor.addEventListener('click', function (e) {
        var targetId = anchor.getAttribute('href').slice(1);
        if (!targetId) return;
        var target = document.getElementById(targetId);
        if (!target) return;

        e.preventDefault();

        var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var navHeight = nav ? nav.getBoundingClientRect().height : 0;
        var targetTop = target.getBoundingClientRect().top + window.pageYOffset - navHeight;

        window.scrollTo({
          top: targetTop,
          behavior: prefersReduced ? 'instant' : 'smooth'
        });
      });
    });
  }

  function initScrollAnimation() {
    var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      document.querySelectorAll('.scroll-hidden').forEach(function (el) {
        el.classList.remove('scroll-hidden');
        el.classList.add('scroll-visible');
      });
      return;
    }

    var targets = document.querySelectorAll('.scroll-hidden');

    if (!('IntersectionObserver' in window)) {
      targets.forEach(function (el) {
        el.classList.remove('scroll-hidden');
        el.classList.add('scroll-visible');
      });
      return;
    }

    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('scroll-visible');
          obs.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15
    });

    targets.forEach(function (el) {
      observer.observe(el);
    });
  }

  function initSkillBars() {
    var skillItems = document.querySelectorAll('.skill-item');
    if (!skillItems.length) return;

    function animateBar(item) {
      var bar = item.querySelector('.skill-bar');
      if (!bar) return;
      var rawValue = bar.getAttribute('data-value');
      var value = parseInt(rawValue, 10);
      if (isNaN(value) || value < 0 || value > 100) {
        value = 0;
      }
      bar.style.width = value + '%';
      bar.setAttribute('aria-valuenow', String(value));
    }

    var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReduced) {
      skillItems.forEach(function (item) {
        var bar = item.querySelector('.skill-bar');
        if (bar) bar.style.transition = 'none';
        animateBar(item);
      });
      return;
    }

    if (!('IntersectionObserver' in window)) {
      skillItems.forEach(function (item) { animateBar(item); });
      return;
    }

    var observer = new IntersectionObserver(function (entries, obs) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          animateBar(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.3
    });

    skillItems.forEach(function (item) {
      observer.observe(item);
    });
  }

  function initContactForm() {
    var form = document.getElementById('contact-form');
    if (!form) return;

    var nameInput    = document.getElementById('contact-name');
    var emailInput   = document.getElementById('contact-email');
    var messageInput = document.getElementById('contact-message');
    var errorName    = document.getElementById('error-name');
    var errorEmail   = document.getElementById('error-email');
    var errorMessage = document.getElementById('error-message');
    var successMsg   = document.getElementById('form-success');

    var FORMSPREE_ENDPOINT = 'https://formspree.io/f/mkjoevqv';

    function clearErrors() {
      [nameInput, emailInput, messageInput].forEach(function (input) {
        input.removeAttribute('aria-invalid');
      });
      [errorName, errorEmail, errorMessage].forEach(function (span) {
        if (span) span.textContent = '';
      });
    }

    function showError(input, span, message) {
      input.setAttribute('aria-invalid', 'true');
      if (span) span.textContent = message;
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearErrors();
      if (successMsg) successMsg.setAttribute('hidden', '');

      var nameVal    = nameInput    ? nameInput.value    : '';
      var emailVal   = emailInput   ? emailInput.value   : '';
      var messageVal = messageInput ? messageInput.value : '';

      var isValid = true;

      if (!validateNotEmpty(nameVal)) {
        showError(nameInput, errorName, 'Nama tidak boleh kosong.');
        isValid = false;
      }
      if (!validateEmail(emailVal)) {
        showError(emailInput, errorEmail, 'Masukkan alamat email yang valid.');
        isValid = false;
      }
      if (!validateNotEmpty(messageVal)) {
        showError(messageInput, errorMessage, 'Pesan tidak boleh kosong.');
        isValid = false;
      }

      if (!isValid) return;

      var submitBtn = form.querySelector('.btn-submit');
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Mengirim...';
      }

      fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify({ name: nameVal, email: emailVal, message: messageVal })
      })
      .then(function (response) {
        if (response.ok) {
          form.reset();
          clearErrors();
          if (successMsg) successMsg.removeAttribute('hidden');
        } else {
          response.json().catch(function () { return {}; }).then(function (data) {
            var msg = (data && data.errors && data.errors[0] && data.errors[0].message)
              ? data.errors[0].message
              : 'Pengiriman gagal (status ' + response.status + '). Coba beberapa saat lagi.';
            showError(emailInput, errorEmail, msg);
          });
        }
      })
      .catch(function () {
        showError(emailInput, errorEmail, 'Gagal terhubung ke server. Periksa koneksi internet kamu.');
      })
      .then(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Kirim Pesan';
        }
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    initDarkMode();
    initNavbar();
    initHamburger();
    initSmoothScroll();
    initScrollAnimation();
    initSkillBars();
    initContactForm();
  });

  // Expose for testing
  window._validateEmail = validateEmail;
  window._validateNotEmpty = validateNotEmpty;
})();
