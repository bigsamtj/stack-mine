/* Stack18 listing engine: left filter sidebar, search, sort, "Load more" and shareable URL state.
   Works on server-rendered lists ([data-mpl-item] children) and, with data-mpl-src, on a JSON
   index that covers every page of a paginated directory. No dependencies. */
(function () {
  'use strict';

  function norm(s) { return String(s || '').toLowerCase().replace(/[^a-z0-9+#.ऀ-ॿ ]+/g, ' ').replace(/\s+/g, ' ').trim(); }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function $all(el, sel) { return Array.prototype.slice.call(el.querySelectorAll(sel)); }

  /* Card templates for JSON-backed lists. Must match the server-rendered markup. */
  var TPL = {
    software: function (d) {
      var logo = '<span class="mp-logo mp-mono" style="width:48px;height:48px;--mp-c:' + esc(d.mc) + '"><span class="mp-mono-t" aria-hidden="true">' + esc(d.m) + '</span>' +
        (d.lg ? '<img src="https://img.logo.dev/' + esc(d.lg) + '?token=pk_WD0IwFVCRemoGhV1z5KU7w&amp;size=96&amp;format=png&amp;fallback=404" width="48" height="48" alt="' + esc(d.n) + ' logo" loading="lazy" decoding="async" referrerpolicy="origin" data-mp-logo>' : '') + '</span>';
      var meta = (d.mt || []).map(function (m) { return '<p class="mp-card-meta"><b>' + esc(m[0]) + '</b> ' + esc(m[1]) + '</p>'; }).join('');
      var tags = d.t && d.t.length ? '<ul class="mp-tags">' + d.t.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul>' : '';
      var foot = '<div class="mp-card-foot"><a class="mp-card-link mp-card-main" href="' + esc(d.u) + '">View profile &#8594;</a>' + (d.a ? '<a class="mp-card-link" href="' + esc(d.a) + '">Alternatives</a>' : '') + '</div>';
      return '<li class="mp-card" data-mpl-item>' +
        '<div class="mp-card-top">' + logo + '<div><h3><a href="' + esc(d.u) + '">' + esc(d.n) + '</a></h3><p class="mp-card-cat"><a href="/marketplace/categories/' + esc(d.c) + '">' + esc(d.cn) + '</a>' + (d.b || '') + '</p></div></div>' +
        '<p class="mp-card-desc">' + esc(d.d) + '</p>' + meta + tags + foot + '</li>';
    }
  };

  function init(root) {
    var list = root.querySelector('[data-mpl-list]');
    if (!list) return;
    var size = parseInt(root.getAttribute('data-mpl-size'), 10) || 24;
    var src = root.getAttribute('data-mpl-src'), tplName = root.getAttribute('data-mpl-tpl');
    var page = parseInt(root.getAttribute('data-mpl-page'), 10) || 1;
    var noun = root.getAttribute('data-mpl-noun') || 'results';
    var qIn = root.querySelector('[data-mpl-q]');
    var sortSel = root.querySelector('[data-mpl-sort]');
    var groups = $all(root, '[data-mpl-g]');
    var countEls = $all(root, '[data-mpl-count]');
    var chips = root.querySelector('[data-mpl-chips]');
    var empty = root.querySelector('[data-mpl-empty]');
    var moreBtn = root.querySelector('[data-mpl-more]');
    var moreNote = root.querySelector('[data-mpl-shown]');
    var pager = root.querySelector('[data-mpl-pager]');
    var side = root.querySelector('.mpl-side');
    var openBtn = root.querySelector('[data-mpl-open]');
    var defSort = sortSel ? sortSel.value : '';

    /* items: {el?, data?, q, g:{group:[values]}, s:{key:value}} */
    var items = [], json = null, loading = null, shown = size, offset = 0, firstRun = true;

    function fromEl(el) {
      var g = {}, s = {};
      groups.forEach(function (fs) { var k = fs.getAttribute('data-mpl-g'); g[k] = (el.getAttribute('data-g-' + k) || '').split(' ').filter(Boolean); });
      Array.prototype.forEach.call(el.attributes, function (a) { if (a.name.indexOf('data-s-') === 0) s[a.name.slice(7)] = a.value; });
      return { el: el, q: norm((el.getAttribute('data-q') || '') + ' ' + el.textContent), g: g, s: s };
    }
    function fromJson(d) { return { data: d, q: norm(d.q), g: d.g || {}, s: d.s || {} }; }

    if (!src) items = $all(list, '[data-mpl-item]').map(fromEl);
    var staticEls = $all(list, '[data-mpl-item]');

    function load() {
      if (json) return Promise.resolve();
      if (loading) return loading;
      root.classList.add('is-loading');
      loading = fetch(src, { credentials: 'same-origin' }).then(function (r) { return r.json(); }).then(function (data) {
        json = data; items = data.map(fromJson); root.classList.remove('is-loading');
      }).catch(function () { root.classList.remove('is-loading'); loading = null; });
      return loading;
    }

    function sel(fs) { return $all(fs, 'input[type=checkbox]:checked').map(function (i) { return i.value; }); }
    function state() {
      var st = { q: norm(qIn ? qIn.value : ''), g: {}, sort: sortSel ? sortSel.value : '' };
      groups.forEach(function (fs) { var v = sel(fs); if (v.length) st.g[fs.getAttribute('data-mpl-g')] = v; });
      return st;
    }
    function isDefault(st) { return !st.q && !Object.keys(st.g).length && st.sort === defSort; }
    function match(it, st, skip) {
      if (st.q) { var toks = st.q.split(' '); for (var i = 0; i < toks.length; i++) if (it.q.indexOf(toks[i]) < 0) return false; }
      for (var k in st.g) {
        if (k === skip) continue;
        var have = it.g[k] || [], want = st.g[k], ok = false;
        for (var j = 0; j < want.length; j++) if (have.indexOf(want[j]) > -1) { ok = true; break; }
        if (!ok) return false;
      }
      return true;
    }
    function sorter(spec) {
      if (!spec) return null;
      var p = spec.split(':'), key = p[0], dir = p[1] === 'desc' ? -1 : 1, num = p[2] === 'num';
      return function (a, b) {
        var x = a.s[key] || '', y = b.s[key] || '', r;
        if (num) { x = parseFloat(x); y = parseFloat(y); if (isNaN(x)) x = -Infinity * dir; if (isNaN(y)) y = -Infinity * dir; r = x === y ? 0 : (x < y ? -1 : 1); }
        else r = String(x).localeCompare(String(y));
        if (!r) r = String(a.s.name || '').localeCompare(String(b.s.name || ''));
        return r * dir || 0;
      };
    }

    function counts(st) {
      groups.forEach(function (fs) {
        var k = fs.getAttribute('data-mpl-g'), c = {};
        items.forEach(function (it) { if (match(it, st, k)) (it.g[k] || []).forEach(function (v) { c[v] = (c[v] || 0) + 1; }); });
        $all(fs, 'label').forEach(function (lb) {
          var inp = lb.querySelector('input'), n = c[inp.value] || 0, em = lb.querySelector('em');
          if (em) em.textContent = n;
          lb.classList.toggle('is-zero', !n && !inp.checked);
        });
      });
    }

    function syncUrl(st) {
      if (!window.history || !history.replaceState) return;
      var p = new URLSearchParams();
      if (qIn && qIn.value.trim()) p.set('q', qIn.value.trim());
      for (var k in st.g) p.set(k, st.g[k].join(','));
      if (st.sort && st.sort !== defSort) p.set('sort', st.sort);
      var qs = p.toString();
      history.replaceState(null, '', location.pathname + (qs ? '?' + qs : '') + location.hash);
    }

    function renderChips(st) {
      var nActive = (qIn && qIn.value.trim() ? 1 : 0);
      if (chips) chips.textContent = '';
      function add(label, fn) {
        if (!chips) return;
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'mpl-chip'; b.innerHTML = esc(label) + ' <span aria-hidden="true">&times;</span>';
        b.setAttribute('aria-label', 'Remove filter: ' + label); b.addEventListener('click', fn); chips.appendChild(b);
      }
      if (qIn && qIn.value.trim()) add('“' + qIn.value.trim() + '”', function () { qIn.value = ''; run(true); });
      groups.forEach(function (fs) {
        $all(fs, 'input:checked').forEach(function (i) {
          nActive++;
          var t = i.parentNode.querySelector('span'); add(t ? t.textContent : i.value, function () { i.checked = false; run(true); });
        });
      });
      if (chips && chips.children.length > 1) {
        var c = document.createElement('button'); c.type = 'button'; c.className = 'mpl-chip mpl-chip-all'; c.textContent = 'Clear all';
        c.addEventListener('click', clearAll); chips.appendChild(c);
      }
      if (openBtn) { var b = openBtn.querySelector('b'); if (b) { b.textContent = nActive ? nActive : ''; b.hidden = !nActive; } }
      root.classList.toggle('has-filters', nActive > 0);
    }

    function paint(res, st, def) {
      var start = def ? offset : 0, end = Math.min(res.length, start + shown);
      var frag = document.createDocumentFragment();
      if (src) {
        var tmp = document.createElement('ul');
        tmp.innerHTML = res.slice(start, end).map(function (it) { return TPL[tplName](it.data); }).join('');
        while (tmp.firstChild) frag.appendChild(tmp.firstChild);
        list.textContent = ''; list.appendChild(frag);
      } else {
        var vis = {};
        res.slice(start, end).forEach(function (it) { vis[items.indexOf(it)] = 1; frag.appendChild(it.el); });
        items.forEach(function (it, i) { it.el.hidden = !vis[i]; if (!vis[i]) frag.appendChild(it.el); });
        list.appendChild(frag);
      }
      var total = res.length, a = total ? start + 1 : 0;
      countEls.forEach(function (el) { el.textContent = total ? ('Showing ' + a + '–' + end + ' of ' + total + ' ' + noun) : ('0 ' + noun); });
      if (empty) empty.hidden = total > 0;
      var left = total - end;
      if (moreBtn) { moreBtn.hidden = left <= 0; moreBtn.textContent = 'Load ' + Math.min(size, left) + ' more'; }
      if (moreNote) moreNote.textContent = total ? ('Showing ' + (end - start) + ' of ' + (def ? total - start : total)) : '';
      if (pager) pager.hidden = !def;
      $all(root, '[data-mpl-apply]').forEach(function (b) { b.textContent = total ? ('Show ' + total + ' ' + noun) : 'No results'; });
    }

    function run(reset) {
      var st = state(), def = isDefault(st);
      if (reset) shown = size;
      if (src && !json) {
        if (def && !firstRun) { /* nothing filtered: keep the server-rendered page */ return; }
        if (def) return;
        load().then(function () { run(false); });
        renderChips(st); return;
      }
      firstRun = false;
      offset = src ? (page - 1) * size : 0;
      var res = items.filter(function (it) { return match(it, st); });
      var f = sorter(st.sort); if (f) res.sort(f);
      paint(res, st, def && !!src);
      counts(st); renderChips(st); syncUrl(st);
    }

    function clearAll() {
      if (qIn) qIn.value = '';
      groups.forEach(function (fs) { $all(fs, 'input').forEach(function (i) { i.checked = false; }); });
      if (sortSel) sortSel.value = defSort;
      run(true);
    }

    /* Read URL state */
    var params = new URLSearchParams(location.search), any = false;
    if (qIn && params.get('q')) { qIn.value = params.get('q'); any = true; }
    groups.forEach(function (fs) {
      var v = params.get(fs.getAttribute('data-mpl-g'));
      if (v) v.split(',').forEach(function (x) { var i = fs.querySelector('input[value="' + x.replace(/"/g, '') + '"]'); if (i) { i.checked = true; any = true; } });
    });
    if (sortSel && params.get('sort')) { sortSel.value = params.get('sort'); if (sortSel.value !== defSort) any = true; }

    /* Wire controls */
    var t;
    if (qIn) qIn.addEventListener('input', function () { clearTimeout(t); t = setTimeout(function () { run(true); }, 140); });
    if (sortSel) sortSel.addEventListener('change', function () { run(true); });
    groups.forEach(function (fs) {
      fs.addEventListener('change', function () { run(true); });
      var mb = fs.querySelector('[data-mpl-showall]'), find = fs.querySelector('[data-mpl-find]');
      if (mb) mb.addEventListener('click', function () {
        var open = fs.classList.toggle('is-open');
        mb.textContent = open ? 'Show fewer' : mb.getAttribute('data-label');
        mb.setAttribute('aria-expanded', open ? 'true' : 'false');
      });
      if (find) find.addEventListener('input', function () {
        var v = norm(find.value);
        fs.classList.toggle('is-finding', !!v);
        $all(fs, 'label').forEach(function (lb) { lb.classList.toggle('is-hit', !!v && norm(lb.textContent).indexOf(v) > -1); });
      });
    });
    $all(root, '[data-mpl-clear]').forEach(function (b) { b.addEventListener('click', clearAll); });
    if (moreBtn) moreBtn.addEventListener('click', function () {
      var go = function () { shown += size; firstRun = false; var st = state(); var def = isDefault(st);
        offset = src ? (page - 1) * size : 0;
        var res = items.filter(function (it) { return match(it, st); }); var f = sorter(st.sort); if (f) res.sort(f);
        paint(res, st, def && !!src); };
      if (src && !json) load().then(go); else go();
    });

    /* Mobile drawer */
    function setOpen(o) {
      root.classList.toggle('is-open', o);
      document.documentElement.classList.toggle('mpl-lock', o);
      if (openBtn) openBtn.setAttribute('aria-expanded', o ? 'true' : 'false');
      if (o && side) { var f = side.querySelector('input,button'); if (f) f.focus(); }
    }
    if (openBtn) openBtn.addEventListener('click', function () { setOpen(true); });
    $all(root, '[data-mpl-close]').forEach(function (b) { b.addEventListener('click', function () { setOpen(false); if (openBtn) openBtn.focus(); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && root.classList.contains('is-open')) setOpen(false); });

    root.classList.add('is-ready');
    if (src) {
      if (any) run(true);
      else { renderChips(state()); if (moreBtn) { moreBtn.hidden = page * size >= (parseInt(root.getAttribute('data-mpl-total'), 10) || 0); } }
    } else run(true);
  }

  /* Simple "show more" for long static lists: <ul data-more="12" data-more-label="Show all 67 categories"> */
  function initMore(ul) {
    var n = parseInt(ul.getAttribute('data-more'), 10), kids = Array.prototype.slice.call(ul.children);
    if (!n || kids.length <= n) return;
    var step = parseInt(ul.getAttribute('data-more-step'), 10) || 0, vis = n;
    var btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'mpl-showmore';
    function paint() {
      kids.forEach(function (k, i) { k.hidden = i >= vis; });
      var left = kids.length - vis;
      btn.hidden = left <= 0;
      btn.textContent = step ? ('Show ' + Math.min(step, left) + ' more') : (ul.getAttribute('data-more-label') || ('Show all ' + kids.length));
      btn.setAttribute('aria-expanded', left <= 0 ? 'true' : 'false');
    }
    btn.addEventListener('click', function () { vis = step ? vis + step : kids.length; paint(); });
    var wrap = ul.getAttribute('data-more-after') ? document.querySelector(ul.getAttribute('data-more-after')) : null;
    if (wrap) wrap.insertBefore(btn, wrap.firstChild); else ul.parentNode.insertBefore(btn, ul.nextSibling);
    paint();
  }

  function boot() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-mpl]'), init);
    Array.prototype.forEach.call(document.querySelectorAll('[data-more]'), initMore);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
