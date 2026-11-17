/* Spanish-first life insurance site: language, quiz, lead capture, motion */
(() => {
  const S = Object.assign({
    AGENT_NAME: 'Juan Pérez', AGENT_FIRST: 'Juan', INITIALS: 'JP', PHONE: '', WHATSAPP: '',
    LICENSE: '', NPN: '', STATES: '', YEARS: '', HOURS_ES: '', HOURS_EN: '',
    LICENSE_LOOKUP_URL: 'https://nipr.com/help/look-up-a-license',
    LEAD_WEBHOOK_URL: '', BOOKING_URL: '', LEAD_SOURCE: 'Sitio web hispano',
  }, window.SITE || {});

  const root = document.documentElement;
  root.classList.add('js');
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const store = {
    get(k, s = localStorage) { try { return s.getItem(k); } catch (e) { return null; } },
    set(k, v, s = localStorage) { try { s.setItem(k, v); } catch (e) { /* private mode */ } },
  };
  const digits = v => String(v || '').replace(/\D/g, '');

  /* ---------- Copy that JS writes (everything else lives in the HTML) ---------- */
  const T = {
    es: {
      title: n => `Seguro de vida en español | ${n}, agente con licencia`,
      words: ['su familia.', 'sus hijos.', 'su pareja.', 'su hogar.', 'su tranquilidad.'],
      count: (n, t) => `Pregunta ${n} de ${t}`,
      complete: '¡Listo!',
      next: 'Continuar', submit: 'Ver mis opciones', sending: 'Enviando…', retry: 'Intentar de nuevo',
      sendErr: 'No se pudo enviar. Revise su conexión e intente de nuevo, o escríbame por WhatsApp.',
      phone: 'Teléfono', phoneWa: 'Número de WhatsApp',
      thanks: n => n ? `¡Gracias, ${n}!` : '¡Gracias!',
      via: { whatsapp: 'WhatsApp', call: 'teléfono', text: 'mensaje de texto' },
      doneBody: m => `Ya recibí sus respuestas. Le voy a contactar por ${m} muy pronto para explicarle sus opciones, sin compromiso.`,
      waNow: n => `Escribirle a ${n} ahora`,
      waHello: n => `Hola ${n}, vi su página y tengo una pregunta sobre seguros de vida.`,
      waAfter: (n, me) => `Hola ${n}, soy ${me}. Acabo de llenar el formulario en su página.`,
      call: 'Llamar',
    },
    en: {
      title: n => `Life insurance in Spanish & English | ${n}, licensed agent`,
      words: ['your family.', 'your kids.', 'your partner.', 'your home.', 'your peace of mind.'],
      count: (n, t) => `Question ${n} of ${t}`,
      complete: 'All set!',
      next: 'Continue', submit: 'See my options', sending: 'Sending…', retry: 'Try again',
      sendErr: "Couldn't send. Check your connection and try again, or message me on WhatsApp.",
      phone: 'Phone', phoneWa: 'WhatsApp number',
      thanks: n => n ? `Thank you, ${n}!` : 'Thank you!',
      via: { whatsapp: 'WhatsApp', call: 'phone', text: 'text message' },
      doneBody: m => `I've got your answers. I'll reach out by ${m} very soon to walk you through your options, no obligation.`,
      waNow: n => `Message ${n} now`,
      waHello: n => `Hi ${n}, I saw your website and have a question about life insurance.`,
      waAfter: (n, me) => `Hi ${n}, this is ${me}. I just filled out the form on your website.`,
      call: 'Call',
    },
  };

  let lang = 'es';
  let lead = null; // set after submit, used by the thank-you screen

  /* ---------- Config → page ---------- */
  const waLink = text => {
    const n = digits(S.WHATSAPP);
    return n ? `https://wa.me/${n}?text=${encodeURIComponent(text)}` : '#';
  };
  const telLink = () => {
    let n = digits(S.PHONE);
    if (n.length === 10) n = '1' + n;
    return `tel:+${n}`;
  };
  function fillConfig() {
    const map = {
      name: S.AGENT_NAME, first: S.AGENT_FIRST, initials: S.INITIALS, phone: S.PHONE,
      license: S.LICENSE, npn: S.NPN, states: S.STATES, years: S.YEARS,
      hours: lang === 'en' ? S.HOURS_EN : S.HOURS_ES,
    };
    $$('[data-cfg]').forEach(el => { const v = map[el.dataset.cfg]; if (v) el.textContent = v; });
    $$('[data-href]').forEach(a => {
      const k = a.dataset.href;
      if (k === 'tel') a.href = telLink();
      if (k === 'wa') a.href = waLink(T[lang].waHello(S.AGENT_FIRST));
      if (k === 'lookup') a.href = S.LICENSE_LOOKUP_URL;
    });
    $$('img[data-en-alt]').forEach(img => { img.alt = lang === 'en' ? img.dataset.enAlt.replace('Juan Pérez', S.AGENT_NAME) : `Foto de ${S.AGENT_NAME}`; });
    document.title = T[lang].title(S.AGENT_NAME);
  }

  /* ---------- Language ---------- */
  const i18n = $$('[data-en]');
  function swapText(l) {
    i18n.forEach(el => {
      if (el.dataset.es === undefined) el.dataset.es = el.innerHTML;
      el.innerHTML = l === 'en' ? el.dataset.en : el.dataset.es;
    });
    $$('[data-en-aria]').forEach(el => {
      if (el.dataset.esAria === undefined) el.dataset.esAria = el.getAttribute('aria-label') || '';
      el.setAttribute('aria-label', l === 'en' ? el.dataset.enAria : el.dataset.esAria);
    });
  }
  function setLang(l, animate) {
    if (l !== 'en') l = 'es';
    const apply = () => {
      lang = l;
      root.lang = l;
      swapText(l);
      fillConfig();
      $$('.lang button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === l)));
      buildRotator();
      renderChrome();
      if (lead) renderDone();
    };
    if (!animate || reduce) { apply(); return; }
    root.classList.add('lang-out');
    setTimeout(() => { apply(); requestAnimationFrame(() => root.classList.remove('lang-out')); }, 150);
  }
  $$('.lang button').forEach(b => b.addEventListener('click', () => {
    if (b.dataset.lang === lang) return;
    store.set('lang', b.dataset.lang);
    setLang(b.dataset.lang, true);
  }));

  /* ---------- Headline: the protected word changes by itself ---------- */
  // each new word is painted on, and the white brush stroke under it is repainted to fit
  const rot = $('#rot');
  const brush = $('.brush');
  let rotIdx = 0, rotTimer = 0, heroVisible = true;
  function buildRotator() {
    if (!rot) return;
    rot.innerHTML = T[lang].words.map((w, k) => `<em class="${k === 0 ? 'on' : ''}">${w}</em>`).join('');
    rotIdx = 0;
    fitBrush(true);
  }
  function fitBrush(repaint) {
    if (!rot || !brush) return;
    const w = rot.children[rotIdx].offsetWidth;
    brush.style.setProperty('--bw', `calc(${w}px + .3em)`);
    if (repaint && !reduce) { brush.classList.remove('paint'); void brush.getBoundingClientRect(); brush.classList.add('paint'); }
  }
  function tickRotator() {
    if (document.hidden || !heroVisible) return;
    const ems = [...rot.children];
    const cur = ems[rotIdx];
    rotIdx = (rotIdx + 1) % ems.length;
    const nxt = ems[rotIdx];
    cur.classList.remove('on'); cur.classList.add('off');
    nxt.classList.remove('off'); nxt.classList.add('on');
    setTimeout(() => cur.classList.remove('off'), 400);
    fitBrush(true);
  }
  if (rot && !reduce) rotTimer = setInterval(tickRotator, 3200);
  addEventListener('resize', () => fitBrush(false), { passive: true });
  if (document.fonts) document.fonts.ready.then(() => fitBrush(false));

  /* ---------- Quiz ---------- */
  const form = $('#cotizar');
  const steps = $$('.step', form);
  const TOTAL = 6;
  const next = $('#next'), nextLabel = $('#nextLabel'), back = $('#back');
  const count = $('#count'), typing = $('#typing'), stepsBox = $('.steps', form);
  const fineOk = $('#fineOk'), fineErr = $('#fineErr'), cardFoot = $('#cardFoot');
  const segs = $$('.tiles i', form);
  let i = 0, busy = false, autoT = 0, sending = false;
  let lastInput = 'pointer', arrowKey = false;

  const valid = () => {
    const s = steps[i];
    if (!s || i >= TOTAL) return false;
    if (s.querySelector('input[type=radio]')) return !!s.querySelector('input:checked');
    return true;
  };

  function renderChrome() {
    const t = T[lang];
    segs.forEach((s, k) => { s.classList.toggle('on', k < i); s.classList.toggle('cur', k === i); });
    count.textContent = i < TOTAL ? t.count(i + 1, TOTAL) : t.complete;
    back.hidden = i === 0 || i >= TOTAL;
    if (!sending) nextLabel.textContent = i === TOTAL - 1 ? t.submit : t.next;
    next.disabled = sending || !valid();
    const m = form.elements.contact_method && form.elements.contact_method.value;
    $('#l-phone').textContent = m === 'whatsapp' ? t.phoneWa : t.phone;
  }

  // the card eases between question heights instead of reserving space for the tallest one
  let settleT = 0;
  function lockHeight() {
    clearTimeout(settleT);
    stepsBox.style.transition = '';
    stepsBox.style.height = stepsBox.offsetHeight + 'px';
  }
  function settleHeight() {
    const h0 = stepsBox.offsetHeight;
    stepsBox.style.height = '';
    const h1 = stepsBox.offsetHeight;
    if (reduce || Math.abs(h1 - h0) < 2) return;
    stepsBox.style.height = h0 + 'px';
    stepsBox.style.overflow = 'hidden';
    void stepsBox.offsetHeight;
    stepsBox.style.transition = 'height .5s cubic-bezier(.16,1,.3,1)';
    stepsBox.style.height = h1 + 'px';
    settleT = setTimeout(() => { stepsBox.style.cssText = ''; }, 520);
  }

  function show(n) {
    steps.forEach((s, k) => { s.classList.toggle('active', k === n); s.inert = k !== n; });
    form.classList.toggle('is-done', n >= TOTAL);
    cardFoot.inert = n >= TOTAL;
    if (lastInput === 'key') {
      const target = n >= TOTAL ? steps[n] : (steps[n].querySelector('input:checked') || steps[n].querySelector('input'));
      target && target.focus({ preventScroll: true });
    } else if (n >= TOTAL) steps[n].focus({ preventScroll: true });
  }

  function go(n) {
    if (busy || n === i || n < 0 || n > TOTAL) return;
    clearTimeout(autoT);
    form.style.setProperty('--d0', '0s');
    const from = steps[i], fwd = n > i, question = fwd && n < TOTAL;
    i = n;
    renderChrome();
    if (reduce) { show(n); return; }
    busy = true;
    lockHeight();
    from.classList.remove('active');
    from.classList.add(fwd ? 'leave-fwd' : 'leave-back');
    if (question) setTimeout(() => typing.classList.add('on'), 140);
    const wait = question ? 560 : fwd ? 320 : 200;
    setTimeout(() => {
      typing.classList.remove('on');
      from.classList.remove('leave-fwd', 'leave-back');
      show(n);
      settleHeight();
      busy = false;
    }, wait);
  }

  form.addEventListener('keydown', e => { lastInput = 'key'; arrowKey = e.key.startsWith('Arrow'); });
  let wasChecked = false;
  form.addEventListener('pointerdown', e => {
    lastInput = 'pointer'; arrowKey = false;
    const opt = e.target.closest('.opt');
    const r = opt && opt.querySelector('input[type=radio]');
    wasChecked = !!(r && r.checked);
    if (opt) { // the answer floods with paint from where it was tapped
      const b = opt.getBoundingClientRect();
      opt.style.setProperty('--x', ((e.clientX - b.left) / b.width * 100).toFixed(1) + '%');
      opt.style.setProperty('--y', ((e.clientY - b.top) / b.height * 100).toFixed(1) + '%');
    }
  });
  // tapping the answer you already picked (after going back) also moves on
  form.addEventListener('click', e => {
    if (e.target.type === 'radio' && wasChecked && lastInput === 'pointer' && i < TOTAL - 1) { wasChecked = false; go(i + 1); }
  });

  // one tap per question: picking an answer moves on by itself
  form.addEventListener('change', e => {
    if (e.target.type !== 'radio') return;
    renderChrome();
    if (arrowKey) return; // arrow keys browse options; Enter or Space confirms
    clearTimeout(autoT);
    autoT = setTimeout(() => { if (i < TOTAL - 1) go(i + 1); }, 300);
  });
  form.addEventListener('keyup', e => {
    if (e.key === ' ' && e.target.type === 'radio' && e.target.checked && i < TOTAL - 1) go(i + 1);
  });
  back.addEventListener('click', () => go(i - 1));

  // phone mask: (555) 123-4567
  const phone = form.elements.phone;
  phone.addEventListener('input', () => {
    let d = digits(phone.value);
    if (d.length === 11 && d[0] === '1') d = d.slice(1);
    d = d.slice(0, 10);
    phone.value = d.length > 6 ? `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}` : d.length > 3 ? `(${d.slice(0, 3)}) ${d.slice(3)}` : d;
  });
  const zip = form.elements.zip;
  zip.addEventListener('input', () => { zip.value = digits(zip.value).slice(0, 5); });

  const checks = {
    name: v => v.trim().length >= 2,
    phone: v => digits(v).replace(/^1(?=\d{10}$)/, '').length === 10,
    zip: v => /^\d{5}$/.test(v),
    email: v => !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()),
  };
  $$('.fields input', form).forEach(inp => inp.addEventListener('input', () => {
    if (inp.getAttribute('aria-invalid') === 'true' && checks[inp.name](inp.value)) inp.removeAttribute('aria-invalid');
  }));

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (i < TOTAL - 1) { if (valid()) go(i + 1); return; }
    if (i !== TOTAL - 1) return;
    let firstBad = null;
    Object.keys(checks).forEach(k => {
      const inp = form.elements[k];
      const ok = checks[k](inp.value);
      inp.toggleAttribute('aria-invalid', !ok);
      if (!ok) {
        inp.setAttribute('aria-invalid', 'true');
        firstBad = firstBad || inp;
        if (!reduce) { inp.classList.remove('shake'); void inp.offsetWidth; inp.classList.add('shake'); }
      }
    });
    if (firstBad) { firstBad.focus(); return; }
    sendLead();
  });

  /* ---------- Lead → CRM webhook ---------- */
  function buildLead() {
    const d = Object.fromEntries(new FormData(form));
    const full = (d.name || '').trim().replace(/\s+/g, ' ');
    const [first_name, ...rest] = full.split(' ');
    const q = new URLSearchParams(location.search);
    const out = {
      first_name, last_name: rest.join(' '), full_name: full,
      phone: d.phone.trim(), email: (d.email || '').trim(), zip: d.zip,
      protecting: d.protect, age_range: d.age, coverage_amount: d.coverage, tobacco: d.tobacco,
      contact_method: d.contact_method, language: lang,
      source: S.LEAD_SOURCE,
      tags: ['website-lead', 'hispanic-site', `lang:${lang}`, `contact:${d.contact_method}`, `coverage:${d.coverage}`],
      page: location.href, referrer: document.referrer || '', submitted_at: new Date().toISOString(),
    };
    ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid'].forEach(k => { if (q.get(k)) out[k] = q.get(k); });
    return out;
  }
  // A plain form-encoded POST is a "simple" request: no CORS preflight, works with GHL, Zapier, Make, n8n
  function post(url, data) {
    const body = new URLSearchParams();
    Object.entries(data).forEach(([k, v]) => body.append(k, Array.isArray(v) ? v.join(',') : v));
    return fetch(url, { method: 'POST', mode: 'no-cors', keepalive: true, body });
  }
  async function sendLead() {
    if (sending) return;
    const data = buildLead();
    if (form.elements.website.value) { lead = data; renderDone(); go(TOTAL); return; } // bot honeypot
    sending = true;
    fineErr.hidden = true; fineOk.hidden = false;
    next.disabled = true; next.classList.add('loading'); nextLabel.textContent = T[lang].sending;
    try {
      if (S.LEAD_WEBHOOK_URL) await post(S.LEAD_WEBHOOK_URL, data);
      else console.warn('[sitio] LEAD_WEBHOOK_URL is empty in config.js. Lead not sent:', data);
      lead = data;
      renderDone();
      sending = false;
      go(TOTAL);
    } catch (err) {
      console.error(err);
      sending = false;
      fineErr.textContent = T[lang].sendErr; fineErr.hidden = false; fineOk.hidden = true;
      nextLabel.textContent = T[lang].retry; next.disabled = false;
    } finally { next.classList.remove('loading'); }
  }

  function renderDone() {
    if (!lead) return;
    const t = T[lang];
    $('#doneTitle').textContent = t.thanks(lead.first_name);
    $('#doneBody').textContent = t.doneBody(t.via[lead.contact_method] || t.via.call);
    const wa = $('#doneWa');
    wa.href = waLink(t.waAfter(S.AGENT_FIRST, lead.full_name));
    $('#doneWaLabel').textContent = t.waNow(S.AGENT_FIRST);
    const book = $('#doneBook');
    if (S.BOOKING_URL) {
      const u = new URL(S.BOOKING_URL, location.href);
      [['name', lead.full_name], ['first_name', lead.first_name], ['last_name', lead.last_name], ['email', lead.email], ['phone', lead.phone]]
        .forEach(([k, v]) => v && u.searchParams.set(k, v));
      book.href = u.href; book.hidden = false;
    }
  }

  /* ---------- Header glass on scroll ---------- */
  const header = $('#siteHeader');
  const onScroll = () => header.classList.toggle('scrolled', scrollY > 8);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- Reveal moments (process line, portrait, signature, sunrise) ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add('in');
    io.unobserve(e.target);
  }), { threshold: .3, rootMargin: '0px 0px -8% 0px' });
  $$('[data-reveal]').forEach(el => io.observe(el));

  /* ---------- Hero: pause ambient loops offscreen ---------- */
  const hero = $('.hero');
  new IntersectionObserver(([e]) => {
    heroVisible = e.isIntersecting;
    hero.classList.toggle('offscreen', !heroVisible);
  }).observe(hero);

  if (!reduce) {
    // the pointer acts like the sun: the vine's shadow leans away from it
    if (matchMedia('(hover: hover)').matches) {
      let raf = 0, mx = 0, my = 0;
      hero.addEventListener('pointermove', e => {
        mx = e.clientX; my = e.clientY;
        if (raf) return;
        raf = requestAnimationFrame(() => {
          raf = 0;
          hero.style.setProperty('--sx', ((mx / innerWidth - .5) * 2).toFixed(3));
          hero.style.setProperty('--sy', ((my / innerHeight - .5) * 2).toFixed(3));
        });
      }, { passive: true });
    }
    // scrolling moves the afternoon light across the wall
    let sraf = 0;
    addEventListener('scroll', () => {
      if (sraf || !heroVisible) return;
      sraf = requestAnimationFrame(() => { sraf = 0; hero.style.setProperty('--sun', Math.min(1, scrollY / innerHeight).toFixed(3)); });
    }, { passive: true });
  }

  /* ---------- Floating WhatsApp: shows once the quiz leaves the screen ---------- */
  const floatWa = $('#floatWa'), bubble = $('#bubble');
  let bubbleT = 0;
  const bubbleDismissed = () => !!store.get('waBubble', sessionStorage);
  const cta = $('.cta');
  let quizVisible = true, ctaVisible = false;
  const updateFloat = () => {
    const showIt = !quizVisible && !ctaVisible;
    floatWa.classList.toggle('show', showIt);
    if (!showIt) { bubble.classList.remove('on'); clearTimeout(bubbleT); return; }
    if (!bubbleDismissed() && !bubble.classList.contains('on')) {
      clearTimeout(bubbleT);
      // pops once per visit, then tucks itself away
      bubbleT = setTimeout(() => {
        bubble.classList.add('on');
        store.set('waBubble', 'shown', sessionStorage);
        bubbleT = setTimeout(() => bubble.classList.remove("on"), 7000);
      }, 2600);
    }
  };
  new IntersectionObserver(([e]) => { quizVisible = e.isIntersecting; updateFloat(); }, { threshold: .15 }).observe(form);
  new IntersectionObserver(([e]) => { ctaVisible = e.isIntersecting; updateFloat(); }, { threshold: .2 }).observe(cta);
  $('#bubbleX').addEventListener('click', () => {
    bubble.classList.remove('on');
    store.set('waBubble', 'x', sessionStorage);
  });

  /* ---------- Boot ---------- */
  const y = $('#year'); if (y) y.textContent = new Date().getFullYear();
  const urlLang = new URLSearchParams(location.search).get('lang');
  setLang(urlLang || store.get('lang') || 'es', false);
})();
