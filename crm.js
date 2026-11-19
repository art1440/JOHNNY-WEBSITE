/* =====================================================================
   Verion Life — Client Dashboard (CRM)
   Static front end with sample data. Changes you make (status, notes,
   texts) are kept in this browser only. Leads submitted through the
   website form in this same browser show up live (CRM_DEMO in config.js).
   ===================================================================== */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const CFG = window.VERION_CONFIG || {};
  /* Live mode: with DASHBOARD_API_URL set (Google Sheet web app), real leads replace the sample data */
  const API = String(CFG.DASHBOARD_API_URL || '').trim();
  const LIVE_MODE = !!API;
  const KEYK = 'verion_dash_key';
  let apiKey = ''; try { apiKey = localStorage.getItem(KEYK) || ''; } catch { }
  let server = [];
  if (LIVE_MODE) document.documentElement.classList.add('connected');
  const EASE = 'cubic-bezier(.16,1,.3,1)', SPRING = 'cubic-bezier(.34,1.3,.64,1)';
  const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  /* Web Animations helper: no-op under reduced motion. Returns a promise-like. */
  const anim = (el, kf, o = {}) => {
    if (reduce || !el || !el.animate) return { finished: Promise.resolve() };
    return el.animate(kf, Object.assign({ easing: EASE, fill: 'backwards' }, o));
  };
  const rise = (els, base = 0, step = 45) => els.forEach((el, k) =>
    anim(el, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 480, delay: base + k * step }));

  /* ---------- Icons ---------- */
  const P = {
    overview: '<rect x="3" y="3" width="7" height="7" rx="1.6"/><rect x="14" y="3" width="7" height="7" rx="1.6"/><rect x="3" y="14" width="7" height="7" rx="1.6"/><rect x="14" y="14" width="7" height="7" rx="1.6"/>',
    leads: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.8-3.5 3.4-5.5 6.5-5.5s5.7 2 6.5 5.5M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.8c1.9.7 3.1 2.5 3.5 5.2"/>',
    calendar: '<rect x="3" y="4.5" width="18" height="16" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4"/>',
    inbox: '<path d="M3 13.5 5.6 5.4A2 2 0 0 1 7.5 4h9a2 2 0 0 1 1.9 1.4L21 13.5V18a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M3 13.5h5l1.5 2.5h5l1.5-2.5h5"/>',
    reviews: '<path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z"/>',
    settings: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2.2"/><circle cx="9" cy="17" r="2.2"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
    phone: '<path d="M5 3.5h3.2l1.6 4.2-2 1.3a11 11 0 0 0 5.2 5.2l1.3-2 4.2 1.6V17a2.5 2.5 0 0 1-2.7 2.5A16 16 0 0 1 2.5 6.2 2.5 2.5 0 0 1 5 3.5z"/>',
    missed: '<path d="M5 3.5h3.2l1.6 4.2-2 1.3a11 11 0 0 0 5.2 5.2l1.3-2 4.2 1.6V17a2.5 2.5 0 0 1-2.7 2.5A16 16 0 0 1 2.5 6.2 2.5 2.5 0 0 1 5 3.5zM15 3.5l5 5M20 3.5l-5 5"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.7 5.6 3.7 9s-1.2 6.4-3.7 9c-2.5-2.6-3.7-5.6-3.7-9S9.5 5.6 12 3z"/>',
    instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.3" cy="6.7" r=".7" fill="currentColor"/>',
    facebook: '<path d="M14 21v-7.5h2.6l.4-3H14V8.7c0-.9.3-1.5 1.6-1.5H17V4.5a19 19 0 0 0-2.3-.1c-2.3 0-3.8 1.4-3.8 3.9v2.2H8.3v3H11V21"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    send: '<path d="M21 3 10 14M21 3l-6.5 18-4.5-7-7-4.5z"/>',
    booked: '<rect x="3" y="4.5" width="18" height="16" rx="2.5"/><path d="M3 9.5h18M8 2.5v4M16 2.5v4M9 15l2 2 4-4"/>',
    text: '<path d="M4 5h16v11H9l-5 4z"/>',
    form: '<rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M9 8h6M9 12h6M9 16h3"/>',
    lost: '<circle cx="12" cy="12" r="9"/><path d="m9 9 6 6M15 9l-6 6"/>',
    note: '<path d="M5 4h10l4 4v12H5z"/><path d="M14 4v5h5M8.5 13h7M8.5 16.5h5"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7z"/>',
    left: '<path d="m15 6-6 6 6 6"/>', right: '<path d="m9 6 6 6-6 6"/>', close: '<path d="M6 6l12 12M18 6 6 18"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    star: '<path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 16.8l-5.4 2.9 1.1-6.1-4.5-4.2 6.1-.8z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  };
  const ic = (n, s = 20) => `<svg class="i" width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ''}</svg>`;
  const fillIcons = (root = document) => $$('[data-i]', root).forEach(e => { if (!e.firstChild) e.innerHTML = ic(e.dataset.i); });

  /* ---------- Vocabulary (matches the website form's fields) ---------- */
  const PROTECT = { family: 'Spouse & kids', spouse: 'Spouse / partner', 'final-expenses': 'Final expenses', mortgage: 'Mortgage / debts',
    // IUL form (current)
    'life-insurance': 'Life insurance', 'grow-savings': 'Save & grow money', 'living-benefits': 'Living benefits', 'all-3': 'All 3 benefits' };
  const COVER = { '<100k': 'Under $100k', '100-250k': '$100k–$250k', '250-500k': '$250k–$500k', '500k+': '$500k+',
    '100-200': '$100–$200/mo', '200-300': '$200–$300/mo', '300-400': '$300–$400/mo', '500+': '$500+/mo' };
  const SAVE_MID = { '100-200': 150, '200-300': 250, '300-400': 350, '500+': 550 };   // monthly IUL contribution
  const COVER_MID = { '<100k': 50000, '100-250k': 175000, '250-500k': 375000, '500k+': 600000 };
  const RATE = { '18-34': .55, '35-49': 1, '50-64': 2.6, '65+': 6.5 };   // rough $/yr per $1k of term coverage
  const SRC = {
    // [full label, icon, short label for the leads table]
    website: ['Website form', 'globe', 'Website'], missed: ['Missed call', 'missed', 'Call'], instagram: ['Instagram', 'instagram', 'Instagram'],
    facebook: ['Facebook ad', 'facebook', 'Facebook'], google: ['Google', 'search', 'Google'], referral: ['Referral', 'link', 'Referral'],
  };
  const STAGES = ['new', 'contacted', 'booked', 'lost'];
  const STAGE_LABEL = { new: 'New', contacted: 'Contacted', booked: 'Booked', lost: 'Lost' };

  const premium = l => {
    if (SAVE_MID[l.coverage]) return SAVE_MID[l.coverage] * 12;   // IUL lead: they told us the monthly amount
    let p = COVER_MID[l.coverage] / 1000 * RATE[l.age] * (l.tobacco === 'yes' ? 2.4 : 1);
    if (l.protect === 'final-expenses') p = Math.min(COVER_MID[l.coverage], 25000) / 1000 * RATE[l.age] * 6;
    return Number.isFinite(p) ? Math.max(120, Math.round(p / 5) * 5) : 0;
  };
  const money = n => '$' + Math.round(n).toLocaleString('en-US');
  const initials = l => ((l.first || '?')[0] + ((l.last || '')[0] || '')).toUpperCase();
  const shortName = l => l.first + (l.last ? ' ' + l.last[0] + '.' : '');
  // IUL form: 1–10, how important a more secure financial future is to them. Hot ≥ 8, warm 5–7, cool ≤ 4.
  const CALL_WINDOW = { morning: 'Morning (9am–12pm)', afternoon: 'Afternoon (12–5pm)', evening: 'Evening (5–8pm)' };
  const prio = l => { const n = Math.round(+l.priority); return n >= 1 && n <= 10 ? n : 0; };
  const heat = n => n >= 8 ? 'hot' : n >= 5 ? 'warm' : 'cool';
  const HEAT_LABEL = { hot: 'Hot lead', warm: 'Interested', cool: 'Just looking' };

  /* ---------- Time ---------- */
  const MIN = 6e4, HOUR = 36e5, DAY = 864e5;
  const startOfDay = d => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x.getTime(); };
  const tfmt = ms => new Date(ms).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const dayDiff = ms => Math.round((startOfDay(Date.now()) - startOfDay(ms)) / DAY);
  function when(ms) {
    const dd = dayDiff(ms);
    if (dd === 0) return 'Today, ' + tfmt(ms);
    if (dd === 1) return 'Yesterday, ' + tfmt(ms);
    if (dd > 1 && dd < 7) return new Date(ms).toLocaleDateString('en-US', { weekday: 'short' }) + ', ' + tfmt(ms);
    if (dd >= 7 && dd < 14) return 'Last week';
    return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  function apptLabel(ms) {
    const dd = dayDiff(ms);
    const day = dd === 0 ? 'Today' : dd === -1 ? 'Tomorrow' : new Date(ms).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    return day + ', ' + tfmt(ms);
  }
  // table column: just enough to scan; the full date is in the tooltip
  function whenShort(ms) {
    const dd = dayDiff(ms);
    if (dd === 0) return tfmt(ms);
    if (dd === 1) return 'Yesterday';
    if (dd > 1 && dd < 7) return new Date(ms).toLocaleDateString('en-US', { weekday: 'long' });
    return new Date(ms).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  const ago = ms => { const m = Math.max(1, Math.round((Date.now() - ms) / MIN)); return m < 60 ? m + ' min' : m < 1440 ? Math.round(m / 60) + ' h' : Math.round(m / 1440) + ' d'; };
  const at = (daysFromToday, h, m = 0) => { const d = new Date(); d.setDate(d.getDate() + daysFromToday); d.setHours(h, m, 0, 0); return d.getTime(); };

  /* ---------- Sample data (times are relative to "now" so the demo always looks current) ---------- */
  function seed() {
    const now = Date.now();
    const L = (id, first, last, phone, protect, age, coverage, priority, source, status, createdAgo, extra = {}) =>
      Object.assign({ id, first, last, phone, email: `${first}.${last[0]}@example.com`.toLowerCase(), protect, age, coverage, priority, source, status, created: now - createdAgo, note: '' }, extra);
    return [
      L('s1', 'María', 'González', '(312) 555-0142', 'all-3', '35-49', '200-300', 9, 'website', 'new', 38 * MIN, { note: 'Two kids, 4 and 7. Wants something that protects them and builds savings.' }),
      L('s2', 'José', 'Ramírez', '(312) 555-0187', 'grow-savings', '35-49', '300-400', 7, 'missed', 'new', 2.2 * HOUR, { note: 'Called on lunch break. Has a 401k, asked how IUL compares.' }),
      L('s3', 'Javier', 'Herrera', '(773) 555-0119', 'life-insurance', '18-34', '100-200', 4, 'instagram', 'new', 5.5 * HOUR),
      L('s4', 'Carmen', 'Díaz', '(708) 555-0163', 'living-benefits', '50-64', '200-300', 8, 'facebook', 'contacted', 21 * HOUR, { note: 'Prefers calls after 3 PM. Daughter helps with paperwork.' }),
      L('s5', 'Luis', 'Morales', '(312) 555-0104', 'grow-savings', '18-34', '100-200', 6, 'instagram', 'contacted', 27 * HOUR),
      L('s6', 'Ana', 'López', '(773) 555-0178', 'all-3', '35-49', '500+', 10, 'referral', 'booked', 31 * HOUR, { appt: at(1, 11), note: 'Referred by Carmen D. Self-employed; ask about tax-free retirement income.' }),
      L('s7', 'Roberto', 'Sánchez', '(630) 555-0151', 'living-benefits', '50-64', '300-400', 8, 'google', 'booked', 50 * HOUR, { appt: at(2, 15, 30) }),
      L('s8', 'Daniela', 'Pérez', '(312) 555-0126', 'life-insurance', '18-34', '100-200', 7, 'website', 'booked', 3.2 * DAY, { appt: at(0, 16) }),
      L('s9', 'Sofía', 'Torres', '(708) 555-0192', 'grow-savings', '35-49', '200-300', 5, 'website', 'contacted', 4.1 * DAY),
      L('s10', 'Miguel', 'Ángel', '(773) 555-0135', 'life-insurance', '65+', '100-200', 3, 'missed', 'lost', 9 * DAY, { note: 'Went with his bank\'s policy.' }),
    ];
  }
  const ORIGIN = {
    website: 'Submitted the quote form', missed: 'Missed call · no voicemail', instagram: 'Sent a DM on Instagram',
    facebook: 'Filled out a Facebook lead ad', google: 'Called from Google Business Profile', referral: 'Referred by a client',
  };
  function baseActivity(l) {
    const a = [{ t: 'origin', text: ORIGIN[l.source], at: l.created }];
    if (l.status !== 'new') a.unshift({ t: 'text', text: 'Text sent', at: l.created + (2 + (+l.id.slice(1) * 7) % 5) * MIN });
    if (l.status === 'booked' && l.appt) a.unshift({ t: 'booked', text: 'Call booked · ' + apptLabel(l.appt), at: l.created + 3 * HOUR });
    if (l.status === 'lost') a.unshift({ t: 'lost', text: 'Marked as lost', at: l.created + 2 * DAY });
    return a;
  }
  const THREADS = {
    s4: [['out', 'Hola Carmen, le escribe su agente de Verion Life. Recibí su solicitud para gastos finales. ¿Tiene 10 minutos hoy para una llamada?', 20.8 * HOUR], ['in', 'Sí, después de las 3. Gracias', 20 * HOUR]],
    s5: [['out', 'Hola Luis, soy su agente de Verion Life. Vi su solicitud de cotización. ¿Cuándo le queda bien una llamada rápida?', 26.7 * HOUR], ['in', '¿Puede ser mañana en la mañana? Trabajo hasta las 6', 1.4 * HOUR, 'unread']],
    s9: [['out', 'Hola Sofía, gracias por su solicitud. Tengo algunas opciones para hacer crecer su ahorro. ¿Le llamo hoy?', 4 * DAY], ['in', '¿Cuánto tendría ahorrado en 20 años con $250 al mes?', 50 * MIN, 'unread']],
    s6: [['out', 'Hola Ana, Carmen me dio su número. Con gusto le ayudo con su cotización.', 30 * HOUR], ['in', 'Perfecto, nos vemos mañana a las 11', 28 * HOUR]],
    s7: [['out', 'Hola Roberto, le confirmo nuestra llamada. Le envío la invitación.', 47 * HOUR], ['in', 'Ok gracias', 46 * HOUR]],
  };
  const textTemplate = l => `Hola ${l.first}, le escribe su agente de Verion Life. Recibí su solicitud de cotización para ${({ family: 'proteger a su familia', spouse: 'proteger a su pareja', 'final-expenses': 'gastos finales', mortgage: 'cubrir su hipoteca',
    'life-insurance': 'seguro de vida', 'grow-savings': 'ahorrar y hacer crecer su dinero', 'living-benefits': 'beneficios en vida', 'all-3': 'seguro de vida, ahorro y beneficios en vida' })[l.protect] || 'seguro de vida'}. ¿Tiene 10 minutos hoy para una llamada?`;

  /* ---------- Persistence (this browser only) ---------- */
  const KEY = 'verion_crm_v1', LIVE = 'verion_live_leads';
  const blank = () => ({ status: {}, appt: {}, act: {}, notes: {}, msgs: {}, read: [], prefs: { alert: true, autoreply: true, digest: false }, sims: [] });
  const load = k => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
  let S = Object.assign(blank(), load(KEY) || {});
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { } };

  const fromWebsite = w => {
    const [first, ...rest] = (w.full_name || w.first_name || 'Website lead').trim().split(/\s+/);
    return {
      id: String(w.id || 'w' + Date.parse(w.submitted_at)), first, last: rest.join(' ') || w.last_name || '', phone: String(w.phone || ''), email: String(w.email || ''),
      protect: w.protecting, age: w.age_range, coverage: w.coverage_amount, tobacco: w.tobacco, priority: w.priority, source: 'website', status: 'new',
      requested: Date.parse(w.call_at) || undefined, // older leads: exact call time picked on the form
      callWindow: w.call_window || '',                  // best time to call: morning / afternoon / evening
      created: Date.parse(w.submitted_at) || Date.now(), note: '', live: true,
    };
  };
  // a row from the Google Sheet: stage, note, call time and activity log are stored there
  const fromServer = r => {
    const l = fromWebsite(r);
    l.live = false; l.real = true;
    l.status = STAGES.includes(r.status) ? r.status : 'new';
    l.note = String(r.note || '');
    if (+r.appt) l.appt = +r.appt;
    try { l.log = JSON.parse(r.activity || '[]'); } catch { l.log = []; }
    if (!Array.isArray(l.log)) l.log = [];
    l.premium = premium(l);
    l.act = [...l.log, { t: 'origin', text: ORIGIN.website, at: l.created }];
    return l;
  };
  let leads = [];
  function build() {
    if (LIVE_MODE) { leads = server.map(fromServer).sort((a, b) => b.created - a.created); return; }
    const live = (load(LIVE) || []).map(fromWebsite);
    leads = [...live, ...S.sims, ...seed()].map(l => {
      if (S.status[l.id]) l.status = S.status[l.id];
      if (l.id in S.appt) { if (S.appt[l.id]) l.appt = S.appt[l.id]; else delete l.appt; }
      if (l.id in S.notes) l.note = S.notes[l.id];
      l.premium = premium(l);
      l.act = [...(S.act[l.id] || []), ...baseActivity(l)];
      return l;
    }).sort((a, b) => b.created - a.created);
  }
  const byId = id => leads.find(l => l.id === id);
  const counts = () => STAGES.reduce((o, s) => (o[s] = leads.filter(l => l.status === s).length, o), { all: leads.length });
  const open = () => leads.filter(l => l.status !== 'lost');

  /* ---------- Small motion utilities ---------- */
  function tween(el, to, fmt = String, dur = 750) {
    if (!el) return;
    const from = +el.dataset.v || 0; el.dataset.v = to;
    if (reduce || from === to) { el.textContent = fmt(to); return; }
    const t0 = performance.now();
    const step = t => { const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4); el.textContent = fmt(Math.round(from + (to - from) * e)); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  }
  // Slide an indicator under the active control (sidebar, filters, stage)
  function slide(ind, target, instant) {
    if (!ind) return;
    if (!target || !target.offsetParent) { ind.classList.remove('ready'); return; }
    ind.classList.toggle('instant', !!instant || !ind.classList.contains('ready'));
    ind.style.width = target.offsetWidth + 'px'; ind.style.height = target.offsetHeight + 'px';
    ind.style.transform = `translate(${target.offsetLeft}px,${target.offsetTop}px)`;
    ind.offsetWidth; // commit before enabling transitions next time
    ind.classList.add('ready');
    requestAnimationFrame(() => ind.classList.remove('instant'));
  }
  function bump(el) { anim(el, [{ transform: 'scale(1)' }, { transform: 'scale(1.35)' }, { transform: 'scale(1)' }], { duration: 480, easing: SPRING }); }
  function grow(el) { // animate an element in from zero height
    if (reduce) return;
    const h = el.offsetHeight;
    el.animate([{ height: '0px', opacity: 0 }, { height: h + 'px', opacity: 1 }], { duration: 420, easing: EASE });
  }

  function toast(title, sub, icon = 'check') {
    const t = document.createElement('div');
    t.className = 'toast';
    t.innerHTML = `<span class="ti">${ic(icon, 18)}</span><div><b>${esc(title)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</div>`;
    $('#toasts').append(t);
    anim(t, [{ opacity: 0, transform: 'translateY(16px) scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: 520, easing: SPRING });
    setTimeout(() => anim(t, [{ opacity: 1 }, { opacity: 0, transform: 'translateY(8px) scale(.98)' }], { duration: 220, fill: 'forwards' }).finished.then(() => t.remove()), 3400);
  }

  /* ---------- Badges + header numbers ---------- */
  function unreadThreads() { return Object.entries(THREADS).filter(([id, m]) => byId(id) && m.some(x => x[3] === 'unread') && !S.read.includes(id)).length; }
  function badges(animate) {
    const b1 = $('#bLeads'), b2 = $('#bInbox'), n1 = counts().new, n2 = unreadThreads();
    if (animate && +b1.dataset.n !== n1 && n1) requestAnimationFrame(() => bump(b1));
    b1.textContent = b1.dataset.n = n1; b2.textContent = b2.dataset.n = n2;
  }

  /* =====================================================================
     NAVIGATION
     ===================================================================== */
  let view = null;
  const sideInd = $('#side .ind');
  function go(v, opts = {}) {
    if (v === view && !opts.force) return;
    const prev = view && $(`.view[data-view="${view}"]`);
    view = v;
    $$('#side button').forEach(b => b.classList.toggle('on', b.dataset.go === v));
    slide(sideInd, $(`#side [data-go="${v}"]`));
    try { history.replaceState(null, '', '#' + v); } catch { }
    const show = () => {
      if (prev) prev.classList.remove('on');
      const el = $(`.view[data-view="${v}"]`);
      el.classList.add('on');
      RENDER[v](opts);
      rise($$('[data-rise]', el).filter(x => !(x === detailEl && sheet.matches))); // the slide-over has its own motion
      $('.main').scrollTop = 0;
    };
    if (prev && prev !== $(`.view[data-view="${v}"]`)) anim(prev, [{ opacity: 1 }, { opacity: 0, transform: 'translateY(-4px)' }], { duration: 120, fill: 'forwards' }).finished.then(() => { prev.getAnimations?.().forEach(a => a.cancel()); show(); });
    else show();
  }
  $('#side').addEventListener('click', e => { const b = e.target.closest('[data-go]'); if (b) go(b.dataset.go); });

  /* =====================================================================
     LEADS
     ===================================================================== */
  let filter = 'all', query = '', selected = null;
  const rowsEl = $('#rows'), selEl = $('.sel', rowsEl), detailEl = $('#detail');
  const filtersEl = $('#filters');
  const digits = s => s.replace(/\D/g, '');
  const matches = l => !query || (l.first + ' ' + l.last).toLowerCase().includes(query) || (digits(query).length > 2 && digits(l.phone).includes(digits(query)));
  const visible = () => leads.filter(l => (filter === 'all' || l.status === filter) && matches(l));

  const rowHTML = l => `
    <span class="av">${esc(initials(l))}</span>
    <div class="who"><b><span class="nm">${esc(shortName(l))}</span></b><small>${esc(PROTECT[l.protect] || '')} · ${esc(COVER[l.coverage] || '')}</small></div>
    <span class="src"><span class="chip" title="${SRC[l.source][0]}">${ic(SRC[l.source][1], 15)}<span>${SRC[l.source][2]}</span></span></span>
    <span class="st"><span class="pill ${l.status}">${STAGE_LABEL[l.status]}</span>${prioHTML(l)}</span>
    <div class="val"><b>${money(l.premium)}</b><small title="${when(l.created)}">${whenShort(l.created)}</small></div>`;
  // tiny 1–10 meter under the stage tag; the fill grows in when the row enters
  const prioHTML = l => { const n = prio(l); return n ? `<span class="pr ${heat(n)}" title="Priority ${n}/10 · ${HEAT_LABEL[heat(n)]}"><span class="pr-bar"><i style="transform:scaleX(${n / 10})"></i></span>${n}</span>` : ''; };
  const growPrio = (root, delay = 0) => $$('.pr-bar i', root).forEach((i, k) =>
    anim(i, [{ transform: 'scaleX(0)' }, { transform: i.style.transform }], { duration: 700, delay: delay + k * 35 }));
  function makeRow(l) {
    const r = document.createElement('div');
    r.className = 'row' + (l.live ? ' live' : ''); r.dataset.id = l.id;
    r.tabIndex = 0; r.setAttribute('role', 'button'); r.setAttribute('aria-label', `${shortName(l)}, ${STAGE_LABEL[l.status]}`);
    r.innerHTML = rowHTML(l);
    return r;
  }
  function setStatusPill(row, l) {
    const p = row && $('.pill', row);
    if (!p || p.classList.contains(l.status)) return;
    p.className = 'pill ' + l.status; p.textContent = STAGE_LABEL[l.status];
    anim(p, [{ transform: 'scale(.86)' }, { transform: 'scale(1.06)' }, { transform: 'none' }], { duration: 460, easing: SPRING });
  }

  /* FLIP list: rows that stay slide to their new spot, leaving rows fade out in place, new rows rise in */
  function renderRows({ stagger = false, fresh } = {}) {
    const items = visible(), keep = new Set(items.map(l => l.id));
    const box = rowsEl.getBoundingClientRect();
    const old = new Map();
    $$('.row:not(.ghost)', rowsEl).forEach(r => old.set(r.dataset.id, r.getBoundingClientRect()));
    $$('.row:not(.ghost)', rowsEl).forEach(r => {
      if (keep.has(r.dataset.id)) return;
      const rr = old.get(r.dataset.id);
      if (reduce) { r.remove(); return; }
      r.classList.add('ghost');
      Object.assign(r.style, { position: 'absolute', left: '8px', right: '8px', top: (rr.top - box.top + rowsEl.scrollTop) + 'px', pointerEvents: 'none', zIndex: 0 });
      anim(r, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'scale(.96)' }], { duration: 200, fill: 'forwards' }).finished.then(() => r.remove());
    });
    $('.empty', rowsEl)?.remove();
    let entering = 0;
    items.forEach(l => {
      let r = $(`.row[data-id="${CSS.escape(l.id)}"]:not(.ghost)`, rowsEl);
      const isNew = !r;
      if (isNew) r = makeRow(l);
      r.classList.toggle('on', l.id === selected);
      rowsEl.append(r);
      if (isNew) {
        if (l.id === fresh) { r.classList.add('fresh'); r.addEventListener('animationend', () => r.classList.remove('fresh'), { once: true }); }
        const d = (stagger || l.id === fresh ? entering++ * 35 : 0) + (old.size ? 90 : 0);
        anim(r, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 420, delay: d });
        growPrio(r, d + 160);
      }
    });
    if (!items.length) rowsEl.insertAdjacentHTML('beforeend', `<div class="empty">${query ? 'No leads match “' + esc(query) + '”.' : (LIVE_MODE && !leads.length ? 'No leads yet. Fill out the form on the website to test it.' : 'Nothing here yet.')}</div>`);
    if (!reduce) $$('.row:not(.ghost)', rowsEl).forEach(r => {
      const o = old.get(r.dataset.id); if (!o) return;
      const n = r.getBoundingClientRect(), dy = o.top - n.top;
      if (Math.abs(dy) > 1) r.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], { duration: 520, easing: EASE });
    });
    placeSel();
  }
  function placeSel(instant) {
    const r = selected && $(`.row[data-id="${CSS.escape(selected)}"]:not(.ghost)`, rowsEl);
    if (!r) { selEl.classList.remove('ready'); return; }
    if (!selEl.classList.contains('ready') || instant) { selEl.style.transition = 'none'; requestAnimationFrame(() => selEl.style.transition = ''); }
    selEl.style.height = r.offsetHeight + 'px';
    selEl.style.transform = `translateY(${r.offsetTop}px)`;
    selEl.classList.add('ready');
  }

  function leadHeader() {
    const c = counts(), o = open();
    $('#leadSub').textContent = `${c.all} recent lead${c.all === 1 ? '' : 's'} · ${o.filter(l => l.status !== 'booked').length} open, worth ${money(o.reduce((s, l) => s + l.premium, 0))}/yr`;
    $$('button', filtersEl).forEach(b => tween($('b', b), c[b.dataset.f], String, 500));
    $$('button', filtersEl).forEach(b => { b.classList.toggle('on', b.dataset.f === filter); b.setAttribute('aria-selected', b.dataset.f === filter); });
    slide($('.ind', filtersEl), $(`[data-f="${filter}"]`, filtersEl));
  }

  /* ---------- Detail pane ---------- */
  let detailToken = 0;
  function detailHTML(l) {
    const facts = [
      ...(SAVE_MID[l.coverage]
        ? [['Interested in', PROTECT[l.protect]], ['Age range', l.age], ['Can save', COVER[l.coverage]]]
        : [['Protecting', PROTECT[l.protect]], ['Age range', l.age], ['Coverage', COVER[l.coverage]]]),
      ...(l.tobacco ? [['Tobacco (12 mo)', l.tobacco === 'yes' ? 'Yes' : l.tobacco === 'no' ? 'No' : 'Ask on call']] : []), // older term-life leads only
      ['Source', SRC[l.source][0]], ['Est. premium', money(l.premium) + ' / yr'],
    ];
    const n = prio(l), h = heat(n);
    const meter = n ? `<div class="pm ${h}" data-d>
        <div class="pm-top"><p class="lbl">Priority</p><span class="pm-tag">${HEAT_LABEL[h]}</span><b class="pm-n"><span data-to="${n}">${n}</span><small>/10</small></b></div>
        <div class="pm-bar" role="img" aria-label="Priority ${n} out of 10">${Array.from({ length: 10 }, (_, k) => `<i class="${k < n ? 'f' : ''}"></i>`).join('')}</div>
        <p class="pm-q">How important a more secure financial future is to them</p>
      </div>` : '';
    if (l.appt && l.status === 'booked') facts.splice(0, 0, ['Call', apptLabel(l.appt)]);
    else if (l.requested) facts.splice(0, 0, ['Wants a call', apptLabel(l.requested)]);
    else if (CALL_WINDOW[l.callWindow]) facts.splice(0, 0, ['Best time to call', CALL_WINDOW[l.callWindow]]);
    return `<div class="d-in">
      <div class="d-head" data-d>
        <span class="av">${esc(initials(l))}</span>
        <div style="min-width:0">
          <div class="d-name"><h2>${esc(shortName(l))}</h2><span class="pill ${l.status}" id="dPill">${STAGE_LABEL[l.status]}</span></div>
          <a class="d-phone" href="tel:${esc(l.phone.replace(/[^\d+]/g, ''))}">${ic('phone', 16)}${esc(l.phone)}</a>
        </div>
        <button type="button" class="d-close" aria-label="Close">${ic('close', 18)}</button>
      </div>
      <div class="d-actions" data-d>
        <button type="button" class="btn" data-act="text">${ic('send', 19)}Send text</button>
        <button type="button" class="btn ghost" data-act="book" ${l.status === 'booked' ? 'disabled' : ''}>${ic('booked', 19)}${l.status === 'booked' ? 'Booked' : 'Mark booked'}</button>
      </div>
      <div class="compose" aria-hidden="true"><div class="compose-in">
        <textarea aria-label="Text message">${esc(textTemplate(l))}</textarea>
        <div class="row-btns"><button type="button" class="btn ghost sm" data-act="cancel">Cancel</button><button type="button" class="btn sm" data-act="send">${ic('send', 16)}Send</button></div>
      </div></div>
      <p class="hint" data-d>Demo: nothing is actually sent.</p>
      <div class="hr" data-d></div>
      <div data-d><p class="lbl">Stage</p>
        <div class="seg stage" data-s="${l.status}"><span class="ind"></span>${STAGES.map(s => `<button type="button" data-stage="${s}" class="${s === l.status ? 'on' : ''}">${STAGE_LABEL[s]}</button>`).join('')}</div>
      </div>
      ${meter}
      <dl class="facts" data-d>${facts.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl>
      <div class="note" data-d><label for="dNote">Note</label><textarea id="dNote" rows="1" placeholder="Add a note for yourself…">${esc(l.note)}</textarea></div>
      <div class="acts" data-d><h3>Activity</h3><ol>${l.act.map(actHTML).join('')}</ol></div>
    </div>`;
  }
  const ACT_ICON = { origin: null, text: 'text', booked: 'booked', lost: 'lost', stage: 'check', note: 'note' };
  function actHTML(a, l) {
    return `<li><span class="ai ${a.t}">${ic(ACT_ICON[a.t] || 'form', 17)}</span><div><p>${esc(a.text)}</p><small>${when(a.at)}</small></div></li>`;
  }
  function originIcon(l) { const li = $('.acts li:last-child .ai', detailEl); if (li) li.innerHTML = ic(SRC[l.source][1], 17); }
  const autosize = t => { t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; };

  function showDetail(l, { animate = true } = {}) {
    const tok = ++detailToken;
    const build = () => {
      if (tok !== detailToken) return;
      detailEl.getAnimations?.({ subtree: true }).forEach(a => a.cancel());
      if (!l) { detailEl.innerHTML = '<div class="empty">Select a lead</div>'; return; }
      detailEl.innerHTML = detailHTML(l);
      originIcon(l);
      autosize($('#dNote'));
      requestAnimationFrame(() => slide($('.stage .ind', detailEl), $('.stage .on', detailEl), true));
      if (animate) rise($$('[data-d]', detailEl), 0, 35);
      const pm = $('.pm', detailEl);
      if (pm && animate && !reduce) { // segments fill left to right while the number counts up with them
        $$('.pm-bar i.f', pm).forEach((i, k) => anim(i, [{ transform: 'scaleY(.35)', opacity: .15 }, { transform: 'none', opacity: 1 }], { duration: 520, delay: 260 + k * 45, easing: SPRING }));
        const num = $('[data-to]', pm), to = +num.dataset.to; num.dataset.v = 0; num.textContent = '0';
        setTimeout(() => tween(num, to, String, 200 + to * 45), 260);
      }
    };
    const cur = $('.d-in', detailEl);
    if (cur && animate && !reduce) anim(cur, [{ opacity: 1 }, { opacity: 0, transform: 'translateY(-4px)' }], { duration: 110, fill: 'forwards' }).finished.then(build);
    else build();
  }

  const sheet = matchMedia('(max-width:1179px)');
  function openSheet(on) {
    detailEl.classList.toggle('open', on);
    $('#scrim').classList.toggle('on', on);
  }
  $('#scrim').addEventListener('click', () => openSheet(false));
  addEventListener('keydown', e => { if (e.key === 'Escape' && detailEl.classList.contains('open')) openSheet(false); });

  function select(id, { fromUser } = {}) {
    if (id === selected && !fromUser) return;
    const same = id === selected;
    selected = id;
    $$('.row', rowsEl).forEach(r => r.classList.toggle('on', r.dataset.id === id));
    placeSel();
    if (!same) showDetail(byId(id));
    if (fromUser && sheet.matches) openSheet(true);
  }
  rowsEl.addEventListener('click', e => { const r = e.target.closest('.row:not(.ghost)'); if (r) select(r.dataset.id, { fromUser: true }); });
  rowsEl.addEventListener('keydown', e => {
    const r = e.target.closest('.row'); if (!r) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(r.dataset.id, { fromUser: true }); }
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const rows = $$('.row:not(.ghost)', rowsEl), i = rows.indexOf(r), n = rows[i + (e.key === 'ArrowDown' ? 1 : -1)];
      if (n) { n.focus(); select(n.dataset.id); }
    }
  });
  filtersEl.addEventListener('click', e => {
    const b = e.target.closest('[data-f]'); if (!b || b.dataset.f === filter) return;
    filter = b.dataset.f; leadHeader(); renderRows();
    // keep the tapped pill in view when the row scrolls sideways (phones), without moving the page
    if (filtersEl.scrollWidth > filtersEl.clientWidth) filtersEl.scrollTo({ left: b.offsetLeft - filtersEl.clientWidth / 2 + b.offsetWidth / 2, behavior: reduce ? 'auto' : 'smooth' });
  });
  let qT;
  $('#q').addEventListener('input', e => { clearTimeout(qT); qT = setTimeout(() => { query = e.target.value.trim().toLowerCase(); renderRows(); }, 120); });

  /* Detail actions */
  function toggleCompose(on) {
    const c = $('.compose', detailEl); if (!c) return;
    const isOn = c.getAttribute('aria-hidden') === 'false';
    if (on === isOn) return;
    c.setAttribute('aria-hidden', !on);
    const h = $('.compose-in', c).offsetHeight;
    if (reduce) { c.style.height = on ? 'auto' : '0px'; }
    else {
      const a = c.animate([{ height: on ? '0px' : h + 'px', opacity: on ? 0 : 1 }, { height: on ? h + 'px' : '0px', opacity: on ? 1 : 0 }], { duration: on ? 420 : 260, easing: EASE });
      c.style.height = on ? 'auto' : '0px';
    }
    if (on) { const t = $('textarea', c); t.focus({ preventScroll: true }); t.setSelectionRange(t.value.length, t.value.length); }
  }
  function addAct(l, a) {
    if (l.real) { (l.log ||= []).unshift(a); l.act.unshift(a); sync(l); }
    else { (S.act[l.id] ||= []).unshift(a); l.act.unshift(a); save(); }
    if (selected === l.id) {
      const ol = $('.acts ol', detailEl); if (!ol) return;
      ol.insertAdjacentHTML('afterbegin', actHTML(a));
      grow(ol.firstElementChild);
    }
  }
  function nextSlot() {
    const taken = new Set(leads.filter(l => l.appt).map(l => l.appt));
    for (let d = 1; d < 30; d++) for (const [h, m] of [[10, 0], [11, 30], [14, 0], [15, 30], [17, 0]]) {
      const t = at(d, h, m); if (new Date(t).getDay() === 0) continue;
      if (!taken.has(t)) return t;
    }
    return at(1, 10);
  }
  function setStatus(l, st) {
    if (!l || l.status === st) return;
    l.status = st; S.status[l.id] = st;
    if (st === 'booked') {
      if (!l.appt) { l.appt = l.requested > Date.now() ? l.requested : nextSlot(); S.appt[l.id] = l.appt; } // honour the time they picked
      addAct(l, { t: 'booked', text: 'Call booked · ' + apptLabel(l.appt), at: Date.now() });
      toast('Call booked', apptLabel(l.appt) + ' · added to Calendar', 'booked');
    } else {
      if (l.appt) { delete l.appt; S.appt[l.id] = null; }
      addAct(l, st === 'lost' ? { t: 'lost', text: 'Marked as lost', at: Date.now() } : { t: 'stage', text: 'Moved to ' + STAGE_LABEL[st], at: Date.now() });
    }
    save(); if (l.real) sync(l);
    // choreography: pill morphs in the row + header, then the list reflows if the filter no longer matches
    const row = $(`.row[data-id="${CSS.escape(l.id)}"]:not(.ghost)`, rowsEl);
    setStatusPill(row, l);
    if (selected === l.id) {
      const dp = $('#dPill', detailEl); if (dp) { dp.className = 'pill ' + st; dp.textContent = STAGE_LABEL[st]; anim(dp, [{ transform: 'scale(.86)' }, { transform: 'none' }], { duration: 420, easing: SPRING }); }
      const sg = $('.stage', detailEl); if (sg) { sg.dataset.s = st; $$('button', sg).forEach(b => b.classList.toggle('on', b.dataset.stage === st)); slide($('.ind', sg), $('.on', sg)); }
      const bk = $('[data-act="book"]', detailEl); if (bk) { bk.disabled = st === 'booked'; bk.innerHTML = ic('booked', 19) + (st === 'booked' ? 'Booked' : 'Mark booked'); }
      const facts = $('.facts', detailEl);
      if (facts) { const callRow = $('dt', facts)?.textContent === 'Call' ? facts.firstElementChild : null;
        if (st === 'booked' && !callRow) { facts.insertAdjacentHTML('afterbegin', `<div><dt>Call</dt><dd>${apptLabel(l.appt)}</dd></div>`); grow(facts.firstElementChild); }
        if (st !== 'booked' && callRow) callRow.remove(); }
    }
    leadHeader(); badges(true);
    if (filter !== 'all' && filter !== st) setTimeout(() => renderRows(), reduce ? 0 : 520);
  }

  detailEl.addEventListener('click', e => {
    const b = e.target.closest('button'); if (!b) return;
    const l = byId(selected);
    if (b.classList.contains('d-close')) return openSheet(false);
    if (b.dataset.stage) return setStatus(l, b.dataset.stage);
    switch (b.dataset.act) {
      case 'text': return toggleCompose($('.compose', detailEl).getAttribute('aria-hidden') !== 'false');
      case 'cancel': return toggleCompose(false);
      case 'book': return setStatus(l, 'booked');
      case 'send': {
        const msg = $('.compose textarea', detailEl).value.trim(); if (!msg) return;
        (S.msgs[l.id] ||= []).push(['out', msg, Date.now()]); save();
        toggleCompose(false);
        detailEl.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
        addAct(l, { t: 'text', text: 'Text sent', at: Date.now() });
        toast('Text sent to ' + l.first, 'Demo: nothing is actually sent', 'send');
        if (l.status === 'new') setTimeout(() => setStatus(l, 'contacted'), reduce ? 0 : 380);
      }
    }
  });
  detailEl.addEventListener('input', e => { if (e.target.id === 'dNote') autosize(e.target); });
  detailEl.addEventListener('change', e => {
    if (e.target.id !== 'dNote') return;
    const l = byId(selected); l.note = e.target.value; S.notes[l.id] = l.note; save(); if (l.real) sync(l);
    toast('Note saved', shortName(l), 'note');
  });

  function renderLeads(opts = {}) {
    leadHeader();
    if (!selected || !byId(selected)) selected = (leads.find(l => l.status === 'new') || leads[0])?.id;
    if (opts.select) selected = opts.select;
    renderRows({ stagger: !rowsEl.querySelector('.row') });
    showDetail(byId(selected), { animate: false });
    if (opts.select && sheet.matches) setTimeout(() => openSheet(true), 200);
    if (opts.select) requestAnimationFrame(() => $(`.row[data-id="${CSS.escape(opts.select)}"]`, rowsEl)?.scrollIntoView({ block: 'nearest' }));
  }

  /* =====================================================================
     OVERVIEW
     ===================================================================== */
  function renderOverview() {
    const el = $('[data-view="overview"]'); el.classList.add('scroll');
    const c = counts(), o = open(), pipeline = o.reduce((s, l) => s + l.premium, 0);
    const replied = leads.filter(l => l.status !== 'new' && l.source !== 'referral');
    const avgReply = Math.round(replied.reduce((s, l) => { const t = l.act.filter(a => a.t === 'text').pop(); return s + (t ? (t.at - l.created) / MIN : 10); }, 0) / Math.max(1, replied.length));
    const waiting = leads.filter(l => l.status === 'new').sort((a, b) => a.created - b.created);
    const upcoming = leads.filter(l => l.status === 'booked' && l.appt && l.appt > Date.now() - HOUR).sort((a, b) => a.appt - b.appt).slice(0, 4);
    const srcCounts = Object.keys(SRC).map(k => [k, leads.filter(l => l.source === k).length]).filter(x => x[1]).sort((a, b) => b[1] - a[1]);
    const max = Math.max(...srcCounts.map(x => x[1]));
    const funnel = [['Leads', c.all], ['Contacted', c.contacted + c.booked], ['Booked', c.booked]];
    el.innerHTML = `
      <div class="vhead"><div data-rise><h1>Overview <span class="tag sample">Sample data</span></h1><p class="sub">How the website is turning visitors into calls.</p></div></div>
      <div class="kpis">
        <div class="card kpi" data-rise><p class="k">${ic('leads', 16)}Leads</p><p class="v" data-n="${c.all}">0</p><p class="d"><b>+${leads.filter(l => Date.now() - l.created < 7 * DAY).length}</b> this week</p></div>
        <div class="card kpi" data-rise><p class="k">${ic('booked', 16)}Calls booked</p><p class="v" data-n="${c.booked}">0</p><p class="d">${Math.round(c.booked / Math.max(1, c.all) * 100)}% of leads</p></div>
        <div class="card kpi" data-rise><p class="k">${ic('bolt', 16)}Avg. first reply</p><p class="v" data-n="${avgReply}" data-f="min">0</p><p class="d">Goal: under 5 min</p></div>
        <div class="card kpi" data-rise><p class="k">${ic('star', 16)}Open pipeline</p><p class="v" data-n="${pipeline}" data-f="$">0</p><p class="d">est. premium / yr</p></div>
      </div>
      <div class="grid2">
        <div class="card" data-rise>
          <div class="card-h"><h2>Waiting on a reply</h2><button type="button" class="link" data-goto="leads" data-filter="new">All new ${ic('arrow', 15)}</button></div>
          ${waiting.length ? waiting.map(l => `<div class="mini" data-lead="${l.id}"><span class="av">${esc(initials(l))}</span><div class="who"><b>${esc(shortName(l))}</b><small>${SRC[l.source][0]} · ${COVER[l.coverage]}</small></div><span class="age ${Date.now() - l.created > 4 * HOUR ? 'cold' : Date.now() - l.created > HOUR ? 'warm' : ''}">${ago(l.created)}</span></div>`).join('') : '<p class="none">Inbox zero. Every lead has a reply.</p>'}
        </div>
        <div class="card" data-rise>
          <div class="card-h"><h2>Upcoming calls</h2><button type="button" class="link" data-goto="calendar">Calendar ${ic('arrow', 15)}</button></div>
          ${upcoming.length ? upcoming.map(l => `<div class="mini" data-lead="${l.id}"><span class="time">${tfmt(l.appt)}</span><div class="who"><b>${esc(shortName(l))}</b><small>${apptLabel(l.appt).split(',')[0]} · ${COVER[l.coverage]}</small></div></div>`).join('') : '<p class="none">No calls booked yet.</p>'}
        </div>
        <div class="card" data-rise>
          <div class="card-h"><h2>Pipeline</h2><small>Last 30 days</small></div>
          <div class="funnel">${funnel.map(([k, n], i) => `<div class="bar-row"><span>${k}</span><div class="track"><div class="fill ${i === 2 ? 'g' : ''}" style="--p:${n / Math.max(1, c.all)}"></div></div><b>${n}</b></div>`).join('')}</div>
        </div>
        <div class="card" data-rise>
          <div class="card-h"><h2>Where leads come from</h2></div>
          <div class="funnel">${srcCounts.map(([k, n]) => `<div class="bar-row"><span>${SRC[k][0]}</span><div class="track"><div class="fill" style="--p:${n / max}"></div></div><b>${n}</b></div>`).join('')}</div>
        </div>
      </div>`;
    $$('.v[data-n]', el).forEach(v => { v.dataset.v = 0; const f = v.dataset.f; tween(v, +v.dataset.n, n => f === '$' ? money(n) : f === 'min' ? n + ' min' : String(n), 900); });
    $$('.fill', el).forEach((f, k) => anim(f, [{ transform: 'scaleX(0)' }, { transform: `scaleX(${getComputedStyle(f).getPropertyValue('--p')})` }], { duration: 800, delay: 250 + k * 60 }));
  }
  $('.main').addEventListener('click', e => {
    const g = e.target.closest('[data-goto]');
    if (g) { if (g.dataset.filter) filter = g.dataset.filter; return go(g.dataset.goto); }
    const m = e.target.closest('[data-lead]');
    if (m) { filter = 'all'; selected = m.dataset.lead; go('leads', { select: m.dataset.lead, force: view === 'leads' }); }
  });

  /* =====================================================================
     CALENDAR
     ===================================================================== */
  let weekOff = 0;
  const H0 = 9, H1 = 19, PX = 64;
  function renderCalendar() {
    const el = $('[data-view="calendar"]');
    const monday = new Date(startOfDay(Date.now())); monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7) + weekOff * 7);
    const days = [...Array(6)].map((_, i) => { const d = new Date(monday); d.setDate(d.getDate() + i); return d; });
    const evs = leads.filter(l => l.status === 'booked' && l.appt);
    const inDay = d => evs.filter(l => startOfDay(l.appt) === d.getTime()).sort((a, b) => a.appt - b.appt);
    const label = `${days[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${days[5].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
    const today = startOfDay(Date.now());
    const nowH = new Date().getHours() + new Date().getMinutes() / 60;
    el.innerHTML = `
      <div class="vhead"><div data-rise><h1>Calendar</h1><p class="sub">${evs.length} booked call${evs.length === 1 ? '' : 's'} · ${label}</p></div>
        <div class="cal-nav" data-rise><button type="button" class="icon-btn" data-wk="-1" aria-label="Previous week">${ic('left', 18)}</button><button type="button" class="btn ghost sm" data-wk="0">This week</button><button type="button" class="icon-btn" data-wk="1" aria-label="Next week">${ic('right', 18)}</button></div></div>
      <div class="week" data-rise>
        <div class="dh"></div>
        ${days.map(d => `<div class="dh ${d.getTime() === today ? 'today' : ''}">${d.toLocaleDateString('en-US', { weekday: 'short' })}<b>${d.getDate()}</b></div>`).join('')}
        <div class="wk-body">
          <div class="hours" style="height:${(H1 - H0) * PX}px">${[...Array(H1 - H0)].map((_, i) => i ? `<span style="top:${i * PX}px">${((H0 + i - 1) % 12) + 1}${H0 + i < 12 ? 'a' : 'p'}</span>` : '').join('')}</div>
          ${days.map(d => `<div class="day ${d.getTime() === today ? 'today' : ''}" style="height:${(H1 - H0) * PX}px">
            ${d.getTime() === today && nowH > H0 && nowH < H1 ? `<span class="now" style="top:${(nowH - H0) * PX}px"></span>` : ''}
            ${inDay(d).map(l => { const h = new Date(l.appt).getHours() + new Date(l.appt).getMinutes() / 60; return `<div class="ev" data-lead="${l.id}" style="top:${(h - H0) * PX + 3}px;height:${PX - 6}px"><b>${esc(shortName(l))}</b><small>${tfmt(l.appt)} · ${COVER[l.coverage]}</small></div>`; }).join('')}
          </div>`).join('')}
        </div>
      </div>
      <div class="agenda" data-rise>${days.map(d => { const e = inDay(d); return e.length ? `<p class="ag-day">${d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</p>` + e.map(l => `<div class="card mini" data-lead="${l.id}" style="margin:0"><span class="time">${tfmt(l.appt)}</span><div class="who"><b>${esc(shortName(l))}</b><small>${PROTECT[l.protect]} · ${COVER[l.coverage]}</small></div></div>`).join('') : ''; }).join('') || '<p class="none">No calls this week.</p>'}</div>`;
    $$('.ev', el).forEach((e, k) => anim(e, [{ opacity: 0, transform: 'scale(.92)' }, { opacity: 1, transform: 'none' }], { duration: 460, delay: 200 + k * 50, easing: SPRING }));
    const body = $('.wk-body', el); if (body) body.scrollTop = Math.max(0, (Math.min(nowH, 15) - H0 - 1) * PX);
  }
  $('[data-view="calendar"]').addEventListener('click', e => {
    const b = e.target.closest('[data-wk]'); if (!b) return;
    const dir = +b.dataset.wk; weekOff = dir ? weekOff + dir : 0;
    const wk = $('.week', e.currentTarget);
    anim(wk, [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: `translateX(${dir * -14}px)` }], { duration: 140, fill: 'forwards' }).finished.then(() => {
      renderCalendar();
      const w2 = $('.week', e.currentTarget); anim(w2, [{ opacity: 0, transform: `translateX(${dir * 14}px)` }, { opacity: 1, transform: 'none' }], { duration: 380 });
    });
  });

  /* =====================================================================
     INBOX
     ===================================================================== */
  let thread = null;
  const msgsOf = id => [...(THREADS[id] || []).map(([d, t, a, u]) => [d, t, Date.now() - a, u]), ...(S.msgs[id] || [])].sort((a, b) => a[2] - b[2]);
  function renderInbox() {
    const el = $('[data-view="inbox"]');
    const ids = [...new Set([...Object.keys(S.msgs), ...Object.keys(THREADS)])].filter(byId).sort((a, b) => msgsOf(b).at(-1)[2] - msgsOf(a).at(-1)[2]);
    if (!thread || !ids.includes(thread)) thread = ids[0];
    el.innerHTML = `
      <div class="vhead"><div data-rise><h1>Inbox</h1><p class="sub">Texts with your leads, in one place.</p></div></div>
      <div class="inbox">
        <div class="panel threads" data-rise>${ids.map(id => { const l = byId(id), m = msgsOf(id).at(-1), un = m[3] === 'unread' && !S.read.includes(id);
          return `<button type="button" class="th ${un ? 'unread' : ''}" data-th="${id}"><span class="av">${esc(initials(l))}</span><div class="who"><b>${esc(shortName(l))}</b><small>${m[0] === 'out' ? 'You: ' : ''}${esc(m[1])}</small></div><time>${ago(m[2])}</time></button>`; }).join('')}</div>
        <div class="panel conv" data-rise></div>
      </div>`;
    openThread(thread, false);
  }
  function openThread(id, animate = true) {
    thread = id;
    const el = $('[data-view="inbox"]'), l = byId(id), conv = $('.conv', el);
    if (!l) { conv.innerHTML = '<div class="empty">No conversations yet.</div>'; return; }
    $$('.th', el).forEach(t => t.classList.toggle('on', t.dataset.th === id));
    if (animate && !S.read.includes(id)) { S.read.push(id); save(); $(`[data-th="${id}"]`, el)?.classList.remove('unread'); badges(); }
    conv.innerHTML = `
      <div class="conv-h"><button type="button" class="icon-btn back" aria-label="Back">${ic('left', 18)}</button><span class="av">${esc(initials(l))}</span><div class="who"><b>${esc(shortName(l))}</b><small>${esc(l.phone)}</small></div><span class="pill ${l.status}" style="margin-left:auto">${STAGE_LABEL[l.status]}</span><button type="button" class="btn ghost sm" data-lead="${l.id}">View lead</button></div>
      <div class="msgs">${msgsOf(id).map(m => `<div class="msg ${m[0]}">${esc(m[1])}<time>${when(m[2])}</time></div>`).join('')}</div>
      <form class="send"><input placeholder="Text ${esc(l.first)}…" aria-label="Message"><button class="btn" aria-label="Send">${ic('send', 18)}</button></form>`;
    const msgs = $('.msgs', conv); msgs.scrollTop = msgs.scrollHeight;
    if (animate) { rise($$('.msg', conv).slice(-4), 0, 40); el.querySelector('.inbox').classList.add('open'); }
  }
  $('[data-view="inbox"]').addEventListener('click', e => {
    const t = e.target.closest('[data-th]'); if (t) return openThread(t.dataset.th);
    if (e.target.closest('.back')) $('.inbox', e.currentTarget).classList.remove('open');
  });
  $('[data-view="inbox"]').addEventListener('submit', e => {
    e.preventDefault();
    const inp = $('input', e.target), txt = inp.value.trim(); if (!txt) return;
    const l = byId(thread);
    (S.msgs[thread] ||= []).push(['out', txt, Date.now()]); save();
    inp.value = '';
    const m = document.createElement('div'); m.className = 'msg out'; m.innerHTML = `${esc(txt)}<time>${when(Date.now())}</time>`;
    const box = $('.msgs', e.currentTarget); box.append(m); box.scrollTo({ top: box.scrollHeight, behavior: reduce ? 'auto' : 'smooth' });
    anim(m, [{ opacity: 0, transform: 'translateY(12px) scale(.94)', transformOrigin: 'bottom right' }, { opacity: 1, transform: 'none', transformOrigin: 'bottom right' }], { duration: 460, easing: SPRING });
    const th = $(`[data-th="${thread}"] small`, e.currentTarget); if (th) th.textContent = 'You: ' + txt;
    addAct(l, { t: 'text', text: 'Text sent', at: Date.now() });
    if (l.status === 'new') setStatus(l, 'contacted');
  });

  /* =====================================================================
     REVIEWS  (sample — publish only real, permissioned reviews)
     ===================================================================== */
  const REVIEWS = [
    ['Carmen D.', 5, 'Me explicó todo con paciencia y en español. En una semana ya tenía mi póliza.', 3],
    ['Luis M.', 5, 'Comparó varias compañías y me consiguió un precio mucho mejor del que tenía.', 9],
    ['Patricia R.', 5, 'Muy profesional. Contestó todas mis preguntas por texto, sin presión.', 16],
    ['Andrés V.', 4, 'Buen servicio y rápido. La llamada duró 15 minutos y quedó todo claro.', 24],
  ];
  function renderReviews() {
    const el = $('[data-view="reviews"]'); el.classList.add('scroll');
    const avg = (REVIEWS.reduce((s, r) => s + r[1], 0) / REVIEWS.length).toFixed(1);
    const stars = n => `<div class="stars" aria-label="${n} of 5 stars">${[...Array(5)].map((_, i) => `<span style="opacity:${i < n ? 1 : .25}">${ic('star', 18)}</span>`).join('')}</div>`;
    el.innerHTML = `
      <div class="vhead"><div data-rise><h1>Reviews <span class="tag">Sample data</span></h1><p class="sub">Ask happy clients right after their policy is approved.</p></div>
        <button type="button" class="btn" data-rise id="askRv">${ic('send', 18)}Request a review</button></div>
      <div class="rv-top">
        <div class="card" data-rise><p class="lbl">Google rating</p><p class="score">${avg}</p>${stars(Math.round(avg))}<p class="hint">${REVIEWS.length} reviews</p></div>
        <div class="card" data-rise><p class="lbl">Rating breakdown</p><div class="funnel">${[5, 4, 3, 2, 1].map(s => { const n = REVIEWS.filter(r => r[1] === s).length; return `<div class="bar-row"><span>${s} stars</span><div class="track"><div class="fill" style="--p:${n / REVIEWS.length}"></div></div><b>${n}</b></div>`; }).join('')}</div></div>
      </div>
      <div class="rv-list">${REVIEWS.map(([n, s, t, d]) => `<div class="card rv" data-rise><div class="rv-h"><span class="av">${n.split(' ').map(x => x[0]).join('')}</span><div><b>${n}</b><small>${d} days ago</small></div></div>${stars(s)}<p>${esc(t)}</p></div>`).join('')}</div>`;
    $$('.fill', el).forEach((f, k) => anim(f, [{ transform: 'scaleX(0)' }, { transform: `scaleX(${getComputedStyle(f).getPropertyValue('--p')})` }], { duration: 800, delay: 250 + k * 50 }));
    $('#askRv').onclick = () => toast('Review request queued', 'Demo: nothing is actually sent', 'send');
  }

  /* =====================================================================
     SETTINGS
     ===================================================================== */
  function renderSettings() {
    const el = $('[data-view="settings"]'); el.classList.add('scroll');
    const conn = (icon, name, set, okText, offText) => `<div class="conn"><span class="ci">${ic(icon, 19)}</span><div class="who"><b>${name}</b><small class="${set ? 'ok' : 'warn'}">${set ? okText : offText}</small></div></div>`;
    const sw = (k, name, sub) => `<div class="conn"><div class="who"><b>${name}</b><small>${sub}</small></div><button type="button" class="sw" role="switch" aria-checked="${!!S.prefs[k]}" data-pref="${k}" aria-label="${name}"></button></div>`;
    el.innerHTML = `
      <div class="vhead"><div data-rise><h1>Settings</h1><p class="sub">Connections live in <code>config.js</code> on the website.</p></div></div>
      <div class="set-grid">
        <div class="card" data-rise><div class="card-h"><h2>Connections</h2></div>
          ${conn('form', 'Lead database (Google Sheet)', LIVE_MODE, 'Connected: website leads show up here', 'Not connected: set DASHBOARD_API_URL')}
          ${conn('link', 'Outside CRM webhook', CFG.LEAD_WEBHOOK_URL, 'Also sending leads to your CRM', 'Optional: set LEAD_WEBHOOK_URL')}
          ${conn('calendar', 'Booking calendar', CFG.BOOKING_URL, 'Leads can book a call after the form', 'Not connected: set BOOKING_URL')}
        </div>
        <div class="card" data-rise><div class="card-h"><h2>Notifications</h2><small>Preview</small></div>
          ${sw('alert', 'Text me on every new lead', 'Instant SMS with name, phone and coverage')}
          ${sw('autoreply', 'Auto-reply within 60 seconds', 'Sends a friendly hello in Spanish while you’re busy')}
          ${sw('digest', 'Morning summary email', 'Yesterday’s leads and today’s calls at 8 AM')}
        </div>
        ${LIVE_MODE ? `<div class="card" data-rise><div class="card-h"><h2>Lead database</h2><small class="ok-t">Google Sheet</small></div>
          <p class="hint" style="margin:0 0 16px">Every quote sent from the website lands in your Google Sheet and shows up here within 20 seconds. Stage, notes and call times you change here are saved back to the sheet.</p>
          <div style="display:flex;gap:10px;flex-wrap:wrap"><button type="button" class="btn sm" id="syncBtn">Refresh now</button><button type="button" class="btn ghost sm" id="signOut">Sign out on this device</button></div>
        </div>` : `<div class="card" data-rise><div class="card-h"><h2>Demo</h2></div>
          <p class="hint" style="margin:0 0 16px">Sample leads, plus anything you change here, are stored in this browser only. Set <code>DASHBOARD_API_URL</code> in <code>config.js</code> to show real leads from the website.</p>
          <div style="display:flex;gap:10px;flex-wrap:wrap"><button type="button" class="btn sm" id="simBtn">${ic('bolt', 16)}Simulate a new lead</button><button type="button" class="btn ghost sm" id="resetBtn">Reset demo data</button></div>
        </div>`}
      </div>`;
  }
  $('[data-view="settings"]').addEventListener('click', e => {
    const s = e.target.closest('[data-pref]');
    if (s) { const k = s.dataset.pref; S.prefs[k] = !S.prefs[k]; s.setAttribute('aria-checked', S.prefs[k]); save(); return; }
    if (e.target.closest('#simBtn')) return simulate();
    if (e.target.closest('#syncBtn')) return poll(true);
    if (e.target.closest('#signOut')) { signOut(); return; }
    if (e.target.closest('#resetBtn')) {
      S = blank(); save(); try { localStorage.removeItem(LIVE); } catch { }
      build(); selected = null; filter = 'all'; $$('.row', rowsEl).forEach(r => r.remove()); badges();
      toast('Demo data reset', 'Back to the original sample leads', 'check');
    }
  });

  /* =====================================================================
     LIVE: new leads arrive (simulated, or from the website form in another tab)
     ===================================================================== */
  const SIM_POOL = [
    ['Valeria', 'Castro', 'all-3', '18-34', '200-300', 9, 'website'], ['Alejandro', 'Ruiz', 'grow-savings', '35-49', '300-400', 7, 'google'],
    ['Gabriela', 'Flores', 'living-benefits', '35-49', '100-200', 6, 'instagram'], ['Ricardo', 'Mendoza', 'life-insurance', '50-64', '200-300', 8, 'facebook'],
    ['Lucía', 'Vargas', 'all-3', '35-49', '500+', 10, 'website'], ['Fernando', 'Ortiz', 'grow-savings', '50-64', '100-200', 4, 'missed'],
  ];
  function arrive(l) {
    if (!l.act) { l.premium = premium(l); l.act = [...(S.act[l.id] || []), ...baseActivity(l)]; }
    leads.unshift(l);
    badges(true);
    toast(`New lead · ${shortName(l)}`, `${SRC[l.source][0]} · ${COVER[l.coverage]}`, 'bolt');
    if (view === 'leads') {
      leadHeader();
      if (filter === 'all' || filter === 'new') { rowsEl.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); renderRows({ fresh: l.id }); }
    } else if (view === 'overview') RENDER.overview();
  }
  function simulate() {
    const used = new Set(leads.map(l => l.first));
    const p = SIM_POOL.find(x => !used.has(x[0])) || SIM_POOL[Math.floor(Math.random() * SIM_POOL.length)];
    const l = { id: 'x' + Date.now(), first: p[0], last: p[1], phone: `(312) 555-01${String(Math.floor(Math.random() * 90) + 10)}`, email: `${p[0].toLowerCase()}@example.com`,
      protect: p[2], age: p[3], coverage: p[4], priority: p[5], source: p[6], status: 'new', created: Date.now(), note: '' };
    S.sims.unshift(Object.assign({}, l)); S.sims = S.sims.slice(0, 20); save();
    arrive(l);
  }
  $('#simulate').addEventListener('click', () => LIVE_MODE ? poll(true) : simulate());
  addEventListener('storage', e => {
    if (e.key !== LIVE || LIVE_MODE) return;
    const known = new Set(leads.map(l => l.id));
    (load(LIVE) || []).map(fromWebsite).filter(l => !known.has(l.id)).forEach(arrive);
  });

  /* =====================================================================
     LIVE MODE: Google Sheet as the database (see apps-script/Code.gs)
     ===================================================================== */
  const pending = new Set();
  const syncT = {};
  let pollT = 0, polling = false;
  const apiURL = params => { const u = new URL(API); Object.entries(params).forEach(([k, v]) => u.searchParams.set(k, v)); return u.href; };
  async function fetchLeads() {
    const r = await fetch(apiURL({ action: 'list', key: apiKey, t: Date.now() }));
    const j = await r.json();
    if (!j.ok) { const e = new Error(j.error || 'error'); e.auth = j.error === 'unauthorized'; throw e; }
    return Array.isArray(j.leads) ? j.leads : [];
  }
  function setSync(state, title) {
    const b = $('#simulate'); if (!b) return;
    b.classList.toggle('load', state === 'load'); b.classList.toggle('err', state === 'err');
    const s = $('span', b); if (s && state !== 'load') s.textContent = state === 'err' ? 'Offline' : 'Live';
    if (title) b.title = title;
  }
  // save stage / note / call time / activity back to the sheet (debounced per lead)
  function sync(l) {
    pending.add(l.id); clearTimeout(syncT[l.id]);
    syncT[l.id] = setTimeout(() => {
      const body = new URLSearchParams({ action: 'update', key: apiKey, id: l.id, status: l.status, note: l.note || '', appt: l.appt || '', activity: JSON.stringify((l.log || []).slice(0, 60)) });
      fetch(API, { method: 'POST', mode: 'no-cors', body })
        .catch(() => toast('Couldn’t save to your sheet', 'Check your connection and try again', 'lost'))
        .finally(() => setTimeout(() => pending.delete(l.id), 4000));
    }, 350);
  }
  function rerenderAll() {
    $$('.row', rowsEl).forEach(r => r.remove());
    if (!byId(selected)) selected = null;
    badges(); RENDER[view]({});
    rise($$('[data-rise]', $(`.view[data-view="${view}"]`)).filter(x => !(x === detailEl && sheet.matches)));
  }
  async function poll(manual) {
    if (!apiKey || polling) return;
    polling = true; setSync('load');
    try {
      const rows = await fetchLeads();
      const known = new Map(leads.map(l => [l.id, l]));
      let changed = false, arrived = 0;
      rows.map(fromServer).forEach(f => {
        const k = known.get(f.id);
        if (!k) { arrive(f); arrived++; return; }
        if (pending.has(k.id)) return;                       // our own save hasn't landed yet
        if (f.status !== k.status) {
          k.status = f.status; if (f.appt) k.appt = f.appt; else delete k.appt;
          setStatusPill($(`.row[data-id="${CSS.escape(k.id)}"]:not(.ghost)`, rowsEl), k); changed = true;
        }
        if (f.note !== k.note) { k.note = f.note; changed = true; }
        if (f.log.length !== (k.log || []).length) { k.log = f.log; k.act = f.act; changed = true; }
      });
      server = rows;
      if (changed) {
        leadHeader(); badges();
        if (view === 'leads' && selected && !detailEl.contains(document.activeElement)) showDetail(byId(selected), { animate: false });
      }
      setSync('ok', 'Synced at ' + tfmt(Date.now()) + ' · click to refresh');
      if (manual && !arrived) toast('Up to date', 'Synced with your Google Sheet', 'check');
    } catch (e) {
      if (e.auth) { forgetKey(); lockScreen('You were signed out. Sign in again.'); }
      else { setSync('err', 'Can’t reach your Google Sheet right now'); if (manual) toast('Can’t reach your sheet', 'Check your connection', 'lost'); }
    } finally { polling = false; }
  }
  function forgetKey() { apiKey = ''; try { localStorage.removeItem(KEYK); } catch { } clearInterval(pollT); }
  function signOut() {
    forgetKey(); server = []; build(); rerenderAll();
    lockScreen('Signed out on this device.');
  }
  async function connect() {
    const b = $('#simulate'); b.innerHTML = '<i></i><span>Live</span>'; b.title = 'Connecting to your Google Sheet…';
    if (!apiKey) return lockScreen();
    setSync('load');
    try {
      server = await fetchLeads(); build(); rerenderAll();
      setSync('ok', 'Synced at ' + tfmt(Date.now()) + ' · click to refresh');
      clearInterval(pollT); pollT = setInterval(() => { if (!document.hidden) poll(); }, 20000);
    } catch (e) {
      if (e.auth) { forgetKey(); lockScreen('You were signed out. Sign in again.'); }
      else { setSync('err', 'Can’t reach your Google Sheet'); toast('Can’t reach your Google Sheet', 'Check DASHBOARD_API_URL in config.js', 'lost'); }
    }
  }
  document.addEventListener('visibilitychange', () => { if (LIVE_MODE && apiKey && !document.hidden) poll(); });

  // username + password → the server hands back the dashboard key, which this device remembers
  async function signIn(user, pass) {
    const r = await fetch(API, { method: 'POST', body: new URLSearchParams({ action: 'login', user, pass }) });
    return r.json();
  }
  const LOGIN_ERR = { bad: 'Wrong username or password.', locked: 'Too many tries. Wait 10 minutes and try again.', setup: 'The dashboard isn’t set up yet. Run setup in Apps Script.' };

  function lockScreen(msg = '') {
    if ($('.lock')) return;
    const w = document.createElement('div');
    w.className = 'lock';
    w.innerHTML = `<form class="lock-card">
      <span class="lock-ic">${ic('settings', 22)}</span>
      <h2>Verion Life dashboard</h2>
      <p class="sub">Sign in to see your leads. This device stays signed in until you sign out.</p>
      <label class="sr" for="lkUser">Username</label>
      <input id="lkUser" name="username" autocomplete="username" autocapitalize="none" spellcheck="false" placeholder="Username" required>
      <label class="sr" for="lkPass">Password</label>
      <input id="lkPass" name="password" type="password" autocomplete="current-password" placeholder="Password" required>
      <p class="lock-err" role="alert">${esc(msg)}</p>
      <button class="btn">Sign in</button>
    </form>`;
    document.body.append(w);
    const f = $('form', w), user = $('#lkUser', w), pass = $('#lkPass', w), err = $('.lock-err', w), btn = $('button', w);
    anim(w, [{ opacity: 0 }, { opacity: 1 }], { duration: 260 });
    anim(f, [{ opacity: 0, transform: 'translateY(18px) scale(.97)' }, { opacity: 1, transform: 'none' }], { duration: 560, easing: SPRING, delay: 60 });
    setTimeout(() => user.focus(), 80);
    const shake = () => anim(f, [{ transform: 'translateX(0)' }, { transform: 'translateX(-8px)' }, { transform: 'translateX(7px)' }, { transform: 'translateX(-4px)' }, { transform: 'none' }], { duration: 380, easing: 'ease-out' });
    f.addEventListener('submit', async e => {
      e.preventDefault();
      if (!user.value.trim() || !pass.value) return;
      btn.disabled = true; btn.textContent = 'Signing in…'; err.textContent = '';
      try {
        const res = await signIn(user.value.trim(), pass.value);
        if (!res.ok) { const x = new Error(res.error); x.login = res.error; throw x; }
        apiKey = res.key;
        const rows = await fetchLeads();
        try { localStorage.setItem(KEYK, apiKey); } catch { }
        anim(w, [{ opacity: 1 }, { opacity: 0 }], { duration: 240, fill: 'forwards' }).finished.then(() => w.remove());
        server = rows; build(); rerenderAll();
        setSync('ok', 'Synced at ' + tfmt(Date.now()) + ' · click to refresh');
        clearInterval(pollT); pollT = setInterval(() => { if (!document.hidden) poll(); }, 20000);
      } catch (x) {
        apiKey = '';
        err.textContent = LOGIN_ERR[x.login] || 'Can’t reach your Google Sheet. Check your connection.';
        shake();
        btn.disabled = false; btn.textContent = 'Sign in';
        if (x.login === 'bad') { pass.value = ''; pass.focus(); }
      }
    });
  }

  /* ---------- Boot ---------- */
  const RENDER = { overview: renderOverview, leads: renderLeads, calendar: renderCalendar, inbox: renderInbox, reviews: renderReviews, settings: renderSettings };
  fillIcons();
  build(); badges();
  const start = (location.hash || '').slice(1);
  go(RENDER[start] ? start : 'leads');
  if (LIVE_MODE) connect();
  let rT; addEventListener('resize', () => { clearTimeout(rT); rT = setTimeout(() => {
    slide(sideInd, $('#side .on'), true); leadHeader(); placeSel(true);
    const sg = $('.stage', detailEl); if (sg) slide($('.ind', sg), $('.on', sg), true);
    if (!sheet.matches) openSheet(false);
  }, 80); });
  document.fonts?.ready.then(() => { slide(sideInd, $('#side .on'), true); leadHeader(); placeSel(true); const sg = $('.stage', detailEl); if (sg) slide($('.ind', sg), $('.on', sg), true); });
})();
