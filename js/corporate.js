/* Stack18 corporate pages (/leadership /careers /locations /stack-gives /newsroom)
   Progressive enhancement only: every page is fully readable and usable without this file. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* 1. Local-time clocks on /locations. Uses the browser's own time-zone data, so DST is always right.
        The "Local time" rows are hidden in the HTML and only revealed once this has run. */
  var clocks = $$('[data-clock]');
  if (clocks.length && window.Intl && Intl.DateTimeFormat) {
    var tick = function () {
      clocks.forEach(function (el) {
        try {
          el.textContent = new Intl.DateTimeFormat('en-GB', {
            timeZone: el.getAttribute('data-clock'), hour: '2-digit', minute: '2-digit', hour12: false
          }).format(new Date());
          var row = el.closest('[data-clock-row]');
          if (row) row.hidden = false;
        } catch (err) { /* unknown zone: leave the row hidden */ }
      });
    };
    tick();
    setInterval(tick, 30000);
  }

  /* 2. Map <-> city cards <-> sections stay in sync (hover, focus and scroll position). */
  var map = $('[data-map]');
  if (map) {
    var links = $$('[data-city]', map).filter(function (a) { return a.tagName === 'A'; });
    var setActive = function (id) {
      if (id) map.setAttribute('data-active', id); else map.removeAttribute('data-active');
      links.forEach(function (a) { a.classList.toggle('is-on', !!id && a.getAttribute('data-city') === id); });
    };
    links.forEach(function (a) {
      var id = a.getAttribute('data-city');
      a.addEventListener('mouseenter', function () { setActive(id); });
      a.addEventListener('focus', function () { setActive(id); });
      a.addEventListener('mouseleave', function () { setActive(null); });
      a.addEventListener('blur', function () { setActive(null); });
    });
    // Moving focus to the section a visitor jumped to helps keyboard and screen-reader users
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[data-city]');
      if (!a) return;
      var t = document.getElementById(a.getAttribute('data-city'));
      if (!t) return;
      if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1');
      setTimeout(function () { try { t.focus({ preventScroll: true }); } catch (err) { t.focus(); } }, 650);
    });
  }

  /* 3. Generic chip filter (newsroom categories) */
  $$('[data-filter-root]').forEach(function (root) {
    var btns = $$('[data-filter]', root), items = $$('[data-cat]', root), empty = $('.co-empty-filter', root);
    btns.forEach(function (b) {
      b.addEventListener('click', function () {
        var f = b.getAttribute('data-filter'), n = 0;
        btns.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        items.forEach(function (it) {
          var show = f === 'all' || it.getAttribute('data-cat') === f;
          it.hidden = !show; if (show) n++;
        });
        if (empty) empty.hidden = n !== 0;
      });
    });
  });

  /* 4. Careers: filter vacancies by department and location (only rendered when there are 2+ roles) */
  var jf = $$('[data-job-filter]');
  if (jf.length) {
    var jobs = $$('.co-job'), count = $('.co-jobcount'), none = $('.co-empty-filter');
    var apply = function () {
      var want = {};
      jf.forEach(function (s) { want[s.getAttribute('data-job-filter')] = s.value; });
      var n = 0;
      jobs.forEach(function (j) {
        var ok = (!want.dept || j.getAttribute('data-dept') === want.dept) && (!want.loc || j.getAttribute('data-loc') === want.loc);
        j.hidden = !ok; if (ok) n++;
      });
      if (count) count.textContent = n + (n === 1 ? ' role' : ' roles');
      if (none) none.hidden = n !== 0;
    };
    jf.forEach(function (s) { s.addEventListener('change', apply); });
    apply();
  }

  /* 5. Copy-to-clipboard (newsroom boilerplate) */
  $$('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var src = $(btn.getAttribute('data-copy'));
      if (!src) return;
      var label = $('span', btn), old = label ? label.textContent : '';
      var done = function (ok) {
        btn.classList.toggle('is-copied', ok);
        if (label) label.textContent = ok ? 'Copied' : 'Press Ctrl+C to copy';
        setTimeout(function () { btn.classList.remove('is-copied'); if (label) label.textContent = old; }, 2200);
      };
      var text = src.textContent.trim();
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { done(true); }, function () { selectText(src); done(false); });
      } else { selectText(src); done(false); }
    });
  });
  function selectText(node) {
    var r = document.createRange(); r.selectNodeContents(node);
    var s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
  }
})();
