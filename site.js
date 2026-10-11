(function () {
  document.documentElement.classList.add('js');

  // mobile menu
  var btn = document.querySelector('.menu-btn');
  var nav = document.getElementById('site-nav');
  if (btn && nav) {
    btn.addEventListener('click', function () {
      var open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      btn.textContent = open ? 'Close' : 'Menu';
    });
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
      progressPending = false;
    });
  }, { passive: true });
  window.addEventListener('resize', updateReadingProgress, { passive: true });

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

})();
