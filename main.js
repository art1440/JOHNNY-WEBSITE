/* Verion Life — shared interactions */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Header ---------- */
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
  document.querySelectorAll('[data-stars]').forEach(el => { el.innerHTML = star.repeat(+el.dataset.stars || 5); el.setAttribute('aria-label', `${el.dataset.stars || 5} de 5 estrellas`); });

  /* ---------- Marquee: duplicate content for a seamless loop ---------- */
  document.querySelectorAll('.marquee .track').forEach(t => {
    [...t.children].forEach(c => { const d = c.cloneNode(true); d.setAttribute('aria-hidden', 'true'); t.append(d); });
  });

  /* ---------- Glass spheres drift up as you scroll so they never sit behind text for long ---------- */
  if (!reduce) {
    const orbs = [...document.querySelectorAll('.orb')], speed = [0.55, 0.9, 0.35];
    let sraf = 0;
    const drift = () => { sraf = 0; orbs.forEach((o, k) => o.style.translate = `0 ${(-scrollY * speed[k % 3]).toFixed(1)}px`); };
    addEventListener('scroll', () => { if (!sraf) sraf = requestAnimationFrame(drift); }, { passive: true });
    drift();
  }

  /* ---------- Liquid: a glass droplet trails the pointer; glass ripples harder the faster you move ---------- */
  if (!reduce && matchMedia('(hover:hover)').matches) {
    const lens = document.querySelector('.lens');
    const disp = document.querySelector('#liquid feDisplacementMap');
    const BASE = 30;
    let tx = -200, ty = -200, x = tx, y = ty, px = tx, py = ty, scale = BASE, raf = 0;
    const loop = () => {
      x += (tx - x) * 0.16; y += (ty - y) * 0.16;            // trailing spring
      const v = Math.min(60, Math.hypot(x - px, y - py)); px = x; py = y;
      if (lens) {
        lens.style.setProperty('--lx', x + 'px'); lens.style.setProperty('--ly', y + 'px');
        lens.style.setProperty('--ls', (1 + v / 120).toFixed(3)); // stretches while moving, like a drop
      }
      const target = BASE + v * 1.1;
      if (disp && Math.abs(target - scale) > 0.5) { scale += (target - scale) * 0.12; disp.setAttribute('scale', scale.toFixed(1)); }
      raf = (Math.abs(tx - x) + Math.abs(ty - y) > 0.3 || Math.abs(scale - BASE) > 0.6) ? requestAnimationFrame(loop) : 0;
    };
    addEventListener('pointermove', e => {
      tx = e.clientX; ty = e.clientY;
      if (lens && !lens.classList.contains('on')) { x = px = tx; y = py = ty; lens.classList.add('on'); }
      if (!raf) raf = requestAnimationFrame(loop);
    }, { passive: true });
    document.addEventListener('pointerleave', () => lens && lens.classList.remove('on'));
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
    countEl.textContent = i < TOTAL ? `Paso ${i + 1} de ${TOTAL}` : 'Completo';
    back.hidden = i === 0 || i >= TOTAL;
    nextLabel.textContent = i === TOTAL - 1 ? 'Obtener mi cotización gratuita' : 'Continuar';
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
    sending = true; next.disabled = true; nextLabel.textContent = 'Enviando…'; next.classList.add('loading');
    try {
      if (CFG.LEAD_WEBHOOK_URL) await post(CFG.LEAD_WEBHOOK_URL, lead);
      else console.warn('[Verion Life] No LEAD_WEBHOOK_URL set in config.js. Lead not sent:', lead);
      i = TOTAL; render(); setupBooking(lead);
    } catch (err) {
      console.error(err);
      fine.textContent = "No se pudo enviar. Revise su conexión e intente de nuevo, o llámenos.";
      fine.classList.add('err');
      next.disabled = false; nextLabel.textContent = 'Intentar de nuevo';
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
      m.innerHTML = `<div class="modal-box" role="dialog" aria-modal="true" aria-label="Agendar una llamada">
        <button type="button" class="modal-x" aria-label="Cerrar">&times;</button>
        <iframe src="${u.href.replace(/"/g, '&quot;')}" title="Calendario de citas"></iframe></div>`;
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
