(function () {
  document.documentElement.classList.add('js');

  // Accessible responsive navigation: click, Escape, outside click, resize and link selection.
  var btn = document.querySelector('.menu-btn');
  var nav = document.getElementById('site-nav');
  if (btn && nav) {
    function setMenuOpen(open) {
      nav.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.textContent = open ? 'Close' : 'Menu';
    }

    btn.addEventListener('click', function () {
      setMenuOpen(btn.getAttribute('aria-expanded') !== 'true');
    });

    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () { setMenuOpen(false); });
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && btn.getAttribute('aria-expanded') === 'true') {
        setMenuOpen(false);
        btn.focus();
      }
    });

    document.addEventListener('click', function (event) {
      if (btn.getAttribute('aria-expanded') !== 'true') return;
      if (!nav.contains(event.target) && !btn.contains(event.target)) setMenuOpen(false);
    });

    window.addEventListener('resize', function () {
      if (window.matchMedia('(min-width: 1101px)').matches) setMenuOpen(false);
    }, { passive: true });
  }

  // copy buttons
  function selectText(el) {
    var r = document.createRange();
    r.selectNodeContents(el);
    var s = window.getSelection();
    s.removeAllRanges();
    s.addRange(r);
  }
  document.querySelectorAll('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var value = b.getAttribute('data-copy');
      var original = b.textContent;
      function done(ok) {
        b.textContent = ok ? 'Copied' : 'Press Ctrl+C';
        setTimeout(function () { b.textContent = original; }, 1800);
      }
      try {
        navigator.clipboard.writeText(value).then(function () { done(true); }, function () {
          var t = b.parentElement.querySelector('.val');
          if (t) selectText(t);
          done(false);
        });
      } catch (e) {
        var t = b.parentElement.querySelector('.val');
        if (t) selectText(t);
        done(false);
      }
    });
  });

  // forms: nothing is sent from the page. Build a ready-to-send message instead.
  var WA = '8801716861353';
  document.querySelectorAll('form[data-form]').forEach(function (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var kind = form.getAttribute('data-form');
      var lines = ['Hello GrowthWorks International,', '', kind, ''];
      form.querySelectorAll('input, select, textarea').forEach(function (f) {
        if (!f.value || !f.value.trim()) return;
        var label = f.getAttribute('data-label') || f.name;
        lines.push(label + ': ' + f.value.trim());
      });
      var text = lines.join('\n');
      var out = form.querySelector('.result');
      out.querySelector('textarea').value = text;
      out.querySelector('a.wa-send').href = 'https://wa.me/' + WA + '?text=' + encodeURIComponent(text);
      out.hidden = false;
      out.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
    var copyBtn = form.querySelector('.result .copy-msg');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var ta = form.querySelector('.result textarea');
        var original = copyBtn.textContent;
        function done(ok) {
          copyBtn.textContent = ok ? 'Copied' : 'Press Ctrl+C';
          setTimeout(function () { copyBtn.textContent = original; }, 1800);
        }
        try {
          navigator.clipboard.writeText(ta.value).then(function () { done(true); }, function () { ta.select(); done(false); });
        } catch (e) { ta.select(); done(false); }
      });
    }
  });

  // Premium page motion: reveal content as it enters the viewport, without hiding
  // anything when reduced motion is preferred or IntersectionObserver is unavailable.
  var prefersReducedMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Slim reading-progress indicator.
  var progressBar = document.createElement('div');
  progressBar.className = 'scroll-progress';
  progressBar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(progressBar);

  function updateReadingProgress() {
    var root = document.documentElement;
    var scrollable = root.scrollHeight - window.innerHeight;
    var amount = scrollable > 0 ? window.scrollY / scrollable : 0;
    progressBar.style.transform = 'scaleX(' + Math.min(1, Math.max(0, amount)) + ')';
  }

  var progressPending = false;
  updateReadingProgress();
  window.addEventListener('scroll', function () {
    if (progressPending) return;
    progressPending = true;
    window.requestAnimationFrame(function () {
      updateReadingProgress();
      updateScrollGraphics();
      progressPending = false;
    });
  }, { passive: true });
  window.addEventListener('resize', updateReadingProgress, { passive: true });

  // Scroll-reactive motion graphics: restrained ambient orbs, section progress
  // tracks, a hero parallax ring, and subtle in-view lighting on service cards.
  var motionOrbs = [];
  var motionHero = document.querySelector('.hero');
  var motionSections = [];
  var motionServiceCards = [];
  var motionScene = null;

  if (!prefersReducedMotion) {
    motionScene = document.createElement('div');
    motionScene.className = 'scroll-motion-scene';
    motionScene.setAttribute('aria-hidden', 'true');
    motionScene.innerHTML =
      '<span class="scroll-orb scroll-orb--one"></span>' +
      '<span class="scroll-orb scroll-orb--two"></span>' +
      '<span class="scroll-orb scroll-orb--three"></span>';
    document.body.appendChild(motionScene);
    motionOrbs = Array.prototype.slice.call(motionScene.querySelectorAll('.scroll-orb'));

    motionSections = Array.prototype.slice.call(document.querySelectorAll(
      'main .section, main .svc-group, main .page-hero, .cta-band'
    ));
    motionSections.forEach(function (section) {
      var track = document.createElement('span');
      track.className = 'section-scroll-track';
      track.setAttribute('aria-hidden', 'true');
      section.appendChild(track);
      section._motionTrack = track;
    });

    motionServiceCards = Array.prototype.slice.call(document.querySelectorAll('.svc'));
  }

  function clampMotion(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function updateScrollGraphics() {
    if (prefersReducedMotion) return;

    var y = window.scrollY || window.pageYOffset || 0;
    var phase = y * 0.001;
    var transforms = [
      'translate3d(' + (Math.sin(phase * 1.2) * 22).toFixed(2) + 'px,' +
        (Math.cos(phase) * 28 - Math.min(55, y * 0.012)).toFixed(2) + 'px,0) rotate(' +
        clampMotion(y * 0.012, -55, 55).toFixed(2) + 'deg)',
      'translate3d(' + (Math.cos(phase * 0.9) * -24).toFixed(2) + 'px,' +
        (Math.sin(phase * 1.4) * 34 + Math.min(35, y * 0.008)).toFixed(2) + 'px,0) rotate(' +
        clampMotion(35 - y * 0.009, -25, 35).toFixed(2) + 'deg)',
      'translate3d(' + (Math.sin(phase * 0.75) * 18).toFixed(2) + 'px,' +
        (Math.cos(phase * 1.15) * 30 - Math.min(45, y * 0.01)).toFixed(2) + 'px,0) rotate(' +
        clampMotion(y * 0.008, -35, 45).toFixed(2) + 'deg)'
    ];

    motionOrbs.forEach(function (orb, index) {
      orb.style.transform = transforms[index];
    });

    if (motionHero) {
      motionHero.style.setProperty('--hero-parallax', Math.min(72, y * 0.1).toFixed(2) + 'px');
      motionHero.style.setProperty('--hero-rotation', (Math.min(36, y * 0.025)).toFixed(2) + 'deg');
    }

    // Read geometry first, then write styles to avoid unnecessary layout churn.
    var sectionUpdates = motionSections.map(function (section) {
      var rect = section.getBoundingClientRect();
      var progress = clampMotion(
        (window.innerHeight - rect.top) / (window.innerHeight + rect.height),
        0, 1
      );
      var visible = rect.bottom > 0 && rect.top < window.innerHeight;
      return { track: section._motionTrack, progress: progress, visible: visible };
    });

    sectionUpdates.forEach(function (item) {
      item.track.style.transform = 'scaleX(' + item.progress.toFixed(3) + ')';
      item.track.classList.toggle('is-active', item.visible);
    });

    var cardUpdates = motionServiceCards.map(function (card) {
      var rect = card.getBoundingClientRect();
      var center = rect.top + rect.height / 2;
      var distance = Math.abs(center - window.innerHeight * 0.54);
      var focus = clampMotion(1 - distance / (window.innerHeight * 0.82), 0, 1);
      return { card: card, focus: focus };
    });

    cardUpdates.forEach(function (item) {
      item.card.style.setProperty('--scroll-focus', item.focus.toFixed(3));
    });
  }

  updateScrollGraphics();

  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    var revealItems = document.querySelectorAll(
      '.section-head, .area-row, .card, .svc, .step, .pending, .contact-item, .form, .pledge, .cta-band .stack'
    );

    revealItems.forEach(function (item, index) {
      item.classList.add('reveal-item');
      item.style.setProperty('--reveal-delay', (index % 4) * 65 + 'ms');
    });
    document.documentElement.classList.add('has-reveal');

    var revealObserver = new IntersectionObserver(function (entries, observer) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -4% 0px' });

    revealItems.forEach(function (item) {
      revealObserver.observe(item);
    });
  }

  // Pointer-reactive lighting: limited to fine pointers and users who allow motion.
  // This is visual-only; it does not alter form behavior or navigation.
  var canUsePointerEffects = !prefersReducedMotion && window.matchMedia &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (canUsePointerEffects) {
    var spotlightSurfaces = document.querySelectorAll(
      '.card, .pending, .step, .svc, .contact-item, .included, .form'
    );
    spotlightSurfaces.forEach(function (surface) {
      surface.addEventListener('pointermove', function (event) {
        var rect = surface.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        var x = ((event.clientX - rect.left) / rect.width) * 100;
        var y = ((event.clientY - rect.top) / rect.height) * 100;
        surface.style.setProperty('--spot-x', clampMotion(x, 0, 100).toFixed(1) + '%');
        surface.style.setProperty('--spot-y', clampMotion(y, 0, 100).toFixed(1) + '%');
        surface.classList.add('has-pointer-spot');
      }, { passive: true });

      surface.addEventListener('pointerleave', function () {
        surface.classList.remove('has-pointer-spot');
      }, { passive: true });
    });

    var pointerHero = document.querySelector('.hero');
    if (pointerHero) {
      pointerHero.addEventListener('pointermove', function (event) {
        var rect = pointerHero.getBoundingClientRect();
        if (!rect.width || !rect.height) return;
        var x = ((event.clientX - rect.left) / rect.width) * 100;
        var y = ((event.clientY - rect.top) / rect.height) * 100;
        pointerHero.style.setProperty('--hero-spot-x', clampMotion(x, 0, 100).toFixed(1) + '%');
        pointerHero.style.setProperty('--hero-spot-y', clampMotion(y, 0, 100).toFixed(1) + '%');
      }, { passive: true });
      pointerHero.addEventListener('pointerleave', function () {
        pointerHero.style.removeProperty('--hero-spot-x');
        pointerHero.style.removeProperty('--hero-spot-y');
      }, { passive: true });
    }
  }


  // Back-to-top utility: shown only after the reader has moved down the page.
  var backToTop = document.createElement('button');
  backToTop.type = 'button';
  backToTop.className = 'back-to-top';
  backToTop.setAttribute('aria-label', 'Back to top');
  backToTop.setAttribute('title', 'Back to top');
  backToTop.hidden = true;
  backToTop.innerHTML = '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12 7-7 7 7"/><path d="M12 5v14"/></svg>';
  document.body.appendChild(backToTop);
  backToTop.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
  });
  function updateBackToTop() {
    backToTop.hidden = (window.scrollY || window.pageYOffset || 0) < 520;
  }
  updateBackToTop();
  window.addEventListener('scroll', updateBackToTop, { passive: true });


})();
