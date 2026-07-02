// ===== Nordcode · interactions =====
(function () {
  "use strict";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function lang() {
    return (window.NordLang && window.NordLang.current()) || (document.documentElement.lang === "en" ? "en" : "da");
  }
  function L(da, en) { return lang() === "en" ? en : da; }

  // Year
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  function glitchOnce(el) {
    if (reduceMotion || !el) return;
    el.classList.add("glitching");
    el.addEventListener("animationend", function () { el.classList.remove("glitching"); }, { once: true });
  }

  // Header state via top sentinel (no scroll listener)
  var header = document.querySelector(".site-header");
  var sentinel = document.getElementById("top-sentinel");
  if (header && "IntersectionObserver" in window) {
    if (!sentinel) {
      sentinel = document.createElement("div");
      sentinel.id = "top-sentinel";
      document.body.prepend(sentinel);
    }
    sentinel.style.cssText = "position:absolute;top:0;left:0;width:1px;height:1px;pointer-events:none;";
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
          if (el.classList.contains("section-head")) {
            var h2 = el.querySelector("h2");
            if (h2) setTimeout(function () { glitchOnce(h2); }, 350);
          }
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
          var lg = document.documentElement.lang === "en" ? "en" : "da";
          return el.getAttribute("data-suffix-" + lg) || el.getAttribute("data-suffix") || "";
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

  // ===== Headline decode / scramble =====
  var GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&$/<>[]{}=*+";
  function scramble(root) {
    if (!root || reduceMotion) return;
    var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var nodes = [], n;
    while ((n = walker.nextNode())) { if (n.nodeValue.replace(/\s/g, "") !== "") nodes.push({ node: n, full: n.nodeValue }); }
    if (!nodes.length) return;
    var maxLen = 0;
    nodes.forEach(function (o) { maxLen = Math.max(maxLen, o.full.length); });
    var start = performance.now();
    (function frame(t) {
      var revealed = ((t - start) / 1000) * 26; // chars revealed per second
      var settled = revealed >= maxLen + 2;
      nodes.forEach(function (o) {
        if (settled) { o.node.nodeValue = o.full; return; }
        var full = o.full, out = "";
        for (var i = 0; i < full.length; i++) {
          var ch = full[i];
          if (ch === " " || ch === "\n" || i < revealed) out += ch;
          else out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
        }
        o.node.nodeValue = out;
      });
      if (!settled) requestAnimationFrame(frame);
    })(start);
  }
  var heroTitle = document.querySelector(".hero h1");
  if (heroTitle) {
    scramble(heroTitle);
    // re-run the decode when the language is switched
    var langBtn = document.querySelector(".lang-toggle");
    if (langBtn) langBtn.addEventListener("click", function () { setTimeout(function () { scramble(heroTitle); }, 30); });
  }

  // ===== Matrix rain (hero background) =====
  var canvas = document.querySelector(".hero-rain");
  if (canvas && !reduceMotion && canvas.getContext) {
    var ctx = canvas.getContext("2d");
    var chars = "アカサタナハマヤラワ0123456789<>[]{}#$/*+=".split("");
    var host = canvas.parentElement;
    var cols = [], fontSize = 14, dpr = Math.min(window.devicePixelRatio || 1, 2);
    var running = true;

    function sizeCanvas() {
      var w = host.clientWidth, h = host.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      canvas.style.width = w + "px"; canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var count = Math.floor(w / fontSize);
      cols = [];
      for (var i = 0; i < count; i++) cols.push(Math.random() * (h / fontSize));
    }
    sizeCanvas();
    window.addEventListener("resize", sizeCanvas);

    var last = 0;
    function draw(now) {
      if (!running) return;
      requestAnimationFrame(draw);
      if (now - last < 55) return; // ~18fps
      last = now;
      var w = canvas.width / dpr, h = canvas.height / dpr;
      ctx.fillStyle = "rgba(10,15,13,0.28)";
      ctx.fillRect(0, 0, w, h);
      ctx.font = fontSize + "px 'JetBrains Mono', monospace";
      for (var i = 0; i < cols.length; i++) {
        var ch = chars[(Math.random() * chars.length) | 0];
        var x = i * fontSize, y = cols[i] * fontSize;
        ctx.fillStyle = Math.random() > 0.94 ? "rgba(200,255,224,0.9)" : "rgba(108,247,160,0.55)";
        ctx.fillText(ch, x, y);
        if (y > h && Math.random() > 0.975) cols[i] = 0;
        else cols[i] += 1;
      }
    }
    requestAnimationFrame(draw);

    // pause when hero is off-screen
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (e) {
        running = e[0].isIntersecting;
        if (running) requestAnimationFrame(draw);
      }, { threshold: 0 }).observe(host);
    }
  }

  // ===== Interactive terminal =====
  (function terminal() {
    var wrap = document.getElementById("terminal");
    var out = document.getElementById("term-out");
    var line = document.getElementById("term-input-line");
    var input = document.getElementById("term-input");
    var hints = document.getElementById("term-hints");
    var body = document.getElementById("term-body");
    if (!wrap || !out || !input || !body) return;

    function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
    function scrollBottom() { body.scrollTop = body.scrollHeight; }
    function print(html, cls) {
      var d = document.createElement("div");
      d.className = "term-line" + (cls ? " " + cls : "");
      d.innerHTML = html;
      out.appendChild(d);
      scrollBottom();
      return d;
    }
    function prompt() {
      return '<span class="p" style="color:var(--accent)">visitor@nordcode</span>' +
             '<span class="o" style="color:var(--muted)">:</span>' +
             '<span class="dir" style="color:var(--accent-dim)">~</span>' +
             '<span class="p" style="color:var(--accent)">$</span> ';
    }
    function goto(sel) {
      var t = document.querySelector(sel);
      if (t) t.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    }

    var history = [], hIdx = -1;

    // Tiny retro key blips (opt-in via the 'sound' command)
    var audioCtx = null, soundOn = false;
    function blip(freq, dur) {
      if (!soundOn) return;
      try {
        audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
        var o = audioCtx.createOscillator(), g = audioCtx.createGain();
        o.type = "square"; o.frequency.value = freq || 620;
        g.gain.value = 0.02;
        o.connect(g); g.connect(audioCtx.destination);
        o.start(); o.stop(audioCtx.currentTime + (dur || 0.03));
      } catch (e) {}
    }

    function help() {
      print(L("Tilgængelige kommandoer:", "Available commands:"), "faint");
      [["help", L("vis denne liste", "show this list")],
       ["ls", L("vis ydelser", "list services")],
       ["services", L("gå til ydelser", "jump to services")],
       ["priser", L("se priser", "see pricing")],
       ["kontakt", L("kom i kontakt", "get in touch")],
       ["about", L("om Nordcode", "about Nordcode")],
       ["whoami", L("hvem er vi", "who we are")],
       ["neofetch", L("studie-info", "studio info")],
       ["snake", L("spil snake i terminalen", "play snake in the terminal")],
       ["sound", L("taste-lyde til/fra", "key sounds on/off")],
       ["clear", L("ryd terminalen", "clear the terminal")]
      ].forEach(function (r) {
        print('<span class="dir">' + r[0] + '</span>&nbsp;&nbsp;<span class="o" style="color:var(--muted)">' + esc(r[1]) + '</span>');
      });
      print(L("Prøv også: matrix · coffee · sudo", "Try also: matrix · coffee · sudo"), "faint");
    }

    function neofetch() {
      var art = [
        "      __        ",
        "  /\\ | | ___    ",
        " /  \\| |/ __|   ",
        "/ /\\ \\ | (__    ",
        "\\/  \\/_|\\___|   "
      ];
      var info = [
        ["studio", "Nordcode"],
        [L("base", "based"), L("Danmark", "Denmark")],
        [L("laver", "makes"), L("hjemmesider · apps · webshops", "websites · apps · online shops")],
        [L("sprog", "langs"), "Dansk / English"],
        [L("pris", "price"), L("fra 3.500 kr", "from 3.500 kr")],
        ["uptime", L("3+ års erfaring", "3+ years experience")]
      ];
      for (var i = 0; i < art.length; i++) {
        var right = info[i] ? '<span class="accent">' + esc(info[i][0]) + '</span><span class="o" style="color:var(--muted)"> · ' + esc(info[i][1]) + '</span>' : "";
        print('<span class="accent">' + art[i].replace(/ /g, "&nbsp;") + '</span>&nbsp;&nbsp;' + right);
      }
    }

    // ===== Snake =====
    function startSnake() {
      if (wrap.dataset.playing) return;
      wrap.dataset.playing = "1";
      line.hidden = true;
      input.blur();

      var W = 18, H = 11;
      var snakeArr = [{ x: 5, y: 5 }, { x: 4, y: 5 }, { x: 3, y: 5 }];
      var dir = { x: 1, y: 0 }, nextDir = dir, food = null, score = 0;
      var best = 0;
      try { best = parseInt(localStorage.getItem("nordsnake") || "0", 10) || 0; } catch (e) {}

      print(L("SNAKE · pil-taster/WASD · swipe på mobil · q stopper", "SNAKE · arrows/WASD · swipe on mobile · q quits"), "faint");
      var board = print("");
      board.style.lineHeight = "1.3";

      function placeFood() {
        do { food = { x: (Math.random() * W) | 0, y: (Math.random() * H) | 0 }; }
        while (snakeArr.some(function (s) { return s.x === food.x && s.y === food.y; }));
      }
      placeFood();

      function render() {
        var rows = [];
        for (var y = 0; y < H; y++) {
          var r = "";
          for (var x = 0; x < W; x++) {
            var cell = "·";
            if (food.x === x && food.y === y) cell = "◆";
            for (var i = 0; i < snakeArr.length; i++) {
              if (snakeArr[i].x === x && snakeArr[i].y === y) { cell = "█"; break; }
            }
            r += cell + " ";
          }
          rows.push(r);
        }
        board.innerHTML = '<span class="accent">' + rows.join("<br>") + '</span><br><span style="color:var(--muted)">score ' + score + (best ? " · best " + best : "") + "</span>";
        scrollBottom();
      }

      function setDir(d) {
        if (d.x === -dir.x && d.y === -dir.y) return;
        nextDir = d;
      }

      var timer = null;
      function stop(msg) {
        clearInterval(timer);
        document.removeEventListener("keydown", onKey, true);
        body.removeEventListener("touchstart", onTouchStart);
        body.removeEventListener("touchend", onTouchEnd);
        delete wrap.dataset.playing;
        if (score > best) { try { localStorage.setItem("nordsnake", String(score)); } catch (e) {} }
        print(msg + " · score " + score + (score > best ? " · " + L("ny rekord!", "new best!") : ""), score > best ? "accent" : "faint");
        line.hidden = false;
        input.focus();
      }

      function step() {
        dir = nextDir;
        var head = { x: (snakeArr[0].x + dir.x + W) % W, y: (snakeArr[0].y + dir.y + H) % H };
        if (snakeArr.some(function (s) { return s.x === head.x && s.y === head.y; })) {
          blip(150, 0.18);
          stop(L("GAME OVER", "GAME OVER"));
          return;
        }
        snakeArr.unshift(head);
        if (head.x === food.x && head.y === food.y) { score++; blip(880); placeFood(); }
        else snakeArr.pop();
        render();
      }

      function onKey(e) {
        var k = e.key;
        var map = {
          ArrowUp: { x: 0, y: -1 }, ArrowDown: { x: 0, y: 1 }, ArrowLeft: { x: -1, y: 0 }, ArrowRight: { x: 1, y: 0 },
          w: { x: 0, y: -1 }, s: { x: 0, y: 1 }, a: { x: -1, y: 0 }, d: { x: 1, y: 0 },
          W: { x: 0, y: -1 }, S: { x: 0, y: 1 }, A: { x: -1, y: 0 }, D: { x: 1, y: 0 }
        };
        if (map[k]) { e.preventDefault(); setDir(map[k]); }
        else if (k === "q" || k === "Q" || k === "Escape") { e.preventDefault(); stop(L("Afsluttet", "Quit")); }
      }

      var tx = 0, ty = 0;
      function onTouchStart(e) { var t = e.touches[0]; tx = t.clientX; ty = t.clientY; }
      function onTouchEnd(e) {
        var t = e.changedTouches[0];
        var dx = t.clientX - tx, dy = t.clientY - ty;
        if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return;
        if (Math.abs(dx) > Math.abs(dy)) setDir(dx > 0 ? { x: 1, y: 0 } : { x: -1, y: 0 });
        else setDir(dy > 0 ? { x: 0, y: 1 } : { x: 0, y: -1 });
      }

      document.addEventListener("keydown", onKey, true);
      body.addEventListener("touchstart", onTouchStart, { passive: true });
      body.addEventListener("touchend", onTouchEnd, { passive: true });

      render();
      timer = setInterval(step, 130);
    }

    function run(raw) {
      var cmd = raw.trim();
      print(prompt() + '<span class="c" style="color:var(--ink)">' + esc(cmd) + "</span>");
      if (!cmd) return;
      history.push(cmd); hIdx = history.length;
      var parts = cmd.split(/\s+/);
      var c = parts[0].toLowerCase();
      var arg = cmd.slice(parts[0].length).trim();

      switch (c) {
        case "help": case "hjælp": case "hjaelp": case "?": help(); break;
        case "ls": case "dir":
          print('<span class="dir">hjemmesider</span>&nbsp;&nbsp;<span class="dir">apps</span>&nbsp;&nbsp;<span class="dir">webshop</span>&nbsp;&nbsp;<span class="dir">ux-ui</span>');
          print(L("Skriv 'services' for at gå dertil.", "Type 'services' to jump there."), "faint");
          break;
        case "whoami": print("Nordcode · " + L("digitalt studie · Danmark", "digital studio · Denmark")); break;
        case "about": case "om":
          print(L("Vi er et lille dansk studie, der designer og bygger", "We're a small Danish studio that designs and builds"));
          print(L("hjemmesider, apps og digitale produkter — med omhu,", "websites, apps and digital products — with care,"));
          print(L("100% skræddersyet kode og nordisk enkelhed.", "100% custom code and Nordic simplicity."));
          break;
        case "services": case "ydelser":
          print(L("Åbner ydelser…", "Opening services…"), "faint"); goto("#ydelser"); break;
        case "priser": case "pricing": case "price": case "pris":
          print('Hjemmeside&nbsp;&nbsp;<span class="accent">' + L("fra 3.500 kr", "from 3.500 kr") + '</span> + 250 kr/md');
          print('App&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span class="accent">' + L("fra 12.000 kr", "from 12.000 kr") + '</span> + 500 kr/md');
          print('Diverse&nbsp;&nbsp;&nbsp;&nbsp;<span class="accent">' + L("Tilbud", "Quote") + "</span>");
          goto("#priser"); break;
        case "kontakt": case "contact": case "mail": case "email":
          print('<span class="o" style="color:var(--muted)">' + L("Skriv til os:", "Email us:") + '</span> <a class="term-link" href="mailto:csgogammer38@gmail.com">csgogammer38@gmail.com</a>');
          goto("#kontakt"); break;
        case "clear": case "cls": out.innerHTML = ""; break;
        case "date": print(new Date().toLocaleString(lang() === "en" ? "en-GB" : "da-DK")); break;
        case "echo": print(esc(arg) || "&nbsp;"); break;
        case "sudo": print(L("🔒 Adgang nægtet. Pænt forsøgt.", "🔒 Permission denied. Nice try."), "danger"); break;
        case "coffee": case "kaffe":
          print("&nbsp;&nbsp;( (", "faint");
          print("&nbsp;&nbsp;&nbsp;) )", "faint");
          print("&nbsp;.______.", "faint");
          print("&nbsp;|&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;|]", "faint");
          print("&nbsp;\\&nbsp;&nbsp;&nbsp;&nbsp;/", "faint");
          print("&nbsp;&nbsp;`----'&nbsp;&nbsp;" + L("altid tid til en kop.", "always time for a cup."), "faint");
          break;
        case "matrix":
          print("Wake up, Neo…", "accent");
          if (canvas) canvas.style.transition = "opacity .8s", canvas.style.opacity = "0.42", setTimeout(function () { canvas.style.opacity = ""; }, 3500);
          break;
        case "neofetch": neofetch(); break;
        case "snake": case "spil": case "game": startSnake(); break;
        case "sound": case "lyd":
          soundOn = !soundOn;
          if (soundOn) blip(660);
          print(soundOn ? L("🔊 lyd til", "🔊 sound on") : L("🔇 lyd fra", "🔇 sound off"), "faint");
          break;
        case "nordcode": print(L("Det er os. 👋 Skriv 'about' eller 'kontakt'.", "That's us. 👋 Type 'about' or 'contact'."), "accent"); break;
        default:
          print('<span class="danger" style="color:var(--danger)">' + L("kommando ikke fundet: ", "command not found: ") + esc(c) + '</span> — ' + L("skriv 'help'.", "type 'help'."), "");
      }
    }

    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") { e.preventDefault(); blip(320, 0.05); run(input.value); input.value = ""; }
      else if (e.key === "ArrowUp") { e.preventDefault(); if (hIdx > 0) { hIdx--; input.value = history[hIdx] || ""; } }
      else if (e.key === "ArrowDown") { e.preventDefault(); if (hIdx < history.length - 1) { hIdx++; input.value = history[hIdx] || ""; } else { hIdx = history.length; input.value = ""; } }
      else if (e.key.length === 1) { blip(540 + Math.random() * 120); }
    });

    if (hints) hints.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-cmd]");
      if (!b) return;
      run(b.getAttribute("data-cmd"));
      input.focus();
    });

    body.addEventListener("click", function (e) {
      if (e.target.tagName !== "A" && !line.hidden) input.focus();
    });

    // Boot sequence, then hand control to the visitor
    var boot = [
      { p: "whoami" },
      { o: "Nordcode · " + L("digitalt studie · Danmark", "digital studio · Denmark") },
      { p: "cat velkommen.txt" },
      { o: L("Velkommen. Dette er en ægte terminal — skriv en kommando.", "Welcome. This is a real terminal — type a command.") }
    ];

    function ready() {
      line.hidden = false;
      print(L("Skriv 'help' for at komme i gang.", "Type 'help' to get started."), "faint");
    }

    function typeInto(el, text, done) {
      if (reduceMotion) { el.innerHTML += esc(text); done(); return; }
      var i = 0, cur = document.createElement("span");
      cur.className = "term-cursor-boot";
      el.appendChild(cur);
      (function step() {
        if (i < text.length) {
          cur.insertAdjacentText("beforebegin", text[i]);
          i++;
          setTimeout(step, 26 + Math.random() * 30);
        } else { cur.remove(); done(); }
      })();
    }

    function playBoot() {
      var i = 0;
      (function next() {
        if (i >= boot.length) { ready(); return; }
        var item = boot[i++];
        if (item.p != null) {
          var el = print(prompt() + '<span class="c" style="color:var(--ink)"></span>');
          typeInto(el.querySelector(".c"), item.p, function () { setTimeout(next, 90); });
        } else {
          var el2 = print('<span class="o" style="color:var(--muted)"></span>');
          typeInto(el2.querySelector(".o"), item.o, function () { setTimeout(next, 120); });
        }
      })();
    }

    var booted = false;
    function start() { if (booted) return; booted = true; playBoot(); }
    if ("IntersectionObserver" in window && !reduceMotion) {
      var tio = new IntersectionObserver(function (e) {
        if (e[0].isIntersecting) { tio.disconnect(); start(); }
      }, { threshold: 0.35 });
      tio.observe(wrap);
    } else { start(); }

    window.NordTerm = { print: print, run: run };
  })();

  // ===== Terminal 3D tilt (follows the pointer) =====
  var termEl = document.querySelector(".hero .term");
  var heroEl = document.querySelector(".hero");
  if (termEl && heroEl && !reduceMotion && window.matchMedia("(pointer:fine)").matches) {
    heroEl.addEventListener("pointermove", function (e) {
      var r = termEl.getBoundingClientRect();
      if (!r.width) return;
      var dx = (e.clientX - (r.left + r.width / 2)) / r.width;
      var dy = (e.clientY - (r.top + r.height / 2)) / r.height;
      dx = Math.max(-0.9, Math.min(0.9, dx));
      dy = Math.max(-0.9, Math.min(0.9, dy));
      termEl.classList.add("tilt");
      termEl.style.transform = "perspective(950px) rotateY(" + (dx * 5).toFixed(2) + "deg) rotateX(" + (-dy * 5).toFixed(2) + "deg)";
    });
    heroEl.addEventListener("pointerleave", function () { termEl.style.transform = ""; });
  }

  // ===== Magnetic buttons =====
  if (!reduceMotion && window.matchMedia("(pointer:fine)").matches) {
    document.querySelectorAll(".hero-actions .btn, .nav-cta, .contact-form .btn, .cta-inner .btn").forEach(function (btn) {
      btn.classList.add("magnet");
      btn.addEventListener("pointermove", function (e) {
        var r = btn.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        btn.style.transform = "translate(" + (dx * 0.16).toFixed(1) + "px," + (dy * 0.22).toFixed(1) + "px)";
      });
      btn.addEventListener("pointerleave", function () { btn.style.transform = ""; });
    });
  }

  // ===== Konami code → overdrive =====
  function overdrive() {
    var rain = document.querySelector(".hero-rain");
    if (rain) {
      rain.style.transition = "opacity 0.6s";
      rain.style.opacity = "0.5";
      setTimeout(function () { rain.style.opacity = ""; }, 6000);
    }
    var heads = document.querySelectorAll("h1, h2, h3, .brand-name");
    heads.forEach(function (h, i) { setTimeout(function () { glitchOnce(h); }, i * 45); });
    if (window.NordTerm) {
      window.NordTerm.print("⚡ KONAMI · " + L("overdrive aktiveret i 6 sekunder", "overdrive engaged for 6 seconds"), "accent");
    }
  }
  var KONAMI = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"];
  var kpos = 0;
  document.addEventListener("keydown", function (e) {
    var tag = e.target && e.target.tagName;
    if (tag === "INPUT" || tag === "TEXTAREA") return;
    var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === KONAMI[kpos]) kpos++;
    else kpos = (k === KONAMI[0]) ? 1 : 0;
    if (kpos === KONAMI.length) { kpos = 0; overdrive(); }
  });

  // ===== Cursor spotlight on cards =====
  if (window.matchMedia("(pointer:fine)").matches) {
    document.querySelectorAll(".price-card, .svc-row, .info-grid .card, .related-card").forEach(function (card) {
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100) + "%");
        card.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100) + "%");
      });
    });
  }

  // ===== Process build log =====
  (function buildLog() {
    var steps = document.getElementById("steps");
    var blOut = document.getElementById("bl-out");
    if (!steps || !blOut) return;
    var items = steps.querySelectorAll("li");
    function doneMsg() { return "✓ " + L("bygget uden fejl (4/4)", "build succeeded (4/4)"); }

    function finishInstant() {
      items.forEach(function (li) { li.classList.add("done"); });
      blOut.textContent = doneMsg();
    }
    if (reduceMotion || !("IntersectionObserver" in window)) { finishInstant(); return; }

    var played = false;
    new IntersectionObserver(function (e, obs) {
      if (!e[0].isIntersecting || played) return;
      played = true;
      obs.disconnect();
      items.forEach(function (li, i) {
        setTimeout(function () { li.classList.add("done"); }, 500 + i * 550);
      });
      setTimeout(function () {
        var msg = doneMsg(), i = 0;
        (function tick() {
          blOut.textContent = msg.slice(0, ++i);
          if (i < msg.length) setTimeout(tick, 34);
        })();
      }, 500 + items.length * 550);
    }, { threshold: 0.35 }).observe(steps);
  })();

  // FAQ single-open
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
      var lg = document.documentElement.lang === "en" ? "en" : "da";
      return (window.I18N && I18N[lg] && I18N[lg][key]) || "";
    }
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var name = form.querySelector("#name");
      var email = form.querySelector("#email");
      var message = form.querySelector("#message");
      var honey = form.querySelector('[name="_honey"]');

      if (!name.value.trim() || !email.value.trim() || !message.value.trim()) {
        status.textContent = t("msg.required");
        status.style.color = "#ffcf6b"; return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
        status.textContent = t("msg.invalid");
        status.style.color = "#ffcf6b"; return;
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
          status.style.color = "#ffcf6b";
          status.textContent = t("msg.error");
        })
        .finally(function () {
          if (submitBtn) submitBtn.disabled = false;
        });
    });
  }
})();
