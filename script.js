// ===== Nordcode · interactions =====
(function () {
  "use strict";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Year
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Header state via top sentinel (no scroll listener)
  var header = document.querySelector(".site-header");
  var sentinel = document.getElementById("top-sentinel");
  if (header && "IntersectionObserver" in window) {
    if (!sentinel) {
      sentinel = document.createElement("div");
      sentinel.id = "top-sentinel";
      document.body.prepend(sentinel);
    }
    sentinel.style.cssText = "position:absolute;top:0;left:0;width:1px;height:1px;";
    new IntersectionObserver(function (entries) {
      header.classList.toggle("scrolled", !entries[0].isIntersecting);
    }).observe(sentinel);
  } else if (header) {
    header.classList.add("scrolled");
  }

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

  // Scroll reveal
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduceMotion) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          var sibs = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
          el.style.transitionDelay = Math.min(sibs * 55, 220) + "ms";
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
        var start = performance.now(), dur = 1200;
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

  // FAQ: single-open accordion
  document.querySelectorAll(".accordion details").forEach(function (d) {
    d.addEventListener("toggle", function () {
      if (d.open) {
        document.querySelectorAll(".accordion details[open]").forEach(function (o) {
          if (o !== d) o.open = false;
        });
      }
    });
  });

  // Contact form (FormSubmit AJAX)
  var form = document.querySelector(".contact-form");
  if (form) {
    var status = form.querySelector(".form-status");
    var submitBtn = form.querySelector('button[type="submit"]');
    function t(key) {
      var lang = document.documentElement.lang === "en" ? "en" : "da";
      return (window.I18N && I18N[lang] && I18N[lang][key]) || "";
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.querySelector("#name");
      var email = form.querySelector("#email");
      var message = form.querySelector("#message");
      var honey = form.querySelector('[name="_honey"]');

      if (!name.value.trim() || !email.value.trim() || !message.value.trim()) {
        status.textContent = t("msg.required");
        status.style.color = "#e0a15e"; return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
        status.textContent = t("msg.invalid");
        status.style.color = "#e0a15e"; return;
      }
      if (honey && honey.value) { return; }

      var data = new FormData();
      data.append("name", name.value.trim());
      data.append("email", email.value.trim());
      data.append("message", message.value.trim());
      data.append("_subject", "Ny henvendelse fra nordcodestudio.com");
      data.append("_template", "table");
      data.append("_captcha", "false");

      status.style.color = "";
      status.textContent = t("msg.sending");
      if (submitBtn) submitBtn.disabled = true;

      fetch("https://formsubmit.co/ajax/csgogammer38@gmail.com", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: data
      })
        .then(function (res) { return res.ok ? res.json() : Promise.reject(res); })
        .then(function () {
          status.style.color = "";
          status.textContent = t("msg.thanks").replace("{name}", name.value.trim().split(" ")[0]);
          form.reset();
        })
        .catch(function () {
          status.style.color = "#e0a15e";
          status.textContent = t("msg.error");
        })
        .finally(function () {
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  }
})();
