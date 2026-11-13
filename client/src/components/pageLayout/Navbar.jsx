import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { motion, useScroll, useSpring } from "framer-motion";
import { gsap } from "gsap";
import * as THREE from "three";

/*  npm i framer-motion gsap three  */

/* ------------------------------------------------------------------ */
/*  CONFIG – edit these                                                */
/* ------------------------------------------------------------------ */
const FIRST = "Tejas";
const LAST = "Abhale";

// id = the id of the section on your page. Keep in the same order as the page.
const LINKS = [
  { label: "Home", id: "home" },
  { label: "Work", id: "work" },
  { label: "Skills", id: "skills" },
  { label: "Contact", id: "contact" },
];

const CTA_LABEL = "Start a conversation";
const CTA_SHORT = "Let’s talk"; // tablet widths
const CTA_TARGET = "contact";

const SOCIALS = [
  { label: "GitHub", href: "https://github.com/tejasabhale" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/tejas-abhale-50743128a/" },
  { label: "X", href: "https://x.com/Tejas55451" },
];

const ACCENT = "#e94f25";
const MONO = { fontFamily: "'JetBrains Mono', monospace" };
const SERIF = { fontFamily: "'Instrument Serif', Georgia, serif" };
const EASE = [0.22, 1, 0.36, 1];

/* ------------------------------------------------------------------ */
/*  Dot style – same dotted look as the hero portrait, in plain CSS    */
/* ------------------------------------------------------------------ */
const DOT_INK = "#e6e1d9"; // dot colour for white text (slightly dimmed, like the portrait)

// a field of round dots, e.g. for fills
const dotGrid = (color, cell = 4, radius = 1.2) => ({
  backgroundImage: `radial-gradient(circle at center, ${color} ${radius}px, transparent ${radius + 0.35}px)`,
  backgroundSize: `${cell}px ${cell}px`,
});

// text drawn as dots: a dot field clipped to the letter shapes, over a faint solid fill so it stays readable
const dotText = (dot, faint, cell = 3.5) => {
  const r = cell * 0.37;
  return {
    backgroundImage: `radial-gradient(circle at center, ${dot} ${r}px, transparent ${r + 0.35}px), linear-gradient(${faint}, ${faint})`,
    backgroundSize: `${cell}px ${cell}px, 100% 100%`,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    WebkitTextFillColor: "transparent",
    color: "transparent",
  };
};
const textInk = (cell) => dotText(DOT_INK, "rgba(230,225,217,0.26)", cell);
const textAccent = (cell) => dotText(ACCENT, "rgba(233,79,37,0.30)", cell);

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function useFonts() {
  useEffect(() => {
    const id = "hero-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap";
    document.head.appendChild(link);
  }, []);
}

function goTo(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth" });
}

// where the reader is: pos = section index + fraction through it, pct = % of the whole page
function getPageProgress() {
  const y = window.scrollY + window.innerHeight * 0.45;
  const docH = document.documentElement.scrollHeight;
  const tops = LINKS.map((l) => {
    const el = document.getElementById(l.id);
    return el ? el.getBoundingClientRect().top + window.scrollY : null;
  });
  let pos = 0;
  for (let i = LINKS.length - 1; i >= 0; i--) {
    if (tops[i] == null || y < tops[i]) continue;
    const next = tops.slice(i + 1).find((t) => t != null) ?? docH;
    pos = i + Math.min(1, Math.max(0, (y - tops[i]) / Math.max(1, next - tops[i])));
    break;
  }
  const max = Math.max(1, docH - window.innerHeight);
  return { pos, pct: Math.min(100, Math.max(0, (window.scrollY / max) * 100)) };
}

/* ------------------------------------------------------------------ */
/*  Three.js – a point cloud that morphs into a new shape per link     */
/* ------------------------------------------------------------------ */
const COUNT = 2200;

function mulberry32(a) {
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Skills: an exponential growth curve that is drawn on, lights up milestones and runs off the top edge
const GX0 = -2.2, GXW = 4.4, GY0 = -1.5, GYH = 3.0, GK = 3;
const curveXY = (t) => [GX0 + GXW * t, GY0 + (GYH * (Math.exp(GK * t) - 1)) / (Math.exp(GK) - 1)];
const TIP_DIR = (() => {
  const tx = GXW, ty = (GYH * GK * Math.exp(GK)) / (Math.exp(GK) - 1), m = Math.hypot(tx, ty);
  return [tx / m, ty / m];
})();
const MILESTONES = [0.2, 0.4, 0.6, 0.8, 1];
const SKILL_T = new Float32Array(COUNT);     // position of each point along the curve (-1 = streamer)
const SKILL_PHASE = new Float32Array(COUNT); // streamer timing offset

// One shape per section, in the same order as LINKS ids below.
const SHAPE_IDS = ["home", "work", "skills", "contact"];

const SHAPES = [
  // home – the code glyph "</>" drawn with points (a blinking cursor is added separately below)
  (() => {
    const sx = -0.2; // centre the glyph + cursor
    const segs = [
      [-1.5, 0, -0.85, 0.72], [-1.5, 0, -0.85, -0.72], // <
      [-0.28, -0.82, 0.28, 0.82],                      // /
      [1.5, 0, 0.85, 0.72], [1.5, 0, 0.85, -0.72],     // >
    ];
    const lens = segs.map(([a, b, c, d]) => Math.hypot(c - a, d - b));
    const total = lens.reduce((x, y) => x + y, 0);
    return (i, n, rnd) => {
      let r = rnd() * total, k = 0;
      while (k < segs.length - 1 && r > lens[k]) { r -= lens[k]; k++; }
      const t = r / lens[k], [x1, y1, x2, y2] = segs[k];
      return [
        x1 + (x2 - x1) * t + sx + (rnd() - 0.5) * 0.09,
        y1 + (y2 - y1) * t + (rnd() - 0.5) * 0.09,
        (rnd() - 0.5) * 0.14,
      ];
    };
  })(),

  // work – a fanned stack of cards, each with a few lines of "content"
  (i, n, rnd) => {
    const k = i % 4, w = 1.9, h = 1.25;
    let x, y;
    if (rnd() < 0.55) {
      const s2 = rnd() * 2 * (w + h);
      if (s2 < w) { x = -w / 2 + s2; y = -h / 2; }
      else if (s2 < w + h) { x = w / 2; y = -h / 2 + (s2 - w); }
      else if (s2 < 2 * w + h) { x = w / 2 - (s2 - w - h); y = h / 2; }
      else { x = -w / 2; y = h / 2 - (s2 - 2 * w - h); }
    } else if (k === 0) {            // text lines
      y = [0.25, 0, -0.25][Math.floor(rnd() * 3)];
      x = (rnd() - 0.5) * w * 0.7;
    } else if (k === 1) {            // image block + caption
      if (rnd() < 0.7) { x = (rnd() - 0.5) * w * 0.7; y = 0.05 + rnd() * 0.4; }
      else { x = (rnd() - 0.5) * w * 0.45; y = -0.28; }
    } else if (k === 2) {            // two columns
      x = (rnd() < 0.5 ? -0.2 : 0.2) * w + (rnd() - 0.5) * 0.28 * w;
      y = [0.2, 0, -0.2][Math.floor(rnd() * 3)];
    } else {                         // heading + lines
      if (rnd() < 0.35) { x = -0.15 * w + (rnd() - 0.5) * 0.4 * w; y = 0.3; }
      else { x = (rnd() - 0.5) * w * 0.7; y = [0.05, -0.15, -0.35][Math.floor(rnd() * 3)]; }
    }
    return [x + (k - 1.5) * 0.22, y - (k - 1.5) * 0.15, (k - 1.5) * 0.6];
  },

  // skills – growth curve (points are released along the curve in the frame loop to "draw" it)
  (i, n, rnd) => {
    SKILL_PHASE[i] = rnd();
    if (i % 14 === 0) {
      SKILL_T[i] = -1; // streamers: launched from the tip once the curve is drawn
      const [ex, ey] = curveXY(1);
      return [ex, ey, 0];
    }
    const t = rnd();
    SKILL_T[i] = t;
    const [x, y] = curveXY(t);
    return [x + (rnd() - 0.5) * 0.07, y + (rnd() - 0.5) * 0.07, (rnd() - 0.5) * 0.12];
  },

  // contact – an envelope
  (() => {
    const w = 2.5, h = 1.7, fy = 0.12;
    const segs = [
      [-w / 2, -h / 2, w / 2, -h / 2],
      [w / 2, -h / 2, w / 2, h / 2],
      [w / 2, h / 2, -w / 2, h / 2],
      [-w / 2, h / 2, -w / 2, -h / 2],
      [-w / 2, h / 2, 0, fy],
      [w / 2, h / 2, 0, fy],
    ];
    const lens = segs.map(([a, b, c, d]) => Math.hypot(c - a, d - b));
    const total = lens.reduce((x, y) => x + y, 0);
    return (i, n, rnd) => {
      let r = rnd() * total, k = 0;
      while (k < segs.length - 1 && r > lens[k]) { r -= lens[k]; k++; }
      const t = r / lens[k], [x1, y1, x2, y2] = segs[k];
      return [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, (rnd() - 0.5) * 0.08];
    };
  })(),
];

function buildTargets() {
  return SHAPES.map((fn, si) => {
    const rnd = mulberry32(1000 + si * 77);
    const arr = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const p = fn(i, COUNT, rnd);
      arr[i * 3] = p[0]; arr[i * 3 + 1] = p[1]; arr[i * 3 + 2] = p[2];
    }
    return arr;
  });
}

function MenuScene({ running, shape }) {
  const hostRef = useRef(null);
  const live = useRef({ shape });
  const ctl = useRef({ start() { }, stop() { } });
  live.current.shape = shape;

  useEffect(() => {
    const host = hostRef.current;
    const reduce = prefersReducedMotion();

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    host.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 50);
    camera.position.z = 6;

    // round, hard-edged sprite for the points
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const g = c.getContext("2d");
    g.fillStyle = "#fff";
    g.beginPath(); g.arc(32, 32, 30, 0, Math.PI * 2); g.fill();
    const sprite = new THREE.CanvasTexture(c);

    const targets = buildTargets();
    const pos = new Float32Array(targets[0]);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const mat = new THREE.PointsMaterial({
      color: ACCENT, size: 0.05, map: sprite, alphaTest: 0.5, transparent: true, sizeAttenuation: true,
    });
    const points = new THREE.Points(geo, mat);
    scene.add(points);

    // blinking text cursor that sits after the ">" – only shown on the Home shape
    const CN = 90;
    const cpos = new Float32Array(CN * 3);
    const crnd = mulberry32(4242);
    for (let i = 0; i < CN; i++) {
      cpos[i * 3] = 1.9 - 0.2 + (crnd() - 0.5) * 0.07;
      cpos[i * 3 + 1] = (i / (CN - 1)) * 1.5 - 0.75;
      cpos[i * 3 + 2] = (crnd() - 0.5) * 0.1;
    }
    const cgeo = new THREE.BufferGeometry();
    cgeo.setAttribute("position", new THREE.BufferAttribute(cpos, 3));
    const cmat = new THREE.PointsMaterial({
      color: 0xf3efe8, size: 0.06, map: sprite, alphaTest: 0.01, transparent: true, opacity: 0, sizeAttenuation: true,
    });
    points.add(new THREE.Points(cgeo, cmat));

    // skills chart furniture: faint axes + milestone nodes that light up along the curve
    const AXN = 120, apos = new Float32Array(AXN * 3);
    for (let i = 0; i < AXN; i++) {
      const half = AXN / 2, f = (i % half) / (half - 1);
      if (i < half) { apos[i * 3] = GX0 - 0.15 + f * (GXW + 0.5); apos[i * 3 + 1] = GY0 - 0.15; }
      else { apos[i * 3] = GX0 - 0.15; apos[i * 3 + 1] = GY0 - 0.15 + f * (GYH + 0.3); }
    }
    const ageo = new THREE.BufferGeometry();
    ageo.setAttribute("position", new THREE.BufferAttribute(apos, 3));
    const amat = new THREE.PointsMaterial({
      color: 0xf3efe8, size: 0.03, map: sprite, alphaTest: 0.01, transparent: true, opacity: 0, sizeAttenuation: true,
    });
    points.add(new THREE.Points(ageo, amat));

    const ms = MILESTONES.map((mt, mi) => {
      const r2 = mulberry32(90 + mi), mp = new Float32Array(28 * 3);
      for (let j = 0; j < 28; j++) {
        const u = r2() * 2 - 1, an = r2() * Math.PI * 2, sq = Math.sqrt(1 - u * u);
        mp[j * 3] = sq * Math.cos(an) * 0.11; mp[j * 3 + 1] = u * 0.11; mp[j * 3 + 2] = sq * Math.sin(an) * 0.11;
      }
      const g2 = new THREE.BufferGeometry();
      g2.setAttribute("position", new THREE.BufferAttribute(mp, 3));
      const m2 = new THREE.PointsMaterial({
        color: 0xf3efe8, size: 0.075, map: sprite, alphaTest: 0.01, transparent: true, opacity: 0, sizeAttenuation: true,
      });
      const obj = new THREE.Points(g2, m2);
      const [cx, cy] = curveXY(mt);
      obj.position.set(cx, cy, 0);
      points.add(obj);
      return { obj, g2, m2, lit: false, pulse: 0 };
    });

    const resize = () => {
      const w = host.clientWidth || 1, h = host.clientHeight || 1;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      // keep the shape fully visible in short, wide areas
      camera.position.z = camera.aspect < 1 ? 6 / Math.max(camera.aspect, 0.6) : 6;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(host);
    resize();

    const ptr = { x: 0, y: 0 };
    const onMove = (e) => {
      const r = host.getBoundingClientRect();
      ptr.x = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width) * 2 - 1));
      ptr.y = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height) * 2 - 1));
    };
    window.addEventListener("pointermove", onMove, { passive: true });

    let raf = 0, last = 0, prevShape = live.current.shape, burst = 0, skillClock = 0, workClock = 0;
    const frame = (now) => {
      raf = requestAnimationFrame(frame);
      const dt = Math.min((now - (last || now)) / 1000, 0.05);
      last = now;

      const si = ((live.current.shape % SHAPES.length) + SHAPES.length) % SHAPES.length;
      if (si !== prevShape) { prevShape = si; burst = 1; }
      burst = Math.max(0, burst - dt * 1.6);

      const t = targets[si];
      const k = reduce ? 1 : 1 - Math.exp(-dt * 3.2);
      const onSkills = si === 2;

      // Skills: the curve is drawn from the origin; points not yet reached wait at the "pen tip"
      skillClock = onSkills ? skillClock + dt : 0;
      workClock = si === 1 ? workClock + dt : 0;
      let rv = 0;
      if (onSkills) {
        const x = Math.min(1, Math.max(0, (skillClock - 0.4) / 2.6));
        rv = reduce ? 1 : 1 - Math.pow(1 - x, 2.2);
      }

      if (onSkills) {
        const [hx, hy] = curveXY(rv), [ex, ey] = curveXY(1);
        for (let i = 0; i < COUNT; i++) {
          const ti = SKILL_T[i];
          let tx = hx, ty = hy, tz = 0;
          if (ti < 0) {
            if (rv >= 1) {
              const sp = reduce ? SKILL_PHASE[i] : (SKILL_PHASE[i] + now * 0.00045) % 1;
              tx = ex + TIP_DIR[0] * sp * 1.6; ty = ey + TIP_DIR[1] * sp * 1.6;
            }
          } else if (ti <= rv) {
            tx = t[i * 3]; ty = t[i * 3 + 1]; tz = t[i * 3 + 2];
          }
          pos[i * 3] += (tx - pos[i * 3]) * k;
          pos[i * 3 + 1] += (ty - pos[i * 3 + 1]) * k;
          pos[i * 3 + 2] += (tz - pos[i * 3 + 2]) * k;
        }
      } else if (si === 1 && !reduce) {
        // Work: one card at a time slides out of the stack to the side, holds so it can be read, then returns
        const P = 3.0, wc = workClock - 0.9;
        let a = 0, ck = -1;
        if (wc > 0) {
          const e = (x) => x * x * (3 - 2 * x), lt = wc % P;
          ck = 3 - (Math.floor(wc / P) % 4); // front card first
          a = lt < 0.8 ? e(lt / 0.8) : lt < 2.0 ? 1 : lt < 2.8 ? 1 - e((lt - 2.0) / 0.8) : 0;
        }
        const slide = Math.min(2.3, Math.max(0.8, camera.position.z * camera.aspect * 0.364 - 1.45));
        for (let i = 0; i < COUNT; i++) {
          const on = (i & 3) === ck;
          pos[i * 3] += (t[i * 3] + (on ? a * slide : 0) - pos[i * 3]) * k;
          pos[i * 3 + 1] += (t[i * 3 + 1] + (on ? a * 0.25 : 0) - pos[i * 3 + 1]) * k;
          pos[i * 3 + 2] += (t[i * 3 + 2] + (on ? a * 0.5 : 0) - pos[i * 3 + 2]) * k;
        }
      } else {
        for (let i = 0; i < pos.length; i++) pos[i] += (t[i] - pos[i]) * k;
      }
      geo.attributes.position.needsUpdate = true;

      // axes fade in, milestones light up (with a small pulse) as the curve passes them
      amat.opacity += ((onSkills ? 0.35 : 0) - amat.opacity) * (reduce ? 1 : 1 - Math.exp(-dt * 6));
      ms.forEach((m, mi) => {
        const lit = onSkills && rv >= MILESTONES[mi] - 0.02;
        if (lit && !m.lit) m.pulse = 1;
        m.lit = lit;
        m.pulse = Math.max(0, m.pulse - dt * 1.4);
        m.m2.opacity += ((lit ? 1 : 0) - m.m2.opacity) * (reduce ? 1 : 1 - Math.exp(-dt * 12));
        m.obj.scale.setScalar(1 + 1.2 * m.pulse * m.pulse);
      });

      // cursor blinks on Home (steady, no blink, for reduced motion)
      const showCursor = si === 0 && (reduce || Math.floor(now / 530) % 2 === 0);
      cmat.opacity += ((showCursor ? 1 : 0) - cmat.opacity) * (reduce ? 1 : 1 - Math.exp(-dt * 20));

      if (!reduce) {
        // gentle sway (not a full spin) so each shape stays readable; follows the finger / cursor
        const ky = 1 - Math.exp(-dt * 3);
        const sw = onSkills ? 0.3 : si === 1 ? 0.5 : 1; // keep the chart / cards readable
        points.rotation.y += ((Math.sin(now / 2200) * 0.5 + ptr.x * 0.6) * sw - points.rotation.y) * ky;
        points.rotation.x += ((ptr.y * 0.35 - 0.12) * sw - points.rotation.x) * ky;
        points.scale.setScalar(1 + 0.02 * Math.sin(now / 900) + 0.18 * burst * burst);
      }
      renderer.render(scene, camera);
    };

    ctl.current = {
      start() { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } },
      stop() { cancelAnimationFrame(raf); raf = 0; },
    };
    if (reduce) renderer.render(scene, camera);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      geo.dispose(); mat.dispose(); cgeo.dispose(); cmat.dispose(); ageo.dispose(); amat.dispose();
      ms.forEach((m) => { m.g2.dispose(); m.m2.dispose(); });
      sprite.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      renderer.domElement.remove();
    };
  }, []);

  // only draw while the menu is open
  useEffect(() => {
    if (running) ctl.current.start();
    else ctl.current.stop();
  }, [running]);

  return <div ref={hostRef} className="absolute inset-0" aria-hidden="true" />;
}

/* ------------------------------------------------------------------ */
/*  Magnetic call-to-action (desktop, GSAP)                            */
/* ------------------------------------------------------------------ */
function MagneticLink({ children, ...props }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const xTo = gsap.quickTo(el, "x", { duration: 0.6, ease: "power3" });
    const yTo = gsap.quickTo(el, "y", { duration: 0.6, ease: "power3" });
    const move = (e) => {
      const r = el.getBoundingClientRect();
      xTo((e.clientX - (r.left + r.width / 2)) * 0.28);
      yTo((e.clientY - (r.top + r.height / 2)) * 0.4);
    };
    const leave = () => { xTo(0); yTo(0); };
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerleave", leave);
    return () => {
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerleave", leave);
      gsap.killTweensOf(el);
    };
  }, []);
  return <a ref={ref} {...props}>{children}</a>;
}

/* ------------------------------------------------------------------ */
/*  Navbar                                                             */
/* ------------------------------------------------------------------ */
export default function Navbar() {
  useFonts();

  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const [everOpened, setEverOpened] = useState(false); // WebGL is only created once the menu is first opened
  const [active, setActive] = useState("home");
  const [preview, setPreview] = useState(null);

  const panelRef = useRef(null);
  const logoRef = useRef(null);
  const tlRef = useRef(null);
  const countRef = useRef(null);
  const picking = useRef(false);
  const progTweens = useRef([]);

  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 28, mass: 0.4 });

  /* logo: letters rise out of a mask on load */
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(".logo-ch", {
        yPercent: 115,
        duration: 1.1,
        ease: "expo.out",
        stagger: 0.045,
        delay: 0.25,
      });
    }, logoRef);
    return () => ctx.revert();
  }, []);

  /* mobile menu timeline: circle reveal from the button, then links rise out of masks */
  useLayoutEffect(() => {
    const panel = panelRef.current;
    const ctx = gsap.context(() => {
      const p = { v: 0 };
      const render = () => {
        const w = window.innerWidth, h = window.innerHeight;
        panel.style.clipPath = `circle(${Math.hypot(w, h) * p.v}px at ${w - 34}px 32px)`;
      };
      render();

      gsap.set(".m-line", { yPercent: 115 });
      gsap.set(".m-fade", { opacity: 0, y: 18 });
      gsap.set(".m-scene", { opacity: 0, scale: 0.8 });

      const tl = gsap.timeline({
        paused: true,
        onReverseComplete: () => { panel.style.visibility = "hidden"; },
      });
      tl.to(p, { v: 1, duration: 0.9, ease: "power3.inOut", onUpdate: render }, 0)
        .to(".m-line", { yPercent: 0, duration: 0.95, ease: "expo.out", stagger: 0.075 }, 0.35)
        .to(".m-scene", { opacity: 1, scale: 1, duration: 1.1, ease: "expo.out" }, 0.4)
        .to(".m-fade", { opacity: 1, y: 0, duration: 0.7, ease: "power3.out", stagger: 0.06 }, 0.6);
      tlRef.current = tl;

      window.addEventListener("resize", render);
      return () => window.removeEventListener("resize", render);
    }, panel);
    return () => ctx.revert();
  }, []);

  // when the menu opens, the % counts up to how far down the page you are
  const runProgress = () => {
    const count = countRef.current;
    if (!count) return;
    progTweens.current.forEach((t) => t.kill());
    const { pct } = getPageProgress();
    const reduce = prefersReducedMotion();
    const o = { v: 0 };
    count.textContent = "0%";
    progTweens.current = [
      gsap.to(o, {
        v: pct, duration: reduce ? 0 : 1.3, delay: reduce ? 0 : 0.55, ease: "power3.inOut",
        onUpdate: () => { count.textContent = Math.round(o.v) + "%"; },
      }),
    ];
  };

  useEffect(() => {
    const tl = tlRef.current, panel = panelRef.current;
    if (!tl || !panel) return;
    const reduce = prefersReducedMotion();
    if (open) {
      panel.style.visibility = "visible";
      tl.timeScale(reduce ? 40 : 1).play();
      runProgress();
    } else if (picking.current) {
      setPreview(null); // the tap-to-wipe sequence below owns the exit
    } else if (tl.progress() > 0) {
      tl.timeScale(reduce ? 40 : 1.7).reverse();
      setPreview(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  /* solid bar after scrolling; hide on scroll down, show on scroll up */
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 24);
      setHidden(y > 160 && y > last + 4);
      if (y < last - 4) setHidden(false);
      last = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* highlight the section on screen */
  useEffect(() => {
    const els = LINKS.map((l) => document.getElementById(l.id)).filter(Boolean);
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((en) => en.isIntersecting && setActive(en.target.id)),
      { rootMargin: "-45% 0px -50% 0px", threshold: 0 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  /* menu open: lock scroll, Escape closes */
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  /* close the menu if resized up to desktop */
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const onChange = (e) => e.matches && setOpen(false);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const toggle = () => {
    if (picking.current) return;
    setEverOpened(true);
    setOpen((v) => !v);
  };

  const navigate = (e, id) => {
    e.preventDefault();
    setOpen(false);
    setActive(id);
    setTimeout(() => goTo(id), open ? 380 : 0);
  };

  // tapping a menu link: the chosen row stays, the rest fade, then the panel wipes away
  // in the direction of the section (down the page = wipes up, up the page = wipes down)
  const pick = (e, id, i) => {
    e.preventDefault();
    if (picking.current) return;
    const panel = panelRef.current, tl = tlRef.current;
    const cur = LINKS.findIndex((l) => l.id === active);
    if (!panel || !tl || prefersReducedMotion() || i === cur) {
      navigate(e, id);
      return;
    }
    picking.current = true;
    setPreview(i);
    setActive(id);
    const dir = i > cur ? -1 : 1;
    const rows = Array.from(panel.querySelectorAll(".m-row"));
    const others = rows.filter((_, k) => k !== i);
    const chrome = panel.querySelectorAll(".m-fade, .m-scene");

    gsap.timeline({
      onComplete: () => {
        panel.style.visibility = "hidden";
        gsap.set(panel, { clearProps: "transform" });
        gsap.set(rows, { clearProps: "opacity,transform" });
        tl.pause(0); // jump the open timeline back to its start for next time
        picking.current = false;
      },
    })
      .to(others, { opacity: 0, duration: 0.3, stagger: 0.05, ease: "power2.out" }, 0)
      .to(chrome, { opacity: 0, duration: 0.3, ease: "power2.out" }, 0)
      .to(rows[i], { x: 10, duration: 0.45, ease: "power3.out" }, 0)
      .call(() => { setOpen(false); goTo(id); }, null, 0.5)
      .to(panel, { yPercent: dir * 100, duration: 0.8, ease: "power4.inOut" }, 0.5);
  };

  const barSolid = scrolled && !open;
  const activeIndex = Math.max(0, LINKS.findIndex((l) => l.id === active));
  const shape = Math.max(0, SHAPE_IDS.indexOf(LINKS[preview ?? activeIndex].id));

  return (
    <>
      <motion.header
        initial={{ y: -28, opacity: 0 }}
        animate={{ y: hidden && !open ? -110 : 0, opacity: 1 }}
        transition={{ duration: 0.55, ease: EASE, delay: hidden ? 0 : 0.1 }}
        className="fixed inset-x-0 top-0 z-50 text-white"
        style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
      >
        <div
          className={
            "relative border-b-2 border-dotted transition-[background-color,border-color,backdrop-filter] duration-500 " +
            (barSolid ? "border-[#3a3a3a] bg-black/60 backdrop-blur-xl" : "border-transparent bg-transparent")
          }
        >
          {/* faint dot field on the solid bar */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 transition-opacity duration-500"
            style={{ ...dotGrid("rgba(243,239,232,0.07)", 14, 1), opacity: barSolid ? 1 : 0 }}
          />

          <nav
            aria-label="Main"
            className="relative mx-auto flex h-16 w-full max-w-[1600px] items-center justify-between px-5 md:grid md:h-[72px] md:grid-cols-[1fr_auto_1fr] lg:px-10"
          >
            {/* logo */}
            <a
              ref={logoRef}
              href="#home"
              onClick={(e) => navigate(e, "home")}
              className="flex items-baseline justify-self-start text-[24px] leading-none tracking-[-0.01em] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              style={SERIF}
              aria-label={`${FIRST} ${LAST} – back to top`}
            >
              <span aria-hidden="true" className="flex">
                {[...FIRST].map((ch, i) => (
                  <span key={"f" + i} className="inline-block overflow-hidden py-[0.12em] -my-[0.12em]">
                    <span className="logo-ch inline-block" style={textInk(2.5)}>{ch}</span>
                  </span>
                ))}
              </span>
              <span aria-hidden="true" className="w-[0.28em]" />
              <span aria-hidden="true" className="flex italic">
                {[...LAST].map((ch, i) => (
                  <span key={"l" + i} className="inline-block overflow-hidden py-[0.12em] pr-[0.04em] -my-[0.12em] -mr-[0.04em]">
                    <span className="logo-ch inline-block" style={textAccent(2.5)}>{ch}</span>
                  </span>
                ))}
              </span>
            </a>

            {/* desktop links – sliding pill + text roll on hover */}
            <ul
              className="hidden items-center gap-1 rounded-full border-2 border-dotted border-[#3a3a3a] bg-[#0a0a0a]/70 p-1 backdrop-blur-md md:flex"
              style={{ ...MONO, ...dotGrid("rgba(243,239,232,0.08)", 4, 0.9) }}
            >
              {LINKS.map((l) => {
                const on = active === l.id;
                return (
                  <li key={l.id} className="relative">
                    {on && (
                      <motion.span
                        layoutId="nav-pill"
                        aria-hidden="true"
                        className="absolute inset-0 rounded-full border-2 border-dotted border-[#e94f25] bg-[#e94f25]/20"
                        style={dotGrid("rgba(233,79,37,0.7)", 4, 1.1)}
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    )}
                    <a
                      href={`#${l.id}`}
                      onClick={(e) => navigate(e, l.id)}
                      aria-current={on ? "true" : undefined}
                      className={
                        "group relative block rounded-full px-3.5 py-2 text-[11px] uppercase tracking-[0.22em] transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white lg:px-4 " +
                        (on ? "text-white" : "text-white/55 hover:text-white")
                      }
                      style={on ? { textShadow: "0 1px 6px rgba(0,0,0,0.85)" } : undefined}
                    >
                      <span className="relative block overflow-hidden">
                        <span className="block transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-full">
                          {l.label}
                        </span>
                        <span
                          aria-hidden="true"
                          className="absolute inset-0 block translate-y-full transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0"
                        >
                          {l.label}
                        </span>
                      </span>
                    </a>
                  </li>
                );
              })}
            </ul>

            {/* right side */}
            <div className="flex items-center justify-self-end">
              <MagneticLink
                href={`#${CTA_TARGET}`}
                onClick={(e) => navigate(e, CTA_TARGET)}
                className="hidden rounded-xl border-2 border-dotted border-[#e94f25] bg-[#e94f25]/20 px-5 py-2.5 text-[13px] font-medium text-white transition-colors duration-300 hover:bg-[#e94f25]/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white md:inline-flex"
                style={{ ...dotGrid("rgba(233,79,37,0.85)", 4, 1.5), textShadow: "0 1px 8px rgba(0,0,0,0.75)" }}
              >
                <span className="lg:hidden">{CTA_SHORT}</span>
                <span className="hidden lg:inline">{CTA_LABEL}</span>
              </MagneticLink>

              {/* mobile toggle */}
              <button
                type="button"
                onClick={toggle}
                aria-expanded={open}
                aria-controls="mobile-menu"
                aria-label={open ? "Close menu" : "Open menu"}
                className="relative -mr-2.5 flex h-12 w-12 items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:hidden"
              >
                <motion.span
                  className="absolute block h-[1.5px] w-6 bg-white"
                  animate={{ y: open ? 0 : -4, rotate: open ? 45 : 0 }}
                  transition={{ type: "spring", stiffness: 420, damping: 30 }}
                />
                <motion.span
                  className="absolute block h-[1.5px] bg-white"
                  animate={{ y: open ? 0 : 4, rotate: open ? -45 : 0, width: open ? 24 : 16, x: open ? 0 : 4 }}
                  transition={{ type: "spring", stiffness: 420, damping: 30 }}
                />
              </button>
            </div>
          </nav>

          {/* reading progress – a line of orange dots */}
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-[3px] left-0 h-[4px] w-full origin-left"
            style={{ scaleX: progress, opacity: barSolid ? 1 : 0, ...dotGrid(ACCENT, 4, 1.4) }}
          />
        </div>
      </motion.header>

      {/* mobile menu – always mounted, driven by the GSAP timeline above */}
      <div
        ref={panelRef}
        id="mobile-menu"
        aria-hidden={!open}
        className="fixed inset-0 z-40 flex flex-col overflow-y-auto bg-black px-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-20 text-white md:hidden"
        style={{
          visibility: "hidden",
          fontFamily: "'Inter', system-ui, sans-serif",
          ...dotGrid("rgba(243,239,232,0.08)", 22, 1.2),
        }}
      >
        <div className="relative">
          <ul>
            {LINKS.map((l, i) => {
              const on = active === l.id;
              return (
                <li key={l.id} className="m-row overflow-hidden border-b-2 border-dotted border-[#333]">
                  <a
                    href={`#${l.id}`}
                    onClick={(e) => pick(e, l.id, i)}
                    onPointerEnter={() => setPreview(i)}
                    onPointerDown={() => setPreview(i)}
                    onPointerLeave={() => setPreview(null)}
                    onFocus={() => setPreview(i)}
                    onBlur={() => setPreview(null)}
                    aria-current={on ? "true" : undefined}
                    className="block py-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-white"
                  >
                    <span
                      className="m-line block text-[52px] leading-[1.05] tracking-[-0.01em]"
                      style={{ ...SERIF, ...(on ? textAccent(4) : textInk(4)) }}
                    >
                      {l.label}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="m-fade mt-3 flex items-baseline justify-between text-[11px] tracking-[0.15em] text-white/50" style={MONO}>
          <span>You’re in {LINKS[activeIndex].label}</span>
          <span ref={countRef} className="tabular-nums">0%</span>
        </div>

        {/* three.js area */}
        <div className="m-scene relative my-4 min-h-[140px] flex-1 overflow-hidden rounded-xl border-2 border-dotted border-[#333]">
          {everOpened && <MenuScene running={open} shape={shape} />}
        </div>

        <div className="flex flex-col gap-5">
          <a
            href={`#${CTA_TARGET}`}
            onClick={(e) => navigate(e, CTA_TARGET)}
            className="m-fade inline-flex w-full items-center justify-center rounded-xl border-2 border-dotted border-[#e94f25] bg-[#e94f25]/20 px-6 py-4 text-[15px] font-medium text-white active:bg-[#e94f25]/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
            style={{ ...dotGrid("rgba(233,79,37,0.85)", 4, 1.5), textShadow: "0 1px 8px rgba(0,0,0,0.75)" }}
          >
            {CTA_LABEL}
          </a>

          <ul className="flex items-center gap-6" style={MONO}>
            {SOCIALS.map((s) => (
              <li key={s.label} className="m-fade">
                <a
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2 text-[12px] tracking-[0.12em] text-white/60 underline decoration-white/20 decoration-dotted decoration-2 underline-offset-8 transition-colors hover:text-white hover:decoration-[#e94f25] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                >
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}