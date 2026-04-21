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
