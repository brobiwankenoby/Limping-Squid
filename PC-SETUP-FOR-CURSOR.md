# PC setup — paste this whole file into Cursor on Windows

You are Cursor on Martin’s Windows PC. Your job is to get the **Limping Squid** volleyball training-plan app running locally, with the same GitHub repo as the Mac.

Do the steps in order. Do not skip checks. After each major step, report what you found and what you did.

---

## What this project is

- **Name:** Limping Squid
- **GitHub:** https://github.com/brobiwankenoby/Limping-Squid
- **Owner GitHub user:** brobiwankenoby
- **Stack:** Next.js 16, React 19, TypeScript, Tailwind v4
- **No `.env` file** is required. There is no database and no login yet.
- **Do not** expect the drill video files on this PC. They live on the Mac under `Documents/Project with Georgi`. The app uses mapped metadata in `src/lib/exercises.ts`; YouTube `videoUrl`s are still being filled in as uploads finish.

---

## Step 1 — Check tools

Run these in PowerShell (or the Cursor terminal):

```powershell
git --version
node --version
npm --version
```

Requirements:

- Git installed
- Node.js **v20 or newer** (LTS is fine)
- npm comes with Node

If Git is missing: tell Martin to install https://git-scm.com/download/win and reopen the terminal.

If Node is missing or older than 20: tell Martin to install the LTS build from https://nodejs.org and reopen the terminal.

Do not continue until `git` and `node` both work.

---

## Step 2 — GitHub access

The repo is private or may require login. Confirm GitHub auth:

```powershell
gh auth status
```

If `gh` is not installed, that is OK. Then try:

```powershell
git ls-remote https://github.com/brobiwankenoby/Limping-Squid.git
```

If that fails with auth errors:

1. Sign into GitHub inside Cursor (Account / GitHub).
2. Or run `gh auth login` in the terminal (browser login).
3. Retry `git ls-remote`.

Martin’s GitHub account for this repo is **brobiwankenoby**.

---

## Step 3 — Choose a folder and clone

Prefer a normal projects folder, for example:

`C:\Users\<windows-username>\Projects`

If that folder does not exist, create it.

**If the folder `Limping-Squid` already exists there:** do not clone again. `cd` into it and run `git status` and `git pull origin main`.

**If it does not exist:**

```powershell
cd $env:USERPROFILE\Projects
git clone https://github.com/brobiwankenoby/Limping-Squid.git
cd Limping-Squid
```

If `Projects` does not exist:

```powershell
New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\Projects" | Out-Null
cd $env:USERPROFILE\Projects
git clone https://github.com/brobiwankenoby/Limping-Squid.git
cd Limping-Squid
```

Then:

```powershell
git status
git log -1 --oneline
git remote -v
```

Confirm:

- Branch is `main`
- Remote is `https://github.com/brobiwankenoby/Limping-Squid.git`
- Latest commit should include the mapped exercise library (look for a message about mapping Georgi’s drills / human-readable names). If HEAD is still `Polish plan UX from feedback`, the Mac changes were not pushed — stop and tell Martin to push from the Mac.

---

## Step 4 — Open the repo in Cursor

If Cursor is not already rooted on this clone:

- File → Open Folder → the `Limping-Squid` directory you just cloned.

All later commands must run **inside that folder**.

---

## Step 5 — Install dependencies and run the app

```powershell
npm install
npm run dev
```

Wait until Next.js prints a local URL (usually `http://localhost:3000`).

Then:

1. Open that URL in the browser.
2. Confirm the Limping Squid landing page loads.
3. Click through **Start building** far enough to generate a plan.
4. Confirm generated sessions show named drills such as `Setting (1001)` / `Serve and Receive (10006)`, not only the old placeholder names like `Serve to Zones`.

If `npm run dev` fails:

- Paste the full error.
- Check Node is v20+.
- Delete `node_modules` and `package-lock.json` only if install is corrupt, then `npm install` again.

Leave the dev server running unless Martin asks you to stop it.

---

## Step 6 — How to work on this PC from now on

Before starting work:

```powershell
git pull origin main
```

After finishing a task Martin asked for (only if he asked you to commit):

```powershell
git status
git diff
git log -5 --oneline
git add <the files you changed>
git commit -m "short why-focused message"
git push origin main
```

Rules:

- Never `git push --force` on `main`.
- Never change git config.
- Do not commit secrets. This repo should not have `.env` files.
- Pull on the Mac before continuing there, so the two machines stay in sync.

---

## What you should NOT do on the PC

- Do not try to find or remap the `.mp4` drill library. It is on the Mac only (`Documents/Project with Georgi`), already renamed into category folders.
- Do not upload to YouTube from this PC unless Martin explicitly asks. Uploads are in progress from the Mac (~15 videos/day because of YouTube limits). Keep titles like `Setting (1001)` if you ever do upload.
- Do not add SSC / 8000-coded drills yet. That is deferred.
- Do not treat `scripts/rename-manifest.json` paths as valid on Windows. Those paths are Mac absolute paths for undo/history.

---

## Useful files once the repo is open

| File | What it is |
|---|---|
| `src/lib/exercises.ts` | Exercise library (245 mapped drills + warmup/scrimmage stubs) |
| `src/lib/types.ts` | Domain types, including `sourceCode` / `sourceFile` / `videoUrl` |
| `src/lib/generator.ts` | Plan generator |
| `src/components/Wizard.tsx` | Coach questionnaire |
| `src/components/PlanView.tsx` | Generated plan UI |
| `scripts/map-exercises.py` | Regenerates the library from Mac video filenames |
| `scripts/mapped-exercises.json` | JSON dump of the mapped drills |

---

## Done when

Reply to Martin with:

1. Clone path on disk
2. `git log -1 --oneline`
3. Node version
4. Whether `npm run dev` is running and the URL
5. Whether a generated plan showed the mapped drill names

If anything blocked you (GitHub auth, Node missing, clone failed), stop and say exactly what is missing.
