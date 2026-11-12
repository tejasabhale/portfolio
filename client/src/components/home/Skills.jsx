import { useEffect, useRef } from "react";
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
/*  Marquee – every skill drifting past, only while on screen          */
/* ------------------------------------------------------------------ */
function Marquee() {
    const ref = useRef(null);
    const inView = useInView(ref);
    const reduce = useReducedMotion();
    const run = inView && !reduce;

    const Strip = () => (
        <div className="flex shrink-0 items-center" aria-hidden="true">
            {ALL_SKILLS.map((s, i) => (
                <span key={s + i} className="flex items-center">
                    <span
                        className="whitespace-nowrap px-4 text-[#f3efe8]/85 [font-size:clamp(1.8rem,8vw,4rem)] sm:px-7"
                        style={SERIF}
                    >
                        {i % 2 ? <span className="italic">{s}</span> : s}
                    </span>
                    <span className="block h-1.5 w-1.5 rounded-full bg-[#e94f25]" />
                </span>
            ))}
        </div>
    );

    return (
        <div
            ref={ref}
            data-reveal="plain"
            className="relative overflow-hidden border-y border-white/10 py-5 sm:py-7"
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
                <Strip />
                <Strip />
            </motion.div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  One group row                                                      */
/* ------------------------------------------------------------------ */
function GroupRow({ group }) {
    return (
        <article
            data-reveal="text"
            className="grid gap-5 border-t border-white/10 py-8 sm:py-10 lg:grid-cols-12 lg:gap-14 lg:py-12"
        >
            <div className="min-w-0 lg:col-span-5">
                <p
                    className="mb-3 text-[10px] tracking-[0.2em] text-[#e94f25] sm:text-[11px] sm:tracking-[0.25em]"
                    style={MONO}
                >
                    {group.label}
                </p>
                <h3
                    className="leading-[0.95] tracking-[-0.02em] text-[#f3efe8] [font-size:clamp(2.2rem,9vw,3rem)] sm:[font-size:clamp(2.4rem,5vw,4rem)]"
                    style={SERIF}
                >
                    {group.title}
                </h3>
                <p className="mt-3 max-w-[40ch] text-[15px] leading-relaxed text-white/70 sm:mt-4 sm:text-lg">
                    {group.blurb}
                </p>
            </div>

            <ul className="flex min-w-0 flex-wrap content-start gap-2 sm:gap-2.5 lg:col-span-7 lg:pt-8" style={MONO}>
                {group.skills.map((s) => (
                    <li
                        key={s}
                        className="rounded-full border border-white/15 px-3.5 py-1.5 text-[11px] tracking-[0.12em] text-white/65 transition-colors duration-300 hover:border-[#e94f25] hover:bg-[#e94f25]/10 hover:text-white sm:px-4 sm:py-2 sm:text-xs sm:tracking-[0.15em]"
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
            className="relative w-full overflow-hidden bg-black text-white"
            style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
        >
            {/* ambient glow */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                    background:
                        "radial-gradient(50% 30% at 85% 8%, rgba(233,79,37,0.16) 0%, rgba(233,79,37,0) 65%), radial-gradient(40% 25% at 10% 70%, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0) 70%)",
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
                            className="leading-[0.95] tracking-[-0.02em] text-[#f3efe8] [font-size:clamp(2.6rem,12vw,4rem)] sm:[font-size:clamp(2.8rem,8vw,7.5rem)]"
                            style={SERIF}
                        >
                            What I <span className="italic">build</span> with
                        </h2>
                    </div>
                    <p className="max-w-[34ch] text-[15px] leading-relaxed text-white/70 sm:text-lg">
                        The tools I use to take an idea from a sketch to a live product.
                    </p>
                </div>

                <Marquee />

                {/* groups */}
                <div className="mt-12 sm:mt-16 md:mt-20">
                    {GROUPS.map((g) => (
                        <GroupRow key={g.id} group={g} />
                    ))}
                    <div className="border-t border-white/10" />
                </div>
            </div>
        </section>
    );
}