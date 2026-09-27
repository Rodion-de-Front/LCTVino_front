import { setResponseStatus } from 'h3'
import { requireUser } from '../../utils/auth'
import { createPost } from '../../utils/posts'

export default defineEventHandler(async (event) => {
  const userId = await requireUser(event)
  const body = await readBody<{
    wineId?: string
    text?: string
    rating?: number
    tags?: string[]
    image?: string
  }>(event)
  const post = await createPost(userId, body ?? {})
  setResponseStatus(event, 201)
  return post
})
