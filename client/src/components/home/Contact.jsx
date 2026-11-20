import { useEffect, useRef, useState } from "react";

/**
 * Contact.jsx — minimal contact section.
 *
 * - Heading, email and social rows rise into view one after another.
 * - Email: large link with a hairline that draws in on hover, plus a copy button.
 * - Socials: rows fill upward like water on hover, the arrow drifts out.
 *
 * Colors and easings come only from index.css variables.
 * The section id is "contact" so the navbar scroll-spy picks it up.
 */

const EMAIL = "abhaletejas4@gmail.com";
const SOCIALS = [
    { label: "GitHub", handle: "github.com/tejasabhale", url: "https://github.com/tejasabhale" },
    { label: "LinkedIn", handle: "linkedin.com/in/tejas-abhale", url: "https://www.linkedin.com/in/tejas-abhale-50743128a/" },
    { label: "X / Twitter", handle: "@Tejas55451", url: "https://x.com/Tejas55451" },
];

export default function Contact() {
    const [shown, setShown] = useState(false);
    const [copied, setCopied] = useState(false);
    const sectionRef = useRef(null);
    const timer = useRef(null);

    /* reveal once when the section scrolls into view */
    useEffect(() => {
        const el = sectionRef.current;
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

    useEffect(() => () => clearTimeout(timer.current), []);

    const copyEmail = async () => {
        try {
            await navigator.clipboard.writeText(EMAIL);
        } catch {
            // fallback for older browsers / insecure contexts
            const ta = document.createElement("textarea");
            ta.value = EMAIL;
            ta.style.position = "fixed";
            ta.style.opacity = "0";
            document.body.appendChild(ta);
            ta.select();
            try {
                document.execCommand("copy");
            } catch {
                /* ignore */
            }
            document.body.removeChild(ta);
        }
        setCopied(true);
        clearTimeout(timer.current);
        timer.current = setTimeout(() => setCopied(false), 2000);
    };

    return (
        <section id="contact" ref={sectionRef} className={`ct ${shown ? "is-in" : ""}`}>
            <style>{css}</style>

            <div className="ct-inner">
                <p className="ct-eyebrow ct-rise" style={{ "--i": 0 }}>
                    Contact
                </p>

                <h2 className="ct-title ct-rise" style={{ "--i": 1 }}>
                    Let’s build something
                    <br />
                    worth sharing.
                </h2>

                <div className="ct-mail ct-rise" style={{ "--i": 2 }}>
                    <a href={`mailto:${EMAIL}`} className="ct-email">
                        <span>{EMAIL}</span>
                        <i aria-hidden="true" />
                    </a>

                    <button type="button" className="ct-copy" onClick={copyEmail} aria-label="Copy email address">
                        <span className={`ct-copy-text ${copied ? "is-copied" : ""}`}>
                            <span>Copy</span>
                            <span aria-hidden="true">Copied</span>
                        </span>
                    </button>
                    <span className="ct-sr" role="status" aria-live="polite">
                        {copied ? "Email copied to clipboard" : ""}
                    </span>
                </div>

                <ul className="ct-list">
                    {SOCIALS.map((s, i) => (
                        <li key={s.label} className="ct-rise" style={{ "--i": 3 + i }}>
                            <a href={s.url} target="_blank" rel="noopener noreferrer" className="ct-row">
                                <span className="ct-label">{s.label}</span>
                                <span className="ct-handle">{s.handle}</span>
                                <svg className="ct-arrow" viewBox="0 0 24 24" width="18" height="18" fill="none"
                                    stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"
                                    aria-hidden="true">
                                    <path d="M7 17 17 7" />
                                    <path d="M8 7h9v9" />
                                </svg>
                            </a>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}

const css = `
.ct {
  background: var(--paper);
  color: var(--ink);
  padding: clamp(96px, 16vh, 180px) 20px clamp(40px, 8vh, 80px);
  transition: background .5s ease, color .5s ease;
}
.ct-inner { margin: 0 auto; width: 100%; max-width: 1100px; }

/* ---------- staggered rise ---------- */
.ct-rise {
  opacity: 0;
  transform: translateY(28px);
  transition:
    opacity .9s var(--ease-water),
    transform 1.1s var(--ease-water);
  transition-delay: calc(var(--i, 0) * 90ms);
}
.ct.is-in .ct-rise { opacity: 1; transform: none; }

/* ---------- text ---------- */
.ct-eyebrow {
  margin: 0 0 20px;
  font-size: .8rem; font-weight: 500; letter-spacing: .14em; text-transform: uppercase;
  color: var(--muted);
}
.ct-title {
  margin: 0;
  font-size: clamp(2.4rem, 7vw, 5rem);
  font-weight: 600; line-height: 1.04; letter-spacing: -.04em;
}

/* ---------- email ---------- */
.ct-mail {
  display: flex; flex-wrap: wrap; align-items: center; gap: 12px 20px;
  margin-top: clamp(36px, 6vw, 64px);
}
.ct-email {
  position: relative; display: inline-block; padding-bottom: 6px;
  font-size: clamp(1.1rem, 3.4vw, 1.9rem); font-weight: 500; letter-spacing: -.02em;
  color: var(--ink); text-decoration: none;
  overflow-wrap: anywhere;
}
.ct-email i {
  position: absolute; left: 0; right: 0; bottom: 0; height: 1.5px;
  background: var(--line);
}
.ct-email i::after {
  content: ""; position: absolute; inset: 0;
  background: var(--navy);
  transform: scaleX(0); transform-origin: right center;
  transition: transform .8s var(--ease-water);
}
.ct-email:hover i::after,
.ct-email:focus-visible i::after { transform: scaleX(1); transform-origin: left center; }

.ct-copy {
  border: 1px solid var(--line); border-radius: 999px;
  background: transparent; color: var(--muted);
  padding: 8px 16px; cursor: pointer;
  font: inherit; font-size: .82rem; font-weight: 500;
  transition: color .5s var(--ease-water), border-color .5s var(--ease-water), background .5s var(--ease-water);
}
.ct-copy:hover { color: var(--ink); border-color: var(--navy); }

/* label that rolls from "Copy" to "Copied" */
.ct-copy-text { display: block; height: 1.3em; line-height: 1.3em; overflow: hidden; }
.ct-copy-text > span { display: block; transition: transform .7s var(--ease-drop); }
.ct-copy-text.is-copied > span { transform: translateY(-100%); }
.ct-copy-text.is-copied { color: var(--navy); }

/* ---------- social rows ---------- */
.ct-list { margin: clamp(48px, 8vw, 96px) 0 0; padding: 0; list-style: none; border-bottom: 1px solid var(--line); }
.ct-list li { border-top: 1px solid var(--line); }
.ct-row {
  position: relative; z-index: 0;
  display: flex; align-items: center; gap: 16px;
  padding: 24px 8px;
  color: var(--ink); text-decoration: none;
  overflow: hidden;
}
/* water fill that rises on hover */
.ct-row::before {
  content: ""; position: absolute; inset: 0; z-index: -1;
  background: var(--mist);
  transform: translateY(101%);
  transition: transform .8s var(--ease-water);
}
.ct-row:hover::before,
.ct-row:focus-visible::before { transform: translateY(0); }

.ct-label {
  flex: 0 0 auto; min-width: 9ch;
  font-size: clamp(1.2rem, 3.2vw, 1.7rem); font-weight: 600; letter-spacing: -.03em;
  transition: transform .8s var(--ease-water);
}
.ct-handle {
  flex: 1 1 auto; min-width: 0;
  font-size: .95rem; color: var(--muted);
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  text-align: right;
  transition: color .5s var(--ease-water), transform .8s var(--ease-water);
}
.ct-arrow {
  flex: 0 0 auto; color: var(--muted);
  transition: transform .8s var(--ease-drop), color .5s var(--ease-water);
}
.ct-row:hover .ct-label,
.ct-row:focus-visible .ct-label { transform: translateX(10px); }
.ct-row:hover .ct-handle,
.ct-row:focus-visible .ct-handle { color: var(--ink); transform: translateX(-6px); }
.ct-row:hover .ct-arrow,
.ct-row:focus-visible .ct-arrow { color: var(--navy); transform: translate(4px, -4px); }

.ct-email:focus-visible,
.ct-copy:focus-visible,
.ct-row:focus-visible { outline: 2px solid var(--navy); outline-offset: 3px; }

/* ---------- footer line ---------- */
.ct-foot { margin: 32px 0 0; font-size: .82rem; color: var(--muted); }

.ct-sr {
  position: absolute; width: 1px; height: 1px; margin: -1px; padding: 0;
  overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; border: 0;
}

/* ---------- responsive ---------- */
@media (max-width: 600px) {
  .ct-row { gap: 12px; padding: 20px 4px; }
  .ct-label { min-width: 0; }
}

/* ---------- reduced motion ---------- */
@media (prefers-reduced-motion: reduce) {
  .ct *, .ct *::before, .ct *::after {
    transition-duration: .01s !important;
    transition-delay: 0s !important;
  }
  .ct-rise { opacity: 1; transform: none; }
}
`;