/* ================================================================ catalog routing
   Overview | Components. Overview is the live page in a borderless frame under the page's own glass header;
   Components parks that frame on its WebGL stage (the live background) and stacks the specimen groups. */
(function () {
  "use strict";
  var COMPONENTS_ENABLED = true;   /* Overview approved (orchestrated run) */
  var body = document.body, nav = document.getElementById('ds-nav'), frame = document.getElementById('overview-frame');
  var linkO = document.getElementById('nav-overview'), linkC = document.getElementById('nav-components');
  var main = document.getElementById('ds-main'), side = document.getElementById('ds-side');
  var bag = document.getElementById('ds-bag'), bagCount = document.getElementById('ds-bag-count');
  var isComp = function (h) { return h === '#components' || h.indexOf('#components-') === 0; };
  var mode = 'overview', pose = 'hero';
  if (!COMPONENTS_ENABLED) linkC.setAttribute('aria-disabled', 'true');

  function send(m) { try { frame.contentWindow.postMessage(m, '*'); } catch (e) {} }
  window.dsSend = send;
  function setNavB() {
    var r = nav.getBoundingClientRect();
    document.documentElement.style.setProperty('--ds-navb', Math.round(r.bottom + 14) + 'px');
  }
  addEventListener('resize', setNavB, { passive: true });
  setNavB();

  function post() { send({ ds: mode === 'components' ? 'bg' : 'page' }); send({ ds: 'pose', id: pose }); }
  window.dsPose = function (id) { pose = id; send({ ds: 'pose', id: id }); };
  function route() {
    var h = location.hash;
    if (isComp(h) && !COMPONENTS_ENABLED) { history.replaceState(null, '', location.pathname + location.search); h = ''; }
    mode = isComp(h) ? 'components' : 'overview';
    body.classList.toggle('is-components', mode === 'components');
    linkO.classList.toggle('is-active', mode === 'overview');
    linkC.classList.toggle('is-active', mode === 'components');
    if (linkO) linkO.setAttribute('aria-current', mode === 'overview' ? 'page' : 'false');
    if (linkC) linkC.setAttribute('aria-current', mode === 'components' ? 'page' : 'false');
    setNavB();
    post();
    window.dispatchEvent(new CustomEvent('ds:mode', { detail: mode }));
    if (mode !== 'components' || !main) { body.classList.remove('ds-scene-clear'); return; }
    if (h === '#components') { main.scrollTop = 0; spy(); return; }
    var el = document.getElementById(h.slice(1));
    if (el) main.scrollTop = el.offsetTop - 8;
    spy();
  }
  addEventListener('message', function (e) {
    if (e.source !== frame.contentWindow || !e.data) return;
    var d = e.data;
    if (d.ds === 'ready') body.classList.add('ds-overview-ready');
    else if (d.ds === 'bag') bagCount.textContent = String(d.n);
    else if (d.ds === 'bagOpen') body.classList.toggle('ds-bag-open', !!d.open);
  });
  frame.addEventListener('load', post);

  /* the header's BAG opens the page's own drawer; wheel over the header still scrolls the page */
  bag.addEventListener('click', function (e) { e.preventDefault(); if (mode === 'overview') send({ ds: 'openBag' }); });
  nav.addEventListener('wheel', function (e) { if (mode === 'overview') send({ ds: 'scrollBy', dy: e.deltaY }); }, { passive: true });
  /* the page's stage leans toward the pointer (T.px / T.py); forward it while the stage is the backdrop */
  var ptr = null, raf = 0;
  addEventListener('pointermove', function (e) {
    if (mode !== 'components' || e.pointerType === 'touch') return;
    ptr = { x: e.clientX / innerWidth, y: e.clientY / innerHeight };
    if (!raf) raf = requestAnimationFrame(function () { raf = 0; if (ptr) send({ ds: 'ptr', x: ptr.x, y: ptr.y }); });
  }, { passive: true });

  if (!main) { addEventListener('hashchange', route); route(); return; }

  /* sidebar follows the scroll; the scrim lifts over Backgrounds */
  var groups = [].slice.call(main.querySelectorAll('.ds-group'));
  var sideLinks = [].slice.call(side.querySelectorAll('a'));
  function spy() {
    if (!groups.length) return;
    var y = main.scrollTop + 160, cur = groups[0];
    groups.forEach(function (g) { if (g.offsetTop <= y) cur = g; });
    sideLinks.forEach(function (a) {
      var on = a.getAttribute('href') === '#' + cur.id;
      if (on && !a.classList.contains('is-current') && innerWidth <= 760) side.scrollLeft = a.offsetLeft - 16;
      a.classList.toggle('is-current', on);
    });
    body.classList.toggle('ds-scene-clear', cur.id === 'components-backgrounds');
  }
  main.addEventListener('scroll', spy, { passive: true });

  /* sidebar links scroll the view without leaving a history entry per group */
  side.addEventListener('click', function (e) {
    var a = e.target.closest('a[href^="#components-"]');
    if (!a) return;
    e.preventDefault();
    history.replaceState(null, '', a.getAttribute('href'));
    route();
  });

  /* specimens stay put: links and form submits never navigate */
  main.addEventListener('click', function (e) { var a = e.target.closest('a'); if (a) e.preventDefault(); }, true);
  main.addEventListener('submit', function (e) { e.preventDefault(); }, true);

  addEventListener('hashchange', route);
  route();
})();
