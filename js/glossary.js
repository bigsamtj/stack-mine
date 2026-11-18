/* Stack18 Technology Glossary: instant search, filters, A-Z, featured definition, TOC.
   Content is fully rendered in HTML; this script only enhances it. */
(function () {
  var doc = document, DATA = null, loading = null;
  var embedded = doc.getElementById('gl-data');
  if (embedded) { try { DATA = JSON.parse(embedded.textContent); } catch (e) {} }
  function load() {
    if (DATA) return Promise.resolve(DATA);
    if (!loading) loading = fetch('/glossary/search-index.json').then(function (r) { return r.json(); }).then(function (j) { DATA = j.terms; return DATA; }).catch(function () { DATA = []; return DATA; });
    return loading;
  }
  function track(name, params) { try { if (window.gtag) window.gtag('event', name, params || {}); } catch (e) {} }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---------------- search engine */
  function norm(s) { return String(s || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').trim(); }
  function compact(s) { return norm(s).replace(/ /g, ''); }
  function lev(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    var prev = [], i, j;
    for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) {
      var cur = [i], best = i;
      for (j = 1; j <= b.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        if (cur[j] < best) best = cur[j];
      }
      if (best > max) return max + 1;
      prev = cur;
    }
    return prev[b.length];
  }
  var PREP = null;
  function prep(list) {
    if (PREP) return PREP;
    PREP = list.map(function (t) {
      var syn = (t.y || []).map(norm), kw = (t.k || []).map(norm), name = norm(t.t), acr = norm(t.a);
      var words = (name + ' ' + acr + ' ' + syn.join(' ')).split(' ').filter(Boolean);
      return { t: t, name: name, acr: acr, cacr: compact(t.a), cname: compact(t.t), syn: syn, kw: kw, desc: norm(t.d), cat: norm(t.cn),
        hay: [name, acr].concat(syn, kw).join(' '), words: words };
    });
    return PREP;
  }
  function score(p, q, qc, toks) {
    if (!q) return 0;
    if ((p.acr && (p.acr === q || p.cacr === qc)) || p.name === q || p.cname === qc) return 100;
    if (p.syn.indexOf(q) > -1) return 90;
    if (p.name.indexOf(q) === 0) return 80;
    if ((' ' + p.name).indexOf(' ' + q) > -1) return 68;
    if (p.name.indexOf(q) > -1) return 60;
    for (var i = 0; i < p.syn.length; i++) if (p.syn[i].indexOf(q) > -1) return 52;
    for (i = 0; i < p.kw.length; i++) if (p.kw[i].indexOf(q) > -1) return 42;
    var all = true, inName = 0, inDesc = 0;
    toks.forEach(function (tk) {
      var re = (' ' + p.hay).indexOf(' ' + tk) > -1;
      if ((' ' + p.name).indexOf(' ' + tk) > -1) inName++;
      if (!re) { if ((' ' + p.desc + ' ' + p.cat).indexOf(' ' + tk) > -1) inDesc++; else all = false; }
    });
    if (all && toks.length) return 34 + inName * 4 - inDesc * 2;
    var fz = 0;
    toks.forEach(function (tk) {
      if (tk.length < 4) return;
      var max = tk.length >= 7 ? 2 : 1;
      for (var w = 0; w < p.words.length; w++) {
        var word = p.words[w];
        if (lev(tk, word, max) <= max || (word.length > tk.length && lev(tk, word.slice(0, tk.length), max) <= max - (max > 1 ? 1 : 0))) { fz++; break; }
      }
    });
    var shortOk = toks.every(function (tk) { return tk.length >= 4 || (' ' + p.hay + ' ' + p.desc).indexOf(' ' + tk) > -1; });
    if (fz && shortOk && fz === toks.filter(function (x) { return x.length >= 4; }).length) return 24;
    if (toks.length > 1 && inDesc) return 12;
    return 0;
  }
  function search(list, raw) {
    var q = norm(raw), qc = compact(raw), toks = q.split(' ').filter(Boolean);
    var out = prep(list).map(function (p) { return { t: p.t, s: score(p, q, qc, toks) }; }).filter(function (r) { return r.s > 0; });
    out.sort(function (a, b) { return b.s - a.s || a.t.t.localeCompare(b.t.t); });
    if (out.length && out[0].s >= 34) out = out.filter(function (r) { return r.s >= 20; });
    return out;
  }
  function mark(text, raw) {
    var toks = norm(raw).split(' ').filter(function (x) { return x.length > 0; });
    var s = esc(text);
    if (!toks.length) return s;
    var re = new RegExp('(' + toks.map(function (x) { return x.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }).join('|') + ')', 'ig');
    return s.replace(re, '<mark>$1</mark>');
  }

  /* ---------------- dropdown search boxes */
  function initBox(box, opts) {
    var input = box.querySelector('input'), panel = box.querySelector('.gl-results');
    var sel = -1, items = [], timer = null;
    function close() { panel.hidden = true; input.setAttribute('aria-expanded', 'false'); sel = -1; }
    function render(raw) {
      load().then(function (list) {
        var q = raw.trim();
        if (!q) { close(); return; }
        var res = search(list, q), top = res.slice(0, 7), html = '', seen = {};
        top.forEach(function (r) { seen[r.t.s] = 1; });
        top.forEach(function (r, i) {
          var t = r.t;
          html += '<a class="gl-r" role="option" id="' + input.id + '-o' + i + '" href="/glossary/' + t.s + '" aria-selected="false"><b>' + mark(t.t + (t.a && t.a !== t.t ? ' (' + t.a + ')' : ''), q) + '</b>' +
            '<span class="gl-tag" style="--c:' + t.cc + '">' + esc(t.cn) + '</span><span class="gl-r-d">' + mark(t.d, q) + '</span></a>';
        });
        if (top.length && top[0].s >= 60) {
          var rel = (top[0].t.r || []).filter(function (s) { return !seen[s]; }).slice(0, 3)
            .map(function (s) { for (var k = 0; k < list.length; k++) if (list[k].s === s) return list[k]; }).filter(Boolean);
          if (rel.length) {
            html += '<div class="gl-r-sep">Related to ' + esc(top[0].t.t) + '</div>';
            rel.forEach(function (t, j) {
              html += '<a class="gl-r" role="option" id="' + input.id + '-r' + j + '" href="/glossary/' + t.s + '" aria-selected="false"><b>' + esc(t.t) + '</b><span class="gl-tag" style="--c:' + t.cc + '">' + esc(t.cn) + '</span><span class="gl-r-d">' + esc(t.d) + '</span></a>';
            });
          }
        }
        if (!res.length) {
          html = '<div class="gl-r-none">No terms match “' + esc(q) + '”. Try an acronym such as <b>API</b> or <b>LLM</b>, or <a href="/contact">suggest this term</a>.</div>';
          track('glossary_no_results', { search_term: q });
        } else if (opts.more && res.length > top.length) {
          html += '<div class="gl-r-sep"><a href="#all-terms" data-more>See all ' + res.length + ' matching terms &#8594;</a></div>';
        }
        panel.innerHTML = html; panel.hidden = false; input.setAttribute('aria-expanded', 'true');
        items = Array.prototype.slice.call(panel.querySelectorAll('.gl-r')); sel = -1;
        clearTimeout(timer);
        timer = setTimeout(function () { if (q.length > 1) track('glossary_search', { search_term: q, results: res.length }); }, 1200);
        if (opts.onQuery) opts.onQuery(q);
      });
    }
    function move(d) {
      if (!items.length) return;
      if (sel > -1) items[sel].setAttribute('aria-selected', 'false');
      sel = (sel + d + items.length) % items.length;
      items[sel].setAttribute('aria-selected', 'true');
      input.setAttribute('aria-activedescendant', items[sel].id);
      items[sel].scrollIntoView({ block: 'nearest' });
    }
    input.addEventListener('input', function () { render(input.value); });
    input.addEventListener('focus', function () { load(); if (input.value.trim()) render(input.value); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { e.preventDefault(); move(1); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); move(-1); }
      else if (e.key === 'Escape') { close(); }
      else if (e.key === 'Enter') {
        e.preventDefault();
        var target = sel > -1 ? items[sel] : items[0];
        if (target) { track('glossary_search_select', { search_term: input.value.trim(), term: target.getAttribute('href') }); location.href = target.getAttribute('href'); }
      }
    });
    panel.addEventListener('click', function (e) {
      var more = e.target.closest('[data-more]');
      if (more && opts.onMore) { e.preventDefault(); close(); opts.onMore(input.value); return; }
      var a = e.target.closest('.gl-r'); if (a) track('glossary_search_select', { search_term: input.value.trim(), term: a.getAttribute('href') });
    });
    doc.addEventListener('click', function (e) { if (!box.contains(e.target)) close(); });
    return { input: input, render: render };
  }

  /* ---------------- hub: list filter */
  var list = doc.querySelector('.gl-list'), filterApi = null;
  if (list) {
    var itemsEl = Array.prototype.slice.call(list.querySelectorAll('.gl-item'));
    var letters = Array.prototype.slice.call(list.querySelectorAll('.gl-letter'));
    var count = doc.querySelector('.gl-count'), empty = doc.querySelector('.gl-empty');
    var az = Array.prototype.slice.call(doc.querySelectorAll('.gl-az a'));
    var cat = 'all', query = '';
    var fbtn = Array.prototype.slice.call(doc.querySelectorAll('.gl-filt button'));
    var q2 = doc.getElementById('gl-q2');
    function apply() {
      var allowed = null;
      if (query) { allowed = {}; search(DATA || [], query).forEach(function (r) { allowed[r.t.s] = 1; }); }
      var shown = 0;
      itemsEl.forEach(function (el) {
        var ok = (cat === 'all' || el.getAttribute('data-cat') === cat) && (!allowed || allowed[el.getAttribute('data-slug')]);
        el.hidden = !ok; if (ok) shown++;
      });
      var live = {};
      letters.forEach(function (sec) {
        var any = sec.querySelector('.gl-item:not([hidden])');
        sec.hidden = !any; if (any) live[sec.getAttribute('data-letter')] = 1;
      });
      az.forEach(function (a) { a.classList.toggle('is-off', !live[a.getAttribute('data-l')]); });
      var total = itemsEl.length;
      count.textContent = shown === total ? 'Showing all ' + total + ' terms' : 'Showing ' + shown + ' of ' + total + ' terms' + (query ? ' for “' + query + '”' : '');
      empty.hidden = shown > 0;
      if (!shown) empty.querySelector('.gl-empty-q').textContent = query ? '“' + query + '”' : 'this filter';
    }
    fbtn.forEach(function (b) {
      b.addEventListener('click', function () {
        cat = b.getAttribute('data-cat');
        fbtn.forEach(function (x) { var on = x === b; x.classList.toggle('is-on', on); x.setAttribute('aria-pressed', on ? 'true' : 'false'); });
        apply(); track('glossary_filter', { category: cat });
      });
    });
    if (q2) {
      var t2 = null;
      q2.addEventListener('input', function () { query = q2.value.trim(); apply(); clearTimeout(t2); t2 = setTimeout(function () { if (query.length > 1) track('glossary_search', { search_term: query, source: 'list' }); }, 1200); });
      q2.addEventListener('keydown', function (e) { if (e.key === 'Escape') { q2.value = ''; query = ''; apply(); } });
    }
    filterApi = function (q) { query = q.trim(); if (q2) q2.value = query; apply(); doc.getElementById('all-terms').scrollIntoView({ behavior: 'smooth' }); };
  }

  /* ---------------- dropdown boxes (hero + sidebar) */
  Array.prototype.forEach.call(doc.querySelectorAll('[data-gl-search]'), function (box) {
    if (box.querySelector('#gl-q2')) return;
    var api = initBox(box, { more: !!list, onMore: filterApi });
    var hints = doc.querySelectorAll('.gl-hints [data-q]');
    if (box.querySelector('#gl-q')) Array.prototype.forEach.call(hints, function (h) {
      h.addEventListener('click', function () { api.input.value = h.getAttribute('data-q'); api.input.focus(); api.render(api.input.value); });
    });
  });
  doc.addEventListener('keydown', function (e) {
    if (e.key !== '/' || /input|textarea|select/i.test((e.target.tagName || ''))) return;
    var i = doc.querySelector('#gl-q') || doc.querySelector('#gl-q-side');
    if (i) { e.preventDefault(); i.focus(); }
  });

  /* ---------------- featured definition rotation */
  var spot = doc.querySelector('.gl-spot');
  if (spot) {
    var feats = []; try { feats = JSON.parse(spot.getAttribute('data-featured')); } catch (e) {}
    if (feats.length > 1) {
      var tEl = spot.querySelector('.gl-spot-t a'), dEl = spot.querySelector('.gl-spot-d'), cEl = spot.querySelector('.gl-spot-c'), gEl = spot.querySelector('.gl-spot-go'), dots = spot.querySelector('.gl-spot-dots');
      var day = Math.floor(Date.now() / 864e5), cur = day % feats.length, timer = null;
      feats.forEach(function (f, i) { var b = doc.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', 'Show ' + f.t); b.addEventListener('click', function () { show(i); restart(); }); dots.appendChild(b); });
      dots.removeAttribute('aria-hidden');
      function show(i) {
        cur = i; var f = feats[i];
        tEl.textContent = f.t; tEl.href = gEl.href = '/glossary/' + f.s; dEl.textContent = f.d; cEl.textContent = f.c;
        Array.prototype.forEach.call(dots.children, function (b, k) { b.classList.toggle('is-on', k === i); });
      }
      function restart() {
        clearInterval(timer);
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        timer = setInterval(function () { show((cur + 1) % feats.length); }, 9000);
      }
      spot.addEventListener('mouseenter', function () { clearInterval(timer); });
      spot.addEventListener('mouseleave', restart);
      show(cur); restart();
    }
  }

  /* ---------------- term page: copy definition + TOC highlight */
  Array.prototype.forEach.call(doc.querySelectorAll('.gl-copy'), function (b) {
    b.addEventListener('click', function () {
      var txt = b.getAttribute('data-copy');
      var done = function () { b.textContent = 'Copied'; b.classList.add('is-done'); setTimeout(function () { b.textContent = 'Copy definition'; b.classList.remove('is-done'); }, 1800); };
      if (navigator.clipboard) navigator.clipboard.writeText(txt).then(done, function () {});
      track('glossary_copy_definition', { page_path: location.pathname });
    });
  });
  var toc = doc.querySelector('.gl-toc');
  if (toc && 'IntersectionObserver' in window) {
    var links = {}; Array.prototype.forEach.call(toc.querySelectorAll('a'), function (a) { links[a.getAttribute('href').slice(1)] = a; });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.isIntersecting && links[en.target.id]) {
          Object.keys(links).forEach(function (k) { links[k].classList.remove('is-on'); });
          links[en.target.id].classList.add('is-on');
        }
      });
    }, { rootMargin: '-20% 0px -70% 0px' });
    Object.keys(links).forEach(function (id) { var s = doc.getElementById(id); if (s) io.observe(s); });
  }
})();
