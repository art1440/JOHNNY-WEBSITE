/* Verion Life — shared interactions */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Header ---------- */
  const header = document.querySelector('.site-header');
  const onScroll = () => header && header.classList.toggle('scrolled', scrollY > 10);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- Hero: the thing being protected rotates (su familia → sus hijos → …) ---------- */
  const rot = document.querySelector('.rot');
  if (rot) {
    const words = [...rot.children];
    let k = 0;
    const fit = () => { rot.style.width = words[k].offsetWidth + 'px'; };
    fit();
    if (window.ResizeObserver) new ResizeObserver(fit).observe(words[0]);
    else addEventListener('resize', fit);
    if (!reduce) {
      let paused = false;
      const h1 = rot.closest('h1');
      h1.addEventListener('pointerenter', () => paused = true);
      h1.addEventListener('pointerleave', () => paused = false);
      setTimeout(() => setInterval(() => {
        if (paused || document.hidden) return;
        const cur = words[k];
        k = (k + 1) % words.length;
        cur.classList.replace('is-on', 'is-off');
        words[k].classList.add('is-on');
        fit();
        setTimeout(() => cur.classList.remove('is-off'), 700);
      }, 2600), 1200);
    }
  }

  /* ---------- Qualifying form ---------- */
  const form = document.getElementById('quote');
  if (!form) return;
  const steps = [...form.querySelectorAll('.step')];
  const next = document.getElementById('next');
  const nextLabel = document.getElementById('nextLabel');
  const back = document.getElementById('back');
  const bar = document.getElementById('bar');
  const countEl = document.getElementById('count');
  const TOTAL = 6;
  let i = 0;

  const valid = () => {
    const s = steps[i];
    // every radio group in the step needs an answer (the scheduler has two: day + time)
    const groups = new Set([...s.querySelectorAll('input[type=radio]')].map(r => r.name));
    const range = s.querySelector('input[type=range]');
    if (range && !range.dataset.touched) return false;   // 1–10 meter: they have to actually pick
    return [...groups].every(n => s.querySelector(`input[name="${n}"]:checked`));
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
    if (e.target.closest('[data-noauto]')) { next.disabled = !valid(); return; } // scheduler: let them watch the countdown
    next.disabled = false;
    setTimeout(() => { if (i < TOTAL - 1) { i++; render(); } }, 380);
  });
  /* ---------- 1–10 importance meter ---------- */
  const prio = document.getElementById('priority');
  if (prio) {
    const meter = document.getElementById('meter'), nEl = document.getElementById('prioN'), wEl = document.getElementById('prioW');
    const word = v => v <= 3 ? 'Poco importante' : v <= 6 ? 'Algo importante' : v <= 8 ? 'Importante' : '¡Muy importante!';
    const paint = () => {
      const v = +prio.value;
      meter.style.setProperty('--p', ((v - 1) / 9 * 100) + '%');
      meter.style.setProperty('--heat', (v - 1) / 9);
      nEl.textContent = v;
      prio.setAttribute('aria-valuetext', `${v} de 10, ${word(v).replace(/[¡!]/g, '')}`);
      if (prio.dataset.touched) wEl.textContent = word(v);
      [...meter.querySelectorAll('.meter-ticks i')].forEach((t, k) => t.classList.toggle('on', k < v));
    };
    let last = +prio.value;
    prio.addEventListener('input', () => {
      if (!prio.dataset.touched) { prio.dataset.touched = '1'; meter.classList.add('touched'); }
      paint();
      if (+prio.value !== last && !reduce) { nEl.classList.remove('pop'); void nEl.offsetWidth; nEl.classList.add('pop'); }
      last = +prio.value;
      next.disabled = !valid();
    });
    paint();
  }

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
  let leadId = '';   // one id per submission, so a retry never creates a duplicate row

  function buildLead() {
    const d = Object.fromEntries(new FormData(form));
    const [first_name, ...rest] = (d.name || '').trim().split(/\s+/);
    const q = new URLSearchParams(location.search);
    const lead = {
      first_name, last_name: rest.join(' '), full_name: (d.name || '').trim(),
      phone: d.phone.trim(), email: d.email.trim(),
      // IUL answers. Sent under the original column names too, so the Sheet/CRM keep working.
      interest: d.interest, savings_monthly: d.savings, priority: d.priority,
      protecting: d.interest, age_range: d.age, coverage_amount: d.savings,
      ...callFields(),
      source: CFG.LEAD_SOURCE, tags: ['website-lead', `savings:${d.savings}`, `priority:${d.priority}`],
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
      leadId = leadId || 'w' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      lead.id = leadId;
      // dashboard database (Google Sheet) and/or an outside CRM webhook
      const sends = [CFG.DASHBOARD_API_URL, CFG.LEAD_WEBHOOK_URL].filter(Boolean).map(u => post(u, lead));
      if (!sends.length) console.warn('[Verion Life] No DASHBOARD_API_URL or LEAD_WEBHOOK_URL set in config.js. Lead not sent:', lead);
      await Promise.all(sends);
      if (CFG.CRM_DEMO && !CFG.DASHBOARD_API_URL) try { // demo dashboard (crm.html) picks this up live, same browser only
        const k = 'verion_live_leads', all = JSON.parse(localStorage.getItem(k) || '[]');
        all.push(lead);
        localStorage.setItem(k, JSON.stringify(all.slice(-25)));
      } catch (e) { /* storage blocked: nothing to do */ }
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

  /* ---------- Live call scheduler (step 4) ----------
     Next 7 days (so every weekday is reachable) × time slots. Re-evaluated every
     second, aligned to the wall clock: slots inside the lead window disable
     themselves as time passes, and the countdown to the chosen slot ticks live. */
  const SCHED = Object.assign({ start: 9, end: 19, step: 30, leadMinutes: 30 }, CFG.CALL_HOURS || {});
  const daysEl = document.getElementById('days');
  const timesEl = document.getElementById('times');
  const pill = daysEl && daysEl.querySelector('.pill');
  const rollEl = document.getElementById('roll');
  const etaEl = document.getElementById('eta');
  const etaK = document.getElementById('etaK');
  const etaWhen = document.getElementById('etaWhen');
  const nowClock = document.getElementById('nowClock');
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
  const pad = n => String(n).padStart(2, '0');
  const dayKey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const cap = t => t.charAt(0).toUpperCase() + t.slice(1);
  const fmt = (d, o) => cap(new Intl.DateTimeFormat('es', o).format(d).replace(/\./g, ''));
  const h12 = m => { const h = Math.floor(m / 60), mm = m % 60; return { t: `${h % 12 || 12}:${pad(mm)}`, ap: h < 12 ? 'am' : 'pm' }; };
  const slotMins = [];
  for (let m = SCHED.start * 60; m <= SCHED.end * 60; m += SCHED.step) slotMins.push(m);
  const slotDate = (key, m) => { const [y, mo, d] = key.split('-').map(Number); return new Date(y, mo - 1, d, Math.floor(m / 60), m % 60); };
  const open = (key, m, now) => slotDate(key, m) - now >= SCHED.leadMinutes * 60000;
  let todayKey = '';

  function buildDays(now) {
    todayKey = dayKey(now);
    const keep = (daysEl.querySelector('input:checked') || {}).value;
    daysEl.querySelectorAll('.day').forEach(n => n.remove());
    for (let k = 0; k < 7; k++) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + k);
      const key = dayKey(d);
      const l = document.createElement('label');
      l.className = 'day'; l.style.setProperty('--i', k);
      l.innerHTML = `<input type="radio" name="callday" value="${key}"><span class="dw">${k === 0 ? 'Hoy' : fmt(d, { weekday: 'short' })}</span><span class="dn">${d.getDate()}</span>`;
      l.firstChild.setAttribute('aria-label', fmt(d, { weekday: 'long', day: 'numeric', month: 'long' }));
      if (key === keep) l.firstChild.checked = true;
      daysEl.append(l);
    }
  }
  function buildTimes() {
    timesEl.innerHTML = slotMins.map(m => { const { t, ap } = h12(m); return `<label class="slot"><input type="radio" name="calltime" value="${pad(m / 60 | 0)}:${pad(m % 60)}" aria-label="${t} ${ap}"><span>${t}<small>${ap}</small></span></label>`; }).join('');
  }
  const pickedDay = () => daysEl.querySelector('input:checked');
  const pickedTime = () => timesEl.querySelector('input:checked');

  // sliding glass pill behind the chosen day (shared-element motion, not a re-styled chip)
  function movePill(instant) {
    const c = pickedDay(); if (!pill) return;
    if (!c) { pill.style.opacity = 0; return; }
    const l = c.parentElement;
    if (instant) pill.style.transition = 'none';
    pill.style.opacity = 1;
    pill.style.width = l.offsetWidth + 'px';
    pill.style.transform = `translateX(${l.offsetLeft}px)`;
    if (instant) { pill.offsetWidth; pill.style.transition = ''; }
  }
  function scrollToSlot(smooth) {
    const target = (pickedTime() || timesEl.querySelector('input:not(:disabled)') || {}).parentElement;
    if (target) timesEl.scrollTo({ left: target.offsetLeft - 6, behavior: smooth && !reduce ? 'smooth' : 'auto' });
  }

  // odometer: each digit cell swaps with the new digit dropping in from above (time runs down)
  let rollStr = '';
  function setRoll(str) {
    if (str.length !== rollStr.length) {
      rollEl.innerHTML = [...str].map(ch => /\d/.test(ch) ? `<span class="dg"><span>${ch}</span></span>` : `<span class="sep">${ch}</span>`).join('');
      rollStr = str; return;
    }
    const cells = rollEl.children;
    let changed = 0;
    [...str].forEach((ch, k) => {
      if (ch === rollStr[k] || !/\d/.test(ch)) { if (!/\d/.test(ch)) cells[k].textContent = ch; return; }
      const cell = cells[k];
      while (cell.children.length > 1) cell.firstElementChild.remove(); // a digit still leaving from the last tick
      const old = cell.lastElementChild, nu = document.createElement('span');
      nu.textContent = ch; cell.append(nu);
      if (reduce) { old.remove(); return; }
      const delay = changed++ * 28; // left-to-right ripple when many digits change at once
      const o = { duration: 420, delay, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' };
      nu.animate([{ transform: 'translateY(-100%)', opacity: 0, filter: 'blur(2px)' }, { transform: 'none', opacity: 1, filter: 'blur(0)' }], o);
      old.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(90%)', opacity: 0, filter: 'blur(2px)' }], { ...o, fill: 'forwards' }).onfinish = () => old.remove();
    });
    rollStr = str;
  }

  // the message stays until they pick again; the shake replays each time
  let warnMsg = '';
  function warn(msg) {
    warnMsg = msg;
    etaEl.classList.remove('warn'); etaEl.offsetWidth; etaEl.classList.add('warn');
  }

  function update(fromUser) {
    const now = new Date();
    nowClock.textContent = `${pad(now.getHours() % 12 || 12)}:${pad(now.getMinutes())}:${pad(now.getSeconds())} ${now.getHours() < 12 ? 'am' : 'pm'}`;
    if (dayKey(now) !== todayKey) { buildDays(now); movePill(true); }

    // days: today greys out once its last slot is inside the lead window
    daysEl.querySelectorAll('input').forEach(r => {
      const full = !slotMins.some(m => open(r.value, m, now));
      if (r.disabled !== full) r.disabled = full;
      if (full && r.checked) {
        r.checked = false;
        const t = pickedTime(); if (t) t.checked = false; // don't silently move their call to tomorrow
        warn('Hoy ya no quedan horarios, elija otro día');
      }
    });
    if (!pickedDay()) { const f = daysEl.querySelector('input:not(:disabled)'); if (f) { f.checked = true; movePill(true); } }

    // slots: disable the ones that have slipped into the past (live, every second)
    const day = pickedDay().value;
    timesEl.querySelectorAll('input').forEach(r => {
      const [h, mm] = r.value.split(':').map(Number);
      const gone = !open(day, h * 60 + mm, now);
      if (r.disabled !== gone) r.disabled = gone;
      if (gone && r.checked) { r.checked = false; if (fromUser !== 'day') warn('Ese horario acaba de pasar, elija otro'); }
    });

    const t = pickedTime();
    if (t) {
      const [h, mm] = t.value.split(':').map(Number);
      const at = slotDate(day, h * 60 + mm);
      let s = Math.max(0, Math.floor((at - now) / 1000));
      const d = Math.floor(s / 86400); s -= d * 86400;
      const hh = Math.floor(s / 3600); s -= hh * 3600;
      const mi = Math.floor(s / 60); s -= mi * 60;
      setRoll(`${d ? d + 'd\u00a0' : ''}${pad(hh)}:${pad(mi)}:${pad(s)}`);
      etaK.textContent = 'Le llamamos en';
      etaWhen.textContent = `${fmt(at, { weekday: 'short', day: 'numeric', month: 'short' })} · ${h12(h * 60 + mm).t} ${h12(h * 60 + mm).ap}`;
      etaEl.classList.add('set');
    } else {
      etaEl.classList.remove('set');
      etaK.textContent = warnMsg || 'Elija una hora';
      etaWhen.textContent = ''; rollStr = ''; rollEl.innerHTML = '';
    }
    if (i === 3) next.disabled = !valid();
    if (fromUser === 'day') scrollToSlot(true);
  }

  function callFields() {
    const d = pickedDay(), t = pickedTime();
    if (!d || !t) return {};
    const [h, mm] = t.value.split(':').map(Number);
    const at = slotDate(d.value, h * 60 + mm);
    return {
      call_date: d.value, call_time: t.value,
      call_day: fmt(at, { weekday: 'long' }),
      call_at: at.toISOString(), call_timezone: tz,
      call_local: `${fmt(at, { weekday: 'long', day: 'numeric', month: 'long' })}, ${h12(h * 60 + mm).t} ${h12(h * 60 + mm).ap}`,
    };
  }

  if (daysEl && timesEl) {
    buildTimes(); buildDays(new Date());
    daysEl.addEventListener('change', () => { movePill(); update('day'); });
    timesEl.addEventListener('change', () => { warnMsg = ''; etaEl.classList.remove('warn'); update(); });
    // vertical wheel scrolls the slot strip sideways, but only while it can move
    timesEl.addEventListener('wheel', e => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const max = timesEl.scrollWidth - timesEl.clientWidth;
      if ((e.deltaY > 0 && timesEl.scrollLeft < max - 1) || (e.deltaY < 0 && timesEl.scrollLeft > 0)) { e.preventDefault(); timesEl.scrollLeft += e.deltaY; }
    }, { passive: false });
    addEventListener('resize', () => movePill(true));
    // tick on the second boundary so the clock never drifts or skips
    const tick = () => { update(); setTimeout(tick, 1000 - (Date.now() % 1000) + 8); };
    tick(); movePill(true); scrollToSlot(false);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) update(); });
  }
  render();
})();
