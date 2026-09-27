import { setResponseStatus } from 'h3'
import { requireUser } from '../../../utils/auth'
import { addReview } from '../../../utils/wines'

export default defineEventHandler(async (event) => {
  const userId = await requireUser(event)
  const body = await readBody<{ rating?: number; text?: string }>(event)
  const review = await addReview(
    userId,
    getRouterParam(event, 'wineId') ?? '',
    Number(body?.rating ?? 0),
    String(body?.text ?? ''),
  )
  setResponseStatus(event, 201)
  return review
})
