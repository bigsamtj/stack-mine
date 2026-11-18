/* Stack18 Solutions pages: module tabs, sticky jump-nav offset and active state */
(function () {
  var hdr = document.querySelector('.site-header');
  function setTop() { if (hdr) document.documentElement.style.setProperty('--so-top', hdr.getBoundingClientRect().height + 'px'); }
  setTop(); window.addEventListener('resize', setTop);

  document.querySelectorAll('[data-so-tabs]').forEach(function (root) {
    var tabs = [].slice.call(root.querySelectorAll('[role="tab"]'));
    var panes = [].slice.call(root.querySelectorAll('[role="tabpanel"]'));
    if (!tabs.length) return;
    root.classList.add('js-tabs');
    function show(i, focus) {
      tabs.forEach(function (t, j) {
        var on = i === j;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        panes[j].hidden = !on;
      });
      if (focus) tabs[i].focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { show(i); });
      t.addEventListener('keydown', function (e) {
        var k = e.key, n = tabs.length;
        if (k === 'ArrowDown' || k === 'ArrowRight') { e.preventDefault(); show((i + 1) % n, true); }
        if (k === 'ArrowUp' || k === 'ArrowLeft') { e.preventDefault(); show((i - 1 + n) % n, true); }
        if (k === 'Home') { e.preventDefault(); show(0, true); }
        if (k === 'End') { e.preventDefault(); show(n - 1, true); }
      });
    });
    show(0);
  });

  var links = [].slice.call(document.querySelectorAll('.so-jump nav a'));
  if (links.length && 'IntersectionObserver' in window) {
    var map = {};
    links.forEach(function (a) { var s = document.querySelector(a.getAttribute('href')); if (s) map[s.id] = a; });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.isIntersecting && map[en.target.id]) {
          links.forEach(function (a) { a.classList.remove('on'); });
          map[en.target.id].classList.add('on');
          var nav = map[en.target.id].parentNode, a = map[en.target.id];
          if (nav.scrollWidth > nav.clientWidth) nav.scrollTo({ left: a.offsetLeft - 16, behavior: 'smooth' });
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(map).forEach(function (id) { io.observe(document.getElementById(id)); });
  }
})();
