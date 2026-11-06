/* ==========================================================================
   Mieux Vivre Au Quotidien — site statique autonome (aucun back-end)
   GSAP + ScrollTrigger + Lenis (fichiers locaux, voir assets/js)
   Réservation = message pré-rempli (SMS / WhatsApp / e-mail) + fichier .ics.
   ========================================================================== */
(function () {
  'use strict';

  if (!window.gsap || !window.ScrollTrigger) { return; } // le « failsafe » du <head> rendra tout visible
  gsap.registerPlugin(ScrollTrigger);
  gsap.config({ autoRound: false }); // sinon les anneaux (stroke-dashoffset 0→1) sautent d’un entier à l’autre

  /* ---------- Constantes de contact (à modifier ici si besoin) ---------- */
  var PHONE = '+33659621984';
  var PHONE_DISPLAY = '06 59 62 19 84';
  var WA_NUMBER = '33659621984';
  var MAIL = 'yoga.mvaq@gmail.com';
  var GOOGLE_PLACE = 'https://www.google.com/maps/place/Mieux+Vivre+au+Quotidien+-+Yoga/@44.0836701,6.2128403,17z/data=!4m6!3m5!1s0x12cb9b97e0455e5b:0xee8a5ec7f16db4ea!8m2!3d44.0836701!4d6.2128403!16s%2Fg%2F11lth6ly69';

  /* ---------- Helpers ---------- */
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var root = document.documentElement;
  var pad = function (n) { return (n < 10 ? '0' : '') + n; };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (reduce) { root.classList.add('reduce'); }
  if (fine && !reduce) { root.classList.add('has-cursor'); }

  /* ---------- Fractionnement du texte (mots / lettres) ---------- */
  function splitNode(node, mode, bucket) {
    var frag = document.createDocumentFragment();
    Array.prototype.forEach.call(node.childNodes, function (ch) {
      if (ch.nodeType === 3) {
        ch.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) { return; }
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
          if (/^[,.;:!?…»”)\]]+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          var w = document.createElement('span');
          w.className = 'w';
          if (mode === 'chars') {
            w.setAttribute('aria-hidden', 'true');
            Array.from(part).forEach(function (chr) {
              var c = document.createElement('span');
              c.className = 'c'; c.textContent = chr; w.appendChild(c); bucket.push(c);
            });
          } else {
            var c = document.createElement('span');
            c.className = 'c'; c.textContent = part; w.appendChild(c); bucket.push(c);
          }
          frag.appendChild(w);
        });
      } else if (ch.nodeType === 1) {
        if (ch.tagName === 'BR') { frag.appendChild(ch.cloneNode(false)); }
        else {
          var clone = ch.cloneNode(false);
          clone.appendChild(splitNode(ch, mode, bucket));
          frag.appendChild(clone);
        }
      }
    });
    return frag;
  }
  function split(el, mode) {
    if (el.classList.contains('is-split')) { return $$('.c', el); }
    var label = el.textContent.replace(/\s+/g, ' ').trim();
    var bucket = [];
    var frag = splitNode(el, mode, bucket);
    el.textContent = '';
    el.appendChild(frag);
    if (mode === 'chars' && !el.hasAttribute('aria-label') && !el.closest('[aria-hidden="true"]') && !el.closest('[aria-label]')) { el.setAttribute('aria-label', label); }
    el.classList.add('is-split');
    return bucket;
  }

  /* ---------- Smooth scroll (Lenis) ---------- */
  var lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({
      duration: 1.15,
      easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      smoothWheel: true
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    $$('.choices, .recap').forEach(function (e) { e.setAttribute('data-lenis-prevent', ''); });
  }
  ScrollTrigger.config({ ignoreMobileResize: true });

  function scrollToEl(target) {
    if (lenis) { lenis.scrollTo(target, { duration: 1.6, easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); } }); }
    else { target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' }); }
  }

  /* ---------- Menu mobile ---------- */
  var nav = $('#nav'), burger = $('#burger'), menu = $('#menu'), menuOpen = false;
  function openMenu() {
    if (menuOpen) { return; }
    menuOpen = true;
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Fermer le menu');
    menu.setAttribute('aria-hidden', 'false');
    menu.style.visibility = 'visible';
    nav.classList.remove('nav--hide');
    if (lenis) { lenis.stop(); } else { document.body.style.overflow = 'hidden'; }
    gsap.to(menu, { clipPath: 'circle(150% at calc(100% - 46px) 42px)', duration: reduce ? 0.01 : 1, ease: 'expo.inOut' });
    gsap.fromTo('.menu__in > a, .menu__foot', { yPercent: 100, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: 0.06, duration: reduce ? 0.01 : 1, ease: 'expo.out', delay: reduce ? 0 : 0.35 });
  }
  function closeMenu() {
    if (!menuOpen) { return; }
    menuOpen = false;
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Ouvrir le menu');
    gsap.to(menu, { clipPath: 'circle(0% at calc(100% - 46px) 42px)', duration: reduce ? 0.01 : 0.8, ease: 'expo.inOut', onComplete: function () { menu.style.visibility = 'hidden'; menu.setAttribute('aria-hidden', 'true'); } });
    if (lenis) { lenis.start(); } else { document.body.style.overflow = ''; }
  }
  burger.addEventListener('click', function () { menuOpen ? closeMenu() : openMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeMenu(); } });

  /* ---------- Liens d’ancre ---------- */
  document.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a) { return; }
    var id = a.getAttribute('href');
    if (id.length < 2) { return; }
    var t = document.querySelector(id);
    if (!t) { return; }
    e.preventDefault();
    closeMenu();
    scrollToEl(t);
    if (history.replaceState) { history.replaceState(null, '', id); }
  });

  /* ---------- Préchargeur : une respiration puis iris circulaire ---------- */
  var loader = $('#loader');
  var heroChars = [];
  var introPlayed = false;

  function prepHero() {
    $$('[data-split-chars]').forEach(function (el) {
      var chars = split(el, 'chars');
      if (el.closest('.hero')) { heroChars = heroChars.concat(chars); }
    });
    if (!reduce) { gsap.set(heroChars, { yPercent: 112 }); }
  }

  function heroIntro() {
    if (introPlayed) { return; }
    introPlayed = true;
    if (reduce) { return; }
    var tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.fromTo('.hero__video', { scale: 1.3 }, { scale: 1, duration: 2.6 }, 0)
      .to(heroChars, { yPercent: 0, duration: 1.6, stagger: { each: 0.03 } }, 0.15)
      .from('.hero__eyebrow', { y: 24, opacity: 0, duration: 1.1 }, 0.35)
      .from('.hero__lead', { y: 34, opacity: 0, duration: 1.3 }, 0.7)
      .from('.hero__cta .btn', { y: 34, opacity: 0, stagger: 0.12, duration: 1.3 }, 0.85)
      .from('#nextChip', { scale: 0.85, y: 16, opacity: 0, duration: 1.2 }, 1.1)
      .from('.nav', { yPercent: -100, duration: 1.3, clearProps: 'transform' }, 0.6)
      .from('[data-hero-sprig]', { yPercent: 40, opacity: 0, stagger: 0.15, duration: 2.2 }, 0.2)
      .from('[data-hero-rings]', { scale: 0.55, opacity: 0, duration: 2.6 }, 0);
  }

  function runLoader() {
    return new Promise(function (resolve) {
      if (reduce || !loader) { if (loader) { loader.style.display = 'none'; } heroIntro(); resolve(); return; }
      if (lenis) { lenis.stop(); } else { document.body.style.overflow = 'hidden'; }
      var fg = $('.loader__ring-fg'), breath = $('.loader__breath'), mark = $('.loader__mark'),
          wIn = $('.loader__word-in'), wOut = $('.loader__word-out'), pct = $('#loaderPct'), core = $('.loader__core');
      var prog = { v: 0 };
      gsap.set(wOut, { yPercent: 110 });
      var minDone = new Promise(function (r) {
        var tl = gsap.timeline({ onComplete: r });
        tl.to(mark, { opacity: 1, scale: 1, duration: 0.9, ease: 'expo.out' }, 0)
          .to(breath, { scale: 1.05, duration: 1.1, ease: 'sine.inOut' }, 0)
          .to(breath, { scale: 0.8, duration: 1.1, ease: 'sine.inOut' }, 1.1)
          .to(prog, { v: 100, duration: 2.1, ease: 'power2.inOut', onUpdate: function () { pct.textContent = Math.round(prog.v); fg.style.strokeDashoffset = 1 - prog.v / 100; } }, 0)
          .to(wIn, { yPercent: -110, duration: 0.6, ease: 'power3.inOut' }, 1.05)
          .to(wOut, { yPercent: 0, duration: 0.6, ease: 'power3.inOut' }, 1.05);
      });
      var loaded = new Promise(function (r) {
        if (document.readyState === 'complete') { r(); } else { window.addEventListener('load', r, { once: true }); setTimeout(r, 3200); }
      });
      Promise.all([minDone, loaded]).then(function () {
        var maxR = Math.ceil(Math.hypot(window.innerWidth, window.innerHeight) / 2) + 80;
        var out = gsap.timeline({ onComplete: function () { loader.style.display = 'none'; if (lenis) { lenis.start(); } else { document.body.style.overflow = ''; } ScrollTrigger.refresh(); resolve(); } });
        out.to(core, { scale: 0.7, opacity: 0, duration: 0.7, ease: 'power3.in' }, 0)
           .to(loader, { '--r': maxR + 'px', duration: 1.5, ease: 'power3.inOut' }, 0.35)
           .add(heroIntro, 0.55);
      });
    });
  }

  /* ---------- Barre de progression + navigation + barre mobile ---------- */
  var bar = $('#progressBar');
  if (!reduce) { gsap.to(bar, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.2 } }); }
  else { window.addEventListener('scroll', function () { var m = document.documentElement.scrollHeight - innerHeight; bar.style.transform = 'scaleX(' + (m > 0 ? scrollY / m : 0) + ')'; }, { passive: true }); }

  var lastY = 0, fab = $('#fab'), reserverSec = $('#reserver'), reserverVisible = false;
  function onScroll() {
    var y = window.scrollY;
    nav.classList.toggle('nav--solid', y > 40);
    if (!menuOpen) {
      if (y > lastY + 4 && y > 240) { nav.classList.add('nav--hide'); }
      else if (y < lastY - 4 || y < 120) { nav.classList.remove('nav--hide'); }
    }
    lastY = y;
    fab.classList.toggle('is-on', y > window.innerHeight * 0.75 && !reserverVisible);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (en) { reserverVisible = en[0].isIntersecting; onScroll(); }, { threshold: 0.25 }).observe(reserverSec);
  }

  /* ---------- Curseur cercle ---------- */
  if (fine && !reduce) {
    var cur = $('#cursor'), curLabel = $('.cursor__label', cur);
    gsap.set(cur, { opacity: 0 });
    var cx = gsap.quickTo(cur, 'x', { duration: 0.4, ease: 'power3' });
    var cy = gsap.quickTo(cur, 'y', { duration: 0.4, ease: 'power3' });
    var shown = false;
    window.addEventListener('pointermove', function (e) {
      if (!shown) { shown = true; gsap.set(cur, { x: e.clientX, y: e.clientY }); gsap.to(cur, { opacity: 1, duration: 0.4 }); }
      cx(e.clientX); cy(e.clientY);
    }, { passive: true });
    document.addEventListener('pointerover', function (e) {
      var view = e.target.closest('[data-lb]');
      var link = e.target.closest('a, button, [role="tab"], label.choice, [data-cursor]');
      cur.classList.toggle('is-view', !!view);
      cur.classList.toggle('is-link', !!link && !view);
      curLabel.textContent = view ? 'Voir' : '';
    });
    document.addEventListener('pointerleave', function () { gsap.to(cur, { opacity: 0, duration: 0.3 }); });
    document.addEventListener('pointerenter', function () { if (shown) { gsap.to(cur, { opacity: 1, duration: 0.3 }); } });
  }

  /* ---------- Boutons magnétiques ---------- */
  if (fine && !reduce) {
    $$('.magnetic').forEach(function (el) {
      var xTo = gsap.quickTo(el, 'x', { duration: 0.9, ease: 'elastic.out(1, 0.55)' });
      var yTo = gsap.quickTo(el, 'y', { duration: 0.9, ease: 'elastic.out(1, 0.55)' });
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        xTo((e.clientX - (r.left + r.width / 2)) * 0.3);
        yTo((e.clientY - (r.top + r.height / 2)) * 0.38);
      });
      el.addEventListener('pointerleave', function () { xTo(0); yTo(0); });
    });
  }

  /* ---------- Cartes en inclinaison 3D + reflet ---------- */
  if (fine && !reduce) {
    $$('[data-tilt], .tilt').forEach(function (el) {
      var glare = $('.card__glare', el);
      gsap.set(el, { transformPerspective: 900 });
      var rx = gsap.quickTo(el, 'rotationX', { duration: 0.7, ease: 'power3' });
      var ry = gsap.quickTo(el, 'rotationY', { duration: 0.7, ease: 'power3' });
      var gx = glare ? gsap.quickTo(glare, 'x', { duration: 0.5, ease: 'power3' }) : null;
      var gy = glare ? gsap.quickTo(glare, 'y', { duration: 0.5, ease: 'power3' }) : null;
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        ry((px - 0.5) * 11); rx(-(py - 0.5) * 11);
        if (glare) { gx(px * r.width - r.width * 0.75); gy(py * r.height - r.width * 0.75); }
      });
      el.addEventListener('pointerleave', function () { rx(0); ry(0); });
    });
  }

  /* ---------- Textes animés ---------- */
  prepHero();
  $$('[data-split-words]').forEach(function (el) {
    var words = split(el, 'words');
    if (el.classList.contains('manifest__txt')) {
      if (reduce) { return; }
      gsap.set(words, { opacity: 0.14 });
      gsap.to(words, { opacity: 1, ease: 'none', stagger: 0.12, scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 48%', scrub: true } });
    } else if (!reduce) {
      gsap.set(words, { yPercent: 118 });
      gsap.to(words, { yPercent: 0, duration: 1.4, ease: 'expo.out', stagger: 0.05, scrollTrigger: { trigger: el, start: 'top 86%', once: true } });
    }
  });
  $$('.footer__giant [data-split-chars]').forEach(function (el) {
    var ch = $$('.c', el);
    if (reduce) { return; }
    gsap.set(ch, { yPercent: 105 });
    gsap.to(ch, { yPercent: 0, duration: 1.5, ease: 'expo.out', stagger: 0.05, scrollTrigger: { trigger: '.footer__giant', start: 'top 96%', once: true } });
  });

  /* Apparitions par lots */
  if (!reduce) {
    var revealSel = '.eyebrow, .sec__sub, .breathe__p, .reserver__lead, .facts li, .direct, .person, .day, .acc__item, .concert, .outdoor, .map, .infos__card, .footer__grid > *, .week__legend, .gal__credit, .breathe .btn';
    var revealEls = $$(revealSel).filter(function (el) { return !el.closest('.hero') && !el.closest('.cours__head') && !el.closest('.story__left'); });
    revealEls.forEach(function (el) { el.setAttribute('data-reveal', ''); });
    ScrollTrigger.batch(revealEls, {
      start: 'top 90%', once: true,
      onEnter: function (batch) { gsap.to(batch, { opacity: 1, y: 0, duration: 1.3, ease: 'expo.out', stagger: 0.09, overwrite: true }); }
    });
  }

  /* ---------- Parallax, pin, défilement horizontal (gsap.matchMedia) ---------- */
  var mm = gsap.matchMedia();

  mm.add('(prefers-reduced-motion: no-preference)', function () {
    /* Hero : parallax multicouche au scroll */
    var tl = gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    tl.to('[data-hero-media]', { yPercent: 16, scale: 1.14, ease: 'none' }, 0)
      .to('[data-hero-rings]', { yPercent: -12, scale: 1.2, rotation: 14, ease: 'none' }, 0)
      .to('.hero__sprig--l', { yPercent: -30, ease: 'none' }, 0)
      .to('.hero__sprig--r', { yPercent: -46, ease: 'none' }, 0)
      .to('.hero__content', { yPercent: -10, opacity: 0.25, ease: 'none' }, 0);

    /* Images qui bougent dans leur cadre */
    $$('[data-parallax-img]').forEach(function (img) {
      gsap.fromTo(img, { yPercent: -7 }, { yPercent: 7, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    /* Révélations d’images par masque circulaire */
    $$('.gal__fig, .concert__poster, .outdoor__img').forEach(function (fig) {
      gsap.fromTo(fig, { clipPath: 'circle(0% at 50% 50%)' }, {
        clipPath: 'circle(80% at 50% 50%)', duration: 1.8, ease: 'expo.out',
        scrollTrigger: { trigger: fig, start: 'top 92%', once: true },
        onComplete: function () { gsap.set(fig, { clearProps: 'clipPath' }); }
      });
    });
  });

  /* Souris : léger mouvement des couches du hero */
  if (fine && !reduce) {
    var heroEl = $('.hero');
    var q = function (sel, prop, d) { return gsap.quickTo(sel, prop, { duration: d, ease: 'power3' }); };
    var rX = q('[data-hero-rings]', 'x', 1.4), rY = q('[data-hero-rings]', 'y', 1.4);
    var sX = q('.hero__sprig--l', 'x', 1.1), sX2 = q('.hero__sprig--r', 'x', 1.1);
    heroEl.addEventListener('pointermove', function (e) {
      var nx = e.clientX / window.innerWidth - 0.5, ny = e.clientY / window.innerHeight - 0.5;
      rX(nx * -50); rY(ny * -34); sX(nx * 46); sX2(nx * 70);
    });
  }

  /* Poses initiales des sprigs (rotation gérée par GSAP) */
  gsap.set('.hero__sprig--l', { rotation: -8, transformOrigin: '50% 100%' });
  gsap.set('.hero__sprig--r', { rotation: 9, scaleX: -1, transformOrigin: '50% 100%' });

  /* Section pinnée : le déroulé d’une séance */
  mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', function () {
    var steps = $$('.story__step'), imgs = $$('.story__img'), fg = $('.story__ring-fg'), count = $('#storyCount');
    var N = steps.length;
    gsap.set(steps, { autoAlpha: 0 });
    gsap.set(steps[0], { autoAlpha: 1, y: 0 });
    gsap.set(imgs, { autoAlpha: 0, scale: 1.2 });
    gsap.set(imgs[0], { autoAlpha: 1, scale: 1 });
    var tl = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: '.story__pin', start: 'top top', end: '+=' + (N * 95) + '%', pin: true, scrub: 0.7, anticipatePin: 1,
        onUpdate: function () {
          var idx = Math.min(N - 1, Math.max(0, Math.floor(tl.time() + 0.05)));
          var label = pad(idx + 1);
          if (count.textContent !== label) { count.textContent = label; }
        }
      }
    });
    tl.to(fg, { strokeDashoffset: 0, duration: N - 1 + 0.65 }, 0);
    for (var i = 1; i < N; i++) {
      (function (i) {
        var at = i - 0.35;
        tl.to(steps[i - 1], { autoAlpha: 0, y: -50, duration: 0.3, ease: 'power2.in' }, at)
          .to(imgs[i - 1], { autoAlpha: 0, scale: 0.88, duration: 0.35, ease: 'power2.in' }, at)
          .fromTo(steps[i], { autoAlpha: 0, y: 50 }, { autoAlpha: 1, y: 0, duration: 0.35, ease: 'power2.out' }, at + 0.3)
          .fromTo(imgs[i], { autoAlpha: 0, scale: 1.22 }, { autoAlpha: 1, scale: 1, duration: 0.45, ease: 'power2.out' }, at + 0.3);
      })(i);
    }
    tl.to({}, { duration: 0.65 }, N - 1);
  });

  /* Section à défilement horizontal piloté par le scroll vertical */
  mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', function () {
    var track = $('.cours__track'), pin = $('.cours__pin');
    var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth); };
    var mages = $$('.card__media img');
    gsap.set(mages, { scale: 1.2 });
    var h = gsap.to(track, {
      x: function () { return -dist(); }, ease: 'none',
      scrollTrigger: { trigger: pin, start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: 0.8, invalidateOnRefresh: true, anticipatePin: 1 }
    });
    mages.forEach(function (img) {
      gsap.fromTo(img, { xPercent: -6 }, { xPercent: 6, ease: 'none', scrollTrigger: { trigger: img.closest('.card'), containerAnimation: h, start: 'left right', end: 'right left', scrub: true } });
    });
  });

  /* Galerie : colonnes à vitesses différentes */
  mm.add('(min-width: 900px) and (prefers-reduced-motion: no-preference)', function () {
    $$('.gal__col').forEach(function (col) {
      gsap.to(col, { yPercent: parseFloat(col.dataset.speed || '0'), ease: 'none', scrollTrigger: { trigger: '.gal', start: 'top bottom', end: 'bottom top', scrub: true } });
    });
  });

  /* ---------- Marquee réactif au scroll ---------- */
  (function () {
    var rows = $$('.marquee__row');
    var items = rows.map(function (row) {
      var track = $('.marquee__track', row);
      var html = track.innerHTML;
      track.innerHTML = html + html;
      return { track: track, dir: parseFloat(row.dataset.dir) || -1, x: 0, w: 0 };
    });
    var measure = function () { items.forEach(function (it) { it.w = it.track.scrollWidth / 2; }); };
    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('load', measure);
    if (document.fonts && document.fonts.ready) { document.fonts.ready.then(measure); }
    if (reduce) { return; }
    var last = window.scrollY, smooth = 0, sign = 1;
    gsap.ticker.add(function (time, dt) {
      var y = window.scrollY, v = y - last; last = y;
      smooth += (v - smooth) * 0.12;
      if (Math.abs(smooth) > 0.8) { sign = smooth > 0 ? 1 : -1; }
      var boost = 1 + Math.min(Math.abs(smooth) * 0.45, 9);
      items.forEach(function (it) {
        if (!it.w) { return; }
        it.x += it.dir * sign * 0.06 * dt * boost;
        if (it.x <= -it.w) { it.x += it.w; }
        if (it.x >= 0) { it.x -= it.w; }
        it.track.style.transform = 'translate3d(' + it.x + 'px,0,0)';
      });
    });
  })();

  /* ---------- Chiffres animés ---------- */
  $$('.stat').forEach(function (stat) {
    var n = $('.counter', stat), to = parseFloat(n.dataset.to), fg = $('.fg', stat), ratio = parseFloat(fg.dataset.ratio);
    if (reduce) { n.textContent = to; fg.style.strokeDashoffset = 1 - ratio; return; }
    var o = { v: 0 };
    ScrollTrigger.create({
      trigger: stat, start: 'top 88%', once: true,
      onEnter: function () {
        gsap.to(o, { v: to, duration: 2.4, ease: 'power3.out', onUpdate: function () { n.textContent = Math.round(o.v); } });
        gsap.to(fg, { strokeDashoffset: 1 - ratio, duration: 2.6, ease: 'expo.out' });
      }
    });
  });

  /* ---------- Pause respiration (1 minute) ---------- */
  (function () {
    var btn = $('#breatheBtn'), circle = $('#breatheCircle'), word = $('#breatheWord'), halo = $('.breathe__halo'), time = $('#breatheTime');
    var tl = null, timer = null, remain = 60;
    var label = btn.querySelector('span');
    function fmt(s) { return Math.floor(s / 60) + ':' + pad(s % 60); }
    function rest(msg) {
      if (tl) { tl.kill(); tl = null; }
      clearInterval(timer);
      btn.setAttribute('aria-pressed', 'false');
      label.textContent = 'Recommencer';
      gsap.to(circle, { scale: 0.7, duration: 1.4, ease: 'power3.out' });
      gsap.to(halo, { scale: 0.7, opacity: 0.7, duration: 1.4, ease: 'power3.out' });
      word.textContent = msg || 'Prêt·e ?';
      remain = 60; time.textContent = fmt(remain);
    }
    function start() {
      btn.setAttribute('aria-pressed', 'true');
      label.textContent = 'Arrêter';
      remain = 60; time.textContent = fmt(remain);
      tl = gsap.timeline({ repeat: -1 });
      tl.add(function () { word.textContent = 'Inspirez'; })
        .to(circle, { scale: 1.2, duration: 4, ease: 'sine.inOut' })
        .to(halo, { scale: 1.3, opacity: 1, duration: 4, ease: 'sine.inOut' }, '<')
        .add(function () { word.textContent = 'Retenez'; })
        .to({}, { duration: 1.5 })
        .add(function () { word.textContent = 'Expirez'; })
        .to(circle, { scale: 0.7, duration: 6, ease: 'sine.inOut' })
        .to(halo, { scale: 0.7, opacity: 0.7, duration: 6, ease: 'sine.inOut' }, '<');
      timer = setInterval(function () {
        remain -= 1; time.textContent = fmt(Math.max(0, remain));
        if (remain <= 0) { rest('Merci. Revenez quand vous voulez.'); }
      }, 1000);
    }
    gsap.set(circle, { scale: 0.7 });
    gsap.set(halo, { scale: 0.7 });
    btn.addEventListener('click', function () { btn.getAttribute('aria-pressed') === 'true' ? rest() : start(); });
  })();

  /* ---------- FAQ accordéon ---------- */
  function accToggle(btn, open) {
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    btn.setAttribute('aria-expanded', String(open));
    if (open) {
      panel.hidden = false;
      gsap.fromTo(panel, { height: 0 }, { height: 'auto', duration: reduce ? 0.01 : 0.7, ease: 'expo.out', onComplete: function () { panel.style.height = 'auto'; ScrollTrigger.refresh(); } });
    } else {
      gsap.to(panel, { height: 0, duration: reduce ? 0.01 : 0.5, ease: 'expo.inOut', onComplete: function () { panel.hidden = true; ScrollTrigger.refresh(); } });
    }
  }
  $$('.acc__btn').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      $$('.acc__btn[aria-expanded="true"]').forEach(function (b) { if (b !== btn) { accToggle(b, false); } });
      accToggle(btn, !open);
    });
  });

  /* ---------- Cartes : onglets + iframe Google Maps ---------- */
  (function () {
    var enc = encodeURIComponent;
    var MAPS = {
      rene: { q: 'Centre Culturel René Char, 45 avenue du 8 Mai 1945, Digne-les-Bains', t: 'Centre culturel René Char', a: '45 avenue du 8 Mai 1945, 04000 Digne-les-Bains', n: 'Méditation & breathwork et Kundalini, le jeudi.', link: 'https://www.google.com/maps/search/?api=1&query=' + enc('Centre Culturel René Char Digne-les-Bains') },
      dojo: { q: 'Complexe aquatique Les Eaux Chaudes, 1 avenue François Cuzin, Digne-les-Bains', t: 'Dojo de la piscine', a: 'Complexe aquatique Les Eaux Chaudes, 1 avenue François Cuzin, 04000 Digne-les-Bains', n: 'Kundalini le mardi, Hatha le vendredi.', link: 'https://www.google.com/maps/search/?api=1&query=' + enc('Complexe aquatique Les Eaux Chaudes Digne-les-Bains') },
      siege: { q: '44.0836701,6.2128403', t: 'Siège de l’association', a: '9 rue des Romarins, 04000 Digne-les-Bains', n: 'Siège administratif : les cours n’ont pas lieu à cette adresse.', link: GOOGLE_PLACE }
    };
    var tabs = $$('.map__tabs [role="tab"]'), frame = $('#mapFrame'), addr = $('#mapAddr'), open = $('#mapOpen'), panel = $('#mapPanel');
    function show(key, focus) {
      var m = MAPS[key];
      tabs.forEach(function (t) { var on = t.dataset.map === key; t.classList.toggle('is-on', on); t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; if (on) { panel.setAttribute('aria-labelledby', t.id); if (focus) { t.focus(); } } });
      frame.src = 'https://maps.google.com/maps?q=' + enc(m.q) + '&z=16&hl=fr&output=embed';
      addr.innerHTML = '<strong></strong><br><span></span><br><em></em>';
      addr.querySelector('strong').textContent = m.t;
      addr.querySelector('span').textContent = m.a;
      addr.querySelector('em').textContent = m.n;
      open.href = m.link;
    }
    tabs.forEach(function (t, i) {
      t.tabIndex = i === 0 ? 0 : -1;
      t.addEventListener('click', function () { show(t.dataset.map); });
      t.addEventListener('keydown', function (e) {
        var k = e.key, idx = tabs.indexOf(t);
        if (k === 'ArrowRight') { show(tabs[(idx + 1) % tabs.length].dataset.map, true); e.preventDefault(); }
        if (k === 'ArrowLeft') { show(tabs[(idx - 1 + tabs.length) % tabs.length].dataset.map, true); e.preventDefault(); }
      });
    });
  })();

  /* ---------- Visionneuse photo ---------- */
  (function () {
    var lb = $('#lb'), lbImg = $('#lbImg'), lbCap = $('#lbCap');
    var figs = $$('[data-lb]'), cur = 0, closing = false;
    function set() {
      var f = figs[cur], img = $('img', f);
      lbImg.src = img.currentSrc || img.src; lbImg.alt = img.alt; lbCap.textContent = f.dataset.cap || '';
      if (!reduce) { gsap.fromTo(lbImg, { opacity: 0, scale: 0.95 }, { opacity: 1, scale: 1, duration: 0.8, ease: 'expo.out' }); }
    }
    function openAt(i, x, y) {
      cur = i; set();
      if (!lb.open) { lb.showModal(); }
      if (lenis) { lenis.stop(); }
      if (!reduce) { gsap.fromTo(lb, { clipPath: 'circle(0px at ' + x + 'px ' + y + 'px)' }, { clipPath: 'circle(150% at ' + x + 'px ' + y + 'px)', duration: 1, ease: 'expo.out' }); }
    }
    function close() {
      if (closing || !lb.open) { return; }
      closing = true;
      var done = function () { lb.close(); closing = false; gsap.set(lb, { clearProps: 'clipPath' }); if (lenis) { lenis.start(); } };
      if (reduce) { done(); } else { gsap.to(lb, { clipPath: 'circle(0px at 50% 50%)', duration: 0.7, ease: 'expo.inOut', onComplete: done }); }
    }
    figs.forEach(function (f, i) {
      f.tabIndex = 0; f.setAttribute('role', 'button'); f.setAttribute('aria-label', 'Agrandir : ' + (f.dataset.cap || ''));
      f.addEventListener('click', function (e) { openAt(i, e.clientX || innerWidth / 2, e.clientY || innerHeight / 2); });
      f.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); var r = f.getBoundingClientRect(); openAt(i, r.left + r.width / 2, r.top + r.height / 2); } });
    });
    $('#lbClose').addEventListener('click', close);
    $('#lbNext').addEventListener('click', function () { cur = (cur + 1) % figs.length; set(); });
    $('#lbPrev').addEventListener('click', function () { cur = (cur - 1 + figs.length) % figs.length; set(); });
    lb.addEventListener('cancel', function (e) { e.preventDefault(); close(); });
    lb.addEventListener('click', function (e) { if (e.target === lb) { close(); } });
    lb.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') { cur = (cur + 1) % figs.length; set(); } if (e.key === 'ArrowLeft') { cur = (cur - 1 + figs.length) % figs.length; set(); } });
  })();

  /* ==========================================================================
     RÉSERVATION (aucun back-end) : cours → date → vos infos → message prêt
     ========================================================================== */
  var PLACES = {
    dojo: { name: 'Dojo de la piscine', addr: 'Complexe aquatique Les Eaux Chaudes, 1 avenue François Cuzin, 04000 Digne-les-Bains' },
    rene: { name: 'Centre culturel René Char', addr: '45 avenue du 8 Mai 1945, 04000 Digne-les-Bains' },
    gavots: { name: 'Digne-les-Bains, via l’asso Les Gavots', addr: 'Digne-les-Bains (lieu précisé à l’inscription)' },
    cms: { name: 'Digne-les-Bains, via le Centre Médico-Sportif 04', addr: 'Digne-les-Bains (lieu précisé à l’inscription)' }
  };
  var DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  var DAYS3 = ['dim', 'lun', 'mar', 'mer', 'jeu', 'ven', 'sam'];

  var sessions = $$('.slot').map(function (el) {
    var d = el.dataset;
    return { kind: 'session', id: d.id, dow: parseInt(d.dow, 10), start: d.start, end: d.end, title: d.title, place: d.place, who: d.who, mode: d.mode || 'book' };
  });
  var now0 = new Date();
  var events = $$('.ticket').map(function (el) {
    var d = el.dataset, p = d.date.split('-').map(Number), h = d.start.split(':').map(Number), e = d.end.split(':').map(Number);
    return { kind: 'event', id: d.id, el: el, date: new Date(p[0], p[1] - 1, p[2], h[0], h[1]), endDate: new Date(p[0], p[1] - 1, p[2], e[0], e[1]), start: d.start, end: d.end, placeName: d.placeName, title: 'Concert « Chants sacrés du monde et mantras de l’Inde »' };
  }).filter(function (ev) {
    if (ev.endDate < now0) { ev.el.hidden = true; return false; }
    return true;
  });
  if (!events.length) {
    var tk = $('#tickets');
    if (tk) {
      var li = document.createElement('li');
      li.className = 'ticket';
      li.innerHTML = '<div class="ticket__info"><strong>Prochaines dates bientôt</strong><span>Suivez l’association sur Facebook ou écrivez-nous.</span></div>';
      tk.appendChild(li);
    }
  }
  var asks = [
    { kind: 'ask', id: 'ask-prices', title: 'Tarifs et adhésion', sub: 'Je souhaite connaître les tarifs' },
    { kind: 'ask', id: 'ask-question', title: 'Une question', sub: 'Un renseignement, un besoin particulier' }
  ];
  var byId = {};
  sessions.concat(events, asks).forEach(function (x) { byId[x.id] = x; });

  function fmtDay(d) { return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }); }
  function fmtTime(t) { return t.replace(':', 'h'); }
  function nextDates(s, n) {
    var out = [], now = new Date(), h = s.start.split(':').map(Number);
    var d = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h[0], h[1]);
    var target = s.dow % 7, guard = 0;
    while (d.getDay() !== target && guard++ < 8) { d.setDate(d.getDate() + 1); }
    if (d < now) { d.setDate(d.getDate() + 7); }
    for (var i = 0; i < n; i++) { out.push(new Date(d)); d.setDate(d.getDate() + 7); }
    return out;
  }

  /* Prochain cours (pastille du hero) + jour courant dans les horaires */
  (function () {
    var todayDow = ((new Date().getDay() + 6) % 7) + 1;
    $$('.day').forEach(function (d) { d.classList.toggle('is-today', parseInt(d.dataset.dow, 10) === todayDow); });
    var best = null;
    sessions.forEach(function (s) { var d = nextDates(s, 1)[0]; if (!best || d < best.d) { best = { s: s, d: d }; } });
    if (best) {
      var same = best.d.toDateString() === new Date().toDateString();
      $('#nextChipTxt').textContent = (same ? 'Aujourd’hui' : fmtDay(best.d)) + ' · ' + fmtTime(best.s.start) + ' · ' + best.s.title;
      $('#nextChip').hidden = false;
    }
  })();

  (function () {
    var form = $('#wizard');
    var steps = $$('.step', form), dots = $$('.wizard__dots li', form), bar = $('#wizBar'), stepName = $('#stepName');
    var nextBtn = $('#wizNext'), backBtn = $('#wizBack');
    var choicesEl = $('#choices'), datesEl = $('#dates'), dateLegend = $('#dateLegend'), dateNote = $('#dateNote');
    var fName = $('#fName'), fCount = $('#fCount'), fTrial = $('#fTrial'), fMsg = $('#fMsg'), trialWrap = $('#trialWrap'), countLabel = $('#countLabel');
    var NAMES = ['Le cours', 'La date', 'Vous', 'Envoi'];
    var st = { step: 1, sel: null, date: null, count: 1 };
    var msgText = '';

    /* Choix du cours */
    function choiceHTML(name, id, dayLabel, title, sub) {
      return '<label class="choice"><input type="radio" name="' + name + '" value="' + id + '"><span class="choice__card"><span class="choice__day">' + dayLabel + '</span><span class="choice__t"><strong>' + title + '</strong><span>' + sub + '</span></span><span class="choice__tick" aria-hidden="true"></span></span></label>';
    }
    function renderChoices() {
      var h = '<h4 class="choices__group">Cours de la semaine</h4>';
      sessions.forEach(function (s) {
        var p = PLACES[s.place];
        h += choiceHTML('what', s.id, DAYS3[s.dow % 7], s.title + (s.mode === 'info' ? ' · renseignements' : ''), fmtTime(s.start) + ' – ' + fmtTime(s.end) + ' · ' + p.name);
      });
      if (events.length) {
        h += '<h4 class="choices__group">Concerts</h4>';
        events.forEach(function (ev) {
          h += choiceHTML('what', ev.id, pad(ev.date.getDate()) + '/' + pad(ev.date.getMonth() + 1), 'Chants sacrés &amp; mantras de l’Inde', fmtDay(ev.date) + ' · ' + ev.placeName + ' · 13 € / 8 €');
        });
      }
      h += '<h4 class="choices__group">Autre demande</h4>';
      asks.forEach(function (a) { h += choiceHTML('what', a.id, '?', a.title, a.sub); });
      choicesEl.innerHTML = h;
    }
    renderChoices();

    function select(id) {
      st.sel = byId[id] || null; st.date = null;
      var input = choicesEl.querySelector('input[value="' + id + '"]');
      if (input) { input.checked = true; }
      updateNav();
    }
    choicesEl.addEventListener('change', function (e) { if (e.target.name === 'what') { select(e.target.value); } });

    /* Étape 2 : dates */
    function renderDates() {
      var s = st.sel;
      dateLegend.textContent = s.mode === 'info' ? 'Pour quelle séance ?' : 'Quelle date ?';
      var ds = nextDates(s, 4);
      datesEl.innerHTML = ds.map(function (d, i) {
        return '<label class="choice"><input type="radio" name="when" value="' + d.getTime() + '"' + (i === 0 ? '' : '') + '><span class="choice__card"><span class="choice__t"><strong>' + fmtDay(d) + '</strong><span>' + fmtTime(s.start) + ' – ' + fmtTime(s.end) + '</span></span><span class="choice__tick" aria-hidden="true"></span></span></label>';
      }).join('');
      dateNote.textContent = PLACES[s.place].name + ' · ' + PLACES[s.place].addr + '.';
      st.date = null;
      datesEl.onchange = function (e) { if (e.target.name === 'when') { st.date = new Date(parseInt(e.target.value, 10)); updateNav(); } };
    }

    /* Navigation entre étapes */
    function flow() { return st.sel && st.sel.kind === 'session' ? [1, 2, 3, 4] : [1, 3, 4]; }
    function canNext() {
      if (st.step === 1) { return !!st.sel; }
      if (st.step === 2) { return !!st.date; }
      return true;
    }
    function updateNav() {
      nextBtn.disabled = !canNext();
      nextBtn.setAttribute('aria-disabled', String(!canNext()));
      nextBtn.style.opacity = canNext() ? '' : '.4';
      backBtn.hidden = st.step === 1;
      nextBtn.hidden = st.step === 4;
      var f = flow(), pos = f.indexOf(st.step) + 1;
      stepName.textContent = 'Étape ' + st.step + ' sur 4 · ' + NAMES[st.step - 1];
      dots.forEach(function (d, i) { d.classList.toggle('is-on', i + 1 === st.step); d.classList.toggle('is-done', i + 1 < st.step); });
      bar.style.transform = 'scaleX(' + (st.step / 4) + ')';
      nextBtn.querySelector('span').textContent = st.step === 3 ? 'Voir mon message' : 'Continuer';
    }
    function go(n, dir) {
      var from = steps[st.step - 1], to = steps[n - 1];
      st.step = n;
      var enter = function () {
        steps.forEach(function (s) { s.classList.remove('is-active'); });
        to.classList.add('is-active');
        if (!reduce) { gsap.fromTo(to, { opacity: 0, x: 30 * dir }, { opacity: 1, x: 0, duration: 0.7, ease: 'expo.out', clearProps: 'transform,opacity' }); }
        to.setAttribute('tabindex', '-1');
        to.focus({ preventScroll: true });
        updateNav();
        ScrollTrigger.refresh();
      };
      if (reduce || from === to) { enter(); }
      else { gsap.to(from, { opacity: 0, x: -24 * dir, duration: 0.3, ease: 'power2.in', onComplete: function () { gsap.set(from, { clearProps: 'transform,opacity' }); enter(); } }); }
    }
    function configureStep3() {
      var s = st.sel;
      var isSession = s.kind === 'session' && s.mode === 'book';
      trialWrap.hidden = !isSession;
      var needCount = s.kind !== 'ask';
      fCount.closest('.field').querySelector('div').hidden = !needCount;
      countLabel.textContent = s.kind === 'event' ? 'Nombre de places' : 'Nombre de personnes';
      fCount.value = st.count;
      var row = fCount.closest('.field');
      row.style.gridTemplateColumns = (needCount && isSession) ? '' : '1fr';
    }
    nextBtn.addEventListener('click', function () {
      if (!canNext()) { return; }
      if (st.step === 3) {
        if (!fName.value.trim()) { $('#nameError').hidden = false; fName.focus(); return; }
        $('#nameError').hidden = true;
        buildFinal();
      }
      var f = flow(), idx = f.indexOf(st.step), next = f[idx + 1];
      if (st.step === 1) { if (st.sel.kind === 'session') { renderDates(); } else { configureStep3(); } }
      if (st.step === 2) { configureStep3(); }
      go(next, 1);
    });
    backBtn.addEventListener('click', function () {
      var f = flow(), idx = f.indexOf(st.step);
      go(f[Math.max(0, idx - 1)], -1);
    });
    form.addEventListener('submit', function (e) { e.preventDefault(); });
    fName.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); nextBtn.click(); } });
    fName.addEventListener('input', function () { $('#nameError').hidden = true; });
    $('#cMinus').addEventListener('click', function () { st.count = Math.max(1, st.count - 1); fCount.value = st.count; });
    $('#cPlus').addEventListener('click', function () { st.count = Math.min(8, st.count + 1); fCount.value = st.count; });

    /* Message prêt à envoyer */
    function buildMessage() {
      var s = st.sel, n = st.count, name = fName.value.trim(), extra = fMsg.value.trim();
      var places = n > 1 ? n + ' places' : 'une place';
      var m = 'Bonjour, ';
      if (s.kind === 'session') {
        var when = fmtDay(st.date) + ' à ' + fmtTime(s.start), p = PLACES[s.place];
        if (s.mode === 'info') {
          m += 'je souhaiterais des informations sur le cours de ' + s.title + ' du ' + when + ' (' + p.name + ').' + (n > 1 ? ' Nous serions ' + n + '.' : '');
        } else {
          m += 'je souhaite réserver ' + places + ' pour le cours de ' + s.title + ' du ' + when + ' (' + p.name + ').';
          if (fTrial.checked) { m += ' C’est ma première séance : j’aimerais profiter de la séance d’essai gratuite.'; }
        }
      } else if (s.kind === 'event') {
        m += 'je souhaite réserver ' + places + ' pour le concert « Chants sacrés du monde et mantras de l’Inde » du ' + fmtDay(s.date) + ' à ' + s.placeName + ' (' + fmtTime(s.start) + ').';
      } else if (s.id === 'ask-prices') {
        m += 'pourriez-vous m’indiquer les tarifs des cours et les modalités d’adhésion ?';
      } else {
        m += 'j’aurais une question.';
      }
      if (extra) { m += ' ' + extra; }
      m += ' Nom : ' + name + '. Merci !';
      return m;
    }

    function icsEscape(t) { return String(t).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n'); }
    function icsStamp(d) { return d.getFullYear() + pad(d.getMonth() + 1) + pad(d.getDate()) + 'T' + pad(d.getHours()) + pad(d.getMinutes()) + '00'; }
    function buildIcs() {
      var s = st.sel, start, end, title, loc;
      if (s.kind === 'session') {
        start = new Date(st.date);
        var e = s.end.split(':').map(Number);
        end = new Date(st.date.getFullYear(), st.date.getMonth(), st.date.getDate(), e[0], e[1]);
        title = s.title + ' · Mieux Vivre Au Quotidien'; loc = PLACES[s.place].name + ', ' + PLACES[s.place].addr;
      } else { start = s.date; end = s.endDate; title = 'Concert chants sacrés du monde et mantras de l’Inde'; loc = s.placeName; }
      var u = new Date();
      var utc = u.getUTCFullYear() + pad(u.getUTCMonth() + 1) + pad(u.getUTCDate()) + 'T' + pad(u.getUTCHours()) + pad(u.getUTCMinutes()) + pad(u.getUTCSeconds()) + 'Z';
      var lines = [
        'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Mieux Vivre Au Quotidien//Yoga Digne//FR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
        'BEGIN:VTIMEZONE', 'TZID:Europe/Paris',
        'BEGIN:DAYLIGHT', 'TZOFFSETFROM:+0100', 'TZOFFSETTO:+0200', 'TZNAME:CEST', 'DTSTART:19700329T020000', 'RRULE:FREQ=YEARLY;BYMONTH=3;BYDAY=-1SU', 'END:DAYLIGHT',
        'BEGIN:STANDARD', 'TZOFFSETFROM:+0200', 'TZOFFSETTO:+0100', 'TZNAME:CET', 'DTSTART:19701025T030000', 'RRULE:FREQ=YEARLY;BYMONTH=10;BYDAY=-1SU', 'END:STANDARD',
        'END:VTIMEZONE',
        'BEGIN:VEVENT', 'UID:' + s.id + '-' + start.getTime() + '@mieuxvivreauquotidien', 'DTSTAMP:' + utc,
        'DTSTART;TZID=Europe/Paris:' + icsStamp(start), 'DTEND;TZID=Europe/Paris:' + icsStamp(end),
        'SUMMARY:' + icsEscape(title), 'LOCATION:' + icsEscape(loc),
        'DESCRIPTION:' + icsEscape('Réservation à confirmer avec l’association : ' + PHONE_DISPLAY + ' · ' + MAIL),
        'BEGIN:VALARM', 'TRIGGER:-PT60M', 'ACTION:DISPLAY', 'DESCRIPTION:Rendez-vous dans une heure', 'END:VALARM',
        'END:VEVENT', 'END:VCALENDAR'
      ];
      return lines.join('\r\n');
    }

    function buildFinal() {
      var s = st.sel;
      msgText = buildMessage();
      $('#recap').textContent = msgText;
      var enc = encodeURIComponent;
      var subject = s.kind === 'ask' ? 'Question · yoga Digne' : 'Réservation · ' + (s.title) + ' · ' + fName.value.trim();
      $('#sendSms').href = 'sms:' + PHONE + '?&body=' + enc(msgText);
      $('#sendWa').href = 'https://wa.me/' + WA_NUMBER + '?text=' + enc(msgText);
      $('#sendMail').href = 'mailto:' + MAIL + '?subject=' + enc(subject) + '&body=' + enc(msgText);
      $('#sendIcs').hidden = s.kind === 'ask';
    }
    $('#sendIcs').addEventListener('click', function () {
      var blob = new Blob([buildIcs()], { type: 'text/calendar;charset=utf-8' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'yoga-digne-' + st.sel.id + '.ics';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(function () { URL.revokeObjectURL(a.href); }, 4000);
    });
    $('#sendCopy').addEventListener('click', function () {
      var lbl = $('#copyLbl');
      var ok = function () { lbl.textContent = 'Message copié ✓'; setTimeout(function () { lbl.textContent = 'Copier le message'; }, 2400); };
      if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(msgText).then(ok, fallback); } else { fallback(); }
      function fallback() {
        var ta = document.createElement('textarea'); ta.value = msgText; ta.style.position = 'fixed'; ta.style.opacity = '0';
        document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); ok(); } catch (e) { lbl.textContent = 'Sélectionnez le texte ci-dessus'; }
        ta.remove();
      }
    });

    /* Pré-sélection depuis les boutons « Réserver » du site */
    document.addEventListener('click', function (e) {
      var b = e.target.closest('[data-book]');
      if (!b) { return; }
      var id = b.getAttribute('data-book');
      if (!byId[id]) { return; }
      e.preventDefault();
      select(id);
      if (st.sel.kind === 'session') { renderDates(); } else { configureStep3(); }
      var target = st.sel.kind === 'session' ? 2 : 3;
      steps.forEach(function (x) { x.classList.remove('is-active'); });
      st.step = target; steps[target - 1].classList.add('is-active');
      updateNav();
      scrollToEl($('#reserver'));
    });
    document.addEventListener('click', function (e) {
      var a = e.target.closest('[data-ask-price]');
      if (!a) { return; }
      e.preventDefault();
      select('ask-prices'); configureStep3();
      steps.forEach(function (x) { x.classList.remove('is-active'); });
      st.step = 3; steps[2].classList.add('is-active'); updateNav();
      scrollToEl($('#reserver'));
    });
    updateNav();
  })();

  /* ---------- Namasté : petite onde ---------- */
  var nam = $('#namaste');
  if (nam) {
    nam.addEventListener('click', function (e) {
      if (reduce) { return; }
      for (var i = 0; i < 3; i++) {
        var r = document.createElement('span');
        r.className = 'ripple';
        r.style.cssText = 'position:fixed;left:' + e.clientX + 'px;top:' + e.clientY + 'px;width:30px;height:30px;margin:-15px 0 0 -15px;border-radius:50%;border:1.5px solid #E3A234;pointer-events:none;z-index:2500';
        document.body.appendChild(r);
        gsap.to(r, { scale: 22 + i * 10, opacity: 0, duration: 2 + i * 0.4, delay: i * 0.18, ease: 'expo.out', onComplete: (function (el) { return function () { el.remove(); }; })(r) });
      }
    });
  }

  /* ---------- Vidéo : pause hors écran, économie de données ---------- */
  var vid = $('.hero__video');
  if (vid) {
    var saveData = navigator.connection && navigator.connection.saveData;
    if (saveData || reduce) { vid.removeAttribute('autoplay'); vid.pause(); vid.preload = 'none'; }
    else {
      ScrollTrigger.create({ trigger: '.hero', start: 'top top', end: 'bottom top', onToggle: function (self) { if (self.isActive) { var p = vid.play(); if (p && p.catch) { p.catch(function () {}); } } else { vid.pause(); } } });
    }
  }

  /* ---------- Démarrage ---------- */
  window.addEventListener('load', function () { ScrollTrigger.refresh(); });
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(function () { ScrollTrigger.refresh(); }); }
  onScroll();
  window.__ready = true;
  runLoader();
})();
