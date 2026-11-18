/* Marketplace: search autocomplete, search results page, and in-page filter/sort.
   Pages are fully rendered server-side; this file only enhances them. No dependencies. */
(function (root) {
  'use strict';

  var INDEX_URL = '/marketplace/search-index.json?v=20261113';

  function norm(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9+#. ]+/g, ' ').replace(/\s+/g, ' ').trim(); }
  function tokens(q) { return norm(q).split(' ').filter(Boolean); }

  /* Score one index entry against query tokens. Every token must match somewhere; name matches weigh most. */
  function score(e, toks) {
    var name = norm(e.n), cat = norm(e.c), desc = norm(e.d), kw = norm((e.k || []).join(' ')), total = 0;
    for (var i = 0; i < toks.length; i++) {
      var t = toks[i], s = 0;
      if (name === t) s = 100;
      else if (name.indexOf(t) === 0) s = 60;
      else if (name.indexOf(' ' + t) > -1) s = 45;
      else if (name.indexOf(t) > -1) s = 30;
      else if (cat.indexOf(t) > -1) s = 18;
      else if (kw.indexOf(t) > -1) s = 14;
      else if (desc.indexOf(t) > -1) s = 6;
      if (!s) return 0;
      total += s;
    }
    return total;
  }

  function search(index, q, limit) {
    var toks = tokens(q);
    if (!toks.length) return [];
    var out = [];
    for (var i = 0; i < index.length; i++) {
      var sc = score(index[i], toks);
      if (sc) out.push({ e: index[i], s: sc });
    }
    if (!out.length && toks.length > 1) {
      /* No entry matches every word: fall back to entries matching any single word, ranked lower. */
      for (var j = 0; j < index.length; j++) {
        var best = 0;
        for (var k = 0; k < toks.length; k++) best = Math.max(best, score(index[j], [toks[k]]));
        if (best) out.push({ e: index[j], s: best / 2 });
      }
    }
    out.sort(function (a, b) { return b.s - a.s || a.e.n.localeCompare(b.e.n); });
    return out.slice(0, limit || 50).map(function (x) { return x.e; });
  }

  if (typeof module !== 'undefined' && module.exports) { module.exports = { score: score, search: search, norm: norm }; }
  if (typeof document === 'undefined') return;

  var cache = null;
  function loadIndex() {
    if (cache) return cache;
    cache = fetch(INDEX_URL, { credentials: 'same-origin' }).then(function (r) { return r.ok ? r.json() : []; }).catch(function () { return []; });
    return cache;
  }
  function el(tag, attrs, text) {
    var n = document.createElement(tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (text) n.textContent = text;
    return n;
  }

  /* ---------- autocomplete on the search input ---------- */
  function initSuggest(input) {
    var list = document.getElementById('mp-suggest'), active = -1, items = [];
    if (!list) return;
    function close() { list.hidden = true; input.setAttribute('aria-expanded', 'false'); active = -1; input.removeAttribute('aria-activedescendant'); }
    function paint() {
      for (var i = 0; i < items.length; i++) items[i].setAttribute('aria-selected', i === active ? 'true' : 'false');
      if (active > -1) input.setAttribute('aria-activedescendant', items[active].id); else input.removeAttribute('aria-activedescendant');
    }
    function render(results) {
      list.textContent = '';
      items = [];
      results.slice(0, 7).forEach(function (e, i) {
        var li = el('li', { role: 'option', id: 'mp-opt-' + i, 'aria-selected': 'false' });
        var a = el('a', { href: e.u }, e.n);
        a.appendChild(el('small', {}, e.t));
        li.appendChild(a); list.appendChild(li); items.push(li);
      });
      list.hidden = !items.length;
      input.setAttribute('aria-expanded', items.length ? 'true' : 'false');
    }
    input.addEventListener('input', function () {
      var q = input.value;
      if (norm(q).length < 2) { close(); return; }
      loadIndex().then(function (idx) { if (input.value === q) render(search(idx, q, 7)); });
    });
    input.addEventListener('focus', function () { loadIndex(); });
    input.addEventListener('keydown', function (ev) {
      if (list.hidden) return;
      if (ev.key === 'ArrowDown') { ev.preventDefault(); active = (active + 1) % items.length; paint(); }
      else if (ev.key === 'ArrowUp') { ev.preventDefault(); active = (active - 1 + items.length) % items.length; paint(); }
      else if (ev.key === 'Enter' && active > -1) { ev.preventDefault(); location.href = items[active].querySelector('a').href; }
      else if (ev.key === 'Escape') { close(); }
    });
    document.addEventListener('click', function (ev) { if (!list.contains(ev.target) && ev.target !== input) close(); });
  }

  /* ---------- search results page ---------- */
  function initResults() {
    var box = document.querySelector('[data-mp-results]');
    if (!box) return;
    var q = new URLSearchParams(location.search).get('q') || '';
    var input = document.querySelector('[data-mp-search]');
    if (input) input.value = q;
    var count = document.querySelector('[data-mp-results-count]'), none = document.querySelector('[data-mp-noresults]');
    if (!norm(q)) { count.textContent = 'Enter a search term above.'; return; }
    loadIndex().then(function (idx) {
      var res = search(idx, q, 50);
      box.textContent = '';
      res.forEach(function (e) {
        var li = el('li', {});
        var a = el('a', { href: e.u }, e.n);
        var p = el('p', {});
        p.appendChild(el('span', { 'class': 'mp-badge' }, e.t));
        p.appendChild(document.createTextNode(e.d));
        li.appendChild(a); li.appendChild(p); box.appendChild(li);
      });
      count.textContent = res.length + ' result' + (res.length === 1 ? '' : 's') + ' for "' + q + '"';
      none.hidden = res.length > 0;
    });
  }

  /* ---------- filter / sort on listing, category and discussion pages ---------- */
  function initFilters(ctrl) {
    var list = document.querySelector('[data-mp-list]');
    if (!list) return;
    var cards = Array.prototype.slice.call(list.children);
    var text = ctrl.querySelector('[data-mp-text]'), sort = ctrl.querySelector('[data-mp-sort]'), topic = ctrl.querySelector('[data-mp-topic]');
    var count = ctrl.querySelector('[data-mp-count]'), empty = document.querySelector('[data-mp-empty]');
    var groups = Array.prototype.slice.call(ctrl.querySelectorAll('[data-mp-fg]'));
    var quick = Array.prototype.slice.call(ctrl.querySelectorAll('[data-mp-quick]')), chips = ctrl.querySelector('[data-mp-chips]');
    var tpills = Array.prototype.slice.call(ctrl.querySelectorAll('[data-mp-topicpill]'));
    var noun = (count.textContent.match(/^\d+\s+(\w+?)s?$/) || [0, 'listing'])[1];

    function selected(g) {
      return Array.prototype.slice.call(g.querySelectorAll('input:checked')).map(function (i) { return i.value; });
    }
    function apply() {
      var q = norm(text ? text.value : ''), shown = 0, t = topic ? topic.value : '';
      cards.forEach(function (c) {
        var ok = !q || norm(c.textContent).indexOf(q) > -1;
        if (ok && t) ok = c.getAttribute('data-cat') === t;
        for (var i = 0; ok && i < groups.length; i++) {
          var sel = selected(groups[i]);
          if (!sel.length) continue;
          var have = (c.getAttribute('data-f-' + groups[i].getAttribute('data-mp-fg')) || '').split(' ');
          ok = sel.some(function (v) { return have.indexOf(v) > -1; });
        }
        c.hidden = !ok;
        if (ok) shown++;
      });
      count.textContent = shown + ' ' + noun + (shown === 1 ? '' : 's');
      if (empty) empty.hidden = shown > 0;
      syncUI();
    }
    function box(g, v) { return g.querySelector('input[value="' + v + '"]'); }
    function resetAll() {
      if (text) text.value = '';
      if (topic) topic.value = '';
      groups.forEach(function (g) { g.querySelectorAll('input').forEach(function (i) { i.checked = false; }); });
      apply();
    }
    function syncUI() {
      tpills.forEach(function (b) { b.setAttribute('aria-pressed', topic && topic.value === b.getAttribute('data-mp-topicpill') ? 'true' : 'false'); });
      quick.forEach(function (b) {
        var pr = b.getAttribute('data-mp-quick').split(':'), g = groups.filter(function (x) { return x.getAttribute('data-mp-fg') === pr[0]; })[0], i = g && box(g, pr[1]);
        b.setAttribute('aria-pressed', i && i.checked ? 'true' : 'false');
      });
      if (!chips) return;
      chips.textContent = '';
      var any = false;
      function add(label, fn) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'mpc-chip'; b.textContent = label + ' \u00d7'; b.setAttribute('aria-label', 'Remove filter: ' + label);
        b.addEventListener('click', fn); chips.appendChild(b); any = true;
      }
      if (text && text.value.trim()) add('Search: ' + text.value.trim(), function () { text.value = ''; apply(); });
      if (topic && topic.value) add('Topic: ' + topic.options[topic.selectedIndex].text, function () { topic.value = ''; apply(); });
      groups.forEach(function (g) {
        g.querySelectorAll('input:checked').forEach(function (i) {
          add(i.parentNode.textContent.replace(/\(\d+\)/, '').replace(/\s+/g, ' ').trim(), function () { i.checked = false; apply(); });
        });
      });
      if (any) {
        var c = document.createElement('button');
        c.type = 'button'; c.className = 'mpc-chip mpc-chip-all'; c.textContent = 'Clear all'; c.addEventListener('click', resetAll); chips.appendChild(c);
      }
    }
    function order() {
      if (!sort) return;
      var by = sort.value;
      cards.sort(function (a, b) {
        if (by === 'verified') {
          var d = (b.getAttribute('data-verified') || '').localeCompare(a.getAttribute('data-verified') || '');
          if (d) return d;
        } else if (by === 'free') {
          var fa = (a.getAttribute('data-f-free_plan') || '').indexOf('yes') > -1 ? 0 : 1, fb = (b.getAttribute('data-f-free_plan') || '').indexOf('yes') > -1 ? 0 : 1;
          if (fa !== fb) return fa - fb;
        } else if (by === 'price') {
          var pa = parseFloat(a.getAttribute('data-entry')), pb = parseFloat(b.getAttribute('data-entry'));
          if (isNaN(pa)) pa = Infinity; if (isNaN(pb)) pb = Infinity;
          if (pa !== pb) return pa - pb;
        }
        return (a.getAttribute('data-name') || '').localeCompare(b.getAttribute('data-name') || '');
      });
      cards.forEach(function (c) { list.appendChild(c); });
    }
    if (text) text.addEventListener('input', apply);
    if (topic) topic.addEventListener('change', apply);
    if (sort) sort.addEventListener('change', order);
    groups.forEach(function (g) { g.addEventListener('change', apply); });
    document.querySelectorAll('[data-mp-reset]').forEach(function (reset) { reset.addEventListener('click', resetAll); });
    quick.forEach(function (b) {
      b.addEventListener('click', function () {
        var pr = b.getAttribute('data-mp-quick').split(':'), g = groups.filter(function (x) { return x.getAttribute('data-mp-fg') === pr[0]; })[0], i = g && box(g, pr[1]);
        if (!i) return;
        i.checked = !i.checked; apply();
      });
    });
    tpills.forEach(function (b) {
      b.addEventListener('click', function () {
        if (!topic) return;
        var v = b.getAttribute('data-mp-topicpill');
        topic.value = topic.value === v ? '' : v; apply();
      });
    });
    if (topic) topic.addEventListener('change', syncUI);
    var fd = ctrl.querySelector('.mpc-fd');
    if (fd && window.matchMedia && window.matchMedia('(max-width:860px)').matches) fd.removeAttribute('open');
    syncUI();
  }


  /* ---------- mobile sticky action bar on profile pages ---------- */
  function initSticky() {
    var bar = document.querySelector('[data-mp-sticky]'), hero = document.querySelector('[data-mp-herocta]'), end = document.querySelector('.mpp-cta');
    if (!bar || !hero || !('IntersectionObserver' in window)) return;
    var past = false, atEnd = false, links = Array.prototype.slice.call(bar.querySelectorAll('a'));
    function update() {
      var on = past && !atEnd;
      bar.classList.toggle('is-on', on);
      bar.setAttribute('aria-hidden', on ? 'false' : 'true');
      links.forEach(function (a) { a.tabIndex = on ? 0 : -1; });
      document.documentElement.classList.toggle('mpp-stuck', on);
    }
    new IntersectionObserver(function (en) { var e = en[0]; past = !e.isIntersecting && e.boundingClientRect.top < 0; update(); }, { threshold: 0 }).observe(hero);
    var ctaIn = false, footIn = false, foot = document.querySelector('.site-footer');
    function recalc() { atEnd = ctaIn || footIn; update(); }
    if (end) new IntersectionObserver(function (en) { ctaIn = en[0].isIntersecting; recalc(); }, { threshold: 0.15 }).observe(end);
    if (foot) new IntersectionObserver(function (en) { footIn = en[0].isIntersecting; recalc(); }, { threshold: 0 }).observe(foot);
  }


  /* ---------- comparison table: show only the rows that differ ---------- */
  function initDiff() {
    var cb = document.querySelector('[data-mp-diff]'), tbl = document.querySelector('.mp-cmp'), st = document.querySelector('[data-mp-diffstatus]');
    if (!cb || !tbl) return;
    cb.addEventListener('change', function () {
      var only = cb.checked, rows = Array.prototype.slice.call(tbl.querySelectorAll('tbody tr')), cur = null, any = false, shown = 0;
      function close() { if (cur) cur.hidden = only && !any; }
      rows.forEach(function (tr) {
        if (tr.hasAttribute('data-grp')) { close(); cur = tr; any = false; return; }
        tr.hidden = only && tr.getAttribute('data-same') === '1';
        if (!tr.hidden) { any = true; shown++; }
      });
      close();
      if (st) st.textContent = only ? 'Showing ' + shown + ' row' + (shown === 1 ? '' : 's') + ' that differ.' : '';
    });
  }

  /* ---------- on-page navigation: highlight the section in view ---------- */
  function initSpy() {
    var links = Array.prototype.slice.call(document.querySelectorAll('.mpc-toc a[href^="#"]'));
    if (!links.length || !('IntersectionObserver' in window)) return;
    var map = {};
    links.forEach(function (a) { var el = document.getElementById(a.getAttribute('href').slice(1)); if (el) map[el.id] = a; });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.removeAttribute('aria-current'); });
        var a = map[e.target.id]; if (a) { a.setAttribute('aria-current', 'true'); if (a.scrollIntoView && a.parentNode.parentNode.scrollWidth > a.parentNode.parentNode.clientWidth) { var ul = a.parentNode.parentNode; ul.scrollLeft = a.offsetLeft - ul.clientWidth / 2 + a.clientWidth / 2; } }
      });
    }, { rootMargin: '-35% 0px -55% 0px', threshold: 0 });
    Object.keys(map).forEach(function (id) { io.observe(document.getElementById(id)); });
  }

  /* ---------- cost estimator (sidebar) ---------- */
  function initCalc(box) {
    var cfg; try { cfg = JSON.parse(box.getAttribute('data-calc')); } catch (e) { return; }
    var range = box.querySelector('[data-mp-seats]'), num = box.querySelector('[data-mp-seatnum]'), out = box.querySelector('[data-mp-out]'), minEl = box.querySelector('[data-mp-min]');
    function money(v) { var t = (Math.round(v * 100) / 100).toLocaleString('en-US', { minimumFractionDigits: v % 1 ? 2 : 0, maximumFractionDigits: 2 }); return '$' + t; }
    function paint(n) {
      n = Math.max(1, Math.min(parseInt(n, 10) || 1, parseInt(range.max, 10)));
      var eff = Math.max(n, cfg.min);
      out.textContent = '';
      cfg.plans.forEach(function (p) {
        var li = el('li', {});
        li.appendChild(el('span', {}, p.name));
        var b = el('b', {}, money(p.price * eff)); b.appendChild(el('small', {}, '/mo')); li.appendChild(b);
        li.appendChild(el('em', {}, money(p.price * eff * 12) + '/yr' + (eff !== n ? ' (minimum ' + cfg.min + ' seats applied)' : '')));
        out.appendChild(li);
      });
    }
    range.addEventListener('input', function () { num.value = range.value; paint(range.value); });
    num.addEventListener('input', function () { if (num.value) { range.value = num.value; paint(num.value); } });
  }
  document.querySelectorAll('[data-mp-calc]').forEach(initCalc);

  /* If a remote logo fails (or the domain has none), drop the image so the monogram underneath shows. */
  function dropBroken(img) { if (img && img.parentNode) img.parentNode.removeChild(img); }
  document.addEventListener('error', function (ev) { var t = ev.target; if (t && t.tagName === 'IMG' && t.hasAttribute('data-mp-logo')) dropBroken(t); }, true);
  document.querySelectorAll('img[data-mp-logo]').forEach(function (img) { if (img.complete && img.naturalWidth === 0) dropBroken(img); });

  var si = document.querySelector('[data-mp-search]');
  if (si) initSuggest(si);
  initResults();
  document.querySelectorAll('[data-mp-controls]').forEach(initFilters);
  initSpy();
  initSticky();
  initDiff();
})(typeof window !== 'undefined' ? window : this);
