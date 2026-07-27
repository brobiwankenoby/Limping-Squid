# Limping Squid — Volleyball Training Plan Builder (Prototype)

A guided web app for volleyball coaches. A coach answers a short questionnaire
(team, calendar, goals) and Limping Squid generates a **periodized training plan**
— from a single session up to a full season — with editable, printable drills and
embedded technique videos.

> This is a **throwaway prototype**: everything runs in the browser with a
> hardcoded exercise list. No database, no logins, nothing is saved. The real
> build will add a hosted database, an admin area to manage exercises, and your
> own tagged exercise catalog.

## How to run it

You need [Node.js](https://nodejs.org) installed (v20 or newer).

1. Open a terminal in this folder.
2. Install dependencies (only needed once):

```bash
npm install
```

3. Start the app:

```bash
npm run dev
```

4. Open the link it prints (usually **http://localhost:3000**) in your browser.

To stop the app, press `Ctrl + C` in the terminal.

## What you can do

- **Build a plan**: click *Start building* and answer the questions.
- **Planning horizons**: single session, week, month, half season, full season, or playoff prep.
- **Periodization**: longer plans are split into phases (Preparation → Build → Competition → Peak → Recovery) that raise and taper training load.
- **Edit the plan**: expand any phase → week → session, then swap drills, reorder them, change their duration, or remove them.
- **Watch videos**: drills with a video link show a ▶ button (currently placeholder YouTube links).
- **Print / PDF**: use the *Print / PDF* button to export a clean copy.

## Where things live

| What | File |
|---|---|
| Exercise library (edit drills here) | `src/lib/exercises.ts` |
| Exercise tags / data model | `src/lib/types.ts` |
| Plan generation + periodization rules | `src/lib/generator.ts` |
| The question wizard | `src/components/Wizard.tsx` |
| The generated plan + editing | `src/components/PlanView.tsx` |
| Landing page | `src/app/page.tsx` |

## Swapping in real videos

In `src/lib/exercises.ts`, set each exercise's `videoUrl` to your own unlisted
YouTube link (either the `watch?v=...` or `youtu.be/...` form works).

## Next steps (real build)

1. Move the exercise library into a hosted database (e.g. Supabase).
2. Add an admin area with logins so a small team can add/edit exercises.
3. Import your full tagged exercise catalog.
