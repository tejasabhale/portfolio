import { useEffect, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import * as THREE from "three";

gsap.registerPlugin(ScrollTrigger);

/* ------------------------------------------------------------------ */
/*  CONFIG – edit these                                                */
/* ------------------------------------------------------------------ */
const NAME = "Tejas Abhale";
// Put tejas-portrait.jpg in your /public folder
const PORTRAIT_SRC = "tejas-portrait.png";
const ORANGE = "#e94f25";

// Where the face sits in your photo (0–1, measured from left / top).
// e.g. face slightly right of center and in the upper third → 0.55 / 0.35
const FACE_X = 0.5;
const FACE_Y = 0.35;
// Where the face should sit inside the portrait frame (0–1 from left / top).
// 0.5 = dead centre of the screen. 0.45 keeps a clear gap above the name.
// The looping label under the chin follows this value automatically.
const FRAME_X = 0.5;
const FRAME_Y = 0.45;

// Background blending: the photo's own backdrop is detected from its corners and
// faded into the page's black. Raise KEY_STRENGTH (0–1) if a halo remains,
// lower it if parts of you (e.g. a light shirt) start to disappear.
const KEY_STRENGTH = 0.95;
const KEY_LOW = 0.06;  // colour distance from backdrop that is fully transparent
const KEY_HIGH = 0.28; // colour distance from backdrop that is fully opaque

const MARQUEE = "BUILDING REAL-WORLD SOLUTIONS  ·  OPEN TO COLLABORATION  ·  AUTOMATING GROWTH  ·";

/* ------------------------------------------------------------------ */
/*  Three.js – halftone line-scan portrait                             */
/* ------------------------------------------------------------------ */
const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

/* GLSL for the photo: noise, "cover" fit, backdrop keying and edge fade. */
const COMMON_GLSL = /* glsl */ `
  uniform sampler2D uTex;
  uniform vec2 uRes;
  uniform float uImgAspect;
  uniform float uDissolve;   // 0 -> 1 on scroll
  uniform vec3 uAccent;
  uniform vec2 uFocus;       // face position in the photo (uv, origin bottom-left)
  uniform vec2 uFrame;       // where the face lands inside the frame
  uniform float uKey;        // 0..1 strength of backdrop removal
  uniform vec2 uKeyRange;    // low / high colour-distance thresholds

  float hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }
  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash21(i);
    float b = hash21(i + vec2(1.0, 0.0));
    float c = hash21(i + vec2(0.0, 1.0));
    float d = hash21(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }
  float fbm(vec2 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 4; i++) {
      v += a * vnoise(p);
      p *= 2.03;
      a *= 0.5;
    }
    return v;
  }

  // the moment (0..1) at which this spot of the portrait breaks away:
  // shoulders crumble first, the head last, with ragged noisy edges
  float dissolveThreshold(vec2 uv) {
    float aspect = uRes.x / uRes.y;
    float sweep = clamp((1.0 - uv.x) * 0.3 + uv.y * 0.7, 0.0, 1.0);
    float n = clamp((fbm(uv * vec2(aspect, 1.0) * 5.0) - 0.2) / 0.6, 0.0, 1.0);
    return sweep * 0.65 + n * 0.35;
  }

  // "cover" fit of the image inside the canvas, placing uFocus at uFrame
  vec2 coverUV(vec2 v) {
    float viewAspect = uRes.x / uRes.y;
    vec2 scale = vec2(1.0);
    if (viewAspect > uImgAspect) {
      scale.y = uImgAspect / viewAspect;
    } else {
      scale.x = viewAspect / uImgAspect;
    }
    vec2 c = clamp(uFocus, uFrame * scale, 1.0 - (1.0 - uFrame) * scale);
    return (v - uFrame) * scale + c;
  }

  vec3 bgColor() {
    return (
      texture2D(uTex, vec2(0.03, 0.97)).rgb +
      texture2D(uTex, vec2(0.50, 0.99)).rgb +
      texture2D(uTex, vec2(0.97, 0.97)).rgb +
      texture2D(uTex, vec2(0.03, 0.80)).rgb +
      texture2D(uTex, vec2(0.97, 0.80)).rgb +
      texture2D(uTex, vec2(0.03, 0.62)).rgb +
      texture2D(uTex, vec2(0.97, 0.62)).rgb +
      texture2D(uTex, vec2(0.03, 0.45)).rgb
    ) * 0.125;
  }

  // removes the backdrop colour that bleeds into semi-transparent edge pixels,
  // so no light halo is left around hair and shoulders
  vec3 decontaminate(vec3 c, vec3 bg, float m) {
    return clamp((c - bg * (1.0 - m)) / max(m, 0.3), 0.0, 1.0);
  }

  // anything far from the subject melts into the page, whatever the photo has there
  float falloff(vec2 uv) {
    vec2 d = (uv - vec2(0.5, 0.52)) / vec2(0.5, 0.7);
    return 1.0 - smoothstep(0.7, 1.0, length(d));
  }

  // how much of this colour is "subject" rather than the photo's backdrop
  float subjectMask(vec3 c, vec3 bg) {
    float d = distance(c, bg);
    return mix(1.0, smoothstep(uKeyRange.x, uKeyRange.y, d), uKey);
  }

  // soft edges so it melts into the black page
  float edgeMask(vec2 uv) {
    float fx = smoothstep(0.0, 0.08, uv.x) * smoothstep(1.0, 0.92, uv.x);
    float fy = smoothstep(0.0, 0.3, uv.y) * smoothstep(1.0, 0.94, uv.y);
    return fx * fy * falloff(uv);
  }
`;

/* ---- the photo: fades out softly as you scroll ---- */
const fragmentShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uReveal;
  ${COMMON_GLSL}

  void main() {
    vec3 photo = texture2D(uTex, clamp(coverUV(vUv), 0.0, 1.0)).rgb;
    vec3 bg = bgColor();
    float subject = subjectMask(photo, bg);
    photo = decontaminate(photo, bg, subject);

    // minimal dissolve: the photo just fades away with a soft, slightly noisy edge
    float t = dissolveThreshold(vUv);
    float p = uDissolve * 1.35;
    float alive = 1.0 - smoothstep(t - 0.12, t + 0.12, p);
    vec3 col = photo;

    // reveal wipe from top to bottom on load
    float wipe = smoothstep(uReveal - 0.25, uReveal, 1.0 - vUv.y);

    float a = edgeMask(vUv) * (1.0 - wipe) * alive * subject;
    gl_FragColor = vec4(col, clamp(a, 0.0, 1.0));
  }
`;

function makeFallbackTexture() {
    const c = document.createElement("canvas");
    c.width = 640;
    c.height = 800;
    const g = c.getContext("2d");
    g.fillStyle = "#000";
    g.fillRect(0, 0, c.width, c.height);
    const grad = g.createRadialGradient(320, 300, 20, 320, 320, 260);
    grad.addColorStop(0, "#fff");
    grad.addColorStop(1, "#222");
    g.fillStyle = grad;
    g.beginPath();
    g.ellipse(320, 300, 130, 165, 0, 0, Math.PI * 2); // head
    g.fill();
    g.beginPath();
    g.ellipse(320, 760, 270, 220, 0, 0, Math.PI * 2); // shoulders
    g.fill();
    return new THREE.CanvasTexture(c);
}

function PortraitCanvas({ src }) {
    const mountRef = useRef(null);

    useEffect(() => {
        const mount = mountRef.current;
        if (!mount) return;

        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setClearColor(0x000000, 0);
        mount.appendChild(renderer.domElement);
        renderer.domElement.style.width = "100%";
        renderer.domElement.style.height = "100%";
        renderer.domElement.style.display = "block";

        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

        const uniforms = {
            uTex: { value: null },
            uRes: { value: new THREE.Vector2(1, 1) },
            uImgAspect: { value: 0.8 },
            uReveal: { value: 0 },
            uDissolve: { value: 0 },
            uAccent: { value: new THREE.Color(ORANGE) },
            uFocus: { value: new THREE.Vector2(FACE_X, 1.0 - FACE_Y) },
            uFrame: { value: new THREE.Vector2(FRAME_X, 1.0 - FRAME_Y) },
            uKey: { value: KEY_STRENGTH },
            uKeyRange: { value: new THREE.Vector2(KEY_LOW, KEY_HIGH) },
        };

        const material = new THREE.ShaderMaterial({
            uniforms,
            vertexShader,
            fragmentShader,
            transparent: true,
        });
        const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
        scene.add(quad);

        const applyTexture = (tex) => {
            tex.minFilter = THREE.LinearFilter;
            uniforms.uTex.value = tex;
            const img = tex.image;
            uniforms.uImgAspect.value = img && img.width ? img.width / img.height : 0.8;
        };

        const loader = new THREE.TextureLoader();
        loader.setCrossOrigin("anonymous"); // needed for remote images in WebGL
        loader.load(
            src,
            applyTexture,
            undefined,
            () => applyTexture(makeFallbackTexture())
        );

        const resize = () => {
            const { clientWidth: w, clientHeight: h } = mount;
            if (!w || !h) return;
            renderer.setSize(w, h, false);
            uniforms.uRes.value.set(w, h);
        };
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(mount);

        // reveal wipe (GSAP drives a shader uniform)
        const revealTween = gsap.to(uniforms.uReveal, {
            value: 1.35,
            duration: reduceMotion ? 0 : 1.4,
            ease: "power3.inOut",
            delay: 0.2,
        });

        // scroll: the photo softly fades away as the hero leaves the screen
        const section = mount.closest("section") || mount;
        const dissolveTrigger = reduceMotion
            ? null
            : ScrollTrigger.create({
                trigger: section,
                start: "top top",
                end: "bottom 40%",
                scrub: 0.5,
                onUpdate: (self) => {
                    uniforms.uDissolve.value = self.progress;
                },
            });

        // only render while visible
        let visible = true;
        const io = new IntersectionObserver(([en]) => (visible = en.isIntersecting), { threshold: 0 });
        io.observe(mount);

        let raf;
        const tick = () => {
            raf = requestAnimationFrame(tick);
            if (!visible || !uniforms.uTex.value) return;
            renderer.render(scene, camera);
        };
        tick();

        return () => {
            cancelAnimationFrame(raf);
            revealTween.kill();
            if (dissolveTrigger) dissolveTrigger.kill();
            io.disconnect();
            ro.disconnect();
            material.dispose();
            quad.geometry.dispose();
            uniforms.uTex.value?.dispose?.();
            renderer.dispose();
            if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
        };
    }, [src]);

    return <div ref={mountRef} className="absolute inset-0" aria-hidden="true" />;
}

/* ------------------------------------------------------------------ */
/*  Framer Motion – magnetic button                                    */
/* ------------------------------------------------------------------ */
function MagneticButton({ children, primary = false, onClick }) {
    const ref = useRef(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const sx = useSpring(x, { stiffness: 220, damping: 16, mass: 0.4 });
    const sy = useSpring(y, { stiffness: 220, damping: 16, mass: 0.4 });

    const onMove = (e) => {
        const r = ref.current.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * 0.25);
        y.set((e.clientY - (r.top + r.height / 2)) * 0.35);
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
            style={{ x: sx, y: sy }}
            whileTap={{ scale: 0.96 }}
            className={
                "rounded-full px-6 py-3 text-sm font-medium transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 " +
                (primary
                    ? "bg-white text-black hover:bg-[#e94f25] hover:text-white focus-visible:outline-white"
                    : "border border-white/25 bg-white/5 text-white backdrop-blur hover:border-white/60 hover:bg-white/10 focus-visible:outline-white")
            }
        >
            {children}
        </motion.button>
    );
}

/* One line of the right-hand note, split into letters like the name so it can
   rise in and dissolve letter by letter. */
function NoteLine({ text, className = "" }) {
    return (
        <p className={"whitespace-nowrap " + className}>
            <span className="sr-only">{text}</span>
            {text.split("").map((ch, i) => (
                <span
                    key={i}
                    aria-hidden="true"
                    className="inline-block overflow-hidden align-bottom px-[0.05em] -mx-[0.05em] pb-[0.2em] -mb-[0.2em]"
                >
                    <span data-note-letter className="inline-block will-change-transform">
                        {ch === " " ? "\u00A0" : ch}
                    </span>
                </span>
            ))}
        </p>
    );
}

/* ------------------------------------------------------------------ */
/*  Hero                                                               */
/* ------------------------------------------------------------------ */
export default function Hero() {
    const rootRef = useRef(null);
    const nameRef = useRef(null);
    const portraitRef = useRef(null);

    // load display + body fonts once
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

    // GSAP: name entrance, mouse parallax, scroll parallax
    useEffect(() => {
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        const ctx = gsap.context(() => {
            const letters = nameRef.current.querySelectorAll("[data-letter]");

            if (!reduceMotion) {
                gsap.set(letters, { yPercent: 110, rotate: 6, opacity: 0 });
                gsap
                    .timeline({ delay: 0.5 })
                    .to(letters, {
                        yPercent: 0,
                        rotate: 0,
                        opacity: 1,
                        duration: 1.3,
                        ease: "expo.out",
                        stagger: 0.055,
                    })
                    .from(
                        "[data-fade]",
                        { opacity: 0, y: 18, duration: 0.9, ease: "power3.out", stagger: 0.12 },
                        "-=0.7"
                    )
                    // right-hand note: letters rise into place, like the name
                    .from(
                        "[data-note-letter]",
                        { yPercent: 110, rotate: 6, opacity: 0, duration: 1.1, ease: "expo.out", stagger: 0.03 },
                        "-=1.3"
                    );
            }

            // mouse parallax: only the name drifts – the portrait stays still
            const nameX = gsap.quickTo(nameRef.current, "x", { duration: 0.9, ease: "power3.out" });
            const nameY = gsap.quickTo(nameRef.current, "y", { duration: 0.9, ease: "power3.out" });
            const noteEl = rootRef.current.querySelector("[data-note-wrap]");
            const noteX = noteEl && gsap.quickTo(noteEl, "x", { duration: 1.1, ease: "power3.out" });
            const noteY = noteEl && gsap.quickTo(noteEl, "y", { duration: 1.1, ease: "power3.out" });

            const onMove = (e) => {
                if (reduceMotion) return;
                const nx = e.clientX / window.innerWidth - 0.5;
                const ny = e.clientY / window.innerHeight - 0.5;
                nameX(nx * 26);
                nameY(ny * 14);
                if (noteEl) {
                    noteX(nx * -14);
                    noteY(ny * -8);
                }
            };
            window.addEventListener("pointermove", onMove);

            // scroll parallax: portrait slower than name
            if (!reduceMotion) {
                gsap.to("[data-parallax='slow']", {
                    yPercent: 6,
                    ease: "none",
                    scrollTrigger: { trigger: rootRef.current, start: "top top", end: "bottom top", scrub: true },
                });
                gsap.to("[data-parallax='fast']", {
                    yPercent: -16,
                    ease: "none",
                    scrollTrigger: { trigger: rootRef.current, start: "top top", end: "bottom top", scrub: true },
                });

                // minimal dissolve, same idea as the portrait: letters break away in a ragged
                // left-to-right sweep, drift up and right with the "wind", and turn ember orange
                const n = letters.length;
                const dissolve = gsap.timeline({
                    scrollTrigger: { trigger: rootRef.current, start: "top top", end: "bottom 40%", scrub: 0.5 },
                });
                letters.forEach((el, i) => {
                    const sweep = n > 1 ? i / (n - 1) : 0;
                    const at = (sweep * 0.65 + Math.random() * 0.35) * 0.7;
                    dissolve.fromTo(
                        el.parentElement, // the clipping wrapper, so the entrance tween is left alone
                        { x: 0, y: 0, rotate: 0, opacity: 1, filter: "blur(0px)", color: "#f3efe8" },
                        {
                            x: gsap.utils.random(18, 70),
                            y: gsap.utils.random(-60, -15),
                            rotate: gsap.utils.random(-18, 18),
                            opacity: 0,
                            filter: "blur(6px)",
                            color: ORANGE,
                            ease: "power2.in",
                            duration: 0.3,
                            immediateRender: false,
                        },
                        at
                    );
                });
                // tagline + buttons just melt away a little earlier
                dissolve.fromTo(
                    "[data-soft]",
                    { opacity: 1, y: 0, filter: "blur(0px)" },
                    { opacity: 0, y: -24, filter: "blur(8px)", ease: "power1.in", duration: 0.35, immediateRender: false },
                    0.05
                );
                // right-hand note: exactly the same letter-by-letter dissolve as the name
                const noteLetters = gsap.utils.toArray("[data-note-letter]");
                const m = noteLetters.length;
                noteLetters.forEach((el, i) => {
                    const wrap = el.parentElement;
                    const sweep = m > 1 ? i / (m - 1) : 0;
                    const at = (sweep * 0.65 + Math.random() * 0.35) * 0.7;
                    dissolve.fromTo(
                        wrap,
                        { x: 0, y: 0, rotate: 0, opacity: 1, filter: "blur(0px)", color: getComputedStyle(wrap).color },
                        {
                            x: gsap.utils.random(18, 70),
                            y: gsap.utils.random(-60, -15),
                            rotate: gsap.utils.random(-18, 18),
                            opacity: 0,
                            filter: "blur(6px)",
                            color: ORANGE,
                            ease: "power2.in",
                            duration: 0.3,
                            immediateRender: false,
                        },
                        at
                    );
                });
            }

            return () => window.removeEventListener("pointermove", onMove);
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
            className="relative flex min-h-screen w-full items-end justify-center overflow-hidden bg-black text-white"
            style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
        >
            {/* ambient glow */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                    background:
                        "radial-gradient(60% 50% at 62% 30%, rgba(233,79,37,0.22) 0%, rgba(233,79,37,0) 60%), radial-gradient(40% 40% at 20% 80%, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0) 70%)",
                }}
            />

            {/* fine grain */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 opacity-[0.07] mix-blend-screen"
                style={{
                    backgroundImage:
                        "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='2'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
                }}
            />

            {/* right side note – desktop only, vertically centred to mirror the name on the left */}
            <div
                data-note-wrap
                className="absolute inset-y-0 right-5 hidden items-center md:flex lg:right-10"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
                <div data-note className="text-right">
                    <NoteLine
                        text="BASED IN INDIA"
                        className="text-[12px] tracking-[0.25em] text-[#e94f25] lg:text-[13px]"
                    />
                    <NoteLine
                        text="Open to freelance & collabs"
                        className="mt-3 text-[14px] leading-snug text-white/70 lg:text-base"
                    />
                </div>
            </div>

            {/* portrait (Three.js) – face sits near the middle, name sits below the chin */}
            <div
                data-parallax="slow"
                className="absolute left-1/2 top-[12vh] h-[58vh] w-[min(78vw,320px)] -translate-x-1/2 md:top-auto md:h-[100vh] md:w-[min(84vw,460px)]"
            >
                <div ref={portraitRef} className="relative h-full w-full">
                    <PortraitCanvas src={PORTRAIT_SRC} />
                </div>
            </div>

            {/* looping label just under the chin (desktop) – follows FRAME_Y */}
            <div
                data-fade
                className="absolute left-1/2 z-10 hidden -translate-x-1/2 md:block"
                style={{
                    top: `${FRAME_Y * 100 + 12}vh`,
                    fontFamily: "'JetBrains Mono', monospace",
                }}
            >
                <div
                    className="w-[300px] overflow-hidden text-[10px] tracking-[0.3em] text-white/60"
                    style={{
                        WebkitMaskImage: "linear-gradient(90deg, transparent, #000 18%, #000 82%, transparent)",
                        maskImage: "linear-gradient(90deg, transparent, #000 18%, #000 82%, transparent)",
                    }}
                >
                    <motion.div
                        className="flex w-max whitespace-nowrap"
                        animate={{ x: ["0%", "-50%"] }}
                        transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
                    >
                        {[0, 1].map((k) => (
                            <span key={k} className="pr-10">
                                {MARQUEE}
                            </span>
                        ))}
                    </motion.div>
                </div>
            </div>

            {/* content */}
            <div className="relative z-10 flex w-full flex-col items-center px-5 pb-[13vh] text-center md:static md:pb-[5vh]">
                {/* name */}
                <div className="md:absolute md:inset-y-0 md:left-5 md:flex md:items-center lg:left-10">
                    <div data-parallax="fast">
                        <h1
                            ref={nameRef}
                            aria-label={NAME}
                            className="select-none whitespace-nowrap leading-[0.95] [font-size:clamp(3rem,9.5vw,11rem)] md:text-left md:[font-size:clamp(3rem,7vw,8rem)]"
                            style={{
                                fontFamily: "'Instrument Serif', Georgia, serif",
                                color: "#f3efe8",
                                letterSpacing: "-0.02em",
                                textShadow: "0 6px 40px rgba(0,0,0,0.65)",
                            }}
                        >
                            {NAME.split(" ").map((word, wi) => (
                                <span key={wi} className={"inline-block md:block " + (wi > 0 ? "md:ml-[0.8em]" : "")} style={{ fontStyle: wi === 0 ? "normal" : "italic" }}>
                                    {word.split("").map((ch, i) => (
                                        <span key={i} className="inline-block overflow-hidden align-bottom px-[0.05em] -mx-[0.05em] pb-[0.12em] -mb-[0.12em]">
                                            <span data-letter className="inline-block will-change-transform">
                                                {ch}
                                            </span>
                                        </span>
                                    ))}
                                    {wi === 0 && <span className="inline-block w-[0.28em] md:hidden" />}
                                </span>
                            ))}
                        </h1>
                    </div>
                </div>

                <div data-soft className="flex flex-col items-center">
                    {/* tagline */}
                    <p
                        data-fade
                        className="mt-4 max-w-[36ch] text-[15px] leading-relaxed text-white/80 sm:text-lg"
                    >
                        I build products, automate workflows, and help businesses grow online.
                    </p>

                    {/* CTAs */}
                    <div data-fade className="mt-7 flex flex-wrap items-center justify-center gap-3">
                        <MagneticButton primary onClick={() => scrollTo("work")}>
                            Explore my work
                        </MagneticButton>
                        <MagneticButton onClick={() => scrollTo("contact")}>Start a conversation</MagneticButton>
                    </div>
                </div>
            </div>


            {/* bottom fade into next section */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute bottom-0 left-0 h-32 w-full bg-gradient-to-t from-black to-transparent"
            />
        </section>
    );
}