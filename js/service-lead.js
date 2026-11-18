/* Stack18 services pages: signal checker, goal finder and inline lead form */
(function () {
  // "Is this you?" signal checker
  document.querySelectorAll('[data-signals]').forEach(function (wrap) {
    var msg = wrap.parentNode.querySelector('[data-sig-msg]');
    var cta = wrap.parentNode.querySelector('[data-sig-cta]');
    var base = msg ? msg.textContent : '';
    wrap.addEventListener('click', function (e) {
      var b = e.target.closest('.vx-sig'); if (!b) return;
      b.setAttribute('aria-pressed', b.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
      var n = wrap.querySelectorAll('.vx-sig[aria-pressed="true"]').length;
      if (!msg) return;
      if (n === 0) msg.textContent = base;
      else if (n === 1) msg.textContent = 'One applies. Worth a 30-minute conversation to see if we can help.';
      else msg.textContent = n + ' apply. That is exactly the situation we solve. Let\u2019s talk.';
      if (cta) cta.classList.toggle('is-hot', n >= 2);
    });
  });

  // Goal finder tabs
  document.querySelectorAll('.vx-finder').forEach(function (f) {
    var tabs = f.querySelectorAll('.vx-goal'), panels = f.querySelectorAll('.vx-goal-panel');
    function show(i) {
      tabs.forEach(function (t) { t.setAttribute('aria-selected', t.dataset.goal === i ? 'true' : 'false'); });
      panels.forEach(function (p) { p.hidden = p.dataset.goal !== i; });
    }
    tabs.forEach(function (t) {
      t.addEventListener('click', function () { show(t.dataset.goal); });
      t.addEventListener('keydown', function (e) {
        var k = e.key, idx = Array.prototype.indexOf.call(tabs, t);
        if (k === 'ArrowRight' || k === 'ArrowDown') { e.preventDefault(); tabs[(idx + 1) % tabs.length].focus(); tabs[(idx + 1) % tabs.length].click(); }
        if (k === 'ArrowLeft' || k === 'ArrowUp') { e.preventDefault(); tabs[(idx - 1 + tabs.length) % tabs.length].focus(); tabs[(idx - 1 + tabs.length) % tabs.length].click(); }
      });
    });
  });

  // Inline lead form -> contact-handler.php (same pipeline as the contact page and popup)
  document.querySelectorAll('[data-svc-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var st = form.querySelector('.vx-st'), btn = form.querySelector('button[type=submit]');
      var bad = Array.prototype.filter.call(form.querySelectorAll('[required]'), function (f) { return !f.value.trim() || (f.type === 'email' && !/^\S+@\S+\.\S+$/.test(f.value)); });
      form.querySelectorAll('.is-bad').forEach(function (f) { f.classList.remove('is-bad'); });
      if (bad.length) { bad.forEach(function (f) { f.classList.add('is-bad'); }); bad[0].focus(); st.textContent = 'Please fill in the highlighted fields.'; return; }
      var fd = new FormData(form); fd.append('reason', form.getAttribute('data-reason') || 'services');
      btn.disabled = true; st.textContent = 'Sending\u2026';
      fetch('/contact-handler.php', { method: 'POST', body: fd, headers: { Accept: 'application/json' } })
        .then(function (r) { return r.json().catch(function () { return { success: false }; }); })
        .then(function (d) {
          if (d.success) { form.classList.add('is-sent'); st.textContent = form.getAttribute('data-done') || 'Thank you. A senior member of our team will reply within one business day.'; form.reset(); }
          else { st.textContent = d.error || 'Could not send. Please try again or email us.'; btn.disabled = false; }
        })
        .catch(function () { st.textContent = 'Could not send. Please try again or email us.'; btn.disabled = false; });
    });
  });
})();
