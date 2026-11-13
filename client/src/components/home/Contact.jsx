import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* ------------------------------------------------------------------ */
/*  CONFIG – edit these                                                */
/* ------------------------------------------------------------------ */
const EMAIL = "abhaletejas4@gmail.com";
const AVAILABILITY = "Open to new projects"; // set to "" to hide the badge
const REPLY_TIME = "I usually reply within a day.";

const SOCIALS = [
    { label: "GitHub", handle: "github.com/tejasabhale", url: "https://github.com/tejasabhale" },
    { label: "LinkedIn", handle: "linkedin.com/in/tejas-abhale", url: "https://www.linkedin.com/in/tejas-abhale-50743128a/" },
    { label: "X / Twitter", handle: "@Tejas55451", url: "https://x.com/Tejas55451" },
];

const TOPICS = ["Website", "Web app", "Something else"];

const MONO = { fontFamily: "'JetBrains Mono', monospace" };
const SERIF = { fontFamily: "'Instrument Serif', Georgia, serif" };

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
/*  Small pieces                                                       */
/* ------------------------------------------------------------------ */
function Field({ id, label, children }) {
    return (
        <div>
            <label
                htmlFor={id}
                className="mb-2 block text-[10px] tracking-[0.2em] text-white/60 sm:text-[11px]"
                style={MONO}
            >
                {label}
            </label>
            {children}
        </div>
    );
}

// text-base on phones stops iOS from zooming into the field
const INPUT =
    "w-full rounded-xl border-2 border-dotted border-[#3a3a3a] bg-[#0a0a0a] px-4 py-3 text-base text-white/90 placeholder:text-white/40 transition-colors duration-300 focus:border-[#e94f25] focus:outline-none sm:text-sm";

function CopyEmail() {
    const [copied, setCopied] = useState(false);
    const wide = useIsWide();

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(EMAIL);
            setCopied(true);
            setTimeout(() => setCopied(false), 1800);
        } catch {
            window.location.href = `mailto:${EMAIL}`;
        }
    };

    return (
        <div className="flex flex-wrap items-center gap-3">
            <a
                href={`mailto:${EMAIL}`}
                className="cursor-pointer break-all underline decoration-white/20 decoration-dotted decoration-2 underline-offset-8 transition-colors duration-300 [font-size:clamp(1.4rem,6vw,2.2rem)] hover:decoration-[#e94f25] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                style={SERIF}
            >
                <span style={textInk(wide ? 3.5 : 3)}>{EMAIL}</span>
            </a>
            <button
                type="button"
                onClick={copy}
                className="cursor-pointer rounded-full border-2 border-dotted border-[#3a3a3a] px-3 py-1.5 text-[10px] tracking-[0.18em] text-white/65 transition-colors duration-300 hover:border-[#e94f25] hover:bg-[#e94f25]/15 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                style={MONO}
                aria-live="polite"
            >
                {copied ? "COPIED" : "COPY"}
            </button>
        </div>
    );
}

// primary button: dotted orange fill, leans a little towards the cursor (same as the hero buttons)
function SendButton() {
    const ref = useRef(null);
    const x = useMotionValue(0);
    const y = useMotionValue(0);
    const sx = useSpring(x, { stiffness: 220, damping: 16, mass: 0.4 });
    const sy = useSpring(y, { stiffness: 220, damping: 16, mass: 0.4 });

    const onMove = (e) => {
        if (e.pointerType && e.pointerType !== "mouse") return;
        const r = ref.current.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * 0.2);
        y.set((e.clientY - (r.top + r.height / 2)) * 0.3);
    };
    const reset = () => {
        x.set(0);
        y.set(0);
    };

    return (
        <motion.button
            ref={ref}
            type="submit"
            onPointerMove={onMove}
            onPointerLeave={reset}
            whileTap={{ scale: 0.97 }}
            style={{ x: sx, y: sy, ...dotGrid("rgba(233,79,37,0.85)", 4, 1.5), textShadow: "0 1px 8px rgba(0,0,0,0.75)" }}
            className="inline-flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-xl border-2 border-dotted border-[#e94f25] bg-[#e94f25]/20 px-7 py-3.5 text-sm font-medium text-white transition-colors duration-300 hover:bg-[#e94f25]/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:w-auto sm:py-3"
        >
            Send message
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M7 17 17 7M8 7h9v9" />
            </svg>
        </motion.button>
    );
}

/* ------------------------------------------------------------------ */
/*  Contact section                                                    */
/* ------------------------------------------------------------------ */
export default function Contact() {
    const rootRef = useRef(null);
    const wide = useIsWide();
    const [topic, setTopic] = useState(TOPICS[0]);
    const [sent, setSent] = useState(false);

    // same fonts as the Hero / Work – only added once
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
            gsap.utils.toArray("[data-reveal='media']").forEach((el) => {
                gsap.fromTo(
                    el,
                    { clipPath: "inset(10% 8% 10% 8% round 24px)", opacity: 0, y: 60 },
                    {
                        clipPath: "inset(0% 0% 0% 0% round 0px)",
                        opacity: 1,
                        y: 0,
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

    // No backend needed: this opens the visitor's mail app with everything filled in.
    // To send from the page instead, post the same fields to Formspree / your own API here.
    const onSubmit = (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        const subject = `${topic} enquiry from ${f.get("name")}`;
        const body = `${f.get("message")}\n\n— ${f.get("name")} (${f.get("email")})`;
        window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        setSent(true);
        setTimeout(() => setSent(false), 4000);
    };

    return (
        <section
            ref={rootRef}
            id="contact"
            className="relative w-full overflow-hidden border-t-2 border-dotted border-[#333333] bg-[#050505] text-white"
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
                <div data-reveal="text" className="mb-12 sm:mb-16 md:mb-24">
                    <p
                        className="mb-4 text-[10px] tracking-[0.2em] text-[#e94f25] sm:mb-5 sm:text-[11px] sm:tracking-[0.25em]"
                        style={MONO}
                    >
                        CONTACT
                    </p>
                    <h2
                        className="leading-[0.95] tracking-[-0.02em] [font-size:clamp(2.6rem,12vw,4rem)] sm:[font-size:clamp(2.8rem,8vw,7.5rem)]"
                        style={SERIF}
                    >
                        <span style={textInk(wide ? 5.5 : 3.5)}>Let’s build something </span>
                        <span className="italic" style={textAccent(wide ? 5.5 : 3.5)}>together</span>
                    </h2>
                </div>

                <div className="grid gap-12 lg:grid-cols-12 lg:gap-14">
                    {/* left – direct contact */}
                    <div data-reveal="text" className="min-w-0 lg:col-span-5">
                        {AVAILABILITY && (
                            <div
                                className="mb-6 inline-flex items-center gap-2.5 rounded-full border-2 border-dotted border-[#e94f25]/60 bg-[#e94f25]/10 px-3.5 py-1.5 text-[10px] tracking-[0.18em] text-[#ff9a7a]"
                                style={{ ...MONO, ...dotGrid("rgba(233,79,37,0.35)", 4, 1) }}
                            >
                                {AVAILABILITY}
                            </div>
                        )}

                        <p className="max-w-[40ch] text-[15px] leading-relaxed text-[#a8a8a8] sm:text-lg">
                            Have an idea, a project or just a question? Send a message and I’ll get back to you.{" "}
                            {REPLY_TIME}
                        </p>

                        <div className="mt-8">
                            <p className="mb-3 text-[10px] tracking-[0.2em] text-white/60 sm:text-[11px]" style={MONO}>
                                EMAIL
                            </p>
                            <CopyEmail />
                        </div>

                        <ul className="mt-10 border-t-2 border-dotted border-[#333]" style={MONO}>
                            {SOCIALS.map((s) => (
                                <li key={s.label} className="border-b-2 border-dotted border-[#333]">
                                    <a
                                        href={s.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group flex cursor-pointer items-center justify-between gap-4 py-4 text-[11px] tracking-[0.15em] text-white/65 transition-colors duration-300 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                                    >
                                        <span className="shrink-0">{s.label}</span>
                                        <span className="min-w-0 truncate text-white/50 transition-colors duration-300 group-hover:text-[#e94f25]">
                                            {s.handle}
                                        </span>
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* right – form */}
                    <div data-reveal="media" className="min-w-0 lg:col-span-7">
                        <form
                            onSubmit={onSubmit}
                            className="rounded-xl border-2 border-dotted border-[#3a3a3a] bg-[#101010] p-5 sm:rounded-2xl sm:p-8"
                            style={dotGrid("rgba(243,239,232,0.05)", 8, 1)}
                        >
                            <div className="grid gap-5 sm:grid-cols-2 sm:gap-6">
                                <Field id="c-name" label="NAME">
                                    <input
                                        id="c-name"
                                        name="name"
                                        type="text"
                                        required
                                        autoComplete="name"
                                        placeholder="Your name"
                                        className={INPUT}
                                    />
                                </Field>
                                <Field id="c-email" label="EMAIL">
                                    <input
                                        id="c-email"
                                        name="email"
                                        type="email"
                                        required
                                        autoComplete="email"
                                        placeholder="you@example.com"
                                        className={INPUT}
                                    />
                                </Field>
                            </div>

                            <div className="mt-5 sm:mt-6">
                                <p className="mb-2 text-[10px] tracking-[0.2em] text-white/60 sm:text-[11px]" style={MONO}>
                                    I NEED
                                </p>
                                <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Project type">
                                    {TOPICS.map((t) => {
                                        const on = t === topic;
                                        return (
                                            <button
                                                key={t}
                                                type="button"
                                                role="radio"
                                                aria-checked={on}
                                                onClick={() => setTopic(t)}
                                                className={
                                                    "cursor-pointer rounded-full border-2 border-dotted px-4 py-2 text-[11px] tracking-[0.12em] transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white " +
                                                    (on
                                                        ? "border-[#e94f25] bg-[#e94f25]/25 text-white"
                                                        : "border-[#3a3a3a] bg-[#0a0a0a] text-white/65 hover:border-white/40 hover:text-white")
                                                }
                                                style={{
                                                    ...MONO,
                                                    ...(on ? { ...dotGrid("rgba(233,79,37,0.8)", 4, 1.2), textShadow: "0 1px 6px rgba(0,0,0,0.8)" } : null),
                                                }}
                                            >
                                                {t}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="mt-5 sm:mt-6">
                                <Field id="c-message" label="MESSAGE">
                                    <textarea
                                        id="c-message"
                                        name="message"
                                        required
                                        rows={5}
                                        placeholder="Tell me a little about what you have in mind"
                                        className={INPUT + " resize-none"}
                                    />
                                </Field>
                            </div>

                            <div className="mt-7 flex flex-col gap-4 sm:mt-8 sm:flex-row sm:items-center sm:justify-between">
                                <SendButton />
                                <p
                                    className="min-h-[1rem] text-[10px] tracking-[0.12em] text-white/55"
                                    style={MONO}
                                    role="status"
                                    aria-live="polite"
                                >
                                    {sent ? "Opening your mail app…" : "Opens your email app with the message ready."}
                                </p>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    );
}