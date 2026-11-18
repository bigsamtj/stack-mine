/* Company pages: reveal, tabs, spotlight, delivery console, referral estimator. Content is in the HTML; this only enhances it. */
(function () {
  var doc = document, root = doc.documentElement;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Reveal on scroll (elements already on screen are shown immediately, so nothing flashes) */
  if ('IntersectionObserver' in window && !reduce) {
    var els = Array.prototype.slice.call(doc.querySelectorAll('.cw-rv'));
    var vh = window.innerHeight;
    els.forEach(function (el) { if (el.getBoundingClientRect().top < vh * 0.95) el.classList.add('in'); });
    root.classList.add('cw-js');
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { if (!el.classList.contains('in')) io.observe(el); });
  }

  /* Tabs: [data-cw-tabs] > .cw-tab[aria-controls] */
  Array.prototype.forEach.call(doc.querySelectorAll('[data-cw-tabs]'), function (box) {
    var tabs = Array.prototype.slice.call(box.querySelectorAll('.cw-tab, .sx-t'));
    function show(t, focus) {
      tabs.forEach(function (x) {
        var on = x === t; x.classList.toggle('is-on', on); x.setAttribute('aria-selected', on ? 'true' : 'false'); x.tabIndex = on ? 0 : -1;
        var p = doc.getElementById(x.getAttribute('aria-controls')); if (p) p.hidden = !on;
      });
      if (focus) t.focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () {
        show(t);
        if (window.matchMedia('(max-width: 1080px)').matches) { var p = doc.getElementById(t.getAttribute('aria-controls')); if (p) p.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
      });
      t.addEventListener('keydown', function (e) {
        var n = null;
        if (e.key === 'ArrowDown' || e.key === 'ArrowRight') n = tabs[(i + 1) % tabs.length];
        if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') n = tabs[(i - 1 + tabs.length) % tabs.length];
        if (n) { e.preventDefault(); show(n, true); }
      });
    });
  });

  /* Segmented tabs: [data-seg] button[data-p] */
  Array.prototype.forEach.call(doc.querySelectorAll('[data-seg]'), function (box) {
    var bs = Array.prototype.slice.call(box.querySelectorAll('.seg button'));
    bs.forEach(function (b) {
      b.addEventListener('click', function () {
        bs.forEach(function (x) { var on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-selected', on ? 'true' : 'false'); var p = doc.getElementById(x.getAttribute('data-p')); if (p) p.hidden = !on; });
      });
    });
  });

  /* Spotlight glow follows the pointer */
  Array.prototype.forEach.call(doc.querySelectorAll('.cw-spot'), function (el) {
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px'); el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* How We Work: delivery console cycles through the lifecycle */
  var con = doc.querySelector('[data-hw-console]');
  if (con && !reduce) {
    var rows = Array.prototype.slice.call(con.querySelectorAll('.hw-stages li'));
    var term = con.querySelector('.hw-term');
    var lines = JSON.parse(con.getAttribute('data-lines') || '[]');
    var step = 0;
    function render() {
      rows.forEach(function (r, i) { r.classList.toggle('done', i < step); r.classList.toggle('now', i === step); });
      var l = lines[step] || [];
      term.innerHTML = l.map(function (x, i) { return '<div' + (i === l.length - 1 ? ' class="cur"' : '') + '>' + x + '</div>'; }).join('');
      var g = con.querySelector('[data-hw-gates]'); if (g) g.textContent = Math.min(5, Math.floor(step * 5 / 7)) + ' / 5';
      step = (step + 1) % (rows.length + 1);
    }
    render(); setInterval(render, 2600);
  }

  /* Referral: reward estimator (rates come from data attributes on the widget) */
  var calc = doc.querySelector('[data-rf-calc]');
  if (calc) {
    var range = calc.querySelector('input[type=range]'), outV = calc.querySelector('[data-rf-value]'), outR = calc.querySelector('[data-rf-reward]'), outN = calc.querySelector('[data-rf-note]');
    var whoBtns = Array.prototype.slice.call(calc.querySelectorAll('.rf-who button'));
    var rate = parseFloat(whoBtns[0].getAttribute('data-rate')), cap = parseFloat(calc.getAttribute('data-cap'));
    function inr(n) {
      if (n >= 1e7) return '₹' + (n / 1e7).toFixed(n % 1e7 ? 2 : 0).replace(/\.?0+$/, '') + ' crore';
      if (n >= 1e5) return '₹' + (n / 1e5).toFixed(n % 1e5 ? 2 : 0).replace(/\.?0+$/, '') + ' lakh';
      return '₹' + Math.round(n).toLocaleString('en-IN');
    }
    function upd() {
      var v = parseFloat(range.value), r = Math.min(v * rate / 100, cap);
      range.style.setProperty('--p', ((v - range.min) / (range.max - range.min) * 100) + '%');
      outV.textContent = inr(v); outR.textContent = inr(r);
      outN.textContent = rate + '% of the first-year value' + (v * rate / 100 > cap ? ', capped at ' + inr(cap) : '') + ', excluding GST.';
    }
    range.addEventListener('input', upd);
    whoBtns.forEach(function (b) {
      b.addEventListener('click', function () {
        whoBtns.forEach(function (x) { x.classList.toggle('is-on', x === b); x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
        rate = parseFloat(b.getAttribute('data-rate')); upd();
      });
    });
    upd();
  }

  /* Referral form: buttons that preset the referrer type */
  doc.addEventListener('click', function (e) {
    var a = e.target.closest('a[data-rf-type]'); if (!a) return;
    var s = doc.querySelector('.rf-form select[name=referrer_type]');
    if (s) Array.prototype.forEach.call(s.options, function (o) { if (o.text === a.getAttribute('data-rf-type')) s.value = o.value || o.text; });
  });
})();
