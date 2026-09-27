import { setResponseStatus } from 'h3'
import { requireUser } from '../../../utils/auth'
import { addComment } from '../../../utils/posts'

export default defineEventHandler(async (event) => {
  const userId = await requireUser(event)
  const body = await readBody<{ text?: string }>(event)
  const comment = await addComment(userId, getRouterParam(event, 'postId') ?? '', String(body?.text ?? ''))
  setResponseStatus(event, 201)
  return comment
})
