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
