import { useEffect, useRef } from "react";

/**
 * Skills.jsx — skills section that matches Navbar.jsx, Hero.jsx and Work.jsx.
 *
 * - One ruled row per area: name and short line on the left, skills on the right.
 * - Rows settle in as they scroll into view.
 * - Hovering a row lights up its title and skill tags.
 * - Colors come from index.css, so light / dark mode works automatically.
 *
 * Usage:
 *   <Skills />
 * The section id is "skills". To make the navbar highlight it, add
 *   { id: "skills", label: "Skills" }
 * to LINKS in Navbar.jsx. Or pass id="about" to use it as the About section.
 * No dependencies besides React.
 */

const GROUPS = [
    {
        id: "frontend",
        label: "FRONTEND",
        title: "Interfaces",
        blurb: "Responsive, fast screens that feel good to use on any device.",
        skills: ["React", "TypeScript", "JavaScript", "Tailwind CSS", "HTML & CSS", "Framer Motion", "GSAP", "Three.js"],
    },
    {
        id: "backend",
        label: "BACKEND",
        title: "Servers & APIs",
        blurb: "The logic behind the screen: APIs, auth and data flow.",
        skills: ["Node.js", "Express", "REST APIs", "Authentication"],
    },
    {
        id: "data",
        label: "DATABASE",
        title: "Data",
        blurb: "Storing and shaping data so apps stay quick as they grow.",
        skills: ["MongoDB", "Mongoose", "Data modelling"],
    },
    {
        id: "ai",
        label: "AI",
        title: "Generative AI",
        blurb: "Putting language models to work inside real products.",
        skills: ["Gen AI", "LLMs", "AI Agents", "LLM Integration", "Multimodal AI"],
    },
    {
        id: "tools",
        label: "TOOLS",
        title: "Workflow",
        blurb: "How work gets built, versioned and shipped.",
        skills: ["Git", "GitHub", "Docker", "VS Code", "Figma"],
    },
];

export default function Skills({
    id = "skills",
    groups = GROUPS,
    heading = "What I work with",
    intro = "The tools and ideas I use to take a product from a sketch to something people can open.",
}) {
    const listRef = useRef(null);

    // rows settle in once as they enter the viewport
    useEffect(() => {
        const rows = listRef.current?.querySelectorAll(".skills-row") ?? [];
        if (!("IntersectionObserver" in window)) {
            rows.forEach((r) => r.classList.add("is-in"));
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
            { threshold: 0.2 }
        );
        rows.forEach((r) => io.observe(r));
        return () => io.disconnect();
    }, [groups]);

    return (
        <section id={id} className="skills">
            <style>{css}</style>

            <div className="skills-inner">
                <h2 className="skills-title">{heading}</h2>
                <p className="skills-intro">{intro}</p>

                <div className="skills-list" ref={listRef}>
                    {groups.map((g) => (
                        <div className="skills-row" key={g.id}>
                            <div className="skills-head">
                                <p className="skills-label">{g.label}</p>
                                <h3 className="skills-name">{g.title}</h3>
                            </div>

                            <div className="skills-main">
                                <p className="skills-blurb">{g.blurb}</p>
                                <ul className="skills-tags">
                                    {g.skills.map((s, i) => (
                                        <li key={s} style={{ "--i": i }}>
                                            {s}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

/* Colors, easings and the font come from index.css. */
const css = `
.skills {
  font-family: inherit;
  background: var(--paper);
  color: var(--ink);
  padding: 110px 36px;
  box-sizing: border-box;
  transition: background .5s ease, color .5s ease;
}
.skills-inner { width: min(100%, 1100px); margin: 0 auto; }

.skills-title {
  margin: 0;
  font-size: clamp(2rem, 5.5vw, 3.25rem);
  font-weight: 700; letter-spacing: -.04em; line-height: 1.08;
}
.skills-intro {
  margin: 18px 0 0;
  max-width: 46ch;
  font-size: clamp(1rem, 2vw, 1.15rem);
  line-height: 1.6;
  color: var(--muted);
}

/* ---------- ruled rows ---------- */
.skills-list {
  margin-top: 56px;
  border-top: 1px solid var(--line);
}
.skills-row {
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 7fr);
  gap: 24px 48px;
  padding: 34px 0;
  border-bottom: 1px solid var(--line);
  opacity: 0; transform: translateY(22px);
  transition: opacity .9s var(--ease-drop), transform .9s var(--ease-drop),
              border-color .5s ease;
}
.skills-row.is-in { opacity: 1; transform: none; }

.skills-label {
  margin: 0;
  font-size: .75rem; font-weight: 600; letter-spacing: .06em;
  color: var(--navy);
}
.skills-name {
  margin: 8px 0 0;
  font-size: clamp(1.5rem, 3.2vw, 2rem);
  font-weight: 700; letter-spacing: -.03em; line-height: 1.15;
  transition: color .5s ease;
}
.skills-row:hover .skills-name { color: var(--navy); }

.skills-blurb {
  margin: 0;
  max-width: 44ch;
  font-size: 1rem; line-height: 1.6;
  color: var(--muted);
}

/* ---------- tags ---------- */
.skills-tags {
  display: flex; flex-wrap: wrap; gap: 8px;
  margin: 20px 0 0; padding: 0; list-style: none;
}
.skills-tags li {
  padding: 7px 14px;
  font-size: .88rem; font-weight: 500;
  color: var(--ink);
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--paper);
  transition: border-color .5s ease, color .5s ease, background .5s ease,
              transform .7s var(--ease-drop);
  transition-delay: calc(var(--i) * 40ms);
}
.skills-row:hover .skills-tags li {
  border-color: var(--navy);
  color: var(--navy);
  transform: translateY(-2px);
}

/* ---------- responsive ---------- */
@media (max-width: 860px) {
  .skills-row { grid-template-columns: 1fr; gap: 16px; padding: 28px 0; }
}
@media (max-width: 768px) {
  .skills { padding: 84px 24px; }
  .skills-list { margin-top: 40px; }
}

/* ---------- reduced motion ---------- */
@media (prefers-reduced-motion: reduce) {
  .skills, .skills-row, .skills-tags li {
    transition-duration: .01s !important;
    transition-delay: 0s !important;
  }
  .skills-row { opacity: 1; transform: none; }
  .skills-row:hover .skills-tags li { transform: none; }
}
`;