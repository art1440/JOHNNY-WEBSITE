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
  const TOTAL = 7;
  let i = 0;

  const valid = () => {
    const s = steps[i];
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

  /* ---------- State picker: type to filter, tap (or Enter on a single match) to pick ---------- */
  const STATES = [['AL','Alabama'],['AK','Alaska'],['AZ','Arizona'],['AR','Arkansas'],['CA','California'],['CO','Colorado'],['CT','Connecticut'],['DE','Delaware'],['DC','District of Columbia'],['FL','Florida'],['GA','Georgia'],['HI','Hawaii'],['ID','Idaho'],['IL','Illinois'],['IN','Indiana'],['IA','Iowa'],['KS','Kansas'],['KY','Kentucky'],['LA','Louisiana'],['ME','Maine'],['MD','Maryland'],['MA','Massachusetts'],['MI','Michigan'],['MN','Minnesota'],['MS','Mississippi'],['MO','Missouri'],['MT','Montana'],['NE','Nebraska'],['NV','Nevada'],['NH','New Hampshire'],['NJ','New Jersey'],['NM','New Mexico'],['NY','New York'],['NC','North Carolina'],['ND','North Dakota'],['OH','Ohio'],['OK','Oklahoma'],['OR','Oregon'],['PA','Pennsylvania'],['PR','Puerto Rico'],['RI','Rhode Island'],['SC','South Carolina'],['SD','South Dakota'],['TN','Tennessee'],['TX','Texas'],['UT','Utah'],['VT','Vermont'],['VA','Virginia'],['WA','Washington'],['WV','West Virginia'],['WI','Wisconsin'],['WY','Wyoming']];
  // Spanish names people may type, so "nueva york" or "carolina del norte" still finds it
  const ES = { NY: 'nueva york', NJ: 'nueva jersey', NM: 'nuevo mexico', NH: 'nuevo hampshire', NC: 'carolina del norte', SC: 'carolina del sur', ND: 'dakota del norte', SD: 'dakota del sur', PA: 'pensilvania', LA: 'luisiana', HI: 'hawai', WV: 'virginia occidental', DC: 'distrito de columbia washington dc' };
  const stList = document.getElementById('stList'), stQ = document.getElementById('stQ'), stNone = document.getElementById('stNone');
  if (stList && stQ) {
    const norm = t => t.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
    stList.innerHTML = STATES.map(([c, n]) => `<label class="st" data-k="${norm(`${n} ${c} ${ES[c] || ''}`)}"><input type="radio" name="state" value="${c}"><span>${n}</span><small>${c}</small></label>`).join('');
    const items = [...stList.children];
    stQ.addEventListener('input', () => {
      const q = norm(stQ.value);
      let shown = 0;
      items.forEach(l => {
        const hit = !q || l.dataset.k.split(' ').some(w => w.startsWith(q)) || l.dataset.k.includes(q) || (q.length === 2 && l.querySelector('input').value.toLowerCase() === q);
        if (hit === !l.hidden) { if (hit) shown++; return; }
        l.hidden = !hit;
        if (hit && !reduce) l.animate([{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 260, delay: Math.min(shown, 8) * 18, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'backwards' });
        if (hit) shown++;
      });
      stNone.hidden = shown > 0;
      stList.scrollTop = 0;
    });
    stQ.addEventListener('keydown', e => {
      if (e.key !== 'Enter') return;
      const vis = items.filter(l => !l.hidden);
      if (vis.length === 1 || (vis.length && norm(stQ.value).length >= 3)) {
        e.preventDefault();
        const r = vis[0].querySelector('input'); r.checked = true; r.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
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

  const CALL_WINDOWS = { morning: 'Mañana (9 am – 12 pm)', afternoon: 'Tarde (12 pm – 5 pm)', evening: 'Noche (5 pm – 8 pm)' };
  function buildLead() {
    const d = Object.fromEntries(new FormData(form));
    const [first_name, ...rest] = (d.name || '').trim().split(/\s+/);
    const q = new URLSearchParams(location.search);
    const lead = {
      first_name, last_name: rest.join(' '), full_name: (d.name || '').trim(),
      phone: d.phone.trim(), email: d.email.trim(),
      // IUL answers. Sent under the original column names too, so the Sheet/CRM keep working.
      state: d.state || '',
      interest: d.interest, savings_monthly: d.savings, priority: d.priority,
      protecting: d.interest, age_range: d.age, coverage_amount: d.savings,
      call_window: d.call_window, call_local: CALL_WINDOWS[d.call_window] || '',
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

  render();
})();
