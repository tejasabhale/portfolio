/**
 * Hero.jsx — minimal hero that matches Navbar.jsx (light + dark mode).
 *
 * - Headline, tagline and buttons settle in one after another on load.
 * - Buttons fill with a rising "water" shape on hover.
 * - Colors follow <html data-theme="light|dark">, which Navbar.jsx sets.
 *
 * Usage:
 *   <Hero name="Tejas" tagline="I design and build simple, fast websites." />
 * The section has id="home", so the navbar link and scroll spy work.
 * No dependencies besides React.
 */

export default function Hero({
    name = "Tejas",
    tagline = "I design and build simple, fast websites.",
}) {
    return (
        <section id="home" className="hero">
            <style>{css}</style>

            <div className="hero-inner">
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
        </section>
    );
}

const css = `
.hero {
  /* light palette */
  --paper: #ffffff;
  --ink: #111111;
  --muted: #6b7280;
  --line: #d9dde3;
  --navy: #1f3a5f;
  --water-dark: #111111;   /* fill that rises inside the primary button */
  --ease-water: cubic-bezier(.65, 0, .35, 1);
  --ease-drop: cubic-bezier(.34, 1.45, .64, 1);
  font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  background: var(--paper);
  color: var(--ink);
  min-height: 100vh;
  min-height: 100svh;
  display: flex; align-items: center;
  padding: 110px 36px 64px;
  box-sizing: border-box;
  transition: background .5s ease, color .5s ease;
}

/* dark palette */
:root[data-theme="dark"] .hero {
  --paper: #0d1014;
  --ink: #f3f4f6;
  --muted: #9aa3af;
  --line: #262b33;
  --navy: #4a78c2;
  --water-dark: #1b2a44;
}

.hero-inner {
  width: min(100%, 1100px);
  margin: 0 auto;
}

/* ---------- text ---------- */
.hero-title {
  margin: 0;
  font-size: clamp(2.5rem, 8vw, 5rem);
  font-weight: 700; letter-spacing: -.04em; line-height: 1.05;
  max-width: 12ch;
}
.hero-tagline {
  margin: 28px 0 0;
  font-size: clamp(1.05rem, 2.4vw, 1.4rem);
  line-height: 1.55;
  color: var(--muted);
  max-width: 30ch;
}

/* ---------- load sequence ---------- */
.hero-title, .hero-tagline, .hero-actions {
  opacity: 0; transform: translateY(22px);
  animation: hero-rise 1s var(--ease-drop) forwards;
}
.hero-title   { animation-delay: .15s; }
.hero-tagline { animation-delay: .35s; }
.hero-actions { animation-delay: .55s; }
@keyframes hero-rise {
  to { opacity: 1; transform: none; }
}

/* ---------- buttons ---------- */
.hero-actions {
  display: flex; flex-wrap: wrap; gap: 14px;
  margin-top: 44px;
}
.hero-btn {
  position: relative; isolation: isolate; overflow: hidden;
  display: inline-block;
  padding: 14px 26px;
  font: inherit; font-size: .95rem; font-weight: 600;
  text-decoration: none;
  border-radius: 10px;
  transition: color .5s ease, border-color .5s ease;
}
/* rising water */
.hero-btn::before {
  content: ""; position: absolute; z-index: -1;
  left: 50%; top: 100%;
  width: 240%; aspect-ratio: 1;
  border-radius: 46% 54% 50% 50%;
  transform: translate(-50%, 0);
  transition: transform .9s var(--ease-water), border-radius .9s var(--ease-water);
}
.hero-btn:hover::before,
.hero-btn:focus-visible::before {
  transform: translate(-50%, -64%);
  border-radius: 50%;
}

.hero-btn-primary {
  background: var(--navy); color: #fff;
  border: 1px solid var(--navy);
}
.hero-btn-primary::before { background: var(--water-dark); }
.hero-btn-primary:hover,
.hero-btn-primary:focus-visible { border-color: var(--water-dark); }

.hero-btn-ghost {
  background: transparent; color: var(--ink);
  border: 1px solid var(--ink);
}
.hero-btn-ghost::before { background: var(--navy); }
.hero-btn-ghost:hover,
.hero-btn-ghost:focus-visible { color: #fff; border-color: var(--navy); }

.hero-btn:focus-visible { outline: 2px solid var(--navy); outline-offset: 3px; }

/* ---------- responsive ---------- */
@media (max-width: 768px) {
  .hero { padding: 100px 24px 48px; }
  .hero-actions { margin-top: 36px; }
}
@media (max-width: 420px) {
  .hero-btn { width: 100%; text-align: center; }
}

/* ---------- reduced motion ---------- */
@media (prefers-reduced-motion: reduce) {
  .hero { transition: none; }
  .hero-title, .hero-tagline, .hero-actions {
    animation: none; opacity: 1; transform: none;
  }
  .hero-btn, .hero-btn::before { transition-duration: .01s !important; }
}
`;