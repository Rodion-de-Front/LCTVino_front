import { nextId, useDb } from './db'
import { fail, num, paginate } from './http'
import { mapReview, mapWine, type WineRow } from './mappers'
import { matchLabel, matcherConfigured } from './matcher'

// Каталог статичен между пересевами, а строк теперь 2103, а не 35. Без кэша
// каждая страница каталога тянула бы из базы все описания целиком — около
// 2.5 МБ на запрос ради двенадцати карточек. Сбрасывается только перезапуском,
// и это правильный масштаб инвалидации для данных, которые меняются вместе с
// деплоем.
let wineCache: ReturnType<typeof mapWine>[] | null = null

async function allWines() {
  if (wineCache) return wineCache
  const sql = useDb()
  const rows = await sql<WineRow[]>`SELECT * FROM wines`
  wineCache = rows.map(mapWine)
  return wineCache
}

export function invalidateWineCache() {
  wineCache = null
}

// Поиск должен находить «Абрау» в «Abrau Estates» и наоборот: половина
// каталога названа латиницей, половина кириллицей, а пользователь набирает
// как привык. Таблица покрывает то, что реально встречается в названиях вин.
const TRANSLIT: Record<string, string> = {
  а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
  и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
  с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'ts', ч: 'ch', ш: 'sh',
  щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
}

const translit = (s: string) =>
  s.toLowerCase().replace(/[а-яё]/g, (c) => TRANSLIT[c] ?? c)

const matchesAny = (selected: string[], values: string[]) =>
  !selected.length || values.some((value) => selected.includes(value))

// Сортировки заданы под реальные данные. Цена не заполнена ни у одной из
// 2103 позиций, а год — у 116, поэтому «по цене» и «сначала новые» ставят
// вина без значения в конец, а не перемешивают каталог случайно. Рейтинг есть
// у 901 записи и работает так же: непроставленный уходит вниз.
const last = (v: number) => (v > 0 ? 0 : 1)

const sorters: Record<string, (a: ReturnType<typeof mapWine>, b: ReturnType<typeof mapWine>) => number> = {
  rating: (a, b) => last(a.rating) - last(b.rating) || b.rating - a.rating,
  'price-asc': (a, b) => last(a.price) - last(b.price) || a.price - b.price,
  'price-desc': (a, b) => last(a.price) - last(b.price) || b.price - a.price,
  newest: (a, b) => last(a.year) - last(b.year) || b.year - a.year,
  name: (a, b) => a.name.localeCompare(b.name, 'ru'),
}

export async function searchWines(p: URLSearchParams) {
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
  const sort = p.get('sort') ?? 'rating'

  const needle = translit(query)

  const filtered = (await allWines()).filter((wine) => {
    if (needle) {
      const haystack = translit(
        `${wine.name} ${wine.producer} ${wine.region} ${wine.grapes.join(' ')}`,
      )
      if (!haystack.includes(needle)) return false
    }
    if (!matchesAny(colors, [wine.color])) return false
    if (!matchesAny(categories, [wine.category])) return false
    if (!matchesAny(sweetness, [wine.sweetness])) return false
    if (!matchesAny(regions, [wine.region])) return false
    if (!matchesAny(grapes, wine.grapes)) return false
    if (!matchesAny(producers, [wine.producer])) return false
    if (!matchesAny(pairings, wine.pairing)) return false
    if (wine.rating < minRating) return false
    // Цены в каталоге нет ни у одной позиции, поэтому фильтр по цене
    // применяется только если она вообще проставлена. Иначе ползунок
    // «до 1000 ₽» молча прятал бы весь каталог.
    if (wine.price > 0 && wine.price > maxPrice) return false
    if (awardedOnly && !wine.awards.length) return false
    return true
  })

  filtered.sort(sorters[sort] ?? sorters.rating)
  return paginate(filtered, num(p.get('page'), 1), num(p.get('perPage'), 12))
}

export async function wineFacets() {
  const wines = await allWines()
  const uniqueSorted = (values: string[]) => [...new Set(values)].sort((a, b) => a.localeCompare(b, 'ru'))
  return {
    regions: uniqueSorted(wines.map((wine) => wine.region)),
    grapes: uniqueSorted(wines.flatMap((wine) => wine.grapes)),
    producers: uniqueSorted(wines.map((wine) => wine.producer)),
    pairings: uniqueSorted(wines.flatMap((wine) => wine.pairing)),
  }
}

export async function wineById(id: string) {
  const sql = useDb()
  const [row] = await sql<WineRow[]>`SELECT * FROM wines WHERE id = ${id}`
  return row ? mapWine(row) : null
}

export async function wineDetail(id: string) {
  const wine = await wineById(id)
  if (!wine) fail(404, 'Вино не найдено')
  const similar = []
  for (const similarId of wine.similarIds) {
    const match = await wineById(similarId)
    if (match) similar.push(match)
  }
  return { ...wine, similar, reviews: await reviewsOfWine(id) }
}

export async function reviewsOfWine(wineId: string) {
  const sql = useDb()
  const rows = await sql`
    SELECT r.id, r.wine_id, r.rating, r.text, r.created_at, r.author_id,
           u.name AS author_name, u.avatar AS author_avatar
    FROM reviews r
    JOIN users u ON u.id = r.author_id
    WHERE r.wine_id = ${wineId}
    ORDER BY r.created_at DESC
  `
  return rows.map((row) =>
    mapReview({
      id: String(row.id),
      wine_id: String(row.wine_id),
      rating: Number(row.rating),
      text: String(row.text),
      created_at: row.created_at as Date,
      author_id: String(row.author_id),
      author_name: String(row.author_name),
      author_avatar: String(row.author_avatar),
    }),
  )
}

export async function reviewsByAuthor(authorId: string) {
  const sql = useDb()
  const rows = await sql`
    SELECT r.id, r.wine_id, r.rating, r.text, r.created_at, r.author_id,
           u.name AS author_name, u.avatar AS author_avatar
    FROM reviews r
    JOIN users u ON u.id = r.author_id
    WHERE r.author_id = ${authorId}
    ORDER BY r.created_at DESC
  `
  return rows.map((row) =>
    mapReview({
      id: String(row.id),
      wine_id: String(row.wine_id),
      rating: Number(row.rating),
      text: String(row.text),
      created_at: row.created_at as Date,
      author_id: String(row.author_id),
      author_name: String(row.author_name),
      author_avatar: String(row.author_avatar),
    }),
  )
}

export async function addReview(userId: string, wineId: string, rating: number, text: string) {
  const wine = await wineById(wineId)
  if (!wine) fail(404, 'Вино не найдено')
  const sql = useDb()
  const [author] = await sql<{ id: string; name: string; avatar: string }[]>`
    SELECT id, name, avatar FROM users WHERE id = ${userId}
  `
  if (!author) fail(401, 'Требуется авторизация')
  const id = await nextId('r')
  const createdAt = new Date().toISOString()
  await sql`
    INSERT INTO reviews (id, wine_id, author_id, rating, text, created_at)
    VALUES (${id}, ${wineId}, ${userId}, ${rating}, ${text}, ${createdAt})
  `
  await sql`UPDATE users SET reviews_count = reviews_count + 1 WHERE id = ${userId}`
  return {
    id,
    wineId,
    author: { id: author.id, name: author.name, avatar: author.avatar },
    rating,
    text,
    createdAt,
  }
}

function normalizeNeedle(value: string) {
  return value.trim().toLowerCase()
}

async function findScannedWine(payload: string) {
  const needle = normalizeNeedle(payload)
  if (!needle) return null
  const wines = await allWines()
  return (
    wines.find((item) => needle === normalizeNeedle(item.id)) ??
    wines.find((item) => {
      const searchable = [
        item.id,
        item.name,
        item.producer,
        item.country,
        item.region,
        String(item.year),
        ...item.grapes,
      ]
        .map(normalizeNeedle)
        .join(' ')
      return searchable.includes(needle) || needle.includes(normalizeNeedle(item.id))
    }) ??
    null
  )
}

export async function scanLabel(image?: string) {
  const payload = String(image ?? '')

  // Основной путь: фотография уходит в сервис сопоставления, тот возвращает
  // slug каталога. id вина в базе — это тот же slug, поэтому промежуточного
  // перевода не нужно.
  const matched = await matchLabel(payload)
  if (matched) {
    const ranked = []
    for (const candidate of matched.candidates) {
      const wine = await wineById(candidate.slug)
      if (wine) ranked.push(wine)
    }
    if (ranked.length) {
      const [best, ...rest] = ranked
      return {
        wine: best,
        // confident=false означает «возможно, этого вина в каталоге нет».
        // Интерфейсу это нужно, чтобы показать список вместо одного ответа:
        // уверенно названная не та бутылка хуже честного «вот похожие».
        confidence: matched.confident ? 1 : 0.5,
        confident: matched.confident,
        alternatives: rest,
        // Что именно прочитано с этикетки. Показывать стоит: пользователь
        // видит, почему выбрано это вино, и ошибка перестаёт выглядеть
        // необъяснимой.
        recognizedText: matched.ocrText,
        recognizedColour: matched.colour,
        tookMs: matched.tookMs,
        scannedAt: new Date().toISOString(),
        source: 'label' as const,
      }
    }
    // Матчер ответил, но ни один slug не нашёлся в базе: каталог у матчера и
    // каталог в базе разошлись. Тихо это проглатывать нельзя.
    console.warn(`[scan] матчер вернул ${matched.candidates.length} кандидатов, ни одного нет в базе`)
  }

  // Запасной путь: матчер не настроен или недоступен. Раньше это был
  // единственный путь — поиск по подстроке, — и он остаётся деградацией,
  // чтобы демонстрация приложения не зависела от наличия GPU.
  const wine = await findScannedWine(payload)
  if (!wine) {
    fail(
      matcherConfigured() ? 503 : 404,
      matcherConfigured()
        ? 'Сервис распознавания недоступен, попробуйте ещё раз'
        : 'Вино не найдено',
    )
  }
  return {
    wine,
    confidence: 0.5,
    confident: false,
    alternatives: [],
    recognizedText: null,
    recognizedColour: null,
    scannedAt: new Date().toISOString(),
    source: 'label' as const,
  }
}

export async function scanQr(code: string) {
  const wine = await findScannedWine(code)
  if (!wine) fail(404, 'QR-код не найден в базе')
  return {
    wine,
    confidence: 1,
    scannedAt: new Date().toISOString(),
    source: 'qr' as const,
  }
}
