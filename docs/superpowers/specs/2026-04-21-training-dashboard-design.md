# Calisthenics Training Dashboard — Design Spec
_Date: 2026-04-21_

## Overview

A mobile-first web app for logging and tracking a 12-week advanced calisthenics training plan. Note: the project lives in a folder called "Slackline" but is purely a calisthenics tracker — no relation to slacklining. The user selects a session to train, logs sets/reps/weight per exercise (pre-filled from the previous session), and views progress over time in a dashboard. Data is stored as JSON files in a private GitHub repository. Hosted on Vercel.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS (mobile-first) |
| Charts | Recharts |
| Storage | GitHub API → JSON files in private repo (`mpurer/calisthenics-logs`) |
| Hosting | Vercel |
| Auth/Secrets | GitHub personal access token stored as Vercel environment variable, accessed via Next.js API route |

---

## Architecture

```
Browser
  └── Next.js (Vercel)
        ├── Pages: Home, Log Workout, Progress Dashboard
        ├── API Route: /api/github
        │     └── Proxies read/write to GitHub API (keeps token server-side)
        └── Static config: training-plan.ts (exercises hardcoded per session)
```

The training plan (exercises, set targets, exercise types) is hardcoded in the app as a TypeScript config file. Workout logs (actuals) are stored in the GitHub repo.

---

## Data Storage

**Repository:** `mpurer/calisthenics-logs` (private)

**File naming:** `logs/YYYY-MM-DD-{session-slug}.json`

Examples:
```
logs/2026-04-21-planche-oahs.json
logs/2026-04-23-pull-fl-oahs.json
logs/2026-04-25-planche-oahs.json   ← same session, different date
```

**File structure:**
```json
{
  "date": "2026-04-21",
  "sessionType": "planche-oahs",
  "isDeload": false,
  "rating": 4,
  "exercises": [
    {
      "id": "advanced-tuck-planche",
      "name": "Advanced tuck planche",
      "sets": [
        { "duration": 7, "weight": null },
        { "duration": 8, "weight": null },
        { "duration": 7, "weight": null }
      ]
    },
    {
      "id": "weighted-dips",
      "name": "Weighted dips",
      "sets": [
        { "reps": 6, "weight": 10 },
        { "reps": 5, "weight": 10 },
        { "reps": 6, "weight": 10 }
      ]
    }
  ]
}
```

**Exercise set fields:**
- `duration` (seconds) — for holds and timed exercises
- `reps` — for rep-based exercises
- `weight` (kg) — null for bodyweight exercises
- An exercise can have both `duration` and `reps` if needed

---

## Training Plan Config (Hardcoded)

Four named sessions, defined in `src/config/training-plan.ts`:

| Session slug | Display name |
|---|---|
| `planche-oahs` | Planche + OAHS |
| `pull-fl-oahs` | Pull + Front Lever + OAHS |
| `oahs-hspu` | OAHS + HSPU |
| `hybrid` | Hybrid — Planche + Pull + Legs |

Each session config defines:
- Exercises in order (name, id, type: `duration` / `reps` / `reps+weight`, default set count)
- Grouped by block (OAHS Block, Skill Block, Strength, Core)

---

## Pages & Components

### 1. Home (`/`)

- Date displayed at top
- **Deload week toggle** — when on, all sessions are flagged `isDeload: true` on save. Toggle persists in `localStorage` so it stays on for the whole week.
- 4 session cards, each showing:
  - Session name
  - "Last done: {date}" pulled from logs
- Link to Progress Dashboard

### 2. Log Workout (`/log/[sessionType]`)

- Header: session name + today's date
- **Exercises listed in plan order**, grouped by block
- For each exercise:
  - Name
  - Set rows pre-filled from the most recent log of the same `sessionType`
  - Each set row: duration input and/or reps input and/or weight input (based on exercise type)
  - **× button** to delete a set row
  - **+ add set** button below the last set
- **Star rating** (1–5) at the bottom
- **Save** button — writes JSON to GitHub via `/api/github`
- If no previous session exists, inputs start empty with plan defaults as placeholder text

### 3. Progress Dashboard (`/dashboard`)

- **Exercise selector** dropdown (all exercises across all sessions)
- **Line chart** (Recharts): one data point per session logged
  - X axis: date
  - Y axis: best value that session — longest hold (duration exercises), max reps in any set (rep exercises), or highest weight used (weighted exercises)
  - Normal sessions: blue line/dots
  - Deload sessions: purple dots, visually distinct (dashed or different marker)
- **Stats row** below chart:
  - All-time best
  - Change vs previous session (%)
  - Total sessions logged

---

## Key Design Decisions

1. **No user accounts.** Single-user app. The GitHub token is a Vercel env variable, not entered by the user.
2. **Training plan is static config, not editable in the app.** If the plan changes, edit the TypeScript file and redeploy.
3. **Deload is a week-level toggle on the home screen**, not a separate session type. It persists in `localStorage` and is applied per session logged that week.
4. **Pre-filled inputs** come from the most recent log file matching the same `sessionType`. The user edits what changed.
5. **One file per session.** If the user trains the same session twice in a day, the second save overwrites the first (acceptable for a personal app).

---

## Out of Scope (Not Built)

- Multi-user support / authentication
- Editing past logged sessions
- Push notifications or reminders
- Automatic deload detection
- Export to CSV/PDF
