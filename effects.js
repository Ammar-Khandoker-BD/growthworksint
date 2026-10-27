(function () {
  'use strict';

  // Isolated interaction script so cursor/touch effects are not dependent on site.js.
  var media = function (query, fallback) {
    try { return window.matchMedia ? window.matchMedia(query).matches : fallback; }
    catch (error) { return fallback; }
  };
  var reducedMotion = media('(prefers-reduced-motion: reduce)', false);
  var finePointer = media('(any-hover: hover) and (any-pointer: fine)', true);
  var coarsePointer = media('(any-pointer: coarse)', 'ontouchstart' in window) ||
    media('(pointer: coarse)', 'ontouchstart' in window);

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function isInteractive(target) {
    return !!(target && target.closest && target.closest(
      'a, button, [role="button"], .card, .svc, .chip, .svc-nav a, .included, .form, .pending, .contact-item, input, select, textarea, .wa-float, .back-to-top'
    ));
  }

  // Desktop: use mouse events as a broad-compatibility fallback rather than
  // relying only on Pointer Events. Native cursor hides only after initialization.
  if (finePointer) {
    var cursor = document.createElement('div');
    cursor.className = 'gw-cursor';
    cursor.setAttribute('aria-hidden', 'true');
    cursor.innerHTML =
      '<span class="gw-cursor-halo"></span>' +
      '<span class="gw-cursor-ring"></span>' +
      '<span class="gw-cursor-core"></span>';
    document.body.appendChild(cursor);

    var x = -100, y = -100, pending = false;
    function renderCursor() {
      cursor.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
      pending = false;
    }

    document.addEventListener('mousemove', function (event) {
      x = event.clientX;
      y = event.clientY;
      document.body.classList.add('gw-cursor-enabled');
      if (!pending) {
        pending = true;
        if (window.requestAnimationFrame) window.requestAnimationFrame(renderCursor);
        else renderCursor();
      }
      document.body.classList.toggle('gw-cursor-hover', isInteractive(event.target));
    }, { passive: true });

    document.addEventListener('mousedown', function () {
      document.body.classList.add('gw-cursor-down');
    }, { passive: true });
    document.addEventListener('mouseup', function () {
      document.body.classList.remove('gw-cursor-down');
    }, { passive: true });
    document.addEventListener('mouseout', function (event) {
      if (!event.relatedTarget) {
        document.body.classList.remove('gw-cursor-enabled', 'gw-cursor-hover', 'gw-cursor-down');
      }
    }, { passive: true });
    window.addEventListener('blur', function () {
      document.body.classList.remove('gw-cursor-enabled', 'gw-cursor-hover', 'gw-cursor-down');
    });
  }

  // Touch / pen feedback. A safety timeout removes nodes even if animationend
  // is not emitted (for example in older mobile WebViews or reduced-motion mode).
  function spawnTouchEffect(clientX, clientY) {
    var ripple = document.createElement('span');
    ripple.className = 'gw-touch-ripple';
    ripple.setAttribute('aria-hidden', 'true');
    ripple.style.setProperty('--gw-touch-x', clientX + 'px');
    ripple.style.setProperty('--gw-touch-y', clientY + 'px');
    document.body.appendChild(ripple);

    var angles = [0, 60, 120, 180, 240, 300];
    if (!reducedMotion) {
      angles.forEach(function (angle) {
        var spark = document.createElement('span');
        spark.className = 'gw-touch-spark';
        spark.setAttribute('aria-hidden', 'true');
        spark.style.setProperty('--gw-touch-x', clientX + 'px');
        spark.style.setProperty('--gw-touch-y', clientY + 'px');
        var radians = angle * Math.PI / 180;
        spark.style.setProperty('--gw-spark-x', (Math.cos(radians) * 30).toFixed(1) + 'px');
        spark.style.setProperty('--gw-spark-y', (Math.sin(radians) * 30).toFixed(1) + 'px');
        document.body.appendChild(spark);
        spark.addEventListener('animationend', function () { spark.remove(); }, { once: true });
        window.setTimeout(function () { if (spark.isConnected) spark.remove(); }, 950);
      });
    }

    ripple.addEventListener('animationend', function () { ripple.remove(); }, { once: true });
    window.setTimeout(function () { if (ripple.isConnected) ripple.remove(); }, 950);
  }

  if (coarsePointer) {
    function handleTouchStart(event) {
      var point = event.changedTouches && event.changedTouches[0];
      if (!point) return;
      var target = event.target;
      if (target && target.closest && target.closest('input, textarea, select, option, [contenteditable="true"]')) return;
      spawnTouchEffect(point.clientX, point.clientY);
    }

    if (window.PointerEvent) {
      document.addEventListener('pointerdown', function (event) {
        if (event.pointerType !== 'touch' && event.pointerType !== 'pen') return;
        var target = event.target;
        if (target && target.closest && target.closest('input, textarea, select, option, [contenteditable="true"]')) return;
        spawnTouchEffect(event.clientX, event.clientY);
      }, { passive: true });
    } else {
      document.addEventListener('touchstart', handleTouchStart, { passive: true });
    }
  }


  // Cinematic motion: low-density ambient particles, scroll reveals, gentle
  // pointer tilt and click ripples. All decoration is non-interactive.
  var fineMotionPointer = media('(hover: hover) and (pointer: fine)', false);

  if (!reducedMotion) {
    // A small, deterministic particle field avoids randomness and heavy canvases.
    var particleField = document.createElement('div');
    particleField.className = 'gw-particle-field';
    particleField.setAttribute('aria-hidden', 'true');
    var particleCount = window.innerWidth <= 640 ? 7 : 18;
    for (var particleIndex = 0; particleIndex < particleCount; particleIndex++) {
      var dot = document.createElement('span');
      dot.className = 'gw-particle-dot';
      var seed = particleIndex + 1;
      dot.style.setProperty('--gw-left', ((seed * 37) % 97 + 1) + '%');
      dot.style.setProperty('--gw-top', ((seed * 53) % 94 + 3) + '%');
      dot.style.setProperty('--gw-size', (seed % 3 === 0 ? 3.5 : 2) + 'px');
      dot.style.setProperty('--gw-duration', (7 + (seed % 7)) + 's');
      dot.style.setProperty('--gw-delay', (-1 * (seed % 9)) + 's');
      dot.style.setProperty('--gw-dx', (((seed * 11) % 42) - 21) + 'px');
      dot.style.setProperty('--gw-dy', (-18 - (seed % 32)) + 'px');
      particleField.appendChild(dot);
    }
    document.body.appendChild(particleField);

    // Motion reveal is progressively enabled only after the observer exists;
    // if unsupported, no element is hidden.
    if ('IntersectionObserver' in window) {
      var motionItems = document.querySelectorAll(
        '.hero-facts span, .chips .chip, .svc dl > div, .included li, .list li, .footer-grid > div'
      );
      if (motionItems.length) {
        document.body.classList.add('gw-motion-ready');
        var motionObserver = new IntersectionObserver(function (entries, observer) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            entry.target.classList.add('gw-motion-in');
            observer.unobserve(entry.target);
          });
        }, { threshold: 0.12, rootMargin: '0px 0px -24px 0px' });

        motionItems.forEach(function (item, index) {
          item.classList.add('gw-motion-item');
          item.style.setProperty('--gw-motion-delay', (index % 5) * 55 + 'ms');
          motionObserver.observe(item);
        });
      }
    }

    // Very light 3D tilt on large pointer devices only.
    if (fineMotionPointer) {
      var tiltItems = document.querySelectorAll('.card, .svc, .pending, .contact-item');
      tiltItems.forEach(function (item) {
        item.classList.add('gw-tilt-item');
        item.addEventListener('pointermove', function (event) {
          if (event.pointerType && event.pointerType !== 'mouse') return;
          var rect = item.getBoundingClientRect();
          if (!rect.width || !rect.height) return;
          var px = (event.clientX - rect.left) / rect.width;
          var py = (event.clientY - rect.top) / rect.height;
          item.style.setProperty('--gw-tilt-y', (clamp(px * 2 - 1, -1, 1) * 2.2).toFixed(2) + 'deg');
          item.style.setProperty('--gw-tilt-x', (-clamp(py * 2 - 1, -1, 1) * 1.8).toFixed(2) + 'deg');
          item.classList.add('gw-tilt-active');
        }, { passive: true });
        item.addEventListener('pointerleave', function () {
          item.classList.remove('gw-tilt-active');
          item.style.setProperty('--gw-tilt-x', '0deg');
          item.style.setProperty('--gw-tilt-y', '0deg');
        }, { passive: true });
      });
    }

    // Ripple stays clipped inside its control, with a fallback cleanup timer.
    document.addEventListener('pointerdown', function (event) {
      var target = event.target && event.target.closest
        ? event.target.closest('.btn, .chip, .nav a, .svc-nav a, .wa-float, .back-to-top')
        : null;
      if (!target || target.classList.contains('gw-click-ripple')) return;
      var rect = target.getBoundingClientRect();
      var span = document.createElement('span');
      span.className = 'gw-click-ripple';
      span.setAttribute('aria-hidden', 'true');
      span.style.setProperty('--gw-click-x', (event.clientX - rect.left) + 'px');
      span.style.setProperty('--gw-click-y', (event.clientY - rect.top) + 'px');
      span.style.setProperty('--gw-click-size', (Math.max(rect.width, rect.height) * 2.4) + 'px');
      target.appendChild(span);
      span.addEventListener('animationend', function () { span.remove(); }, { once: true });
      window.setTimeout(function () { if (span.isConnected) span.remove(); }, 900);
    }, { passive: true });
  }


})();
