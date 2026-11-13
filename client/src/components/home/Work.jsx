import { useEffect, useRef, useState } from "react";
import {
    motion,
    LayoutGroup,
    useInView,
    useMotionValue,
    useSpring,
} from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/* ------------------------------------------------------------------ */
/*  CONFIG – edit these                                                */
/* ------------------------------------------------------------------ */
// kind: "kanban" | "feed" | "browser" | "booking"  → decides which animated preview is shown
// url:  optional – adds a "Visit site" button; `display` is what shows in the browser bar
// Projects with a live link come first.
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
        blurb:
            "Find an event, pick your seats and book in a few taps. A clear flow from the event page to a confirmed ticket.",
        tags: ["React", "Tailwind", "NodeJs", "Booking"],
    },
];

// sample listings for the KrishiLink preview – replace with anything you like
const FEED = [
    { n: "Tomatoes", q: "120 kg", p: "₹ 28/kg", loc: "Nashik" },
    { n: "Onions", q: "2 tonnes", p: "₹ 19/kg", loc: "Lasalgaon" },
    { n: "Pomegranate", q: "400 kg", p: "₹ 72/kg", loc: "Solapur" },
    { n: "Wheat", q: "5 tonnes", p: "₹ 26/kg", loc: "Jalna" },
    { n: "Grapes", q: "300 kg", p: "₹ 55/kg", loc: "Sangli" },
    { n: "Soybean", q: "3 tonnes", p: "₹ 46/kg", loc: "Latur" },
];

// sample tasks for the TaskFlow preview
const COLUMNS = [
    { full: "TO DO", short: "TO DO" },
    { full: "IN PROGRESS", short: "DOING" },
    { full: "DONE", short: "DONE" },
];
const TASKS = {
    1: { t: "Design onboarding", tag: "UI" },
    2: { t: "Fix login redirect", tag: "BUG" },
    3: { t: "Write API docs", tag: "DOCS" },
    4: { t: "Set up CI pipeline", tag: "DEV" },
    5: { t: "Review pull request", tag: "DEV" },
    6: { t: "Ship v1.0", tag: "RELEASE" },
    7: { t: "Add dark mode", tag: "UI" },
    8: { t: "Update dependencies", tag: "DEV" },
};
const INITIAL_COLS = [[1, 2, 3], [4, 7], [5, 6, 8]];

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
/*  Browser frame + tilt                                               */
/* ------------------------------------------------------------------ */
function BrowserFrame({ url, children, ratio = "aspect-[4/3]" }) {
    return (
        <div className="relative overflow-hidden rounded-xl border-2 border-dotted border-[#3a3a3a] bg-[#101010] sm:rounded-2xl">
            <div className="flex items-center gap-2 border-b-2 border-dotted border-[#3a3a3a] bg-[#171717] px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
                <div className="flex shrink-0 gap-1.5" aria-hidden="true">
                    {[0, 1, 2].map((i) => (
                        <span key={i} className="block h-2 w-2 rounded-full bg-white/20" />
                    ))}
                </div>
                <div
                    className="mx-auto flex h-6 min-w-0 flex-1 items-center justify-center rounded-full bg-[#0a0a0a] px-3 text-[10px] tracking-[0.08em] text-white/60 sm:max-w-[360px] sm:tracking-[0.12em]"
                    style={{ ...MONO, ...dotGrid("rgba(243,239,232,0.10)", 4, 0.9) }}
                >
                    <span className="block min-w-0 truncate">{url}</span>
                </div>
                {/* keeps the url bar centred against the dots – hidden on phones to give the url more room */}
                <span className="hidden w-[34px] shrink-0 sm:block" aria-hidden="true" />
            </div>
            {/* taller (near square) on phones so the previews can use bigger, readable text */}
            <div className={"relative overflow-hidden sm:aspect-[16/10] " + ratio}>{children}</div>
        </div>
    );
}

// the frame leans a few degrees towards the mouse (ignored on touch screens)
function Tilt({ children }) {
    const ref = useRef(null);
    const rx = useMotionValue(0);
    const ry = useMotionValue(0);
    const srx = useSpring(rx, { stiffness: 140, damping: 18, mass: 0.5 });
    const sry = useSpring(ry, { stiffness: 140, damping: 18, mass: 0.5 });

    const onMove = (e) => {
        if (e.pointerType !== "mouse" || !ref.current) return;
        const r = ref.current.getBoundingClientRect();
        ry.set(((e.clientX - r.left) / r.width - 0.5) * 7);
        rx.set(-((e.clientY - r.top) / r.height - 0.5) * 7);
    };
    const reset = () => {
        rx.set(0);
        ry.set(0);
    };

    return (
        <div style={{ perspective: 1200 }}>
            <motion.div
                ref={ref}
                onPointerMove={onMove}
                onPointerLeave={reset}
                onPointerCancel={reset}
                style={{ rotateX: srx, rotateY: sry }}
                className="will-change-transform"
            >
                {children}
            </motion.div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Preview 1 – kanban board: cards keep moving between stages         */
/* ------------------------------------------------------------------ */
function KanbanPreview({ active }) {
    const [cols, setCols] = useState(INITIAL_COLS);
    const step = useRef(0);

    useEffect(() => {
        if (!active) return;
        const id = setInterval(() => {
            const from = step.current % 3;
            const to = (from + 1) % 3;
            step.current += 1;
            setCols((prev) => {
                if (!prev[from].length) return prev;
                const next = prev.map((c) => [...c]);
                next[to].push(next[from].shift());
                return next;
            });
        }, 1700);
        return () => clearInterval(id);
    }, [active]);

    return (
        <LayoutGroup>
            <div className="grid h-full grid-cols-3 gap-1.5 p-2 sm:gap-3 sm:p-5">
                {COLUMNS.map((col, ci) => (
                    <div
                        key={col.full}
                        className="flex min-h-0 min-w-0 flex-col gap-1.5 overflow-hidden rounded-lg bg-[#141414] p-1.5 sm:gap-2.5 sm:rounded-xl sm:p-2.5"
                        style={dotGrid("rgba(243,239,232,0.07)", 8, 1)}
                    >
                        <div className="flex items-center justify-between gap-1 px-0.5 sm:px-1" style={MONO}>
                            <span className="min-w-0 truncate text-[9px] tracking-[0.08em] text-white/65 sm:text-[10px] sm:tracking-[0.2em]">
                                <span className="sm:hidden">{col.short}</span>
                                <span className="hidden sm:inline">{col.full}</span>
                            </span>
                            <span className="text-[9px] text-white/45 sm:text-[10px]">{cols[ci].length}</span>
                        </div>
                        {cols[ci].map((id) => (
                            <motion.div
                                key={id}
                                layoutId={`task-${id}`}
                                transition={{ type: "spring", stiffness: 260, damping: 28 }}
                                className="min-w-0 rounded-md border border-dotted border-[#4a4a4a] bg-[#1f1f1f] p-1.5 sm:rounded-lg sm:p-2.5"
                            >
                                <p
                                    className={
                                        "break-words text-[10px] leading-snug sm:text-xs " +
                                        (ci === 2 ? "text-white/60 line-through" : "text-white/85")
                                    }
                                >
                                    {TASKS[id].t}
                                </p>
                                <span
                                    className="mt-1 inline-block max-w-full truncate rounded-full bg-[#e94f25]/15 px-1.5 py-0.5 text-[7px] tracking-[0.1em] text-[#e94f25] sm:mt-2 sm:text-[9px] sm:tracking-[0.15em]"
                                    style={MONO}
                                >
                                    {TASKS[id].tag}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                ))}
            </div>
        </LayoutGroup>
    );
}

/* ------------------------------------------------------------------ */
/*  Preview 2 – marketplace feed: listings scroll past                 */
/* ------------------------------------------------------------------ */
function FeedList() {
    return (
        <div className="flex flex-col gap-2.5 pb-2.5">
            {FEED.map((f) => (
                <div
                    key={f.n}
                    className="flex items-center gap-3 rounded-xl border-2 border-dotted border-[#3a3a3a] bg-[#191919] p-3"
                >
                    <span
                        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1a0a05] text-sm text-white"
                        style={{ ...SERIF, ...dotGrid("rgba(233,79,37,0.9)", 3.5, 1.3), textShadow: "0 1px 6px rgba(0,0,0,0.9)" }}
                        aria-hidden="true"
                    >
                        {f.n[0]}
                    </span>
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-xs text-white/90 sm:text-sm">{f.n}</p>
                        <p className="truncate text-[9px] tracking-[0.1em] text-white/60 sm:text-[10px] sm:tracking-[0.12em]" style={MONO}>
                            {f.q} · {f.loc}
                        </p>
                    </div>
                    <p className="shrink-0 text-[11px] text-[#e94f25] sm:text-xs" style={MONO}>
                        {f.p}
                    </p>
                </div>
            ))}
        </div>
    );
}

function FeedPreview({ active }) {
    return (
        <div className="flex h-full flex-col gap-3 p-3 sm:p-5">
            <div
                className="flex h-9 shrink-0 items-center rounded-full border border-dotted border-[#4a4a4a] bg-[#1f1f1f] px-4 text-[10px] tracking-[0.1em] text-white/55 sm:h-8 sm:tracking-[0.12em]"
                style={{ ...MONO, ...dotGrid("rgba(243,239,232,0.08)", 4, 0.9) }}
            >
                Search crops, markets…
            </div>
            <div className="flex shrink-0 gap-1.5 overflow-hidden sm:gap-2" style={MONO}>
                {["All", "Vegetables", "Fruits", "Grains"].map((c, i) => (
                    <span
                        key={c}
                        className={
                            "whitespace-nowrap rounded-full border border-dotted px-2.5 py-1 text-[9px] tracking-[0.1em] sm:text-[10px] sm:tracking-[0.15em] " +
                            (i === 0 ? "border-[#e94f25] bg-[#e94f25]/25 text-white" : "border-[#4a4a4a] text-white/60")
                        }
                        style={i === 0 ? dotGrid("rgba(233,79,37,0.8)", 4, 1.2) : undefined}
                    >
                        {c}
                    </span>
                ))}
            </div>
            <div
                className="relative min-h-0 flex-1 overflow-hidden"
                style={{
                    WebkitMaskImage: "linear-gradient(to bottom, transparent, #000 10%, #000 85%, transparent)",
                    maskImage: "linear-gradient(to bottom, transparent, #000 10%, #000 85%, transparent)",
                }}
            >
                <motion.div
                    animate={active ? { y: ["0%", "-50%"] } : { y: "0%" }}
                    transition={active ? { duration: 20, repeat: Infinity, ease: "linear" } : { duration: 0 }}
                >
                    <FeedList />
                    <FeedList />
                </motion.div>
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Preview 3 – live site: a page that scrolls itself                  */
/* ------------------------------------------------------------------ */
// `dot` = fill the bar with a field of dots of that colour instead of a flat colour
const Bar = ({ className = "", dot }) => (
    <span className={"block rounded-full " + className} style={dot ? dotGrid(dot, 3, 0.95) : undefined} />
);

function SitePreview({ active }) {
    return (
        <motion.div
            animate={active ? { y: ["0%", "-56%", "0%"] } : { y: "0%" }}
            transition={active ? { duration: 18, repeat: Infinity, ease: "easeInOut" } : { duration: 0 }}
            className="px-4 pb-10 pt-4 sm:px-7"
        >
            {/* nav */}
            <div className="flex items-center justify-between">
                <Bar className="h-3 w-14" dot="rgba(255,255,255,0.8)" />
                <div className="flex items-center gap-3">
                    <Bar className="h-1.5 w-8 bg-white/25" />
                    <Bar className="h-1.5 w-8 bg-white/25" />
                    <Bar className="hidden h-1.5 w-8 bg-white/25 sm:block" />
                    <Bar className="h-5 w-14" dot={ORANGE} />
                </div>
            </div>

            {/* hero */}
            <div className="mt-8 sm:mt-10">
                <Bar className="h-2 w-20" dot="rgba(233,79,37,0.8)" />
                <Bar className="mt-4 h-4 w-[78%] rounded-md sm:h-5" dot="rgba(243,239,232,0.9)" />
                <Bar className="mt-2.5 h-4 w-[52%] rounded-md sm:h-5" dot="rgba(243,239,232,0.9)" />
                <Bar className="mt-5 h-1.5 w-[62%] bg-white/20" />
                <Bar className="mt-2 h-1.5 w-[48%] bg-white/20" />
                <div className="mt-5 flex gap-2.5">
                    <Bar className="h-6 w-20" dot="rgba(255,255,255,0.9)" />
                    <Bar className="h-6 w-20 border border-dotted border-[#5a5a5a]" />
                </div>
            </div>

            {/* feature cards */}
            <div className="mt-10 grid grid-cols-3 gap-2 sm:gap-3">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="rounded-xl border-2 border-dotted border-[#3a3a3a] bg-[#191919] p-2.5 sm:p-3">
                        <Bar className="h-5 w-5" dot="rgba(233,79,37,0.8)" />
                        <Bar className="mt-3 h-1.5 w-[70%] bg-white/55" />
                        <Bar className="mt-2 h-1 w-full bg-white/15" />
                        <Bar className="mt-1.5 h-1 w-[80%] bg-white/15" />
                    </div>
                ))}
            </div>

            {/* wide feature */}
            <div
                className="mt-8 h-28 rounded-xl border-2 border-dotted border-[#e94f25]/50 bg-[#e94f25]/10 sm:h-36"
                style={dotGrid("rgba(233,79,37,0.45)", 6, 1.5)}
            />

            {/* stats */}
            <div className="mt-8 grid grid-cols-3 gap-3">
                {[0, 1, 2].map((i) => (
                    <div key={i} className="flex flex-col items-center">
                        <Bar className="h-4 w-10 rounded-md" dot="rgba(243,239,232,0.85)" />
                        <Bar className="mt-2 h-1 w-12 bg-white/20" />
                    </div>
                ))}
            </div>

            {/* footer */}
            <div className="mt-10 flex items-center justify-between border-t-2 border-dotted border-[#3a3a3a] pt-4">
                <Bar className="h-2.5 w-12 bg-white/40" />
                <div className="flex gap-2">
                    <Bar className="h-1.5 w-8 bg-white/20" />
                    <Bar className="h-1.5 w-8 bg-white/20" />
                </div>
            </div>
        </motion.div>
    );
}

/* ------------------------------------------------------------------ */
/*  Preview 4 – event booking: seats get picked, then confirmed        */
/* ------------------------------------------------------------------ */
const SEAT_COLS = 8;
const SEAT_ROWS = 5;
const TAKEN = new Set([2, 3, 11, 12, 20, 21, 27, 33, 34]);
const PICK_ORDER = [18, 19, 26, 25]; // free seats, picked one after another
const SEAT_PRICE = 499;

function BookingPreview({ active }) {
    // 0..PICK_ORDER.length = seats picked so far, one more step = confirmed
    const [step, setStep] = useState(0);

    useEffect(() => {
        if (!active) return;
        const id = setInterval(() => setStep((p) => (p > PICK_ORDER.length ? 0 : p + 1)), 950);
        return () => clearInterval(id);
    }, [active]);

    const confirmed = step > PICK_ORDER.length;
    const selected = new Set(PICK_ORDER.slice(0, Math.min(step, PICK_ORDER.length)));
    const n = selected.size;

    return (
        // phones: event info + summary on top, seat map underneath · sm and up: side by side
        <div className="flex h-full flex-col gap-4 p-3.5 sm:flex-row sm:gap-6 sm:p-5">
            {/* event + summary */}
            <div className="flex items-end justify-between gap-3 sm:w-[40%] sm:flex-col sm:items-stretch">
                <div className="min-w-0 flex-1 sm:flex-none">
                    <p className="text-[9px] tracking-[0.15em] text-[#e94f25] sm:text-[10px] sm:tracking-[0.2em]" style={MONO}>
                        SAT · 7:30 PM
                    </p>
                    <p className="mt-2 leading-[0.95] [font-size:clamp(1.5rem,7vw,2.5rem)] sm:[font-size:clamp(1.3rem,3.2vw,2.5rem)]" style={SERIF}>
                        <span style={textInk(3)}>Live in </span>
                        <span className="italic" style={textAccent(3)}>concert</span>
                    </p>
                    <p className="mt-2 text-[10px] text-white/65 sm:text-xs">Open Air Arena</p>
                </div>
                <div className="w-[42%] shrink-0 sm:w-auto">
                    <div
                        className="mb-2 flex justify-between text-[9px] tracking-[0.1em] text-white/65 sm:text-[10px] sm:tracking-[0.15em]"
                        style={MONO}
                    >
                        <span>
                            {n} {n === 1 ? "SEAT" : "SEATS"}
                        </span>
                        <span>₹ {n * SEAT_PRICE}</span>
                    </div>
                    <motion.div
                        animate={{
                            backgroundColor: confirmed ? "rgba(233,79,37,0.6)" : "rgba(255,255,255,0.14)",
                            borderColor: confirmed ? "#e94f25" : "rgba(255,255,255,0.55)",
                        }}
                        transition={{ duration: 0.35 }}
                        className="rounded-full border-2 border-dotted py-1.5 text-center text-[11px] font-medium text-white sm:text-xs"
                        style={{ ...dotGrid("rgba(243,239,232,0.3)", 4, 1.1), textShadow: "0 1px 6px rgba(0,0,0,0.8)" }}
                    >
                        {confirmed ? "Booked" : "Book now"}
                    </motion.div>
                </div>
            </div>

            {/* seat map – every seat is a dot */}
            <div className="flex min-h-0 flex-1 flex-col justify-center">
                <div className="mb-1.5 h-1 rounded-full bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                <p className="mb-3 text-center text-[8px] tracking-[0.3em] text-white/50 sm:text-[9px]" style={MONO}>
                    STAGE
                </p>
                <div className="mx-auto grid w-full max-w-[280px] grid-cols-8 gap-1.5 sm:max-w-none sm:gap-2">
                    {Array.from({ length: SEAT_COLS * SEAT_ROWS }, (_, i) => {
                        const taken = TAKEN.has(i);
                        const sel = selected.has(i);
                        return (
                            <motion.span
                                key={i}
                                animate={{
                                    backgroundColor: sel ? "#e94f25" : taken ? "#3a3a3a" : "#121212",
                                    scale: sel ? [1, 1.3, 1] : 1,
                                }}
                                transition={{ duration: 0.35 }}
                                className={
                                    "block aspect-square rounded-full border " +
                                    (sel ? "border-[#e94f25]" : taken ? "border-transparent" : "border-[#4a4a4a]")
                                }
                            />
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

// phone-only frame shapes (full class names so Tailwind can see them)
const RATIOS = { kanban: "aspect-[1/1]", booking: "aspect-[1/1]" };

const PREVIEWS = { kanban: KanbanPreview, feed: FeedPreview, browser: SitePreview, booking: BookingPreview };

/* ------------------------------------------------------------------ */
/*  One project row                                                    */
/* ------------------------------------------------------------------ */
function ProjectRow({ project, index }) {
    const ref = useRef(null);
    // previews only animate while the row is on screen
    const inView = useInView(ref, { margin: "-10% 0px -10% 0px" });
    const wide = useIsWide();
    const Preview = PREVIEWS[project.kind];
    const flip = index % 2 === 1;

    return (
        <article ref={ref} className="grid items-center gap-5 sm:gap-8 lg:grid-cols-12 lg:gap-14">
            <div data-reveal="media" className={"min-w-0 lg:col-span-7 " + (flip ? "lg:order-2" : "")}>
                <Tilt>
                    <BrowserFrame url={project.display} ratio={RATIOS[project.kind]}>
                        <Preview active={inView} />
                    </BrowserFrame>
                </Tilt>
            </div>

            <div data-reveal="text" className={"min-w-0 lg:col-span-5 " + (flip ? "lg:order-1" : "")}>
                <p className="mb-3 text-[10px] tracking-[0.2em] text-[#e94f25] sm:mb-4 sm:text-[11px] sm:tracking-[0.25em]" style={MONO}>
                    {project.label}
                </p>
                <h3
                    className="break-words leading-[0.95] tracking-[-0.02em] [font-size:clamp(2.4rem,10vw,3.6rem)] sm:[font-size:clamp(2.6rem,6vw,5rem)]"
                    style={SERIF}
                >
                    <span style={textInk(wide ? 4.5 : 3.5)}>{project.title}</span>
                </h3>
                <p className="mt-4 max-w-[40ch] text-[15px] leading-relaxed text-[#a8a8a8] sm:mt-5 sm:text-lg">
                    {project.blurb}
                </p>

                <ul className="mt-5 flex flex-wrap gap-2 sm:mt-6" style={MONO}>
                    {project.tags.map((t) => (
                        <li
                            key={t}
                            className="rounded-full border-2 border-dotted border-[#3a3a3a] px-3 py-1 text-[10px] tracking-[0.14em] text-white/60 sm:tracking-[0.18em]"
                        >
                            {t}
                        </li>
                    ))}
                </ul>

                {project.url && (
                    <a
                        href={project.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-7 inline-flex w-full items-center justify-center rounded-xl border-2 border-dotted border-[#e94f25] bg-[#e94f25]/20 px-6 py-3.5 text-sm font-medium text-white transition-colors duration-300 hover:bg-[#e94f25]/45 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white sm:mt-8 sm:w-auto sm:py-3"
                        style={{ ...dotGrid("rgba(233,79,37,0.85)", 4, 1.5), textShadow: "0 1px 8px rgba(0,0,0,0.75)" }}
                    >
                        Visit site
                    </a>
                )}
            </div>
        </article>
    );
}

/* ------------------------------------------------------------------ */
/*  Work section                                                       */
/* ------------------------------------------------------------------ */
export default function Work() {
    const rootRef = useRef(null);
    const wide = useIsWide();

    // same fonts as the Hero – only added once
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
                    { clipPath: "inset(14% 10% 14% 10% round 24px)", opacity: 0, y: 60 },
                    {
                        clipPath: "inset(0% 0% 0% 0% round 0px)",
                        opacity: 1,
                        y: 0,
                        duration: 1.3,
                        ease: "expo.out",
                        clearProps: "clipPath",
                        // lower trigger point so tall stacked cards on phones still reveal reliably
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
            id="work"
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

            <div className="relative z-10 mx-auto w-full max-w-[1600px] px-4 py-12 sm:px-5 sm:py-24 md:py-36 lg:px-10">
                {/* header */}
                <div
                    data-reveal="text"
                    className="mb-10 flex flex-col gap-5 sm:mb-16 sm:gap-6 md:mb-28 md:flex-row md:items-end md:justify-between"
                >
                    <div>
                        <p className="mb-4 text-[10px] tracking-[0.2em] text-[#e94f25] sm:mb-5 sm:text-[11px] sm:tracking-[0.25em]" style={MONO}>
                            SELECTED WORK
                        </p>
                        <h2
                            className="leading-[0.95] tracking-[-0.02em] [font-size:clamp(2.6rem,12vw,4rem)] sm:[font-size:clamp(2.8rem,8vw,7.5rem)]"
                            style={SERIF}
                        >
                            <span style={textInk(wide ? 5.5 : 3.5)}>Things I’ve </span>
                            <span className="italic" style={textAccent(wide ? 5.5 : 3.5)}>shipped</span>
                        </h2>
                    </div>
                    <p className="max-w-[34ch] text-[15px] leading-relaxed text-[#a8a8a8] sm:text-lg">
                        Products I designed, built and launched, from the first commit to real users.
                    </p>
                </div>

                {/* projects */}
                <div>
                    {PROJECTS.map((p, i) => (
                        <div
                            key={p.id}
                            className={
                                i > 0
                                    ? "mt-10 border-t-2 border-dotted border-[#333] pt-10 sm:mt-20 sm:pt-20 md:mt-32 md:pt-32"
                                    : ""
                            }
                        >
                            <ProjectRow project={p} index={i} />
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}