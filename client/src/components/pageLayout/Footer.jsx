import { useEffect, useRef, useState } from "react";

/**
 * Footer.jsx — slim footer that matches Contact.jsx / Navbar.jsx.
 *
 * - One row: copyright on the left, "Back to top" on the right.
 * - Both rise into view together when the footer appears.
 * - Back to top: round button fills upward like water, the arrow lifts.
 *
 * Colors and easings come only from index.css variables.
 */

const NAME = "Tejas Abhale";

export default function Footer() {
  const [shown, setShown] = useState(false);
  const ref = useRef(null);

  /* reveal once when the footer scrolls into view */
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          io.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <footer ref={ref} className={`ft ${shown ? "is-in" : ""}`}>
      <style>{css}</style>

      <div className="ft-inner">
        <p className="ft-copy ft-rise" style={{ "--i": 0 }}>
          © {new Date().getFullYear()} {NAME}
        </p>

        <a href="#home" className="ft-top-btn ft-rise" style={{ "--i": 1 }} aria-label="Back to top">
          <span className="ft-top-label">Back to top</span>
          <span className="ft-top-circle">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none"
              stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
              aria-hidden="true">
              <path d="M12 19V5" />
              <path d="m5 12 7-7 7 7" />
            </svg>
          </span>
        </a>
      </div>
    </footer>
  );
}

const css = `
.ft {
  background: var(--paper);
  color: var(--ink);
  padding: 0 20px;
  transition: background .5s ease, color .5s ease;
}
.ft-inner {
  margin: 0 auto; width: 100%; max-width: 1100px;
  border-top: 1px solid var(--line);
  padding: 16px 0;
  display: flex; align-items: center; justify-content: space-between;
  gap: 16px;
}

/* ---------- rise ---------- */
.ft-rise {
  opacity: 0;
  transform: translateY(14px);
  transition:
    opacity .9s var(--ease-water),
    transform 1.1s var(--ease-water);
  transition-delay: calc(var(--i, 0) * 90ms);
}
.ft.is-in .ft-rise { opacity: 1; transform: none; }

/* ---------- text ---------- */
.ft-copy { margin: 0; font-size: .82rem; color: var(--muted); }

/* ---------- back to top ---------- */
.ft-top-btn {
  display: inline-flex; align-items: center; gap: 10px;
  color: var(--muted); text-decoration: none;
  font-size: .82rem; font-weight: 500;
  transition:
    color .5s var(--ease-water),
    opacity .9s var(--ease-water),
    transform 1.1s var(--ease-water);
}
.ft-top-circle {
  position: relative; isolation: isolate; overflow: hidden;
  display: grid; place-items: center;
  width: 32px; height: 32px;
  border: 1px solid var(--line); border-radius: 50%;
  color: var(--ink);
  transition: color .5s var(--ease-water), border-color .5s var(--ease-water);
}
/* water fill that rises on hover */
.ft-top-circle::before {
  content: ""; position: absolute; inset: 0; z-index: -1;
  background: var(--navy);
  transform: translateY(101%);
  transition: transform .8s var(--ease-water);
}
.ft-top-circle svg { transition: transform .8s var(--ease-drop); }

.ft-top-btn:hover,
.ft-top-btn:focus-visible { color: var(--ink); }
.ft-top-btn:hover .ft-top-circle,
.ft-top-btn:focus-visible .ft-top-circle { color: var(--paper); border-color: var(--navy); }
.ft-top-btn:hover .ft-top-circle::before,
.ft-top-btn:focus-visible .ft-top-circle::before { transform: translateY(0); }
.ft-top-btn:hover .ft-top-circle svg,
.ft-top-btn:focus-visible .ft-top-circle svg { transform: translateY(-2px); }

.ft-top-btn:focus-visible { outline: 2px solid var(--navy); outline-offset: 3px; }

/* ---------- reduced motion ---------- */
@media (prefers-reduced-motion: reduce) {
  .ft *, .ft *::before, .ft *::after {
    transition-duration: .01s !important;
    transition-delay: 0s !important;
  }
  .ft-rise { opacity: 1; transform: none; }
}
`;