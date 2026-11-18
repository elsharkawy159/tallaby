/*
 * Tallaby tutorial kit: the runtime. It reads window.TK_VIDEO (the video's script,
 * written into index.html by build.mjs) and builds one paused GSAP timeline:
 * title card, step captions, taps, typing, highlights, scrolls, zooms, the result
 * check and the end card. See README.md for the script format.
 *
 * Positions are never typed by hand. For a tap, a highlight, a scroll or a zoom the
 * kit moves the timeline to that moment, measures the real element on the page, and
 * places the overlay there.
 */
(function () {
  "use strict";

  var V = window.TK_VIDEO;
  var W = 1080;
  var H = 1920;
  var FIT = W / 390;
  var STEP_CHANGE = 0.35; // the one transition: 350 ms slide plus blur
  var SLIDE = 70;
  var BLUR = "blur(14px)";
  var CLEAR = "blur(0px)";

  var $ = function (sel) {
    var el = typeof sel === "string" ? document.querySelector(sel) : sel;
    if (!el) throw new Error("[tutorial kit] no element matches " + sel);
    return el;
  };

  /** An element's box in video pixels, whatever size the preview is shown at. */
  function box(sel) {
    var root = document.getElementById("root").getBoundingClientRect();
    var k = W / root.width;
    var r = $(sel).getBoundingClientRect();
    return {
      x: (r.left - root.left) * k,
      y: (r.top - root.top) * k,
      w: r.width * k,
      h: r.height * k,
      cx: (r.left - root.left + r.width / 2) * k,
      cy: (r.top - root.top + r.height / 2) * k,
    };
  }

  var clamp = function (v, min, max) {
    return Math.max(min, Math.min(max, v));
  };

  function build() {
    var tl = gsap.timeline({ paused: true });
    var cam = $("#tk-cam");
    var camera = { x: 0, y: 0, z: 1 };
    var scrolls = new Map();
    var counters = { tap: 0, hl: 0 };
    var OPS = ops();

    gsap.set(cam, { x: 0, y: 0, scale: 1, transformOrigin: "0 0" });

    /* ── Title card: settled at frame 0 (it is the thumbnail), leaves with the step change ── */
    var titleEnd = V.steps[0].at;
    tl.fromTo("#tk-title .tk-title-rule", { scaleX: 0.5 }, { scaleX: 1, duration: 1.2, ease: "power2.out" }, 0.1);
    tl.fromTo(
      "#tk-title-in",
      { x: 0, opacity: 1, filter: CLEAR },
      { x: SLIDE * 2, opacity: 0, filter: BLUR, duration: STEP_CHANGE, ease: "power2.in" },
      titleEnd - 0.05,
    );

    /* ── Caption card: one card for all steps; only its text changes ── */
    var capEnd = V.resultAt;
    tl.fromTo(
      "#tk-cap-in",
      { y: 40, opacity: 0 },
      { y: 0, opacity: 1, duration: STEP_CHANGE, ease: "power3.out" },
      V.steps[0].at,
    );
    tl.fromTo("#tk-cap-in", { opacity: 1 }, { opacity: 0, y: 30, duration: 0.25, ease: "power2.in" }, capEnd - 0.25);

    V.steps.forEach(function (step, i) {
      var end = i + 1 < V.steps.length ? V.steps[i + 1].at : capEnd;
      var inner = "#tk-step-" + (i + 1) + "-in";
      tl.fromTo(
        inner,
        { x: -SLIDE, opacity: 0, filter: BLUR },
        { x: 0, opacity: 1, filter: CLEAR, duration: STEP_CHANGE, ease: "power3.out" },
        step.at,
      );
      tl.fromTo(
        inner,
        { x: 0, opacity: 1, filter: CLEAR },
        { x: SLIDE, opacity: 0, filter: BLUR, duration: 0.18, ease: "power2.in", immediateRender: false },
        end - 0.18,
      );
    });

    /* ── Result check: 1.5 s ── */
    var checkAt = V.checkAt;
    tl.fromTo(
      "#tk-check-in",
      { scale: 0.4, opacity: 0 },
      { scale: 1, opacity: 1, duration: 0.4, ease: "back.out(1.7)" },
      checkAt,
    );
    tl.fromTo(
      "#tk-check-path",
      { strokeDashoffset: 60 },
      { strokeDashoffset: 0, duration: 0.3, ease: "power2.out" },
      checkAt + 0.18,
    );
    tl.fromTo(
      "#tk-check-in",
      { opacity: 1 },
      { opacity: 0, scale: 0.9, duration: 0.2, ease: "power2.in", immediateRender: false },
      checkAt + 1.3,
    );

    /* ── End card ── */
    var endAt = V.endAt;
    tl.fromTo("#tk-end-in", { opacity: 0 }, { opacity: 1, duration: 0.3, ease: "power2.out" }, endAt);
    [".tk-card-logo", ".tk-end-line", ".tk-end-crumbs"].forEach(function (sel, i) {
      tl.fromTo(
        "#tk-end " + sel,
        { x: -SLIDE, opacity: 0, filter: BLUR },
        { x: 0, opacity: 1, filter: CLEAR, duration: 0.45, ease: "power3.out" },
        endAt + 0.12 + i * 0.12,
      );
    });
    // A slow drift on the breadcrumbs keeps the last seconds alive without moving the line being read.
    tl.fromTo("#tk-end .tk-end-crumbs div", { scale: 1 }, { scale: 1.04, duration: 1.6, ease: "sine.inOut" }, endAt + 0.9);

    /* ── The video's own events, in time order ── */
    var events = V.events.slice().sort(function (a, b) {
      return a.t - b.t;
    });

    events.forEach(function (e) {
      tl.seek(e.t, false);
      var op = OPS[e.op];
      if (!op) throw new Error("[tutorial kit] unknown op " + e.op);
      op(e);
    });

    paintStage();

    /* The result check sits on the corner of the thing that proves the task is done, inside the safe area. */
    if (V.checkOn) {
      tl.seek(V.checkAt, false);
      var done = box(V.checkOn);
      gsap.set("#tk-check-in", {
        x: clamp(done.x, 190, 830) - 540,
        y: clamp(done.y, 330, 1180) - 1365,
      });
    }

    /* Run once from end to start so every tween records its values in order. */
    tl.progress(1, false).progress(0, false);
    return tl;

    /* ───────────── the area outside the screen ───────────── */

    /*
     * When the camera lifts or shifts the screen (a zoom with `below`, or a video's own #tk-cam move),
     * part of the frame shows the stage behind it. The stage takes the colour of the page along the
     * edge it borders, so it reads as the page going on, not as a white band. For every camera move
     * that ends with an edge off the frame, the kit seeks to the end of the move, reads the page's
     * colour just inside that edge, and sets it on the stage when the move starts (the band is
     * 0 px tall at that moment, so the change never shows). `stageBg` in video.mjs fixes the colour.
     */
    function paintStage() {
      var stage = $("#tk-stage");
      var fit = $("#tk-fit");
      var fallback = getComputedStyle(stage).backgroundColor;
      var moves = tl.getChildren(false, true, false).filter(function (tw) {
        return tw.targets().indexOf(cam) !== -1;
      });
      moves.forEach(function (tw) {
        var color = V.stageBg;
        if (!color) {
          tl.seek(tw.endTime(), false);
          color = edgeColor(fit, fallback);
        }
        if (color) tl.set(stage, { backgroundColor: color }, tw.startTime());
      });
    }

    /** The page's colour just inside the edge of the screen that has left the frame, or null if none has. */
    function edgeColor(fit, fallback) {
      var root = document.getElementById("root").getBoundingClientRect();
      var r = fit.getBoundingClientRect();
      var k = W / root.width;
      var gap = {
        top: (r.top - root.top) * k,
        bottom: (root.bottom - r.bottom) * k,
        left: (r.left - root.left) * k,
        right: (root.right - r.right) * k,
      };
      var side = Object.keys(gap).reduce(function (a, b) {
        return gap[b] > gap[a] ? b : a;
      });
      if (gap[side] < 1) return null;
      var inset = 2 / k;
      var points =
        side === "top" || side === "bottom"
          ? [0.04, 0.96].map(function (f) {
              return [r.left + r.width * f, side === "top" ? r.top + inset : r.bottom - inset];
            })
          : [0.04, 0.96].map(function (f) {
              return [side === "left" ? r.left + inset : r.right - inset, r.top + r.height * f];
            });
      var colors = points.map(function (p) {
        return colorAt(fit, p[0], p[1], fallback);
      });
      var c = [0, 1, 2].map(function (i) {
        return Math.round((colors[0][i] + colors[1][i]) / 2);
      });
      return "rgb(" + c.join(", ") + ")";
    }

    /** The colour the page paints at a point: every background under it, composited top-down. */
    function colorAt(fit, x, y, fallback) {
      var out = [0, 0, 0];
      var a = 0;
      var stack = document.elementsFromPoint ? document.elementsFromPoint(x, y) : [];
      for (var i = 0; i < stack.length && a < 0.995; i++) {
        var el = stack[i];
        if (!fit.contains(el) || el === fit) continue;
        var c = rgba(getComputedStyle(el).backgroundColor);
        if (!c || !c[3]) continue;
        var alpha = c[3] * opacityOf(el, fit);
        for (var j = 0; j < 3; j++) out[j] += (1 - a) * alpha * c[j];
        a += (1 - a) * alpha;
      }
      // Whatever is still see-through shows the screen's own background, then the dashboard's.
      var base = rgba(activeScreenColor(fit)) || rgba(fallback) || [250, 250, 248, 1];
      for (var m = 0; m < 3; m++) out[m] += (1 - a) * base[m];
      return out;
    }

    function opacityOf(el, fit) {
      var o = 1;
      for (var n = el; n && n !== fit; n = n.parentElement) o *= parseFloat(getComputedStyle(n).opacity) || 0;
      return o;
    }

    /** The background colour of the page being shown (the last visible .tk-screen), if it has one. */
    function activeScreenColor(fit) {
      var screens = fit.querySelectorAll(".tk-screen");
      for (var i = screens.length - 1; i >= 0; i--) {
        var s = getComputedStyle(screens[i]);
        if (parseFloat(s.opacity) < 0.5 || s.display === "none" || s.visibility === "hidden") continue;
        var c = rgba(s.backgroundColor);
        if (c && c[3] > 0.99) return s.backgroundColor;
      }
      return null;
    }

    function rgba(str) {
      var m = str && str.match(/rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?/);
      if (!m) return null;
      var alpha = m[4] == null ? 1 : m[4].slice(-1) === "%" ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
      return [+m[1], +m[2], +m[3], alpha];
    }

    /* ───────────── operations ───────────── */

    function moveCamera(e, next) {
      tl.to(
        cam,
        { x: next.x, y: next.y, scale: next.z, duration: e.dur || 0.6, ease: e.ease || "power2.inOut" },
        e.t,
      );
      camera = next;
    }

    function ops() {
      return {
        /** Scroll a page so `to` sits at video height `y` (default 720). */
        scroll: function (e) {
          var scroller = $(e.sel);
          var current = scrolls.get(scroller) || 0;
          var target = box(e.to);
          var view = scroller.parentElement.clientHeight;
          var max = Math.max(0, scroller.scrollHeight - view);
          var wanted = current + (target.cy - (e.y || 720)) / (FIT * camera.z);
          var next = e.top ? 0 : clamp(wanted, 0, max);
          scrolls.set(scroller, next);
          tl.to(scroller, { y: -next, duration: e.dur || 0.7, ease: "power2.inOut" }, e.t);
        },

        /** Push in on `to` (up to 1.4x) so it sits at video height `y`. `below` lets the frame show the area under the screen. */
        zoom: function (e) {
          var z = clamp(e.z || 1.2, 1, 1.4);
          var target = box(e.to);
          var px = (target.cx - camera.x) / camera.z;
          var py = (target.cy - camera.y) / camera.z;
          var x = clamp((e.x || W / 2) - z * px, W * (1 - z), 0);
          var minY = H * (1 - z) - (e.below || 0);
          var y = clamp((e.y || 720) - z * py, minY, 0);
          moveCamera(e, { x: x, y: y, z: z });
        },

        /** Back to the whole screen. */
        zoomOut: function (e) {
          moveCamera(e, { x: 0, y: 0, z: 1 });
        },

        /** Gold ring on `sel`. The screen should react 0.3 s later. */
        tap: function (e) {
          var id = "#tk-tap-" + ++counters.tap;
          var b = box(e.sel);
          var x = b.cx + (e.dx || 0);
          var y = b.cy + (e.dy || 0);
          gsap.set(id + " .tk-tap", { x: x, y: y });
          tl.fromTo(
            id + " .tk-tap-ring",
            { scale: 0.55, opacity: 0 },
            { scale: 1, opacity: 1, duration: 0.14, ease: "power3.out" },
            e.t,
          );
          tl.fromTo(
            id + " .tk-tap-ring",
            { scale: 1 },
            { scale: 0.86, duration: 0.12, ease: "power2.inOut", yoyo: true, repeat: 1, immediateRender: false },
            e.t + 0.16,
          );
          tl.fromTo(
            id + " .tk-tap-ripple",
            { scale: 1, opacity: 0.7 },
            { scale: 1.9, opacity: 0, duration: 0.4, ease: "power2.out" },
            e.t + 0.08,
          );
          tl.fromTo(
            id + " .tk-tap-ring",
            { opacity: 1 },
            { opacity: 0, duration: 0.22, ease: "power2.in", immediateRender: false },
            e.t + 0.5,
          );
        },

        /** Gold outline around `sel` for `dur` seconds. Use it while the page is still. */
        hl: function (e) {
          var id = "#tk-hl-" + ++counters.hl;
          var pad = e.pad == null ? 10 : e.pad;
          var b = box(e.sel);
          var el = $(id + " .tk-hl");
          el.style.width = b.w + pad * 2 + "px";
          el.style.height = b.h + pad * 2 + "px";
          if (e.radius != null) el.style.borderRadius = e.radius + "px";
          gsap.set(el, { x: b.x - pad, y: b.y - pad });
          tl.fromTo(el, { opacity: 0, scale: 1.05 }, { opacity: 1, scale: 1, duration: 0.28, ease: "power3.out" }, e.t);
          tl.fromTo(
            el,
            { opacity: 1 },
            { opacity: 0, duration: 0.2, ease: "power2.in", immediateRender: false },
            e.t + e.dur - 0.2,
          );
        },

        /** Type `text` into `sel` over `dur` seconds, a few letters at a time, with a caret. */
        type: function (e) {
          var el = $(e.sel);
          var placeholder = el.querySelector(".tk-ph");
          var typed = document.createElement("span");
          typed.className = "tk-typed";
          var caret = document.createElement("span");
          caret.className = "tk-caret";
          // Before the placeholder, so the caret of an empty field sits where the text will start.
          el.insertBefore(caret, el.firstChild);
          el.insertBefore(typed, caret);
          var count = e.count ? $(e.count.sel) : null;
          var chars = Array.from(e.text);
          var group = e.group || 2;
          var groups = Math.ceil(chars.length / group);
          var state = { p: 0 };
          var shown = -1;
          var render = function () {
            var n = Math.min(chars.length, Math.floor(state.p * groups + 1e-6) * group);
            if (n === shown) return;
            shown = n;
            typed.textContent = chars.slice(0, n).join("");
            if (placeholder) placeholder.style.display = n ? "none" : "";
            if (count) count.textContent = n + (e.count.suffix || "");
          };
          tl.fromTo(state, { p: 0 }, { p: 1, duration: e.dur, ease: "none", onUpdate: render }, e.t);
          tl.fromTo(caret, { opacity: 0 }, { opacity: 1, duration: 0.01 }, e.t - 0.1);
          tl.fromTo(caret, { opacity: 1 }, { opacity: 0, duration: 0.01, immediateRender: false }, e.t + e.dur + 0.45);
          render();
        },

        /** Change the text of `sel` at this moment. */
        text: function (e) {
          var el = $(e.sel);
          var before = el.textContent;
          var state = { p: 0 };
          var last = null;
          tl.fromTo(
            state,
            { p: 0 },
            {
              p: 1,
              duration: 0.01,
              ease: "none",
              onUpdate: function () {
                var next = state.p >= 1 ? e.value : before;
                if (next !== last) el.textContent = last = next;
              },
            },
            e.t,
          );
        },

        /** Slide from one page to another with the step-change transition. */
        screen: function (e) {
          tl.fromTo(
            e.from,
            { x: 0, opacity: 1, filter: CLEAR },
            { x: SLIDE / FIT, opacity: 0, filter: "blur(5px)", duration: STEP_CHANGE * 0.5, ease: "power2.in", immediateRender: false },
            e.t,
          );
          tl.fromTo(
            e.to,
            { x: -SLIDE / FIT, opacity: 0, filter: "blur(5px)" },
            { x: 0, opacity: 1, filter: CLEAR, duration: STEP_CHANGE * 0.6, ease: "power3.out" },
            e.t + STEP_CHANGE * 0.4,
          );
        },

        /** Set an attribute at this moment (CSS in the video reacts to it). The element needs a starting value in the HTML. */
        attr: function (e) {
          var attrs = {};
          attrs[e.name] = e.value;
          tl.set(e.sel, { attr: attrs }, e.t);
        },

        /** Plain GSAP for anything else the page does. */
        set: function (e) {
          tl.set(e.sel, e.props, e.t);
        },
        to: function (e) {
          tl.to(e.sel, Object.assign({ duration: e.dur || 0.3, ease: e.ease || "power2.out" }, e.props), e.t);
        },
        fromTo: function (e) {
          tl.fromTo(
            e.sel,
            e.from,
            Object.assign({ duration: e.dur || 0.3, ease: e.ease || "power2.out" }, e.props),
            e.t,
          );
        },

        /** A loading spinner turning for `dur` seconds. */
        spin: function (e) {
          tl.fromTo(
            e.sel,
            { rotation: 0 },
            { rotation: 360 * Math.round((e.dur || 1) / 0.8), duration: e.dur || 1, ease: "none" },
            e.t,
          );
        },
      };
    }

  }

  var fonts = [400, 500, 600, 700].map(function (w) {
    return document.fonts.load(w + ' 16px "Noto Kufi Arabic"', "طلبي");
  });
  [400, 600, 700].forEach(function (w) {
    fonts.push(document.fonts.load(w + ' 16px "Montserrat"', "0123"));
  });

  Promise.all(fonts)
    .catch(function () {})
    .then(function () {
      return document.fonts.ready;
    })
    .then(function () {
      var tl = build();
      window.__timelines = window.__timelines || {};
      window.__timelines["main"] = tl;
      tl.seek(0);
    });
})();
