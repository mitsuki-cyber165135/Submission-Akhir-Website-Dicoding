/* tampilan.js — lets each visitor pick a look (Klasik / Modern / Minimal) and remembers it.
   Add <script src="/assets/tampilan.js"></script> inside <head> of every version. */
(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Give each selected layout a brief, unobtrusive entrance on a fresh load. */
  if (!prefersReducedMotion) {
    var entranceStyle = document.createElement('style');
    entranceStyle.textContent =
      'html.page-enter body{transition:opacity 520ms cubic-bezier(.16,1,.3,1),transform 520ms cubic-bezier(.16,1,.3,1)}' +
      'html.page-enter-pending body{opacity:0;transform:translateY(10px)}';
    document.head.appendChild(entranceStyle);
    document.documentElement.classList.add('page-enter');
    document.documentElement.classList.add('page-enter-pending');
  }

  var KEY = 'tampilan';
  var VIEWS = [
    { id: 'klasik',  label: 'Klasik',  url: '/klasik/' },
    { id: 'modern',  label: 'Modern',  url: '/' },
    { id: 'minimal', label: 'Minimal', url: '/portfolio.html' }
  ];

  var path = location.pathname.replace(/index\.html$/, '');
  var current = path.indexOf('/klasik') === 0 ? 'klasik'
              : path.indexOf('/portfolio') === 0 ? 'minimal'
              : 'modern';

  function getPref() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function setPref(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }

  /* Returning visitor who chose another look: send them there, from the home page only */
  if (path === '/') {
    var pref = getPref();
    VIEWS.forEach(function (v) {
      if (v.id === pref && v.id !== current) location.replace(v.url);
    });
  }

  function build() {
    var css = document.createElement('style');
    css.textContent =
      '#pilih-tampilan{position:fixed;right:16px;bottom:16px;z-index:9999;display:flex;align-items:center;gap:4px;padding:5px 6px 5px 14px;border:1px solid #334155;border-radius:999px;background:#0f172a;box-shadow:0 4px 14px rgba(0,0,0,.35);font:500 13px/1 system-ui,-apple-system,"Segoe UI",sans-serif;color:#94a3b8}' +
      '#pilih-tampilan a{padding:7px 12px;border-radius:999px;color:#e2e8f0;text-decoration:none;font-weight:500}' +
      '#pilih-tampilan a:hover{color:#5eead4}' +
      '#pilih-tampilan a[aria-current]{background:rgba(94,234,212,.15);color:#5eead4}' +
      '#pilih-tampilan a:focus-visible{outline:2px solid #5eead4;outline-offset:2px}' +
      '@media print{#pilih-tampilan{display:none}}';
    document.head.appendChild(css);

    var box = document.createElement('div');
    box.id = 'pilih-tampilan';
    box.setAttribute('role', 'navigation');
    box.setAttribute('aria-label', 'Pilih tampilan website');

    var label = document.createElement('span');
    label.textContent = 'Tampilan';
    box.appendChild(label);

    VIEWS.forEach(function (v) {
      var a = document.createElement('a');
      a.href = v.url;
      a.textContent = v.label;
      if (v.id === current) a.setAttribute('aria-current', 'page');
      a.addEventListener('click', function () { setPref(v.id); });
      box.appendChild(a);
    });

    document.body.appendChild(box);

    if (!prefersReducedMotion) {
      requestAnimationFrame(function () {
        requestAnimationFrame(function () {
          document.documentElement.classList.remove('page-enter-pending');
          window.setTimeout(function () {
            document.documentElement.classList.remove('page-enter');
          }, 550);
        });
      });
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build);
  else build();
})();
