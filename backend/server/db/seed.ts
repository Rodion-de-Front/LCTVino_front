import postgres from 'postgres'
import { hashPassword } from '../utils/password'
import { posts, reviews, users } from './data'
import catalogWines from './catalog.json'
import demoWineMap from './demo-wine-map.json'

// Каталог настоящий: 2103 вина, выгруженные из данных организаторов вместе с
// фотографиями бутылок (scripts/export_catalog_to_web.py в репозитории
// сканера). Демонстрационных вин из data.ts больше нет: придуманные цены и
// профили вкуса плохо смотрятся в продукте, смысл которого — настоящий
// каталог.
//
// id вина — это slug каталога, тот самый, который возвращает матчер. Это
// существенно: ответ сканера ложится в карточку без промежуточной таблицы
// соответствий.
const wines = catalogWines as Array<Record<string, any>>

// Посты, отзывы и полка ссылались на w1..w12. Тех записей больше нет, поэтому
// ссылки переводятся на реальные вина того же цвета и сорта; соответствия
// подобраны один раз и лежат в demo-wine-map.json.
const realId = (demoId: string) => (demoWineMap as Record<string, string>)[demoId] ?? demoId
const wineById = new Map(wines.map((w) => [w.id, w]))

const TEXT_ARRAY = 1009

const daysAgo = (days: number) => new Date(Date.now() - days * 86_400_000).toISOString()

const annaPreferences = {
  wineType: 'red',
  sweetness: 'dry',
  body: 'full',
  tannins: 'high',
  acidity: 'medium',
  grapes: ['Каберне Совиньон', 'Пино Нуар'],
  regions: ['Крым', 'Франция'],
}

const cellar = [
  { id: 'cw1', wineId: 'w1', favorite: true, rating: 5, note: 'Лучшее из Крыма.', days: 8 },
  { id: 'cw2', wineId: 'w3', favorite: true, rating: 5, note: 'Особый случай.', days: 20 },
  { id: 'cw3', wineId: 'w12', favorite: false, rating: 4, note: 'Держу на праздники.', days: 32 },
  { id: 'cw4', wineId: 'w6', favorite: true, rating: null, note: '', days: 4 },
  { id: 'cw5', wineId: 'w9', favorite: false, rating: 4, note: 'Летний фаворит.', days: 12 },
  { id: 'cw6', wineId: 'w2', favorite: false, rating: null, note: '', days: 2 },
]

export async function seedIfEmpty(sql: ReturnType<typeof postgres>) {
  const [count] = await sql<{ n: number }[]>`SELECT count(*)::int AS n FROM wines`
  if ((count?.n ?? 0) > 0) return

  const passwordHash = hashPassword('vinora2026')

  await sql.begin(async (tx) => {
    for (const user of users) {
      await tx`
        INSERT INTO users (
          id, name, email, password_hash, avatar, bio, location, onboarded, preferences,
          posts_count, reviews_count, followers_count, following_count
        ) VALUES (
          ${user.id},
          ${user.name},
          ${user.email},
          ${passwordHash},
          ${user.avatar},
          ${user.bio},
          ${user.location},
          true,
          ${user.id === 'u1' ? tx.json(annaPreferences) : null},
          ${user.stats.posts},
          ${user.stats.reviews},
          ${user.stats.followers},
          ${user.stats.following}
        )
      `
    }

    for (const wine of wines) {
      await tx`
        INSERT INTO wines (
          id, name, producer, country, region, color, category, sweetness,
          grapes, year, abv, price, rating, ratings_count, image, description,
          pairing, awards, taste, similar_ids
        ) VALUES (
          ${wine.id},
          ${wine.name},
          ${wine.producer},
          ${wine.country},
          ${wine.region},
          ${wine.color},
          ${wine.category},
          ${wine.sweetness},
          ${tx.array(wine.grapes, TEXT_ARRAY)},
          ${wine.year},
          ${wine.abv},
          ${wine.price},
          ${wine.rating},
          ${wine.ratingsCount},
          ${wine.image},
          ${wine.description},
          ${tx.array(wine.pairing, TEXT_ARRAY)},
          ${tx.array(wine.awards, TEXT_ARRAY)},
          ${tx.json(wine.taste)},
          ${tx.array(wine.similarIds, TEXT_ARRAY)}
        )
      `
    }

    for (const post of posts) {
      await tx`
        INSERT INTO posts (
          id, author_id, wine_id, wine_name, image, text, rating, tags, likes_count, created_at
        ) VALUES (
          ${post.id},
          ${post.author.id},
          ${realId(post.wineId)},
          ${wineById.get(realId(post.wineId))?.name ?? post.wineName},
          ${post.image},
          ${post.text},
          ${post.rating},
          ${tx.array(post.tags, TEXT_ARRAY)},
          ${post.likes},
          ${post.createdAt}
        )
      `
      for (const comment of post.comments) {
        await tx`
          INSERT INTO comments (id, post_id, author_id, text, created_at)
          VALUES (
            ${comment.id},
            ${comment.postId},
            ${comment.author.id},
            ${comment.text},
            ${comment.createdAt}
          )
        `
      }
      if (post.likedByMe) {
        await tx`INSERT INTO post_likes (post_id, user_id) VALUES (${post.id}, 'u1')`
      }
      if (post.savedByMe) {
        await tx`INSERT INTO post_saves (post_id, user_id) VALUES (${post.id}, 'u1')`
      }
    }

    for (const review of reviews) {
      await tx`
        INSERT INTO reviews (id, wine_id, author_id, rating, text, created_at)
        VALUES (
          ${review.id},
          ${realId(review.wineId)},
          ${review.author.id},
          ${review.rating},
          ${review.text},
          ${review.createdAt}
        )
      `
    }

    for (const entry of cellar) {
      await tx`
        INSERT INTO cellar (id, user_id, wine_id, favorite, rating, note, added_at)
        VALUES (
          ${entry.id},
          'u1',
          ${realId(entry.wineId)},
          ${entry.favorite},
          ${entry.rating},
          ${entry.note},
          ${daysAgo(entry.days)}
        )
      `
    }

    for (const user of users) {
      if (user.isFollowing && user.id !== 'u1') {
        await tx`
          INSERT INTO follows (follower_id, following_id) VALUES ('u1', ${user.id})
        `
      }
    }

    await tx`INSERT INTO id_seq (id, value) VALUES (1, 100)`
  })

  console.log(
    `[vinora] seeded ${users.length} users, ${wines.length} wines, ${posts.length} posts, ${reviews.length} reviews`,
  )
}
