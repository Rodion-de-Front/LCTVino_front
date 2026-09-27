import { nextId, useDb } from './db'
import { fail, iso, paginate } from './http'
import { mapComment } from './mappers'

interface PostRow {
  id: string
  author_id: string
  wine_id: string
  wine_name: string
  image: string
  text: string
  rating: number
  tags: string[]
  likes_count: number
  created_at: Date | string
  author_name: string
  author_avatar: string
}

interface CommentRow {
  id: string
  post_id: string
  text: string
  created_at: Date | string
  author_id: string
  author_name: string
  author_avatar: string
}

async function loadPosts(authorId?: string) {
  const sql = useDb()
  if (authorId) {
    return sql<PostRow[]>`
      SELECT p.id, p.author_id, p.wine_id, p.wine_name, p.image, p.text,
             p.rating, p.tags, p.likes_count, p.created_at,
             u.name AS author_name, u.avatar AS author_avatar
      FROM posts p
      JOIN users u ON u.id = p.author_id
      WHERE p.author_id = ${authorId}
      ORDER BY p.created_at DESC
    `
  }
  return sql<PostRow[]>`
    SELECT p.id, p.author_id, p.wine_id, p.wine_name, p.image, p.text,
           p.rating, p.tags, p.likes_count, p.created_at,
           u.name AS author_name, u.avatar AS author_avatar
    FROM posts p
    JOIN users u ON u.id = p.author_id
    ORDER BY p.created_at DESC
  `
}

export async function postsFor(opts: {
  authorId?: string
  viewerId: string | null
  page?: number
  perPage?: number
}) {
  const rows = await loadPosts(opts.authorId)
  const page = opts.page ?? 1
  const perPage = opts.perPage ?? rows.length
  const slice = paginate([...rows], page, perPage)
  const ids = slice.items.map((row) => row.id)
  const sql = useDb()

  const comments = ids.length
    ? await sql<CommentRow[]>`
        SELECT c.id, c.post_id, c.text, c.created_at, c.author_id,
               u.name AS author_name, u.avatar AS author_avatar
        FROM comments c
        JOIN users u ON u.id = c.author_id
        WHERE c.post_id IN ${sql(ids)}
        ORDER BY c.created_at ASC
      `
    : []

  const liked = new Set<string>()
  const saved = new Set<string>()
  if (opts.viewerId && ids.length) {
    const likes = await sql<{ post_id: string }[]>`
      SELECT post_id FROM post_likes
      WHERE user_id = ${opts.viewerId} AND post_id IN ${sql(ids)}
    `
    const saves = await sql<{ post_id: string }[]>`
      SELECT post_id FROM post_saves
      WHERE user_id = ${opts.viewerId} AND post_id IN ${sql(ids)}
    `
    likes.forEach((row) => liked.add(row.post_id))
    saves.forEach((row) => saved.add(row.post_id))
  }

  const byPost = new Map<string, ReturnType<typeof mapComment>[]>()
  for (const comment of comments) {
    const list = byPost.get(comment.post_id) ?? []
    list.push(mapComment(comment))
    byPost.set(comment.post_id, list)
  }

  return {
    ...slice,
    items: slice.items.map((row) => {
      const postComments = byPost.get(row.id) ?? []
      return {
        id: row.id,
        author: { id: row.author_id, name: row.author_name, avatar: row.author_avatar },
        wineId: row.wine_id,
        wineName: row.wine_name,
        image: row.image,
        text: row.text,
        rating: Number(row.rating),
        tags: row.tags ?? [],
        likes: row.likes_count,
        likedByMe: liked.has(row.id),
        savedByMe: saved.has(row.id),
        commentsCount: postComments.length,
        comments: postComments,
        createdAt: iso(row.created_at),
      }
    }),
  }
}

export async function createPost(
  userId: string,
  body: { wineId?: string; text?: string; rating?: number; tags?: string[]; image?: string },
) {
  const sql = useDb()
  const wineId = String(body.wineId ?? '')
  const [wine] = await sql<{ id: string; name: string; image: string }[]>`
    SELECT id, name, image FROM wines WHERE id = ${wineId}
  `
  const [author] = await sql<{ id: string; name: string; avatar: string }[]>`
    SELECT id, name, avatar FROM users WHERE id = ${userId}
  `
  if (!author) fail(401, 'Требуется авторизация')

  const id = await nextId('p')
  const image =
    body.image || wine?.image.replace(/\.webp$/, '-wide.webp') || '/images/wines/cabernet-wide.webp'
  const createdAt = new Date().toISOString()
  const tags = body.tags ?? []
  const rating = Number(body.rating ?? 0)

  await sql`
    INSERT INTO posts (
      id, author_id, wine_id, wine_name, image, text, rating, tags, likes_count, created_at
    ) VALUES (
      ${id}, ${userId}, ${wineId}, ${wine?.name ?? 'Неизвестное вино'}, ${image},
      ${String(body.text ?? '')}, ${rating}, ${sql.array(tags, 1009)}, 0, ${createdAt}
    )
  `
  await sql`UPDATE users SET posts_count = posts_count + 1 WHERE id = ${userId}`

  return {
    id,
    author: { id: author.id, name: author.name, avatar: author.avatar },
    wineId,
    wineName: wine?.name ?? 'Неизвестное вино',
    image,
    text: String(body.text ?? ''),
    rating,
    tags,
    likes: 0,
    likedByMe: false,
    savedByMe: false,
    commentsCount: 0,
    comments: [],
    createdAt,
  }
}

export async function toggleLike(userId: string, postId: string) {
  const sql = useDb()
  return sql.begin(async (tx) => {
    const [post] = await tx<{ id: string }[]>`SELECT id FROM posts WHERE id = ${postId}`
    if (!post) fail(404, 'Пост не найден')
    const [existing] = await tx`
      SELECT 1 AS ok FROM post_likes WHERE post_id = ${postId} AND user_id = ${userId}
    `
    if (existing) {
      await tx`DELETE FROM post_likes WHERE post_id = ${postId} AND user_id = ${userId}`
      const [updated] = await tx<{ likes_count: number }[]>`
        UPDATE posts SET likes_count = GREATEST(likes_count - 1, 0)
        WHERE id = ${postId}
        RETURNING likes_count
      `
      return { likes: updated?.likes_count ?? 0, likedByMe: false }
    }
    await tx`INSERT INTO post_likes (post_id, user_id) VALUES (${postId}, ${userId})`
    const [updated] = await tx<{ likes_count: number }[]>`
      UPDATE posts SET likes_count = likes_count + 1
      WHERE id = ${postId}
      RETURNING likes_count
    `
    return { likes: updated?.likes_count ?? 0, likedByMe: true }
  })
}

export async function toggleSave(userId: string, postId: string) {
  const sql = useDb()
  const [post] = await sql`SELECT id FROM posts WHERE id = ${postId}`
  if (!post) fail(404, 'Пост не найден')
  const [existing] = await sql`
    SELECT 1 AS ok FROM post_saves WHERE post_id = ${postId} AND user_id = ${userId}
  `
  if (existing) {
    await sql`DELETE FROM post_saves WHERE post_id = ${postId} AND user_id = ${userId}`
    return { savedByMe: false }
  }
  await sql`INSERT INTO post_saves (post_id, user_id) VALUES (${postId}, ${userId})`
  return { savedByMe: true }
}

export async function addComment(userId: string, postId: string, text: string) {
  const sql = useDb()
  const [post] = await sql`SELECT id FROM posts WHERE id = ${postId}`
  if (!post) fail(404, 'Пост не найден')
  const [author] = await sql<{ id: string; name: string; avatar: string }[]>`
    SELECT id, name, avatar FROM users WHERE id = ${userId}
  `
  if (!author) fail(401, 'Требуется авторизация')
  const id = await nextId('c')
  const createdAt = new Date().toISOString()
  await sql`
    INSERT INTO comments (id, post_id, author_id, text, created_at)
    VALUES (${id}, ${postId}, ${userId}, ${text}, ${createdAt})
  `
  return {
    id,
    postId,
    author: { id: author.id, name: author.name, avatar: author.avatar },
    text,
    createdAt,
  }
}

export async function removeComment(postId: string, commentId: string) {
  const sql = useDb()
  const [post] = await sql`SELECT id FROM posts WHERE id = ${postId}`
  if (!post) fail(404, 'Пост не найден')
  await sql`DELETE FROM comments WHERE id = ${commentId} AND post_id = ${postId}`
}
