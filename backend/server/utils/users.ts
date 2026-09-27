import { findUser } from './auth'
import { nextId, useDb } from './db'
import { fail, iso } from './http'
import { mapAuthUser, mapUser, mapWine } from './mappers'
import { postsFor } from './posts'
import { wineById } from './wines'

async function isFollowing(followerId: string | null, followingId: string) {
  if (!followerId || followerId === followingId) return false
  const [row] = await useDb()`
    SELECT 1 AS ok FROM follows
    WHERE follower_id = ${followerId} AND following_id = ${followingId}
  `
  return Boolean(row)
}

export async function publicProfile(userId: string, viewerId: string | null) {
  const user = await findUser(userId)
  if (!user) fail(404, 'Пользователь не найден')
  return mapUser(user, await isFollowing(viewerId, userId))
}

export async function updateMe(
  userId: string,
  patch: {
    name?: string
    bio?: string
    location?: string
    avatar?: string
    preferences?: Record<string, unknown> | null
    onboarded?: boolean
  },
) {
  const sql = useDb()
  if (patch.name !== undefined) await sql`UPDATE users SET name = ${patch.name} WHERE id = ${userId}`
  if (patch.bio !== undefined) await sql`UPDATE users SET bio = ${patch.bio} WHERE id = ${userId}`
  if (patch.location !== undefined) {
    await sql`UPDATE users SET location = ${patch.location} WHERE id = ${userId}`
  }
  if (patch.avatar !== undefined) await sql`UPDATE users SET avatar = ${patch.avatar} WHERE id = ${userId}`
  if (patch.onboarded !== undefined) {
    await sql`UPDATE users SET onboarded = ${patch.onboarded} WHERE id = ${userId}`
  }
  if (patch.preferences !== undefined) {
    await sql`UPDATE users SET preferences = ${sql.json(patch.preferences)} WHERE id = ${userId}`
  }
  const user = await findUser(userId)
  if (!user) fail(401, 'Требуется авторизация')
  return mapAuthUser(user)
}

async function cellarEntry(row: {
  id: string
  wine_id: string
  favorite: boolean
  scanned: boolean
  rating: number | null
  note: string
  added_at: Date | string
}, wine: ReturnType<typeof mapWine>) {
  return {
    id: row.id,
    wineId: row.wine_id,
    wine,
    favorite: row.favorite,
    scanned: row.scanned,
    rating: row.rating,
    note: row.note,
    addedAt: iso(row.added_at),
  }
}

export async function listCellar(userId: string) {
  const sql = useDb()
  const entries = await sql`
    SELECT id, wine_id, favorite, scanned, rating, note, added_at
    FROM cellar
    WHERE user_id = ${userId}
    ORDER BY added_at DESC
  `
  const result = []
  for (const entry of entries) {
    const wine = await wineById(String(entry.wine_id))
    if (!wine) continue
    result.push(
      await cellarEntry(
        {
          id: String(entry.id),
          wine_id: String(entry.wine_id),
          favorite: Boolean(entry.favorite),
          scanned: Boolean(entry.scanned),
          rating: entry.rating == null ? null : Number(entry.rating),
          note: String(entry.note ?? ''),
          added_at: entry.added_at as Date,
        },
        wine,
      ),
    )
  }
  return result
}

export async function addCellar(
  userId: string,
  body: { wineId?: string; favorite?: boolean; scanned?: boolean; rating?: number | null; note?: string },
) {
  const wineId = String(body.wineId ?? '')
  const wine = await wineById(wineId)
  if (!wine) fail(404, 'Вино не найдено')
  const sql = useDb()
  const [existing] = await sql`
    SELECT id, wine_id, favorite, scanned, rating, note, added_at
    FROM cellar WHERE user_id = ${userId} AND wine_id = ${wineId}
  `
  if (existing) {
    const favorite = body.favorite !== undefined ? body.favorite : Boolean(existing.favorite)
    const scanned = body.scanned !== undefined ? body.scanned : Boolean(existing.scanned)
    const rating = body.rating !== undefined ? body.rating : existing.rating == null ? null : Number(existing.rating)
    const note = body.note !== undefined ? body.note : String(existing.note ?? '')
    const [updated] = await sql`
      UPDATE cellar SET favorite = ${favorite}, scanned = ${scanned}, rating = ${rating}, note = ${note}
      WHERE id = ${existing.id}
      RETURNING id, wine_id, favorite, scanned, rating, note, added_at
    `
    return {
      created: false,
      entry: await cellarEntry(
        {
          id: String(updated?.id ?? existing.id),
          wine_id: wineId,
          favorite,
          scanned,
          rating,
          note,
          added_at: (updated?.added_at as Date) ?? (existing.added_at as Date),
        },
        wine,
      ),
    }
  }

  const id = await nextId('cw')
  const addedAt = new Date().toISOString()
  const favorite = body.favorite ?? false
  const scanned = body.scanned ?? false
  const rating = body.rating ?? null
  const note = body.note ?? ''
  await sql`
    INSERT INTO cellar (id, user_id, wine_id, favorite, scanned, rating, note, added_at)
    VALUES (${id}, ${userId}, ${wineId}, ${favorite}, ${scanned}, ${rating}, ${note}, ${addedAt})
  `
  return {
    created: true,
    entry: await cellarEntry({ id, wine_id: wineId, favorite, scanned, rating, note, added_at: addedAt }, wine),
  }
}

export async function updateCellar(
  userId: string,
  entryId: string,
  patch: { favorite?: boolean; scanned?: boolean; rating?: number | null; note?: string },
) {
  const sql = useDb()
  const [entry] = await sql`
    SELECT id, wine_id, favorite, scanned, rating, note, added_at
    FROM cellar
    WHERE user_id = ${userId} AND (id = ${entryId} OR wine_id = ${entryId})
  `
  if (!entry) fail(404, 'Запись не найдена')
  const favorite = patch.favorite !== undefined ? patch.favorite : Boolean(entry.favorite)
  const scanned = patch.scanned !== undefined ? patch.scanned : Boolean(entry.scanned)
  const rating = patch.rating !== undefined ? patch.rating : entry.rating == null ? null : Number(entry.rating)
  const note = patch.note !== undefined ? patch.note : String(entry.note ?? '')
  await sql`
    UPDATE cellar SET favorite = ${favorite}, scanned = ${scanned}, rating = ${rating}, note = ${note}
    WHERE id = ${entry.id}
  `
  const wine = await wineById(String(entry.wine_id))
  if (!wine) fail(404, 'Вино не найдено')
  return cellarEntry(
    {
      id: String(entry.id),
      wine_id: String(entry.wine_id),
      favorite,
      scanned,
      rating,
      note,
      added_at: entry.added_at as Date,
    },
    wine,
  )
}

export async function removeCellar(userId: string, entryId: string) {
  await useDb()`
    DELETE FROM cellar
    WHERE user_id = ${userId} AND (id = ${entryId} OR wine_id = ${entryId})
  `
}

export async function userPosts(userId: string, viewerId: string | null) {
  const page = await postsFor({ authorId: userId, viewerId, page: 1, perPage: 100 })
  return page.items
}

export async function followUser(viewerId: string, targetId: string) {
  const target = await findUser(targetId)
  if (!target) fail(404, 'Пользователь не найден')
  const sql = useDb()
  const [existing] = await sql`
    SELECT 1 AS ok FROM follows WHERE follower_id = ${viewerId} AND following_id = ${targetId}
  `
  if (!existing) {
    await sql`INSERT INTO follows (follower_id, following_id) VALUES (${viewerId}, ${targetId})`
    await sql`UPDATE users SET followers_count = followers_count + 1 WHERE id = ${targetId}`
  }
  const fresh = await findUser(targetId)
  return { isFollowing: true, followers: fresh?.followers_count ?? target.followers_count }
}

export async function unfollowUser(viewerId: string, targetId: string) {
  const target = await findUser(targetId)
  if (!target) fail(404, 'Пользователь не найден')
  const sql = useDb()
  const [existing] = await sql`
    SELECT 1 AS ok FROM follows WHERE follower_id = ${viewerId} AND following_id = ${targetId}
  `
  if (existing) {
    await sql`DELETE FROM follows WHERE follower_id = ${viewerId} AND following_id = ${targetId}`
    await sql`
      UPDATE users SET followers_count = GREATEST(followers_count - 1, 0) WHERE id = ${targetId}
    `
  }
  const fresh = await findUser(targetId)
  return { isFollowing: false, followers: fresh?.followers_count ?? target.followers_count }
}
