/* Sia: the Stack18 website AI advisor (short for Stack Intelligent Advisor; shown as "Sia")
   - Self-contained: renders inside a Shadow DOM, so it cannot affect site styles or SEO.
   - Answers are grounded in /chat/kb.json (built from the live site by build_chat_kb.py).
     If /chat-handler.php has a Claude API key it writes conversational answers from that same
     knowledge; otherwise the assistant answers directly from the knowledge base.
   - Leads go to /contact-handler.php (email + CRM), like every other form on the site.
   - WhatsApp handoff opens wa.me with a summary of the conversation, so nothing is asked twice. */
(function () {
  'use strict';
  if (window.__s18chat || /^\/crm(\/|$)/.test(location.pathname)) return;
  window.__s18chat = true;

  var CFG = {
    wa: '919529847724', waLabel: '+91 95298 47724', email: 'hello@stack18.com',
    api: '/chat-handler.php', lead: '/contact-handler.php', kb: '/chat/kb.json?v=20261115g'
  };
  var ONCONTACT = /^\/contact(\.html)?\/?$/.test(location.pathname);
  var REDUCED = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------ storage (never throws) */
  function sget(k, store) { try { var v = (store || sessionStorage).getItem(k); return v ? JSON.parse(v) : null; } catch (e) { return null; } }
  function sset(k, v, store) { try { (store || sessionStorage).setItem(k, JSON.stringify(v)); } catch (e) {} }
  function track(ev, p) { try { if (window.gtag) window.gtag('event', ev, p || {}); } catch (e) {} }

  /* ------------------------------------------------------------ verified site facts (used by flows) */
  var SOL = {
    'commerce-os': { n: 'Commerce OS', d: 'Storefront, marketplaces, WhatsApp, POS and warehouse on one order book.', p: '₹2.8L', w: '3–4 weeks' },
    'business-os': { n: 'Business OS', d: 'ERP for growing businesses: sales, purchase, stock, accounts, payroll and service.', p: '₹2.8L', w: '3–4 weeks' },
    'customer-os': { n: 'Customer OS', d: 'CRM: leads, WhatsApp, campaigns, support and loyalty on one customer record.', p: '₹1.6L', w: '3–4 weeks' },
    'supply-chain-os': { n: 'Supply Chain OS', d: 'Procurement, warehouses, production and distribution, with AI planning.', p: '₹2.3L', w: '4–5 weeks' },
    'finops-os': { n: 'FinOps OS', d: 'Payables, collections, reconciliation, GST and TDS with a live CFO view.', p: '₹2.4L', w: '3–4 weeks' },
    'ai-enterprise-os': { n: 'AI Enterprise OS', d: 'Private AI, knowledge and governed agents for every department.', p: '₹3.2L', w: '4–5 weeks' }
  };
  var BUDGET = ['Under ₹5L', '₹5–15L', '₹15–50L', '₹50L+', 'Not sure yet'];
  var TIMELINE = ['This month', '1–3 months', '3–6 months', 'Just exploring'];
  var STAGE = ['Just an idea', 'Scope is defined', 'Already in progress', 'Rescue or takeover'];
  var SIZES = ['1–10', '11–50', '51–200', '201–1,000', '1,000+'];
  var NEEDS = {
    'Web platform or portal': { svc: 'Web Development', u: '/services/web-development' },
    'Mobile app': { svc: 'Mobile App Development', u: '/services/mobile-app-development' },
    'ERP or business system': { sol: 'business-os', svc: 'Custom ERP', u: '/capabilities/custom-erp-development-company-india' },
    'CRM or sales system': { sol: 'customer-os', svc: 'CRM', u: '/capabilities/crm-software-for-small-business-india' },
    'E-commerce or D2C': { sol: 'commerce-os', svc: 'D2C e-commerce', u: '/capabilities/d2c-ecommerce-development-company-india' },
    'AI agent or automation': { sol: 'ai-enterprise-os', svc: 'AI Agents & Automation', u: '/services/ai-agents-automation' },
    'SaaS product or MVP': { svc: 'SaaS Product Development', u: '/services/saas-product-development' },
    'Modernise an old system': { svc: 'Legacy Modernization', u: '/services/legacy-modernization' },
    'Something else': { svc: 'Custom Software Development', u: '/services/custom-software-development' }
  };
  var PARTNERS = ['Technology partner', 'Implementation partner', 'Agency partner', 'Referral partner', 'Strategic / enterprise', 'Venture (CEO, investor)'];

  /* ------------------------------------------------------------ page context */
  function pageContext() {
    var p = location.pathname.replace(/\.html$/, '').replace(/\/index$/, '').replace(/\/$/, '') || '/';
    var h1 = document.querySelector('h1'); var title = (h1 ? h1.textContent : document.title).replace(/\s+/g, ' ').trim();
    var m;
    if ((m = p.match(/^\/solutions\/([a-z-]+)/)) && SOL[m[1]]) return { kind: 'solution', key: m[1], label: SOL[m[1]].n, path: p, title: title };
    if ((m = p.match(/^\/services\/([a-z-]+)/))) return { kind: 'service', label: title, path: p, title: title };
    if ((m = p.match(/^\/capabilities\/([a-z0-9-]+)/))) return { kind: 'capability', label: document.title.split(' | ')[0], path: p, title: title };
    if ((m = p.match(/^\/industries\/([a-z-]+)/))) return { kind: 'industry', label: document.title.split(' | ')[0], path: p, title: title };
    var map = { '/enterprise': 'enterprise', '/ventures': 'ventures', '/partnerships': 'partner', '/careers': 'careers', '/pricing': 'pricing', '/agentic-sdlc': 'platform', '/solutions': 'solutions', '/services': 'services' };
    return { kind: map[p] || 'general', path: p, title: title };
  }
  var PAGE = pageContext();

  /* ------------------------------------------------------------ state */
  var S = sget('s18chat') || { msgs: [], profile: {}, flow: null, step: 0, leadSent: false, opened: false };
  var P = S.profile;
  var saved = sget('s18chat_profile', localStorage);  // remembered contact details (same browser)
  if (saved) ['name', 'company', 'email', 'phone'].forEach(function (k) { if (!P[k] && saved[k]) P[k] = saved[k]; });
  function persist() {
    S.msgs = S.msgs.slice(-60); sset('s18chat', S);
    if (P.name || P.email || P.phone) sset('s18chat_profile', { name: P.name, company: P.company, email: P.email, phone: P.phone }, localStorage);
  }

  /* ------------------------------------------------------------ styles */
  var CSS = [
    ':host{all:initial}',
    '*{box-sizing:border-box}',
    '.s{--ink:#0B1426;--ink2:#15233F;--gold:#F2A93B;--gold-ink:#A85A00;--paper:#F7F4EE;--line:#E6E1D5;--muted:#5D6375;--wa:#25D366;font-family:Inter,"Inter Fallback",system-ui,-apple-system,"Segoe UI",sans-serif;color:#101524;font-size:15px;line-height:1.5;-webkit-font-smoothing:antialiased}',
    /* launcher */
    '.l{position:fixed;right:max(20px,env(safe-area-inset-right));bottom:max(20px,env(safe-area-inset-bottom));z-index:2147483000;display:flex;align-items:center;gap:10px;height:60px;padding:0 20px 0 8px;border:0;border-radius:999px;background:var(--ink);color:#fff;cursor:pointer;box-shadow:0 14px 34px -10px rgba(11,20,38,.55),0 0 0 1px rgba(242,169,59,.35) inset;font:600 14px/1 Inter,system-ui,sans-serif;transition:transform .2s ease,box-shadow .2s ease}',
    '.l:hover{transform:translateY(-2px);box-shadow:0 18px 40px -10px rgba(11,20,38,.6),0 0 0 1px rgba(242,169,59,.6) inset}',
    '.l:focus-visible{outline:3px solid var(--gold);outline-offset:3px}',
    '.l .av{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;background:radial-gradient(circle at 30% 25%,#ffd58a,#F2A93B 55%,#c9811c);color:var(--ink);position:relative}',
    '.l .av svg{width:22px;height:22px}',
    '.l .av::after{content:"";position:absolute;right:1px;bottom:1px;width:11px;height:11px;border-radius:50%;background:#2fd27a;border:2px solid var(--ink)}',
    '.l .tx{display:flex;flex-direction:column;align-items:flex-start;gap:3px}.l .tx small{font-weight:500;font-size:11.5px;color:#aeb6c8}',
    '.l.mini{padding:0 8px;width:60px;justify-content:center}.l.mini .tx{display:none}',
    '.l .dot{position:absolute;top:6px;left:40px;width:12px;height:12px;border-radius:50%;background:#ff5a5f;border:2px solid var(--ink);display:none}.l.unread .dot{display:block}',
    '.l.hide{transform:scale(.6);opacity:0;pointer-events:none}',
    /* teaser */
    '.t{position:fixed;right:max(20px,env(safe-area-inset-right));bottom:calc(max(20px,env(safe-area-inset-bottom)) + 74px);z-index:2147483000;max-width:290px;padding:14px 38px 14px 16px;border-radius:16px 16px 4px 16px;background:#fff;color:#101524;box-shadow:0 18px 40px -12px rgba(11,20,38,.35);border:1px solid var(--line);font-size:14px;line-height:1.45;cursor:pointer;animation:pop .35s ease both}',
    '.t b{display:block;margin-bottom:2px}.t button{position:absolute;top:6px;right:6px;width:26px;height:26px;border:0;background:none;color:var(--muted);font-size:18px;cursor:pointer;border-radius:50%}.t button:hover{background:var(--paper)}',
    /* panel */
    '.p{position:fixed;right:max(20px,env(safe-area-inset-right));bottom:max(20px,env(safe-area-inset-bottom));z-index:2147483001;width:410px;height:min(700px,calc(100vh - 40px));display:flex;flex-direction:column;background:#fff;border-radius:22px;overflow:hidden;box-shadow:0 40px 90px -20px rgba(11,20,38,.55),0 0 0 1px rgba(11,20,38,.06);transform-origin:bottom right;animation:open .32s cubic-bezier(.2,.8,.2,1) both}',
    '.p[hidden]{display:none}',
    '@keyframes open{from{opacity:0;transform:translateY(16px) scale(.96)}to{opacity:1;transform:none}}',
    '@keyframes pop{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:none}}',
    '.h{position:relative;display:flex;align-items:center;gap:12px;padding:16px 14px 16px 16px;background:linear-gradient(135deg,#0B1426,#1a2a4d);color:#fff}',
    '.h::after{content:"";position:absolute;inset:auto -60px -80px auto;width:220px;height:220px;background:radial-gradient(circle,rgba(242,169,59,.28),transparent 65%);pointer-events:none}',
    '.h .av{flex:none;width:42px;height:42px;border-radius:12px;display:grid;place-items:center;background:var(--gold);color:var(--ink);font:800 13px/1 Inter,sans-serif;letter-spacing:-.02em}',
    '.h .ti{flex:1;min-width:0}.h .ti b{display:block;font-size:15.5px;font-family:Lora,Georgia,serif;font-weight:600}',
    '.h .ti small{display:flex;align-items:center;gap:6px;color:#b7bfd2;font-size:12px}.h .ti small i{width:7px;height:7px;border-radius:50%;background:#2fd27a;display:inline-block}',
    '.h .ib{position:relative;z-index:1;width:36px;height:36px;border:0;border-radius:10px;background:rgba(255,255,255,.08);color:#fff;display:grid;place-items:center;cursor:pointer}',
    '.h .ib:hover{background:rgba(255,255,255,.16)}.h .ib:focus-visible{outline:2px solid var(--gold)}.h .ib svg{width:18px;height:18px}',
    '.m{flex:1;overflow-y:auto;padding:18px 16px 8px;background:linear-gradient(#fff,#fbfaf7);scroll-behavior:smooth;overscroll-behavior:contain}',
    '.r{display:flex;gap:8px;margin:0 0 12px;animation:pop .28s ease both}',
    '.r.u{justify-content:flex-end}',
    '.r .ba{flex:none;width:28px;height:28px;border-radius:9px;background:var(--ink);color:var(--gold);display:grid;place-items:center;font:800 10px/1 Inter,sans-serif;margin-top:2px}',
    '.b{max-width:84%;padding:11px 14px;border-radius:16px 16px 16px 6px;background:var(--paper);border:1px solid #eee8db;font-size:14.5px;line-height:1.55;overflow-wrap:anywhere}',
    '.r.u .b{background:var(--ink);color:#fff;border-color:var(--ink);border-radius:16px 16px 6px 16px}',
    '.b a{color:var(--gold-ink);font-weight:600}.r.u .b a{color:#ffd58a}',
    '.b p{margin:0 0 8px}.b p:last-child{margin:0}.b ul{margin:6px 0 8px;padding-left:18px}.b li{margin:3px 0}',
    '.b .src{display:block;margin-top:8px;padding-top:8px;border-top:1px dashed #e0d8c6;font-size:12px;color:var(--muted)}.b .src a{font-weight:600}',
    '.ty{display:inline-flex;gap:4px;padding:14px 16px}.ty i{width:7px;height:7px;border-radius:50%;background:#b9b2a2;animation:bl 1.2s infinite}.ty i:nth-child(2){animation-delay:.15s}.ty i:nth-child(3){animation-delay:.3s}',
    '@keyframes bl{0%,60%,100%{opacity:.35;transform:translateY(0)}30%{opacity:1;transform:translateY(-3px)}}',
    /* welcome */
    '.w{padding:4px 2px 6px}.w h3{margin:2px 0 6px;font:600 21px/1.25 Lora,Georgia,serif;color:var(--ink)}.w p{margin:0 0 14px;color:var(--muted);font-size:14px}',
    '.g{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px}',
    '.g button{display:flex;flex-direction:column;align-items:flex-start;gap:6px;padding:12px;border:1px solid var(--line);border-radius:14px;background:#fff;text-align:left;cursor:pointer;font:600 13.5px/1.3 Inter,sans-serif;color:var(--ink);transition:border-color .2s,transform .2s,box-shadow .2s}',
    '.g button:hover{border-color:var(--gold);transform:translateY(-1px);box-shadow:0 10px 22px -16px rgba(11,20,38,.5)}',
    '.g button span{font-weight:400;font-size:12px;color:var(--muted)}.g button i{width:28px;height:28px;border-radius:8px;background:#FBF1DF;color:var(--gold-ink);display:grid;place-items:center;font-style:normal}.g button i svg{width:16px;height:16px}',
    '.pg{margin:0 0 12px;padding:10px 12px;border-radius:12px;background:#FBF1DF;color:#5a3a06;font-size:13px}',
    /* cards */
    '.c{margin:2px 0 12px 36px;border:1px solid var(--line);border-radius:16px;background:#fff;overflow:hidden;animation:pop .28s ease both}',
    '.c .ch{padding:12px 14px 8px}.c .ch small{font-size:10.5px;letter-spacing:.1em;text-transform:uppercase;font-weight:700;color:var(--gold-ink)}.c .ch b{display:block;font:600 16px/1.3 Lora,Georgia,serif;color:var(--ink);margin-top:2px}',
    '.c .cd{padding:0 14px 10px;color:var(--muted);font-size:13.5px}',
    '.c dl{margin:0;display:grid;grid-template-columns:1fr 1fr;border-top:1px solid var(--line)}.c dl div{padding:9px 14px}.c dl div+div{border-left:1px solid var(--line)}.c dt{font-size:10.5px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);font-weight:700}.c dd{margin:2px 0 0;font-weight:700;color:var(--ink);font-size:14px}',
    '.c .ca{display:flex;gap:8px;padding:10px 14px;border-top:1px solid var(--line);background:#fcfbf8}.c .ca a{font-size:13px;font-weight:600;color:var(--gold-ink);text-decoration:none}.c .ca a:hover{text-decoration:underline}',
    /* summary */
    '.sm{margin:2px 0 12px 36px;padding:12px 14px;border-radius:14px;background:#fff;border:1px dashed #d8cfb9;font-size:13px}.sm b{display:block;font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--gold-ink);margin-bottom:6px}.sm div{display:flex;gap:8px;padding:3px 0}.sm span{color:var(--muted);min-width:78px}',
    /* chips */
    '.q{display:flex;flex-wrap:wrap;gap:6px;padding:8px 14px 2px;background:#fbfaf7;max-height:132px;overflow-y:auto}',
    '.q:empty{display:none}',
    '.q button{padding:8px 13px;border-radius:999px;border:1px solid #e3dccb;background:#fff;color:var(--ink);font:600 13px/1.2 Inter,sans-serif;cursor:pointer;transition:all .15s;animation:pop .25s ease both}',
    '.q button:hover{border-color:var(--gold);background:#FBF1DF}.q button.sel{background:var(--ink);color:#fff;border-color:var(--ink)}.q button.go{background:var(--gold);border-color:var(--gold)}',
    '.q button.skip{border-style:dashed;color:var(--muted)}',
    /* actions + composer */
    '.a{display:flex;gap:8px;padding:8px 14px;background:#fbfaf7}',
    '.a button{flex:1;display:flex;align-items:center;justify-content:center;gap:7px;height:38px;border-radius:11px;font:600 13px/1 Inter,sans-serif;cursor:pointer;border:1px solid var(--ink);background:#fff;color:var(--ink)}',
    '.a button.wa{background:var(--wa);border-color:var(--wa);color:#073b1d}.a button svg{width:16px;height:16px}',
    '@media (max-width:420px){.a .lg{display:none}}',
    '.a button:hover{filter:brightness(.97)}.a button:focus-visible{outline:2px solid var(--gold);outline-offset:2px}',
    '.f{display:flex;align-items:flex-end;gap:8px;padding:10px 12px 8px;border-top:1px solid var(--line);background:#fff}',
    '.f textarea{flex:1;resize:none;max-height:110px;min-height:42px;padding:11px 14px;border:1px solid var(--line);border-radius:14px;font:15px/1.4 Inter,system-ui,sans-serif;color:#101524;background:#fbfaf7;outline:none}',
    '.f textarea:focus{border-color:var(--gold);background:#fff;box-shadow:0 0 0 3px rgba(242,169,59,.18)}',
    '.f .sd{flex:none;width:42px;height:42px;border:0;border-radius:12px;background:var(--gold);color:var(--ink);display:grid;place-items:center;cursor:pointer}.f .sd:disabled{opacity:.5;cursor:default}.f .sd svg{width:18px;height:18px}',
    '.ft{padding:0 14px 10px;background:#fff;font-size:11px;color:#8a8f9d;text-align:center}.ft a{color:#6b7182}',
    '.err{color:#b42318}',
    '@media (max-width:560px){.p{inset:0;width:100%;height:100%;border-radius:0}.l{height:56px;right:max(14px,env(safe-area-inset-right));bottom:max(14px,env(safe-area-inset-bottom))}.l .tx{display:none}.l{padding:0 6px;width:56px;justify-content:center}.t{right:14px;bottom:84px;max-width:calc(100vw - 28px)}.g{grid-template-columns:1fr 1fr}.b{max-width:88%}}',
    '@media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}'
  ].join('');

  /* ------------------------------------------------------------ icons */
  var IC = {
    chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.4A8 8 0 1 1 21 12z"/><path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    min: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 12h12"/></svg>',
    reset: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>',
    send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    wa: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.1-1.8-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.8 1-.9 1.2-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.4-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.5.2-.7.2-1.3.2-1.5-.1-.1-.3-.2-.6-.3zM12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z"/></svg>',
    team: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8"/></svg>',
    code: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 18l6-6-6-6M8 6l-6 6 6 6"/></svg>',
    grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>',
    spark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/></svg>',
    hand: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 17l2 2a1 1 0 1 0 3-3"/><path d="M14 14l2.5 2.5a1 1 0 1 0 3-3l-3.88-3.88a3 3 0 0 0-4.24 0l-.88.88a1 1 0 1 1-3-3l2.81-2.81a5.79 5.79 0 0 1 7.06-.87l.47.28a2 2 0 0 0 1.42.25L21 4"/><path d="M21 3l1 11h-2M3 3L2 14l6.5 6.5a1 1 0 1 0 3-3M3 4h8"/></svg>'
  };

  /* ------------------------------------------------------------ DOM */
  var host = document.createElement('div');
  host.id = 's18-chat'; host.setAttribute('data-nosnippet', '');
  var root = host.attachShadow ? host.attachShadow({ mode: 'open' }) : host;
  root.innerHTML = '<style>' + CSS + '</style><div class="s">' +
    '<button class="l" type="button" aria-haspopup="dialog" aria-expanded="false" aria-controls="s18p"><span class="av">' + IC.chat + '</span><span class="tx">Ask Sia<small>Answers in seconds</small></span><span class="dot"></span></button>' +
    '<section class="p" id="s18p" role="dialog" aria-modal="false" aria-label="Chat with Sia, the Stack18 AI advisor" hidden>' +
      '<header class="h"><span class="av" aria-hidden="true">Sia</span><div class="ti"><b title="Sia, the Stack Intelligent Advisor">Sia</b><small><i></i>AI advisor · Online now</small></div>' +
      '<button class="ib rs" type="button" aria-label="Start a new conversation" title="Start over">' + IC.reset + '</button>' +
      '<button class="ib wa1" type="button" aria-label="Continue on WhatsApp" title="Continue on WhatsApp">' + IC.wa + '</button>' +
      '<button class="ib x" type="button" aria-label="Close chat" title="Close">' + IC.min + '</button></header>' +
      '<div class="m" role="log" aria-live="polite" aria-relevant="additions"></div>' +
      '<div class="q" aria-label="Suggested replies"></div>' +
      '<div class="a"><button type="button" class="tm">' + IC.team + 'Talk to our team</button><button type="button" class="wa">' + IC.wa + '<span class="lg">Continue on </span>WhatsApp</button></div>' +
      '<form class="f" autocomplete="on"><label for="s18in" style="position:absolute;left:-9999px">Your message</label><textarea id="s18in" rows="1" placeholder="Ask Sia anything about Stack18…" maxlength="1200"></textarea><button class="sd" type="submit" aria-label="Send">' + IC.send + '</button></form>' +
      '<div class="ft">AI answers come from stack18.com and may miss details. <a href="/privacy-policy" target="_blank" rel="noopener">Privacy</a></div>' +
    '</section></div>';
  function $(s) { return root.querySelector(s); }
  var L = $('.l'), PN = $('.p'), M = $('.m'), Q = $('.q'), IN = $('textarea'), FORM = $('.f');

  // keep the existing WhatsApp button visible, stacked above the assistant launcher
  var st = document.createElement('style');
  st.textContent = '.wa-float{bottom:calc(max(20px,env(safe-area-inset-bottom)) + 74px)!important}@media (max-width:560px){.wa-float{bottom:calc(max(14px,env(safe-area-inset-bottom)) + 68px)!important}}body.s18chat-open .wa-float{display:none!important}';
  document.head.appendChild(st);

  function mount() { document.body.appendChild(host); boot(); }
  if (document.body) mount(); else document.addEventListener('DOMContentLoaded', mount);

  /* ------------------------------------------------------------ rendering */
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function safeUrl(u) {
    u = String(u || '').trim();
    if (/^\/(?!\/)[\w\-\/#.?=&%]*$/.test(u)) return u;
    if (/^https:\/\/(www\.)?stack18\.com(\/|$)/.test(u)) return u.replace(/^https:\/\/(www\.)?stack18\.com/, '') || '/';
    if (/^https:\/\/wa\.me\//.test(u) || /^mailto:[\w.+-]+@stack18\.com$/.test(u)) return u;
    return null;
  }
  function md(text) {
    var lines = esc(text).split(/\n/), out = [], list = null;
    lines.forEach(function (ln) {
      ln = ln.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (m, t, u) {
        var s = safeUrl(u.replace(/&amp;/g, '&')); if (!s) return t;
        var ext = /^https?:|^mailto:/.test(s); return '<a href="' + esc(s) + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>' + t + '</a>';
      });
      if (/^\s*[-•]\s+/.test(ln)) { if (!list) { list = []; } list.push('<li>' + ln.replace(/^\s*[-•]\s+/, '') + '</li>'); return; }
      if (list) { out.push('<ul>' + list.join('') + '</ul>'); list = null; }
      if (ln.trim()) out.push('<p>' + ln + '</p>');
    });
    if (list) out.push('<ul>' + list.join('') + '</ul>');
    return out.join('');
  }
  function scroll() { requestAnimationFrame(function () { M.scrollTop = M.scrollHeight; }); }
  function addRow(who, html, store) {
    var r = document.createElement('div'); r.className = 'r ' + (who === 'u' ? 'u' : 'bt');
    r.innerHTML = (who === 'u' ? '' : '<span class="ba" aria-hidden="true">Sia</span>') + '<div class="b">' + html + '</div>';
    M.appendChild(r); scroll();
    if (store) { S.msgs.push(store); persist(); }
    return r;
  }
  function userSay(t) { addRow('u', esc(t), { w: 'u', t: t }); }
  function botNow(t, src) {
    var html = md(t); if (src && src.length) html += '<span class="src">From: ' + src.map(function (s) { var u = safeUrl(s.u); return u ? '<a href="' + esc(u) + '">' + esc(s.t) + '</a>' : ''; }).join(' · ') + '</span>';
    addRow('b', html, { w: 'b', t: t, src: src || null });
  }
  var typingEl = null;
  function typing(on) {
    if (on && !typingEl) { typingEl = document.createElement('div'); typingEl.className = 'r bt'; typingEl.innerHTML = '<span class="ba" aria-hidden="true">Sia</span><div class="b ty" aria-label="Sia is typing"><i></i><i></i><i></i></div>'; M.appendChild(typingEl); scroll(); }
    if (!on && typingEl) { typingEl.remove(); typingEl = null; }
  }
  var queue = Promise.resolve();
  function bot(t, opts) {   // queued, with a short human-feeling typing delay
    opts = opts || {};
    queue = queue.then(function () {
      typing(true);
      var d = REDUCED ? 120 : Math.min(1100, 350 + t.length * 6);
      return new Promise(function (res) { setTimeout(function () { typing(false); botNow(t, opts.src); if (opts.card) opts.card(); res(); }, d); });
    });
    return queue;
  }
  function card(html, store) {
    var c = document.createElement('div'); c.className = 'c'; c.innerHTML = html; M.appendChild(c); scroll();
    if (store) { S.msgs.push({ w: 'c', h: html }); persist(); }
  }
  function solCard(key) {
    var s = SOL[key]; if (!s) return;
    var h = '<div class="ch"><small>Ready-made solution</small><b>' + esc(s.n) + '</b></div><div class="cd">' + esc(s.d) + '</div>' +
      '<dl><div><dt>Launch edition from</dt><dd>' + s.p + ' one-time</dd></div><div><dt>Typical go-live</dt><dd>' + s.w + '</dd></div></dl>' +
      '<div class="ca"><a href="/solutions/' + key + '">Explore ' + esc(s.n) + ' →</a><a href="/pricing">See pricing</a></div>';
    card(h, true);
  }
  function linkCard(kick, title, desc, links) {
    var h = '<div class="ch"><small>' + esc(kick) + '</small><b>' + esc(title) + '</b></div><div class="cd">' + esc(desc) + '</div><div class="ca">' +
      links.map(function (l) { return '<a href="' + esc(l[1]) + '">' + esc(l[0]) + '</a>'; }).join('') + '</div>';
    card(h, true);
  }
  function summaryCard() {
    var rows = summaryRows(); if (!rows.length) return;
    card('<div class="sm" style="margin:0;border:0"><b>Your brief so far</b>' + rows.map(function (r) { return '<div><span>' + esc(r[0]) + '</span><strong>' + esc(r[1]) + '</strong></div>'; }).join('') + '</div>', true);
  }

  /* chips */
  var chipHandler = null, multi = null;
  function chips(list, onPick, opt) {
    opt = opt || {}; Q.innerHTML = ''; chipHandler = onPick; multi = opt.multi ? [] : null;
    list.forEach(function (c, i) {
      var b = document.createElement('button'); b.type = 'button';
      var label = typeof c === 'string' ? c : c.l; b.textContent = label;
      if (c.cls) b.className = c.cls;
      b.style.animationDelay = (REDUCED ? 0 : i * 30) + 'ms';
      b.addEventListener('click', function () {
        if (multi) { var k = multi.indexOf(label); if (k < 0) { multi.push(label); b.classList.add('sel'); } else { multi.splice(k, 1); b.classList.remove('sel'); } return; }
        Q.innerHTML = ''; chipHandler && chipHandler(c.v || label, label);
      });
      Q.appendChild(b);
    });
    if (opt.multi) {
      var d = document.createElement('button'); d.type = 'button'; d.className = 'go'; d.textContent = 'Done';
      d.addEventListener('click', function () { var v = multi.length ? multi.join(', ') : 'Not sure yet'; Q.innerHTML = ''; chipHandler && chipHandler(v, v); });
      Q.appendChild(d);
    }
    if (opt.skip) { var s = document.createElement('button'); s.type = 'button'; s.className = 'skip'; s.textContent = opt.skip; s.addEventListener('click', function () { Q.innerHTML = ''; chipHandler && chipHandler('', opt.skip); }); Q.appendChild(s); }
    scroll();
  }
  function clearChips() { Q.innerHTML = ''; chipHandler = null; multi = null; }

  /* ------------------------------------------------------------ open / close */
  function setOpen(on) {
    PN.hidden = !on; L.classList.toggle('hide', on); L.setAttribute('aria-expanded', on ? 'true' : 'false');
    document.body.classList.toggle('s18chat-open', on);
    var t = $('.t'); if (t) t.remove();
    L.classList.remove('unread');
    if (on) {
      if (!S.opened) { S.opened = true; persist(); track('chat_open', { page_path: location.pathname }); }
      if (!M.childElementCount) restore();
      setTimeout(function () { if (!window.matchMedia('(max-width:560px)').matches) IN.focus(); }, 60);
    } else { L.focus({ preventScroll: true }); }
    sset('s18chat_open', on);
  }

  /* ------------------------------------------------------------ welcome + restore */
  function pageLine() {
    if (PAGE.kind === 'solution') return 'You are looking at <b>' + esc(PAGE.label) + '</b>. I can explain what it includes, the editions and pricing, or get you a quote.';
    if (PAGE.kind === 'service' || PAGE.kind === 'capability') return 'You are reading about <b>' + esc(PAGE.label) + '</b>. Ask me anything about it, or let me help you scope a first step.';
    if (PAGE.kind === 'industry') return 'You are on <b>' + esc(PAGE.label) + '</b>. I can show what Stack18 builds for businesses like yours.';
    if (PAGE.kind === 'enterprise') return 'Planning an enterprise AI transformation? I can explain Transformation Pods and help you book a leadership briefing.';
    if (PAGE.kind === 'pricing') return 'Questions about pricing? I can explain editions, what is included and how custom work is priced.';
    if (PAGE.kind === 'partner') return 'Interested in partnering? I can match you to the right partnership path.';
    if (PAGE.kind === 'ventures') return 'Curious about Stack Ventures? I can explain the five-stage model and the CEO and co-founder roles.';
    if (PAGE.kind === 'careers') return 'Looking at careers? I can tell you how to share your profile or register for internships.';
    return '';
  }
  function welcome() {
    var who = P.name ? ' ' + esc(P.name.split(' ')[0]) : '';
    var pl = pageLine();
    var w = document.createElement('div'); w.className = 'w';
    w.innerHTML = '<h3>Hi' + who + ', I\u2019m Sia. How can I help?</h3><p>I\u2019m Stack18\u2019s AI advisor. I can answer questions about our services, solutions and pricing, help you scope a project, and connect you with the team on WhatsApp.</p>' +
      (pl ? '<div class="pg">' + pl + '</div>' : '') +
      '<div class="g">' +
      '<button type="button" data-f="project"><i>' + IC.code + '</i>Scope a software project<span>Web, app, ERP, CRM or custom</span></button>' +
      '<button type="button" data-f="solutions"><i>' + IC.grid + '</i>Explore ready-made systems<span>From ₹1.6L, live in weeks</span></button>' +
      '<button type="button" data-f="ai"><i>' + IC.spark + '</i>Plan AI for my business<span>Agents, automation, enterprise</span></button>' +
      '<button type="button" data-f="partner"><i>' + IC.hand + '</i>Partner with Stack18<span>Six partnership paths</span></button>' +
      '</div>';
    M.appendChild(w);
    w.querySelectorAll('button[data-f]').forEach(function (b) { b.addEventListener('click', function () { userSay(b.childNodes[1].textContent); startFlow(b.getAttribute('data-f')); }); });
    homeChips();
  }
  function homeChips() {
    var list = [];
    if (PAGE.kind === 'solution') list.push({ l: 'Get a quote for ' + PAGE.label, v: 'quote:' + PAGE.key });
    list = list.concat(['How does pricing work?', 'What is the Agentic SDLC?', 'Enterprise Transformation Pods', 'Where is Stack18 based?', 'Careers', 'Stack Ventures']);
    chips(list, function (v, l) { userSay(l); if (v.indexOf('quote:') === 0) { startFlow('quote', v.slice(6)); return; } route(l); });
  }
  function restore() {
    welcome();
    if (!S.msgs.length) return;
    S.msgs.forEach(function (m) {
      if (m.w === 'u') addRow('u', esc(m.t));
      else if (m.w === 'b') { var html = md(m.t); if (m.src && m.src.length) html += '<span class="src">From: ' + m.src.map(function (s) { var u = safeUrl(s.u); return u ? '<a href="' + esc(u) + '">' + esc(s.t) + '</a>' : ''; }).join(' · ') + '</span>'; addRow('b', html); }
      else if (m.w === 'c') { var c = document.createElement('div'); c.className = 'c'; c.innerHTML = m.h; M.appendChild(c); }
    });
    if (S.flow) resumeFlow(); else afterAnswerChips();
    scroll();
  }
  function resetAll() {
    S = { msgs: [], profile: {}, flow: null, step: 0, leadSent: false, opened: true }; P = S.profile;
    var sv = sget('s18chat_profile', localStorage); if (sv) ['name', 'company', 'email', 'phone'].forEach(function (k) { if (sv[k]) P[k] = sv[k]; });
    persist(); M.innerHTML = ''; clearChips(); welcome();
  }

  /* ------------------------------------------------------------ flows (lead qualification) */
  // A flow is a list of steps; each step asks for one field. Already-known fields are skipped,
  // so nothing is asked twice — including after a page change.
  var FLOWS = {
    project: { reason: 'services', topic: 'Software project', steps: [
      { k: 'need', ask: 'What would you like to build?', chips: Object.keys(NEEDS) },
      { k: 'details', ask: 'In a sentence or two, what should it do and who will use it?', free: true, skip: 'Skip for now' },
      { k: 'stage', ask: 'Where are you today?', chips: STAGE },
      { k: 'timeline', ask: 'When would you like it live?', chips: TIMELINE },
      { k: 'budget', ask: 'Do you have a budget range in mind? It helps us suggest the right starting point.', chips: BUDGET },
      { recommend: true }, 'contact'] },
    ai: { reason: 'services', topic: 'AI for business', steps: [
      { k: 'size', ask: 'How large is your organisation?', chips: SIZES },
      { k: 'ai_areas', ask: 'Where could AI help most? Pick all that apply.', chips: ['Customer support', 'Sales', 'Finance', 'HR', 'Operations', 'Knowledge & documents'], multi: true },
      { k: 'ai_maturity', ask: 'Where are you with AI today?', chips: ['Not started', 'Experimenting', 'Pilots running', 'In production'] },
      { k: 'ai_scope', ask: 'What scope are you thinking of?', chips: ['One use case first', 'Several departments', 'Company-wide programme'] },
      { k: 'budget', ask: 'Is there a budget range for this?', chips: BUDGET },
      { recommend: true }, 'contact'] },
    quote: { reason: 'solutions', topic: 'Solution quote', steps: [
      { k: 'solution', ask: 'Which solution would you like a quote for?', chips: Object.keys(SOL).map(function (k) { return { l: SOL[k].n, v: k }; }) },
      { k: 'edition', ask: 'Which edition fits? Launch is the fastest start; Grow and Scale add modules.', chips: ['Launch', 'Grow', 'Scale', 'Not sure yet'] },
      { k: 'size', ask: 'How many people work in the business?', chips: SIZES },
      { k: 'timeline', ask: 'When would you like to go live?', chips: TIMELINE },
      'contact'] },
    partner: { reason: 'partnerships', topic: 'Partnership', steps: [
      { k: 'partner_type', ask: 'Which partnership path fits you best?', chips: PARTNERS },
      { k: 'company', ask: 'What is your company called?', free: true, ph: 'Company name' },
      { k: 'details', ask: 'Briefly, what do you do and what would you like to build together?', free: true, skip: 'Skip for now' },
      'contact'] },
    enterprise: { reason: 'enterprise', topic: 'Enterprise AI transformation', steps: [
      { k: 'size', ask: 'How large is the organisation?', chips: ['201–1,000', '1,000–5,000', '5,000+', 'Smaller'] },
      { k: 'pod', ask: 'Which shape sounds closest? Foundation (6–8 specialists), Scale (12–20) or Enterprise (25+).', chips: ['Foundation Pod', 'Scale Pod', 'Enterprise Pod', 'Not sure yet'] },
      { k: 'details', ask: 'What is the main outcome you want from AI and modernisation in the next year?', free: true, skip: 'Skip for now' },
      { recommend: true }, 'contact'] },
    team: { reason: 'chatbot', topic: 'Talk to the team', steps: [
      { k: 'need', ask: 'Sure. What would you like to talk to the team about?', free: true, ph: 'A line about what you need' },
      'contact'] }
  };
  var CONTACT = [
    { k: 'name', ask: 'Great. What is your name?', free: true, ph: 'Your name', v: function (x) { return x.length >= 2 || 'Please share your name.'; } },
    { k: 'company', ask: 'And your company? (Type “individual” if it is just you.)', free: true, ph: 'Company name' },
    { k: 'email', ask: 'What is the best email for the proposal?', free: true, ph: 'name@company.com', type: 'email', v: function (x) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(x) || 'That email does not look right. Could you check it?'; } },
    { k: 'phone', ask: 'And a WhatsApp number, so the team can reach you quickly?', free: true, ph: '+91 98xxxxxxx', type: 'tel', skip: 'Prefer email only', v: function (x) { var d = x.replace(/[^\d]/g, ''); return (d.length >= 10 && d.length <= 13) || 'Please enter a valid mobile number with country code if outside India.'; } }
  ];

  function startFlow(name, preset) {
    if (name === 'solutions') { solutionsMenu(); return; }
    if (name === 'careers') { info('careers'); return; }
    if (name === 'ventures') { info('ventures'); return; }
    S.flow = name; S.step = 0; P.topic = FLOWS[name].topic; P.reason = FLOWS[name].reason;
    if (name === 'quote' && preset) P.solution = preset;
    if (name === 'project' && preset) P.need = preset;
    persist(); track('chat_flow_start', { flow: name });
    var intro = { project: 'Happy to help you scope it. A few quick questions, then I will suggest the right starting point.', ai: 'Let us find where AI will pay off first. Four quick questions.', quote: 'I can prepare a quote request for the team.', partner: 'Stack18 has six partnership paths. Let us find yours.', enterprise: 'Transformation Pods are dedicated senior teams on 12 to 36 month contracts, staffed within 30 days. A few questions to point you right.', team: '' }[name];
    if (intro) bot(intro);
    nextStep();
  }
  function flowSteps() { var f = FLOWS[S.flow]; var out = []; f.steps.forEach(function (s) { if (s === 'contact') out = out.concat(CONTACT); else out.push(s); }); return out; }
  function nextStep() {
    var steps = flowSteps();
    while (S.step < steps.length) {
      var s = steps[S.step];
      if (s.recommend) { recommend(); S.step++; persist(); continue; }
      if (P[s.k] !== undefined && P[s.k] !== null && (P[s.k] !== '' || s.skip)) { S.step++; continue; }
      ask(s); persist(); return;
    }
    finishFlow();
  }
  function resumeFlow() { var steps = flowSteps(); var s = steps[S.step]; if (s && !s.recommend) { askChips(s); setPlaceholder(s); } }
  function setPlaceholder(s) { IN.placeholder = s && s.ph ? s.ph : 'Type your answer…'; IN.inputMode = s && s.type === 'email' ? 'email' : s && s.type === 'tel' ? 'tel' : 'text'; }
  function ask(s) { bot(s.ask).then(function () { askChips(s); setPlaceholder(s); if (s.free && !window.matchMedia('(max-width:560px)').matches) IN.focus(); }); }
  function askChips(s) {
    if (s.chips) chips(s.chips, function (v, l) { userSay(l); answerStep(s, v, l); }, { multi: s.multi, skip: s.skip });
    else if (s.skip) chips([], function (v, l) { userSay(l); answerStep(s, '', l); }, { skip: s.skip });
    else clearChips();
  }
  function currentStep() { if (!S.flow) return null; var st = flowSteps()[S.step]; return st && !st.recommend ? st : null; }
  function answerStep(s, v, label) {
    if (s.v && v) { var ok = s.v(v); if (ok !== true) { bot(ok).then(function () { askChips(s); }); return; } }
    P[s.k] = v; if (s.k === 'solution') P.solution_name = (SOL[v] || {}).n || v;
    S.step++; persist(); IN.placeholder = 'Ask anything about Stack18…';
    nextStep();
  }

  function recommend() {
    var f = S.flow;
    if (f === 'project') {
      var n = NEEDS[P.need] || NEEDS['Something else'];
      if (n.sol) {
        bot('Two good routes for this. If your process is fairly standard, **' + SOL[n.sol].n + '** is a ready-made system from ' + SOL[n.sol].p + ' one-time that typically goes live in ' + SOL[n.sol].w + '. If you need something tailored, we build it custom, starting with a fixed-price discovery of 1 to 4 weeks.', { card: function () { solCard(n.sol); } });
      } else if (P.need === 'Mobile app') {
        bot('For apps, Stack18 starts with a fixed-price **App Discovery** of about 2 weeks, then an **App Build** of 8 to 14 weeks at a fixed price, with test builds on your phone every week. See [mobile app development](/services/mobile-app-development) and the [app cost guide](/resources/mobile-app-development-cost-india).');
      } else {
        bot('For ' + (n.svc || 'this') + ', the first step is a free 30-minute call with a senior specialist, then a fixed-price discovery of 1 to 4 weeks that gives you a written scope, timeline and price before you commit. More here: [' + n.svc + '](' + n.u + ').');
      }
      bot('I will pass your brief to a senior specialist so they come prepared. Just need a few contact details.');
    } else if (f === 'ai') {
      if (P.ai_scope === 'Company-wide programme') {
        bot('For a company-wide programme, the right fit is usually **Enterprise AI Transformation**: AI strategy, modernisation and governed agents from one partner, often with a dedicated Transformation Pod on a 12 to 36 month contract. The first step is a free 60-minute leadership briefing. See [Enterprise AI Transformation](/enterprise).');
      } else if (P.ai_scope === 'Several departments') {
        bot('For several departments, **AI Enterprise OS** Grow edition (₹7.9L one-time, about 8 to 10 weeks) covers sales, finance and documents with governance built in. A tailored [AI transformation](/services/ai-transformation) engagement is the alternative if your processes are unusual.', { card: function () { solCard('ai-enterprise-os'); } });
      } else {
        bot('Starting with one use case is the safest route. **AI Enterprise OS** Launch edition (₹3.2L one-time, 4 to 5 weeks) puts a first governed agent in production, with human approval on anything consequential. See also [AI agents for business](/resources/ai-agents-for-business).', { card: function () { solCard('ai-enterprise-os'); } });
      }
      bot('I will share this with an AI specialist so the first call is useful. A few contact details:');
    } else if (f === 'enterprise') {
      bot('Thanks. The usual first step is a free, confidential **60-minute leadership briefing** with NDA on request. Pods are staffed within 30 days of signature and include quarterly business reviews and a documented exit plan. See [Enterprise AI Transformation](/enterprise).');
      bot('Who should the team reach out to?');
    }
  }

  function finishFlow() {
    var f = S.flow; S.flow = null; S.step = 0; persist();
    summaryCardLater();
    submitLead(f).then(function (ok) {
      var first = (P.name || '').split(' ')[0];
      if (ok) bot('Thanks' + (first ? ', ' + first : '') + '. Your brief is with the Stack18 team and a senior specialist will reply within one business day' + (P.email ? ' at **' + P.email + '**' : '') + '.\n\nWant to speed things up? Continue on WhatsApp and the team will see everything above, so you will not need to repeat yourself.');
      else bot('I could not send that automatically just now. You can continue on WhatsApp with everything above, or email [' + CFG.email + '](mailto:' + CFG.email + ').');
      queue.then(function () { chips([{ l: 'Continue on WhatsApp', v: 'wa', cls: 'go' }, 'Ask another question', 'Explore solutions'], function (v, l) { if (v === 'wa') { handoffWA(); return; } userSay(l); if (l === 'Explore solutions') solutionsMenu(); else bot('Of course. What would you like to know?'); }); });
    });
  }
  function summaryCardLater() { queue = queue.then(function () { summaryCard(); }); }

  function summaryRows() {
    var r = [];
    if (P.name) r.push(['Name', P.name + (P.company && !/^individual$/i.test(P.company) ? ', ' + P.company : '')]);
    if (P.topic) r.push(['Topic', P.topic]);
    if (P.solution_name) r.push(['Solution', P.solution_name + (P.edition ? ' (' + P.edition + ')' : '')]);
    if (P.need) r.push(['Need', P.need]);
    if (P.partner_type) r.push(['Partnership', P.partner_type]);
    if (P.pod) r.push(['Pod', P.pod]);
    if (P.ai_areas) r.push(['AI areas', P.ai_areas]);
    if (P.ai_scope) r.push(['Scope', P.ai_scope]);
    if (P.details) r.push(['Details', P.details]);
    if (P.stage) r.push(['Stage', P.stage]);
    if (P.size) r.push(['Team size', P.size]);
    if (P.timeline) r.push(['Timeline', P.timeline]);
    if (P.budget) r.push(['Budget', P.budget]);
    if (P.email) r.push(['Email', P.email]);
    if (P.phone) r.push(['WhatsApp', P.phone]);
    return r;
  }
  function recentQuestions() {
    return S.msgs.filter(function (m) { return m.w === 'u' && m.t.length > 12 && !/^(skip|prefer|done|yes|no)\b/i.test(m.t); }).slice(-3).map(function (m) { return m.t.slice(0, 140); });
  }

  /* ------------------------------------------------------------ lead submission */
  function submitLead(flow) {
    if (!P.email && !P.phone) return Promise.resolve(false);
    var key = JSON.stringify(summaryRows());
    if (S.leadSent === key) return Promise.resolve(true);
    var fd = new FormData();
    fd.append('name', P.name || 'Website visitor'); fd.append('email', P.email || 'no-email@stack18.com');
    fd.append('company', P.company || ''); fd.append('mobile', P.phone || '');
    fd.append('reason', 'chatbot'); fd.append('topic', P.topic || 'General');
    fd.append('source', 'Website chat: ' + (PAGE.title || location.pathname).slice(0, 80));
    if (P.solution_name) fd.append('solution', P.solution_name);
    if (P.need) fd.append('service', P.need);
    ['edition', 'size', 'stage', 'timeline', 'budget', 'ai_areas', 'ai_maturity', 'ai_scope', 'partner_type', 'pod'].forEach(function (k) { if (P[k]) fd.append(k, P[k]); });
    var qs = recentQuestions();
    fd.append('message', (P.details || P.need || P.topic || 'Chat enquiry') + (qs.length ? '\n\nQuestions asked in chat:\n- ' + qs.join('\n- ') : '') + '\n\nPage: ' + location.href);
    fd.append('website', '');
    return fetch(CFG.lead, { method: 'POST', body: fd, credentials: 'same-origin' }).then(function (r) { return r.json(); }).then(function (j) {
      if (j && j.success) { S.leadSent = key; persist(); track('generate_lead', { method: 'chat', topic: P.topic || '' }); return true; }
      return false;
    }).catch(function () { return false; });
  }

  /* ------------------------------------------------------------ WhatsApp handoff */
  function waText() {
    var first = P.name ? "Hi Stack18, I'm " + P.name + (P.company && !/^individual$/i.test(P.company) ? ' from ' + P.company : '') + '.' : 'Hi Stack18, I was chatting with Sia on your website.';
    var lines = [first];
    if (P.topic && P.topic !== 'Talk to the team') lines.push('Topic: ' + P.topic);
    if (P.solution_name) lines.push('Solution: ' + P.solution_name + (P.edition ? ' (' + P.edition + ' edition)' : ''));
    if (P.need) lines.push('Looking for: ' + P.need);
    if (P.partner_type) lines.push('Partnership: ' + P.partner_type);
    if (P.pod) lines.push('Pod: ' + P.pod);
    if (P.ai_areas) lines.push('AI areas: ' + P.ai_areas + (P.ai_scope ? ' (' + P.ai_scope + ')' : ''));
    if (P.details) lines.push('Details: ' + P.details);
    var meta = [];
    if (P.stage) meta.push('Stage: ' + P.stage); if (P.size) meta.push('Team: ' + P.size);
    if (P.timeline) meta.push('Timeline: ' + P.timeline); if (P.budget) meta.push('Budget: ' + P.budget);
    if (meta.length) lines.push(meta.join(' | '));
    var qs = recentQuestions(); if (qs.length && !P.details) lines.push('I asked about: ' + qs.join(' / '));
    if (P.email) lines.push('Email: ' + P.email);
    var pth = location.pathname.replace(/\.html$/, '').replace(/\/index$/, '') || '/';
    lines.push('(From the website chat on ' + (pth === '/' ? 'the homepage' : 'stack18.com' + pth) + ')');
    var t = lines.join('\n');
    return t.length > 1200 ? t.slice(0, 1180) + '…' : t;
  }
  function handoffWA() {
    var url = 'https://wa.me/' + CFG.wa + '?text=' + encodeURIComponent(waText());
    track('whatsapp_click', { page_path: location.pathname, source: 'chat' });
    if (P.email || P.phone) submitLead();
    bot('Opening WhatsApp with a short summary of our chat, so the team has your context. If it does not open, message us at [' + CFG.waLabel + '](https://wa.me/' + CFG.wa + ').');
    window.open(url, '_blank', 'noopener');
    queue.then(function () { chips([{ l: 'Open WhatsApp again', v: 'wa' }, 'Ask another question', 'Explore ready-made systems'], function (v, l) { if (v === 'wa') return handoffWA(); userSay(l); if (l === 'Explore ready-made systems') return solutionsMenu(); bot('Of course. What would you like to know?'); }); });
  }
  function talkToTeam() {
    userSay('Talk to your team');
    if ((P.email || P.phone) && P.name) {
      summaryCardLater();
      submitLead().then(function (ok) {
        bot((ok ? 'Done. Your details and this conversation are with the team; a senior specialist will reply within one business day.' : 'I will connect you directly.') + ' You can also book a call or continue on WhatsApp now.');
        queue.then(function () { chips([{ l: 'Continue on WhatsApp', v: 'wa', cls: 'go' }, { l: 'Book a free 30-minute call', v: 'call' }, 'Ask another question'], function (v, l) { if (v === 'wa') return handoffWA(); if (v === 'call') { location.href = '/contact'; return; } userSay(l); bot('Of course. What would you like to know?'); }); });
      });
      return;
    }
    if (S.flow) { bot('Happy to connect you. Let me just get your details.'); var st = flowSteps(); var ci = st.indexOf(CONTACT[0]); if (ci > S.step) S.step = ci; nextStep(); return; }
    if (P.need || P.topic) { S.flow = 'team'; S.step = 1; P.reason = 'chatbot'; P.topic = P.topic || 'Talk to the team'; persist(); bot('Happy to connect you with a senior specialist.'); nextStep(); return; }
    startFlow('team');
  }

  /* ------------------------------------------------------------ info cards */
  function solutionsMenu() {
    bot('Stack18 has six ready-made business systems with 171 modules, priced once in rupees with no per-user fees. Which area interests you?');
    queue.then(function () { chips(Object.keys(SOL).map(function (k) { return { l: SOL[k].n, v: k }; }).concat([{ l: 'Compare all', v: 'all' }]), function (v, l) {
      userSay(l);
      if (v === 'all') { bot('You can compare all six side by side, with editions and module prices, on the [solutions page](/solutions) and [pricing](/pricing).'); afterAnswerChips(); return; }
      P.solution = v; P.solution_name = SOL[v].n; persist();
      bot(SOL[v].n + ': ' + SOL[v].d, { card: function () { solCard(v); } });
      queue.then(function () { chips([{ l: 'Get a quote', v: 'q', cls: 'go' }, 'What is included in the price?', 'Can it be customised?', 'Another solution'], function (x, lab) {
        if (x === 'q') { userSay('Get a quote'); startFlow('quote', v); return; }
        userSay(lab); if (lab === 'Another solution') { solutionsMenu(); return; } route(lab + ' (' + SOL[v].n + ')');
      }); });
    }); });
  }
  function info(kind) {
    if (kind === 'careers') {
      bot('Stack18 has no advertised roles right now, but is always interested in meeting exceptional people. You can share your profile at [' + CFG.email + '](mailto:' + CFG.email + '?subject=Profile%20for%20Stack18), and internships run across technology, AI, marketing, design and business.', { card: function () { linkCard('Careers', 'Work in an AI-native team in Jaipur', 'Real ownership, AI agents in every delivery team and continuous learning.', [['See careers →', '/careers'], ['Internships', '/careers#internships']]); } });
    } else if (kind === 'ventures') {
      bot('**Stack Ventures** builds companies inside Stack18 in five stages: build the product, reach product-market fit, reach ₹1 crore in revenue, hire a dedicated CEO (or bring in a co-founder), then spin off as a separate company. It is not a venture studio or an investment fund.', { card: function () { linkCard('Stack Ventures', 'Lead a company that already works', 'Stack Ventures hires CEOs and brings in co-founders for its ventures.', [['See the model →', '/ventures#model'], ['Apply as CEO or co-founder', '/ventures#apply']]); } });
    }
    afterAnswerChips();
  }

  /* ------------------------------------------------------------ intent routing for free text */
  var INTENTS = [
    { re: /\b(talk|speak|call|connect)\b.*\b(team|human|person|someone|sales|expert)\b|\bhuman\b|\bcall me\b|\bcontact (you|stack18)\b/i, go: function () { talkToTeam(); return true; } },
    { re: /\bwhats ?app\b/i, go: function () { handoffWA(); return true; } },
    { re: /\b(start|begin|discuss|need|want|looking|have)\b.*\b(project|build|develop|app|website|portal|software|platform|mvp|erp|crm)\b/i, offer: ['project', 'Start a project brief'] },
    { re: /\b(quote|proposal|estimate)\b/i, offer: ['quote', 'Get a solution quote'] },
    { re: /\b(partner|partnership|reseller|referral|white ?label|agency partner|implementation partner)\b/i, offer: ['partner', 'Explore partnership paths'] },
    { re: /\b(job|jobs|career|careers|hiring|intern|internship|vacanc)/i, info: 'careers' },
    { re: /\b(venture|ventures|ceo role|co-?founder|spin.?off)\b/i, info: 'ventures' },
    { re: /\b(enterprise|pod|transformation pod|large organi[sz]ation)\b/i, offer: ['enterprise', 'Plan an enterprise transformation'] },
    { re: /\b(ai|agent|agents|automation|automate|chatbot|genai|gen ai|llm|copilot)\b/i, offer: ['ai', 'Plan AI for my business'] }
  ];
  var lastOffer = null;
  function route(text) {
    var t = text.toLowerCase();
    for (var i = 0; i < INTENTS.length; i++) { var it = INTENTS[i]; if (it.re.test(t) && it.go) { if (it.go()) return; } }
    lastOffer = null;
    for (i = 0; i < INTENTS.length; i++) { it = INTENTS[i]; if (it.re.test(t)) { if (it.info) { info(it.info); return; } if (it.offer && !lastOffer) lastOffer = it.offer; } }
    answer(text);
  }

  /* ------------------------------------------------------------ answering: AI first, grounded fallback */
  var KB = null, kbLoading = null, apiMode = sget('s18chat_api'); // null unknown, 'ai', 'local'
  function loadKB() {
    if (KB) return Promise.resolve(KB);
    if (!kbLoading) kbLoading = fetch(CFG.kb, { credentials: 'same-origin' }).then(function (r) { return r.json(); }).then(function (j) { KB = prepKB(j); return KB; }).catch(function () { kbLoading = null; return null; });
    return kbLoading;
  }
  var STOP = 'a an the and or of to in on for with at by from is are be can do does how what which who when where why your you our we i me my it this that as about into than then there their they them us will would could should have has had was were not no yes any some more most also just get got need want like please tell much many does stack18 stack 18 work works working help helps use using good best make offer offers provide provides company business businesses service services'.split(' ').reduce(function (o, w) { o[w] = 1; return o; }, {});
  var SYN = { cost: 'price', pricing: 'price', prices: 'price', priced: 'price', costs: 'price', charge: 'price', fees: 'fee', erp: 'erp', crm: 'crm', apps: 'app', application: 'app', applications: 'app', website: 'web', websites: 'web', located: 'location', based: 'location', office: 'location', offices: 'location', hq: 'location', headquarters: 'location', founded: 'founder', founders: 'founder', timeline: 'time', long: 'time', weeks: 'week', months: 'month', agents: 'agent', automation: 'automate', automating: 'automate' };
  function toks(s) { return (s || '').toLowerCase().replace(/₹/g, ' rupee ').split(/[^a-z0-9]+/).filter(function (w) { return w && w.length > 1 && !STOP[w]; }).map(function (w) { w = SYN[w] || w; return w.length > 4 ? w.replace(/(ies)$/, 'y').replace(/s$/, '') : w; }); }
  function prepKB(j) {
    var df = {}, N = j.chunks.length, avg = 0;
    j.chunks.forEach(function (c) { c.tq = toks(c.q); c.tx = toks(c.x); c.n = c.tq.length * 2 + c.tx.length; avg += c.n; var seen = {}; c.tq.concat(c.tx).forEach(function (w) { if (!seen[w]) { seen[w] = 1; df[w] = (df[w] || 0) + 1; } }); });
    j.avg = avg / N; j.df = df; j.N = N; return j;
  }
  function search(q, k) {
    var qt = toks(q); if (!qt.length || !KB) return [];
    var idf = {}; qt.forEach(function (w) { var d = KB.df[w] || 0; idf[w] = Math.log(1 + (KB.N - d + .5) / (d + .5)); });
    var cur = location.pathname.replace(/\.html$/, '').replace(/\/index$/, '') || '/';
    var res = KB.chunks.map(function (c) {
      var tf = {}; c.tq.forEach(function (w) { tf[w] = (tf[w] || 0) + 2; }); c.tx.forEach(function (w) { tf[w] = (tf[w] || 0) + 1; });
      var s = 0, hits = 0; qt.forEach(function (w) { var f = tf[w] || 0; if (f) { hits++; s += idf[w] * (f * 2.2) / (f + 1.2 * (0.25 + 0.75 * c.n / KB.avg)); } });
      if (!hits) return null;
      s *= (0.6 + 0.4 * hits / qt.length);
      var qh = 0; qt.forEach(function (w) { if (c.tq.indexOf(w) >= 0) qh++; }); if (qh === qt.length) s *= 1.6; else if (qh) s *= 1 + 0.3 * qh / qt.length;
      if (c.tq.join(' ') === qt.join(' ')) s *= 1.8;
      if (c.k === 'faq' || c.k === 'answer') s *= 1.25;
      var pg = KB.pages[c.p]; if (pg && pg.u === cur) s *= 1.3;
      if (pg && /^\/(capabilities|industries)\//.test(pg.u)) s *= 0.75; else if (pg && /^\/($|services|solutions|resources|compare|pricing|about|what-is|security|enterprise|contact)/.test(pg.u)) s *= 1.15;
      return { c: c, s: s, cov: hits / qt.length, qh: qh, nq: qt.length };
    }).filter(Boolean).sort(function (a, b) { return b.s - a.s; });
    return res.slice(0, k || 5);
  }
  function firstSentences(t, n) { var parts = t.replace(/([.!?])\s+(?=[A-Z₹"(])/g, '$1\u0001').split('\u0001'); return parts.slice(0, n).join(' ').trim(); }

  // Short answers for the most common questions, written from the site's own pages (used when AI is off)
  var CANNED = [
    { re: /\b(build|make|develop|create)\b.*\b(mobile )?apps?\b|\b(android|ios)\b.*\bapp/i, t: 'Yes. Stack18 builds Android and iOS apps, usually from one cross-platform codebase. It starts with a fixed-price **App Discovery** of about 2 weeks, then an **App Build** of 8 to 14 weeks at a fixed price, with test builds on your phone every week. See [mobile app development](/services/mobile-app-development).', src: [{ t: 'Mobile App Development', u: '/services/mobile-app-development' }] },
    { re: /\b(tech(nology)? stack|which (languages|frameworks|technolog)|what (languages|frameworks|technolog))/i, t: 'Stack18 works across modern stacks and picks the right one in discovery, based on your product and team. There are dedicated pages for [Next.js and React](/capabilities/nextjs-react-development-company-india), [Node.js](/capabilities/nodejs-backend-development-company-india), [Python and Django](/capabilities/python-django-development-company-india), [.NET](/capabilities/dotnet-application-development-company-india), [Flutter](/capabilities/flutter-app-development-company-india) and [React Native](/capabilities/react-native-app-development-company-india).', src: [{ t: 'Capabilities', u: '/capabilities' }] },
    { re: /\b(build|make|develop)\b.*\b(website|web ?site|web app|portal)\b/i, t: 'Yes. Stack18 builds websites, web apps and portals engineered for speed, search and sales, with a free 30-minute call, then a fixed-price first step. See [web development](/services/web-development).', src: [{ t: 'Web Development', u: '/services/web-development' }] }
  ];
  function localAnswer(q) {
    for (var ci = 0; ci < CANNED.length; ci++) if (CANNED[ci].re.test(q)) { bot(CANNED[ci].t, { src: CANNED[ci].src }); afterAnswerChips(); return Promise.resolve(); }
    return loadKB().then(function (kb) {
      if (!kb) { bot('I could not load my notes just now. The team can answer this directly: [' + CFG.email + '](mailto:' + CFG.email + ') or continue on WhatsApp.'); afterAnswerChips(); return; }
      var r = search(q, 6);
      var top = r[0];
      if (!top || top.s < 4.2 || top.cov < 0.5 || (top.nq < 2 && (!top.qh || top.c.k === 'page' || top.c.k === 'section')) || (top.nq >= 2 && !top.qh && top.cov < 1)) {
        bot('I do not want to guess on that one. I could not find it on stack18.com. Could you tell me a bit more, or shall I connect you with the team? They reply within one business day.');
        afterAnswerChips(true); return;
      }
      var pg = kb.pages[top.c.p], src = [{ t: pg.t, u: pg.u }];
      var text, unknown = toks(q).filter(function (w) { return !kb.df[w] && w.length > 3 && !/^\d+$/.test(w); });
      if (unknown.length) {
        var word = q.match(new RegExp('\\b(' + unknown[0].slice(0, 5) + '[a-z]*)', 'i')); word = word ? word[1] : unknown[0];
        bot('I could not find anything about **' + word + '** on stack18.com, so I will not guess. ' + (top.cov >= 0.5 ? 'Here is what I do know: ' + firstSentences(top.c.k === 'page' ? top.c.x : top.c.x, 1) : '') + '\n\nThe team can confirm the details. Want me to connect you?', { src: top.cov >= 0.5 ? src : null });
        afterAnswerChips(true); return;
      }
      if (top.c.k === 'page') text = top.c.x + '\n\nThe [' + pg.t + '](' + pg.u + ') page has the details.';
      else text = firstSentences(top.c.x, top.c.k === 'section' ? 2 : 3);
      var second = r.slice(1).find(function (x) { return x.c.p !== top.c.p && x.s > top.s * 0.75; });
      if (second) src.push({ t: kb.pages[second.c.p].t, u: kb.pages[second.c.p].u });
      bot(text, { src: src }); afterAnswerChips();
    });
  }
  function history() { return S.msgs.filter(function (m) { return m.w === 'u' || m.w === 'b'; }).slice(-10).map(function (m) { return { role: m.w === 'u' ? 'user' : 'assistant', content: String(m.t).slice(0, 1200) }; }); }
  function answer(q) {
    if (apiMode === 'local') return localAnswer(q);
    var ctx = { page: { url: location.pathname, title: PAGE.title }, brief: { topic: P.topic, need: P.need, details: P.details, solution: P.solution_name, budget: P.budget, timeline: P.timeline, size: P.size } };
    var ctl = window.AbortController ? new AbortController() : null; var to = setTimeout(function () { if (ctl) ctl.abort(); }, 28000);
    queue = queue.then(function () {
      typing(true);
      return fetch(CFG.api, { method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'same-origin', signal: ctl ? ctl.signal : undefined, body: JSON.stringify({ messages: history(), context: ctx }) })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          clearTimeout(to); typing(false);
          if (!j || !j.ok) { if (j && j.mode === 'local') { apiMode = 'local'; sset('s18chat_api', 'local'); } return localAnswer(q); }
          apiMode = 'ai';
          botNow(j.reply, j.sources);
          if (j.intent && !lastOffer) { var map = { project: ['project', 'Start a project brief'], ai: ['ai', 'Plan AI for my business'], partnership: ['partner', 'Explore partnership paths'], enterprise: ['enterprise', 'Plan an enterprise transformation'], quote: ['quote', 'Get a solution quote'] }; lastOffer = map[j.intent] || null; }
          afterAnswerChips(j.handoff, j.suggestions);
        })
        .catch(function () { clearTimeout(to); typing(false); return localAnswer(q); });
    });
  }
  function afterAnswerChips(unsure, sugg) {
    var list = [];
    if (lastOffer) list.push({ l: lastOffer[1], v: 'flow:' + lastOffer[0], cls: 'go' });
    if (unsure) list.push({ l: 'Talk to our team', v: 'team', cls: lastOffer ? '' : 'go' });
    (sugg || []).slice(0, 3).forEach(function (s) { if (typeof s === 'string' && s.length < 70) list.push(s); });
    if (list.length < 3) ['How does pricing work?', 'Explore ready-made systems', 'Scope a software project'].forEach(function (s) { if (list.length < 4 && !list.some(function (x) { return (x.l || x) === s; })) list.push(s); });
    chips(list, function (v, l) {
      if (v === 'team') return talkToTeam();
      userSay(l);
      if (v.indexOf('flow:') === 0) { startFlow(v.slice(5)); return; }
      if (l === 'Explore ready-made systems') return solutionsMenu();
      if (l === 'Scope a software project') return startFlow('project');
      route(l);
    });
    lastOffer = null;
  }

  /* ------------------------------------------------------------ input */
  function onSubmit(e) {
    if (e) e.preventDefault();
    var t = IN.value.replace(/\s+$/,'').trim(); if (!t) return;
    IN.value = ''; autosize(); userSay(t);
    var st = currentStep();
    if (st) {
      if (st.free) { answerStep(st, t, t); return; }
      // a question typed while chips are offered: answer it, then re-ask the step
      clearChips(); route(t); queue.then(function () { setTimeout(function () { if (currentStep() === st) bot('Whenever you are ready: ' + st.ask.charAt(0).toLowerCase() + st.ask.slice(1)).then(function () { askChips(st); }); }, 400); });
      return;
    }
    clearChips(); route(t);
  }
  function autosize() { IN.style.height = 'auto'; IN.style.height = Math.min(110, IN.scrollHeight) + 'px'; }

  /* ------------------------------------------------------------ boot */
  function boot() {
    L.addEventListener('click', function () { setOpen(true); });
    $('.x').addEventListener('click', function () { setOpen(false); });
    $('.rs').addEventListener('click', function () { resetAll(); });
    $('.wa1').addEventListener('click', handoffWA);
    $('.a .wa').addEventListener('click', handoffWA);
    $('.a .tm').addEventListener('click', talkToTeam);
    FORM.addEventListener('submit', onSubmit);
    IN.addEventListener('input', autosize);
    IN.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmit(); } });
    root.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !PN.hidden) setOpen(false); });
    // public API: any element with data-s18-chat="project|ai|solutions|partner|enterprise|team" opens a flow
    window.S18Chat = { _search: function (q) { return loadKB().then(function () { return search(q, 3).map(function (r) { return Math.round(r.s * 10) / 10 + ' ' + KB.pages[r.c.p].u + ' | ' + r.c.q; }); }); }, open: function (flow) { setOpen(true); if (flow) { setTimeout(function () { if (flow === 'team') talkToTeam(); else startFlow(flow); }, 250); } } };
    document.addEventListener('click', function (e) { var a = e.target.closest && e.target.closest('[data-s18-chat]'); if (a) { e.preventDefault(); window.S18Chat.open(a.getAttribute('data-s18-chat')); } });
    if (sget('s18chat_open')) setOpen(true);
    if (window.matchMedia('(min-width:900px)').matches && sget('s18chat_seen', localStorage)) L.classList.add('mini');
    sset('s18chat_seen', 1, localStorage);
    teaser();
  }
  function teaser() {
    if (ONCONTACT || S.opened || sget('s18chat_teased')) return;
    var shown = false;
    function show() {
      if (shown || !PN.hidden || document.querySelector('.lp-overlay.is-open')) return; shown = true; sset('s18chat_teased', 1);
      var line = PAGE.kind === 'solution' ? 'Questions about ' + PAGE.label + '? I can explain editions and pricing in a minute.' : PAGE.kind === 'pricing' ? 'Not sure which option fits your budget? I can help you compare.' : 'Planning a project? I can help you find the right starting point in two minutes.';
      var t = document.createElement('div'); t.className = 't'; t.setAttribute('role', 'status');
      t.innerHTML = '<b>Sia from Stack18</b>' + esc(line) + '<button type="button" aria-label="Dismiss">×</button>';
      t.addEventListener('click', function (e) { if (e.target.tagName === 'BUTTON') { t.remove(); return; } setOpen(true); });
      root.querySelector('.s').appendChild(t); L.classList.add('unread');
    }
    setTimeout(show, 30000);
    window.addEventListener('scroll', function onS() { if ((window.scrollY + innerHeight) / document.documentElement.scrollHeight > 0.6) { window.removeEventListener('scroll', onS); setTimeout(show, 1200); } }, { passive: true });
  }
})();
