/* ============================================================
   ALTUS VERA — script.js (v2)
   Layered hero parallax (skylines + dashboard at different
   depths, plus gentle pointer drift), cinematic background
   parallax, scroll reveals, count-up stats, engagement-steps
   progress, FAQ accordion, and the mobile menu.
   Everything respects prefers-reduced-motion.
   ============================================================ */

(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  document.addEventListener('DOMContentLoaded', function () {

    /* ---------------- Mobile menu ---------------- */
    var pill = document.querySelector('.nav-pill');
    var toggle = document.getElementById('nav-toggle');
    var links = document.getElementById('nav-links');

    /* ---------------- Nav scroll state ----------------
       The floating pill tightens up (more opaque, stronger shadow) once the
       page has scrolled a little, a small "premium template" touch. */
    if (pill) {
      var updateNavScrolled = function () {
        pill.classList.toggle('is-scrolled', window.scrollY > 40);
      };
      window.addEventListener('scroll', updateNavScrolled, { passive: true });
      updateNavScrolled();
    }

    if (pill && toggle && links) {
      toggle.addEventListener('click', function () {
        var open = pill.classList.toggle('menu-open');
        toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
        toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      });

      links.addEventListener('click', function (e) {
        if (e.target.closest('a')) {
          pill.classList.remove('menu-open');
          toggle.setAttribute('aria-expanded', 'false');
        }
      });

      document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && pill.classList.contains('menu-open')) {
          pill.classList.remove('menu-open');
          toggle.setAttribute('aria-expanded', 'false');
          toggle.focus();
        }
      });
    }


    /* ---------------- Hero parallax ----------------
       Layers carry data-depth and drift relative to scroll from
       the very first pixel: the sky recedes (0.30), the far
       skyline sinks gently (0.16), the dashboard rises out of
       the valley (-0.05), and the near skyline stays anchored.
       A gentle pointer drift (desktop only) adds life on top.  */
    var hero = document.querySelector('.hero');
    var spotlight = document.getElementById('hero-spotlight');
    var layers = hero ? Array.prototype.slice.call(hero.querySelectorAll('[data-depth]')) : [];
    var cineBgs = Array.prototype.slice.call(document.querySelectorAll('[data-parallax-speed]'));

    var pointerX = 0, pointerY = 0;   // -1 .. 1, eased toward target
    var targetX = 0, targetY = 0;
    var ticking = false;
    var pointerRaf = null;

    function applyParallax() {
      ticking = false;
      var y = window.scrollY;
      var vh = window.innerHeight;

      if (hero && y < hero.offsetHeight + 100) {
        layers.forEach(function (el) {
          var depth = parseFloat(el.getAttribute('data-depth')) || 0;
          var isSky = el.classList.contains('hero-sky');
          // stage layers are centered with translateX(-50%); the sky is full-bleed
          var base = isSky ? '' : 'translateX(-50%) ';
          var drift = y * depth;
          // pointer drift skips the sky so its edges never peek in
          var px = isSky ? 0 : pointerX * depth * 46;
          var py = isSky ? 0 : pointerY * depth * 22;
          el.style.transform = base +
            'translate3d(' + px.toFixed(1) + 'px,' + (drift + py).toFixed(1) + 'px,0)';
        });
      }

      cineBgs.forEach(function (el) {
        var rect = el.parentElement.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > vh) return;
        var speed = parseFloat(el.getAttribute('data-parallax-speed')) || 0;
        var offset = (rect.top + rect.height / 2 - vh / 2) * speed;
        el.style.transform = 'translate3d(0,' + offset.toFixed(1) + 'px,0)';
      });
    }

    function requestParallax() {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(applyParallax);
      }
    }

    function easePointer() {
      pointerX += (targetX - pointerX) * 0.08;
      pointerY += (targetY - pointerY) * 0.08;
      requestParallax();
      if (Math.abs(targetX - pointerX) > 0.001 || Math.abs(targetY - pointerY) > 0.001) {
        pointerRaf = window.requestAnimationFrame(easePointer);
      } else {
        pointerRaf = null;
      }
    }

    if (!reducedMotion && (layers.length || cineBgs.length)) {
      window.addEventListener('scroll', requestParallax, { passive: true });
      window.addEventListener('resize', requestParallax);

      // Pointer drift only where a fine pointer exists (desktop)
      if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
        if (hero) {
          hero.addEventListener('mousemove', function (e) {
            targetX = (e.clientX / window.innerWidth) * 2 - 1;
            targetY = (e.clientY / window.innerHeight) * 2 - 1;
            if (!pointerRaf) pointerRaf = window.requestAnimationFrame(easePointer);

            if (spotlight) {
              var heroRect = hero.getBoundingClientRect();
              spotlight.style.setProperty('--mx', ((e.clientX - heroRect.left) / heroRect.width) * 100 + '%');
              spotlight.style.setProperty('--my', ((e.clientY - heroRect.top) / heroRect.height) * 100 + '%');
              spotlight.classList.add('is-active');
            }
          });
          hero.addEventListener('mouseleave', function () {
            targetX = 0;
            targetY = 0;
            if (!pointerRaf) pointerRaf = window.requestAnimationFrame(easePointer);
            if (spotlight) spotlight.classList.remove('is-active');
          });
        }
      }

      applyParallax();
    }


    /* ---------------- Scroll reveals ---------------- */
    var revealEls = document.querySelectorAll('.reveal');

    if (reducedMotion || !('IntersectionObserver' in window)) {
      revealEls.forEach(function (el) { el.classList.add('is-visible'); });
    } else {
      var revealObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

      revealEls.forEach(function (el) { revealObserver.observe(el); });
    }


    /* ---------------- Count-up stats (true metrics only) ---------------- */
    var counters = document.querySelectorAll('[data-count-to]');

    function animateCount(el) {
      var target = parseInt(el.getAttribute('data-count-to'), 10);
      var duration = 1600;
      var start = null;

      function tick(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3); // cubic out
        el.textContent = Math.round(eased * target);
        if (p < 1) window.requestAnimationFrame(tick);
      }
      window.requestAnimationFrame(tick);
    }

    if (reducedMotion || !('IntersectionObserver' in window)) {
      counters.forEach(function (el) {
        el.textContent = el.getAttribute('data-count-to');
      });
    } else {
      var counted = new WeakSet();
      var statObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting && !counted.has(entry.target)) {
            counted.add(entry.target);
            animateCount(entry.target);
            statObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.4 });

      counters.forEach(function (el) { statObserver.observe(el); });
    }


    /* ---------------- Challenge dial: scroll-scrubbed before/after ----------------
       .dial-sticky is pinned by plain CSS position:sticky (no scroll-jacking
       JS); this just reads how far scroll has moved through the tall
       .dial-scroller runway and uses that progress to crossfade the card
       and knob. The knob stays in a fixed position/rotation — only the two
       images crossfade; the knob does not spin between the two
       states. Reduced-motion skips this
       entirely — the CSS reduced-motion rules already show the settled
       "after" state statically, and if this kept running its inline
       styles would win over those CSS rules and reintroduce motion. */
    var dialScroller = document.getElementById('dial-scroller');
    var dialFaceBefore = document.getElementById('dial-face-before');
    var dialFaceAfter = document.getElementById('dial-face-after');
    var dialKnobBefore = document.getElementById('dial-knob-before');
    var dialKnobAfter = document.getElementById('dial-knob-after');
    var dialLabelBefore = document.getElementById('dial-label-before');
    var dialLabelAfter = document.getElementById('dial-label-after');

    function updateDial() {
      var rect = dialScroller.getBoundingClientRect();
      var vh = window.innerHeight;
      var total = rect.height - vh;
      var progress = total > 0 ? Math.min(Math.max(-rect.top / total, 0), 1) : 0;

      // Crossfade only happens in a band of the scroll range, so the dial
      // holds a clean "before" beat long enough to read fully, then a
      // shorter "after" beat, with the transition itself landing in
      // between rather than smearing the whole scroll. Before-hold gets
      // the largest share (0-0.55) so the before state is never cut off
      // early; after-hold is deliberately shorter (0.8-1) so it doesn't
      // linger long before releasing into the next section.
      var t = Math.min(Math.max((progress - 0.55) / 0.25, 0), 1);
      var eased = t * t * (3 - 2 * t); // smoothstep

      dialFaceBefore.style.opacity = 1 - eased;
      dialFaceAfter.style.opacity = eased;
      dialKnobBefore.style.opacity = 1 - eased;
      dialKnobAfter.style.opacity = eased;
      dialLabelBefore.classList.toggle('is-active', eased < 0.5);
      dialLabelAfter.classList.toggle('is-active', eased >= 0.5);
    }

    if (dialScroller && dialFaceBefore && dialFaceAfter && !reducedMotion) {
      var dialTicking = false;
      var requestDialUpdate = function () {
        if (!dialTicking) {
          dialTicking = true;
          window.requestAnimationFrame(function () { dialTicking = false; updateDial(); });
        }
      };
      window.addEventListener('scroll', requestDialUpdate, { passive: true });
      window.addEventListener('resize', requestDialUpdate);
      updateDial();
    }


    /* ---------------- Engagement steps progress ---------------- */
    var steps = document.getElementById('steps');
    var stepsFill = document.getElementById('steps-fill');
    var stepEls = document.querySelectorAll('[data-step]');

    function updateSteps() {
      if (!steps || !stepsFill) return;
      var rect = steps.getBoundingClientRect();
      var vh = window.innerHeight;
      var visible = vh * 0.75 - rect.top;
      var pct = Math.min(Math.max(visible / rect.height, 0), 1) * 100;

      stepsFill.style.width = pct + '%';
      // the glow pulse only rides the line while it's mid-draw, not parked at
      // either end
      stepsFill.classList.toggle('is-live', pct > 1 && pct < 99.5);
      stepEls.forEach(function (el, i) {
        var threshold = (i / stepEls.length) * 100 + 4;
        el.classList.toggle('is-active', pct >= threshold);
      });
    }

    if (steps && stepsFill) {
      if (reducedMotion) {
        stepsFill.style.width = '100%';
        stepEls.forEach(function (el) { el.classList.add('is-active'); });
      } else {
        window.addEventListener('scroll', updateSteps, { passive: true });
        updateSteps();
      }
    }


    /* ---------------- In-view triggers (skyline rise, serve rail draw) ----------------
       A lightweight observer that flips [data-inview] elements to .is-in the
       first time they enter, so purely-decorative CSS animations (the skyline
       growing up, the "who we serve" connector line drawing across) fire once
       and stay settled. */
    var skylineBars = document.querySelectorAll('.cine-bars > *');
    skylineBars.forEach(function (b, i) { b.style.setProperty('--bi', i); });

    var inviewEls = document.querySelectorAll('[data-inview]');
    if (reducedMotion || !('IntersectionObserver' in window)) {
      inviewEls.forEach(function (el) { el.classList.add('is-in'); });
    } else {
      var inviewObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-in');
            inviewObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.18, rootMargin: '0px 0px -60px 0px' });
      inviewEls.forEach(function (el) { inviewObserver.observe(el); });
    }


    /* ---------------- Magnetic buttons ----------------
       Desktop-only premium touch: the hero and final-CTA primary
       buttons pull gently toward the cursor (capped to 1-2 focal elements per
       screen so it stays a highlight, not noise). Relies on the existing CSS
       transform transitions to smooth between mousemove samples. */
    if (!reducedMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
      var magneticEls = Array.prototype.slice.call(document.querySelectorAll('.hero-actions .btn-primary, .cta-content .btn'));
      magneticEls.forEach(function (el) {
        var strength = 0.3, maxPull = 14;
        el.addEventListener('mousemove', function (e) {
          var r = el.getBoundingClientRect();
          var dx = Math.max(-maxPull, Math.min(maxPull, (e.clientX - (r.left + r.width / 2)) * strength));
          var dy = Math.max(-maxPull, Math.min(maxPull, (e.clientY - (r.top + r.height / 2)) * strength));
          el.style.transform = 'translate3d(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px,0)';
        });
        el.addEventListener('mouseleave', function () { el.style.transform = ''; });
      });
    }


    /* ---------------- FAQ accordion ---------------- */
    var faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(function (item) {
      var q = item.querySelector('.faq-q');
      var a = item.querySelector('.faq-a');
      if (!q || !a) return;

      q.addEventListener('click', function () {
        var isOpen = item.classList.contains('is-open');

        faqItems.forEach(function (other) {
          other.classList.remove('is-open');
          other.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
          other.querySelector('.faq-a').style.maxHeight = null;
        });

        if (!isOpen) {
          item.classList.add('is-open');
          q.setAttribute('aria-expanded', 'true');
          a.style.maxHeight = a.scrollHeight + 'px';
        }
      });
    });

  });

})();
