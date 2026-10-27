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

})();
