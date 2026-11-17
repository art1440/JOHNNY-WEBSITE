/* Verion Life — shared interactions */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Header: turns to paper once you scroll off the blueprint ---------- */
  const header = document.querySelector('.site-header');
  const onScroll = () => header && header.classList.toggle('scrolled', scrollY > 10);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- Split titles into words for a staggered rise ---------- */
  document.querySelectorAll('[data-split]').forEach(el => {
    let i = 0;
    const walk = node => [...node.childNodes].forEach(n => {
      if (n.nodeType === 3) {
        const frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(part => {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.append(part); return; }
          const w = document.createElement('span'); w.className = 'w';
          const s = document.createElement('span'); s.textContent = part; s.style.setProperty('--i', i++);
          w.append(s); frag.append(w);
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) walk(n);
    });
    walk(el); el.classList.add('split');
  });

  /* ---------- Reveal on scroll ---------- */
  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    e.target.querySelectorAll('[data-count]').forEach(count);
    io.unobserve(e.target);
  }), { threshold: 0.18, rootMargin: '0px 0px -6% 0px' });
  document.querySelectorAll('.reveal, .split, .frame').forEach(el => io.observe(el));

  /* ---------- Counters ---------- */
  function count(el) {
    if (el.dataset.done) return; el.dataset.done = 1;
    const to = parseFloat(el.dataset.count), dec = (el.dataset.count.split('.')[1] || '').length;
    if (reduce) { el.textContent = to.toFixed(dec); return; }
    const t0 = performance.now(), dur = 1600;
    const tick = t => {
      const p = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - p, 4);
      el.textContent = (to * e).toFixed(dec);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- Stars ---------- */
  const star = '<svg viewBox="0 0 20 20" fill="currentColor"><path d="M10 1.5l2.6 5.4 5.9.8-4.3 4.1 1 5.8L10 14.8l-5.2 2.8 1-5.8L1.5 7.7l5.9-.8L10 1.5z"/></svg>';
  document.querySelectorAll('[data-stars]').forEach(el => { el.innerHTML = star.repeat(+el.dataset.stars || 5); el.setAttribute('aria-label', `${el.dataset.stars || 5} out of 5 stars`); });

  /* ---------- Marquee: duplicate content for a seamless loop ---------- */
  document.querySelectorAll('.marquee .track').forEach(t => {
    [...t.children].forEach(c => { const d = c.cloneNode(true); d.setAttribute('aria-hidden', 'true'); t.append(d); });
  });

  /* ---------- Drafting crosshair + coordinate readout over the hero (mouse only) ---------- */
  const hero = document.querySelector('.hero');
  if (hero && !reduce && matchMedia('(hover:hover)').matches) {
    const xh = hero.querySelector('.xhair'), tx = document.getElementById('tbx'), ty = document.getElementById('tby');
    let raf = 0, ex = 0, ey = 0;
    hero.addEventListener('pointermove', e => {
      ex = e.clientX; ey = e.clientY;
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = hero.getBoundingClientRect(), x = ex - r.left, y = ey - r.top;
        xh.style.setProperty('--cx', x + 'px'); xh.style.setProperty('--cy', y + 'px');
        if (tx) { tx.textContent = 'X ' + String(Math.round(x)).padStart(4, '0'); ty.textContent = 'Y ' + String(Math.round(y)).padStart(4, '0'); }
      });
    }, { passive: true });
  }

  /* ---------- Answer highlight spreads from where you tapped ---------- */
  document.querySelectorAll('.opt').forEach(o => o.addEventListener('pointerdown', e => {
    const r = o.getBoundingClientRect();
    o.style.setProperty('--tx', (e.clientX - r.left) + 'px'); o.style.setProperty('--ty', (e.clientY - r.top) + 'px');
  }));

  /* ---------- The plan: dashed "proposed" drawing that inks in as the quiz is answered ---------- */
  const plan = document.getElementById('plan');
  if (plan) {
    // each part gets a dashed ghost copy underneath; the original becomes the ink layer
    plan.querySelectorAll('[data-part]').forEach(g => {
      const setLen = () => g.querySelectorAll('.ln').forEach(el => el.setAttribute('pathLength', '1'));
      if (g.classList.contains('ink')) { setLen(); return; }
      const ghost = g.cloneNode(true); // ghost keeps real lengths so its dashes stay dashes
      setLen();
      ghost.removeAttribute('data-part'); ghost.classList.add('ghost');
      ghost.querySelectorAll('[id]').forEach(n => n.removeAttribute('id'));
      ghost.querySelectorAll('.glow, .dimtext').forEach(n => n.remove());
      g.before(ghost); g.classList.add('ink');
    });
    const part = n => plan.querySelector(`[data-part="${n}"]`);
    const note = (n, text) => { const g = plan.querySelector(`[data-note="${n}"]`); g.querySelector('text').textContent = text; g.classList.add('on'); };
    const FIGS = { family: ['a1', 'k1', 'a2', 'k2'], spouse: ['a1', 'a2'], 'final-expenses': ['a1'], mortgage: ['a1', 'a2'] };
    const labelOf = input => input.closest('label').textContent.trim();
    const qform = document.getElementById('quote');
    qform && qform.addEventListener('change', e => {
      const t = e.target; if (t.type !== 'radio') return;
      if (t.name === 'protect') {
        part('walls').classList.add('on');
        const on = FIGS[t.value] || [];
        plan.querySelectorAll('.fig').forEach((f, k) => {
          const show = on.includes(f.dataset.fig);
          f.style.transitionDelay = show ? (.5 + k * .12) + 's' : '0s';
          f.classList.toggle('on', show);
        });
        note('protect', labelOf(t));
      }
      if (t.name === 'age') { part('roof').classList.add('on'); note('age', 'Age ' + labelOf(t).replace(/\s+/g, ' ')); }
      if (t.name === 'coverage') { part('foundation').classList.add('on'); document.getElementById('planCov').textContent = labelOf(t).toUpperCase(); }
      if (t.name === 'tobacco') { part('details').classList.add('on'); note('tobacco', 'Tobacco: ' + labelOf(t)); }
    });
    const done = document.querySelector('.step.done');
    done && new MutationObserver(() => { if (done.classList.contains('active')) document.getElementById('planStamp').classList.add('on'); })
      .observe(done, { attributes: true, attributeFilter: ['class'] });
  }

  /* ---------- "Get a quote" links: glide to the form, focus first answer ---------- */
  document.querySelectorAll('a[href="#quote"]').forEach(a => a.addEventListener('click', e => {
    const form = document.getElementById('quote'); if (!form) return;
    e.preventDefault();
    scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    setTimeout(() => form.querySelector('.step.active input')?.focus({ preventScroll: true }), 600);
  }));

  /* ---------- Qualifying form ---------- */
  const form = document.getElementById('quote');
  if (!form) return;
  const steps = [...form.querySelectorAll('.step')];
  const next = document.getElementById('next');
  const nextLabel = document.getElementById('nextLabel');
  const back = document.getElementById('back');
  const bar = document.getElementById('bar');
  const countEl = document.getElementById('count');
  const TOTAL = 5;
  let i = 0;

  const valid = () => {
    const s = steps[i];
    if (s.querySelector('input[type=radio]')) return !!s.querySelector('input:checked');
    return true;
  };
  const render = () => {
    steps.forEach((s, k) => { s.classList.toggle('active', k === i); s.classList.toggle('past', k < i); s.inert = k !== i; });
    bar.style.width = (Math.min(i, TOTAL) / TOTAL * 100) + '%';
    countEl.textContent = i < TOTAL ? `Step ${i + 1} of ${TOTAL}` : 'Complete';
    back.hidden = i === 0 || i >= TOTAL;
    nextLabel.textContent = i === TOTAL - 1 ? 'Get my free quote' : 'Continue';
    next.disabled = !valid();
    if (i >= TOTAL) { document.getElementById('nav').style.display = 'none'; document.getElementById('fine').style.display = 'none'; }
  };
  form.addEventListener('change', e => {
    if (e.target.type !== 'radio') return;
    next.disabled = false;
    setTimeout(() => { if (i < TOTAL - 1) { i++; render(); } }, 380);
  });
  form.addEventListener('submit', e => {
    e.preventDefault();
    if (i < TOTAL - 1) { if (valid()) { i++; render(); } return; }
    let ok = true;
    steps[i].querySelectorAll('input').forEach(f => {
      const good = f.value.trim() && (f.type !== 'email' || /\S+@\S+\.\S+/.test(f.value)) && (f.type !== 'tel' || f.value.replace(/\D/g, '').length >= 10);
      f.classList.toggle('bad', !good);
      if (!good) { ok = false; f.addEventListener('animationend', () => f.classList.remove('bad'), { once: true }); }
    });
    if (!ok) return;
    sendLead();
  });

  /* ---------- Send lead to CRM webhook ---------- */
  const CFG = Object.assign({ LEAD_WEBHOOK_URL: '', BOOKING_URL: '', LEAD_SOURCE: 'Verion Life website' }, window.VERION_CONFIG || {});
  const fine = document.getElementById('fine');
  let sending = false;

  function buildLead() {
    const d = Object.fromEntries(new FormData(form));
    const [first_name, ...rest] = (d.name || '').trim().split(/\s+/);
    const q = new URLSearchParams(location.search);
    const lead = {
      first_name, last_name: rest.join(' '), full_name: (d.name || '').trim(),
      phone: d.phone.trim(), email: d.email.trim(),
      protecting: d.protect, age_range: d.age, coverage_amount: d.coverage, tobacco: d.tobacco,
      source: CFG.LEAD_SOURCE, tags: ['website-lead', `coverage:${d.coverage}`],
      page: location.href, referrer: document.referrer || '',
      submitted_at: new Date().toISOString(),
    };
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'].forEach(k => { if (q.get(k)) lead[k] = q.get(k); });
    return lead;
  }

  /* One request per lead, sent as a standard form post. This is a "simple" request
     (no CORS preflight), so it reaches any webhook (GoHighLevel, Zapier, Make, n8n…)
     and is never sent twice. Zapier/Make/GHL parse these fields automatically. */
  function post(url, lead) {
    const body = new URLSearchParams();
    Object.entries(lead).forEach(([k, v]) => body.append(k, Array.isArray(v) ? v.join(',') : v));
    return fetch(url, { method: 'POST', mode: 'no-cors', keepalive: true, body });
  }

  async function sendLead() {
    if (sending) return;
    if (form.elements.company && form.elements.company.value) { i = TOTAL; render(); return; } // bot honeypot
    const lead = buildLead();
    sending = true; next.disabled = true; nextLabel.textContent = 'Sending…'; next.classList.add('loading');
    try {
      if (CFG.LEAD_WEBHOOK_URL) await post(CFG.LEAD_WEBHOOK_URL, lead);
      else console.warn('[Verion Life] No LEAD_WEBHOOK_URL set in config.js. Lead not sent:', lead);
      i = TOTAL; render(); setupBooking(lead);
    } catch (err) {
      console.error(err);
      fine.textContent = "Couldn't send. Check your connection and try again, or call us.";
      fine.classList.add('err');
      next.disabled = false; nextLabel.textContent = 'Try again';
    } finally { sending = false; next.classList.remove('loading'); }
  }

  /* ---------- Booking calendar (CRM / Calendly link) in a modal ---------- */
  function setupBooking(lead) {
    const btn = document.getElementById('bookBtn');
    if (!btn || !CFG.BOOKING_URL) return;
    btn.hidden = false;
    btn.onclick = () => {
      const u = new URL(CFG.BOOKING_URL, location.href);
      // most booking tools prefill from these
      u.searchParams.set('name', lead.full_name); u.searchParams.set('first_name', lead.first_name);
      u.searchParams.set('last_name', lead.last_name); u.searchParams.set('email', lead.email); u.searchParams.set('phone', lead.phone);
      const m = document.createElement('div');
      m.className = 'modal';
      m.innerHTML = `<div class="modal-box" role="dialog" aria-modal="true" aria-label="Book a call">
        <button type="button" class="modal-x" aria-label="Close">&times;</button>
        <iframe src="${u.href.replace(/"/g, '&quot;')}" title="Booking calendar"></iframe></div>`;
      const close = () => { m.classList.remove('open'); setTimeout(() => m.remove(), 250); removeEventListener('keydown', esc); };
      const esc = e => e.key === 'Escape' && close();
      m.addEventListener('click', e => { if (e.target === m || e.target.closest('.modal-x')) close(); });
      addEventListener('keydown', esc);
      document.body.append(m); requestAnimationFrame(() => m.classList.add('open'));
      m.querySelector('.modal-x').focus();
    };
  }
  back.addEventListener('click', () => { if (i > 0) { i--; render(); } });
  render();
})();
