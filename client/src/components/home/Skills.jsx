import { useEffect, useRef, useState } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* ------------------------------------------------------------------ */
/*  CONFIG – edit these                                                */
/* ------------------------------------------------------------------ */
// Each group becomes one row. Add, remove or rename anything you like.
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

const MONO = { fontFamily: "'JetBrains Mono', monospace" };
const SERIF = { fontFamily: "'Instrument Serif', Georgia, serif" };

const ALL_SKILLS = GROUPS.flatMap((g) => g.skills);

/* ------------------------------------------------------------------ */
/*  Dot style – same dotted look as the hero portrait, in plain CSS    */
/* ------------------------------------------------------------------ */
const ORANGE = "#e94f25";
const DOT_INK = "#e6e1d9"; // dot colour for white text (slightly dimmed, like the portrait)

// a field of round dots, e.g. for fills
const dotGrid = (color, cell = 4, radius = 1.2) => ({
    backgroundImage: `radial-gradient(circle at center, ${color} ${radius}px, transparent ${radius + 0.35}px)`,
    backgroundSize: `${cell}px ${cell}px`,
});

// text drawn as dots: a dot field clipped to the letter shapes, over a faint solid fill so it stays readable
const dotText = (dot, faint, cell = 3.5) => {
    const r = cell * 0.37;
    return {
        backgroundImage: `radial-gradient(circle at center, ${dot} ${r}px, transparent ${r + 0.35}px), linear-gradient(${faint}, ${faint})`,
        backgroundSize: `${cell}px ${cell}px, 100% 100%`,
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        WebkitTextFillColor: "transparent",
        color: "transparent",
    };
};
const textInk = (cell) => dotText(DOT_INK, "rgba(230,225,217,0.26)", cell);
const textAccent = (cell) => dotText(ORANGE, "rgba(233,79,37,0.30)", cell);

// true on tablets / desktops – used to pick a dot size that suits the text size
function useIsWide() {
    const [wide, setWide] = useState(() =>
        typeof window !== "undefined" ? window.matchMedia("(min-width: 640px)").matches : true
    );
    useEffect(() => {
        const mq = window.matchMedia("(min-width: 640px)");
        const on = () => setWide(mq.matches);
        mq.addEventListener("change", on);
        return () => mq.removeEventListener("change", on);
    }, []);
    return wide;
}

/* ------------------------------------------------------------------ */
/*  Marquee – every skill drifting past, only while on screen          */
/* ------------------------------------------------------------------ */
function Strip({ cell }) {
    return (
        <div className="flex shrink-0 items-center" aria-hidden="true">
            {ALL_SKILLS.map((s, i) => (
                <span key={s + i} className="flex items-center">
                    <span
                        className="whitespace-nowrap px-4 [font-size:clamp(1.8rem,8vw,4rem)] sm:px-7"
                        style={{ ...SERIF, ...(i % 2 ? textAccent(cell) : textInk(cell)) }}
                    >
                        {i % 2 ? <span className="italic">{s}</span> : s}
                    </span>
                    <span className="block h-2 w-2 rounded-full" style={dotGrid(ORANGE, 3, 1.1)} />
                </span>
            ))}
        </div>
    );
}

function Marquee() {
    const ref = useRef(null);
    const inView = useInView(ref);
    const reduce = useReducedMotion();
    const wide = useIsWide();
    const run = inView && !reduce;
    const cell = wide ? 4.5 : 3.5;

    return (
        <div
            ref={ref}
            data-reveal="plain"
            className="relative overflow-hidden border-y-2 border-dotted border-[#333] py-5 sm:py-7"
            style={{
                WebkitMaskImage: "linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)",
                maskImage: "linear-gradient(to right, transparent, #000 8%, #000 92%, transparent)",
            }}
        >
            {/* real text for screen readers, the moving copy is decorative */}
            <p className="sr-only">{ALL_SKILLS.join(", ")}</p>
            <motion.div
                className="flex w-max will-change-transform"
                animate={run ? { x: ["0%", "-50%"] } : { x: "0%" }}
                transition={run ? { duration: 40, repeat: Infinity, ease: "linear" } : { duration: 0 }}
            >
                <Strip cell={cell} />
                <Strip cell={cell} />
            </motion.div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  One group row                                                      */
/* ------------------------------------------------------------------ */
function GroupRow({ group }) {
    const wide = useIsWide();

    return (
        <article
            data-reveal="text"
            className="grid gap-5 border-t-2 border-dotted border-[#333] py-8 sm:py-10 lg:grid-cols-12 lg:gap-14 lg:py-12"
        >
            <div className="min-w-0 lg:col-span-5">
                <p
                    className="mb-3 text-[10px] tracking-[0.2em] text-[#e94f25] sm:text-[11px] sm:tracking-[0.25em]"
                    style={MONO}
                >
                    {group.label}
                </p>
                <h3
                    className="break-words leading-[0.95] tracking-[-0.02em] [font-size:clamp(2.2rem,9vw,3rem)] sm:[font-size:clamp(2.4rem,5vw,4rem)]"
                    style={SERIF}
                >
                    <span style={textInk(wide ? 4.5 : 3.5)}>{group.title}</span>
                </h3>
                <p className="mt-3 max-w-[40ch] text-[15px] leading-relaxed text-[#a8a8a8] sm:mt-4 sm:text-lg">
                    {group.blurb}
                </p>
            </div>

            <ul className="flex min-w-0 flex-wrap content-start gap-2 sm:gap-2.5 lg:col-span-7 lg:pt-8" style={MONO}>
                {group.skills.map((s) => (
                    <li
                        key={s}
                        className="rounded-full border-2 border-dotted border-[#3a3a3a] bg-[#101010] px-3.5 py-1.5 text-[11px] tracking-[0.12em] text-white/65 transition-colors duration-300 hover:border-[#e94f25] hover:bg-[#e94f25]/20 hover:text-white sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.15em]"
                        style={dotGrid("rgba(243,239,232,0.08)", 4, 0.9)}
                    >
                        {s}
                    </li>
                ))}
            </ul>
        </article>
    );
}

/* ------------------------------------------------------------------ */
/*  Skills section                                                     */
/* ------------------------------------------------------------------ */
export default function Skills() {
    const rootRef = useRef(null);
    const wide = useIsWide();

    // same fonts as the Hero / Work / Contact – only added once
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

    // scroll reveals
    useEffect(() => {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        const ctx = gsap.context(() => {
            gsap.utils.toArray("[data-reveal='plain']").forEach((el) => {
                gsap.fromTo(
                    el,
                    { clipPath: "inset(0% 12% 0% 12%)", opacity: 0 },
                    {
                        clipPath: "inset(0% 0% 0% 0%)",
                        opacity: 1,
                        duration: 1.3,
                        ease: "expo.out",
                        clearProps: "clipPath",
                        scrollTrigger: { trigger: el, start: "top 90%", once: true },
                    }
                );
            });
            gsap.utils.toArray("[data-reveal='text']").forEach((el) => {
                gsap.from(el.children, {
                    opacity: 0,
                    y: 26,
                    duration: 0.9,
                    ease: "power3.out",
                    stagger: 0.1,
                    scrollTrigger: { trigger: el, start: "top 90%", once: true },
                });
            });
        }, rootRef);
        return () => ctx.revert();
    }, []);

    return (
        <section
            ref={rootRef}
            id="skills"
            className="relative w-full overflow-hidden bg-[#080808] text-white"
            style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
        >
            {/* faint dot field behind everything (replaces the old grain), fading in and out at the edges */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                    ...dotGrid("rgba(243,239,232,0.08)", 22, 1.2),
                    WebkitMaskImage: "linear-gradient(to bottom, transparent, #000 8%, #000 92%, transparent)",
                    maskImage: "linear-gradient(to bottom, transparent, #000 8%, #000 92%, transparent)",
                }}
            />

            <div className="relative z-10 mx-auto w-full max-w-[1600px] px-4 py-16 sm:px-5 sm:py-24 md:py-36 lg:px-10">
                {/* header */}
                <div
                    data-reveal="text"
                    className="mb-12 flex flex-col gap-5 sm:mb-16 sm:gap-6 md:mb-20 md:flex-row md:items-end md:justify-between"
                >
                    <div>
                        <p
                            className="mb-4 text-[10px] tracking-[0.2em] text-[#e94f25] sm:mb-5 sm:text-[11px] sm:tracking-[0.25em]"
                            style={MONO}
                        >
                            SKILLS
                        </p>
                        <h2
                            className="leading-[0.95] tracking-[-0.02em] [font-size:clamp(2.6rem,12vw,4rem)] sm:[font-size:clamp(2.8rem,8vw,7.5rem)]"
                            style={SERIF}
                        >
                            <span style={textInk(wide ? 5.5 : 3.5)}>What I </span>
                            <span className="italic" style={textAccent(wide ? 5.5 : 3.5)}>build</span>
                            <span style={textInk(wide ? 5.5 : 3.5)}> with</span>
                        </h2>
                    </div>
                    <p className="max-w-[34ch] text-[15px] leading-relaxed text-[#a8a8a8] sm:text-lg">
                        The tools I use to take an idea from a sketch to a live product.
                    </p>
                </div>

                <Marquee />

                {/* groups */}
                <div className="mt-12 sm:mt-16 md:mt-20">
                    {GROUPS.map((g) => (
                        <GroupRow key={g.id} group={g} />
                    ))}
                    <div className="border-t-2 border-dotted border-[#333]" />
                </div>
            </div>
        </section>
    );
}