(function(){
  "use strict";

  /* ---------- Always come back to the initial state on refresh ----------
     Browsers restore scroll position (and can restore the whole page from
     bfcache on back/forward) by default, which leaves the nav, dropdowns,
     panels, and carousel wherever they were left. Force a clean start. ---------- */
  if ('scrollRestoration' in history) { history.scrollRestoration = 'manual'; }
  window.scrollTo(0, 0);

  /* ---------- Loader ---------- */
  var loaderWrapper = document.getElementById('loader-wrapper');
  var mainContent = document.getElementById('main-content');
  var progressFill = document.getElementById('progressFill');
  var progressPercent = document.getElementById('loaderPercent');
  document.body.classList.add('loading');

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var loaderDuration = reduceMotion ? 0 : 1800;
  var loaderStart = null;
  var loaderDone = false;

  function tickProgress(ts){
    if (loaderDone) return;
    if (loaderStart === null) loaderStart = ts;
    var elapsed = ts - loaderStart;
    var pct = loaderDuration ? Math.min(99, Math.round((elapsed / loaderDuration) * 99)) : 99;
    progressFill.style.width = pct + '%';
    progressPercent.textContent = pct + '%';
    if (pct < 99) requestAnimationFrame(tickProgress);
  }
  requestAnimationFrame(tickProgress);

  function finishLoad(){
    if (loaderDone) return;
    loaderDone = true;
    progressFill.style.width = '100%';
    progressPercent.textContent = '100%';
    setTimeout(function(){
      loaderWrapper.classList.add('slide-out');
      mainContent.classList.add('show');
      setTimeout(function(){
        loaderWrapper.style.display = 'none';
        document.body.classList.remove('loading');
      }, 800);
    }, 220);
  }
  setTimeout(finishLoad, Math.max(loaderDuration, 1200));

  /* ---------- Section routing (About dropdown "toggle" + top nav) ----------
     All content now lives on one continuous Home page. Nav items keep the
     exact same click/hover/active/close behavior as before — they just
     scroll to their target section instead of hiding/showing pages. ---------- */
  var sections = Array.from(document.querySelectorAll('.page-section'));
  var navTargets = Array.from(document.querySelectorAll('[data-target]'));
  var aboutIds = ['company', 'vision-mission', 'goals-objectives', 'team'];

  function setActive(id){
    navTargets.forEach(function(link){
      link.classList.toggle('active', link.getAttribute('data-target') === id);
    });
    var aboutToggleBtn = document.getElementById('aboutToggle');
    aboutToggleBtn.classList.toggle('active', aboutIds.indexOf(id) !== -1);
  }

  var desktopMQ = window.matchMedia('(min-width: 881px)');

  function showSection(id){
    var target = document.getElementById(id);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setActive(id);

    navLinks.classList.remove('nav-open');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
    aboutDropdown.classList.remove('open');
    document.getElementById('aboutToggle').setAttribute('aria-expanded', 'false');
  }

  navTargets.forEach(function(link){
    link.addEventListener('click', function(e){
      e.preventDefault();
      showSection(this.getAttribute('data-target'));

      /* On desktop the About panel is hover-only. Without this, picking
         an item (e.g. "Our Team") leaves the panel visibly hanging over
         the page while it scrolls, since the cursor hasn't moved off it
         yet. Force it to vanish immediately, then release the override
         once the cursor actually leaves so hovering back in still works. */
      if (desktopMQ.matches && aboutDropdown.contains(this)){
        aboutDropdown.classList.add('closing');
        aboutDropdown.addEventListener('mouseleave', function handler(){
          aboutDropdown.classList.remove('closing');
        }, { once: true });
        setTimeout(function(){ aboutDropdown.classList.remove('closing'); }, 900);
      }
    });
  });

  document.getElementById('logoHome').addEventListener('click', function(){ showSection('home'); });

  /* Scrollspy keeps the same active-state behavior in sync while the
     visitor scrolls manually, without changing how any nav control works. */
  var spyObserver = new IntersectionObserver(function(entries){
    entries.forEach(function(entry){
      if (entry.isIntersecting) setActive(entry.target.id);
    });
  }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
  sections.forEach(function(sec){ spyObserver.observe(sec); });

  /* ---------- About dropdown toggle ---------- */
  var aboutDropdown = document.getElementById('aboutDropdown');
  var aboutToggle = document.getElementById('aboutToggle');
  aboutToggle.addEventListener('click', function(e){
    e.stopPropagation();
    /* On desktop, About only ever opens on hover — the button itself
       isn't a toggle, so a click does nothing there. Mobile has no
       hover, so it still needs the click-to-expand accordion. */
    if (desktopMQ.matches) return;
    var isOpen = aboutDropdown.classList.toggle('open');
    aboutToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
  });
  document.addEventListener('click', function(e){
    if (!aboutDropdown.contains(e.target)) {
      aboutDropdown.classList.remove('open');
      aboutToggle.setAttribute('aria-expanded', 'false');
    }
  });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape') {
      aboutDropdown.classList.remove('open');
      aboutToggle.setAttribute('aria-expanded', 'false');
    }
  });

  /* ---------- Mobile nav ---------- */
  var navToggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');
  function closeMobileNav(){
    navLinks.classList.remove('nav-open');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
  }
  navToggle.addEventListener('click', function(){
    var isOpen = navLinks.classList.toggle('nav-open');
    navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    document.body.classList.toggle('menu-open', isOpen);
  });
  document.addEventListener('keydown', function(e){
    if (e.key === 'Escape') closeMobileNav();
  });

  /* ---------- Dialog helpers ---------- */
  function wireDialog(dialogId, openTriggers){
    var dialog = document.getElementById(dialogId);
    if (!dialog) return;
    openTriggers.forEach(function(trigger){
      if (!trigger) return;
      trigger.addEventListener('click', function(e){
        e.preventDefault();
        dialog.showModal();
      });
    });
    dialog.querySelectorAll('[data-close]').forEach(function(btn){
      btn.addEventListener('click', function(){ dialog.close(); });
    });
    dialog.addEventListener('click', function(e){
      if (e.target === dialog) dialog.close();
    });
  }

  wireDialog('privacyDialog', [document.getElementById('openPrivacy')]);
  wireDialog('termsDialog', [document.getElementById('openTerms')]);
  wireDialog('helpDialog', [document.getElementById('helpBtn'), document.getElementById('openHelp2')]);
  wireDialog('videoDialog', [document.getElementById('openVideo')]);

  var videoDialog = document.getElementById('videoDialog');
  var modalVideo = document.getElementById('modalVideo');
  videoDialog.addEventListener('close', function(){ modalVideo.pause(); modalVideo.currentTime = 0; });
  videoDialog.addEventListener('cancel', function(){ modalVideo.pause(); });

  /* ---------- Feedback panel ---------- */
  var feedbackPanel = document.getElementById('feedbackPanel');
  var feedbackToggle = document.getElementById('feedbackToggle');
  var feedbackClose = document.getElementById('feedbackClose');
  var feedbackBackdrop = document.getElementById('feedbackBackdrop');
  function openFeedback(){
    feedbackPanel.classList.add('open');
    feedbackPanel.setAttribute('aria-hidden','false');
    feedbackBackdrop.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeFeedback(){
    feedbackPanel.classList.remove('open');
    feedbackPanel.setAttribute('aria-hidden','true');
    feedbackBackdrop.classList.remove('open');
    document.body.style.overflow = '';
  }
  feedbackToggle.addEventListener('click', openFeedback);
  feedbackClose.addEventListener('click', closeFeedback);
  feedbackBackdrop.addEventListener('click', closeFeedback);
  document.addEventListener('keydown', function(e){ if (e.key === 'Escape') closeFeedback(); });

  /* Feedback type selector */
  var fbTypeButtons = document.querySelectorAll('#fbType .fb-type-btn');
  var fbTypeValue = 'general';
  fbTypeButtons.forEach(function(btn){
    btn.addEventListener('click', function(){
      fbTypeButtons.forEach(function(b){ b.classList.remove('active'); });
      btn.classList.add('active');
      fbTypeValue = btn.getAttribute('data-value');
    });
  });

  /* Star rating */
  var fbStarButtons = document.querySelectorAll('#fbStars button');
  var fbRatingValue = 0;
  function paintStars(value){
    fbStarButtons.forEach(function(btn){
      btn.classList.toggle('filled', Number(btn.getAttribute('data-value')) <= value);
    });
  }
  fbStarButtons.forEach(function(btn){
    btn.addEventListener('click', function(){
      fbRatingValue = Number(btn.getAttribute('data-value'));
      paintStars(fbRatingValue);
    });
    btn.addEventListener('mouseenter', function(){ paintStars(Number(btn.getAttribute('data-value'))); });
  });
  document.getElementById('fbStars').addEventListener('mouseleave', function(){ paintStars(fbRatingValue); });

  /* Comment character counter */
  var fbComment = document.getElementById('fbComment');
  var fbCommentCount = document.getElementById('fbCommentCount');
  fbComment.addEventListener('input', function(){ fbCommentCount.textContent = fbComment.value.length; });

  document.getElementById('feedbackForm').addEventListener('submit', function(e){
    e.preventDefault();
    document.getElementById('feedbackSuccess').style.display = 'flex';
    this.reset();
    fbTypeButtons.forEach(function(b){ b.classList.remove('active'); });
    fbTypeButtons[0].classList.add('active');
    fbTypeValue = 'general';
    fbRatingValue = 0;
    paintStars(0);
    fbCommentCount.textContent = '0';
    setTimeout(function(){
      document.getElementById('feedbackSuccess').style.display = 'none';
      closeFeedback();
    }, 2200);
  });

  /* ---------- Carousel (seamless infinite loop) ---------- */
  var track = document.getElementById('carouselTrack');
  var realSlides = Array.from(track ? track.children : []);
  var dotsWrap = document.getElementById('carouselDots');
  var timer;
  var resetCarousel = function(){}; // reassigned below if slides exist

  if (realSlides.length){
    var count = realSlides.length;

    // Clone the first and last slides so the track can slide continuously
    // past either end, then snap back invisibly — this is what makes the
    // loop feel continuous instead of jumping backwards on wrap.
    var firstClone = realSlides[0].cloneNode(true);
    var lastClone = realSlides[count - 1].cloneNode(true);
    firstClone.setAttribute('aria-hidden', 'true');
    lastClone.setAttribute('aria-hidden', 'true');
    track.appendChild(firstClone);
    track.insertBefore(lastClone, track.firstChild);

    // current is an index into the track's children (0 = lastClone,
    // 1..count = real slides, count+1 = firstClone)
    var current = 1;

    realSlides.forEach(function(_, i){
      var dot = document.createElement('button');
      dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
      if (i === 0) dot.classList.add('active');
      dot.addEventListener('click', function(){ goTo(i); resetTimer(); });
      dotsWrap.appendChild(dot);
    });

    function render(withTransition){
      track.classList.toggle('no-transition', !withTransition);
      track.style.transform = 'translateX(-' + (current * 100) + '%)';
      var realIndex = (current - 1 + count) % count;
      Array.from(dotsWrap.children).forEach(function(d, i){ d.classList.toggle('active', i === realIndex); });
    }

    function goTo(i){ current = i + 1; render(true); }
    function next(){ current++; render(true); }
    function prev(){ current--; render(true); }

    // When the track finishes sliding onto a clone, snap invisibly back
    // to the matching real slide so the very next transition can continue
    // in the same direction — this is the seamless loop.
    track.addEventListener('transitionend', function(){
      if (current === count + 1){ current = 1; render(false); }
      else if (current === 0){ current = count; render(false); }
    });

    function resetTimer(){ clearInterval(timer); timer = setInterval(next, 5500); }

    document.getElementById('carouselNext').addEventListener('click', function(){ next(); resetTimer(); });
    document.getElementById('carouselPrev').addEventListener('click', function(){ prev(); resetTimer(); });

    var carouselEl = document.getElementById('carousel');
    carouselEl.addEventListener('mouseenter', function(){ clearInterval(timer); });
    carouselEl.addEventListener('mouseleave', resetTimer);

    var startX = null;
    var dragging = false;
    var dragDelta = 0;
    var trackWidth = 0;

    function dragStart(clientX){
      dragging = true;
      startX = clientX;
      dragDelta = 0;
      trackWidth = track.getBoundingClientRect().width;
      clearInterval(timer);
      track.classList.add('no-transition');
    }
    function dragMove(clientX){
      if (!dragging) return;
      dragDelta = clientX - startX;
      var percent = (dragDelta / trackWidth) * 100;
      track.style.transform = 'translateX(calc(-' + (current * 100) + '% + ' + percent + '%))';
    }
    function dragEnd(){
      if (!dragging) return;
      dragging = false;
      track.classList.remove('no-transition');
      if (Math.abs(dragDelta) > trackWidth * 0.12){
        dragDelta < 0 ? next() : prev();
      } else {
        render(true);
      }
      dragDelta = 0;
      resetTimer();
    }

    // Touch (mobile swipe)
    track.addEventListener('touchstart', function(e){ dragStart(e.touches[0].clientX); }, { passive: true });
    track.addEventListener('touchmove', function(e){ dragMove(e.touches[0].clientX); }, { passive: true });
    track.addEventListener('touchend', dragEnd);

    // Mouse (click-and-drag / swipe with a mouse)
    track.addEventListener('mousedown', function(e){ e.preventDefault(); dragStart(e.clientX); });
    window.addEventListener('mousemove', function(e){ if (dragging) dragMove(e.clientX); });
    window.addEventListener('mouseup', dragEnd);
    track.querySelectorAll('img').forEach(function(img){ img.setAttribute('draggable', 'false'); });
    track.style.cursor = 'grab';
    track.addEventListener('mousedown', function(){ track.style.cursor = 'grabbing'; });
    window.addEventListener('mouseup', function(){ track.style.cursor = 'grab'; });

    render(false);
    resetTimer();

    resetCarousel = function(){ current = 1; render(false); resetTimer(); };
  }

  /* ---------- Scroll to top ---------- */
  var toTop = document.getElementById('toTop');
  window.addEventListener('scroll', function(){
    toTop.classList.toggle('show', window.scrollY > 400);
  }, { passive: true });
  toTop.addEventListener('click', function(){
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ---------- Reset to initial state ----------
     Covers the case where a browser restores this page from bfcache on
     back/forward navigation instead of re-running the script from scratch —
     without this, panels/dropdowns/carousel position could stay wherever
     they were left. A normal refresh already re-runs everything above. ---------- */
  function resetToInitialState(){
    window.scrollTo(0, 0);
    navLinks.classList.remove('nav-open');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
    aboutDropdown.classList.remove('open');
    aboutToggle.setAttribute('aria-expanded', 'false');
    closeFeedback();
    document.querySelectorAll('dialog[open]').forEach(function(d){ d.close(); });
    setActive('home');
    resetCarousel();
  }
  window.addEventListener('pageshow', function(e){
    if (e.persisted) resetToInitialState();
  });

})();
