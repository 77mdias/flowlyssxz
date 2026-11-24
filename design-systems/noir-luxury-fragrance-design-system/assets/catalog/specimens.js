/* ================================================================ specimen behaviour
   The page's own interaction values, scoped to each specimen: style-hover declarations, the note index,
   chapter pager, checkout fill, quantity roll, folio chapters + tilt, and GSAP replays. WebGL specimens
   (3D CTA frames, wordmark) only run while the Components view is open. */
(function () {
  "use strict";
  var main = document.getElementById('ds-main');
  if (!main) return;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
  var gsap = window.gsap;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var live = function () { return document.body.classList.contains('is-components'); };

  /* ---------- style-hover: the page's declared hover styles, applied on pointer over ---------- */
  function setBase(el, prop, val) {
    el.style.setProperty(prop, val);
    if (el._hov) el._base = el._base.replace(new RegExp('(^|;)\\s*' + prop + '\\s*:[^;]*', 'g'), '$1') + ';' + prop + ':' + val;
  }
  $$('[style-hover]', main).forEach(function (el) {
    el.addEventListener('pointerenter', function () {
      if (el._hov) return;
      el._hov = true; el._base = el.getAttribute('style') || '';
      el.setAttribute('style', el._base + ';' + el.getAttribute('style-hover'));
    });
    el.addEventListener('pointerleave', function () {
      if (!el._hov) return;
      el._hov = false; el.setAttribute('style', el._base);
    });
  });

  /* ---------- glass header specimen: gold underline follows the hovered link ---------- */
  $$('[data-nl]', main).forEach(function (a) {
    var ul = a.lastElementChild;
    a.addEventListener('pointerenter', function () { ul.style.transform = 'scaleX(1)'; });
    a.addEventListener('pointerleave', function () { ul.style.transform = 'scaleX(0)'; });
  });

  /* ---------- note index (renderVals: wc / ws / mk / do / dt) ---------- */
  var notes = $('[data-ds-notes]');
  if (notes) {
    var rows = $$('[data-note]', notes), num = $('[data-ds-notenum]', notes);
    var setNote = function (n) {
      rows.forEach(function (r, i) {
        var on = i === n;
        $('[data-w]', r).style.color = on ? '#ede3d1' : 'rgba(237,227,209,0)';
        $('[data-w]', r).style.webkitTextStrokeColor = on ? 'rgba(237,227,209,0)' : 'rgba(237,227,209,.32)';
        $('[data-mk]', r).style.width = on ? '28px' : '0px';
        $('[data-d]', r).style.opacity = on ? 1 : 0;
        $('[data-d]', r).style.transform = on ? 'translateY(0)' : 'translateY(10px)';
      });
      num.textContent = '0' + (n + 1);
    };
    rows.forEach(function (r, i) {
      r.addEventListener('pointerenter', function () { setNote(i); });
      r.addEventListener('click', function () { setNote(i); });
    });
    notes.addEventListener('pointerleave', function () { setNote(0); });
  }

  /* ---------- chapter pager (chc) ---------- */
  $$('[data-ds-pager]').forEach(function (p) {
    var links = $$('[data-ch]', p);
    links.forEach(function (a, i) {
      a.addEventListener('click', function () {
        links.forEach(function (b, k) { setBase(b, 'color', k === i ? '#e8b25a' : 'rgba(237,227,209,.42)'); });
      });
    });
  });

  /* ---------- checkout bar (ckFill / ckText / ckLine) ---------- */
  $$('[data-ds-checkout]').forEach(function (b) {
    var fill = $('[data-ck="fill"]', b), line = $('[data-ck="line"]', b);
    var set = function (on) {
      fill.style.transform = on ? 'scaleX(1)' : 'scaleX(0)';
      b.style.color = on ? '#0a0806' : '#ede3d1';
      line.style.width = on ? '34px' : '18px';
    };
    b.addEventListener('pointerenter', function () { set(true); });
    b.addEventListener('pointerleave', function () { set(false); });
    b.addEventListener('focus', function () { set(true); });
    b.addEventListener('blur', function () { set(false); });
  });

  /* ---------- roll (the page's counter tween) ---------- */
  function roll(el, dir) {
    if (!gsap || reduce || !el) return;
    gsap.fromTo(el, { yPercent: dir * 70, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.55, ease: 'power3.out', overwrite: true });
  }

  /* ---------- quantity stepper ---------- */
  var qty = $('[data-ds-qty]');
  if (qty) {
    var q = 1, qv = $('[data-qv]', qty), qt = $('[data-qt]', qty), qu = $('[data-qu]', qty), minus = $('[data-q="-1"]', qty);
    var money = function (n) { return '$' + n.toLocaleString('en-US'); };
    $$('[data-q]', qty).forEach(function (b) {
      b.addEventListener('click', function () {
        var d = +b.getAttribute('data-q'), n = Math.max(1, Math.min(99, q + d));
        if (n === q) return;
        q = n; qv.textContent = String(q).padStart(2, '0'); qt.textContent = money(q * 185);
        qu.textContent = q > 1 ? money(185) + ' EACH' : '';
        setBase(minus, 'opacity', q > 1 ? '1' : '0.3');
        roll(qv, d > 0 ? 1 : -1); roll(qt, d > 0 ? 1 : -1);
      });
    });
  }

  /* ---------- motion replays ---------- */
  var replays = {
    lines: function (r) { gsap.fromTo($$('[data-m]', r), { yPercent: 112 }, { yPercent: 0, duration: 1.9, ease: 'expo.out', stagger: 0.12, delay: 0.2 }); },
    wipe: function (r) { gsap.fromTo($('[data-m]', r), { clipPath: 'inset(-10% 100% -10% 0%)' }, { clipPath: 'inset(-10% 0% -10% 0%)', duration: 1.6, ease: 'expo.inOut' }); },
    converge: function (r) {
      gsap.fromTo($('[data-m="l"]', r), { opacity: 0, letterSpacing: '0.34em', xPercent: -8 }, { opacity: 1, letterSpacing: '0.02em', xPercent: 0, duration: 1.8, ease: 'none' });
      gsap.fromTo($('[data-m="r"]', r), { opacity: 0, letterSpacing: '0.34em', xPercent: 8 }, { opacity: 1, letterSpacing: '0.02em', xPercent: 0, duration: 1.8, ease: 'none' });
    },
    steps: function (r) {
      $$('[data-m]', r).forEach(function (el, i) {
        gsap.fromTo(el, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.8, ease: 'none', delay: i * 0.5 });
        gsap.fromTo($('[data-r]', el), { scaleX: 0 }, { scaleX: 1, duration: 0.9, ease: 'none', delay: i * 0.5 });
      });
    },
    rise: function (r) { gsap.from($$('[data-m]', r), { yPercent: 105, duration: 1.4, ease: 'expo.out', stagger: 0.12 }); }
  };
  if (gsap) {
    $$('[data-replay]').forEach(function (b) {
      var k = b.getAttribute('data-replay'), r = $('[data-ds-motion="' + k + '"]');
      b.addEventListener('click', function () { if (r && replays[k]) replays[k](r); });
    });
    var rc = 0, rollEl = $('[data-ds-roll]');
    $$('[data-roll]').forEach(function (b) {
      b.addEventListener('click', function () {
        var d = +b.getAttribute('data-roll'); if (rc + d < 0) return;
        rc += d; rollEl.textContent = rc; roll(rollEl, d);
      });
    });
    var dot = $('[data-ds-dot]');
    if (dot && !reduce) gsap.fromTo(dot, { yPercent: -100 }, { yPercent: 450, duration: 2.6, ease: 'power2.inOut', repeat: -1, repeatDelay: 0.4 });
  }

  /* ---------- Backgrounds: stage poses, footer ground, collection room ---------- */
  var POSE_NAME = { hero: 'HERO', scent: 'COMPOSITION', ritual: 'RITUAL', immersion: 'IMMERSION', craft: 'MATERIAL', final: 'FINAL' };
  $$('[data-pose]').forEach(function (b) {
    b.addEventListener('click', function () {
      $$('[data-pose]').forEach(function (x) { x.classList.toggle('is-on', x === b); });
      var id = b.getAttribute('data-pose');
      if (window.dsPose) window.dsPose(id);
      $('#ds-pose-flag').textContent = 'LIVE · ' + POSE_NAME[id] + ' POSE';
    });
  });
  var fgBtn = $('#ds-footground-btn'), fg = $('[data-ds-footground]');
  if (fgBtn && fg) fgBtn.addEventListener('click', function () {
    var on = fg.style.opacity !== '1'; fg.style.opacity = on ? '1' : '0'; fgBtn.classList.toggle('is-on', on);
  });
  var COLL_BG = ['#060504', '#0a0604', '#070609'], COLL_NAME = ['NOIR', 'EMBER', 'VEIL'];
  var room = $('#ds-room');
  if (room) $$('[data-room]').forEach(function (b) {
    b.addEventListener('click', function () {
      var j = +b.getAttribute('data-room');
      $$('[data-room]').forEach(function (x) { x.classList.toggle('is-on', x === b); });
      $$('[data-coll-atmos]', room).forEach(function (el, k) {
        if (gsap) gsap.to(el, { opacity: k === j ? 1 : 0, duration: 2, ease: 'power2.inOut' }); else el.style.opacity = k === j ? 1 : 0;
      });
      if (gsap) gsap.to(room, { backgroundColor: COLL_BG[j], duration: 2, ease: 'power2.inOut' }); else room.style.backgroundColor = COLL_BG[j];
      $('#ds-room-flag').textContent = 'EXPRESSION 0' + (j + 1) + ' · ' + COLL_NAME[j];
    });
  });

  /* ---------- folio: instant chapter switch (show + setWorld) and pointer tilt (frame) ---------- */
  var MAT = [
    { '--page': '#0b0a09', '--edge': 'rgba(232,178,90,.42)', '--sheen': 'rgba(255,226,180,.07)' },
    { '--page': '#130c08', '--edge': 'rgba(240,150,70,.72)', '--sheen': 'rgba(255,186,120,.10)' },
    { '--page': '#0b0a0d', '--edge': 'rgba(192,182,218,.40)', '--sheen': 'rgba(222,212,242,.07)' }
  ];
  var folioRoom = $('[data-ds-folio-room]'), folio = folioRoom && $('[data-folio]', folioRoom);
  if (folio) {
    var lps = $$('[data-lp]', folio), rps = $$('[data-rp]', folio), sel = 0;
    var show = function (list, k) { list.forEach(function (el, x) { el.style.visibility = x === k ? 'visible' : 'hidden'; }); };
    $$('[data-chapter]').forEach(function (b) {
      b.addEventListener('click', function () {
        var j = +b.getAttribute('data-chapter'); if (j === sel) return; sel = j;
        $$('[data-chapter]').forEach(function (x) { x.classList.toggle('is-on', x === b); });
        show(lps, j); show(rps, j);
        if (gsap && !reduce) {
          gsap.to(folioRoom, { backgroundColor: COLL_BG[j], duration: 2, ease: 'power2.inOut' });
          gsap.to(folio, Object.assign({ duration: 1.8, ease: 'power2.inOut' }, MAT[j]));
        } else {
          folioRoom.style.backgroundColor = COLL_BG[j];
          Object.keys(MAT[j]).forEach(function (k) { folio.style.setProperty(k, MAT[j][k]); });
        }
      });
    });
    /* detailDisp / idxDisp: the page hides the long copy when a page is narrower than 340px */
    var fit = function () {
      var narrow = folio.offsetWidth / 2 < 340;
      $$('[data-detail-disp]', folio).forEach(function (el) { el.style.display = narrow ? 'none' : 'flex'; });
      $$('[data-idx-disp]', folio).forEach(function (el) { el.style.display = narrow ? 'none' : 'inline'; });
    };
    addEventListener('resize', fit); fit();
    var tp = { x: 0, y: 0 }, tl = { x: 0, y: 0 }, fr = 0, last = 0;
    var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
    var frame = function (now) {
      var dt = Math.min(0.05, (now - last) / 1000 || 0.016); last = now;
      var f = Math.min(1, dt * 2.6);
      tl.x += (tp.x - tl.x) * f; tl.y += (tp.y - tl.y) * f;
      folio.style.transform = 'rotateX(' + (-tl.y * 2.2).toFixed(3) + 'deg) rotateY(' + (tl.x * 2.8).toFixed(3) + 'deg)';
      folio.style.setProperty('--hx', (50 + tl.x * 34).toFixed(1) + '%');
      folio.style.setProperty('--hy', (40 + tl.y * 30).toFixed(1) + '%');
      var rp = rps[sel], env = $('[data-env]', rp), bot = $('[data-bottle]', rp);
      if (env) env.style.transform = 'translate(' + (tl.x * -6).toFixed(2) + 'px,' + (tl.y * -4).toFixed(2) + 'px)';
      if (bot) bot.style.transform = 'translate(' + (tl.x * 5).toFixed(2) + 'px,' + (tl.y * 3).toFixed(2) + 'px)';
      var idle = Math.abs(tl.x - tp.x) + Math.abs(tl.y - tp.y) < 0.001;
      fr = idle ? 0 : requestAnimationFrame(frame);
    };
    var wake = function () { if (!fr && !reduce) { last = performance.now(); fr = requestAnimationFrame(frame); } };
    folioRoom.addEventListener('pointermove', function (e) {
      if (e.pointerType === 'touch') return;
      var r = folio.getBoundingClientRect();
      tp.x = clamp((e.clientX - (r.left + r.width / 2)) / (r.width / 2 + 160), -1, 1);
      tp.y = clamp((e.clientY - (r.top + r.height / 2)) / (r.height / 2 + 160), -1, 1);
      wake();
    });
    folioRoom.addEventListener('pointerleave', function () { tp.x = 0; tp.y = 0; wake(); });
  }

  /* ---------- WebGL specimens: the page's 3D CTA frames and the wordmark shader ---------- */
  var RAW = null;
  function ctaDoc() { if (!RAW && window.NOIR_THREEUI_CTA_B64) RAW = atob(window.NOIR_THREEUI_CTA_B64); return RAW; }
  function mount(f) {
    if (f._on || !ctaDoc()) return;
    f._on = true;
    var qs = '?id=' + f.dataset.threeuiCta + '&label=' + encodeURIComponent(f.dataset.threeuiLabel);
    if (f.dataset.dsHover) f.onload = function () { try { f.contentDocument.querySelector('.cta').classList.add('is-hover'); } catch (e) {} };
    f.srcdoc = RAW.replace('new URLSearchParams(location.search)', 'new URLSearchParams(' + JSON.stringify(qs) + ')');
  }
  function unmount(f) { if (!f._on) return; f._on = false; f.onload = null; f.removeAttribute('srcdoc'); }
  var ctas = $$('iframe[data-threeui-cta]', main), vis = new Set();
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) vis.add(e.target); else vis.delete(e.target); });
    sync();
  }, { rootMargin: '240px 0px' }) : null;
  function sync() { ctas.forEach(function (f) { if (live() && (!io || vis.has(f))) mount(f); else unmount(f); }); }
  if (io) ctas.forEach(function (f) { io.observe(f); });

  var wm = null, wmHost = $('[data-ds-wordmark]');
  function wordmark() {
    if (wm || !wmHost || reduce) return;
    var mod = window.__noirModules && window.__noirModules.noirWordmark;
    if (!mod) return;
    wm = 'pending';
    mod.createWordmark(wmHost).then(function (w) { wm = w; }).catch(function () { wm = null; });
  }
  function onMode() { sync(); if (live()) wordmark(); }
  addEventListener('ds:mode', onMode);
  onMode();
})();
