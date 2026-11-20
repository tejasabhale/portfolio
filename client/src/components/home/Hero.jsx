import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { TextPlugin } from "gsap/TextPlugin";
import {
  motion,
  useMotionValue,
  useScroll,
  useSpring,
  useTransform,
} from "framer-motion";

gsap.registerPlugin(TextPlugin);

/**
 * Hero.jsx — minimal hero that matches Navbar.jsx (light + dark mode).
 *
 * - Title:     words slide up out of a mask (GSAP), one after another.
 * - Typing:    a GSAP TextPlugin typewriter cycles through `roles` (no typed.js).
 * - Portrait:  3D mouse tilt with spring physics + a slow idle float (mouse only).
 * - Scroll:    text and portrait drift and fade out at different speeds (framer-motion).
 * - Buttons:   magnetic pull toward the cursor + the rising "water" fill on hover.
 * - Layout:    centered; phones stack portrait above text, larger screens put
 *              text left and portrait right. Nothing overlaps.
 * - Reduced motion: everything appears instantly, typing shows the first role.
 *
 * Colors and easings come only from index.css variables.
 * Photo lives at public/tejas-portrait.png, so it is served from "/tejas-portrait.png".
 *
 * Usage:
 *   <Hero name="Tejas" tagline="I design and build simple, fast websites." />
 * The section has id="home", so the navbar link and scroll spy work.
 */

const prefersReduced = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* anchor that is gently pulled toward the cursor */
function MagneticLink({ href, className, children, strength = 0.28 }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 240, damping: 16, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 240, damping: 16, mass: 0.4 });

  const move = (e) => {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - (r.left + r.width / 2)) * strength);
    y.set((e.clientY - (r.top + r.height / 2)) * strength);
  };
  const leave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.a
      href={href}
      className={className}
      style={{ x: sx, y: sy }}
      onPointerMove={move}
      onPointerLeave={leave}
      whileTap={{ scale: 0.95 }}
    >
      {children}
    </motion.a>
  );
}

export default function Hero({
  name = "Tejas",
  tagline = "Building impactful digital experiences.",
  photo = "/tejas-portrait.png",
  roles = ["Full-Stack Developer", "AI/ML Developer", "Software Engineer"],
}) {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const typeRef = useRef(null);
  const frameRef = useRef(null);

  /* ---------- GSAP: title reveal, typewriter, idle float ---------- */
  useLayoutEffect(() => {
    const reduce = prefersReduced();
    const typeEl = typeRef.current;

    if (reduce) {
      if (typeEl) typeEl.textContent = roles[0];
      return;
    }

    const ctx = gsap.context(() => {
      gsap.set(".hero-word-in", { yPercent: 115, rotate: 6, transformOrigin: "0% 100%" });
      gsap.to(".hero-word-in", {
        yPercent: 0,
        rotate: 0,
        duration: 1.2,
        ease: "expo.out",
        stagger: 0.12,
        delay: 0.15,
      });

      // typewriter: type a role, hold, erase, next
      const tl = gsap.timeline({ repeat: -1, delay: 1.2 });
      roles.forEach((role) => {
        tl.to(typeEl, { duration: Math.max(0.7, role.length * 0.07), text: role, ease: "none" })
          .to({}, { duration: 1.5 })
          .to(typeEl, { duration: role.length * 0.035, text: "", ease: "none" })
          .to({}, { duration: 0.25 });
      });

      // slow idle float on the portrait frame
      gsap.to(frameRef.current, {
        y: -8,
        duration: 3.2,
        ease: "sine.inOut",
        yoyo: true,
        repeat: -1,
        delay: 1.6,
      });
    }, sectionRef);

    return () => ctx.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- framer-motion: scroll drift + fade ---------- */
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start start", "end start"],
  });
  const copyY = useTransform(scrollYProgress, [0, 1], [0, -70]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);
  const photoY = useTransform(scrollYProgress, [0, 1], [0, 60]);
  const photoScale = useTransform(scrollYProgress, [0, 1], [1, 0.94]);
  const photoOpacity = useTransform(scrollYProgress, [0, 0.85], [1, 0]);

  /* ---------- framer-motion: 3D tilt ---------- */
  const tx = useMotionValue(0);
  const ty = useMotionValue(0);
  const rotateY = useSpring(useTransform(tx, [-0.5, 0.5], [-9, 9]), { stiffness: 140, damping: 16 });
  const rotateX = useSpring(useTransform(ty, [-0.5, 0.5], [9, -9]), { stiffness: 140, damping: 16 });

  const onTilt = (e) => {
    if (e.pointerType !== "mouse") return;
    const r = e.currentTarget.getBoundingClientRect();
    tx.set((e.clientX - r.left) / r.width - 0.5);
    ty.set((e.clientY - r.top) / r.height - 0.5);
  };
  const offTilt = () => {
    tx.set(0);
    ty.set(0);
  };

  const words = [`Hi,`, `I’m`, `${name}.`];

  return (
    <section id="home" className="hero" ref={sectionRef}>
      <style>{css}</style>

      <div className="hero-inner">
        <motion.div className="hero-copy" style={{ y: copyY, opacity: copyOpacity }}>
          <h1 className="hero-title" ref={titleRef} aria-label={words.join(" ")}>
            {words.map((w, i) => (
              <span key={i}>
                <span className="hero-word" aria-hidden="true">
                  <span className="hero-word-in">{w}</span>
                </span>
                {i < words.length - 1 ? " " : null}
              </span>
            ))}
          </h1>

          <p className="hero-tagline">{tagline}</p>

          <p className="hero-role" aria-label={roles.join(", ")}>
            <span className="hero-role-label" aria-hidden="true">Currently a</span>
            <span className="hero-role-type" ref={typeRef} aria-hidden="true" />
            <span className="hero-caret" aria-hidden="true" />
          </p>

          <div className="hero-actions">
            <MagneticLink href="#projects" className="hero-btn hero-btn-primary">
              <span>View projects</span>
            </MagneticLink>
            <MagneticLink href="#contact" className="hero-btn hero-btn-ghost">
              <span>Contact me</span>
            </MagneticLink>
          </div>
        </motion.div>

        <figure
          className="hero-photo"
          onPointerMove={onTilt}
          onPointerLeave={offTilt}
        >
          <motion.div
            className="hero-tilt"
            style={{
              rotateX,
              rotateY,
              y: photoY,
              scale: photoScale,
              opacity: photoOpacity,
              transformPerspective: 900,
            }}
          >
            <div className="hero-frame" ref={frameRef}>
              <img
                src={photo}
                alt={`Portrait of ${name}`}
                width="420"
                height="525"
                fetchPriority="high"
                decoding="async"
              />
            </div>
          </motion.div>
        </figure>
      </div>
    </section>
  );
}

const css = `
.hero {
  /* photo controls: overridden per screen below */
  --photo-w: clamp(260px, min(36vw, calc((100svh - 190px) * .8)), 460px);
  --photo-pos: center 20%;
  --frame: 14px;
  --photo-r: 24px;

  background: var(--paper);
  color: var(--ink);
  min-height: 100vh;
  min-height: 100svh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(92px, 13vh, 116px) clamp(20px, 5vw, 48px) clamp(36px, 7vh, 64px);
  box-sizing: border-box;
  overflow-x: clip;
  transition: background .6s var(--ease-flow), color .6s var(--ease-flow);
}

.hero-inner {
  width: min(100%, 1100px);
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: clamp(32px, 7vw, 96px);
}

.hero-copy { min-width: 0; will-change: transform, opacity; }

/* ---------- text ---------- */
.hero-title {
  margin: 0;
  font-size: clamp(2.4rem, 7.5vw, 5rem);
  font-weight: 700;
  letter-spacing: -.04em;
  line-height: 1.05;
  max-width: 12ch;
  overflow-wrap: break-word;
}

/* each word rises out of its own mask */
.hero-word {
  display: inline-block;
  overflow: hidden;
  vertical-align: top;
  padding-bottom: .14em;
  margin-bottom: -.14em;
}
.hero-word-in { display: inline-block; will-change: transform; }

.hero-tagline {
  margin: clamp(16px, 3vh, 28px) 0 0;
  font-size: clamp(1rem, 2.4vw, 1.4rem);
  line-height: 1.55;
  color: var(--muted);
  max-width: 30ch;
}

/* typewriter line */
.hero-role {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: .5ch;
  margin: clamp(14px, 2.4vh, 22px) 0 0;
  min-height: 1.6em;
  font-size: clamp(.9rem, 1.8vw, 1.05rem);
  font-weight: 600;
  letter-spacing: -.01em;
}
.hero-role-label { color: var(--muted); font-weight: 500; }
.hero-role-type { color: var(--ink); white-space: pre; }
.hero-caret {
  width: 2px;
  height: 1.15em;
  margin-left: -.15ch;
  background: var(--navy);
  animation: hero-blink 1s steps(1) infinite;
}
@keyframes hero-blink { 50% { opacity: 0; } }

/* ---------- photo ---------- */
.hero-photo {
  margin: 0;
  width: var(--photo-w);
}

.hero-tilt { will-change: transform; transform-style: preserve-3d; }

/* the frame offset lives inside the figure's box, so it never spills out */
.hero-frame {
  position: relative;
  isolation: isolate;
  width: calc(100% - var(--frame));
  margin-bottom: var(--frame);
}

.hero-frame img {
  display: block;
  width: 100%;
  height: auto;
  aspect-ratio: 4 / 5;
  object-fit: cover;
  object-position: var(--photo-pos);
  border-radius: var(--photo-r);
  background: var(--mist);
}

/* offset hairline frame behind the photo */
.hero-frame::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  border: 1px solid var(--navy);
  border-radius: var(--photo-r);
  transform: translate(var(--frame), var(--frame));
  transition: transform 1.1s var(--ease-flow);
}

.hero-frame:hover::before {
  transform: translate(calc(var(--frame) * .5), calc(var(--frame) * .5));
}

/* ---------- load sequence (title is animated by GSAP) ---------- */
.hero-tagline, .hero-role, .hero-actions, .hero-photo {
  opacity: 0;
  transform: translateY(18px);
  filter: blur(6px);
  animation: hero-rise 1.3s var(--ease-flow) forwards;
}

.hero-tagline { animation-delay: .35s; }
.hero-role    { animation-delay: .5s; }
.hero-actions { animation-delay: .65s; }
.hero-photo   { animation-delay: .4s; }

@keyframes hero-rise {
  to {
    opacity: 1;
    transform: none;
    filter: none;
  }
}

/* ---------- buttons ---------- */
.hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 14px;
  margin-top: clamp(28px, 5vh, 44px);
}

.hero-btn {
  position: relative;
  isolation: isolate;
  overflow: hidden;
  display: inline-block;
  padding: 14px 26px;
  font: inherit;
  font-size: .95rem;
  font-weight: 600;
  line-height: 1.2;
  text-decoration: none;
  text-align: center;
  border-radius: 10px;
  transition: color .7s var(--ease-flow), border-color .7s var(--ease-flow);
}

/* rising water */
.hero-btn::before {
  content: "";
  position: absolute;
  z-index: -1;
  left: 50%;
  top: 100%;
  width: 240%;
  aspect-ratio: 1;
  border-radius: 46% 54% 50% 50%;
  transform: translate(-50%, 0);
  transition: transform 1.1s var(--ease-flow), border-radius 1.1s var(--ease-flow);
}

.hero-btn:hover::before,
.hero-btn:focus-visible::before {
  transform: translate(-50%, -64%);
  border-radius: 50%;
}

/* View projects: always white text */
.hero-btn-primary {
  background: var(--navy);
  color: #fff;
  border: 1px solid var(--navy);
}
.hero-btn-primary::before { background: var(--water-dark); }
.hero-btn-primary:hover,
.hero-btn-primary:focus-visible { color: #fff; border-color: var(--water-dark); }

/* Contact me: theme-aware text */
.hero-btn-ghost {
  background: transparent;
  color: var(--ink);
  border: 1px solid var(--ink);
}
.hero-btn-ghost::before { background: var(--navy); }
.hero-btn-ghost:hover,
.hero-btn-ghost:focus-visible { color: #fff; border-color: var(--navy); }

.hero-btn:focus-visible {
  outline: 2px solid var(--navy);
  outline-offset: 3px;
}

/* ==========================================================
   Responsive
   ========================================================== */

/* tablet landscape / small laptop */
@media (min-width: 769px) and (max-width: 1024px) {
  .hero {
    --photo-w: clamp(250px, min(34vw, calc((100svh - 190px) * .8)), 340px);
    --frame: 12px;
    --photo-r: 22px;
  }
  .hero-inner { gap: clamp(24px, 4vw, 48px); }
}

/* phones + small tablets: stacked, everything centered */
@media (max-width: 768px) {
  .hero {
    --photo-w: clamp(210px, 58vw, 320px);
    --photo-pos: center 15%;
    --frame: 10px;
    --photo-r: 20px;
    align-items: flex-start;
    padding-top: 100px;
  }

  .hero-inner {
    grid-template-columns: minmax(0, 1fr);
    gap: 32px;
    justify-items: center;
  }

  /* centers the picture itself, not the picture plus its offset frame */
  .hero-photo { order: -1; translate: calc(var(--frame) / -2) 0; }

  .hero-copy { text-align: center; }
  .hero-title { margin-inline: auto; max-width: 14ch; }
  .hero-tagline { margin-inline: auto; max-width: 32ch; }
  .hero-role { justify-content: center; }
  .hero-actions { justify-content: center; }
}

/* small phones: full-width stacked buttons */
@media (max-width: 480px) {
  .hero { --photo-w: clamp(200px, 62vw, 270px); --frame: 8px; --photo-r: 18px; padding-top: 92px; }
  .hero-inner { gap: 28px; }
  .hero-actions { flex-direction: column; gap: 12px; }
  .hero-btn { width: 100%; }
}

/* tiny phones */
@media (max-width: 340px) {
  .hero { --photo-w: 180px; }
  .hero-title { font-size: 2rem; }
}

/* phones in landscape: two columns again, photo sized by height */
@media (max-height: 520px) and (orientation: landscape) {
  .hero {
    --photo-w: clamp(140px, 52vh, 240px);
    --frame: 8px;
    --photo-r: 16px;
    align-items: center;
    padding: 76px 24px 28px;
  }

  .hero-inner {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 32px;
    justify-items: stretch;
  }

  .hero-photo { order: 0; translate: none; }
  .hero-copy { text-align: left; }
  .hero-title { font-size: clamp(1.8rem, 6vw, 2.6rem); margin-inline: 0; max-width: 14ch; }
  .hero-tagline { margin: 12px 0 0; font-size: 1rem; }
  .hero-role { justify-content: flex-start; margin-top: 10px; }
  .hero-actions { flex-direction: row; justify-content: flex-start; margin-top: 20px; }
  .hero-btn { width: auto; padding: 11px 20px; }
}

/* very large screens: bigger type, content width stays 1100px */
@media (min-width: 1600px) {
  .hero-title { font-size: 5.5rem; }
  .hero-tagline { font-size: 1.55rem; }
}

/* ---------- reduced motion ---------- */
@media (prefers-reduced-motion: reduce) {
  .hero { transition: none; }

  .hero-tagline, .hero-role, .hero-actions, .hero-photo {
    animation: none;
    opacity: 1;
    transform: none;
    filter: none;
  }

  .hero-caret { animation: none; }

  .hero-btn, .hero-btn::before, .hero-frame::before {
    transition-duration: .01s !important;
  }
}
`;