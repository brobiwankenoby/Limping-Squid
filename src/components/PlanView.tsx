"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { alternativesFor } from "@/lib/generator";
import { FOCUS_LABELS, HORIZON_LABELS, PHASE_LABELS } from "@/lib/labels";
import type {
  Exercise,
  Phase,
  PhaseBlock,
  Session,
  TrainingPlan,
} from "@/lib/types";
import { Logo } from "@/components/Logo";

const LOAD_BADGE: Record<"low" | "moderate" | "high", string> = {
  low: "bg-court/15 text-court-dark",
  high: "bg-brand/15 text-brand-dark",
  moderate: "bg-squid/30 text-ink",
};

function youtubeId(url?: string): string | null {
  if (!url) return null;
  const m = url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{6,})/);
  return m ? m[1] : null;
}

export function PlanView({
  plan: initial,
  onRestart,
  onEdit,
  onPlanChange,
  restored = false,
  onDismissRestored,
}: {
  plan: TrainingPlan;
  onRestart: () => void;
  onEdit: () => void;
  onPlanChange?: (plan: TrainingPlan) => void;
  restored?: boolean;
  onDismissRestored?: () => void;
}) {
  const [plan, setPlan] = useState<TrainingPlan>(initial);
  const [video, setVideo] = useState<Exercise | null>(null);
  const [swapTarget, setSwapTarget] = useState<{
    sessionId: string;
    blockId: string;
    itemIndex: number;
    phase: Phase;
    current: Exercise;
  } | null>(null);
  const skipPersist = useRef(true);

  useEffect(() => {
    if (skipPersist.current) {
      skipPersist.current = false;
      return;
    }
    if (!onPlanChange) return;
    const t = window.setTimeout(() => onPlanChange(plan), 300);
    return () => window.clearTimeout(t);
  }, [plan, onPlanChange]);

  // Deep-update helper for a single session.
  const updateSession = (
    sessionId: string,
    updater: (s: Session) => Session
  ) => {
    setPlan((p) => ({
      ...p,
      phases: p.phases.map((ph) => ({
        ...ph,
        weeks: ph.weeks.map((wk) => ({
          ...wk,
          sessions: wk.sessions.map((s) =>
            s.id === sessionId ? updater(s) : s
          ),
        })),
      })),
    }));
  };

  const stats = useMemo(() => {
    let sessions = 0;
    let minutes = 0;
    for (const ph of plan.phases)
      for (const wk of ph.weeks)
        for (const s of wk.sessions) {
          sessions++;
          minutes += s.blocks.reduce(
            (bs, b) => bs + b.items.reduce((is, i) => is + i.durationMin, 0),
            0
          );
        }
    return { sessions, minutes };
  }, [plan]);

  return (
    <div className="min-h-screen bg-sand">
      <header className="no-print sticky top-0 z-40 border-b border-sand-2 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-4">
          <Link href="/">
            <Logo />
          </Link>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={onEdit}
              className="rounded-full border-2 border-sand-2 px-5 py-2 font-semibold text-ink transition hover:border-brand"
            >
              Edit answers
            </button>
            <button
              onClick={() => window.print()}
              className="rounded-full bg-court px-5 py-2 font-semibold text-white transition hover:bg-court-dark"
            >
              Print / PDF
            </button>
            <button
              onClick={onRestart}
              className="rounded-full bg-ink px-5 py-2 font-semibold text-white transition hover:bg-ink-soft"
            >
              New plan
            </button>
          </div>
        </div>
        {restored && (
          <div className="border-t border-sand-2 bg-court/10">
            <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-6 py-2 text-sm text-ink">
              <span>Restored your last plan from this browser.</span>
              <button
                type="button"
                onClick={onDismissRestored}
                className="font-semibold text-court-dark hover:underline"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
      </header>

      <main className="mx-auto max-w-5xl px-6 py-10">
        {/* Summary */}
        <div className="print-block rounded-2xl bg-ink p-8 text-white">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <span className="inline-block rounded-full bg-brand px-3 py-1 text-xs font-bold uppercase tracking-wide">
                {HORIZON_LABELS[plan.horizon]}
              </span>
              <h1 className="mt-3 font-display text-3xl font-black capitalize">
                {plan.title}
              </h1>
            </div>
            <div className="flex gap-6 text-center">
              <Stat value={`${plan.totalWeeks}`} label="weeks" />
              <Stat value={`${stats.sessions}`} label="sessions" />
              <Stat value={`${Math.round(stats.minutes / 60)}h`} label="court time" />
            </div>
          </div>
        </div>

        {/* Phase roadmap overview */}
        <section className="mt-8">
          <h2 className="font-display text-xl font-extrabold text-ink">
            Season roadmap
          </h2>
          <div className="mt-4 flex flex-wrap gap-3">
            {plan.phases.map((ph) => (
              <div
                key={ph.id}
                className="flex-1 min-w-[160px] rounded-xl border border-sand-2 bg-white p-4"
              >
                <div className="font-display font-bold text-brand">
                  {PHASE_LABELS[ph.phase]}
                </div>
                <div className="text-sm text-ink/50">
                  {ph.weekStart === ph.weekEnd
                    ? `Week ${ph.weekStart}`
                    : `Weeks ${ph.weekStart}–${ph.weekEnd}`}
                </div>
                <p className="mt-2 text-sm text-ink/70">{ph.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Phases → weeks → sessions */}
        <section className="mt-8 space-y-4">
          {plan.phases.map((ph) => (
            <PhaseSection
              key={ph.id}
              phase={ph}
              onUpdateSession={updateSession}
              onWatch={setVideo}
              onSwap={(sessionId, blockId, itemIndex, current) =>
                setSwapTarget({
                  sessionId,
                  blockId,
                  itemIndex,
                  phase: ph.phase,
                  current,
                })
              }
            />
          ))}
        </section>
      </main>

      {video && (
        <VideoModal exercise={video} onClose={() => setVideo(null)} />
      )}

      {swapTarget && (
        <SwapModal
          target={swapTarget}
          answers={plan.answers}
          onClose={() => setSwapTarget(null)}
          onPick={(ex) => {
            updateSession(swapTarget.sessionId, (s) => ({
              ...s,
              blocks: s.blocks.map((b) =>
                b.id === swapTarget.blockId
                  ? {
                      ...b,
                      items: b.items.map((it, idx) =>
                        idx === swapTarget.itemIndex
                          ? { exercise: ex, durationMin: ex.durationMin }
                          : it
                      ),
                    }
                  : b
              ),
            }));
            setSwapTarget(null);
          }}
        />
      )}
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-display text-3xl font-black text-brand">{value}</div>
      <div className="text-xs uppercase tracking-wide text-white/60">
        {label}
      </div>
    </div>
  );
}

function PhaseSection({
  phase,
  onUpdateSession,
  onWatch,
  onSwap,
}: {
  phase: PhaseBlock;
  onUpdateSession: (id: string, updater: (s: Session) => Session) => void;
  onWatch: (ex: Exercise) => void;
  onSwap: (
    sessionId: string,
    blockId: string,
    itemIndex: number,
    current: Exercise
  ) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="print-block overflow-hidden rounded-2xl border border-sand-2 bg-white">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-6 py-4 text-left"
      >
        <div>
          <span className="font-display text-lg font-extrabold text-ink">
            {PHASE_LABELS[phase.phase]}
          </span>
          <span className="ml-3 text-sm text-ink/50">
            {phase.weekStart === phase.weekEnd
              ? `Week ${phase.weekStart}`
              : `Weeks ${phase.weekStart}–${phase.weekEnd}`}
          </span>
        </div>
        <span className="text-brand">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="space-y-4 border-t border-sand-2 px-6 py-6">
          {phase.weeks.map((wk) => (
            <div key={wk.id}>
              <div className="mb-3 flex items-center gap-3">
                <h3 className="font-display font-bold text-ink">
                  Week {wk.index}
                </h3>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase ${LOAD_BADGE[wk.load]}`}
                >
                  {wk.load} load
                </span>
                <span className="text-sm text-ink/50">
                  {wk.emphasis.map((z) => FOCUS_LABELS[z]).join(" · ")}
                </span>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {wk.sessions.map((s) => (
                  <SessionCard
                    key={s.id}
                    session={s}
                    onUpdate={onUpdateSession}
                    onWatch={onWatch}
                    onSwap={onSwap}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const BLOCK_COLORS: Record<string, string> = {
  warmup: "border-l-squid",
  skill: "border-l-brand",
  tactical: "border-l-court",
  scrimmage: "border-l-ink",
  conditioning: "border-l-brand-dark",
  cooldown: "border-l-sand-2",
};

function SessionCard({
  session,
  onUpdate,
  onWatch,
  onSwap,
}: {
  session: Session;
  onUpdate: (id: string, updater: (s: Session) => Session) => void;
  onWatch: (ex: Exercise) => void;
  onSwap: (
    sessionId: string,
    blockId: string,
    itemIndex: number,
    current: Exercise
  ) => void;
}) {
  const [open, setOpen] = useState(false);
  const total = session.blocks.reduce(
    (bs, b) => bs + b.items.reduce((is, i) => is + i.durationMin, 0),
    0
  );

  const retime = (blockId: string, idx: number, min: number) =>
    onUpdate(session.id, (s) => ({
      ...s,
      blocks: s.blocks.map((b) =>
        b.id === blockId
          ? {
              ...b,
              items: b.items.map((it, i) =>
                i === idx ? { ...it, durationMin: Math.max(1, min) } : it
              ),
            }
          : b
      ),
    }));

  const remove = (blockId: string, idx: number) =>
    onUpdate(session.id, (s) => ({
      ...s,
      blocks: s.blocks.map((b) =>
        b.id === blockId
          ? { ...b, items: b.items.filter((_, i) => i !== idx) }
          : b
      ),
    }));

  const move = (blockId: string, idx: number, dir: -1 | 1) => {
    onUpdate(session.id, (s) => ({
      ...s,
      blocks: s.blocks.map((b) => {
        if (b.id !== blockId) return b;
        const j = idx + dir;
        if (j < 0 || j >= b.items.length) return b;
        const items = [...b.items];
        const tmp = items[idx];
        items[idx] = items[j];
        items[j] = tmp;
        return { ...b, items };
      }),
    }));
  };

  return (
    <div className="rounded-xl border border-sand-2 bg-sand/40">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-bold text-ink">{session.label}</span>
            <span className="text-sm text-ink/50">{total} min</span>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${LOAD_BADGE[session.intensity]}`}
            >
              {session.intensity}
            </span>
          </div>
          <div className="mt-1 text-xs text-ink/55">
            Theme: {FOCUS_LABELS[session.theme]}
            <span className="text-ink/35"> · </span>
            Support: {FOCUS_LABELS[session.secondaryTheme]}
          </div>
          {session.note && (
            <div className="mt-0.5 text-xs text-ink/55">{session.note}</div>
          )}
        </div>
        <span className="shrink-0 text-brand">{open ? "Hide" : "View"}</span>
      </button>
      {open && (
        <div className="space-y-4 border-t border-sand-2 px-4 py-4">
          {session.blocks.map((b) => (
            <div
              key={b.id}
              className={`border-l-4 pl-3 ${BLOCK_COLORS[b.type] ?? "border-l-slate-300"}`}
            >
              <div className="text-xs font-bold uppercase tracking-wide text-ink/50">
                {b.title}
              </div>
              <div className="mt-2 space-y-2">
                {b.items.length === 0 && (
                  <div className="text-sm italic text-ink/40">
                    No drills — add via swap.
                  </div>
                )}
                {b.items.map((it, idx) => {
                  const isFirst = idx === 0;
                  const isLast = idx === b.items.length - 1;
                  return (
                  <div
                    key={`${b.id}-${it.exercise.id}-${idx}`}
                    className="rounded-lg bg-white p-3 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-ink">
                          {it.exercise.name}
                        </div>
                        <div className="text-sm text-ink/60">
                          {it.exercise.description}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-1 text-[11px] text-ink/50">
                          {it.exercise.focusZones.map((z) => (
                            <span
                              key={z}
                              className="rounded bg-sand px-1.5 py-0.5"
                            >
                              {FOCUS_LABELS[z]}
                            </span>
                          ))}
                          <span className="rounded bg-sand px-1.5 py-0.5">
                            difficulty {it.exercise.difficulty}/5
                          </span>
                        </div>
                      </div>
                      <div className="no-print flex shrink-0 flex-col items-end gap-1">
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            value={it.durationMin}
                            min={1}
                            onChange={(e) =>
                              retime(b.id, idx, Number(e.target.value))
                            }
                            className="w-14 rounded border border-sand-2 px-1.5 py-0.5 text-right text-sm"
                          />
                          <span className="text-xs text-ink/50">min</span>
                        </div>
                        <div className="flex gap-1">
                          {youtubeId(it.exercise.videoUrl) && (
                            <IconBtn
                              title="Watch video"
                              onClick={() => onWatch(it.exercise)}
                              label="▶"
                            />
                          )}
                          <IconBtn
                            title="Swap drill"
                            onClick={() =>
                              onSwap(session.id, b.id, idx, it.exercise)
                            }
                            label="⇄"
                          />
                          {!isFirst && (
                            <IconBtn
                              title="Move up"
                              onClick={() => move(b.id, idx, -1)}
                              label="↑"
                            />
                          )}
                          {!isLast && (
                            <IconBtn
                              title="Move down"
                              onClick={() => move(b.id, idx, 1)}
                              label="↓"
                            />
                          )}
                          <IconBtn
                            title="Remove"
                            onClick={() => remove(b.id, idx)}
                            label="✕"
                          />
                        </div>
                      </div>
                    </div>
                    {/* Print-only duration */}
                    <div className="hidden text-sm text-ink/50 print:block">
                      {it.durationMin} min
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function IconBtn({
  onClick,
  label,
  title,
}: {
  onClick: () => void;
  label: string;
  title: string;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      }}
      className="flex h-7 w-7 items-center justify-center rounded-md border border-sand-2 bg-white text-sm text-ink transition hover:border-brand hover:text-brand"
    >
      {label}
    </button>
  );
}

function VideoModal({
  exercise,
  onClose,
}: {
  exercise: Exercise;
  onClose: () => void;
}) {
  const id = youtubeId(exercise.videoUrl);
  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3">
          <h3 className="font-display font-bold text-ink">{exercise.name}</h3>
          <button onClick={onClose} className="text-ink/50 hover:text-ink">
            ✕
          </button>
        </div>
        <div className="aspect-video w-full bg-black">
          {id ? (
            <iframe
              className="h-full w-full"
              src={`https://www.youtube.com/embed/${id}`}
              title={exercise.name}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="flex h-full items-center justify-center text-white/60">
              No video linked.
            </div>
          )}
        </div>
        <p className="px-5 py-4 text-sm text-ink/70">{exercise.description}</p>
      </div>
    </div>
  );
}

function SwapModal({
  target,
  answers,
  onClose,
  onPick,
}: {
  target: { current: Exercise; phase: Phase };
  answers: TrainingPlan["answers"];
  onClose: () => void;
  onPick: (ex: Exercise) => void;
}) {
  const options = alternativesFor(target.current, answers, target.phase);
  return (
    <div
      className="no-print fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-sand-2 bg-white px-5 py-3">
          <h3 className="font-display font-bold text-ink">Swap drill</h3>
          <button onClick={onClose} className="text-ink/50 hover:text-ink">
            ✕
          </button>
        </div>
        <div className="space-y-2 p-4">
          {options.length === 0 && (
            <p className="text-ink/60">No alternatives match this slot.</p>
          )}
          {options.map((ex) => (
            <button
              key={ex.id}
              onClick={() => onPick(ex)}
              className="block w-full rounded-lg border-2 border-sand-2 p-3 text-left transition hover:border-brand"
            >
              <div className="font-semibold text-ink">{ex.name}</div>
              <div className="text-sm text-ink/60">{ex.description}</div>
              <div className="mt-1 text-xs text-ink/50">
                {ex.durationMin} min · difficulty {ex.difficulty}/5
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
