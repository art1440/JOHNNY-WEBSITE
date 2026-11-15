/* Verion Life — shared interactions */
(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const root = document.documentElement;

  /* ---------- Header: glass once you scroll ---------- */
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

  if (!reduce) {
    /* ambient light follows the cursor */
    addEventListener('pointermove', e => {
      root.style.setProperty('--mx', e.clientX + 'px');
      root.style.setProperty('--my', e.clientY + 'px');
      root.style.setProperty('--px', (e.clientX / innerWidth - .5) * 2);
      root.style.setProperty('--py', (e.clientY / innerHeight - .5) * 2);
    }, { passive: true });

    /* frame outline drifts against the photo while scrolling */
    const frames = [...document.querySelectorAll('.frame')];
    let ticking = false;
    const para = () => {
      frames.forEach(f => {
        const r = f.getBoundingClientRect();
        const p = (r.top + r.height / 2 - innerHeight / 2) / innerHeight; // -1..1 around center
        f.style.setProperty('--pl', (p * -28).toFixed(1) + 'px');
      });
      ticking = false;
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(para); } }, { passive: true });
    para();

    /* subtle 3D tilt on testimonial cards (mouse only) */
    if (matchMedia('(hover:hover)').matches) document.querySelectorAll('.tcard').forEach(c => {
      c.addEventListener('pointermove', e => {
        const r = c.getBoundingClientRect();
        c.style.setProperty('--ry', ((e.clientX - r.left) / r.width - .5) * 6 + 'deg');
        c.style.setProperty('--rx', ((e.clientY - r.top) / r.height - .5) * -6 + 'deg');
      });
      c.addEventListener('pointerleave', () => { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); });
    });
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
    const data = Object.fromEntries(new FormData(form));
    console.log('Lead:', data); // TODO: send to CRM / Formspree / email
    i = TOTAL; render();
  });
  back.addEventListener('click', () => { if (i > 0) { i--; render(); } });
  render();
})();
