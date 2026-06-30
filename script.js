// ===== Nordcode — interactions =====
(function () {
  "use strict";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Year
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Header background + scroll progress
  var header = document.querySelector(".site-header");
  var progress = document.querySelector(".scroll-progress");
  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle("scrolled", y > 20);
    if (progress) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      progress.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
    }
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  // Mobile nav
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.querySelector(".nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  // Cursor glow (desktop / fine pointer only)
  var glow = document.querySelector(".cursor-glow");
  if (glow && window.matchMedia("(pointer: fine)").matches && !reduceMotion) {
    var gx = 0, gy = 0, cx = 0, cy = 0, raf = null;
    window.addEventListener("mousemove", function (e) {
      gx = e.clientX; gy = e.clientY;
      if (!raf) raf = requestAnimationFrame(follow);
    });
    function follow() {
      cx += (gx - cx) * 0.15; cy += (gy - cy) * 0.15;
      glow.style.transform = "translate3d(" + cx + "px," + cy + "px,0)";
      raf = Math.abs(gx - cx) > 0.5 || Math.abs(gy - cy) > 0.5 ? requestAnimationFrame(follow) : null;
    }
  }

  // Scroll reveal
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          // subtle stagger within a shared parent
          var sibs = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
          el.style.transitionDelay = Math.min(sibs * 60, 240) + "ms";
          el.classList.add("in");
          io.unobserve(el);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  // Animated counters
  var counters = document.querySelectorAll(".stat-num");
  if (counters.length && "IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var el = entry.target;
        cio.unobserve(el);
        var target = parseFloat(el.getAttribute("data-count")) || 0;
        function suf() {
          var lang = document.documentElement.lang === "en" ? "en" : "da";
          return el.getAttribute("data-suffix-" + lang) || el.getAttribute("data-suffix") || "";
        }
        if (reduceMotion) { el.textContent = target + suf(); el.dataset.counted = "1"; return; }
        var start = performance.now(), dur = 1400;
        (function tick(now) {
          var p = Math.min((now - start) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased) + suf();
          if (p < 1) requestAnimationFrame(tick);
          else el.dataset.counted = "1";
        })(start);
      });
    }, { threshold: 0.5 });
    counters.forEach(function (el) { cio.observe(el); });
  }

  // Hero constellation canvas
  var canvas = document.querySelector(".hero-canvas");
  if (canvas && !reduceMotion) {
    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var pts = [], W = 0, H = 0, animId = null;
    function resize() {
      var r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.min(Math.floor((W * H) / 16000), 70);
      pts = [];
      for (var i = 0; i < count; i++) {
        pts.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25 });
      }
    }
    function draw() {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < pts.length; i++) {
        var p = pts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > W) p.vx *= -1;
        if (p.y < 0 || p.y > H) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.4, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(122,255,209,0.55)";
        ctx.fill();
        for (var j = i + 1; j < pts.length; j++) {
          var q = pts[j], dx = p.x - q.x, dy = p.y - q.y, d = dx * dx + dy * dy;
          if (d < 16000) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
            ctx.strokeStyle = "rgba(86,199,255," + (0.16 * (1 - d / 16000)) + ")";
            ctx.lineWidth = 1; ctx.stroke();
          }
        }
      }
      animId = requestAnimationFrame(draw);
    }
    resize();
    draw();
    var rt;
    window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(resize, 200); });
    // pause when hero off-screen
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) {
        if (e[0].isIntersecting) { if (!animId) draw(); }
        else if (animId) { cancelAnimationFrame(animId); animId = null; }
      }, { threshold: 0 }).observe(canvas);
    }
  }

  // FAQ: smooth open/close height
  document.querySelectorAll(".accordion details").forEach(function (d) {
    d.addEventListener("toggle", function () {
      // close others (single-open accordion)
      if (d.open) {
        document.querySelectorAll(".accordion details[open]").forEach(function (o) {
          if (o !== d) o.open = false;
        });
      }
    });
  });

  // Contact form
  var form = document.querySelector(".contact-form");
  if (form) {
    var status = form.querySelector(".form-status");
    function t(key) {
      var lang = document.documentElement.lang === "en" ? "en" : "da";
      return (window.I18N && I18N[lang] && I18N[lang][key]) || "";
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.querySelector("#name");
      var email = form.querySelector("#email");
      var message = form.querySelector("#message");
      if (!name.value.trim() || !email.value.trim() || !message.value.trim()) {
        status.textContent = t("msg.required");
        status.style.color = "#ffb86b"; return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
        status.textContent = t("msg.invalid");
        status.style.color = "#ffb86b"; return;
      }
      status.style.color = "";
      status.textContent = t("msg.thanks").replace("{name}", name.value.trim().split(" ")[0]);
      form.reset();
    });
  }
})();
