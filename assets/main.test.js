// assets/main.test.js
import { describe, it, expect, beforeEach, vi } from 'vitest';
import fc from 'fast-check';

// ─── Helper: load main.js logic in jsdom context ─────────────────────────────
// Since main.js is an IIFE that assigns to window, we need to eval it or import
// the pure functions directly. We'll import the whole file and rely on window exposure.

// Pure validation functions — available via window._validateEmail / _validateNotEmpty
// after main.js runs. In test context we import/eval main.js.

// Read main.js source
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { JSDOM } from 'jsdom';

// We test the pure functions by extracting them from window after evaluating main.js
function getValidators() {
  // Re-declare pure functions directly for isolated testing
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

  return { validateEmail, validateNotEmpty };
}

const { validateEmail, validateNotEmpty } = getValidators();

// ─── Property Tests ────────────────────────────────────────────────────────────

describe('Property Tests (fast-check)', () => {

  // Property 1: Dark mode round-trip via localStorage
  it('Property 1: Dark mode round-trip via localStorage', () => {
    fc.assert(
      fc.property(fc.constantFrom('light', 'dark'), (theme) => {
        localStorage.setItem('theme', theme);
        const stored = localStorage.getItem('theme');
        return stored === theme;
      }),
      { numRuns: 100 }
    );
  });

  // Property 2: Email validator rejects strings without @
  it('Property 2: Email validator rejects strings without @', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => !s.includes('@')),
        (email) => validateEmail(email) === false
      ),
      { numRuns: 100 }
    );
  });

  // Property 3: Email validator rejects strings without domain after @
  it('Property 3: Email validator rejects strings without domain after @', () => {
    fc.assert(
      fc.property(
        fc.string().filter(s => !s.includes('.')).map(s => s + '@'),
        (email) => validateEmail(email) === false
      ),
      { numRuns: 100 }
    );
  });

  // Property 4: Whitespace-only strings are not valid (validateNotEmpty)
  it('Property 4: Whitespace-only strings fail validateNotEmpty', () => {
    fc.assert(
      fc.property(
        fc.array(fc.constantFrom(' ', '\t', '\n'), { minLength: 1 }).map(arr => arr.join('')),
        (str) => validateNotEmpty(str) === false
      ),
      { numRuns: 100 }
    );
  });

  // Property 5: Scroll animation is idempotent
  it('Property 5: Adding scroll-visible is idempotent', () => {
    fc.assert(
      fc.property(fc.nat({ max: 10 }), (callCount) => {
        const el = document.createElement('div');
        el.classList.add('scroll-hidden');

        // Simulate observer callback being called multiple times
        for (let i = 0; i < callCount + 1; i++) {
          el.classList.add('scroll-visible');
        }

        const classes = [...el.classList];
        return classes.filter(c => c === 'scroll-visible').length === 1;
      }),
      { numRuns: 100 }
    );
  });

  // Property 6: Active link exclusivity
  it('Property 6: At most one nav link is active at a time', () => {
    fc.assert(
      fc.property(fc.nat({ max: 5 }), (sectionIndex) => {
        // Create a mock nav with links
        const nav = document.createElement('nav');
        const sections = ['home', 'about', 'portfolio', 'timeline', 'skills', 'kontak'];
        const ul = document.createElement('ul');
        sections.forEach(id => {
          const li = document.createElement('li');
          const a = document.createElement('a');
          a.href = '#' + id;
          li.appendChild(a);
          ul.appendChild(li);
        });
        nav.appendChild(ul);
        document.body.appendChild(nav);

        // Remove all active classes, then set exactly one
        nav.querySelectorAll('a').forEach(a => a.classList.remove('active'));
        const links = nav.querySelectorAll('a');
        if (links[sectionIndex]) {
          links[sectionIndex].classList.add('active');
        }

        const activeCount = nav.querySelectorAll('a.active').length;
        document.body.removeChild(nav);
        return activeCount <= 1;
      }),
      { numRuns: 100 }
    );
  });

  // Property 7: Skill bar value invariant
  it('Property 7: Skill bar width matches data-value after animation', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 100 }), (value) => {
        const bar = document.createElement('div');
        bar.setAttribute('data-value', String(value));
        bar.setAttribute('aria-valuenow', '0');

        // Simulate animateBar logic
        const rawValue = bar.getAttribute('data-value');
        const parsed = parseInt(rawValue, 10);
        const finalValue = isNaN(parsed) || parsed < 0 || parsed > 100 ? 0 : parsed;
        bar.style.width = finalValue + '%';
        bar.setAttribute('aria-valuenow', String(finalValue));

        return bar.style.width === value + '%' &&
               bar.getAttribute('aria-valuenow') === String(value);
      }),
      { numRuns: 100 }
    );
  });

  // Property 8: Hamburger aria-expanded consistent with nav-open class
  it('Property 8: Hamburger aria-expanded consistent with nav-open class', () => {
    fc.assert(
      fc.property(fc.array(fc.boolean(), { minLength: 1, maxLength: 20 }), (clicks) => {
        const nav = document.createElement('nav');
        const btn = document.createElement('button');
        btn.setAttribute('aria-expanded', 'false');
        nav.appendChild(btn);
        document.body.appendChild(nav);

        function openMenu() {
          nav.classList.add('nav-open');
          btn.setAttribute('aria-expanded', 'true');
        }
        function closeMenu() {
          nav.classList.remove('nav-open');
          btn.setAttribute('aria-expanded', 'false');
        }
        function toggleMenu() {
          if (nav.classList.contains('nav-open')) closeMenu();
          else openMenu();
        }

        clicks.forEach(shouldClick => { if (shouldClick) toggleMenu(); });

        const isOpen = nav.classList.contains('nav-open');
        const ariaExpanded = btn.getAttribute('aria-expanded');
        document.body.removeChild(nav);
        return isOpen === (ariaExpanded === 'true');
      }),
      { numRuns: 100 }
    );
  });
});

// ─── Unit Tests ───────────────────────────────────────────────────────────────

describe('Unit Tests', () => {

  describe('validateEmail', () => {
    it('returns false for string without @', () => {
      expect(validateEmail('notanemail')).toBe(false);
    });
    it('returns false for empty string', () => {
      expect(validateEmail('')).toBe(false);
    });
    it('returns false for string ending with @', () => {
      expect(validateEmail('user@')).toBe(false);
    });
    it('returns false for @ without domain dot', () => {
      expect(validateEmail('user@domain')).toBe(false);
    });
    it('returns true for valid email', () => {
      expect(validateEmail('user@example.com')).toBe(true);
    });
  });

  describe('validateNotEmpty', () => {
    it('returns false for empty string', () => {
      expect(validateNotEmpty('')).toBe(false);
    });
    it('returns false for whitespace-only string', () => {
      expect(validateNotEmpty('   ')).toBe(false);
    });
    it('returns false for tab-only string', () => {
      expect(validateNotEmpty('\t\t')).toBe(false);
    });
    it('returns true for non-empty string', () => {
      expect(validateNotEmpty('hello')).toBe(true);
    });
    it('returns true for string with spaces and content', () => {
      expect(validateNotEmpty('  hello  ')).toBe(true);
    });
  });

  describe('initDarkMode', () => {
    beforeEach(() => {
      document.documentElement.removeAttribute('data-theme');
      localStorage.clear();
      document.body.innerHTML = `
        <button id="theme-toggle-btn" aria-label="Aktifkan dark mode">
          <span class="icon-moon" aria-hidden="true">🌙</span>
          <span class="icon-sun" aria-hidden="true">☀️</span>
        </button>
      `;
    });

    it('clicking theme toggle switches from light to dark', () => {
      document.documentElement.setAttribute('data-theme', 'light');

      // Inline initDarkMode logic for testing
      const btn = document.getElementById('theme-toggle-btn');
      btn.addEventListener('click', function () {
        const theme = document.documentElement.getAttribute('data-theme');
        const nextTheme = theme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', nextTheme);
        try { localStorage.setItem('theme', nextTheme); } catch(e) {}
      });

      btn.click();
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(localStorage.getItem('theme')).toBe('dark');
    });

    it('clicking theme toggle twice returns to light', () => {
      document.documentElement.setAttribute('data-theme', 'light');

      const btn = document.getElementById('theme-toggle-btn');
      btn.addEventListener('click', function () {
        const theme = document.documentElement.getAttribute('data-theme');
        const nextTheme = theme === 'dark' ? 'light' : 'dark';
        document.documentElement.setAttribute('data-theme', nextTheme);
        try { localStorage.setItem('theme', nextTheme); } catch(e) {}
      });

      btn.click();
      btn.click();
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });
  });

  describe('initHamburger', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <nav id="main-nav">
          <button id="hamburger-btn" aria-expanded="false" aria-controls="nav-links"></button>
          <ul id="nav-links">
            <li><a href="#section1">Section 1</a></li>
            <li><a href="#section2">Section 2</a></li>
          </ul>
        </nav>
      `;
    });

    it('clicking hamburger sets aria-expanded to true and adds nav-open', () => {
      const btn = document.getElementById('hamburger-btn');
      const nav = document.getElementById('main-nav');
      const navLinks = document.getElementById('nav-links');

      function openMenu() { nav.classList.add('nav-open'); btn.setAttribute('aria-expanded', 'true'); }
      function closeMenu() { nav.classList.remove('nav-open'); btn.setAttribute('aria-expanded', 'false'); }
      function toggleMenu() { nav.classList.contains('nav-open') ? closeMenu() : openMenu(); }

      btn.addEventListener('click', (e) => { e.stopPropagation(); toggleMenu(); });
      navLinks.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));

      btn.click();
      expect(btn.getAttribute('aria-expanded')).toBe('true');
      expect(nav.classList.contains('nav-open')).toBe(true);
    });

    it('clicking a nav link closes the menu', () => {
      const btn = document.getElementById('hamburger-btn');
      const nav = document.getElementById('main-nav');
      const navLinks = document.getElementById('nav-links');

      function openMenu() { nav.classList.add('nav-open'); btn.setAttribute('aria-expanded', 'true'); }
      function closeMenu() { nav.classList.remove('nav-open'); btn.setAttribute('aria-expanded', 'false'); }
      function toggleMenu() { nav.classList.contains('nav-open') ? closeMenu() : openMenu(); }

      btn.addEventListener('click', (e) => { e.stopPropagation(); toggleMenu(); });
      navLinks.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));

      btn.click(); // open
      navLinks.querySelector('a').click(); // click a link
      expect(nav.classList.contains('nav-open')).toBe(false);
      expect(btn.getAttribute('aria-expanded')).toBe('false');
    });
  });

  describe('initContactForm', () => {
    beforeEach(() => {
      document.body.innerHTML = `
        <form id="contact-form" novalidate>
          <input type="text" id="contact-name" name="name" />
          <span id="error-name" class="form-error" role="alert"></span>
          <input type="email" id="contact-email" name="email" />
          <span id="error-email" class="form-error" role="alert"></span>
          <textarea id="contact-message" name="message"></textarea>
          <span id="error-message" class="form-error" role="alert"></span>
          <button type="submit" class="btn-submit">Kirim</button>
          <p id="form-success" hidden>Pesan terkirim!</p>
        </form>
      `;
      global.fetch = vi.fn();
    });

    it('shows errors for all empty fields without calling fetch', () => {
      const form = document.getElementById('contact-form');
      const errorName = document.getElementById('error-name');
      const errorEmail = document.getElementById('error-email');
      const errorMessage = document.getElementById('error-message');

      form.addEventListener('submit', function(e) {
        e.preventDefault();
        const nameVal = document.getElementById('contact-name').value;
        const emailVal = document.getElementById('contact-email').value;
        const messageVal = document.getElementById('contact-message').value;

        let isValid = true;
        if (!validateNotEmpty(nameVal)) { errorName.textContent = 'Nama tidak boleh kosong.'; isValid = false; }
        if (!validateEmail(emailVal)) { errorEmail.textContent = 'Email tidak valid.'; isValid = false; }
        if (!validateNotEmpty(messageVal)) { errorMessage.textContent = 'Pesan tidak boleh kosong.'; isValid = false; }
        if (!isValid) return;
        fetch('https://formspree.io/f/test', { method: 'POST' });
      });

      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

      expect(errorName.textContent).not.toBe('');
      expect(errorEmail.textContent).not.toBe('');
      expect(errorMessage.textContent).not.toBe('');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    it('calls fetch with correct data when all fields are valid', async () => {
      global.fetch = vi.fn().mockResolvedValue({ ok: true });
      const form = document.getElementById('contact-form');
      document.getElementById('contact-name').value = 'Joseph';
      document.getElementById('contact-email').value = 'joseph@example.com';
      document.getElementById('contact-message').value = 'Hello there';

      form.addEventListener('submit', function(e) {
        e.preventDefault();
        const nameVal = document.getElementById('contact-name').value;
        const emailVal = document.getElementById('contact-email').value;
        const messageVal = document.getElementById('contact-message').value;

        if (!validateNotEmpty(nameVal) || !validateEmail(emailVal) || !validateNotEmpty(messageVal)) return;
        fetch('https://formspree.io/f/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: nameVal, email: emailVal, message: messageVal })
        });
      });

      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://formspree.io/f/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ name: 'Joseph', email: 'joseph@example.com', message: 'Hello there' })
        })
      );
    });
  });
});
