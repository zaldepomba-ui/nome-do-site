/* ============================================================
   NutriIA — main.js  (ANIMAÇÕES DE ENTRADA + VÍDEO + COOKIES)
   ------------------------------------------------------------
   FILOSOFIA: movimento serve à narrativa. Scroll nativo do
   navegador + GSAP ScrollTrigger só para os reveals.

   O QUE TEM AQUI:
     1. Barra de progresso de scroll (topo)
     2. HERO: título revelado palavra a palavra + reveals de entrada
     3. CARDS: cascata 3D (rotationX + stagger)
     4. REVEALS gerais (.reveal soltos)
     5. CHAT (Como funciona): balões aparecem um a um (cascata)
     6. OFERTA: contador 0->20 quando entra na tela
     7. CTA flutuante
     8. VÍDEO: overlay com ícone de play (some ao dar play)
     9. COOKIES (LGPD) + rastreadores (só com consentimento)

   SEGURANÇA:
     - prefers-reduced-motion -> desliga as animações, conteúdo 100% visível
     - sem GSAP -> nada some (anti-tela-branca)
     - fromTo garante estado final
     - o bloco de vídeo/cookies roda SEMPRE (fora do if do GSAP),
       então funciona mesmo sem animação.
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';

  /* =========================================================
     BLOCO DE ANIMAÇÕES — só liga com GSAP e sem reduceMotion
     ========================================================= */
  if (hasGSAP && !reduceMotion) {

    document.documentElement.classList.add('js-anim');
    gsap.registerPlugin(ScrollTrigger);

    /* -------------------------------------------------------
       1. BARRA DE PROGRESSO DE SCROLL (topo)
       ------------------------------------------------------- */
    const bar = document.getElementById('scroll-progress');
    if (bar) {
      gsap.to(bar, {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: { trigger: document.body, start: 'top top', end: 'bottom bottom', scrub: 0.3 },
      });
    }

    /* -------------------------------------------------------
       2. HERO — título palavra a palavra + reveals de entrada
       ------------------------------------------------------- */
    const hero = document.querySelector('.hero');

    const heroBg = document.querySelector('.hero__bg');
    if (heroBg) {
      gsap.to(heroBg, {
        yPercent: 22, scale: 1.12, ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
      });
    }
    const heroInner = document.querySelector('.hero__inner');
    if (heroInner) {
      gsap.to(heroInner, {
        yPercent: -18, opacity: 0.35, ease: 'none',
        scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
      });
    }

    // título do hero: quebra em palavras e revela uma a uma (mask reveal)
    const heroTitle = document.querySelector('.hero__title');
    if (heroTitle && !heroTitle.dataset.split) {
      heroTitle.dataset.split = '1';
      const wrapWords = (node) => {
        node.childNodes.forEach((child) => {
          if (child.nodeType === Node.TEXT_NODE) {
            const frag = document.createDocumentFragment();
            child.textContent.split(/(\s+)/).forEach((part) => {
              if (part.trim() === '') { frag.appendChild(document.createTextNode(part)); return; }
              const outer = document.createElement('span'); outer.className = 'word';
              const inner = document.createElement('span'); inner.className = 'word__in';
              inner.textContent = part; outer.appendChild(inner); frag.appendChild(outer);
            });
            node.replaceChild(frag, child);
          } else if (child.nodeType === Node.ELEMENT_NODE && child.tagName !== 'BR') {
            wrapWords(child);
          }
        });
      };
      wrapWords(heroTitle);

      gsap.fromTo(heroTitle.querySelectorAll('.word__in'),
        { yPercent: 115, opacity: 0 },
        { yPercent: 0, opacity: 1, duration: 0.9, ease: 'power4.out', stagger: 0.06, delay: 0.15 }
      );
    }

    const heroReveals = hero ? hero.querySelectorAll('.reveal:not(.hero__title)') : [];
    if (heroReveals.length) {
      gsap.fromTo(heroReveals,
        { opacity: 0, y: 30 },
        { opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.12, delay: 0.45 }
      );
    }

    /* -------------------------------------------------------
       3. CARDS — cascata 3D (rotationX + stagger)
       ------------------------------------------------------- */
    const staggeredEls = new Set();
    document.querySelectorAll('[data-stagger]').forEach((group) => {
      const items = group.querySelectorAll('.reveal');
      items.forEach((el) => staggeredEls.add(el));

      gsap.fromTo(items,
        { opacity: 0, y: 70, rotationX: -22, transformOrigin: '50% 100%' },
        {
          opacity: 1, y: 0, rotationX: 0,
          duration: 1, ease: 'power3.out', stagger: 0.16,
          scrollTrigger: { trigger: group, start: 'top 80%', end: 'bottom 18%', toggleActions: 'play reverse play reverse' },
        }
      );
    });

    /* -------------------------------------------------------
       4. REVEALS GERAIS (.reveal soltos)
       ------------------------------------------------------- */
    const fromByType = (type) => {
      const v = { opacity: 0 };
      if (type === 'up')    v.y = 56;
      if (type === 'down')  v.y = -28;
      if (type === 'scale') { v.scale = 0.9; v.y = 30; }
      return v;
    };
    const eases = { up: 'power3.out', down: 'power2.out', scale: 'back.out(1.2)' };

    document.querySelectorAll('.reveal').forEach((el) => {
      if (staggeredEls.has(el)) return;
      if (hero && hero.contains(el)) return;

      const type = el.dataset.anim || 'up';
      gsap.fromTo(el, fromByType(type),
        {
          opacity: 1, y: 0, scale: 1,
          duration: 1, ease: eases[type] || 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 85%', end: 'bottom 15%', toggleActions: 'play reverse play reverse' },
        }
      );
    });

    /* -------------------------------------------------------
       5. CHAT (Como funciona) — balões em cascata
       ------------------------------------------------------- */
    const chat = document.querySelector('[data-chat]');
    if (chat) {
      const msgs = chat.querySelectorAll('[data-msg]');
      const typing = chat.querySelector('[data-typing]');

      const tl = gsap.timeline({
        scrollTrigger: { trigger: chat, start: 'top 75%', toggleActions: 'play none none reset' },
      });

      // cada balão sobe e aparece, um depois do outro
      tl.fromTo(msgs,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.5 }
      );

      // o "digitando" aparece depois do último balão
      if (typing) {
        tl.to(typing, { opacity: 1, duration: 0.4, ease: 'power2.out' }, '+=0.1');
      }
    }

    /* -------------------------------------------------------
       6. OFERTA — contador 0 -> N quando entra na tela
       ------------------------------------------------------- */
    document.querySelectorAll('[data-count]').forEach((el) => {
      const target = parseInt(el.dataset.count, 10) || 0;
      const obj = { v: 0 };
      gsap.to(obj, {
        v: target, duration: 1.4, ease: 'power2.out',
        onUpdate: () => { el.textContent = Math.round(obj.v); },
        scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none reset' },
      });
    });

    // refresh quando muda a altura -> trigger não desalinha
    window.addEventListener('load', () => ScrollTrigger.refresh());
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => ScrollTrigger.refresh());
    let rt;
    window.addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => ScrollTrigger.refresh(), 200); });
  }
  // Sem GSAP ou reduceMotion: não marca .js-anim -> tudo já visível.

  /* =========================================================
     7. CTA FLUTUANTE — aparece depois do hero
     ========================================================= */
  const floatCta = document.querySelector('.float-cta');
  const heroEl = document.querySelector('.hero');
  if (floatCta && heroEl && 'IntersectionObserver' in window) {
    const obs = new IntersectionObserver(([entry]) => {
      floatCta.classList.toggle('is-visible', !entry.isIntersecting);
    }, { threshold: 0.1 });
    obs.observe(heroEl);
  }

  /* =========================================================
     8. VÍDEO — overlay com ícone de play
     (movido do <script> que estava solto no HTML)
     Some ao dar play, volta ao pausar. Protegido contra
     ausência dos elementos.
     ========================================================= */
  const video = document.getElementById('mainVideo');
  const overlay = document.getElementById('videoOverlay');
  const pauseIcon = document.getElementById('pauseIcon');

  if (video && overlay && pauseIcon) {
    const showOverlay = () => {
      overlay.style.opacity = '1';
      pauseIcon.style.opacity = '1';
    };
    const hideOverlay = () => {
      overlay.style.opacity = '0';
      pauseIcon.style.opacity = '0';
    };

    video.addEventListener('play', hideOverlay);
    video.addEventListener('pause', showOverlay);

    // estado inicial: overlay visível
    showOverlay();
  }

  /* =========================================================
     9. COOKIES (LGPD) — mostra se ainda não escolheu
     ========================================================= */
  const cookies = document.getElementById('cookies');
  const cookiesOk = document.getElementById('cookies-ok');
  const cookiesNo = document.getElementById('cookies-no');
  const cookiesMore = document.getElementById('cookies-more');
  const cookiesDetails = document.getElementById('cookies-details');

  const hideCookiesBanner = () => { if (cookies) cookies.hidden = true; };
  const saveCookieChoice = (value) => {
    try { localStorage.setItem('cookie-ok', value); } catch (_) {}
  };

  /* ----------------------------------------------------------
     RASTREADORES (Pixel do Meta / Google Analytics)
     Só dispara quando o usuário ACEITA (ou já tinha aceitado).
     Quem recusa nunca dispara nada. trackersLoaded trava
     disparo duplo.
     ---------------------------------------------------------- */
  let trackersLoaded = false;
  function loadTrackers() {
    if (trackersLoaded) return;
    trackersLoaded = true;

    /* 👇 COLE AQUI O PIXEL DO META 👇
       Troque SEU_PIXEL_ID pelo número do seu Pixel
       (Gerenciador de Eventos do Meta). */
    !function(f,b,e,v,n,t,s){
      if(f.fbq)return; n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n; n.push=n; n.loaded=!0; n.version='2.0';
      n.queue=[]; t=b.createElement(e); t.async=!0;
      t.src=v; s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)
    }(window, document,'script','https://connect.facebook.net/en_US/fbevents.js');

    fbq('init', 'SEU_PIXEL_ID');   // 👈 troca pelo seu número
    fbq('track', 'PageView');

    /* 👇 (OPCIONAL) GOOGLE ANALYTICS (GA4) 👇
       Descomente e troque G-XXXXXXX se for usar. */
    // var ga = document.createElement('script'); ga.async = true;
    // ga.src = 'https://www.googletagmanager.com/gtag/js?id=G-XXXXXXX';
    // document.head.appendChild(ga);
    // window.dataLayer = window.dataLayer || [];
    // function gtag(){ dataLayer.push(arguments); }
    // gtag('js', new Date()); gtag('config', 'G-XXXXXXX');
  }

  let aceito = false;
  let jaAceitou = false;
  try {
    const stored = localStorage.getItem('cookie-ok');
    aceito = stored === '1' || stored === '0';
    jaAceitou = stored === '1';
  } catch (_) {}

  if (jaAceitou) loadTrackers();
  if (cookies && !aceito) cookies.hidden = false;

  if (cookiesMore && cookiesDetails) {
    cookiesMore.addEventListener('click', () => {
      const isExpanded = cookiesMore.getAttribute('aria-expanded') === 'true';
      cookiesMore.setAttribute('aria-expanded', String(!isExpanded));
      cookiesDetails.hidden = isExpanded;
    });
  }

  if (cookiesOk) {
    cookiesOk.addEventListener('click', () => {
      hideCookiesBanner();
      saveCookieChoice('1');
      loadTrackers();
    });
  }

  if (cookiesNo) {
    cookiesNo.addEventListener('click', () => {
      hideCookiesBanner();
      saveCookieChoice('0');
      // recusou → não dispara rastreador (LGPD).
    });
  }

});