# Limping Squid — Volleyball Training Plan Builder (Prototype)

A guided web app for volleyball coaches. A coach answers a short questionnaire
(team, calendar, goals) and Limping Squid generates a **periodized training plan**
— from a single session up to a full season — with editable, printable drills.

> This is a **throwaway prototype**: everything runs in the browser with a
> hardcoded exercise list. No database, no logins. Generated plans are saved in
> the browser (`localStorage`) so a refresh keeps your work. The real build will
> add a hosted database, an admin area to manage exercises, and your own tagged
> exercise catalog.

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
- **Keep working**: the last generated plan (and edits) restore automatically in this browser after refresh. Use *New plan* to clear it.
- **Watch videos**: drills with a YouTube `videoUrl` show a ▶ button. Links are being filled in as Georgi’s library is uploaded (many drills are still waiting on a URL).
- **Print / PDF**: use the *Print / PDF* button to export a clean copy.

## Where things live

| What | File |
|---|---|
| Exercise library (245 mapped drills + stubs) | `src/lib/exercises.ts` |
| Exercise tags / data model | `src/lib/types.ts` |
| Plan generation + periodization rules | `src/lib/generator.ts` |
| Browser draft persistence | `src/lib/draft.ts` |
| The question wizard | `src/components/Wizard.tsx` |
| The generated plan + editing | `src/components/PlanView.tsx` |
| Landing page | `src/app/page.tsx` |
| How it works | `src/app/how-it-works/page.tsx` |

## Swapping in real videos

In `src/lib/exercises.ts`, set each exercise's `videoUrl` to your own unlisted
YouTube link (either the `watch?v=...` or `youtu.be/...` form works). Prefer
titles that match the drill name, e.g. `Setting (1001)`.

SSC drills (8001–8999) and wall drills (15001+) are deferred for now.

## Next steps (real build)

1. Finish linking YouTube URLs for the mapped drill library.
2. Move the exercise library into a hosted database (e.g. Supabase).
3. Add an admin area with logins so a small team can add/edit exercises.
4. Import any remaining catalog ranges (SSC, walls) once ready.
