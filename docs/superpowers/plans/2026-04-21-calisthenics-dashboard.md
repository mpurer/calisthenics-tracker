# Calisthenics Training Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first Next.js app where the user selects a training session, logs sets/reps/weight pre-filled from the previous session, and tracks progress over time via charts backed by JSON files in a private GitHub repo.

**Architecture:** Next.js 14 App Router + TypeScript on Vercel. A single `/api/github` route proxies all reads/writes to the GitHub Contents API using a server-side token. The training plan is a hardcoded TypeScript config; workout logs are JSON files in `mpurer/calisthenics-logs`.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, Recharts, GitHub Contents API, Vercel

---

## File Map

```
src/
├── app/
│   ├── layout.tsx                        # Root layout: dark theme, Tailwind, viewport meta
│   ├── page.tsx                          # Home: deload toggle + 4 session cards
│   ├── log/[sessionType]/page.tsx        # Log workout page
│   ├── dashboard/page.tsx                # Progress dashboard
│   └── api/github/route.ts              # GitHub API proxy (server-side token)
├── components/
│   ├── DeloadToggle.tsx                  # Toggle that persists to localStorage
│   ├── SessionCard.tsx                   # Card showing session name + last done date
│   ├── ExerciseLogger.tsx                # Exercise card: name, sets, add/delete
│   ├── SetRow.tsx                        # One set: reps/duration/weight inputs + × button
│   ├── StarRating.tsx                    # 1–5 star tap input
│   └── ProgressChart.tsx                 # Recharts line chart with deload markers
├── config/
│   └── training-plan.ts                  # All 4 sessions, blocks, exercises hardcoded
└── lib/
    ├── types.ts                          # Shared TypeScript types
    ├── github.ts                         # Thin client: list/read/write via /api/github
    └── logs.ts                           # Pure functions: getLastSession, getBestValue, computeStats
```

---

## Task 1: Bootstrap Next.js Project

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`, `next.config.js`
- Create: `src/app/layout.tsx`
- Create: `src/app/page.tsx` (placeholder)

- [ ] **Step 1: Scaffold the project**

```bash
cd "C:/Users/purer/Desktop/Slackline/training plan"
npx create-next-app@14 . --typescript --tailwind --app --src-dir --no-eslint --import-alias "@/*"
```

When prompted: say Yes to all defaults. This creates the full Next.js 14 App Router project in the current directory.

- [ ] **Step 2: Install additional dependencies**

```bash
npm install recharts
npm install --save-dev jest jest-environment-jsdom @testing-library/react @testing-library/jest-dom ts-jest @types/jest
```

- [ ] **Step 3: Configure Jest**

Create `jest.config.ts`:
```typescript
import type { Config } from 'jest'

const config: Config = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { jsx: 'react' } }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
}

export default config
```

- [ ] **Step 4: Add test script to package.json**

In `package.json`, add to `"scripts"`:
```json
"test": "jest"
```

- [ ] **Step 5: Replace root layout with dark theme**

Replace contents of `src/app/layout.tsx`:
```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Calisthenics Tracker',
  description: 'Track your training sessions',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </head>
      <body className="bg-slate-950 text-slate-100 min-h-screen">
        {children}
      </body>
    </html>
  )
}
```

- [ ] **Step 6: Replace globals.css with minimal reset**

Replace contents of `src/app/globals.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  -webkit-tap-highlight-color: transparent;
}
```

- [ ] **Step 7: Verify dev server starts**

```bash
npm run dev
```

Expected: Server starts at `http://localhost:3000`. Open in browser — should show default Next.js page. Stop with Ctrl+C.

- [ ] **Step 8: Commit**

```bash
git init
git add .
git commit -m "feat: bootstrap Next.js 14 project with Tailwind and Jest"
```

---

## Task 2: TypeScript Types

**Files:**
- Create: `src/lib/types.ts`

- [ ] **Step 1: Write types**

Create `src/lib/types.ts`:
```typescript
export type ExerciseType = 'duration' | 'reps' | 'reps+weight'

export interface ExerciseConfig {
  id: string
  name: string
  type: ExerciseType
  defaultSets: number
}

export interface BlockConfig {
  name: string
  exercises: ExerciseConfig[]
}

export interface SessionConfig {
  slug: string
  displayName: string
  blocks: BlockConfig[]
}

export interface SetLog {
  duration?: number | null
  reps?: number | null
  weight?: number | null
}

export interface ExerciseLog {
  id: string
  name: string
  sets: SetLog[]
}

export interface WorkoutLog {
  date: string            // YYYY-MM-DD
  sessionType: string     // matches SessionConfig.slug
  isDeload: boolean
  rating: number          // 1–5
  exercises: ExerciseLog[]
}

export interface LogFile {
  filename: string        // e.g. "2026-04-21-planche-oahs.json"
  date: string            // YYYY-MM-DD
  sessionType: string
}
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/types.ts
git commit -m "feat: add shared TypeScript types"
```

---

## Task 3: Training Plan Config

**Files:**
- Create: `src/config/training-plan.ts`

- [ ] **Step 1: Write the full training plan config**

Create `src/config/training-plan.ts`:
```typescript
import type { SessionConfig } from '@/lib/types'

export const SESSIONS: SessionConfig[] = [
  {
    slug: 'planche-oahs',
    displayName: 'Planche + OAHS',
    blocks: [
      {
        name: 'OAHS Block',
        exercises: [
          { id: 'wall-assisted-oahs', name: 'Wall-assisted OAHS hold', type: 'duration', defaultSets: 3 },
          { id: 'fingertip-oahs', name: 'Fingertip OAHS', type: 'duration', defaultSets: 4 },
        ],
      },
      {
        name: 'Planche',
        exercises: [
          { id: 'planche-lean', name: 'Planche lean', type: 'duration', defaultSets: 3 },
          { id: 'advanced-tuck-planche', name: 'Advanced tuck planche', type: 'duration', defaultSets: 4 },
          { id: 'band-straddle-planche', name: 'Band-assisted straddle planche', type: 'duration', defaultSets: 4 },
        ],
      },
      {
        name: 'Strength',
        exercises: [
          { id: 'pseudo-planche-pushups', name: 'Pseudo planche push-ups', type: 'reps', defaultSets: 4 },
          { id: 'planche-scapula-pushups', name: 'Planche scapula push-ups', type: 'reps', defaultSets: 3 },
          { id: 'weighted-dips', name: 'Weighted dips', type: 'reps+weight', defaultSets: 3 },
        ],
      },
      {
        name: 'Core',
        exercises: [
          { id: 'hollow-body-hold', name: 'Hollow body hold', type: 'duration', defaultSets: 3 },
        ],
      },
    ],
  },
  {
    slug: 'pull-fl-oahs',
    displayName: 'Pull + Front Lever + OAHS',
    blocks: [
      {
        name: 'OAHS Block',
        exercises: [
          { id: 'box-oahs-shifts', name: 'Box OAHS shoulder shifts', type: 'reps', defaultSets: 3 },
          { id: 'freestanding-oahs', name: 'Freestanding OAHS attempts', type: 'duration', defaultSets: 1 },
        ],
      },
      {
        name: 'OAP',
        exercises: [
          { id: 'assisted-oap', name: 'Assisted OAP (band/finger)', type: 'reps', defaultSets: 5 },
          { id: 'eccentric-oap', name: 'Eccentric OAP (5–8s)', type: 'duration', defaultSets: 3 },
          { id: 'top-hold', name: 'Top hold (chin above bar)', type: 'duration', defaultSets: 3 },
        ],
      },
      {
        name: 'Front Lever',
        exercises: [
          { id: 'straddle-fl-hold', name: 'Straddle FL hold', type: 'duration', defaultSets: 4 },
          { id: 'fl-raises', name: 'FL raises (tuck → straddle)', type: 'reps', defaultSets: 3 },
          { id: 'fl-scapula-pulls', name: 'FL scapula pulls', type: 'reps', defaultSets: 3 },
        ],
      },
      {
        name: 'Strength',
        exercises: [
          { id: 'weighted-pullups', name: 'Weighted pull-ups', type: 'reps+weight', defaultSets: 3 },
          { id: 'ring-rows', name: 'Ring rows', type: 'reps', defaultSets: 3 },
        ],
      },
      {
        name: 'Core',
        exercises: [
          { id: 'reverse-hyper', name: 'Reverse hyper / back extension', type: 'reps', defaultSets: 3 },
        ],
      },
    ],
  },
  {
    slug: 'oahs-hspu',
    displayName: 'OAHS + HSPU',
    blocks: [
      {
        name: 'OAHS Block',
        exercises: [
          { id: 'wall-oahs-line-drill', name: 'Wall OAHS line drill', type: 'duration', defaultSets: 3 },
          { id: 'fingertip-oahs', name: 'Fingertip OAHS', type: 'duration', defaultSets: 4 },
          { id: 'box-oahs-shifts', name: 'Box OAHS shoulder shifts', type: 'reps', defaultSets: 3 },
        ],
      },
      {
        name: 'HSPU / 90° Work',
        exercises: [
          { id: 'hspu-negatives-90', name: '90° HSPU negatives', type: 'reps', defaultSets: 4 },
          { id: 'wall-hspu', name: 'Wall HSPU', type: 'reps', defaultSets: 4 },
          { id: 'partial-90-pushups', name: 'Partial ROM 90° push-ups', type: 'reps', defaultSets: 3 },
        ],
      },
      {
        name: 'Strength',
        exercises: [
          { id: 'pike-pushups', name: 'Pike push-ups (deep)', type: 'reps', defaultSets: 3 },
        ],
      },
      {
        name: 'Core',
        exercises: [
          { id: 'dead-bug', name: 'Dead bug (slow)', type: 'reps', defaultSets: 3 },
        ],
      },
    ],
  },
  {
    slug: 'hybrid',
    displayName: 'Hybrid — Planche + Pull + Legs',
    blocks: [
      {
        name: 'OAHS Block',
        exercises: [
          { id: 'freestanding-oahs', name: 'Freestanding OAHS attempts', type: 'duration', defaultSets: 1 },
          { id: 'wall-assisted-oahs', name: 'Wall-assisted OAHS', type: 'duration', defaultSets: 2 },
        ],
      },
      {
        name: 'Planche (Light)',
        exercises: [
          { id: 'planche-lean', name: 'Planche lean', type: 'duration', defaultSets: 3 },
          { id: 'band-straddle-planche', name: 'Band straddle planche', type: 'duration', defaultSets: 3 },
        ],
      },
      {
        name: 'Muscle-Up',
        exercises: [
          { id: 'slow-negative-muscleup', name: 'Slow negative muscle-ups', type: 'reps', defaultSets: 4 },
          { id: 'transition-drills', name: 'Transition drills (low bar/rings)', type: 'reps', defaultSets: 3 },
        ],
      },
      {
        name: 'Pull',
        exercises: [
          { id: 'explosive-pullups', name: 'Explosive pull-ups', type: 'reps', defaultSets: 3 },
          { id: 'archer-pullups', name: 'Archer pull-ups', type: 'reps', defaultSets: 3 },
        ],
      },
      {
        name: 'Legs',
        exercises: [
          { id: 'bulgarian-split-squat', name: 'Bulgarian split squats', type: 'reps', defaultSets: 3 },
          { id: 'leg-press', name: 'Leg press', type: 'reps+weight', defaultSets: 3 },
          { id: 'hamstring-curls', name: 'Hamstring curls', type: 'reps+weight', defaultSets: 3 },
          { id: 'calf-raises', name: 'Standing calf raises', type: 'reps', defaultSets: 3 },
        ],
      },
      {
        name: 'Core',
        exercises: [
          { id: 'side-plank', name: 'Side plank', type: 'duration', defaultSets: 3 },
        ],
      },
    ],
  },
]

export function getSession(slug: string): SessionConfig | undefined {
  return SESSIONS.find(s => s.slug === slug)
}

export function getAllExercises(): Array<{ id: string; name: string; sessionSlug: string }> {
  const result: Array<{ id: string; name: string; sessionSlug: string }> = []
  const seen = new Set<string>()
  for (const session of SESSIONS) {
    for (const block of session.blocks) {
      for (const ex of block.exercises) {
        if (!seen.has(ex.id)) {
          seen.add(ex.id)
          result.push({ id: ex.id, name: ex.name, sessionSlug: session.slug })
        }
      }
    }
  }
  return result
}
```

- [ ] **Step 2: Commit**

```bash
git add src/config/training-plan.ts
git commit -m "feat: add hardcoded training plan config for all 4 sessions"
```

---

## Task 4: GitHub API Route

**Files:**
- Create: `src/app/api/github/route.ts`

The route handles three operations via query params:
- `GET ?action=list` → list all filenames in `logs/`
- `GET ?action=read&path=logs/filename.json` → read and decode a file
- `POST` with body `{ path, content }` → create or update a file

The GitHub token is read from `process.env.GITHUB_TOKEN`. The repo is hardcoded as `mpurer/calisthenics-logs`.

- [ ] **Step 1: Write the API route**

Create `src/app/api/github/route.ts`:
```typescript
import { NextRequest, NextResponse } from 'next/server'

const REPO = 'mpurer/calisthenics-logs'
const BASE = 'https://api.github.com'

function headers() {
  return {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const action = searchParams.get('action')

  if (action === 'list') {
    const res = await fetch(`${BASE}/repos/${REPO}/contents/logs`, { headers: headers() })
    if (res.status === 404) return NextResponse.json([])
    if (!res.ok) return NextResponse.json({ error: 'GitHub list failed' }, { status: 502 })
    const data = await res.json()
    const files = (data as Array<{ name: string; type: string }>)
      .filter(f => f.type === 'file' && f.name.endsWith('.json'))
      .map(f => f.name)
    return NextResponse.json(files)
  }

  if (action === 'read') {
    const path = searchParams.get('path')
    if (!path) return NextResponse.json({ error: 'Missing path' }, { status: 400 })
    const res = await fetch(`${BASE}/repos/${REPO}/contents/${path}`, { headers: headers() })
    if (res.status === 404) return NextResponse.json(null)
    if (!res.ok) return NextResponse.json({ error: 'GitHub read failed' }, { status: 502 })
    const data = await res.json() as { content: string; sha: string }
    const content = JSON.parse(Buffer.from(data.content, 'base64').toString('utf8'))
    return NextResponse.json({ content, sha: data.sha })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

export async function POST(req: NextRequest) {
  const { path, content } = await req.json() as { path: string; content: unknown }

  // Check if file exists to get its SHA (required for updates)
  const existing = await fetch(`${BASE}/repos/${REPO}/contents/${path}`, { headers: headers() })
  let sha: string | undefined
  if (existing.ok) {
    const data = await existing.json() as { sha: string }
    sha = data.sha
  }

  const body = {
    message: `log: ${path}`,
    content: Buffer.from(JSON.stringify(content, null, 2)).toString('base64'),
    ...(sha ? { sha } : {}),
  }

  const res = await fetch(`${BASE}/repos/${REPO}/contents/${path}`, {
    method: 'PUT',
    headers: { ...headers(), 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) return NextResponse.json({ error: 'GitHub write failed' }, { status: 502 })
  return NextResponse.json({ ok: true })
}
```

- [ ] **Step 2: Create .env.local for local dev**

Create `.env.local` (never commit this file — it should already be in .gitignore):
```
GITHUB_TOKEN=your_github_personal_access_token_here
```

To create the token: GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens → New token. Set repository access to `mpurer/calisthenics-logs`, permissions: Contents = Read and Write.

- [ ] **Step 3: Verify .env.local is gitignored**

```bash
cat .gitignore | grep env
```

Expected output should include `.env*.local`. If not, add `.env.local` to `.gitignore`.

- [ ] **Step 4: Commit (without .env.local)**

```bash
git add src/app/api/github/route.ts
git commit -m "feat: add GitHub API proxy route for log read/write"
```

---

## Task 5: Log Utility Functions + Tests

**Files:**
- Create: `src/lib/github.ts`
- Create: `src/lib/logs.ts`
- Create: `src/__tests__/logs.test.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/logs.test.ts`:
```typescript
import { parseLogFilename, getLastSessionDate, getBestValue, computeStats } from '@/lib/logs'
import type { WorkoutLog } from '@/lib/types'

const makeLog = (overrides: Partial<WorkoutLog> = {}): WorkoutLog => ({
  date: '2026-04-21',
  sessionType: 'planche-oahs',
  isDeload: false,
  rating: 4,
  exercises: [],
  ...overrides,
})

describe('parseLogFilename', () => {
  it('parses date and sessionType from filename', () => {
    expect(parseLogFilename('2026-04-21-planche-oahs.json')).toEqual({
      filename: '2026-04-21-planche-oahs.json',
      date: '2026-04-21',
      sessionType: 'planche-oahs',
    })
  })

  it('handles multi-segment session slugs', () => {
    expect(parseLogFilename('2026-04-23-pull-fl-oahs.json')).toEqual({
      filename: '2026-04-23-pull-fl-oahs.json',
      date: '2026-04-23',
      sessionType: 'pull-fl-oahs',
    })
  })
})

describe('getLastSessionDate', () => {
  const filenames = [
    '2026-04-17-planche-oahs.json',
    '2026-04-18-pull-fl-oahs.json',
    '2026-04-21-planche-oahs.json',
  ]

  it('returns the most recent date for a sessionType', () => {
    expect(getLastSessionDate(filenames, 'planche-oahs')).toBe('2026-04-21')
  })

  it('returns null if no sessions exist for that type', () => {
    expect(getLastSessionDate(filenames, 'oahs-hspu')).toBeNull()
  })
})

describe('getBestValue', () => {
  it('returns longest duration for duration exercises', () => {
    const log = makeLog({
      exercises: [{
        id: 'advanced-tuck-planche',
        name: 'Advanced tuck planche',
        sets: [{ duration: 7 }, { duration: 9 }, { duration: 8 }],
      }],
    })
    expect(getBestValue(log, 'advanced-tuck-planche', 'duration')).toBe(9)
  })

  it('returns max reps for rep exercises', () => {
    const log = makeLog({
      exercises: [{
        id: 'pseudo-planche-pushups',
        name: 'Pseudo planche push-ups',
        sets: [{ reps: 8 }, { reps: 10 }, { reps: 7 }],
      }],
    })
    expect(getBestValue(log, 'pseudo-planche-pushups', 'reps')).toBe(10)
  })

  it('returns highest weight for reps+weight exercises', () => {
    const log = makeLog({
      exercises: [{
        id: 'weighted-dips',
        name: 'Weighted dips',
        sets: [{ reps: 6, weight: 10 }, { reps: 5, weight: 12 }],
      }],
    })
    expect(getBestValue(log, 'weighted-dips', 'reps+weight')).toBe(12)
  })

  it('returns null if exercise not in log', () => {
    expect(getBestValue(makeLog(), 'nonexistent', 'reps')).toBeNull()
  })
})

describe('computeStats', () => {
  it('returns allTimeBest, changeVsPrevious, and totalSessions', () => {
    const values = [5, 7, 6, 8]
    expect(computeStats(values)).toEqual({
      allTimeBest: 8,
      changeVsPrevious: 33,  // (8 - 6) / 6 * 100, rounded
      totalSessions: 4,
    })
  })

  it('returns null changeVsPrevious with only one session', () => {
    expect(computeStats([7])).toEqual({
      allTimeBest: 7,
      changeVsPrevious: null,
      totalSessions: 1,
    })
  })

  it('returns zeroed stats for empty array', () => {
    expect(computeStats([])).toEqual({
      allTimeBest: null,
      changeVsPrevious: null,
      totalSessions: 0,
    })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test
```

Expected: All tests FAIL — functions not defined yet.

- [ ] **Step 3: Write the github client**

Create `src/lib/github.ts`:
```typescript
import type { WorkoutLog, LogFile } from '@/lib/types'
import { parseLogFilename } from '@/lib/logs'

const API = '/api/github'

export async function listLogFiles(): Promise<LogFile[]> {
  const res = await fetch(`${API}?action=list`)
  const filenames: string[] = await res.json()
  return filenames.map(parseLogFilename).sort((a, b) => b.date.localeCompare(a.date))
}

export async function readLog(filename: string): Promise<WorkoutLog | null> {
  const res = await fetch(`${API}?action=read&path=logs/${filename}`)
  const data = await res.json()
  return data?.content ?? null
}

export async function writeLog(log: WorkoutLog): Promise<void> {
  const filename = `${log.date}-${log.sessionType}.json`
  await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path: `logs/${filename}`, content: log }),
  })
}
```

- [ ] **Step 4: Write the log utility functions**

Create `src/lib/logs.ts`:
```typescript
import type { WorkoutLog, LogFile, ExerciseType } from '@/lib/types'

export function parseLogFilename(filename: string): LogFile {
  // filename: "2026-04-21-planche-oahs.json"
  const withoutExt = filename.replace('.json', '')
  const date = withoutExt.slice(0, 10)             // "2026-04-21"
  const sessionType = withoutExt.slice(11)          // "planche-oahs"
  return { filename, date, sessionType }
}

export function getLastSessionDate(filenames: string[], sessionType: string): string | null {
  const matches = filenames
    .map(parseLogFilename)
    .filter(f => f.sessionType === sessionType)
    .sort((a, b) => b.date.localeCompare(a.date))
  return matches[0]?.date ?? null
}

export function getBestValue(
  log: WorkoutLog,
  exerciseId: string,
  type: ExerciseType,
): number | null {
  const ex = log.exercises.find(e => e.id === exerciseId)
  if (!ex || ex.sets.length === 0) return null

  if (type === 'duration') {
    const values = ex.sets.map(s => s.duration ?? 0)
    return Math.max(...values)
  }
  if (type === 'reps') {
    const values = ex.sets.map(s => s.reps ?? 0)
    return Math.max(...values)
  }
  if (type === 'reps+weight') {
    const values = ex.sets.map(s => s.weight ?? 0)
    return Math.max(...values)
  }
  return null
}

export function computeStats(values: number[]): {
  allTimeBest: number | null
  changeVsPrevious: number | null
  totalSessions: number
} {
  if (values.length === 0) return { allTimeBest: null, changeVsPrevious: null, totalSessions: 0 }

  const allTimeBest = Math.max(...values)
  const totalSessions = values.length

  let changeVsPrevious: number | null = null
  if (values.length >= 2) {
    const last = values[values.length - 1]
    const prev = values[values.length - 2]
    if (prev !== 0) {
      changeVsPrevious = Math.round(((last - prev) / prev) * 100)
    }
  }

  return { allTimeBest, changeVsPrevious, totalSessions }
}
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
npm test
```

Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/lib/types.ts src/lib/github.ts src/lib/logs.ts src/__tests__/logs.test.ts
git commit -m "feat: add log utility functions and GitHub client with tests"
```

---

## Task 6: Home Page

**Files:**
- Create: `src/components/DeloadToggle.tsx`
- Create: `src/components/SessionCard.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Write DeloadToggle component**

Create `src/components/DeloadToggle.tsx`:
```tsx
'use client'

import { useEffect, useState } from 'react'

const KEY = 'deload-week'

export function DeloadToggle() {
  const [isDeload, setIsDeload] = useState(false)

  useEffect(() => {
    setIsDeload(localStorage.getItem(KEY) === 'true')
  }, [])

  function toggle() {
    const next = !isDeload
    setIsDeload(next)
    localStorage.setItem(KEY, String(next))
  }

  return (
    <button
      onClick={toggle}
      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-sm transition-colors ${
        isDeload
          ? 'bg-purple-950 border border-purple-700 text-purple-200'
          : 'bg-slate-800 text-slate-400'
      }`}
    >
      <span>Deload week</span>
      <div className={`w-10 h-6 rounded-full relative transition-colors ${isDeload ? 'bg-purple-600' : 'bg-slate-600'}`}>
        <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${isDeload ? 'right-0.5' : 'left-0.5'}`} />
      </div>
    </button>
  )
}

export function useIsDeload(): boolean {
  const [isDeload, setIsDeload] = useState(false)
  useEffect(() => {
    setIsDeload(localStorage.getItem(KEY) === 'true')
  }, [])
  return isDeload
}
```

- [ ] **Step 2: Write SessionCard component**

Create `src/components/SessionCard.tsx`:
```tsx
import Link from 'next/link'

interface Props {
  slug: string
  displayName: string
  lastDoneDate: string | null
  isDeload: boolean
}

export function SessionCard({ slug, displayName, lastDoneDate, isDeload }: Props) {
  const formattedDate = lastDoneDate
    ? new Date(lastDoneDate + 'T00:00:00').toLocaleDateString('en-GB', {
        day: 'numeric', month: 'short'
      })
    : 'Never'

  return (
    <Link
      href={`/log/${slug}`}
      className={`block w-full text-left px-4 py-4 rounded-xl transition-colors ${
        isDeload
          ? 'bg-purple-950 border border-purple-800 hover:border-purple-600'
          : 'bg-slate-800 hover:bg-slate-700'
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-semibold text-slate-100">{displayName}</span>
        {isDeload && (
          <span className="text-xs bg-purple-700 text-purple-100 px-2 py-0.5 rounded-md">DELOAD</span>
        )}
      </div>
      <div className="text-xs text-slate-500 mt-1">Last done: {formattedDate}</div>
    </Link>
  )
}
```

- [ ] **Step 3: Write the Home page**

Replace `src/app/page.tsx`:
```tsx
import Link from 'next/link'
import { SESSIONS } from '@/config/training-plan'
import { listLogFiles } from '@/lib/github'
import { getLastSessionDate } from '@/lib/logs'
import { DeloadToggle } from '@/components/DeloadToggle'
import { SessionCard } from '@/components/SessionCard'

export const dynamic = 'force-dynamic'

export default async function Home() {
  let logFiles: Awaited<ReturnType<typeof listLogFiles>> = []
  try {
    logFiles = await listLogFiles()
  } catch {
    // GitHub not yet set up — show sessions without last-done dates
  }

  const filenames = logFiles.map(f => f.filename)
  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  })

  return (
    <main className="max-w-md mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Training</h1>
        <p className="text-sm text-slate-500 mt-1">{today}</p>
      </div>

      <div className="mb-4">
        <DeloadToggle />
      </div>

      <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">What are you training today?</p>

      <div className="flex flex-col gap-3">
        {SESSIONS.map(session => (
          <SessionCard
            key={session.slug}
            slug={session.slug}
            displayName={session.displayName}
            lastDoneDate={getLastSessionDate(filenames, session.slug)}
            isDeload={false}
          />
        ))}
      </div>

      <div className="mt-8 text-center">
        <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
          📊 Progress Dashboard
        </Link>
      </div>
    </main>
  )
}
```

Note: `isDeload` on `SessionCard` is hardcoded `false` here — it becomes dynamic in Task 7.

- [ ] **Step 4: Run dev server and verify home page renders**

```bash
npm run dev
```

Open `http://localhost:3000`. Expected: 4 session cards visible, date shown, deload toggle present. Cards show "Last done: Never" (GitHub not configured yet is fine). Stop with Ctrl+C.

- [ ] **Step 5: Commit**

```bash
git add src/components/DeloadToggle.tsx src/components/SessionCard.tsx src/app/page.tsx
git commit -m "feat: home page with session cards and deload toggle"
```

---

## Task 7: Wire Deload State to Session Cards

The deload toggle is client-side (localStorage) but the session cards are server-rendered. Convert the session list to a client component that reads the deload state.

**Files:**
- Create: `src/components/SessionList.tsx`
- Modify: `src/app/page.tsx`

- [ ] **Step 1: Create SessionList client component**

Create `src/components/SessionList.tsx`:
```tsx
'use client'

import { SESSIONS } from '@/config/training-plan'
import { SessionCard } from '@/components/SessionCard'
import { useIsDeload } from '@/components/DeloadToggle'
import type { LogFile } from '@/lib/types'
import { getLastSessionDate } from '@/lib/logs'

interface Props {
  logFiles: LogFile[]
}

export function SessionList({ logFiles }: Props) {
  const isDeload = useIsDeload()
  const filenames = logFiles.map(f => f.filename)

  return (
    <div className="flex flex-col gap-3">
      {SESSIONS.map(session => (
        <SessionCard
          key={session.slug}
          slug={session.slug}
          displayName={session.displayName}
          lastDoneDate={getLastSessionDate(filenames, session.slug)}
          isDeload={isDeload}
        />
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Update Home page to use SessionList**

Replace the session list section in `src/app/page.tsx`:
```tsx
import Link from 'next/link'
import { listLogFiles } from '@/lib/github'
import { DeloadToggle } from '@/components/DeloadToggle'
import { SessionList } from '@/components/SessionList'

export const dynamic = 'force-dynamic'

export default async function Home() {
  let logFiles: Awaited<ReturnType<typeof listLogFiles>> = []
  try {
    logFiles = await listLogFiles()
  } catch {
    // GitHub not yet configured
  }

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric'
  })

  return (
    <main className="max-w-md mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Training</h1>
        <p className="text-sm text-slate-500 mt-1">{today}</p>
      </div>

      <div className="mb-4">
        <DeloadToggle />
      </div>

      <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">What are you training today?</p>

      <SessionList logFiles={logFiles} />

      <div className="mt-8 text-center">
        <Link href="/dashboard" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
          📊 Progress Dashboard
        </Link>
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Verify deload toggle changes card colors**

```bash
npm run dev
```

Open `http://localhost:3000`. Toggle the deload switch — cards should turn purple. Toggle off — back to slate. Stop with Ctrl+C.

- [ ] **Step 4: Commit**

```bash
git add src/components/SessionList.tsx src/app/page.tsx
git commit -m "feat: wire deload state to session cards via client component"
```

---

## Task 8: SetRow Component

**Files:**
- Create: `src/components/SetRow.tsx`

- [ ] **Step 1: Write SetRow**

Create `src/components/SetRow.tsx`:
```tsx
'use client'

import type { SetLog, ExerciseType } from '@/lib/types'

interface Props {
  index: number
  set: SetLog
  type: ExerciseType
  onChange: (index: number, updated: SetLog) => void
  onDelete: (index: number) => void
}

export function SetRow({ index, set, type, onChange, onDelete }: Props) {
  function update(field: keyof SetLog, raw: string) {
    const value = raw === '' ? null : Number(raw)
    onChange(index, { ...set, [field]: isNaN(value as number) ? null : value })
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-slate-500 w-10 shrink-0">Set {index + 1}</span>

      {(type === 'duration') && (
        <input
          inputMode="decimal"
          placeholder="s"
          value={set.duration ?? ''}
          onChange={e => update('duration', e.target.value)}
          className="w-16 bg-slate-900 border border-indigo-600 rounded-lg px-2 py-2 text-sm text-center text-slate-100 focus:outline-none focus:border-indigo-400"
        />
      )}

      {(type === 'reps' || type === 'reps+weight') && (
        <input
          inputMode="numeric"
          placeholder="reps"
          value={set.reps ?? ''}
          onChange={e => update('reps', e.target.value)}
          className="w-16 bg-slate-900 border border-indigo-600 rounded-lg px-2 py-2 text-sm text-center text-slate-100 focus:outline-none focus:border-indigo-400"
        />
      )}

      {type === 'reps+weight' && (
        <input
          inputMode="decimal"
          placeholder="kg"
          value={set.weight ?? ''}
          onChange={e => update('weight', e.target.value)}
          className="w-16 bg-slate-900 border border-indigo-600 rounded-lg px-2 py-2 text-sm text-center text-slate-100 focus:outline-none focus:border-indigo-400"
        />
      )}

      <button
        onClick={() => onDelete(index)}
        className="text-red-500 hover:text-red-400 text-lg leading-none px-1"
        aria-label="Delete set"
      >
        ×
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/SetRow.tsx
git commit -m "feat: SetRow component for reps/duration/weight input"
```

---

## Task 9: ExerciseLogger Component

**Files:**
- Create: `src/components/ExerciseLogger.tsx`

- [ ] **Step 1: Write ExerciseLogger**

Create `src/components/ExerciseLogger.tsx`:
```tsx
'use client'

import type { ExerciseConfig, ExerciseLog, SetLog } from '@/lib/types'
import { SetRow } from '@/components/SetRow'

interface Props {
  config: ExerciseConfig
  value: ExerciseLog
  onChange: (updated: ExerciseLog) => void
  prefillDate: string | null
}

function emptySet(type: ExerciseConfig['type']): SetLog {
  return {
    duration: type === 'duration' ? null : undefined,
    reps: (type === 'reps' || type === 'reps+weight') ? null : undefined,
    weight: type === 'reps+weight' ? null : undefined,
  }
}

export function ExerciseLogger({ config, value, onChange, prefillDate }: Props) {
  function handleSetChange(index: number, updated: SetLog) {
    const sets = value.sets.map((s, i) => (i === index ? updated : s))
    onChange({ ...value, sets })
  }

  function addSet() {
    onChange({ ...value, sets: [...value.sets, emptySet(config.type)] })
  }

  function deleteSet(index: number) {
    onChange({ ...value, sets: value.sets.filter((_, i) => i !== index) })
  }

  return (
    <div className="bg-slate-800 rounded-xl p-4">
      <div className="font-semibold text-slate-100 mb-1">{config.name}</div>
      {prefillDate && (
        <div className="text-xs text-slate-500 mb-3">⟳ Pre-filled from {prefillDate}</div>
      )}
      <div className="flex flex-col gap-2">
        {value.sets.map((set, i) => (
          <SetRow
            key={i}
            index={i}
            set={set}
            type={config.type}
            onChange={handleSetChange}
            onDelete={deleteSet}
          />
        ))}
        <button
          onClick={addSet}
          className="text-xs text-slate-400 hover:text-slate-200 bg-slate-700 hover:bg-slate-600 rounded-lg px-3 py-1.5 w-fit mt-1 transition-colors"
        >
          + add set
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/ExerciseLogger.tsx
git commit -m "feat: ExerciseLogger with add/delete sets and pre-fill display"
```

---

## Task 10: StarRating Component

**Files:**
- Create: `src/components/StarRating.tsx`

- [ ] **Step 1: Write StarRating**

Create `src/components/StarRating.tsx`:
```tsx
'use client'

interface Props {
  value: number
  onChange: (rating: number) => void
}

export function StarRating({ value, onChange }: Props) {
  return (
    <div className="bg-slate-800 rounded-xl p-4 text-center">
      <div className="text-xs text-slate-400 mb-2">How did the session feel?</div>
      <div className="flex justify-center gap-2">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => onChange(star)}
            className={`text-3xl transition-transform active:scale-90 ${
              star <= value ? 'text-yellow-400' : 'text-slate-600'
            }`}
          >
            ★
          </button>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/StarRating.tsx
git commit -m "feat: StarRating component"
```

---

## Task 11: Log Workout Page

**Files:**
- Create: `src/app/log/[sessionType]/page.tsx`
- Create: `src/app/log/[sessionType]/LogWorkoutClient.tsx`

The page is split: the server component fetches the last session log, the client component handles all state and saving.

- [ ] **Step 1: Write the client component**

Create `src/app/log/[sessionType]/LogWorkoutClient.tsx`:
```tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import type { SessionConfig, WorkoutLog, ExerciseLog, SetLog } from '@/lib/types'
import { ExerciseLogger } from '@/components/ExerciseLogger'
import { StarRating } from '@/components/StarRating'
import { writeLog } from '@/lib/github'

function buildInitialExercises(session: SessionConfig, lastLog: WorkoutLog | null): ExerciseLog[] {
  return session.blocks.flatMap(block =>
    block.exercises.map(ex => {
      const previous = lastLog?.exercises.find(e => e.id === ex.id)
      if (previous && previous.sets.length > 0) {
        return { id: ex.id, name: ex.name, sets: previous.sets }
      }
      // No previous data — create empty sets based on defaultSets
      const emptySet = (): SetLog => ({
        duration: ex.type === 'duration' ? null : undefined,
        reps: (ex.type === 'reps' || ex.type === 'reps+weight') ? null : undefined,
        weight: ex.type === 'reps+weight' ? null : undefined,
      })
      return { id: ex.id, name: ex.name, sets: Array.from({ length: ex.defaultSets }, emptySet) }
    })
  )
}

interface Props {
  session: SessionConfig
  lastLog: WorkoutLog | null
  lastLogDate: string | null
  isDeload: boolean
}

export function LogWorkoutClient({ session, lastLog, lastLogDate, isDeload }: Props) {
  const router = useRouter()
  const [exercises, setExercises] = useState<ExerciseLog[]>(() =>
    buildInitialExercises(session, lastLog)
  )
  const [rating, setRating] = useState(3)
  const [saving, setSaving] = useState(false)

  function updateExercise(id: string, updated: ExerciseLog) {
    setExercises(prev => prev.map(e => (e.id === id ? updated : e)))
  }

  async function save() {
    setSaving(true)
    const today = new Date().toISOString().slice(0, 10)
    const log: WorkoutLog = {
      date: today,
      sessionType: session.slug,
      isDeload,
      rating,
      exercises,
    }
    await writeLog(log)
    setSaving(false)
    router.push('/')
  }

  return (
    <main className="max-w-md mx-auto px-4 py-8">
      <div className="mb-6">
        <a href="/" className="text-sm text-slate-500 hover:text-slate-300">← Back</a>
        <h1 className="text-xl font-bold text-slate-100 mt-2">{session.displayName}</h1>
        <p className="text-sm text-slate-500">
          {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
          {isDeload && <span className="ml-2 text-xs bg-purple-700 text-purple-100 px-2 py-0.5 rounded">DELOAD</span>}
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {session.blocks.map(block => (
          <div key={block.name}>
            <h2 className="text-xs text-slate-500 uppercase tracking-wider mb-2">{block.name}</h2>
            <div className="flex flex-col gap-3">
              {block.exercises.map(ex => {
                const exerciseLog = exercises.find(e => e.id === ex.id)!
                return (
                  <ExerciseLogger
                    key={ex.id}
                    config={ex}
                    value={exerciseLog}
                    onChange={updated => updateExercise(ex.id, updated)}
                    prefillDate={lastLog?.exercises.some(e => e.id === ex.id) ? lastLogDate : null}
                  />
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <StarRating value={rating} onChange={setRating} />
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="mt-4 w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-4 rounded-xl transition-colors"
      >
        {saving ? 'Saving...' : 'Save Workout'}
      </button>
    </main>
  )
}
```

- [ ] **Step 2: Write the server page**

Create `src/app/log/[sessionType]/page.tsx`:
```tsx
import { notFound } from 'next/navigation'
import { getSession } from '@/config/training-plan'
import { listLogFiles, readLog } from '@/lib/github'
import { getLastSessionDate } from '@/lib/logs'
import { LogWorkoutClient } from './LogWorkoutClient'

export const dynamic = 'force-dynamic'

interface Props {
  params: { sessionType: string }
}

export default async function LogWorkoutPage({ params }: Props) {
  const session = getSession(params.sessionType)
  if (!session) notFound()

  let lastLog = null
  let lastLogDate = null

  try {
    const logFiles = await listLogFiles()
    const filenames = logFiles.map(f => f.filename)
    lastLogDate = getLastSessionDate(filenames, params.sessionType)
    if (lastLogDate) {
      const filename = `${lastLogDate}-${params.sessionType}.json`
      const data = await readLog(filename)
      lastLog = data
    }
  } catch {
    // GitHub not yet configured — proceed with empty log
  }

  // Read deload from cookie (set by client) — not available server-side here
  // isDeload is passed as false; LogWorkoutClient reads localStorage on mount
  return (
    <LogWorkoutClient
      session={session}
      lastLog={lastLog}
      lastLogDate={lastLogDate}
      isDeload={false}
    />
  )
}
```

- [ ] **Step 3: Update LogWorkoutClient to read deload from localStorage**

Add `useIsDeload` to `LogWorkoutClient` so it overrides the server-passed `false`:

Replace the `Props` interface and component start in `LogWorkoutClient.tsx`:
```tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import type { SessionConfig, WorkoutLog, ExerciseLog, SetLog } from '@/lib/types'
import { ExerciseLogger } from '@/components/ExerciseLogger'
import { StarRating } from '@/components/StarRating'
import { writeLog } from '@/lib/github'

// ... keep buildInitialExercises unchanged ...

interface Props {
  session: SessionConfig
  lastLog: WorkoutLog | null
  lastLogDate: string | null
}

export function LogWorkoutClient({ session, lastLog, lastLogDate }: Props) {
  const router = useRouter()
  const [exercises, setExercises] = useState<ExerciseLog[]>(() =>
    buildInitialExercises(session, lastLog)
  )
  const [rating, setRating] = useState(3)
  const [saving, setSaving] = useState(false)
  const [isDeload, setIsDeload] = useState(false)

  useEffect(() => {
    setIsDeload(localStorage.getItem('deload-week') === 'true')
  }, [])

  // ... rest of the component unchanged, remove isDeload from Props usage ...
```

Also update the server page to not pass `isDeload`:
```tsx
<LogWorkoutClient
  session={session}
  lastLog={lastLog}
  lastLogDate={lastLogDate}
/>
```

- [ ] **Step 4: Run dev server and test log page**

```bash
npm run dev
```

Open `http://localhost:3000`, click a session. Expected: Exercise cards appear grouped by block, empty inputs with default set count. Star rating visible. Save button visible. Stop with Ctrl+C.

- [ ] **Step 5: Commit**

```bash
git add src/app/log/
git commit -m "feat: log workout page with pre-filled exercises, add/delete sets, and save"
```

---

## Task 12: Progress Dashboard

**Files:**
- Create: `src/components/ProgressChart.tsx`
- Create: `src/app/dashboard/page.tsx`
- Create: `src/app/dashboard/DashboardClient.tsx`

- [ ] **Step 1: Write ProgressChart**

Create `src/components/ProgressChart.tsx`:
```tsx
'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Scatter, ScatterChart
} from 'recharts'

export interface ChartPoint {
  date: string
  value: number
  isDeload: boolean
}

interface Props {
  data: ChartPoint[]
  yLabel: string
}

function CustomDot(props: { cx?: number; cy?: number; payload?: ChartPoint }) {
  const { cx, cy, payload } = props
  if (!cx || !cy || !payload) return null
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill={payload.isDeload ? '#7c3aed' : '#4f46e5'}
      stroke="none"
    />
  )
}

export function ProgressChart({ data, yLabel }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-slate-500 text-sm">
        No data yet
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
        <XAxis
          dataKey="date"
          tick={{ fill: '#64748b', fontSize: 10 }}
          tickFormatter={d => d.slice(5)} // show MM-DD
        />
        <YAxis
          tick={{ fill: '#64748b', fontSize: 10 }}
          label={{ value: yLabel, angle: -90, position: 'insideLeft', fill: '#64748b', fontSize: 10 }}
        />
        <Tooltip
          contentStyle={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8 }}
          labelStyle={{ color: '#94a3b8', fontSize: 11 }}
          itemStyle={{ color: '#e2e8f0' }}
        />
        <Line
          type="monotone"
          dataKey="value"
          stroke="#4f46e5"
          strokeWidth={2}
          dot={<CustomDot />}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

- [ ] **Step 2: Write DashboardClient**

Create `src/app/dashboard/DashboardClient.tsx`:
```tsx
'use client'

import { useState } from 'react'
import type { WorkoutLog, ExerciseType } from '@/lib/types'
import { getAllExercises } from '@/config/training-plan'
import { getBestValue, computeStats } from '@/lib/logs'
import { ProgressChart, ChartPoint } from '@/components/ProgressChart'

interface LogEntry {
  log: WorkoutLog
  exerciseType: ExerciseType
}

interface Props {
  logs: WorkoutLog[]
}

const allExercises = getAllExercises()

// Map exercise id → type by looking at training plan config
import { SESSIONS } from '@/config/training-plan'
function getExerciseType(exerciseId: string): ExerciseType {
  for (const session of SESSIONS) {
    for (const block of session.blocks) {
      const ex = block.exercises.find(e => e.id === exerciseId)
      if (ex) return ex.type
    }
  }
  return 'reps'
}

export function DashboardClient({ logs }: Props) {
  const [selectedId, setSelectedId] = useState(allExercises[0]?.id ?? '')

  const type = getExerciseType(selectedId)

  const points: ChartPoint[] = logs
    .map(log => {
      const value = getBestValue(log, selectedId, type)
      if (value === null) return null
      return { date: log.date, value, isDeload: log.isDeload }
    })
    .filter((p): p is ChartPoint => p !== null)
    .sort((a, b) => a.date.localeCompare(b.date))

  const values = points.map(p => p.value)
  const stats = computeStats(values)

  const yLabel = type === 'duration' ? 's' : type === 'reps+weight' ? 'kg' : 'reps'

  return (
    <main className="max-w-md mx-auto px-4 py-8">
      <div className="mb-6">
        <a href="/" className="text-sm text-slate-500 hover:text-slate-300">← Back</a>
        <h1 className="text-xl font-bold text-slate-100 mt-2">Progress</h1>
      </div>

      <select
        value={selectedId}
        onChange={e => setSelectedId(e.target.value)}
        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-3 text-sm text-slate-100 mb-4 focus:outline-none focus:border-indigo-500"
      >
        {allExercises.map(ex => (
          <option key={ex.id} value={ex.id}>{ex.name}</option>
        ))}
      </select>

      <div className="bg-slate-800 rounded-xl p-4 mb-4">
        <ProgressChart data={points} yLabel={yLabel} />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-slate-800 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-indigo-400">
            {stats.allTimeBest !== null ? `${stats.allTimeBest}${yLabel}` : '—'}
          </div>
          <div className="text-xs text-slate-500 mt-1">All-time best</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-3 text-center">
          <div className={`text-xl font-bold ${
            stats.changeVsPrevious === null ? 'text-slate-500' :
            stats.changeVsPrevious >= 0 ? 'text-green-400' : 'text-red-400'
          }`}>
            {stats.changeVsPrevious !== null ? `${stats.changeVsPrevious > 0 ? '+' : ''}${stats.changeVsPrevious}%` : '—'}
          </div>
          <div className="text-xs text-slate-500 mt-1">vs prev session</div>
        </div>
        <div className="bg-slate-800 rounded-xl p-3 text-center">
          <div className="text-xl font-bold text-slate-200">{stats.totalSessions}</div>
          <div className="text-xs text-slate-500 mt-1">Sessions</div>
        </div>
      </div>

      <div className="flex items-center gap-3 text-xs text-slate-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-indigo-600 inline-block"></span> Normal</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-purple-600 inline-block"></span> Deload</span>
      </div>
    </main>
  )
}
```

- [ ] **Step 3: Write the dashboard server page**

Create `src/app/dashboard/page.tsx`:
```tsx
import { listLogFiles, readLog } from '@/lib/github'
import type { WorkoutLog } from '@/lib/types'
import { DashboardClient } from './DashboardClient'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  let logs: WorkoutLog[] = []

  try {
    const logFiles = await listLogFiles()
    const results = await Promise.all(logFiles.map(f => readLog(f.filename)))
    logs = results.filter((l): l is WorkoutLog => l !== null)
  } catch {
    // GitHub not configured
  }

  return <DashboardClient logs={logs} />
}
```

- [ ] **Step 4: Run dev server and test dashboard**

```bash
npm run dev
```

Open `http://localhost:3000/dashboard`. Expected: Exercise selector dropdown, empty chart with "No data yet", stat cards showing `—`. Stop with Ctrl+C.

- [ ] **Step 5: Commit**

```bash
git add src/components/ProgressChart.tsx src/app/dashboard/
git commit -m "feat: progress dashboard with exercise selector, chart, and stats"
```

---

## Task 13: Vercel Deployment

**Files:**
- Create: `vercel.json` (optional, only if needed)

- [ ] **Step 1: Create the calisthenics-logs GitHub repo**

Go to `https://github.com/new` and create a **private** repo named `calisthenics-logs`. No README needed. Keep it empty.

- [ ] **Step 2: Create the GitHub personal access token**

Go to GitHub → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token:
- Token name: `calisthenics-tracker`
- Repository access: Only `mpurer/calisthenics-logs`
- Permissions: Repository permissions → Contents → Read and Write
- Expiration: No expiration (or 1 year)

Copy the token — you'll need it in the next step.

- [ ] **Step 3: Create the app repo and push**

Go to `https://github.com/new` and create a **public** repo named `calisthenics-tracker`. Then:

```bash
git remote add origin https://github.com/mpurer/calisthenics-tracker.git
git push -u origin main
```

- [ ] **Step 4: Deploy to Vercel**

Go to `https://vercel.com/new`, import `mpurer/calisthenics-tracker`. Accept defaults (Next.js auto-detected). Before clicking Deploy, add the environment variable:

- Name: `GITHUB_TOKEN`
- Value: (the token from Step 2)

Click Deploy. Wait for build to complete.

- [ ] **Step 5: Verify the live app**

Open the Vercel URL. Expected: Home page loads with 4 session cards. Click a session, fill in one exercise, save. Check that `https://github.com/mpurer/calisthenics-logs/tree/main/logs` shows the new JSON file. Open the dashboard — the logged exercise should appear in the chart.

- [ ] **Step 6: Add .env.local reminder to README**

Create `README.md`:
```markdown
# Calisthenics Tracker

Mobile-first web app for logging and tracking a 12-week calisthenics training plan.

## Stack
Next.js 14 · TypeScript · Tailwind CSS · Recharts · GitHub API · Vercel

## Local Development

1. Clone the repo
2. `npm install`
3. Create `.env.local`:
   ```
   GITHUB_TOKEN=your_github_fine_grained_token
   ```
   Token needs Contents read+write on `mpurer/calisthenics-logs`.
4. `npm run dev`

## Running Tests
```bash
npm test
```
```

```bash
git add README.md
git commit -m "docs: add README with setup instructions"
git push
```

---

## Self-Review Checklist

**Spec coverage:**
- ✅ Home page: deload toggle, 4 named session cards, last done date, link to dashboard
- ✅ Log workout: exercises per block, pre-filled from last session, add/delete sets, reps/duration/weight per type, star rating, save to GitHub
- ✅ GitHub API proxy: list, read, write — token server-side only
- ✅ Progress dashboard: exercise selector, line chart, deload distinction (purple dots), stats row
- ✅ Data model: all fields present (`date`, `sessionType`, `isDeload`, `rating`, `exercises`)
- ✅ Training plan: all 4 sessions, all exercises from plan, correct types

**Type consistency check:**
- `ExerciseType` used consistently across `types.ts`, `training-plan.ts`, `SetRow`, `ExerciseLogger`, `logs.ts` ✅
- `WorkoutLog`, `ExerciseLog`, `SetLog` flow from `logs.ts` → `github.ts` → page components ✅
- `SessionConfig.slug` matches URL param `sessionType` ✅
- `getBestValue(log, id, type)` signature matches usage in `DashboardClient` ✅
- `computeStats(values)` returns `{ allTimeBest, changeVsPrevious, totalSessions }` — matches dashboard usage ✅
