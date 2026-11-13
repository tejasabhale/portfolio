import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";

gsap.registerPlugin(ScrollTrigger);

/* ------------------------------------------------------------------ */
/*  CONFIG – edit these                                                */
/* ------------------------------------------------------------------ */
const NAME = "Tejas";
// The ONLY image used. Put it in /public. Everything else is drawn by Three.js.
const PORTRAIT_SRC = "tejas-portrait.png";

// dots across the portrait – more = sharper face, heavier on the GPU
const DOTS_DESKTOP = 360;
const DOTS_MOBILE = 210;

const BADGE = "Available for new projects";
const INTRO =
    "Hi, I'm Tejas — a developer and automation builder crafting products and workflows that are fast, reliable, and built to solve real problems.";

// colours
const BG = "#000000";
const INK = "#f3efe8";
const ORANGE = "#e94f25";

/* ------------------------------------------------------------------ */
/*  Dot style – the same dotted look as the portrait, in plain CSS     */
/* ------------------------------------------------------------------ */

// a field of round dots, e.g. for badge / button fills
const dotGrid = (color, cell = 4, radius = 1.2) => ({
    backgroundImage: `radial-gradient(circle at center, ${color} ${radius}px, transparent ${radius + 0.35}px)`,
    backgroundSize: `${cell}px ${cell}px`,
});

/* ------------------------------------------------------------------ */
/*  Idle life – tweak these to make the portrait calmer / livelier     */
/* ------------------------------------------------------------------ */
const BREATH_SPEED = 1.25; // radians per second (~5s per breath)

// Share of dots visible WHILE the intro rain plays.
// 1 = all dots (no thinning), 0.45 = 45%, 0.3 = 30%.
// The rest fade in once the portrait has settled, and stay.
const ANIM_KEEP = 0.45;

// Overall portrait brightness. 1 = original photo colours, below 1 = darker, above 1 = brighter.
const PORTRAIT_BRIGHTNESS = 0.78;

/* ------------------------------------------------------------------ */
/*  Three.js – the photo becomes a field of true-colour dots           */
/* ------------------------------------------------------------------ */
const PLANE_H = 4;
const FOV = 32;
const VIEW_W = 4.3;
const HEAD_PIVOT = [-0.07, -0.2]; // neck, world units

const vertexShader = /* glsl */ `
  const float ANIM_KEEP = ${ANIM_KEEP.toFixed(3)};

  attribute vec3 aCol;
  attribute float aRand;
  attribute float aHead;
  attribute float aEdge;

  uniform float uTime;
  uniform float uReveal;
  uniform float uDot;
  uniform float uPPU;
  uniform float uZ;
  uniform vec3 uHead;   // x: tilt (z axis)  y: turn (y axis)  z: nod (x axis)
  uniform vec2 uPivot;
  uniform float uBreath; // -1..1 breathing phase
  uniform vec2 uMouse;   // -1..1 cursor position over the portrait
  uniform float uLife;   // 0..1 idle animation strength (fades in after intro)

  varying vec3 vCol;
  varying float vLum;
  varying float vFade;
  varying float vIn;
  varying float vEdge;
  varying float vTw;

  void main() {
    vec3 p = position;
    vCol = aCol;
    vEdge = aEdge;

    // head: rigid tilt / turn / nod around the neck (uHead stays at zero, so the head is still)
    if (aHead > 0.0) {
      vec3 q = p - vec3(uPivot, 0.0);
      float a = uHead.x * aHead;
      q.xy = vec2(cos(a) * q.x - sin(a) * q.y, sin(a) * q.x + cos(a) * q.y);
      float b = uHead.y * aHead;
      q.xz = vec2(cos(b) * q.x + sin(b) * q.z, -sin(b) * q.x + cos(b) * q.z);
      float c = uHead.z * aHead;
      q.yz = vec2(cos(c) * q.y - sin(c) * q.z, sin(c) * q.y + cos(c) * q.z);
      p = q + vec3(uPivot, 0.0);
    }

    // intro: dots rain down from above, sweeping left to right, and settle with a soft bounce
    float dx = clamp((position.x + 2.2) / 4.4, 0.0, 1.0);
    float d = dx * 0.5 + aRand * 0.12;
    float r0 = smoothstep(d, d + 0.38, uReveal);
    float t = r0 - 1.0;
    float rb = 1.0 + 2.2 * t * t * t + 1.2 * t * t;   // ease-out-back: slight overshoot, then settle
    float r = 1.0 - pow(1.0 - r0, 3.0);
    vec3 start = p + vec3((aRand - 0.5) * 0.4, 2.6 + aRand * 2.2, -0.8 * aRand);
    vec3 pos = mix(start, p, rb);
    vIn = smoothstep(0.0, 0.25, r0);

    // thin out the field during the intro:
    // "extra" dots (aRand >= ANIM_KEEP) only appear once the portrait has settled
    float extra = step(ANIM_KEEP, aRand);
    float restOnly = smoothstep(0.9, 1.0, r0);
    float show = mix(1.0, restOnly, extra);
    vIn *= show;

    // ---- idle life: breathing + drift + parallax (the head never rotates) ----
    float body = 1.0 - aHead;                        // 1 on shoulders/chest, 0 on head
    float breathe = uBreath * 0.018 * uLife;
    pos.y += breathe * (0.35 + body * 0.65);         // chest moves more than head
    pos.z += uBreath * 0.02 * uLife * body;

    // per-dot micro drift, like floating particles
    float ph = aRand * 6.2831;
    pos.x += sin(uTime * 0.9 + ph) * 0.0012 * uLife;
    pos.y += cos(uTime * 0.7 + ph * 1.3) * 0.0012 * uLife;

    // cursor parallax: deeper dots move more
    float depth = clamp((position.z + 0.25) / 0.7, 0.0, 1.0);
    pos.xy += uMouse * vec2(0.05, 0.035) * (0.3 + depth) * uLife;

    // twinkle phase (used for size here and brightness in the fragment shader)
    vTw = 0.5 + 0.5 * sin(uTime * 1.6 + ph * 2.0);

    vLum = dot(vCol, vec3(0.299, 0.587, 0.114));
    vFade = smoothstep(-2.0, -1.4, p.y);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    gl_Position = projectionMatrix * mv;

    float world = uDot * mix(0.95, 1.12, vLum) * mix(0.3, 1.0, r) * mix(0.7, 1.0, aEdge)
                * (1.0 + (vTw - 0.5) * 0.06 * uLife);
    gl_PointSize = max(world * uPPU * (uZ / -mv.z), 2.0);

    // hidden dots: push off-screen so they cost no fragment work
    if (show < 0.01) gl_Position = vec4(2.0, 2.0, 2.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  varying vec3 vCol;
  varying float vLum;
  varying float vFade;
  varying float vIn;
  varying float vEdge;
  varying float vTw;

  void main() {
    float d = length(gl_PointCoord - 0.5);
    if (d > 0.5) discard;

    // true colour with mild contrast, scaled by the brightness constant
    vec3 col = pow(vCol, vec3(0.95));
    col = clamp((col - 0.5) * 1.12 + 0.5, 0.0, 1.0);
    col *= ${PORTRAIT_BRIGHTNESS.toFixed(3)};
    col *= 1.0 + (vTw - 0.5) * 0.05; // very soft shimmer

    // harder dot edge = crisper detail
    float a = smoothstep(0.5, 0.4, d) * vEdge * vFade * vIn;
    gl_FragColor = vec4(col, a);
  }
`;

const sstep = (a, b, x) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
};

function blur(src, w, h, R) {
    const tmp = new Float32Array(src.length);
    const out = new Float32Array(src.length);
    const n = 2 * R + 1;
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            let s = 0;
            for (let k = -R; k <= R; k++) s += src[y * w + Math.min(w - 1, Math.max(0, x + k))];
            tmp[y * w + x] = s / n;
        }
    }
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            let s = 0;
            for (let k = -R; k <= R; k++) s += tmp[Math.min(h - 1, Math.max(0, y + k)) * w + x];
            out[y * w + x] = s / n;
        }
    }
    return out;
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const im = new Image();
        im.crossOrigin = "anonymous";
        im.onload = () => resolve(im);
        im.onerror = reject;
        im.src = src;
    });
}

// only used if the photo cannot be loaded
function fallbackCanvas() {
    const c = document.createElement("canvas");
    c.width = c.height = 640;
    const g = c.getContext("2d");
    g.fillStyle = "#cfc8c0";
    g.beginPath();
    g.ellipse(320, 280, 120, 150, 0, 0, Math.PI * 2);
    g.fill();
    g.beginPath();
    g.ellipse(320, 700, 260, 240, 0, 0, Math.PI * 2);
    g.fill();
    return c;
}

/* Photo -> one field of dots */
function analysePhoto(source, cols) {
    const iw = source.width, ih = source.height;
    const rows = Math.max(1, Math.round((cols * ih) / iw));
    const c = document.createElement("canvas");
    c.width = cols;
    c.height = rows;
    const g = c.getContext("2d", { willReadFrequently: true });
    g.imageSmoothingQuality = "high";
    g.drawImage(source, 0, 0, cols, rows);
    const data = g.getImageData(0, 0, cols, rows).data;

    const mask = new Float32Array(cols * rows);
    for (let i = 0; i < mask.length; i++) mask[i] = data[i * 4 + 3] / 255;
    let bulge = blur(mask, cols, rows, 3);
    bulge = blur(bulge, cols, rows, 3);
    // lightly softened silhouette: edge dots fade and shrink instead of stair-stepping
    const soft = blur(mask, cols, rows, 1);

    const planeW = (PLANE_H * iw) / ih;
    const cell = planeW / cols;

    const pos = [], col = [], head = [], edge = [];

    for (let j = 0; j < rows; j++) {
        for (let i = 0; i < cols; i++) {
            const k = j * cols + i;
            if (soft[k] < 0.12 || mask[k] < 0.02) continue;
            const r = data[k * 4] / 255, gg = data[k * 4 + 1] / 255, b = data[k * 4 + 2] / 255;
            const lumRaw = 0.299 * r + 0.587 * gg + 0.114 * b;
            const l = Math.min(1, Math.max(0, (lumRaw - 0.05) / 0.8));
            const v = (j + 0.5) / rows;

            // tiny jitter so the face stays sharp
            const x = ((i + 0.5 + (Math.random() - 0.5) * 0.04) / cols - 0.5) * planeW;
            const y = (0.5 - (j + 0.5 + (Math.random() - 0.5) * 0.04) / rows) * PLANE_H;
            const z = Math.pow(bulge[k], 1.6) * 0.5 + l * 0.12 - 0.2;

            pos.push(x, y, z);
            col.push(r, gg, b);
            head.push(1 - sstep(0.5, 0.575, v));
            edge.push(sstep(0.12, 0.8, soft[k]));
        }
    }

    return { pos, col, head, edge, cell, n: head.length };
}

function PortraitCanvas({ src }) {
    const mountRef = useRef(null);

    useEffect(() => {
        const mount = mountRef.current;
        if (!mount) return;

        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        let disposed = false;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        renderer.setPixelRatio(pixelRatio);
        renderer.setClearColor(0x000000, 0);
        mount.appendChild(renderer.domElement);
        Object.assign(renderer.domElement.style, { width: "100%", height: "100%", display: "block" });

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 50);
        camera.position.y = -0.15;

        const uniforms = {
            uTime: { value: 0 },
            uReveal: { value: reduceMotion ? 1 : 0 },
            uDot: { value: 0.02 },
            uPPU: { value: 100 },
            uZ: { value: 6 },
            uHead: { value: new THREE.Vector3() }, // stays (0, 0, 0): head is still
            uPivot: { value: new THREE.Vector2(HEAD_PIVOT[0], HEAD_PIVOT[1]) },
            uBreath: { value: 0 },
            uMouse: { value: new THREE.Vector2() },
            uLife: { value: 0 }, // fades to 1 after the intro (stays 0 with reduced motion)
        };
        const material = new THREE.ShaderMaterial({
            uniforms,
            vertexShader,
            fragmentShader,
            transparent: true,
            depthWrite: false,
        });

        let geo = null;
        const tanH = Math.tan((FOV * Math.PI) / 360);

        const resize = () => {
            const w = mount.clientWidth, h = mount.clientHeight;
            if (!w || !h) return;
            renderer.setSize(w, h, false);
            camera.aspect = w / h;
            const zH = 3.7 / 2 / tanH;
            const zW = VIEW_W / 2 / (camera.aspect * tanH);
            camera.position.z = Math.max(zH, zW);
            camera.updateProjectionMatrix();
            uniforms.uZ.value = camera.position.z;
            uniforms.uPPU.value = (h * pixelRatio) / (2 * camera.position.z * tanH);
            if (reduceMotion) renderer.render(scene, camera);
        };

        /* ---------- build the dots once the photo is ready ---------- */
        (async () => {
            let source;
            try {
                source = await loadImage(src);
            } catch {
                source = fallbackCanvas();
            }
            if (disposed) return;

            const cols = mount.clientWidth < 640 ? DOTS_MOBILE : DOTS_DESKTOP;
            const S = analysePhoto(source, cols);
            const N = S.n;

            const position = new Float32Array(S.pos);
            const aCol = new Float32Array(S.col);
            const aHead = new Float32Array(S.head);
            const aEdge = new Float32Array(S.edge);
            const aRand = new Float32Array(N);
            for (let i = 0; i < N; i++) aRand[i] = Math.random();

            geo = new THREE.BufferGeometry();
            geo.setAttribute("position", new THREE.BufferAttribute(position, 3));
            geo.setAttribute("aCol", new THREE.BufferAttribute(aCol, 3));
            geo.setAttribute("aRand", new THREE.BufferAttribute(aRand, 1));
            geo.setAttribute("aHead", new THREE.BufferAttribute(aHead, 1));
            geo.setAttribute("aEdge", new THREE.BufferAttribute(aEdge, 1));

            const points = new THREE.Points(geo, material);
            points.frustumCulled = false;
            scene.add(points);
            uniforms.uDot.value = S.cell * 1.05;
            resize();
        })();

        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(mount);
        window.addEventListener("resize", resize);
        window.addEventListener("orientationchange", resize);

        const revealTween = reduceMotion
            ? null
            : gsap.to(uniforms.uReveal, { value: 1, duration: 3.4, ease: "power1.inOut", delay: 0.3 });

        // idle life fades in once the intro has landed
        const lifeTween = reduceMotion
            ? null
            : gsap.to(uniforms.uLife, { value: 1, duration: 2, ease: "power1.inOut", delay: 3.4 });

        let visible = true;
        const io = new IntersectionObserver(
            ([en]) => {
                visible = en.isIntersecting;
                // coming back into view (e.g. after "scroll to top"): re-read the real size so the framing is exact
                if (visible) resize();
            },
            { threshold: 0 }
        );
        io.observe(mount);

        // cursor parallax target (-1..1 across the portrait)
        const mouseTarget = new THREE.Vector2();
        const onPointer = (e) => {
            const r = mount.getBoundingClientRect();
            mouseTarget.set(
                ((e.clientX - r.left) / r.width - 0.5) * 2,
                -((e.clientY - r.top) / r.height - 0.5) * 2
            );
        };
        const onLeave = () => mouseTarget.set(0, 0);
        if (!reduceMotion) {
            window.addEventListener("pointermove", onPointer, { passive: true });
            window.addEventListener("pointerleave", onLeave);
        }

        let raf = 0;
        const clock = new THREE.Clock();
        const tick = () => {
            raf = requestAnimationFrame(tick);
            if (!visible) return;
            const t = clock.getElapsedTime();
            uniforms.uTime.value = t;

            // slow breathing + smoothed cursor follow. Head rotation (uHead) stays at 0.
            uniforms.uBreath.value = Math.sin(t * BREATH_SPEED);
            uniforms.uMouse.value.lerp(mouseTarget, 0.04);

            renderer.render(scene, camera);
        };
        if (!reduceMotion) tick();

        return () => {
            disposed = true;
            cancelAnimationFrame(raf);
            if (revealTween) revealTween.kill();
            if (lifeTween) lifeTween.kill();
            window.removeEventListener("pointermove", onPointer);
            window.removeEventListener("pointerleave", onLeave);
            io.disconnect();
            ro.disconnect();
            window.removeEventListener("resize", resize);
            window.removeEventListener("orientationchange", resize);
            material.dispose();
            if (geo) geo.dispose();
            renderer.dispose();
            if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
        };
    }, [src]);

    return <div ref={mountRef} className="absolute inset-0" aria-hidden="true" />;
}

/* ------------------------------------------------------------------ */
/*  Small icons                                                        */
/* ------------------------------------------------------------------ */
const TagIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20.6 13.4 13.4 20.6a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8Z" />
        <circle cx="7.5" cy="7.5" r="1.2" fill="currentColor" />
    </svg>
);
const ArrowIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M7 17 17 7M8 7h9v9" />
    </svg>
);
const ChatIcon = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12Z" />
    </svg>
);

/* ------------------------------------------------------------------ */
/*  Framer Motion – magnetic button                                    */
/* ------------------------------------------------------------------ */
function MagneticButton({ children, icon, primary = false, onClick }) {
    // dot-grid fill, same language as the portrait
    const fill = primary ? dotGrid("rgba(233,79,37,0.85)", 4, 1.5) : dotGrid("rgba(243,239,232,0.30)", 4, 1.1);
    const ref = useRef(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const sx = useSpring(x, { stiffness: 220, damping: 16, mass: 0.4 });
    const sy = useSpring(y, { stiffness: 220, damping: 16, mass: 0.4 });

    const onMove = (e) => {
        const r = ref.current.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * 0.2);
        y.set((e.clientY - (r.top + r.height / 2)) * 0.3);
    };
    const reset = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.button
            ref={ref}
            type="button"
            onClick={onClick}
            onMouseMove={onMove}
            onMouseLeave={reset}
            style={{ x: sx, y: sy, ...fill, textShadow: "0 1px 8px rgba(0,0,0,0.75)" }}
            whileTap={{ scale: 0.97 }}
            className={
                "inline-flex cursor-pointer items-center gap-2.5 rounded-xl border-2 border-dotted px-5 py-3 text-[13px] font-medium text-white transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white " +
                (primary
                    ? "border-[#e94f25] bg-[#e94f25]/20 hover:bg-[#e94f25]/45"
                    : "border-white/45 bg-white/5 hover:border-white/80 hover:bg-white/10")
            }
        >
            {children}
            {icon}
        </motion.button>
    );
}

/* ------------------------------------------------------------------ */
/*  Hero                                                               */
/* ------------------------------------------------------------------ */
export default function Hero() {
    const rootRef = useRef(null);

    useEffect(() => {
        const id = "hero-fonts";
        if (document.getElementById(id)) return;
        const link = document.createElement("link");
        link.id = id;
        link.rel = "stylesheet";
        link.href =
            "https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@400;500;600&display=swap";
        document.head.appendChild(link);
    }, []);

    useEffect(() => {
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const ctx = gsap.context(() => {
            if (reduceMotion) return;

            gsap
                .timeline({ delay: 0.35 })
                .from(
                    "[data-fade]",
                    {
                        opacity: 0,
                        y: 28,
                        filter: "blur(8px)",
                        duration: 0.9,
                        ease: "power3.out",
                        stagger: 0.12,
                        clearProps: "filter",
                    }
                );

            // the badge + intro text still fade away on scroll; the portrait no longer does
            const dissolve = gsap.timeline({
                scrollTrigger: { trigger: rootRef.current, start: "top top", end: "bottom 40%", scrub: 0.5 },
            });
            dissolve.fromTo(
                "[data-soft]",
                { opacity: 1, y: 0, filter: "blur(0px)" },
                { opacity: 0, y: -44, filter: "blur(10px)", ease: "power1.in", duration: 0.45, immediateRender: false },
                0.15
            );
        }, rootRef);

        return () => ctx.revert();
    }, []);

    const scrollTo = (id) => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <section
            ref={rootRef}
            id="home"
            className="relative flex min-h-screen w-full flex-col overflow-hidden pt-16 md:flex-row md:items-center md:pt-0"
            style={{ background: BG, color: INK, fontFamily: "'Inter', system-ui, sans-serif" }}
        >
            {/* faint dot field behind the text, fades out toward the portrait */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 [--dot-x:50%] md:[--dot-x:15%]"
                style={{
                    ...dotGrid("rgba(243,239,232,0.13)", 22, 1.2),
                    WebkitMaskImage: "radial-gradient(ellipse 60% 70% at var(--dot-x, 50%) 50%, #000 0%, transparent 100%)",
                    maskImage: "radial-gradient(ellipse 60% 70% at var(--dot-x, 50%) 50%, #000 0%, transparent 100%)",
                }}
            />

            {/* dotted portrait (Three.js) */}
            <div
                className="relative z-0 aspect-square max-h-[52vh] w-full shrink-0 md:absolute md:bottom-0 md:right-0 md:aspect-auto md:h-[94vh] md:max-h-none md:w-[62vw] md:max-w-[960px]"
                role="img"
                aria-label={`Portrait of ${NAME}, drawn as a field of dots`}
            >
                <PortraitCanvas src={PORTRAIT_SRC} />
                {/* mobile only: soft blend from the portrait into the text below */}
                <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black to-transparent md:hidden"
                />
            </div>

            {/* content */}
            <div className="relative z-10 mx-auto w-full max-w-[1400px] px-6 pb-14 pt-3 text-center md:px-12 md:pb-0 md:pt-0 md:text-left lg:px-20">
                <div className="mx-auto max-w-[640px] md:mx-0">
                    <h1 className="sr-only">{NAME} – developer and automation builder</h1>
                    <div data-fade data-soft className="flex justify-center md:justify-start">
                        <span
                            className="inline-flex items-center gap-2 rounded-full border-2 border-dotted border-[#e94f25]/60 bg-[#e94f25]/10 px-3.5 py-1.5 text-[11px] text-[#ff9a7a]"
                            style={dotGrid("rgba(233,79,37,0.35)", 4, 1)}
                        >
                            <TagIcon />
                            {BADGE}
                        </span>
                    </div>

                    <div data-soft>
                        <div
                            data-fade
                            aria-hidden="true"
                            className="mx-auto mt-5 h-[7px] w-32 md:mx-0 md:mt-6"
                            style={dotGrid(ORANGE, 7, 1.7)}
                        />
                        <p data-fade className="mx-auto mt-4 max-w-[46ch] text-[13px] leading-relaxed text-white/70 sm:text-sm md:mx-0 md:mt-5">
                            {INTRO}
                        </p>

                        <div data-fade className="mt-6 flex flex-wrap items-center justify-center gap-3 md:mt-8 md:justify-start">
                            <MagneticButton primary icon={<ArrowIcon />} onClick={() => scrollTo("work")}>
                                View My Work
                            </MagneticButton>
                            <MagneticButton icon={<ChatIcon />} onClick={() => scrollTo("contact")}>
                                Let&apos;s Talk
                            </MagneticButton>
                        </div>
                    </div>
                </div>
            </div>

            <div
                aria-hidden="true"
                className="pointer-events-none absolute bottom-0 left-0 h-32 w-full bg-gradient-to-t from-black to-transparent"
            />
        </section>
    );
}