import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";

/**
 * Navbar.jsx — minimal, liquid-motion navbar.
 *
 * - Indicator: one soft pill that stretches like a water drop. The edge
 *              facing the destination leaps ahead, the other follows.
 * - Scroll:    the bar gently condenses into a floating capsule.
 * - Mobile:    two layers flow outward from the button (navy rim, then panel).
 * - Theme:     the new theme spreads outward from the toggle like a ripple
 *              (View Transitions API, instant swap where unsupported).
 *
 * Theme is applied as <html data-theme="light|dark">, saved in localStorage.
 * Colors and theme values come only from index.css variables.
 * Sections need ids: home, about, projects, contact.
 */

const LINKS = [
  { id: "home", label: "Home" },
  { id: "projects", label: "Work" },
  { id: "skills", label: "Skills" },
  { id: "contact", label: "Contact" },
];

const THEME_KEY = "theme";
const EASE = "cubic-bezier(.16, 1, .3, 1)";

function getInitialTheme() {
  if (typeof window === "undefined") return "light";
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    /* storage unavailable */
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function Navbar({ name = "Tejas" }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState(LINKS[0].id);
  const [hovered, setHovered] = useState(null);
  const [pos, setPos] = useState({ l: 0, r: 0 });
  const [dir, setDir] = useState(1);
  const [ready, setReady] = useState(false);
  const [origin, setOrigin] = useState({ x: "100%", y: "0px" });
  const [theme, setTheme] = useState(getInitialTheme);

  const listRef = useRef(null);
  const linkRefs = useRef({});
  const burgerRef = useRef(null);
  const prevLeft = useRef(0);

  const target = hovered ?? active;
  const isDark = theme === "dark";

  /* ---------- theme ---------- */
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    root.style.colorScheme = theme;
  }, [theme]);

  const toggleTheme = (e) => {
    const next = isDark ? "light" : "dark";
    try {
      localStorage.setItem(THEME_KEY, next);
    } catch {
      /* ignore */
    }

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!document.startViewTransition || reduce) {
      setTheme(next);
      return;
    }

    // ripple spreads from the center of the button
    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    const radius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = document.startViewTransition(() => {
      flushSync(() => setTheme(next));
    });

    transition.ready
      .then(() => {
        document.documentElement.animate(
          {
            clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`],
          },
          { duration: 1100, easing: EASE, pseudoElement: "::view-transition-new(root)" }
        );
      })
      .catch(() => { });
  };

  /* ---------- liquid indicator ---------- */
  const measure = useCallback(() => {
    const el = linkRefs.current[target];
    const list = listRef.current;
    if (!el || !list) return;
    const l = el.offsetLeft;
    const r = list.offsetWidth - l - el.offsetWidth;
    if (l !== prevLeft.current) setDir(l > prevLeft.current ? 1 : -1);
    prevLeft.current = l;
    setPos({ l, r });
    requestAnimationFrame(() => setReady(true));
  }, [target]);

  useLayoutEffect(() => {
    measure();
  }, [measure]);

  useEffect(() => {
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  /* ---------- scroll: condense the bar ---------- */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ---------- scroll spy ---------- */
  useEffect(() => {
    const els = LINKS.map((l) => document.getElementById(l.id)).filter(Boolean);
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(e.target.id)),
      { rootMargin: "-45% 0px -50% 0px" }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  /* ---------- mobile menu behaviour ---------- */
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    const onResize = () => window.innerWidth > 768 && setOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const toggleMenu = () => {
    if (!open && burgerRef.current) {
      const r = burgerRef.current.getBoundingClientRect();
      setOrigin({ x: `${r.left + r.width / 2}px`, y: `${r.top + r.height / 2}px` });
    }
    setOpen((o) => !o);
  };

  const go = (id) => {
    setActive(id);
    setOpen(false);
  };

  // leading edge moves fast, trailing edge follows -> the pill stretches
  const lead = `.55s ${EASE}`;
  const trail = `1s ${EASE}`;
  const pillTransition =
    dir > 0 ? `right ${lead}, left ${trail}, opacity .6s ease` : `left ${lead}, right ${trail}, opacity .6s ease`;

  return (
    <>
      <style>{css}</style>

      <header className={`nv ${scrolled ? "is-scrolled" : ""} ${open ? "is-open" : ""}`}>
        <nav className="nv-bar" aria-label="Main">
          <a href="#home" className="nv-logo" onClick={() => go("home")}>
            {name}
          </a>

          <div className="nv-right">
            <ul ref={listRef} className="nv-links" onMouseLeave={() => setHovered(null)}>
              <span
                className="nv-pill"
                aria-hidden="true"
                style={{
                  left: pos.l,
                  right: pos.r,
                  opacity: ready ? 1 : 0,
                  transition: ready ? pillTransition : "none",
                }}
              />
              {LINKS.map((l) => (
                <li key={l.id}>
                  <a
                    href={`#${l.id}`}
                    ref={(el) => (linkRefs.current[l.id] = el)}
                    className={active === l.id ? "is-active" : ""}
                    aria-current={active === l.id ? "page" : undefined}
                    onMouseEnter={() => setHovered(l.id)}
                    onFocus={() => setHovered(l.id)}
                    onBlur={() => setHovered(null)}
                    onClick={() => go(l.id)}
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>

            <button
              type="button"
              className={`nv-theme ${isDark ? "is-dark" : ""}`}
              onClick={toggleTheme}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              aria-pressed={isDark}
            >
              <svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor"
                strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <g className="nv-sun">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
                </g>
                <path className="nv-moon" d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
              </svg>
            </button>

            <button
              ref={burgerRef}
              className="nv-burger"
              onClick={toggleMenu}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
              aria-controls="nv-mobile"
            >
              <span />
              <span />
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile: a navy wave front, then the panel following behind it */}
      <div
        className={`nv-layer nv-layer-back ${open ? "is-open" : ""}`}
        style={{ "--ox": origin.x, "--oy": origin.y }}
        aria-hidden="true"
      />
      <div
        id="nv-mobile"
        className={`nv-layer nv-layer-front ${open ? "is-open" : ""}`}
        style={{ "--ox": origin.x, "--oy": origin.y }}
        aria-hidden={!open}
      >
        <ul className="nv-m">
          {LINKS.map((l, i) => (
            <li key={l.id}>
              <a
                href={`#${l.id}`}
                tabIndex={open ? 0 : -1}
                className={active === l.id ? "is-active" : ""}
                style={{ transitionDelay: open ? `${0.35 + i * 0.08}s` : "0s" }}
                onClick={() => go(l.id)}
              >
                <small>0{i + 1}</small>
                {l.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

const css = `
@media (prefers-reduced-motion: no-preference) {
  html { scroll-behavior: smooth; }
}
section[id] { scroll-margin-top: 90px; }

/* theme ripple: let our JS animation drive the reveal */
::view-transition-old(root),
::view-transition-new(root) { animation: none; mix-blend-mode: normal; }

.nv, .nv-layer { font-family: inherit; }

/* ---------- bar ---------- */
.nv {
  position: fixed; top: 0; left: 0; right: 0; z-index: 50;
  padding: 16px;
  color: var(--ink);
  pointer-events: none;
}
.nv-bar {
  pointer-events: auto;
  margin: 0 auto;
  width: min(100%, 1100px);
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 10px 8px 14px;
  border: 1px solid transparent;
  border-radius: 14px;
  background: transparent;
  transition:
    width 1s ${EASE},
    padding 1s ${EASE},
    border-radius 1s ${EASE},
    background .7s ease,
    border-color .7s ease,
    box-shadow .7s ease;
}
.nv.is-scrolled .nv-bar {
  width: min(100%, 720px);
  padding: 6px 8px 6px 18px;
  border-radius: 999px;
  background: var(--bar);
  -webkit-backdrop-filter: blur(14px) saturate(1.4);
  backdrop-filter: blur(14px) saturate(1.4);
  border-color: var(--line);
  box-shadow: 0 8px 24px var(--bar-shadow);
}
.nv-right { display: flex; align-items: center; gap: 2px; }

/* ---------- logo ---------- */
.nv-logo {
  font-size: 1.05rem; font-weight: 650; letter-spacing: -.02em;
  color: inherit; text-decoration: none;
}

/* ---------- links + liquid pill ---------- */
.nv-links {
  position: relative;
  display: flex; gap: 2px;
  margin: 0; padding: 0; list-style: none;
}
.nv-pill {
  position: absolute; top: 0; bottom: 0;
  border-radius: 999px;
  background: var(--mist);
  pointer-events: none;
}
.nv-links a {
  position: relative; z-index: 1;
  display: block; padding: 9px 16px;
  font-size: .92rem; font-weight: 500; letter-spacing: -.005em;
  color: var(--muted); text-decoration: none;
  border-radius: 999px;
  transition: color .5s ease;
}
.nv-links a:hover,
.nv-links a:focus-visible,
.nv-links a.is-active { color: var(--ink); }
.nv-links a:focus-visible,
.nv-theme:focus-visible,
.nv-burger:focus-visible,
.nv-logo:focus-visible { outline: 2px solid var(--navy); outline-offset: 2px; }

/* ---------- theme toggle ---------- */
.nv-theme {
  position: relative; display: grid; place-items: center;
  width: 40px; height: 40px; margin-left: 6px;
  border: 0; border-radius: 50%;
  background: transparent; color: inherit; cursor: pointer;
  transition: background .5s ease;
}
.nv-theme:hover { background: var(--mist); }
.nv-theme svg { overflow: visible; }
.nv-sun, .nv-moon {
  transform-box: fill-box; transform-origin: center;
  transition: transform .9s ${EASE}, opacity .5s ease;
}
.nv-sun  { opacity: 0; transform: rotate(-90deg) scale(.4); }
.nv-moon { opacity: 1; transform: none; }
.nv-theme.is-dark .nv-sun  { opacity: 1; transform: none; }
.nv-theme.is-dark .nv-moon { opacity: 0; transform: rotate(90deg) scale(.4); }

/* ---------- hamburger ---------- */
.nv-burger {
  display: none;
  position: relative; width: 40px; height: 40px;
  border: 0; border-radius: 50%;
  background: transparent; color: inherit; cursor: pointer;
}
.nv-burger span {
  position: absolute; left: 11px; width: 18px; height: 1.5px;
  background: currentColor; border-radius: 2px;
  transition: transform .8s ${EASE};
}
.nv-burger span:nth-child(1) { top: 16px; }
.nv-burger span:nth-child(2) { top: 23px; width: 12px; }
.nv.is-open .nv-burger span:nth-child(1) { transform: translateY(3.75px) rotate(45deg); }
.nv.is-open .nv-burger span:nth-child(2) { transform: translateY(-3.75px) rotate(-45deg); width: 18px; }

/* ---------- mobile water layers ---------- */
.nv-layer {
  position: fixed; inset: 0;
  visibility: hidden;
  clip-path: circle(0px at var(--ox) var(--oy));
  transition: clip-path .9s ${EASE}, visibility 0s .9s;
}
.nv-layer.is-open {
  visibility: visible;
  clip-path: circle(150vmax at var(--ox) var(--oy));
  transition: clip-path 1.3s ${EASE}, visibility 0s 0s;
}
.nv-layer-back  { z-index: 40; background: var(--navy); }
.nv-layer-front { z-index: 41; background: var(--paper); display: flex; align-items: center; padding: 0 10vw; }
.nv-layer-front.is-open { transition-delay: .12s, 0s; }

.nv-m { margin: 0; padding: 0; list-style: none; }
.nv-m a {
  display: flex; align-items: baseline; gap: 14px;
  padding: 10px 0;
  font-size: clamp(2.2rem, 10vw, 3.4rem); font-weight: 600; letter-spacing: -.04em;
  color: var(--ink); text-decoration: none;
  opacity: 0; transform: translateY(28px); filter: blur(8px);
  transition: transform 1s ${EASE}, opacity .7s ease, filter .8s ease, color .4s ease;
}
.nv-m a small {
  font-size: .75rem; font-weight: 500; letter-spacing: .08em;
  color: var(--muted); transition: color .4s ease;
}
.nv-m a.is-active small { color: var(--navy); }
.nv-layer.is-open .nv-m a { opacity: 1; transform: none; filter: none; }
.nv-m a:focus-visible { outline: 2px solid var(--navy); outline-offset: 4px; }

/* ---------- responsive ---------- */
@media (max-width: 768px) {
  .nv-links { display: none; }
  .nv-burger { display: block; }
  .nv.is-scrolled .nv-bar { width: min(100%, 560px); }
}

/* ---------- reduced motion ---------- */
@media (prefers-reduced-motion: reduce) {
  .nv *, .nv-layer, .nv-layer * {
    transition-duration: .01s !important;
    transition-delay: 0s !important;
  }
}
`;