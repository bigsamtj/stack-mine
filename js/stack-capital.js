/* Stack Capital page: "what we add" layer tabs and portfolio filter */
(function () {
  var tabs = Array.prototype.slice.call(document.querySelectorAll('.sc-layer'));
  function show(t, focus) {
    tabs.forEach(function (x) {
      var on = x === t;
      x.classList.toggle('is-on', on);
      x.setAttribute('aria-selected', on ? 'true' : 'false');
      x.tabIndex = on ? 0 : -1;
      var p = document.getElementById(x.getAttribute('aria-controls'));
      if (p) p.hidden = !on;
    });
    if (focus) t.focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () {
      show(t);
      var p = document.getElementById(t.getAttribute('aria-controls'));
      if (p && window.matchMedia('(max-width: 1080px)').matches) p.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    t.addEventListener('keydown', function (e) {
      var k = e.key, n = null;
      if (k === 'ArrowDown' || k === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
      if (k === 'ArrowUp' || k === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
      if (k === 'Home') n = tabs[0];
      if (k === 'End') n = tabs[tabs.length - 1];
      if (n) { e.preventDefault(); show(n, true); }
    });
  });

  // Founder profile tabs
  var pts = Array.prototype.slice.call(document.querySelectorAll('.sc-pt'));
  function showP(t, focus) {
    pts.forEach(function (x) {
      var on = x === t; x.classList.toggle('is-on', on); x.setAttribute('aria-selected', on ? 'true' : 'false'); x.tabIndex = on ? 0 : -1;
      var p = document.getElementById(x.getAttribute('aria-controls')); if (p) p.hidden = !on;
    });
    if (focus) t.focus();
  }
  pts.forEach(function (t, i) {
    t.addEventListener('click', function () { showP(t); });
    t.addEventListener('keydown', function (e) {
      var n = null;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = pts[(i + 1) % pts.length];
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = pts[(i - 1 + pts.length) % pts.length];
      if (n) { e.preventDefault(); showP(n, true); }
    });
  });

  var bar = document.querySelector('.sc-filter');
  if (bar) {
    var cards = document.querySelectorAll('.sc-co'), empty = document.querySelector('.sc-empty');
    bar.addEventListener('click', function (e) {
      var b = e.target.closest('button'); if (!b) return;
      bar.querySelectorAll('button').forEach(function (x) {
        var on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      var f = b.getAttribute('data-f'), shown = 0;
      Array.prototype.forEach.call(cards, function (c) {
        var ok = f === 'all' || c.getAttribute('data-track') === f;
        c.hidden = !ok; if (ok) shown++;
      });
      if (empty) empty.hidden = shown > 0;
    });
  }

  // "Pitch" buttons focus the form
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href="#pitch"]'); if (!a) return;
    var f = document.querySelector('.sc-form [name=name]');
    if (f) setTimeout(function () { f.focus({ preventScroll: true }); }, 600);
  });
})();
