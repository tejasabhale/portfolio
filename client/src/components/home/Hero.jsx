
/**
 * Hero.jsx — minimal hero that matches Navbar.jsx (light + dark mode).
 *
 * - Headline, tagline and buttons settle in one after another on load.
 * - Portrait is larger now. On phones and small tablets it is centered
 *   above centered text; on larger screens it sits on the right.
 * - Buttons fill with a rising "water" shape on hover.
 * - Hero is at least one screen tall; it grows only if the content needs more room.
 *
 * Colors and easings come only from index.css variables.
 * Photo lives at public/tejas-portrait.png, so it is served from "/tejas-portrait.png".
 *
 * Usage:
 *   <Hero name="Tejas" tagline="I design and build simple, fast websites." />
 * The section has id="home", so the navbar link and scroll spy work.
 */

export default function Hero({
    name = "Tejas",
    tagline = "I design and build simple, fast websites.",
    photo = "/tejas-portrait.png",
}) {
    return (
        <section id="home" className="hero">
            <style>{css}</style>

            <div className="hero-inner">
                <div className="hero-copy">
                    <h1 className="hero-title">Hi, I’m {name}.</h1>
                    <p className="hero-tagline">{tagline}</p>

                    <div className="hero-actions">
                        <a href="#projects" className="hero-btn hero-btn-primary">
                            <span>View projects</span>
                        </a>
                        <a href="#contact" className="hero-btn hero-btn-ghost">
                            <span>Contact me</span>
                        </a>
                    </div>
                </div>

                <figure className="hero-photo">
                    <img
                        src={photo}
                        alt={`Portrait of ${name}`}
                        width="420"
                        height="525"
                        fetchPriority="high"
                        decoding="async"
                    />
                </figure>
            </div>
        </section>
    );
}

const css = `
.hero {
  /* photo controls: overridden per screen below */
  --photo-w: clamp(280px, 36vw, 480px);
  --photo-lift: -24px;
  --photo-pos: center 20%;
  --frame: 14px;
  --photo-r: 24px;

  background: var(--paper);
  color: var(--ink);
  min-height: 100vh;
  min-height: 100svh;
  display: flex;
  align-items: center;
  padding: clamp(84px, 12vh, 110px) clamp(20px, 4vw, 36px) clamp(32px, 6vh, 56px);
  box-sizing: border-box;
  overflow-x: clip;
  transition: background .5s ease, color .5s ease;
}

.hero-inner {
  width: min(100%, 1100px);
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: clamp(24px, 6vw, 88px);
}

.hero-copy { min-width: 0; }

/* ---------- text ---------- */
.hero-title {
  margin: 0;
  font-size: clamp(2.2rem, 7.5vw, 5rem);
  font-weight: 700;
  letter-spacing: -.04em;
  line-height: 1.05;
  max-width: 12ch;
  overflow-wrap: break-word;
}

.hero-tagline {
  margin: clamp(16px, 3vh, 28px) 0 0;
  font-size: clamp(1rem, 2.4vw, 1.4rem);
  line-height: 1.55;
  color: var(--muted);
  max-width: 30ch;
}

/* ---------- photo ---------- */
.hero-photo {
  position: relative;
  isolation: isolate;
  top: var(--photo-lift);
  margin: 0;
  width: var(--photo-w);
}

.hero-photo img {
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
.hero-photo::before {
  content: "";
  position: absolute;
  inset: 0;
  z-index: -1;
  border: 1px solid var(--navy);
  border-radius: var(--photo-r);
  transform: translate(var(--frame), var(--frame));
  transition: transform .9s var(--ease-water);
}

.hero-photo:hover::before {
  transform: translate(calc(var(--frame) * .55), calc(var(--frame) * .55));
}

/* ---------- load sequence ---------- */
.hero-title, .hero-tagline, .hero-actions, .hero-photo {
  opacity: 0;
  transform: translateY(22px);
  animation: hero-rise 1s var(--ease-drop) forwards;
}

.hero-title   { animation-delay: .15s; }
.hero-tagline { animation-delay: .35s; }
.hero-actions { animation-delay: .55s; }
.hero-photo   { animation-delay: .4s; }

@keyframes hero-rise {
  to {
    opacity: 1;
    transform: none;
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
  text-decoration: none;
  text-align: center;
  border-radius: 10px;
  transition: color .5s ease, border-color .5s ease;
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
  transition: transform .9s var(--ease-water), border-radius .9s var(--ease-water);
}

.hero-btn:hover::before,
.hero-btn:focus-visible::before {
  transform: translate(-50%, -64%);
  border-radius: 50%;
}

/* View projects — always white text */
.hero-btn-primary {
  background: var(--navy);
  color: #fff;
  border: 1px solid var(--navy);
}

.hero-btn-primary::before {
  background: var(--water-dark);
}

.hero-btn-primary:hover,
.hero-btn-primary:focus-visible {
  color: #fff;
  border-color: var(--water-dark);
}

/* Contact me — theme-aware text color */
.hero-btn-ghost {
  background: transparent;
  color: var(--ink);
  border: 1px solid var(--ink);
}

.hero-btn-ghost::before {
  background: var(--navy);
}

.hero-btn-ghost:hover,
.hero-btn-ghost:focus-visible {
  color: #fff;
  border-color: var(--navy);
}

.hero-btn:focus-visible {
  outline: 2px solid var(--navy);
  outline-offset: 3px;
}

/* ==========================================================
   Photo size + position per screen
   ========================================================== */

/* large desktop */
@media (min-width: 1280px) {
  .hero {
    --photo-w: clamp(400px, min(34vw, 66vh), 500px);
    --photo-lift: -32px;
  }
}

/* laptop */
@media (min-width: 1025px) and (max-width: 1279px) {
  .hero {
    --photo-w: clamp(340px, min(34vw, 62vh), 420px);
    --photo-lift: -24px;
  }
}

/* tablet landscape / small laptop: two columns */
@media (min-width: 769px) and (max-width: 1024px) {
  .hero {
    --photo-w: clamp(280px, min(36vw, 58vh), 360px);
    --photo-lift: -12px;
    --frame: 12px;
    --photo-r: 22px;
  }

  .hero-inner {
    gap: clamp(24px, 4vw, 48px);
  }
}

/* phones + small tablets: stacked, everything centered */
@media (max-width: 768px) {
  .hero {
    --photo-w: clamp(200px, min(60vw, 38vh), 320px);
    --photo-lift: 0px;
    --photo-pos: center 15%;
    --frame: 10px;
    --photo-r: 20px;
    align-items: flex-start;
    padding-top: 92px;
  }

  .hero-inner {
    grid-template-columns: minmax(0, 1fr);
    gap: 32px;
    justify-items: center;
  }

  .hero-photo {
    order: -1;
    left: calc(var(--frame) / -2);
    justify-self: center;
  }

  .hero-copy { text-align: center; }

  .hero-title {
    margin-inline: auto;
    max-width: 14ch;
  }

  .hero-tagline {
    margin-inline: auto;
    max-width: 32ch;
  }

  .hero-actions { justify-content: center; }
}

/* small phones: full-width stacked buttons */
@media (max-width: 480px) {
  .hero {
    --photo-w: clamp(190px, min(62vw, 36vh), 270px);
    --frame: 8px;
    --photo-r: 18px;
    padding-top: 84px;
  }

  .hero-inner { gap: 28px; }

  .hero-actions {
    flex-direction: column;
    gap: 12px;
  }

  .hero-btn { width: 100%; }
}

/* tiny phones */
@media (max-width: 340px) {
  .hero { --photo-w: 170px; }
  .hero-title { font-size: 2rem; }
}

/* phones in landscape: two columns again, left-aligned text, photo sized by height */
@media (max-height: 520px) and (orientation: landscape) {
  .hero {
    --photo-w: clamp(130px, 50vh, 240px);
    --photo-lift: 0px;
    --photo-pos: center 20%;
    --frame: 8px;
    --photo-r: 16px;
    align-items: center;
    padding: 72px 24px 24px;
  }

  .hero-inner {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 32px;
    justify-items: stretch;
  }

  .hero-photo {
    order: 0;
    left: 0;
    justify-self: auto;
  }

  .hero-copy { text-align: left; }

  .hero-title {
    font-size: clamp(1.8rem, 6vw, 2.6rem);
    margin-inline: 0;
    max-width: 14ch;
  }

  .hero-tagline {
    margin: 12px 0 0;
    font-size: 1rem;
  }

  .hero-actions {
    flex-direction: row;
    justify-content: flex-start;
    margin-top: 20px;
  }

  .hero-btn {
    width: auto;
    padding: 11px 20px;
  }
}

/* very large screens: bigger type, content width stays 1100px */
@media (min-width: 1600px) {
  .hero-title { font-size: 5.5rem; }
  .hero-tagline { font-size: 1.55rem; }
}

/* ---------- reduced motion ---------- */
@media (prefers-reduced-motion: reduce) {
  .hero { transition: none; }

  .hero-title, .hero-tagline, .hero-actions, .hero-photo {
    animation: none;
    opacity: 1;
    transform: none;
  }

  .hero-btn, .hero-btn::before, .hero-photo::before {
    transition-duration: .01s !important;
  }
}
`;
