# Calisthenics Tracker

Mobile-first web app for logging and tracking a 12-week advanced calisthenics training plan. Select a session, log sets/reps/weight (pre-filled from your last session), and track progress over time with charts.

## Architecture

- **Next.js 14** (App Router) — pages: Home, Log Workout, Progress Dashboard
- **GitHub API** — workout logs stored as JSON files in `mpurer/calisthenics-logs` (private repo)
- **`/api/github` route** — server-side proxy keeping the GitHub token out of the browser
- **Recharts** — line charts for progress tracking
- **Tailwind CSS** — mobile-first dark theme

```
src/
├── app/
│   ├── page.tsx                    # Home: session picker + deload toggle
│   ├── log/[sessionType]/          # Log workout page
│   ├── dashboard/                  # Progress dashboard
│   └── api/github/route.ts         # GitHub API proxy
├── components/                     # UI components
├── config/training-plan.ts         # Hardcoded exercises for all 4 sessions
└── lib/
    ├── github.ts                   # Client for /api/github
    ├── logs.ts                     # Pure utility functions
    └── types.ts                    # Shared TypeScript types
```

## Local Development

1. Clone the repo
2. `npm install`
3. Create `.env.local` (see `.env.example`):
   ```
   GITHUB_TOKEN=your_github_fine_grained_pat_here
   ```
   Token needs **Contents: Read and Write** on `mpurer/calisthenics-logs`.
4. `npm run dev` — open [http://localhost:3000](http://localhost:3000)

## Running Tests

```bash
npm test
```

## Deployment

Hosted on Vercel. Set `GITHUB_TOKEN` as an environment variable in the Vercel project settings.
