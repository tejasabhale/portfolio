import { useEffect, useRef } from "react";

/**
 * Work.jsx — projects section that matches Navbar.jsx and Hero.jsx.
 *
 * - Each project gets a small drawn preview that fits what it is
 *   (board, website, feed, seat map). No screenshots needed.
 * - Cards settle in as they scroll into view. Hovering a card plays its preview.
 * - Colors come from index.css, so light / dark mode works automatically.
 *
 * Usage:
 *   <Work />
 * The section has id="projects", so the navbar link and scroll spy work.
 * No dependencies besides React.
 */

const PROJECTS = [
    {
        id: "taskflow",
        kind: "kanban",
        label: "PROJECT MANAGEMENT",
        title: "TaskFlow",
        display: "taskflow-project-management-platform.vercel.app",
        url: "https://taskflow-project-management-platform.vercel.app",
        blurb:
            "Workspaces, projects and tasks in one calm board. Move work across stages and keep every team on the same page.",
        tags: ["React", "Tailwind", "NodeJs", "MongoDB"],
    },
    {
        id: "jhep",
        kind: "browser",
        label: "LIVE WEBSITE",
        title: "JHEP",
        display: "jhep.sproughub.info",
        url: "https://jhep.sproughub.info",
        blurb: "A production website designed, built and launched for a real client, and live on the web today.",
        tags: ["React", "Tailwind", "NodeJs", "MongoDB"],
    },
    {
        id: "krishilink",
        kind: "feed",
        label: "MARKETPLACE",
        title: "KrishiLink",
        display: "krishilink.app/listings",
        github: "https://github.com/tejasabhale/krishilink",
        blurb:
            "A marketplace feed that connects farmers and buyers. Browse fresh listings, compare prices and get in touch.",
        tags: ["React", "Tailwind", "NodeJs", "Mobile first"],
    },
    {
        id: "events",
        kind: "booking",
        label: "BOOKING PLATFORM",
        title: "Event Booking",
        display: "events.app/book", // <- change to the real address
        github: "https://github.com/tejasabhale/event-booking",
        blurb:
            "Find an event, pick your seats and book in a few taps. A clear flow from the event page to a confirmed ticket.",
        tags: ["React", "Tailwind", "NodeJs", "Booking"],
    },
];

/* ---------- small drawn previews ---------- */

function Kanban() {
    return (
        <div className="pv pv-kanban">
            {[
                ["To do", 3],
                ["In progress", 2],
                ["Done", 2],
            ].map(([name, n], c) => (
                <div className="kb-col" key={name}>
                    <i className="kb-head" />
                    {Array.from({ length: n }).map((_, i) => (
                        <div
                            key={i}
                            className={`kb-card ${c === 0 && i === 0 ? "kb-move" : ""}`}
                        >
                            <i /><i />
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}

function Browser() {
    return (
        <div className="pv pv-browser">
            <div className="br-nav"><i /><i /><i /><i /></div>
            <div className="br-hero">
                <i className="br-h1" />
                <i className="br-h2" />
                <b className="br-btn" />
            </div>
            <div className="br-row"><i /><i /><i /></div>
        </div>
    );
}

function Feed() {
    return (
        <div className="pv pv-feed">
            {[0, 1, 2].map((i) => (
                <div className="fd-row" key={i}>
                    <b className="fd-img" />
                    <div className="fd-text"><i /><i /></div>
                    <em className="fd-price" />
                </div>
            ))}
        </div>
    );
}

function Booking() {
    const taken = new Set([2, 3, 9, 14, 15, 20]);
    const picked = new Set([10, 11]);
    return (
        <div className="pv pv-booking">
            <div className="bk-screen" />
            <div className="bk-seats">
                {Array.from({ length: 24 }).map((_, i) => (
                    <span
                        key={i}
                        className={
                            taken.has(i) ? "is-taken" : picked.has(i) ? "is-picked" : i === 12 ? "is-next" : ""
                        }
                    />
                ))}
            </div>
            <b className="bk-confirm" />
        </div>
    );
}

const PREVIEWS = { kanban: Kanban, browser: Browser, feed: Feed, booking: Booking };

/* ---------- section ---------- */

export default function Work({ projects = PROJECTS }) {
    const gridRef = useRef(null);

    // cards settle in once as they enter the viewport
    useEffect(() => {
        const cards = gridRef.current?.querySelectorAll(".work-card") ?? [];
        if (!("IntersectionObserver" in window)) {
            cards.forEach((c) => c.classList.add("is-in"));
            return;
        }
        const io = new IntersectionObserver(
            (entries) =>
                entries.forEach((e) => {
                    if (e.isIntersecting) {
                        e.target.classList.add("is-in");
                        io.unobserve(e.target);
                    }
                }),
            { threshold: 0.15 }
        );
        cards.forEach((c) => io.observe(c));
        return () => io.disconnect();
    }, [projects]);

    return (
        <section id="projects" className="work">
            <style>{css}</style>

            <div className="work-inner">
                <h2 className="work-title">Selected projects</h2>
                <p className="work-intro">
                    A few things I have designed and built, from a client website to full products.
                </p>

                <div className="work-grid" ref={gridRef}>
                    {projects.map((p, i) => {
                        const Preview = PREVIEWS[p.kind] ?? Browser;
                        return (
                            <article
                                className="work-card"
                                key={p.id}
                                style={{ transitionDelay: `${(i % 2) * 0.12}s` }}
                            >
                                <div className="work-frame" aria-hidden="true">
                                    <div className="work-bar">
                                        <span /><span /><span />
                                        <code>{p.display}</code>
                                    </div>
                                    <div className="work-stage">
                                        <Preview />
                                    </div>
                                </div>

                                <div className="work-body">
                                    <p className="work-label">{p.label}</p>
                                    <h3 className="work-name">{p.title}</h3>
                                    <p className="work-blurb">{p.blurb}</p>

                                    <ul className="work-tags">
                                        {p.tags.map((t) => (
                                            <li key={t}>{t}</li>
                                        ))}
                                    </ul>

                                    <div className="work-links">
                                        {p.url && (
                                            <a
                                                href={p.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="work-btn work-btn-primary"
                                            >
                                                <span>Visit live site</span>
                                            </a>
                                        )}
                                        {p.github && (
                                            <a
                                                href={p.github}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={`work-btn ${p.url ? "work-btn-ghost" : "work-btn-primary"}`}
                                            >
                                                <span>View on GitHub</span>
                                            </a>
                                        )}
                                    </div>
                                </div>
                            </article>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

/* Colors, easings and the font come from index.css. */
const css = `
.work {
  font-family: inherit;
  background: var(--paper);
  color: var(--ink);
  padding: 110px 36px;
  box-sizing: border-box;
  transition: background .5s ease, color .5s ease;
}
.work-inner { width: min(100%, 1100px); margin: 0 auto; }

.work-title {
  margin: 0;
  font-size: clamp(2rem, 5.5vw, 3.25rem);
  font-weight: 700; letter-spacing: -.04em; line-height: 1.08;
}
.work-intro {
  margin: 18px 0 0;
  max-width: 46ch;
  font-size: clamp(1rem, 2vw, 1.15rem);
  line-height: 1.6;
  color: var(--muted);
}

/* ---------- grid + cards ---------- */
.work-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 28px;
  margin-top: 56px;
}
.work-card {
  display: flex; flex-direction: column;
  border: 1px solid var(--line);
  border-radius: 16px;
  background: var(--paper);
  overflow: hidden;
  opacity: 0; transform: translateY(26px);
  transition: opacity .9s var(--ease-drop), transform .9s var(--ease-drop),
              border-color .5s ease, background .5s ease;
}
.work-card.is-in { opacity: 1; transform: none; }
.work-card:hover { border-color: var(--navy); }

/* ---------- browser-style frame ---------- */
.work-frame { border-bottom: 1px solid var(--line); background: var(--mist); transition: background .5s ease; }
.work-bar {
  display: flex; align-items: center; gap: 6px;
  padding: 10px 14px;
  border-bottom: 1px solid var(--line);
  background: var(--paper);
  transition: background .5s ease;
}
.work-bar span { width: 9px; height: 9px; border-radius: 50%; background: var(--line); }
.work-bar code {
  margin-left: 10px; min-width: 0;
  font: inherit; font-size: .75rem; color: var(--muted);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.work-stage { padding: 22px; height: 220px; box-sizing: border-box; overflow: hidden; }

/* ---------- text ---------- */
.work-body { display: flex; flex-direction: column; flex: 1; padding: 26px 26px 28px; }
.work-label { margin: 0; font-size: .75rem; font-weight: 600; letter-spacing: .06em; color: var(--navy); }
.work-name { margin: 8px 0 0; font-size: 1.6rem; font-weight: 700; letter-spacing: -.03em; line-height: 1.15; }
.work-blurb { margin: 12px 0 0; font-size: .98rem; line-height: 1.6; color: var(--muted); }

.work-tags { display: flex; flex-wrap: wrap; gap: 8px; margin: 20px 0 0; padding: 0; list-style: none; }
.work-tags li {
  padding: 5px 12px;
  font-size: .8rem; font-weight: 500; color: var(--muted);
  border: 1px solid var(--line); border-radius: 999px;
}

/* ---------- buttons (same rising water as the hero) ---------- */
.work-links { display: flex; flex-wrap: wrap; gap: 12px; margin-top: auto; padding-top: 26px; }
.work-btn {
  position: relative; isolation: isolate; overflow: hidden;
  display: inline-block;
  padding: 12px 22px;
  font: inherit; font-size: .9rem; font-weight: 600;
  text-decoration: none;
  border-radius: 10px;
  transition: color .5s ease, border-color .5s ease;
}
.work-btn::before {
  content: ""; position: absolute; z-index: -1;
  left: 50%; top: 100%;
  width: 240%; aspect-ratio: 1;
  border-radius: 46% 54% 50% 50%;
  transform: translate(-50%, 0);
  transition: transform .9s var(--ease-water), border-radius .9s var(--ease-water);
}
.work-btn:hover::before,
.work-btn:focus-visible::before { transform: translate(-50%, -64%); border-radius: 50%; }

.work-btn-primary { background: var(--navy); color: #fff; border: 1px solid var(--navy); }
.work-btn-primary::before { background: var(--water-dark); }
.work-btn-primary:hover,
.work-btn-primary:focus-visible { border-color: var(--water-dark); }

.work-btn-ghost { background: transparent; color: var(--ink); border: 1px solid var(--ink); }
.work-btn-ghost::before { background: var(--navy); }
.work-btn-ghost:hover,
.work-btn-ghost:focus-visible { color: #fff; border-color: var(--navy); }

.work-btn:focus-visible { outline: 2px solid var(--navy); outline-offset: 3px; }

/* ==========================================================
   Previews (drawn with CSS only)
   ========================================================== */
.pv { width: 100%; height: 100%; }
.pv i, .pv b, .pv em { display: block; font-style: normal; }

/* kanban */
.pv-kanban { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; align-items: start; }
.kb-col { display: flex; flex-direction: column; gap: 8px; }
.kb-head { height: 8px; width: 55%; border-radius: 4px; background: var(--muted); opacity: .5; margin-bottom: 2px; }
.kb-card {
  display: flex; flex-direction: column; gap: 6px;
  padding: 10px; border: 1px solid var(--line); border-radius: 8px; background: var(--paper);
  transition: transform .9s var(--ease-drop), border-color .5s ease;
}
.kb-card i { height: 6px; border-radius: 3px; background: var(--line); }
.kb-card i:first-child { width: 80%; background: var(--muted); opacity: .45; }
.kb-card i:last-child { width: 50%; }
.work-card:hover .kb-move { transform: translateX(calc(100% + 10px)); border-color: var(--navy); }

/* browser */
.pv-browser { display: flex; flex-direction: column; gap: 14px; border: 1px solid var(--line); border-radius: 8px; background: var(--paper); padding: 12px; box-sizing: border-box; }
.br-nav { display: flex; gap: 8px; justify-content: flex-end; }
.br-nav i { width: 28px; height: 6px; border-radius: 3px; background: var(--line); }
.br-nav i:first-child { margin-right: auto; width: 40px; background: var(--muted); opacity: .5; }
.br-hero { display: flex; flex-direction: column; gap: 8px; padding: 6px 0; }
.br-h1 { width: 62%; height: 14px; border-radius: 4px; background: var(--ink); opacity: .85; }
.br-h2 { width: 38%; height: 8px; border-radius: 4px; background: var(--line); }
.br-btn { width: 64px; height: 20px; margin-top: 4px; border-radius: 6px; background: var(--navy); transition: width .7s var(--ease-drop); }
.work-card:hover .br-btn { width: 92px; }
.br-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-top: auto; }
.br-row i { height: 34px; border-radius: 6px; background: var(--mist); border: 1px solid var(--line); }

/* feed */
.pv-feed { display: flex; flex-direction: column; gap: 10px; }
.fd-row {
  display: flex; align-items: center; gap: 12px;
  padding: 8px; border: 1px solid var(--line); border-radius: 10px; background: var(--paper);
  transition: transform .7s var(--ease-drop), border-color .5s ease;
}
.fd-img { width: 40px; height: 40px; flex: none; border-radius: 8px; background: var(--mist); border: 1px solid var(--line); }
.fd-text { flex: 1; display: flex; flex-direction: column; gap: 7px; }
.fd-text i { height: 6px; border-radius: 3px; background: var(--line); }
.fd-text i:first-child { width: 70%; background: var(--muted); opacity: .45; }
.fd-text i:last-child { width: 40%; }
.fd-price { width: 44px; height: 18px; border-radius: 999px; background: var(--navy); opacity: .9; }
.work-card:hover .fd-row:nth-child(1) { transform: translateX(6px); border-color: var(--navy); }
.work-card:hover .fd-row:nth-child(2) { transform: translateX(3px); }

/* booking */
.pv-booking { display: flex; flex-direction: column; align-items: center; gap: 14px; }
.bk-screen { width: 70%; height: 6px; border-radius: 6px; background: var(--muted); opacity: .45; }
.bk-seats { display: grid; grid-template-columns: repeat(8, 1fr); gap: 7px; width: 82%; }
.bk-seats span {
  aspect-ratio: 1; border-radius: 5px 5px 3px 3px;
  border: 1px solid var(--line); background: var(--paper);
  transition: background .5s ease, border-color .5s ease, transform .6s var(--ease-drop);
}
.bk-seats .is-taken { background: var(--line); }
.bk-seats .is-picked { background: var(--navy); border-color: var(--navy); }
.work-card:hover .bk-seats .is-next { background: var(--navy); border-color: var(--navy); transform: scale(1.12); }
.bk-confirm { width: 96px; height: 20px; margin-top: auto; border-radius: 6px; background: var(--navy); }

/* ---------- responsive ---------- */
@media (max-width: 860px) {
  .work-grid { grid-template-columns: 1fr; }
}
@media (max-width: 768px) {
  .work { padding: 84px 24px; }
}
@media (max-width: 420px) {
  .work-btn { width: 100%; text-align: center; }
  .work-stage { height: 200px; padding: 16px; }
}

/* ---------- reduced motion ---------- */
@media (prefers-reduced-motion: reduce) {
  .work, .work-card { transition-duration: .01s !important; transition-delay: 0s !important; }
  .work-card { opacity: 1; transform: none; }
  .work-btn, .work-btn::before, .pv * { transition-duration: .01s !important; }
}
`;