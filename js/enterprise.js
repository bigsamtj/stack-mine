/* Stack18 /enterprise: page interactions. Progressive enhancement: without JS every panel is visible. */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* Accessible tabs (WAI-ARIA): arrows, Home/End, roving tabindex */
  function tabs(root, onChange) {
    var list = $('[role="tablist"]', root), ts = $$('[role="tab"]', list);
    var panels = ts.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
    function select(i, focus) {
      ts.forEach(function (t, k) {
        var on = k === i;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        if (panels[k]) panels[k].hidden = !on;
      });
      if (focus) ts[i].focus();
      if (onChange) onChange(i, root);
    }
    ts.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i); });
      t.addEventListener('keydown', function (e) {
        var n = ts.length, k = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') k = (i + 1) % n;
        else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') k = (i - 1 + n) % n;
        else if (e.key === 'Home') k = 0;
        else if (e.key === 'End') k = n - 1;
        if (k !== null) { e.preventDefault(); select(k, true); }
      });
    });
    select(0);
    return { select: select };
  }

  /* D. lifecycle: progress fill along the rail */
  $$('.en-life').forEach(function (r) {
    tabs(r, function (i) { $('.en-life-rail', r).style.setProperty('--p', (i / 5).toFixed(3)); });
  });

  /* F. workflows: tabs + step-through */
  function stepper(panel) {
    var steps = $$('.en-step', panel), flow = $('.en-flow', panel), cur = 0;
    var typeEl = $('.en-stype', panel), textEl = $('.en-stext', panel);
    var prev = $('.en-prev', panel), next = $('.en-next', panel);
    function go(i) {
      cur = Math.max(0, Math.min(steps.length - 1, i));
      steps.forEach(function (s, k) {
        var on = k === cur;
        s.classList.toggle('is-on', on);
        if (on) s.setAttribute('aria-current', 'step'); else s.removeAttribute('aria-current');
      });
      var s = steps[cur], t = s.getAttribute('data-t');
      typeEl.textContent = t;
      typeEl.className = 'en-stype ' + (t === 'Agent' ? 't-agent' : t === 'Human approval' ? 't-human' : 't-sys');
      textEl.textContent = s.getAttribute('data-d');
      flow.style.setProperty('--p', (cur / (steps.length - 1)).toFixed(3));
      prev.disabled = cur === 0;
      prev.style.opacity = cur === 0 ? '.45' : '1';
      next.textContent = cur === steps.length - 1 ? 'Start again' : 'Next step';
    }
    steps.forEach(function (s, k) { s.addEventListener('click', function () { go(k); }); });
    prev.addEventListener('click', function () { go(cur - 1); });
    next.addEventListener('click', function () { go(cur === steps.length - 1 ? 0 : cur + 1); });
    go(0);
  }
  $$('.en-wf').forEach(function (wf) { tabs(wf); });
  $$('[data-steps]').forEach(stepper);

  /* G. differentiators highlight the matching layer of the architecture */
  var stack = $('.en-stack');
  if (stack) {
    var btns = $$('.en-d'), layers = $$('.en-sl', stack);
    var set = function (k) {
      btns.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-k') === k ? 'true' : 'false'); });
      layers.forEach(function (l) { l.classList.toggle('is-hl', !!k && l.getAttribute('data-k') === k); });
      stack.classList.toggle('has-hl', !!k);
    };
    btns.forEach(function (b) {
      var k = b.getAttribute('data-k');
      b.addEventListener('click', function () { set(k); });
      b.addEventListener('mouseenter', function () { set(k); });
      b.addEventListener('focus', function () { set(k); });
    });
    set('1');
  }

  /* C. reveal the from/to shifts on scroll */
  var rows = $$('.en-sh');
  if (rows.length) {
    if (reduce || !('IntersectionObserver' in window)) rows.forEach(function (r) { r.classList.add('is-in'); });
    else {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
      }, { threshold: .35 });
      rows.forEach(function (r, i) { r.style.transitionDelay = ''; io.observe(r); });
    }
  }

  /* Legacy anchors (#pods, #contract) open the collapsed commercial details */
  function openHash() {
    var id = location.hash.slice(1); if (!id) return;
    var el = document.getElementById(id); if (!el) return;
    var d = el.tagName === 'DETAILS' ? el : el.closest('details');
    if (d && !d.open) { d.open = true; el.scrollIntoView(); }
  }
  window.addEventListener('hashchange', openHash); openHash();

  /* Analytics: GA4 event for CTA clicks (does not interfere with the lead popup) */
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-cta]');
    if (a && window.gtag) window.gtag('event', 'enterprise_cta_click', { cta: a.getAttribute('data-cta'), page_path: location.pathname });
  });
})();
