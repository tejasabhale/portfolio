import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
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
/*  Small pieces                                                       */
/* ------------------------------------------------------------------ */
function Field({ id, label, children }) {
    return (
        <div>
            <label
                htmlFor={id}
                className="mb-2 block text-[10px] tracking-[0.2em] text-white/50 sm:text-[11px]"
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
    "w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-base text-white/90 placeholder:text-white/30 transition-colors duration-300 focus:border-[#e94f25] focus:outline-none sm:text-sm";

function CopyEmail() {
    const [copied, setCopied] = useState(false);

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
                className="break-all text-[#f3efe8] underline decoration-white/20 underline-offset-8 transition-colors duration-300 [font-size:clamp(1.4rem,6vw,2.2rem)] hover:decoration-[#e94f25] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                style={SERIF}
            >
                {EMAIL}
            </a>
            <button
                type="button"
                onClick={copy}
                className="rounded-full border border-white/15 px-3 py-1.5 text-[10px] tracking-[0.18em] text-white/60 transition-colors duration-300 hover:border-[#e94f25] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
                style={MONO}
                aria-live="polite"
            >
                {copied ? "COPIED" : "COPY"}
            </button>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Contact section                                                    */
/* ------------------------------------------------------------------ */
export default function Contact() {
    const rootRef = useRef(null);
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
            className="relative w-full overflow-hidden bg-black text-white"
            style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
        >
            {/* ambient glow */}
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0"
                style={{
                    background:
                        "radial-gradient(50% 30% at 15% 10%, rgba(233,79,37,0.16) 0%, rgba(233,79,37,0) 65%), radial-gradient(40% 25% at 90% 70%, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0) 70%)",
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
                <div data-reveal="text" className="mb-12 sm:mb-16 md:mb-24">
                    <p
                        className="mb-4 text-[10px] tracking-[0.2em] text-[#e94f25] sm:mb-5 sm:text-[11px] sm:tracking-[0.25em]"
                        style={MONO}
                    >
                        CONTACT
                    </p>
                    <h2
                        className="leading-[0.95] tracking-[-0.02em] text-[#f3efe8] [font-size:clamp(2.6rem,12vw,4rem)] sm:[font-size:clamp(2.8rem,8vw,7.5rem)]"
                        style={SERIF}
                    >
                        Let’s build something <span className="italic">together</span>
                    </h2>
                </div>

                <div className="grid gap-12 lg:grid-cols-12 lg:gap-14">
                    {/* left – direct contact */}
                    <div data-reveal="text" className="min-w-0 lg:col-span-5">
                        {AVAILABILITY && (
                            <div
                                className="mb-6 inline-flex items-center gap-2.5 rounded-full border border-white/15 px-3 py-1.5 text-[10px] tracking-[0.18em] text-white/60"
                                style={MONO}
                            >
                                {AVAILABILITY}
                            </div>
                        )}

                        <p className="max-w-[40ch] text-[15px] leading-relaxed text-white/70 sm:text-lg">
                            Have an idea, a project or just a question? Send a message and I’ll get back to you.{" "}
                            {REPLY_TIME}
                        </p>

                        <div className="mt-8">
                            <p className="mb-3 text-[10px] tracking-[0.2em] text-white/50 sm:text-[11px]" style={MONO}>
                                EMAIL
                            </p>
                            <CopyEmail />
                        </div>

                        <ul className="mt-10 border-t border-white/10" style={MONO}>
                            {SOCIALS.map((s) => (
                                <li key={s.label} className="border-b border-white/10">
                                    <a
                                        href={s.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="group flex items-center justify-between gap-4 py-4 text-[11px] tracking-[0.15em] text-white/55 transition-colors duration-300 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                                    >
                                        <span className="shrink-0">{s.label}</span>
                                        <span className="min-w-0 truncate text-white/35 transition-colors duration-300 group-hover:text-[#e94f25]">
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
                            className="rounded-xl border border-white/10 bg-[#070707] p-5 shadow-[0_30px_90px_-35px_rgba(233,79,37,0.4)] sm:rounded-2xl sm:p-8"
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
                                <p className="mb-2 text-[10px] tracking-[0.2em] text-white/50 sm:text-[11px]" style={MONO}>
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
                                                    "rounded-full px-4 py-2 text-[11px] tracking-[0.12em] transition-colors duration-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white " +
                                                    (on
                                                        ? "bg-[#e94f25] text-white"
                                                        : "border border-white/15 text-white/55 hover:border-white/40 hover:text-white")
                                                }
                                                style={MONO}
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
                                <motion.button
                                    type="submit"
                                    whileTap={{ scale: 0.97 }}
                                    className="inline-flex w-full items-center justify-center rounded-full bg-white px-7 py-3.5 text-sm font-medium text-black transition-colors duration-300 hover:bg-[#e94f25] hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:w-auto sm:py-3"
                                >
                                    Send message
                                </motion.button>
                                <p
                                    className="min-h-[1rem] text-[10px] tracking-[0.12em] text-white/45"
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