/**
 * Клиент к сервису сопоставления — тому самому, который сдаётся в кейс.
 *
 * Пайплайн живёт отдельным сервисом и отдельным контейнером: ему нужны torch,
 * 400 МБ весов SigLIP2 и индекс эмбеддингов, и держать всё это внутри бэкенда
 * веба означало бы 12 секунд на каждый деплой и две копии логики, которые
 * разойдутся на первой же правке. Адрес задаётся переменной MATCHER_URL —
 * ровно так же, как capture-сервис ходит к своему PREDICT_URL.
 *
 * Если матчер недоступен, сканер обязан деградировать, а не падать: смысл
 * приложения не заканчивается на распознавании этикетки.
 */

const MATCHER_URL = (process.env.MATCHER_URL || '').replace(/\/+$/, '')
// Продуктовая ручка, не судейская: она умеет воздерживаться и отдаёт топ-5.
// Уверенно названная не та бутылка хуже честного «вот похожие».
const MATCHER_PATH = process.env.MATCHER_PATH || '/v1/predict'
const TIMEOUT_MS = Number(process.env.MATCHER_TIMEOUT_MS || 15000)
// Нужен, только когда матчер выставлен в интернет напрямую. За туннелем
// пусто, и заголовок не отправляется вовсе.
const TOKEN = process.env.MATCHER_TOKEN || ''

export type MatcherCandidate = {
  slug: string
  title: string | null
  winery: string | null
  score: number
  textScore: number
  embeddingScore: number
}

export type MatcherResult = {
  confident: boolean
  ocrText: string | null
  colour: string | null
  candidates: MatcherCandidate[]
  tookMs: number
}

export const matcherConfigured = () => Boolean(MATCHER_URL)

/** data:image/jpeg;base64,... либо голый base64 -> Buffer. */
function decodeImage(image: string): Buffer | null {
  if (!image) return null
  const comma = image.indexOf(',')
  const payload = image.startsWith('data:') && comma > -1 ? image.slice(comma + 1) : image
  try {
    const buf = Buffer.from(payload, 'base64')
    // Меньше килобайта — это не фотография, а огрызок. Пусть лучше вызывающий
    // получит null и покажет понятную ошибку, чем матчер будет гадать по
    // шуму: на крошечном кадре модель не ошибается, а сочиняет.
    return buf.byteLength > 1024 ? buf : null
  } catch {
    return null
  }
}

export async function matchLabel(image: string): Promise<MatcherResult | null> {
  if (!MATCHER_URL) return null
  const buf = decodeImage(image)
  if (!buf) return null

  const form = new FormData()
  form.append('image', new Blob([buf], { type: 'image/jpeg' }), 'scan.jpg')

  const started = Date.now()
  const abort = new AbortController()
  const timer = setTimeout(() => abort.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(`${MATCHER_URL}${MATCHER_PATH}`, {
      method: 'POST',
      body: form,
      headers: TOKEN ? { authorization: `Bearer ${TOKEN}` } : undefined,
      signal: abort.signal,
    })
    if (!res.ok) {
      console.warn(`[matcher] ${res.status} ${res.statusText}`)
      return null
    }
    const data = (await res.json()) as any
    const matches = Array.isArray(data?.matches) ? data.matches : []
    return {
      confident: Boolean(data?.confident),
      ocrText: data?.ocr_text ?? null,
      colour: data?.colour ?? null,
      tookMs: Date.now() - started,
      candidates: matches.map((m: any) => ({
        slug: String(m?.slug ?? ''),
        title: m?.title ?? null,
        winery: m?.winery ?? null,
        score: Number(m?.score ?? 0),
        textScore: Number(m?.text_score ?? 0),
        embeddingScore: Number(m?.embedding_score ?? 0),
      })).filter((m: MatcherCandidate) => m.slug),
    }
  } catch (err) {
    // Таймаут и недоступность выглядят одинаково с точки зрения сканера:
    // ответа нет, показываем это честно и не роняем запрос.
    console.warn(`[matcher] недоступен: ${(err as Error).message}`)
    return null
  } finally {
    clearTimeout(timer)
  }
}
