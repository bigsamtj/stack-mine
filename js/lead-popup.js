/* Stack18 — intent-aware lead popup.
   Every <a href="/contact"> on the site opens a form tailored to the button that was clicked
   (and the page it sits on). Leads go to /contact-handler.php (email + CRM), like every other form.
   Public API: window.S18Lead.open(intentKey, context) — used by the solution configurator. */
(function () {
  'use strict';
  if (/(^|\/)contact(\.html)?\/?$/.test(location.pathname)) return;

  // ------------------------------------------------------------------ reference data
  var SOLUTIONS = { 'commerce-os': 'Commerce OS', 'business-os': 'Business OS', 'customer-os': 'Customer OS',
    'supply-chain-os': 'Supply Chain OS', 'finops-os': 'FinOps OS', 'ai-enterprise-os': 'AI Enterprise OS' };
  var SERVICES = { 'technology-consulting': 'Technology Consulting', 'digital-transformation': 'Digital Transformation',
    'custom-software-development': 'Custom Software Development', 'enterprise-software-development': 'Enterprise Software Development',
    'saas-product-development': 'SaaS Product Development', 'web-development': 'Web Development', 'mobile-app-development': 'Mobile App Development',
    'ai-transformation': 'AI Transformation', 'ai-product-development': 'AI Product Development', 'legacy-modernization': 'Legacy Modernization',
    'cloud-devops': 'Cloud & DevOps', 'data-analytics': 'Data & Analytics',
    'product-design-ux-ui': 'Product Design (UI/UX)',
    'ai-agents-automation': 'AI Agents & Automation',
    'generative-ai-llm-applications': 'Generative AI & LLM Apps',
    'ai-governance-evaluation': 'AI Governance & Evaluation',
    'enterprise-integration-api-services': 'Enterprise Integration & APIs',
    'managed-services-reliability': 'Managed Services & Reliability',
    'crm-marketing-automation': 'CRM & Marketing Automation',
    'security-compliance-advisory': 'Security & Compliance Advisory' };
  var SIZES = ['1–10', '11–50', '51–200', '201–1,000', '1,000–5,000', '5,000+'];
  var TIMELINE = ['This month', '1–3 months', '3–6 months', 'Exploring'];
  var BUDGET = ['Under ₹5L', '₹5–15L', '₹15–50L', '₹50L+', 'Not sure yet'];
  var STAGE = ['Idea', 'Defined scope', 'Already in progress', 'Rescue or takeover'];
  var EDITIONS = ['Launch', 'Grow', 'Scale', 'Not sure yet'];
  var PODS = ['Foundation Pod', 'Scale Pod', 'Enterprise Pod', 'Not sure yet'];
  var TRACKS = ['Strategy & architecture', 'Digital products & platforms', 'Modernization & cloud', 'AI & automation', 'Data & analytics', 'Run & operate'];

  // Free-offer specific questions, by service page
  var OFFER_FIELDS = {
    'web-development': [{ n: 'site_url', l: 'Website to audit', t: 'url', req: true, ph: 'https://' }],
    'cloud-devops': [{ n: 'cloud', l: 'Your cloud', t: 'chips', o: ['AWS', 'Azure', 'Google Cloud', 'Other / on-premise'] },
                     { n: 'monthly_cloud_spend', l: 'Monthly cloud spend', t: 'chips', o: ['Under ₹1L', '₹1–5L', '₹5–20L', '₹20L+'] }],
    'data-analytics': [{ n: 'data_sources', l: 'Where your data lives', t: 'multi', o: ['Tally', 'Zoho', 'Excel', 'ERP', 'CRM', 'Marketplaces', 'Ad platforms'] }],
    'mobile-app-development': [{ n: 'app_status', l: 'Where are you?', t: 'chips', o: ['Just an idea', 'Existing app to review'] },
                               { n: 'app_link', l: 'App store link (if any)', t: 'url', ph: 'https://' }],
    'ai-transformation': [{ n: 'ai_area', l: 'Where could AI help most?', t: 'multi', o: ['Customer support', 'Sales', 'Finance', 'HR', 'Operations', 'Knowledge & documents'] }],
    'ai-product-development': [{ n: 'ai_idea', l: 'Your AI idea in one line', t: 'text', req: true, ph: 'e.g. a copilot that drafts loan summaries' }],
    'legacy-modernization': [{ n: 'legacy_system', l: 'System and technology', t: 'text', req: true, ph: 'e.g. policy admin on VB6 + SQL Server 2008' }],
    'technology-consulting': [{ n: 'decision', l: 'System or decision to review', t: 'text', req: true, ph: 'e.g. choosing an ERP, or a slow core platform' }],
    'enterprise-software-development': [{ n: 'platform', l: 'Platform or integration to review', t: 'text', req: true }],
    'digital-transformation': [{ n: 'focus_area', l: 'Area to digitise first', t: 'multi', o: ['Sales & customers', 'Operations', 'Finance', 'People', 'Supply chain'] }],
    'saas-product-development': [{ n: 'stage', l: 'Stage', t: 'chips', o: ['Idea', 'Validated with users', 'MVP exists'] }],
    'custom-software-development': [{ n: 'stage', l: 'Stage', t: 'chips', o: STAGE }],
    'product-strategy-discovery': [{ n: 'idea', l: 'Your idea or product in one line', t: 'text', req: true, ph: 'e.g. a dealer ordering app for 300 dealers' }],
    'process-automation-ops-consulting': [{ n: 'process', l: 'Process that frustrates your team', t: 'text', req: true, ph: 'e.g. order approvals, month-end reconciliation' }],
    'fractional-cto-tech-leadership': [{ n: 'situation', l: 'Your situation', t: 'chips', o: ['No technical leader', 'Hiring a CTO', 'Agency-built product', 'Team scaling', 'Board or investor ask'] }],
    'document-vision-ai': [{ n: 'doc_type', l: 'What should it read?', t: 'multi', o: ['Invoices', 'Contracts', 'KYC / ID documents', 'Bank statements', 'Forms', 'Product images'] }],
    'cloud-migration-finops': [{ n: 'hosting', l: 'Where do you host today?', t: 'chips', o: ['On-premise servers', 'AWS', 'Azure', 'Google Cloud', 'Shared hosting or other'] }],
    'quality-engineering-test-automation': [{ n: 'product_type', l: 'What do you ship?', t: 'multi', o: ['Web app', 'Android app', 'iOS app', 'APIs', 'ERP or internal system'] }],
    'data-engineering-platforms': [{ n: 'data_sources', l: 'Where your data lives', t: 'multi', o: ['Tally', 'Zoho', 'ERP', 'CRM', 'Marketplaces', 'Ad platforms', 'Excel'] }],
    'product-design-ux-ui': [{ n: 'product_link', l: 'Product or flow to review', t: 'url', ph: 'https://' }],
    'ai-agents-automation': [{ n: 'workflow', l: 'Process you want to automate', t: 'text', req: true, ph: 'e.g. lead follow-ups, invoice entry, ticket triage' }],
    'generative-ai-llm-applications': [{ n: 'ai_use_case', l: 'What should the assistant do?', t: 'text', req: true, ph: 'e.g. answer staff questions from our policy documents' }],
    'ai-governance-evaluation': [{ n: 'ai_in_use', l: 'Where AI is used or planned', t: 'multi', o: ['Customer support', 'Sales', 'Finance', 'HR', 'Operations', 'Product features'] }],
    'enterprise-integration-api-services': [{ n: 'systems', l: 'Systems to connect', t: 'multi', o: ['Tally', 'SAP', 'Zoho', 'Odoo', 'Shopify / marketplaces', 'Payment gateway', 'WhatsApp', 'Other'] }],
    'managed-services-reliability': [{ n: 'system', l: 'System you rely on most', t: 'text', req: true, ph: 'e.g. billing platform on AWS' }],
    'crm-marketing-automation': [{ n: 'crm_today', l: 'What do you use today?', t: 'chips', o: ['Spreadsheets', 'HubSpot', 'Salesforce', 'Zoho', 'Other CRM', 'Nothing yet'] }],
    'security-compliance-advisory': [{ n: 'standard', l: 'What do you need to satisfy?', t: 'multi', o: ['ISO 27001', 'SOC 2', 'DPDP Act', 'RBI / NBFC', 'Customer questionnaire', 'Penetration test'] }]
  };

  var NEXT_CALL = ['We review your details', 'A senior specialist calls you', 'You get a clear written next step'];

  // ------------------------------------------------------------------ intents
  // Each intent: kicker, title, sub, get[], next[], fields[], reason, submit, done
  var I = {
    chooser: { kicker: 'Talk to Stack18', title: 'How can we help?', sub: 'Pick what you are here for and we will show you the right form.',
      get: ['A reply within one business day', 'A senior person, not a sales script', 'No obligation'], next: NEXT_CALL },

    demo: function (c) { return { kicker: c.solution + ' · Demo', title: 'Book a demo of ' + c.solution,
      sub: 'See ' + c.solution + ' running on scenarios from your business, and get a clear quote.',
      get: ['A live, tailored walkthrough', 'The right edition for you', 'A fixed quote after the call'],
      next: ['We confirm a slot within one business day', 'A 45-minute live demo', 'A written quote and go-live plan'],
      reason: 'solutions', submit: 'Book my demo', hidden: { solution: c.solution },
      fields: ['name', 'email', 'phone', 'company', 'size',
        { n: 'ownership_model', l: 'Edition you are considering', t: 'chips', o: EDITIONS, v: c.edition },
        { n: 'current_tools', l: 'What do you use today?', t: 'text', ph: 'e.g. Tally, Shopify, Excel, Zoho' },
        { n: 'timeline', l: 'When do you want to go live?', t: 'chips', o: TIMELINE },
        { n: 'message', l: 'Anything you want to see in the demo?', t: 'textarea', ph: 'Optional' }],
      done: ['Demo request received', 'We will confirm your slot within one business day. Meanwhile, you can configure modules and see prices on the ' + c.solution + ' page.'] }; },

    solutionsGeneral: function (c) { return { kicker: 'Pre-built solutions', title: c.title || 'Find the right solution',
      sub: 'Tell us about your business. We will recommend a solution and edition, and show it working.',
      get: ['A recommended solution and edition', 'A live demo on your scenarios', 'A clear, fixed quote'], next: NEXT_CALL,
      reason: 'solutions', submit: 'Get my recommendation',
      fields: ['name', 'email', 'phone', 'company', 'size',
        { n: 'solution', l: 'Which solutions interest you?', t: 'multi', o: objVals(SOLUTIONS).concat(['Not sure yet']), v: c.solution },
        { n: 'timeline', l: 'Timeline', t: 'chips', o: TIMELINE },
        { n: 'message', l: 'What would you like to fix or improve?', t: 'textarea', req: true }],
      done: ['Thank you', 'A solutions specialist will reply within one business day with a recommendation.'] }; },

    quote: function (c) { return { kicker: c.solution + (c.edition ? ' · ' + c.edition + ' edition' : '') + ' · Quote', title: 'Request your quote',
      sub: 'We will confirm scope, integrations and timeline, and send a fixed quote.', summary: c.summary,
      get: ['A fixed, itemised quote', 'Integration and data-migration scope', 'A go-live plan by week'],
      next: ['We review your configuration', 'A short call to confirm scope', 'Your quote within one business day'],
      reason: 'solutions', submit: 'Send quote request', hidden: { solution: c.solution, ownership_model: c.edition || 'Custom selection' },
      fields: ['name', 'company', 'email', { n: 'mobile', l: 'Phone / WhatsApp', t: 'tel', req: true },
        { n: 'gstin', l: 'GSTIN (optional)', t: 'text', ph: 'For the quote' },
        { n: 'timeline', l: 'When do you want to go live?', t: 'chips', o: TIMELINE },
        { n: 'message', l: 'Anything else we should know?', t: 'textarea', ph: 'Optional: integrations, data, users' }],
      baseMessage: c.message,
      done: ['Quote request received', 'Thanks. We will send your quote within one business day.'] }; },

    consult: function (c) { return { kicker: (c.service || 'Services') + ' · Free consultation', title: c.title || 'Book a free consultation',
      sub: 'A free 30-minute call with ' + an('senior ' + (c.lead || 'specialist')).replace(/^an senior/, 'a senior') + '. Bring your goal, we will bring a plan.',
      get: ['Clarity on approach and options', 'An indicative estimate after the call', 'Honest advice, even if it is not us'], next: NEXT_CALL,
      reason: 'services', submit: 'Book my consultation', hidden: { service: c.service || '' }, signals: c.signals,
      fields: ['name', 'email', 'phone', 'company',
        c.service ? null : { n: 'service', l: 'Which service?', t: 'select', o: objVals(SERVICES).concat(['Not sure yet']) },
        { n: 'stage', l: 'Where are you?', t: 'chips', o: STAGE },
        { n: 'budget', l: 'Indicative budget', t: 'chips', o: BUDGET },
        { n: 'timeline', l: 'Timeline', t: 'chips', o: TIMELINE },
        { n: 'message', l: 'What do you want to achieve?', t: 'textarea', req: true, ph: 'Your goal, current setup and any deadline' }],
      done: ['Consultation requested', 'A senior ' + (c.lead || 'specialist') + ' will reply within one business day to set up your call.'] }; },

    engagement: function (c) { return { kicker: (c.service || 'Services') + ' · Engagement', title: c.model,
      sub: c.modelInfo || 'We will shape the scope, team and timeline with you, then send a proposal.',
      get: ['Scope and deliverables for the ' + c.model, 'Team and timeline', 'A fixed price or monthly cost'],
      next: ['A 30-minute scoping call', 'A written proposal', 'Kick-off when you are ready'],
      reason: 'services', submit: 'Request a proposal', hidden: { service: c.service || '', engagement_model: c.model },
      fields: ['name', 'email', 'phone', 'company',
        c.service ? null : { n: 'service', l: 'Which service?', t: 'select', o: objVals(SERVICES).concat(['Not sure yet']) },
        { n: 'budget', l: 'Indicative budget', t: 'chips', o: BUDGET },
        { n: 'timeline', l: 'When do you want to start?', t: 'chips', o: TIMELINE },
        { n: 'message', l: 'Tell us about the project', t: 'textarea', req: true }],
      done: ['Thanks, request received', 'We will reply within one business day to schedule a scoping call for your ' + c.model + '.'] }; },

    offer: function (c) { var extra = OFFER_FIELDS[c.slug] || []; return { kicker: (c.service || 'Services') + ' · Free', title: c.offer,
      sub: c.offerInfo || 'Free for qualified businesses. No obligation.', get: c.offerGets || ['A written summary', 'Prioritised recommendations', 'Suggested next steps'],
      next: ['We check fit and prepare', 'A working session with a specialist', 'Your written findings'],
      reason: 'services', submit: 'Request my ' + c.offer.replace(/^Free /i, 'free '), hidden: { service: c.service || '', offer: c.offer },
      fields: ['name', 'email', 'phone', 'company'].concat(extra).concat([{ n: 'message', l: 'Anything we should know first?', t: 'textarea', ph: 'Optional' }]),
      done: ['You are in', 'We will be in touch within one business day to schedule your ' + c.offer.replace(/^Free /i, '') + '.'] }; },

    goal: function (c) { return { kicker: 'Services · Goal', title: c.goal, sub: 'Tell us where you are. We will recommend the right first step.',
      get: ['A recommended first step', 'The right team for the job', 'An indicative estimate'], next: NEXT_CALL,
      reason: 'services', submit: 'Get my recommendation', hidden: { goal: c.goal },
      fields: ['name', 'email', 'phone', 'company',
        { n: 'service', l: 'Services that may fit', t: 'multi', o: c.recs && c.recs.length ? c.recs : objVals(SERVICES), v: c.recs },
        { n: 'timeline', l: 'Timeline', t: 'chips', o: TIMELINE },
        { n: 'message', l: 'What are you trying to achieve?', t: 'textarea', req: true }],
      done: ['Thank you', 'A senior architect will reply within one business day with a recommended first step.'] }; },

    question: function (c) { return { kicker: c.kicker || 'Question', title: c.title || 'Ask us anything', sub: 'Ask about pricing, process, technology or fit. A specialist replies, not a bot.',
      get: ['A straight answer', 'From a specialist', 'Within one business day'], next: ['We read your question', 'The right specialist answers', 'You decide what is next'],
      reason: c.reason || 'other', submit: 'Send question', hidden: { service: c.service || '' },
      fields: ['name', 'email', { n: 'company', l: 'Company (optional)', t: 'text' }, { n: 'message', l: 'Your question', t: 'textarea', req: true }],
      done: ['Question received', 'We will reply within one business day.'] }; },

    aiplan: function (c) { return { kicker: 'Enterprise · AI transformation', title: 'Plan your AI transformation',
      sub: 'A free 60-minute conversation with Stack18 leadership about your priorities and the right starting point.',
      get: ['A view of your highest-value opportunities', 'A recommended starting point and engagement path', 'An indicative commercial range'],
      next: ['We schedule within one business day', 'A 60-minute leadership conversation', 'A written summary and recommended next step'],
      reason: 'enterprise', submit: 'Plan Your AI Transformation', hidden: { ownership_model: c.path || '' },
      fields: ['name', { n: 'role', l: 'Job title', t: 'text', req: true }, 'company', 'email', 'phone', 'size',
        { n: 'engagement_path', l: 'Where would you like to start?', t: 'chips', o: ['AI Opportunity Sprint', 'Agent Pilot to Production', 'Enterprise AI Transformation Partnership', 'Not sure yet'], v: c.path },
        { n: 'priorities', l: 'Priorities for the next 12 months', t: 'multi', o: TRACKS },
        { n: 'message', l: 'What would you like to transform?', t: 'textarea', req: true }],
      done: ['Request received', 'A member of Stack18 leadership will contact you within one business day to schedule it.'] }; },

    briefing: function (c) { return { kicker: 'Enterprise · Executive briefing', title: c.title || 'Request an executive briefing',
      sub: '60 minutes with Stack18 leadership on your priorities and how a Transformation Pod would work for you.',
      get: ['Pod size and skills mix for your agenda', 'A view of year-one outcomes', 'An indicative commercial range'],
      next: ['We schedule within one business day', 'A 60-minute leadership briefing', 'A written summary and next steps'],
      reason: 'enterprise', submit: 'Request briefing',
      fields: ['name', { n: 'role', l: 'Job title', t: 'text', req: true }, 'company', 'email', 'phone', 'size',
        { n: 'priorities', l: 'Priorities for the next 12 months', t: 'multi', o: TRACKS },
        { n: 'message', l: 'What would you like to transform?', t: 'textarea', req: true }],
      done: ['Briefing requested', 'A member of Stack18 leadership will contact you within one business day to schedule it.'] }; },

    pod: function (c) { return { kicker: 'Enterprise · ' + c.pod, title: 'Discuss ' + an(c.pod), sub: 'We will size the pod, governance and annual contract around your programme.',
      get: ['Recommended pod composition', 'Year-one plan and scorecard', 'Indicative annual commercials'],
      next: ['A leadership conversation', 'A 2–4 week transformation assessment', 'Pod proposal and contract'],
      reason: 'enterprise', submit: 'Start the conversation', hidden: { ownership_model: c.pod },
      fields: ['name', { n: 'role', l: 'Job title', t: 'text', req: true }, 'company', 'email', 'phone', 'size',
        { n: 'pod_tier', l: 'Pod size', t: 'chips', o: PODS, v: c.pod },
        { n: 'contract_term', l: 'Contract term in mind', t: 'chips', o: ['12 months', '24 months', '36 months', 'Not sure yet'] },
        { n: 'priorities', l: 'Priority tracks', t: 'multi', o: TRACKS },
        { n: 'message', l: 'Your transformation agenda', t: 'textarea', req: true }],
      done: ['Thank you', 'Stack18 leadership will contact you within one business day.'] }; },

    contract: function () { return { kicker: 'Enterprise · Annual contract', title: 'Request a sample contract outline',
      sub: 'Our standard Transformation Pod terms: capacity, flexibility, service levels and handover.',
      get: ['Sample commercial structure', 'Typical service levels', 'Exit and handover terms'], next: ['We confirm your details', 'Outline shared by email', 'Optional call with our team'],
      reason: 'enterprise', submit: 'Send me the outline',
      fields: ['name', { n: 'role', l: 'Job title', t: 'text', req: true }, 'company', 'email',
        { n: 'pod_tier', l: 'Pod size of interest', t: 'chips', o: PODS }],
      baseMessage: 'Requested a sample Transformation Pod contract outline.',
      done: ['Request received', 'We will email the contract outline within one business day.'] }; },

    platform: function () { return { kicker: 'Agentic SDLC', title: 'Talk to us about Agentic SDLC',
      sub: 'One command center for the services you deliver, the software you build and the AI agents doing the work.',
      get: ['A walkthrough of the command center', 'Early access to the self-serve platform', 'How enterprises use it today'], next: NEXT_CALL,
      reason: 'platform', submit: 'Send',
      fields: ['name', 'email', 'company', { n: 'team_size', l: 'Team size', t: 'chips', o: ['1–10', '11–50', '51–200', '200+'] },
        { n: 'manage', l: 'What do you want to manage?', t: 'multi', o: ['Services', 'Software', 'AI agents'] },
        { n: 'message', l: 'What are you hoping to do?', t: 'textarea', ph: 'Optional' }],
      done: ['Thanks', 'We will reply within one business day. Waitlist members hear first when self-serve opens.'] }; },

    investor: function () { return { kicker: 'Stack Ventures · Co-investors', title: 'Co-invest with the studio',
      sub: 'Early access to studio ventures with real teams and real products behind them.',
      get: ['Our studio thesis and pipeline', 'Co-investment opportunities as ventures raise', 'Access to founder and product reviews'],
      next: ['An intro call with the studio team', 'Thesis and pipeline walkthrough', 'Deal flow as ventures raise'],
      reason: 'ventures', submit: 'Get in touch', hidden: { ventures_interest: 'Co-invest' },
      fields: ['name', 'email', 'phone', { n: 'company', l: 'Fund or firm (optional)', t: 'text' },
        { n: 'cheque_size', l: 'Typical cheque size', t: 'chips', o: ['Under ₹25L', '₹25L–1Cr', '₹1–5Cr', '₹5Cr+'] },
        { n: 'focus', l: 'Areas of interest', t: 'multi', o: ['AI-native software', 'Enterprise automation', 'MSME fintech', 'Commerce & D2C', 'Supply chain', 'Developer & AI infra'] },
        { n: 'message', l: 'Anything else?', t: 'textarea', ph: 'Optional: your thesis or stage focus' }],
      done: ['Thank you', 'The studio team will reply within one business day.'] }; },

    partner: function () { return { kicker: 'Stack Ventures · Partners', title: 'Partner with the studio',
      sub: 'Build a new venture with us, or become a design partner and first customer for studio companies.',
      get: ['A conversation with the studio team', 'Venture-build or design-partner options', 'A clear next step'], next: NEXT_CALL,
      reason: 'ventures', submit: 'Get in touch', hidden: { ventures_interest: 'Partner' },
      fields: ['name', { n: 'role', l: 'Job title', t: 'text', req: true }, 'company', 'email', 'phone',
        { n: 'partnership', l: 'Interested in', t: 'multi', o: ['Corporate venture build', 'Design partner / pilot customer', 'Distribution partnership', 'Something else'] },
        { n: 'message', l: 'What do you have in mind?', t: 'textarea', req: true }],
      done: ['Thank you', 'The studio team will reply within one business day.'] }; },

    founder: function () { return { kicker: 'Stack Ventures · Founders', title: 'Build your company with the studio',
      sub: 'Founders apply through the studio application: it takes about 10 minutes.', founder: true,
      get: ['A reply within two weeks', 'An intro call if there is a fit', 'A joint two-week sprint before any agreement'], next: ['Apply', 'Intro call', 'Joint sprint'] }; }
  };
  function an(w) { return (/^[AEIOU]/i.test(w) ? 'an ' : 'a ') + w; }
  function objVals(o) { return Object.keys(o).map(function (k) { return o[k]; }); }

  var CHOICES = [
    { k: 'solutionsGeneral', t: 'A pre-built solution', d: 'Commerce, ERP, CRM, supply chain, finance or AI systems, live in weeks.' },
    { k: 'consult', t: 'A technology service', d: 'Build, modernise or run software, cloud, data or AI.' },
    { k: 'briefing', t: 'Enterprise Transformation Pod', d: 'A dedicated team on an annual contract.' },
    { k: 'platform', t: 'Agentic SDLC platform', d: 'One command center for services, software and agents.' },
    { k: 'ventures', t: 'Stack Ventures', d: 'Founders, co-investors and studio partners.' },
    { k: 'question', t: 'Something else', d: 'Any other question for the team.' }
  ];

  // ------------------------------------------------------------------ resolve CTA → intent
  function pageCtx() {
    var p = location.pathname.replace(/\.html$/, '').replace(/\/index$/, '').replace(/\/$/, '');
    var m;
    if ((m = p.match(/\/solutions\/([a-z-]+)$/)) && SOLUTIONS[m[1]]) return { type: 'solution', slug: m[1], solution: SOLUTIONS[m[1]] };
    if (/\/solutions$/.test(p)) return { type: 'solutions' };
    if ((m = p.match(/\/services\/([a-z-]+)$/)) && SERVICES[m[1]]) return { type: 'service', slug: m[1], service: SERVICES[m[1]] };
    if (/\/services$/.test(p)) return { type: 'services' };
    if (/\/enterprise$/.test(p)) return { type: 'enterprise' };
    if (/\/ventures$/.test(p)) return { type: 'ventures' };
    if (/\/agentic-sdlc$/.test(p)) return { type: 'platform' };
    return { type: 'other' };
  }
  function txt(el) { return (el.textContent || '').replace(/[→↓\u2192]/g, '').replace(/\s+/g, ' ').trim(); }
  function serviceLead() {
    var t = document.querySelector('.vx-plan .vx-h');
    return t ? t.textContent.toLowerCase() : 'specialist';
  }

  function resolve(link) {
    var pc = pageCtx(), t = txt(link), m, d = link.dataset || {};
    if (d.leadIntent && I[d.leadIntent]) return { key: d.leadIntent, ctx: Object.assign({}, pc, d) };
    // free offers
    if ((m = t.match(/^Request your (free .+)$/i))) {
      var box = link.closest('.vx-magnet');
      var title = box && box.querySelector('h2') ? txt(box.querySelector('h2')) : m[1].charAt(0).toUpperCase() + m[1].slice(1);
      var info = box && box.querySelector('p') ? txt(box.querySelector('p')) : '';
      var gets = box ? Array.prototype.map.call(box.querySelectorAll('li'), txt) : null;
      return { key: 'offer', ctx: Object.assign({}, pc, { offer: title, offerInfo: info, offerGets: gets && gets.length ? gets : null }) };
    }
    // service engagement models
    if (pc.type === 'service' && (m = t.match(/^(?:Start with|Discuss) (.+)$/))) {
      var card = link.closest('.vx-model'), info2 = card && card.querySelector('.vx-who') ? txt(card.querySelector('.vx-who')) : '';
      return { key: 'engagement', ctx: Object.assign({}, pc, { model: m[1], modelInfo: info2 }) };
    }
    if (pc.type === 'services' && (m = t.match(/^Discuss: (.+)$/))) {
      var panel = link.closest('.vx-goal-panel');
      var recs = panel ? Array.prototype.map.call(panel.querySelectorAll('.vx-goal-r b'), txt) : [];
      return { key: 'goal', ctx: { goal: m[1], recs: recs } };
    }
    if (pc.type === 'services' && /^(Book a discovery call|Discuss a project|Discuss a dedicated pod)$/i.test(t)) {
      var model = /discovery/i.test(t) ? 'Discovery or assessment' : /project/i.test(t) ? 'Fixed-scope project' : 'Dedicated pod';
      return { key: 'engagement', ctx: { model: model } };
    }
    if (/^Ask us (anything|a question)$/i.test(t)) return { key: 'question', ctx: { service: pc.service, title: pc.service ? 'Ask us about ' + pc.service : null, kicker: pc.service || 'Question' } };
    if (/^Talk to an expert about this$/i.test(t)) {
      var sigs = Array.prototype.map.call(document.querySelectorAll('.vx-sig[aria-pressed="true"]'), txt);
      return { key: 'consult', ctx: Object.assign({}, pc, { lead: serviceLead(), title: 'Talk to ' + an((pc.service || 'our') + ' expert'), signals: sigs }) };
    }
    // enterprise
    if ((m = t.match(/^Discuss an? ((?:Foundation|Scale|Enterprise) Pod)$/i))) return { key: 'pod', ctx: { pod: m[1] } };
    if (/sample contract/i.test(t)) return { key: 'contract', ctx: {} };
    if (/executive briefing|leadership team|agenda with us/i.test(t)) return { key: 'briefing', ctx: { title: /agenda/i.test(t) ? 'Discuss your transformation agenda' : null } };
    // ventures
    if (/co-invest/i.test(t)) return { key: 'investor', ctx: {} };
    if (/partner with the studio|studio team/i.test(t)) return { key: 'partner', ctx: {} };
    // solutions
    if (/^Book a demo/i.test(t) && pc.solution) return { key: 'demo', ctx: pc };
    // page defaults (header "Talk to Stack18", "Contact", generic CTAs)
    switch (pc.type) {
      case 'solution': return { key: 'demo', ctx: pc };
      case 'solutions': return { key: 'solutionsGeneral', ctx: { title: /consultation/i.test(t) ? 'Book a free consultation' : null } };
      case 'service': return { key: 'consult', ctx: Object.assign({}, pc, { lead: serviceLead() }) };
      case 'services': return { key: 'consult', ctx: { lead: 'architect' } };
      case 'enterprise': return { key: 'aiplan', ctx: {} };
      case 'platform': return { key: 'platform', ctx: {} };
      case 'ventures': return { key: 'chooser', ctx: { ventures: true } };
    }
    return { key: 'chooser', ctx: {} };
  }

  // ------------------------------------------------------------------ rendering
  var uid = 0;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var BASE_FIELDS = {
    name: { n: 'name', l: 'Full name', t: 'text', req: true, ac: 'name' },
    email: { n: 'email', l: 'Work email', t: 'email', req: true, ac: 'email' },
    phone: { n: 'mobile', l: 'Phone / WhatsApp', t: 'tel', ac: 'tel' },
    company: { n: 'company', l: 'Company', t: 'text', req: true, ac: 'organization' },
    size: { n: 'company_size', l: 'Company size', t: 'select', o: SIZES }
  };
  function fieldHtml(f) {
    if (!f) return '';
    if (typeof f === 'string') f = BASE_FIELDS[f];
    var id = 'lp-f' + (++uid), req = f.req ? ' required' : '', star = f.req ? ' <span class="lp-req" aria-hidden="true">*</span>' : '';
    var vals = Array.isArray(f.v) ? f.v : (f.v ? [f.v] : []);
    if (f.t === 'chips' || f.t === 'multi') {
      var type = f.t === 'multi' ? 'checkbox' : 'radio', nm = f.t === 'multi' ? f.n + '[]' : f.n;
      return '<fieldset class="lp-field lp-full" data-name="' + esc(f.n) + '"><legend>' + esc(f.l) + star + '</legend><div class="lp-chips">' +
        f.o.map(function (o) { return '<label class="lp-chip"><input type="' + type + '" name="' + esc(nm) + '" value="' + esc(o) + '"' + (vals.indexOf(o) > -1 ? ' checked' : '') + '><span>' + esc(o) + '</span></label>'; }).join('') + '</div></fieldset>';
    }
    if (f.t === 'select') {
      return '<label class="lp-field" for="' + id + '"><span>' + esc(f.l) + star + '</span><select id="' + id + '" name="' + esc(f.n) + '"' + req + '><option value="">Select…</option>' +
        f.o.map(function (o) { return '<option' + (vals.indexOf(o) > -1 ? ' selected' : '') + '>' + esc(o) + '</option>'; }).join('') + '</select></label>';
    }
    if (f.t === 'textarea') {
      return '<label class="lp-field lp-full" for="' + id + '"><span>' + esc(f.l) + star + '</span><textarea id="' + id + '" name="' + esc(f.n) + '" rows="3"' + req + ' placeholder="' + esc(f.ph || '') + '"></textarea></label>';
    }
    var full = (f.t === 'url' || (f.t === 'text' && f.n !== 'company' && f.n !== 'name' && f.n !== 'role' && f.n !== 'gstin')) ? ' lp-full' : '';
    return '<label class="lp-field' + full + '" for="' + id + '"><span>' + esc(f.l) + star + '</span><input id="' + id + '" type="' + f.t + '" name="' + esc(f.n) + '"' + req +
      (f.ac ? ' autocomplete="' + f.ac + '"' : '') + ' placeholder="' + esc(f.ph || '') + '"></label>';
  }

  var overlay = document.createElement('div');
  overlay.className = 'lp-overlay';
  overlay.innerHTML = '<div class="lp" role="dialog" aria-modal="true" aria-labelledby="lp-title"><aside class="lp-side"></aside><div class="lp-main"><button type="button" class="lp-x" aria-label="Close">×</button><div class="lp-body"></div></div></div>';
  document.body.appendChild(overlay);
  var side = overlay.querySelector('.lp-side'), body = overlay.querySelector('.lp-body'), lastFocus = null, current = null;

  function sideHtml(c) {
    return '<span class="lp-kicker">' + esc(c.kicker) + '</span><h2 id="lp-title">' + esc(c.title) + '</h2><p class="lp-sub">' + esc(c.sub) + '</p>' +
      (c.summary ? '<div class="lp-summary">' + c.summary + '</div>' : '') +
      '<div class="lp-block"><small>What you get</small><ul class="lp-get">' + c.get.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>' +
      '<div class="lp-block lp-hide-sm"><small>What happens next</small><ol class="lp-next">' + c.next.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ol></div>' +
      '<p class="lp-trust lp-hide-sm">Reply within one business day · Confidential · No spam</p>';
  }

  function open(key, ctx, trigger) {
    ctx = ctx || {};
    lastFocus = trigger || document.activeElement;
    if (key === 'ventures') key = 'chooser', ctx = { ventures: true };
    var c = typeof I[key] === 'function' ? I[key](ctx) : I[key];
    current = { key: key, c: c, ctx: ctx, trigger: trigger ? txt(trigger) : key };
    overlay.querySelector('.lp').className = 'lp lp-' + key;
    side.innerHTML = sideHtml(c);
    if (key === 'chooser') body.innerHTML = chooserHtml(ctx);
    else if (c.founder) body.innerHTML = founderHtml();
    else body.innerHTML = formHtml(c);
    overlay.classList.add('is-open');
    document.documentElement.classList.add('lp-lock');
    var dlg = overlay.querySelector('.lp'); dlg.scrollTop = 0; overlay.querySelector('.lp-main').scrollTop = 0;
    setTimeout(function () { var small = window.matchMedia('(max-width: 820px)').matches;
      var f = small ? overlay.querySelector('.lp-x') : body.querySelector('input:not([type=hidden]):not([tabindex="-1"]),button.lp-choice,a.btn');
      if (f) f.focus({ preventScroll: true }); dlg.scrollTop = 0; }, 60);
  }
  function close() {
    overlay.classList.remove('is-open');
    document.documentElement.classList.remove('lp-lock');
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function chooserHtml(ctx) {
    var list = ctx.ventures
      ? [{ k: 'founder', t: 'I am a founder', d: 'Apply to build a company with the studio.' }, { k: 'investor', t: 'I want to co-invest', d: 'Angels and funds interested in studio ventures.' },
         { k: 'partner', t: 'I represent a company', d: 'Corporate venture build or design partnership.' }, { k: 'question', t: 'Something else', d: 'Any other question for the studio.' }]
      : CHOICES;
    return '<p class="lp-step">Step 1 of 2</p><h3 class="lp-h">What brings you here?</h3><div class="lp-choices">' +
      list.map(function (x) { return '<button type="button" class="lp-choice" data-go="' + x.k + '"><b>' + esc(x.t) + '</b><span>' + esc(x.d) + '</span></button>'; }).join('') + '</div>';
  }
  function founderHtml() {
    var onVentures = pageCtx().type === 'ventures';
    return '<h3 class="lp-h">Apply through the studio application</h3><p class="lp-p">It takes about 10 minutes. Tell us the problem you want to solve, or pick an open brief if you do not have an idea yet.</p>' +
      '<a class="btn btn-primary lp-wide" href="' + (onVentures ? '#apply' : '/ventures#apply') + '" data-lp-close>Go to the application</a>' +
      '<button type="button" class="lp-back" data-go="chooser-back">Back</button>';
  }
  function formHtml(c) {
    var hidden = c.hidden || {};
    var h = Object.keys(hidden).map(function (k) { return hidden[k] ? '<input type="hidden" name="' + esc(k) + '" value="' + esc(hidden[k]) + '">' : ''; }).join('');
    return '<form class="lp-form" novalidate>' + h +
      '<div class="lp-hp" aria-hidden="true"><label>Leave empty<input type="text" name="website_hp" tabindex="-1" autocomplete="off"></label></div>' +
      (current.ctx && current.ctx.fromChooser ? '<button type="button" class="lp-back" data-go="chooser-back">Back</button>' : '') +
      (c.signals && c.signals.length ? '<div class="lp-note"><small>You told us</small>' + c.signals.map(esc).join(' · ') + '</div>' : '') +
      '<div class="lp-grid">' + c.fields.map(fieldHtml).join('') + '</div>' +
      '<button type="submit" class="btn btn-primary lp-submit">' + esc(c.submit) + '</button>' +
      '<p class="lp-status" role="status" aria-live="polite"></p>' +
      '<p class="lp-priv">By sending, you agree to be contacted about this request. See our <a href="/privacy-policy">privacy policy</a>.</p></form>';
  }

  function summaryMessage(form) {
    var c = current.c, lines = ['Request: ' + c.title + ' (' + c.kicker + ')'];
    if (c.baseMessage) lines.push(c.baseMessage);
    if (c.signals && c.signals.length) lines.push('Signals: ' + c.signals.join('; '));
    var seen = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (!el.name || el.type === 'hidden' || /^(name|email|mobile|company|message|website_hp)$/.test(el.name)) return;
      if ((el.type === 'radio' || el.type === 'checkbox') && !el.checked) return;
      var key = el.name.replace('[]', ''); if (!el.value) return;
      seen[key] = (seen[key] ? seen[key] + ', ' : '') + el.value;
    });
    Object.keys(seen).forEach(function (k) { lines.push(k.replace(/_/g, ' ').replace(/^\w/, function (x) { return x.toUpperCase(); }) + ': ' + seen[k]); });
    return lines.join('\n');
  }

  function submit(form) {
    var st = form.querySelector('.lp-status'), btn = form.querySelector('.lp-submit');
    form.querySelectorAll('.is-bad').forEach(function (x) { x.classList.remove('is-bad'); });
    var bad = [];
    form.querySelectorAll('[required]').forEach(function (f) {
      var v = f.value.trim();
      if (!v || (f.type === 'email' && !/^\S+@\S+\.\S+$/.test(v)) || (f.type === 'url' && !/^https?:\/\/\S+\.\S+/.test(v))) bad.push(f);
    });
    if (bad.length) { bad.forEach(function (f) { f.classList.add('is-bad'); }); bad[0].focus(); st.textContent = 'Please complete the highlighted fields.'; st.className = 'lp-status err'; return; }
    var fd = new FormData(form);
    if (fd.get('website_hp')) { fd.set('website', fd.get('website_hp')); }
    fd.delete('website_hp');
    var userMsg = (fd.get('message') || '').trim(), sum = summaryMessage(form);
    fd.set('message', userMsg ? userMsg + '\n\nDetails:\n' + sum : sum);
    fd.append('reason', current.c.reason || 'other');
    fd.append('source', current.trigger + ' — ' + current.c.title + ' — ' + document.title);
    btn.disabled = true; st.className = 'lp-status'; st.textContent = 'Sending…';
    fetch('/contact-handler.php', { method: 'POST', body: fd, headers: { Accept: 'application/json' } })
      .then(function (r) { return r.json().catch(function () { return { success: false }; }); })
      .then(function (d) {
        if (d && d.success) {
          var done = current.c.done || ['Thank you', 'We will reply within one business day.'];
          body.innerHTML = '<div class="lp-done"><div class="lp-tick" aria-hidden="true"></div><h3 class="lp-h">' + esc(done[0]) + '</h3><p class="lp-p">' + esc(done[1]) + '</p><button type="button" class="btn btn-primary" data-lp-close>Done</button></div>';
          body.querySelector('[data-lp-close]').focus();
        } else { st.className = 'lp-status err'; st.textContent = (d && d.error) || 'Something went wrong. Please try again, or use the contact page.'; btn.disabled = false; }
      })
      .catch(function () { st.className = 'lp-status err'; st.textContent = 'Network problem. Please try again.'; btn.disabled = false; });
  }

  // ------------------------------------------------------------------ events
  document.addEventListener('click', function (e) {
    var link = e.target.closest && e.target.closest('a[href="/contact"], a[href="/contact.html"]');
    if (!link || link.target === '_blank' || e.metaKey || e.ctrlKey || e.shiftKey || e.button === 1) return;
    if (link.closest('footer') || /contact page/i.test(txt(link)) || link.hasAttribute('data-no-popup')) return; // plain navigation
    e.preventDefault();
    var r = resolve(link); open(r.key, r.ctx, link);
  });
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay || e.target.closest('.lp-x') || e.target.closest('[data-lp-close]')) { close(); return; }
    var go = e.target.closest('[data-go]');
    if (go) {
      var k = go.getAttribute('data-go'), wasVentures = current && current.ctx && current.ctx.ventures;
      if (k === 'chooser-back') { open('chooser', current.ctx.ventures || current.ctx.fromVentures ? { ventures: true } : {}, lastFocus); return; }
      var ctx = { fromChooser: true, fromVentures: wasVentures };
      var pc = pageCtx(); if (pc.service) { ctx.service = pc.service; ctx.lead = serviceLead(); } if (pc.solution) ctx.solution = pc.solution;
      open(k === 'ventures' ? 'chooser' : k, k === 'ventures' ? { ventures: true } : ctx, lastFocus);
    }
  });
  overlay.addEventListener('submit', function (e) { if (e.target.classList.contains('lp-form')) { e.preventDefault(); submit(e.target); } });
  document.addEventListener('keydown', function (e) {
    if (!overlay.classList.contains('is-open')) return;
    if (e.key === 'Escape') { close(); return; }
    if (e.key === 'Tab') { // focus trap
      var f = overlay.querySelectorAll('button,a[href],input:not([type=hidden]):not([tabindex="-1"]),select,textarea');
      f = Array.prototype.filter.call(f, function (x) { return x.offsetParent !== null; });
      if (!f.length) return;
      if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    }
  });

  window.S18Lead = { open: function (key, ctx) { open(key, ctx || {}, document.activeElement); } };
})();
