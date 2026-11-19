/* HELIOS SYSTEMS — configuration-driven links and honest form handling.
   No dependencies. Loaded after site.config.js on every page. */
(function () {
  'use strict';
  var cfg = window.HELIOS_CONFIG || {};
  var doc = document;

  function val(path) {
    return path.split('.').reduce(function (o, k) { return o && typeof o === 'object' ? o[k] : ''; }, cfg) || '';
  }

  /* Configured links: keep the safe local fallback until a URL exists. */
  Array.prototype.forEach.call(doc.querySelectorAll('[data-config-href]'), function (el) {
    var url = val(el.getAttribute('data-config-href'));
    if (!url) return;
    el.setAttribute('href', url);
    if (/^https?:/i.test(url)) {
      el.setAttribute('target', '_blank');
      el.setAttribute('rel', 'noopener noreferrer');
    }
  });

  /* Configured contact details: reveal only when supplied. */
  Array.prototype.forEach.call(doc.querySelectorAll('[data-config-text]'), function (el) {
    var key = el.getAttribute('data-config-text');
    var v = val(key);
    if (v) {
      el.textContent = v;
      if (key === 'companyEmail') {
        var a = doc.createElement('a');
        a.href = 'mailto:' + v;
        a.textContent = v;
        el.textContent = '';
        el.appendChild(a);
      }
      el.removeAttribute('data-config-missing');
    }
  });
  Array.prototype.forEach.call(doc.querySelectorAll('[data-config-if]'), function (el) {
    el.hidden = !val(el.getAttribute('data-config-if'));
  });

  /* Current year in footers and legal copy. */
  Array.prototype.forEach.call(doc.querySelectorAll('[data-year]'), function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* Forms: validate, then either deliver (only if an endpoint is configured)
     or clearly state that nothing has been sent. Never fake success. */
  Array.prototype.forEach.call(doc.querySelectorAll('form[data-helios-form]'), function (form) {
    var status = form.querySelector('[data-form-status]');
    var submit = form.querySelector('button[type="submit"]');
    var original = submit ? submit.textContent : '';

    function setStatus(msg, kind) {
      if (!status) return;
      status.textContent = msg;
      status.className = 'hl-form-status' + (kind ? ' ' + kind : '');
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (typeof form.checkValidity === 'function' && !form.checkValidity()) {
        form.reportValidity();
        setStatus('Please complete the highlighted fields.', 'error');
        return;
      }

      var endpoint = form.getAttribute('data-endpoint') || cfg.contactEndpoint || '';
      if (!endpoint) {
        setStatus('This form is not yet connected to a mailbox. Nothing has been sent. Official contact details will be published when the HELIOS SYSTEMS domain is confirmed.', 'notice');
        return;
      }

      if (submit) { submit.disabled = true; submit.textContent = 'Sending…'; }
      setStatus('Sending…', '');

      fetch(endpoint, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      })
        .then(function (res) { return res.json().catch(function () { return {}; }).then(function (data) { return { ok: res.ok, data: data }; }); })
        .then(function (r) {
          if (r.ok && r.data && r.data.success === true) {
            setStatus('Thank you. Your message has been received.', '');
            form.reset();
          } else {
            setStatus((r.data && r.data.error) ? r.data.error : 'Your message could not be sent. Please try again.', 'error');
          }
        })
        .catch(function () {
          setStatus('Your message could not be sent. Please try again.', 'error');
        })
        .finally(function () {
          if (submit) { submit.disabled = false; submit.textContent = original; }
        });
    });
  });

  /* External links opened from editorial content get safe rel attributes. */
  Array.prototype.forEach.call(doc.querySelectorAll('main a[href^="http"]'), function (a) {
    if (a.hostname && a.hostname !== window.location.hostname) {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noopener noreferrer');
    }
  });

  /* Mark the current section in the local jump bar. */
  var jumpLinks = doc.querySelectorAll('.sk-jump a[href^="#"]');
  if (jumpLinks.length && 'IntersectionObserver' in window) {
    var map = {};
    Array.prototype.forEach.call(jumpLinks, function (a) {
      var id = a.getAttribute('href').slice(1);
      var t = doc.getElementById(id);
      if (t) map[id] = a;
    });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        Array.prototype.forEach.call(jumpLinks, function (l) { l.classList.remove('on'); });
        var a = map[en.target.id];
        if (a) a.classList.add('on');
      });
    }, { rootMargin: '-25% 0px -65% 0px' });
    Object.keys(map).forEach(function (id) { io.observe(doc.getElementById(id)); });
  }
})();
