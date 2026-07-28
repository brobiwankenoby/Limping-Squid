import Link from "next/link";
import { Logo } from "@/components/Logo";

const STEPS = [
  {
    title: "Choose your planning horizon",
    body: "Tell us whether you need a single practice, a week, a month, half a season, a full season, or playoff prep. Longer plans are broken into phases that build fitness, sharpen skills, then taper toward competition.",
  },
  {
    title: "Describe your team",
    body: "Age group, level, roster size, and gender help us pick drills that fit your players — not a generic template.",
  },
  {
    title: "Add calendar context (when it matters)",
    body: "For longer plans you can set a start date and game days (recurring or one-off). We lighten practices the day before and after matches, and place harder work farther from game day.",
  },
  {
    title: "Set time, days, and equipment",
    body: "Session length is a hard limit — practices never run overtime. With four or fewer sessions a week you choose the exact practice days so we don’t stack hard days back-to-back. Available gear filters which drills we can use.",
  },
  {
    title: "Focus areas and how we pick drills",
    body: "You pick up to three focus zones (and an optional weakness). Each practice gets one primary theme and a linked support skill. You also choose variety, random, or progressive difficulty.",
  },
  {
    title: "Generate, edit, and export",
    body: "We assemble a periodized plan you can open day by day, swap drills, retime blocks, watch technique videos, then print or save as PDF. Nothing is saved online in this prototype — your printout is your copy.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="min-h-screen bg-sand">
      <header className="border-b border-sand-2 bg-white">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-6 py-4">
          <Link href="/">
            <Logo />
          </Link>
          <Link
            href="/build"
            className="rounded-full bg-brand px-5 py-2 font-semibold text-white transition hover:bg-brand-dark"
          >
            Build a plan
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        <p className="text-sm font-semibold uppercase tracking-wide text-court">
          How it works
        </p>
        <h1 className="mt-2 font-display text-4xl font-black text-ink">
          From a few answers to a personal plan
        </h1>
        <p className="mt-4 text-lg text-ink/70">
          Limping Squid doesn’t guess randomly. It follows a short questionnaire,
          then builds practices around your team, calendar, and goals — with load
          that rises and falls like a real coaching week.
        </p>

        <ol className="mt-12 space-y-8">
          {STEPS.map((step, i) => (
            <li key={step.title} className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-court font-display text-lg font-black text-white">
                {i + 1}
              </div>
              <div>
                <h2 className="font-display text-xl font-bold text-ink">
                  {step.title}
                </h2>
                <p className="mt-2 text-ink/70">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-14 flex flex-wrap gap-3">
          <Link
            href="/build"
            className="rounded-full bg-brand px-8 py-3 text-lg font-bold text-white shadow-lg shadow-brand/30 transition hover:bg-brand-dark"
          >
            Start building →
          </Link>
          <Link
            href="/"
            className="rounded-full border-2 border-sand-2 px-8 py-3 text-lg font-semibold text-ink transition hover:border-brand"
          >
            Back to home
          </Link>
        </div>
      </main>
    </div>
  );
}
