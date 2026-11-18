/* Stack18 ecosystem pages (/partnerships /events /community /stack-school)
   Progressive enhancement only: every page is fully readable and usable without this file.
   Must load BEFORE /js/service-lead.js so its URL validation runs ahead of the shared form submit. */
(function () {
  'use strict';

  /* 1. Scroll reveal (opt-in via .eco-js on <html>, set by an inline script in <head>) */
  var rv = document.querySelectorAll('.eco-rv');
  if (rv.length) {
    if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      rv.forEach(function (el) { io.observe(el); });
    } else {
      rv.forEach(function (el) { el.classList.add('in'); });
    }
  }

  /* 2. Optional-URL validation for fields marked data-url (website, LinkedIn).
        Accepts "stack18.com" or "https://stack18.com" and normalises to https://. */
  document.querySelectorAll('form[data-svc-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      var bad = false;
      form.querySelectorAll('[data-url]').forEach(function (f) {
        f.classList.remove('is-bad');
        var v = f.value.trim();
        if (!v) return;
        if (!/^https?:\/\//i.test(v)) v = 'https://' + v;
        var ok = false;
        try { var u = new URL(v); ok = /\.[a-z]{2,}$/i.test(u.hostname); } catch (err) { ok = false; }
        if (ok) { f.value = v; } else { f.classList.add('is-bad'); bad = true; }
      });
      if (bad) {
        e.preventDefault(); e.stopImmediatePropagation();
        var st = form.querySelector('.vx-st');
        if (st) st.textContent = 'Please enter a valid web address, for example stack18.com.';
        var first = form.querySelector('.is-bad'); if (first) first.focus();
      }
    }, true);
  });

  /* 3. Links that pre-select a form option: <a href="#enquiry" data-select="partnership_type" data-value="Technology Partner"> */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[data-select]');
    if (!a) return;
    var target = document.querySelector(a.getAttribute('href'));
    var form = target && (target.matches('form') ? target : target.querySelector('form'));
    if (!form) return;
    var sel = form.querySelector('[name="' + a.getAttribute('data-select') + '"]');
    if (sel) {
      var want = a.getAttribute('data-value');
      Array.prototype.forEach.call(sel.options, function (o) { if (o.text === want || o.value === want) sel.value = o.value; });
      setTimeout(function () { try { sel.focus({ preventScroll: true }); } catch (err) { sel.focus(); } }, 600);
    }
  });

  /* 4. Past-events archive filter by format (works on real entries as well as the placeholders) */
  document.querySelectorAll('[data-filter-root]').forEach(function (root) {
    var btns = root.querySelectorAll('[data-filter]');
    var items = root.querySelectorAll('[data-format]');
    var empty = root.querySelector('.eco-empty');
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        var f = b.getAttribute('data-filter'), n = 0;
        btns.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        items.forEach(function (it) {
          var show = f === 'all' || it.getAttribute('data-format') === f;
          it.hidden = !show; if (show) n++;
        });
        if (empty) empty.classList.toggle('is-on', n === 0);
      });
    });
  });
})();
