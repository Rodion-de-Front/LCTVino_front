import type { AuthUser, CellarWine, Comment, Post, Preferences, Review, User, Wine } from '@/types'
import { posts as seedPosts, reviews as seedReviews, users as seedUsers, wines } from './data'

const STORAGE_KEY = 'vinora:db:v1'

interface Account {
  id: string
  email: string
  password: string
}

interface DbShape {
  users: User[]
  posts: Post[]
  reviews: Review[]
  cellar: CellarWine[]
  accounts: Account[]
  profiles: Record<string, { onboarded: boolean; preferences: Preferences | null }>
  sessions: Record<string, string>
  seq: number
}

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T

function seed(): DbShape {
  const demoId = 'u1'
  return {
    users: clone(seedUsers),
    posts: clone(seedPosts),
    reviews: clone(seedReviews),
    cellar: [
      { id: 'cw1', wineId: 'w1', favorite: true, rating: 5, note: 'Лучшее из Крыма.', addedAt: new Date(Date.now() - 8 * 86_400_000).toISOString() },
      { id: 'cw2', wineId: 'w3', favorite: true, rating: 5, note: 'Особый случай.', addedAt: new Date(Date.now() - 20 * 86_400_000).toISOString() },
      { id: 'cw3', wineId: 'w12', favorite: false, rating: 4, note: 'Держу на праздники.', addedAt: new Date(Date.now() - 32 * 86_400_000).toISOString() },
      { id: 'cw4', wineId: 'w6', favorite: true, rating: null, note: '', addedAt: new Date(Date.now() - 4 * 86_400_000).toISOString() },
      { id: 'cw5', wineId: 'w9', favorite: false, rating: 4, note: 'Летний фаворит.', addedAt: new Date(Date.now() - 12 * 86_400_000).toISOString() },
      { id: 'cw6', wineId: 'w2', favorite: false, rating: null, note: '', addedAt: new Date(Date.now() - 2 * 86_400_000).toISOString() },
    ].map((c) => ({ ...c })) as CellarWine[],
    accounts: [{ id: demoId, email: 'anna@vinora.ru', password: 'vinora2026' }],
    profiles: {
      [demoId]: {
        onboarded: true,
        preferences: {
          wineType: 'red',
          sweetness: 'dry',
          body: 'full',
          tannins: 'high',
          acidity: 'medium',
          grapes: ['Каберне Совиньон', 'Пино Нуар'],
          regions: ['Крым', 'Франция'],
        },
      },
    },
    sessions: {},
    seq: 100,
  }
}

function load(): DbShape {
  if (typeof localStorage === 'undefined') return seed()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) return JSON.parse(raw) as DbShape
  } catch {
    /* corrupted storage — fall back to a fresh seed */
  }
  const fresh = seed()
  persist(fresh)
  return fresh
}

function persist(next: DbShape = db) {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  } catch {
    /* quota exceeded — the mock keeps working from memory */
  }
}

export const db: DbShape = load()
export const save = () => persist()

export const nextId = (prefix: string) => `${prefix}${++db.seq}`

export const findWine = (id: string): Wine | undefined => wines.find((w) => w.id === id)
export const allWines = (): Wine[] => wines

export function userBrief(id: string) {
  const u = db.users.find((x) => x.id === id) ?? db.users[0]
  return { id: u.id, name: u.name, avatar: u.avatar }
}

export function toAuthUser(id: string): AuthUser | null {
  const user = db.users.find((u) => u.id === id)
  if (!user) return null
  const account = db.accounts.find((a) => a.id === id)
  const profile = db.profiles[id] ?? { onboarded: false, preferences: null }
  return {
    ...user,
    email: account?.email ?? user.email ?? `${id}@vinora.ru`,
    onboarded: profile.onboarded,
    preferences: profile.preferences,
  }
}

export function userIdFromToken(token: string | null): string | null {
  if (!token) return null
  return db.sessions[token.replace(/^Bearer\s+/i, '')] ?? null
}

export function issueToken(userId: string): string {
  // A JWT-shaped string so the client can treat it like a real bearer token.
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = btoa(JSON.stringify({ sub: userId, iat: Date.now(), iss: 'vinora-mock' }))
  const token = `${header}.${payload}.${Math.random().toString(36).slice(2, 18)}`
  db.sessions[token] = userId
  save()
  return token
}

export function cellarWithWines(): CellarWine[] {
  return db.cellar
    .map((entry) => {
      const wine = findWine(entry.wineId)
      return wine ? { ...entry, wine } : null
    })
    .filter((x): x is CellarWine => x !== null)
    .sort((a, b) => +new Date(b.addedAt) - +new Date(a.addedAt))
}

export function addComment(postId: string, authorId: string, text: string): Comment | null {
  const post = db.posts.find((p) => p.id === postId)
  if (!post) return null
  const comment: Comment = {
    id: nextId('c'),
    postId,
    author: userBrief(authorId),
    text,
    createdAt: new Date().toISOString(),
  }
  post.comments.push(comment)
  post.commentsCount = post.comments.length
  save()
  return comment
}

export function resetDb() {
  const fresh = seed()
  Object.assign(db, fresh)
  persist(fresh)
}
