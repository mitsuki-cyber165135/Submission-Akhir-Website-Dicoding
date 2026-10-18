/* main.js — spotlight, active nav link, contact form. Selectors match index.html. */
(function () {
  'use strict';

  /* 1. Mouse spotlight: updates the CSS variables used by .spotlight */
  var spot = document.querySelector('.spotlight');
  if (spot) {
    addEventListener('pointermove', function (e) {
      spot.style.setProperty('--mouse-x', e.clientX + 'px');
      spot.style.setProperty('--mouse-y', e.clientY + 'px');
    });
  }

  /* 2. Highlight the sidebar link of the section currently being read */
  var links = [].slice.call(document.querySelectorAll('.sidebar__nav .nav-link'));
  var sections = links.map(function (l) {
    return document.querySelector(l.getAttribute('href'));
  });
  function updateNav() {
    var line = innerHeight * 0.35, current = 0;
    sections.forEach(function (s, i) {
      if (s && s.getBoundingClientRect().top <= line) current = i;
    });
    links.forEach(function (l, i) { l.classList.toggle('active', i === current); });
  }
  if (links.length) {
    addEventListener('scroll', updateNav, { passive: true });
    addEventListener('resize', updateNav);
    updateNav();
  }

  /* 3. Contact form: send to Formspree without leaving the page */
  var form = document.querySelector('.contact-form');
  if (form) {
    var button = form.querySelector('.contact-form__button');
    var status = document.createElement('p');
    status.className = 'form-status';
    status.setAttribute('role', 'status');
    form.appendChild(status);

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var label = button.textContent;
      status.textContent = '';
      status.className = 'form-status';
      button.disabled = true;
      button.textContent = 'Mengirim...';

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      })
        .then(function (res) {
          if (!res.ok) throw new Error(res.status);
          form.reset();
          status.textContent = 'Pesan berhasil dikirim. Terima kasih!';
          status.classList.add('form-status--ok');
        })
        .catch(function () {
          status.textContent = 'Pesan gagal dikirim. Coba lagi, atau hubungi lewat LinkedIn.';
          status.classList.add('form-status--err');
        })
        .then(function () {
          button.disabled = false;
          button.textContent = label;
        });
    });
  }
})();
