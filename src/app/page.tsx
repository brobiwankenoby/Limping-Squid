import Link from "next/link";
import { Logo, SquidMark } from "@/components/Logo";

const FEATURES = [
  {
    title: "Guided questions",
    body: "Answer a short, coach-friendly questionnaire about your team, calendar, and goals.",
  },
  {
    title: "Periodized plans",
    body: "From a single session to a full season — plans are split into phases that build and taper.",
  },
  {
    title: "Editable & printable",
    body: "Swap drills, retime blocks, watch technique videos, then print or save as PDF.",
  },
];

const HORIZONS = [
  "Single session",
  "One week",
  "One month",
  "Half season",
  "Full season",
  "Playoff prep",
];

export default function Home() {
  return (
    <>
      <header className="no-print bg-ink text-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Logo light />
          <Link
            href="/build"
            className="rounded-full bg-brand px-5 py-2 font-semibold text-white transition hover:bg-brand-dark"
          >
            Build a plan
          </Link>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-ink text-white">
          <div className="diagonal-stripes absolute inset-0" />
          <div className="relative mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-2 md:items-center">
            <div>
              <span className="inline-block rounded-full bg-squid px-4 py-1 text-sm font-bold text-ink">
                For volleyball coaches
              </span>
              <h1 className="mt-5 font-display text-5xl font-black leading-tight md:text-6xl">
                Training plans,
                <span className="block text-brand">built in minutes.</span>
              </h1>
              <p className="mt-5 max-w-md text-lg text-white/80">
                Answer a few questions about your team and goals. Limping Squid
                assembles a periodized, drill-by-drill plan you can edit, watch,
                and print.
              </p>
              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  href="/build"
                  className="rounded-full bg-brand px-8 py-3 text-lg font-bold text-white shadow-lg shadow-brand/30 transition hover:bg-brand-dark"
                >
                  Start building →
                </Link>
                <a
                  href="#how"
                  className="rounded-full border border-white/30 px-8 py-3 text-lg font-semibold text-white transition hover:bg-white/10"
                >
                  How it works
                </a>
              </div>
            </div>
            <div className="relative flex justify-center">
              <div className="absolute -inset-8 rounded-full bg-brand/25 blur-3xl" />
              <div className="absolute inset-8 rounded-full bg-squid/15 blur-2xl" />
              <SquidMark className="relative h-64 w-64 drop-shadow-2xl md:h-80 md:w-80" />
            </div>
          </div>
        </section>

        {/* Horizons ribbon */}
        <section className="bg-brand text-white">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-2 px-6 py-4 text-sm font-bold uppercase tracking-wide">
            {HORIZONS.map((h) => (
              <span key={h} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                {h}
              </span>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="how" className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-center font-display text-3xl font-extrabold text-ink md:text-4xl">
            From questions to a plan
          </h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {FEATURES.map((f, i) => (
              <div
                key={f.title}
                className="rounded-2xl border border-sand-2 bg-white p-8 shadow-sm"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-court font-display text-xl font-black text-white">
                  {i + 1}
                </div>
                <h3 className="mt-5 font-display text-xl font-bold text-ink">
                  {f.title}
                </h3>
                <p className="mt-2 text-ink/70">{f.body}</p>
              </div>
            ))}
          </div>
          <div className="mt-14 text-center">
            <Link
              href="/build"
              className="rounded-full bg-ink px-8 py-3 text-lg font-bold text-white transition hover:bg-ink-soft"
            >
              Build my plan
            </Link>
          </div>
        </section>
      </main>

      <footer className="no-print bg-ink py-6 text-center text-sm text-white/60">
        Limping Squid · Prototype
      </footer>
    </>
  );
}
