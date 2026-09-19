import { HttpResponse, delay, http } from 'msw'
import type {
  CatalogSort,
  CellarWine,
  Paginated,
  Post,
  Preferences,
  ScanResult,
  Wine,
} from '@/types'
import {
  addComment,
  allWines,
  cellarWithWines,
  db,
  findWine,
  issueToken,
  nextId,
  save,
  toAuthUser,
  userBrief,
  userIdFromToken,
} from './db'

const LATENCY = [180, 420] as const
const lag = () => delay(LATENCY[0] + Math.random() * (LATENCY[1] - LATENCY[0]))

const unauthorized = () =>
  HttpResponse.json({ message: 'Требуется авторизация' }, { status: 401 })

function currentUserId(request: Request): string | null {
  return userIdFromToken(request.headers.get('Authorization'))
}

function paginate<T>(items: T[], page: number, perPage: number): Paginated<T> {
  const start = (page - 1) * perPage
  const slice = items.slice(start, start + perPage)
  return {
    items: slice,
    page,
    perPage,
    total: items.length,
    hasMore: start + perPage < items.length,
  }
}

// Wine artwork ships as a portrait card crop plus a landscape twin for the feed.
const wideCrop = (src: string | undefined) => src?.replace(/\.webp$/, '-wide.webp')

const num = (v: string | null, fallback: number) => {
  const n = Number(v)
  return Number.isFinite(n) && v !== null && v !== '' ? n : fallback
}

const sorters: Record<CatalogSort, (a: Wine, b: Wine) => number> = {
  rating: (a, b) => b.rating - a.rating,
  'price-asc': (a, b) => a.price - b.price,
  'price-desc': (a, b) => b.price - a.price,
  newest: (a, b) => b.year - a.year,
  name: (a, b) => a.name.localeCompare(b.name, 'ru'),
}

export const handlers = [
  // ------------------------------------------------------------------ auth
  http.post('/api/auth/login', async ({ request }) => {
    await lag()
    const { email, password } = (await request.json()) as { email: string; password: string }
    const account = db.accounts.find(
      (a) => a.email.toLowerCase() === String(email).trim().toLowerCase(),
    )
    if (!account || account.password !== password) {
      return HttpResponse.json({ message: 'Неверный email или пароль' }, { status: 401 })
    }
    return HttpResponse.json({ token: issueToken(account.id), user: toAuthUser(account.id) })
  }),

  http.post('/api/auth/register', async ({ request }) => {
    await lag()
    const { email, password, name } = (await request.json()) as {
      email: string
      password: string
      name: string
    }
    const normalized = String(email).trim().toLowerCase()
    if (db.accounts.some((a) => a.email.toLowerCase() === normalized)) {
      return HttpResponse.json({ message: 'Такой email уже зарегистрирован' }, { status: 409 })
    }
    const id = nextId('u')
    db.users.push({
      id,
      name: name || 'Новый дегустатор',
      email: normalized,
      avatar: '/images/avatars/guest.svg',
      bio: 'Только начинаю свой винный путь.',
      location: 'Россия',
      stats: { posts: 0, reviews: 0, followers: 0, following: 0 },
      isFollowing: false,
    })
    db.accounts.push({ id, email: normalized, password })
    db.profiles[id] = { onboarded: false, preferences: null }
    save()
    return HttpResponse.json({ token: issueToken(id), user: toAuthUser(id) }, { status: 201 })
  }),

  http.post('/api/auth/logout', async ({ request }) => {
    await lag()
    const token = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
    if (token) delete db.sessions[token]
    save()
    return new HttpResponse(null, { status: 204 })
  }),

  http.get('/api/auth/me', async ({ request }) => {
    await lag()
    const id = currentUserId(request)
    if (!id) return unauthorized()
    return HttpResponse.json(toAuthUser(id))
  }),

  // ------------------------------------------------------------------ feed
  http.get('/api/feed', async ({ request }) => {
    await lag()
    if (!currentUserId(request)) return unauthorized()
    const url = new URL(request.url)
    const page = num(url.searchParams.get('page'), 1)
    const perPage = num(url.searchParams.get('perPage'), 4)
    const sorted = [...db.posts].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    return HttpResponse.json(paginate(sorted, page, perPage))
  }),

  http.get('/api/posts', async ({ request }) => {
    await lag()
    if (!currentUserId(request)) return unauthorized()
    const url = new URL(request.url)
    const authorId = url.searchParams.get('authorId')
    const items = authorId ? db.posts.filter((p) => p.author.id === authorId) : db.posts
    return HttpResponse.json(
      paginate(
        [...items].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)),
        num(url.searchParams.get('page'), 1),
        num(url.searchParams.get('perPage'), 12),
      ),
    )
  }),

  http.post('/api/posts', async ({ request }) => {
    await lag()
    const userId = currentUserId(request)
    if (!userId) return unauthorized()
    const body = (await request.json()) as {
      wineId: string
      text: string
      rating: number
      tags?: string[]
      image?: string
    }
    const wine = findWine(body.wineId)
    const post: Post = {
      id: nextId('p'),
      author: userBrief(userId),
      wineId: body.wineId,
      wineName: wine?.name ?? 'Неизвестное вино',
      image: body.image || wideCrop(wine?.image) || '/images/wines/cabernet-wide.webp',
      text: body.text,
      rating: body.rating,
      tags: body.tags ?? [],
      likes: 0,
      likedByMe: false,
      savedByMe: false,
      commentsCount: 0,
      comments: [],
      createdAt: new Date().toISOString(),
    }
    db.posts.unshift(post)
    const author = db.users.find((u) => u.id === userId)
    if (author) author.stats.posts += 1
    save()
    return HttpResponse.json(post, { status: 201 })
  }),

  http.post('/api/posts/:postId/like', async ({ request, params }) => {
    await lag()
    if (!currentUserId(request)) return unauthorized()
    const post = db.posts.find((p) => p.id === params.postId)
    if (!post) return HttpResponse.json({ message: 'Пост не найден' }, { status: 404 })
    post.likedByMe = !post.likedByMe
    post.likes += post.likedByMe ? 1 : -1
    save()
    return HttpResponse.json({ likes: post.likes, likedByMe: post.likedByMe })
  }),

  http.post('/api/posts/:postId/save', async ({ request, params }) => {
    await lag()
    if (!currentUserId(request)) return unauthorized()
    const post = db.posts.find((p) => p.id === params.postId)
    if (!post) return HttpResponse.json({ message: 'Пост не найден' }, { status: 404 })
    post.savedByMe = !post.savedByMe
    save()
    return HttpResponse.json({ savedByMe: post.savedByMe })
  }),

  http.post('/api/posts/:postId/comments', async ({ request, params }) => {
    await lag()
    const userId = currentUserId(request)
    if (!userId) return unauthorized()
    const { text } = (await request.json()) as { text: string }
    const comment = addComment(String(params.postId), userId, text)
    if (!comment) return HttpResponse.json({ message: 'Пост не найден' }, { status: 404 })
    return HttpResponse.json(comment, { status: 201 })
  }),

  http.delete('/api/posts/:postId/comments/:commentId', async ({ request, params }) => {
    await lag()
    if (!currentUserId(request)) return unauthorized()
    const post = db.posts.find((p) => p.id === params.postId)
    if (!post) return HttpResponse.json({ message: 'Пост не найден' }, { status: 404 })
    post.comments = post.comments.filter((c) => c.id !== params.commentId)
    post.commentsCount = post.comments.length
    save()
    return new HttpResponse(null, { status: 204 })
  }),

  // ----------------------------------------------------------------- wines
  http.get('/api/wines/facets', async () => {
    await lag()
    const wines = allWines()
    const uniqueSorted = (values: string[]) =>
      [...new Set(values)].sort((a, b) => a.localeCompare(b, 'ru'))
    return HttpResponse.json({
      regions: uniqueSorted(wines.map((w) => w.region)),
      grapes: uniqueSorted(wines.flatMap((w) => w.grapes)),
      producers: uniqueSorted(wines.map((w) => w.producer)),
      pairings: uniqueSorted(wines.flatMap((w) => w.pairing)),
    })
  }),

  http.get('/api/wines', async ({ request }) => {
    await lag()
    const url = new URL(request.url)
    const p = url.searchParams
    const query = (p.get('query') ?? '').trim().toLowerCase()
    const colors = p.getAll('color')
    const categories = p.getAll('category')
    const sweetness = p.getAll('sweetness')
    const regions = p.getAll('region')
    const grapes = p.getAll('grape')
    const producers = p.getAll('producer')
    const pairings = p.getAll('pairing')
    const minRating = num(p.get('minRating'), 0)
    const maxPrice = num(p.get('maxPrice'), Number.POSITIVE_INFINITY)
    const awardedOnly = p.get('awarded') === '1'
    const sort = (p.get('sort') ?? 'rating') as CatalogSort

    // Every list narrows the result; within a list the values are alternatives.
    const matchesAny = (selected: string[], values: string[]) =>
      !selected.length || values.some((v) => selected.includes(v))

    const filtered = allWines().filter((w) => {
      const haystack = `${w.name} ${w.producer} ${w.region} ${w.grapes.join(' ')}`.toLowerCase()
      if (query && !haystack.includes(query)) return false
      if (!matchesAny(colors, [w.color])) return false
      if (!matchesAny(categories, [w.category])) return false
      if (!matchesAny(sweetness, [w.sweetness])) return false
      if (!matchesAny(regions, [w.region])) return false
      if (!matchesAny(grapes, w.grapes)) return false
      if (!matchesAny(producers, [w.producer])) return false
      if (!matchesAny(pairings, w.pairing)) return false
      if (w.rating < minRating) return false
      if (w.price > maxPrice) return false
      if (awardedOnly && !w.awards.length) return false
      return true
    })

    filtered.sort(sorters[sort] ?? sorters.rating)
    return HttpResponse.json(
      paginate(filtered, num(p.get('page'), 1), num(p.get('perPage'), 12)),
    )
  }),

  http.get('/api/wines/:wineId', async ({ params }) => {
    await lag()
    const wine = findWine(String(params.wineId))
    if (!wine) return HttpResponse.json({ message: 'Вино не найдено' }, { status: 404 })
    return HttpResponse.json({
      ...wine,
      similar: wine.similarIds.map(findWine).filter(Boolean),
      reviews: db.reviews.filter((r) => r.wineId === wine.id),
    })
  }),

  http.get('/api/wines/:wineId/reviews', async ({ params }) => {
    await lag()
    return HttpResponse.json(db.reviews.filter((r) => r.wineId === params.wineId))
  }),

  http.post('/api/wines/:wineId/reviews', async ({ request, params }) => {
    await lag()
    const userId = currentUserId(request)
    if (!userId) return unauthorized()
    const { rating, text } = (await request.json()) as { rating: number; text: string }
    const review = {
      id: nextId('r'),
      wineId: String(params.wineId),
      author: userBrief(userId),
      rating,
      text,
      createdAt: new Date().toISOString(),
    }
    db.reviews.unshift(review)
    const author = db.users.find((u) => u.id === userId)
    if (author) author.stats.reviews += 1
    save()
    return HttpResponse.json(review, { status: 201 })
  }),

  // ------------------------------------------------------------------ scan
  http.post('/api/scan/label', async ({ request }) => {
    if (!currentUserId(request)) return unauthorized()
    await delay(1400)
    const pool = allWines()
    const wine = pool[Math.floor(Math.random() * pool.length)]
    const result: ScanResult = {
      wine,
      confidence: Math.round((0.82 + Math.random() * 0.16) * 100) / 100,
      scannedAt: new Date().toISOString(),
      source: 'label',
    }
    return HttpResponse.json(result)
  }),

  http.post('/api/scan/qr', async ({ request }) => {
    if (!currentUserId(request)) return unauthorized()
    await delay(900)
    const { code } = ((await request.json().catch(() => ({}))) ?? {}) as { code?: string }
    const pool = allWines()
    const wine = pool.find((w) => w.id === code) ?? pool[Math.floor(Math.random() * pool.length)]
    const result: ScanResult = {
      wine,
      confidence: 1,
      scannedAt: new Date().toISOString(),
      source: 'qr',
    }
    return HttpResponse.json(result)
  }),

  // ------------------------------------------------------------------ user
  http.get('/api/users/me', async ({ request }) => {
    await lag()
    const id = currentUserId(request)
    if (!id) return unauthorized()
    return HttpResponse.json(toAuthUser(id))
  }),

  http.patch('/api/users/me', async ({ request }) => {
    await lag()
    const id = currentUserId(request)
    if (!id) return unauthorized()
    const patch = (await request.json()) as Partial<{
      name: string
      bio: string
      location: string
      avatar: string
      preferences: Preferences
      onboarded: boolean
    }>
    const user = db.users.find((u) => u.id === id)
    if (!user) return unauthorized()
    if (patch.name !== undefined) user.name = patch.name
    if (patch.bio !== undefined) user.bio = patch.bio
    if (patch.location !== undefined) user.location = patch.location
    if (patch.avatar !== undefined) user.avatar = patch.avatar

    const profile = db.profiles[id] ?? { onboarded: false, preferences: null }
    if (patch.preferences !== undefined) profile.preferences = patch.preferences
    if (patch.onboarded !== undefined) profile.onboarded = patch.onboarded
    db.profiles[id] = profile

    // Author snapshots inside posts/comments are denormalised — keep them in sync.
    db.posts.forEach((post) => {
      if (post.author.id === id) post.author = userBrief(id)
      post.comments.forEach((c) => {
        if (c.author.id === id) c.author = userBrief(id)
      })
    })
    save()
    return HttpResponse.json(toAuthUser(id))
  }),

  http.get('/api/users/me/wines', async ({ request }) => {
    await lag()
    if (!currentUserId(request)) return unauthorized()
    return HttpResponse.json(cellarWithWines())
  }),

  http.post('/api/users/me/wines', async ({ request }) => {
    await lag()
    if (!currentUserId(request)) return unauthorized()
    const { wineId, favorite, rating, note } = (await request.json()) as {
      wineId: string
      favorite?: boolean
      rating?: number | null
      note?: string
    }
    if (!findWine(wineId)) {
      return HttpResponse.json({ message: 'Вино не найдено' }, { status: 404 })
    }
    const existing = db.cellar.find((c) => c.wineId === wineId)
    if (existing) {
      if (favorite !== undefined) existing.favorite = favorite
      if (rating !== undefined) existing.rating = rating
      if (note !== undefined) existing.note = note
      save()
      return HttpResponse.json({ ...existing, wine: findWine(wineId) })
    }
    const entry = {
      id: nextId('cw'),
      wineId,
      favorite: favorite ?? false,
      rating: rating ?? null,
      note: note ?? '',
      addedAt: new Date().toISOString(),
    } as CellarWine
    db.cellar.unshift(entry)
    save()
    return HttpResponse.json({ ...entry, wine: findWine(wineId) }, { status: 201 })
  }),

  http.patch('/api/users/me/wines/:entryId', async ({ request, params }) => {
    await lag()
    if (!currentUserId(request)) return unauthorized()
    const entry = db.cellar.find((c) => c.id === params.entryId || c.wineId === params.entryId)
    if (!entry) return HttpResponse.json({ message: 'Запись не найдена' }, { status: 404 })
    const patch = (await request.json()) as Partial<CellarWine>
    if (patch.favorite !== undefined) entry.favorite = patch.favorite
    if (patch.rating !== undefined) entry.rating = patch.rating
    if (patch.note !== undefined) entry.note = patch.note
    save()
    return HttpResponse.json({ ...entry, wine: findWine(entry.wineId) })
  }),

  http.delete('/api/users/me/wines/:entryId', async ({ request, params }) => {
    await lag()
    if (!currentUserId(request)) return unauthorized()
    db.cellar = db.cellar.filter((c) => c.id !== params.entryId && c.wineId !== params.entryId)
    save()
    return new HttpResponse(null, { status: 204 })
  }),

  http.get('/api/users/:userId', async ({ params }) => {
    await lag()
    const user = db.users.find((u) => u.id === params.userId)
    if (!user) return HttpResponse.json({ message: 'Пользователь не найден' }, { status: 404 })
    return HttpResponse.json(user)
  }),

  http.get('/api/users/:userId/posts', async ({ params }) => {
    await lag()
    return HttpResponse.json(db.posts.filter((p) => p.author.id === params.userId))
  }),

  http.get('/api/users/:userId/reviews', async ({ params }) => {
    await lag()
    return HttpResponse.json(db.reviews.filter((r) => r.author.id === params.userId))
  }),

  http.post('/api/users/:userId/follow', async ({ request, params }) => {
    await lag()
    if (!currentUserId(request)) return unauthorized()
    const user = db.users.find((u) => u.id === params.userId)
    if (!user) return HttpResponse.json({ message: 'Пользователь не найден' }, { status: 404 })
    if (!user.isFollowing) {
      user.isFollowing = true
      user.stats.followers += 1
    }
    save()
    return HttpResponse.json({ isFollowing: true, followers: user.stats.followers })
  }),

  http.delete('/api/users/:userId/follow', async ({ request, params }) => {
    await lag()
    if (!currentUserId(request)) return unauthorized()
    const user = db.users.find((u) => u.id === params.userId)
    if (!user) return HttpResponse.json({ message: 'Пользователь не найден' }, { status: 404 })
    if (user.isFollowing) {
      user.isFollowing = false
      user.stats.followers = Math.max(0, user.stats.followers - 1)
    }
    save()
    return HttpResponse.json({ isFollowing: false, followers: user.stats.followers })
  }),
]
