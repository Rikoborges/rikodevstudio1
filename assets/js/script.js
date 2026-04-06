/* ══════════════════════════════════════════════
   RIKO DEV STUDIO — script.js
   Funções: toggle de idioma, contador animado,
   carrossel swipe, FAQ acordeão, formulário async
   ══════════════════════════════════════════════ */

/* ── TOGGLE PT / FR ──────────────────────────
   Muda o idioma de toda a página.
   Chamado pelos botões PT e FR no topbar.
   ─────────────────────────────────────────── */
function setLang(l) {
  const fr = l === 'fr';
  document.body.classList.toggle('fr', fr);
  document.documentElement.lang = fr ? 'fr' : 'pt';

  // botões topbar
  document.querySelectorAll('.lb').forEach((b, i) =>
    b.classList.toggle('active', fr ? i === 1 : i === 0)
  );

  // H1 único — troca innerHTML
  const h1 = document.getElementById('hero-title');
  if (h1) {
    h1.innerHTML = fr
      ? "Votre business m&eacute;rite <em>d&apos;&ecirc;tre visible.</em>"
      : "Seu neg&oacute;cio merece <em>ser visto.</em>";
  }

  // hidden input do formulário
  const formLang = document.getElementById('formLang');
  if (formLang) formLang.value = l;

  // labels do formulário
  document.querySelectorAll('label[data-pt]').forEach(el => {
    el.textContent = fr ? el.dataset.fr : el.dataset.pt;
  });

  // options do select
  document.querySelectorAll('option[data-pt]').forEach(el => {
    el.textContent = fr ? el.dataset.fr : el.dataset.pt;
  });

  // placeholder textarea
  const ta = document.getElementById('fmsg');
  if (ta) ta.placeholder = ta.dataset[fr ? 'phFr' : 'phPt'];

  // swipe hint conteúdo já muda via data-lang no HTML

  // Guarda preferência para outras páginas (privacidade.html)
  sessionStorage.setItem('lang', l);

  // GA4: track language switch
  if (typeof gtag !== 'undefined') {
    gtag('event', 'language_switch', { language: l });
  }
}


/* ── CONTADOR ANIMADO ────────────────────────
   Anima os números 97%, 75%, 2.8× quando
   a seção de impacto entra no viewport.
   ─────────────────────────────────────────── */
const counters = document.querySelectorAll('.impact-num[data-target]');

const counterObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting) return;

    const el = entry.target;
    const target = parseFloat(el.dataset.target);
    const suffix = el.dataset.suffix || '';
    const isFloat = target % 1 !== 0;
    let startTime = 0;

    const animate = timestamp => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / 1400, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      const value = target * ease;
      el.textContent = (isFloat ? value.toFixed(1) : Math.round(value)) + suffix;
      if (progress < 1) requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
    counterObserver.unobserve(el);
  });
}, { threshold: 0.4 });

counters.forEach(c => counterObserver.observe(c));


/* ── STEPPER DO PROCESSO ─────────────────────
   Navegação click/tap entre os 4 passos.
   goToStep(n) — vai direto a um passo
   stepMove(d) — avança (+1) ou recua (-1)
   ─────────────────────────────────────────── */
let currentStep = 0;
const totalSteps = 4;

function goToStep(n) {
  const steps = document.querySelectorAll('.step');
  const dots  = document.querySelectorAll('.stepper-dot');
  const fill  = document.getElementById('stepperFill');
  const prev  = document.getElementById('stepPrev');
  const next  = document.getElementById('stepNext');
  const counter = document.getElementById('stepCounter');

  if (!steps.length) return;

  // animação de saída no card actual
  const current = document.querySelector('.step.active');
  if (current && current !== steps[n]) {
    current.classList.add('exit');
    setTimeout(() => current.classList.remove('exit', 'active'), 350);
  }

  // activa o novo
  setTimeout(() => {
    steps.forEach((s, i) => s.classList.toggle('active', i === n));
    dots.forEach((d, i)  => d.classList.toggle('active', i === n));
  }, current && current !== steps[n] ? 50 : 0);

  // barra de progresso — 25% por passo
  if (fill) fill.style.width = ((n + 1) / totalSteps * 100) + '%';

  // botões anterior/próximo
  if (prev) prev.disabled = n === 0;
  if (next) next.disabled = n === totalSteps - 1;

  // contador "2 / 4"
  if (counter) counter.textContent = (n + 1) + ' / ' + totalSteps;

  currentStep = n;
}

function stepMove(direction) {
  const next = currentStep + direction;
  if (next >= 0 && next < totalSteps) goToStep(next);
}

// Swipe touch no stepper
const stepperCards = document.getElementById('stepperCards');
if (stepperCards) {
  let swipeStart = 0;
  stepperCards.addEventListener('touchstart', e => {
    swipeStart = e.touches[0].clientX;
  }, { passive: true });
  stepperCards.addEventListener('touchend', e => {
    const diff = swipeStart - e.changedTouches[0].clientX;
    if (diff > 50) stepMove(1);
    if (diff < -50) stepMove(-1);
  });
}

let currentSlide = 0;
let touchStartX = 0;

const carouselTrack = document.getElementById('carouselTrack');
const dots = document.querySelectorAll('.dot');

function goToSlide(n) {
  currentSlide = n;
  carouselTrack.style.transform = `translateX(-${n * 100}%)`;
  dots.forEach((d, i) => d.classList.toggle('active', i === n));
  // esconde hint após primeiro swipe
  if (n > 0) {
    const hint = document.getElementById('swipeHint');
    if (hint) hint.style.display = 'none';
  }
}

const carousel = document.getElementById('carousel');
if (carousel) {
  carousel.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });

  carousel.addEventListener('touchend', e => {
    const diff = touchStartX - e.changedTouches[0].clientX;
    if (diff > 50 && currentSlide < dots.length - 1) goToSlide(currentSlide + 1);
    if (diff < -50 && currentSlide > 0) goToSlide(currentSlide - 1);
  });
}


/* ── FAQ ACORDEÃO ────────────────────────────
   Abre/fecha respostas ao clicar na pergunta.
   Só uma resposta aberta de cada vez.
   ─────────────────────────────────────────── */
function toggleFaq(btn) {
  const answer = btn.nextElementSibling;
  const isOpen = btn.classList.contains('open');

  // fecha todos
  document.querySelectorAll('.faq-q.open').forEach(b => {
    b.classList.remove('open');
    b.nextElementSibling.classList.remove('open');
    b.setAttribute('aria-expanded', 'false');
    b.querySelector('.faq-icon').textContent = '+';
  });

  // se estava fechado, abre este
  if (!isOpen) {
    btn.classList.add('open');
    answer.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    btn.querySelector('.faq-icon').textContent = '−';
  }
}


/* ── FORMULÁRIO ASYNC (Formspree) ────────────
   Envia sem recarregar a página.
   Mostra mensagem de sucesso após envio.
   ─────────────────────────────────────────── */
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = e.target.querySelector('button[type=submit]');
    const original = btn.innerHTML;

    // estado de loading
    btn.innerHTML = '<span style="opacity:.7">Enviando...</span>';
    btn.disabled = true;

    try {
      const response = await fetch(e.target.action, {
        method: 'POST',
        body: new FormData(e.target),
        headers: { Accept: 'application/json' }
      });

      if (response.ok) {
        // sucesso
        e.target.style.display = 'none';
        document.getElementById('formSuccess').classList.add('show');
      } else {
        // erro do servidor
        btn.innerHTML = original;
        btn.disabled = false;
        alert('Erro ao enviar. Tente pelo WhatsApp.');
      }
    } catch {
      // erro de rede
      btn.innerHTML = original;
      btn.disabled = false;
      alert('Sem conexão. Tente pelo WhatsApp.');
    }
  });
}


/* ── COOKIES ─────────────────────────────────
   Banner aparece se não houver consentimento.
   Guarda escolha em localStorage por 12 meses.
   ─────────────────────────────────────────── */
function acceptCookies() {
  localStorage.setItem('cookie_consent', 'accepted');
  localStorage.setItem('cookie_date', Date.now());
  hideCookieBanner();
}

function declineCookies() {
  localStorage.setItem('cookie_consent', 'essential');
  localStorage.setItem('cookie_date', Date.now());
  hideCookieBanner();
}

function hideCookieBanner() {
  const banner = document.getElementById('cookieBanner');
  if (banner) banner.classList.add('hidden');
}

function checkCookieConsent() {
  const consent = localStorage.getItem('cookie_consent');
  const date    = localStorage.getItem('cookie_date');
  const expired = date && (Date.now() - date) > 365 * 24 * 60 * 60 * 1000;

  // mostra banner se não houver consentimento ou se expirou (12 meses)
  if (!consent || expired) {
    const banner = document.getElementById('cookieBanner');
    if (banner) banner.classList.remove('hidden');
  } else {
    hideCookieBanner();
  }
}

checkCookieConsent();

/* ── SCROLL TO TOP ──────────────────────────
   Aparece quando o utilizador faz scroll > 400px
   ─────────────────────────────────────────── */
const scrollTopBtn = document.getElementById('scrollTop');
if (scrollTopBtn) {
  window.addEventListener('scroll', () => {
    scrollTopBtn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });
}

/* ── TOPBAR BLUR AO SCROLL ───────────────────
   Adiciona backdrop-filter quando scrollar.
   ─────────────────────────────────────────── */
window.addEventListener('scroll', () => {
  const topbar = document.querySelector('.topbar');
  if (topbar) {
    topbar.style.backdropFilter = window.scrollY > 20 ? 'blur(12px)' : 'none';
  }
}, { passive: true });


/* ── AUTO-DETECT IDIOMA ──────────────────────
   Se o browser estiver em francês, activa FR.
   ─────────────────────────────────────────── */
if ((navigator.language || '').startsWith('fr')) {
  setLang('fr');
}

/* ── REVEAL (IntersectionObserver) ──────────
   Substitui animation-timeline:view() que
   falha silenciosamente no Android Chrome.
   ─────────────────────────────────────────── */
const revealObserver = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); revealObserver.unobserve(e.target); } });
}, { threshold: 0.1 });
document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));