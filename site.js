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
})();
