import { requireUser } from '../../../utils/auth'
import { toggleLike } from '../../../utils/posts'

export default defineEventHandler(async (event) => {
  const userId = await requireUser(event)
  return toggleLike(userId, getRouterParam(event, 'postId') ?? '')
})
