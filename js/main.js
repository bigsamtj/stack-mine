(function () {
  var navToggle = document.getElementById('navToggle');
  var mobileNav = document.getElementById('mobileNav');

  if (navToggle && mobileNav) {
    navToggle.addEventListener('click', function () {
      var isOpen = mobileNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    mobileNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileNav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  window.addEventListener('resize', function () {
    if (window.innerWidth > 1023 && mobileNav) {
      mobileNav.classList.remove('open');
      if (navToggle) navToggle.setAttribute('aria-expanded', 'false');
    }
  });

  // ---- Real lead-capture submission for newsletter/waitlist forms ----
  // (delivers to the sales inbox via subscribe-handler.php)
  document.querySelectorAll('form[data-lead-form]').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var button = form.querySelector('button[type="submit"]');
      var originalText = button ? button.textContent : '';
      var statusEl = form.querySelector('[data-lead-form-status]');
      if (typeof form.checkValidity === 'function' && !form.checkValidity()) { form.reportValidity(); return; }

      if (button) {
        button.disabled = true;
        button.textContent = 'Sending…';
      }

      fetch(form.getAttribute('action'), {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      })
        .then(function (res) { return res.json().catch(function () { return { success: false }; }); })
        .then(function (data) {
          if (data && data.success) {
            if (statusEl) {
              statusEl.textContent = 'Thanks — you\'re on the list.';
              statusEl.style.color = 'var(--accent-ink, #4C3FCC)';
            }
            form.reset();
          } else if (statusEl) {
            statusEl.textContent = (data && data.error) ? data.error : 'Something went wrong. Please try again.';
            statusEl.style.color = '#B3261E';
          }
        })
        .catch(function () {
          if (statusEl) {
            statusEl.textContent = 'Something went wrong. Please try again.';
            statusEl.style.color = '#B3261E';
          }
        })
        .finally(function () {
          if (button) {
            button.disabled = false;
            button.textContent = originalText;
          }
          if (statusEl) {
            setTimeout(function () { statusEl.textContent = ''; }, 6000);
          }
        });
    });
  });

  // (CTA lead popup lives in /js/lead-popup.js)

  // ---- Real contact form submission (delivers to the sales inbox) ----
  var contactForm = document.getElementById('contact-form');
  if (contactForm) {
    // Show the Marketplace-specific fields only when that's what the
    // message is about, so the visible form always matches the inquiry.
    var reasonSelect = document.getElementById('reason');
    try {
      var pre = new URLSearchParams(location.search).get('reason');
      if (pre && reasonSelect && reasonSelect.querySelector('option[value="' + pre.replace(/[^a-z-]/g, '') + '"]')) reasonSelect.value = pre;
    } catch (e) {}
    var solutionsFields = document.getElementById('contact-solutions-fields');
    if (reasonSelect && solutionsFields) {
      var toggleSolutionsFields = function () {
        solutionsFields.style.display = reasonSelect.value === 'solutions' ? 'grid' : 'none';
      };
      reasonSelect.addEventListener('change', toggleSolutionsFields);
      toggleSolutionsFields();
    }

    var statusEl = document.getElementById('contact-form-status');
    var statusDefault = statusEl ? statusEl.textContent : '';

    // Company is optional for investor, ventures, community and similar enquiries (matches contact-handler.php)
    var companyInput = document.getElementById('company');
    var optionalCompany = ['investor', 'ventures', 'other', 'community', 'school', 'school-mentor', 'chatbot'];
    function syncCompany() { if (companyInput && reasonSelect) companyInput.required = optionalCompany.indexOf(reasonSelect.value) < 0; }
    if (reasonSelect) { reasonSelect.addEventListener('change', syncCompany); syncCompany(); }

    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (typeof contactForm.checkValidity === 'function' && !contactForm.checkValidity()) {
        contactForm.reportValidity();
        if (statusEl) { statusEl.textContent = 'Please complete the highlighted fields.'; statusEl.style.color = '#B3261E'; }
        return;
      }
      var button = contactForm.querySelector('button[type="submit"]');
      var originalText = button ? button.textContent : '';

      if (button) {
        button.disabled = true;
        button.textContent = 'Sending…';
      }
      if (statusEl) {
        statusEl.textContent = 'Sending your message…';
        statusEl.style.color = '';
      }

      fetch(contactForm.getAttribute('action'), {
        method: 'POST',
        body: new FormData(contactForm),
        headers: { 'Accept': 'application/json' }
      })
        .then(function (res) { return res.json().catch(function () { return { success: false }; }); })
        .then(function (data) {
          if (data && data.success) {
            if (statusEl) {
              statusEl.textContent = 'Thanks — your message is on its way. We typically reply within one business day.';
              statusEl.style.color = 'var(--accent-ink, #2E5AAC)';
            }
            contactForm.reset();
          } else {
            if (statusEl) {
              statusEl.textContent = (data && data.error) ? data.error : 'Something went wrong. Please try again or email hello@stack18.com directly.';
              statusEl.style.color = '#B3261E';
            }
          }
        })
        .catch(function () {
          if (statusEl) {
            statusEl.textContent = 'Something went wrong. Please try again or email hello@stack18.com directly.';
            statusEl.style.color = '#B3261E';
          }
        })
        .finally(function () {
          if (button) {
            button.disabled = false;
            button.textContent = originalText;
          }
          if (statusEl) {
            setTimeout(function () {
              statusEl.textContent = statusDefault;
              statusEl.style.color = '';
            }, 6000);
          }
        });
    });
  }
})();


// ---- Cookie consent (analytics) ----
// Google Analytics stays denied until the visitor accepts. The choice is
// stored in localStorage ('s18_consent' = granted | denied).
(function () {
  var KEY = 's18_consent';
  function read() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function save(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  function apply(v) {
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', { analytics_storage: v === 'granted' ? 'granted' : 'denied' });
    }
  }
  function close(el) { if (el && el.parentNode) el.parentNode.removeChild(el); }

  function show() {
    if (document.getElementById('cookieBanner')) return;
    var b = document.createElement('div');
    b.id = 'cookieBanner';
    b.className = 'cookie-banner';
    b.setAttribute('role', 'dialog');
    b.setAttribute('aria-label', 'Cookie preferences');
    b.innerHTML =
      '<p>We use analytics cookies to understand how this site is used. The site works the same either way. ' +
      '<a href="/privacy-policy#cookies">Privacy policy</a></p>' +
      '<div class="cookie-actions">' +
      '<button type="button" class="cookie-btn" data-consent="denied">Decline</button>' +
      '<button type="button" class="cookie-btn" data-consent="granted">Accept</button>' +
      '</div>';
    b.addEventListener('click', function (e) {
      var v = e.target && e.target.getAttribute && e.target.getAttribute('data-consent');
      if (!v) return;
      save(v); apply(v); close(b);
    });
    document.body.appendChild(b);
  }

  if (!read()) { if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', show); else show(); }
  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest ? e.target.closest('[data-cookie-settings]') : null;
    if (t) { e.preventDefault(); show(); }
  });
})();


// ---- Scroll reveal ----
// Adds a gentle fade-up to content blocks. Content stays in the HTML, so it is
// always crawlable, and nothing is hidden when JS or IntersectionObserver is missing.
(function () {
  if (!('IntersectionObserver' in window)) return;
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var SEL = 'main .a-sec:not(:first-of-type) .a-head, main .vx-case, main .ab-step, main .vx-rel, main .mk-frame, main .mk-n, main .team-card, main .ab-card, main .a-faq, main .a-table';
  function init() {
    var els = Array.prototype.slice.call(document.querySelectorAll(SEL));
    if (!els.length) return;
    document.documentElement.classList.add('rv-on');
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    els.forEach(function (el) {
      var sib = el.parentNode ? Array.prototype.indexOf.call(el.parentNode.children, el) : 0;
      el.style.setProperty('--rvd', Math.min(sib, 4) * 70 + 'ms');
      el.classList.add('rvl');
      io.observe(el);
    });
    setTimeout(function () { els.forEach(function (el) { el.classList.add('in'); }); }, 6000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();

// ---- Wide tables on small screens: say they scroll sideways ----
(function () {
  function mark() {
    document.querySelectorAll('.a-scroll, .so-cmp-wrap, .so-matrix-wrap').forEach(function (w) {
      var wide = w.scrollWidth > w.clientWidth + 4, hint = w.previousElementSibling;
      var has = hint && hint.classList.contains('scroll-hint');
      if (wide && !has) { var p = document.createElement('p'); p.className = 'scroll-hint'; p.setAttribute('aria-hidden', 'true'); p.textContent = 'Swipe sideways to see every column →'; w.parentNode.insertBefore(p, w); }
      else if (!wide && has) hint.remove();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mark); else mark();
  var t; window.addEventListener('resize', function () { clearTimeout(t); t = setTimeout(mark, 200); });
})();
