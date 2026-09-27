import { requireUser } from '../../../utils/auth'
import { toggleSave } from '../../../utils/posts'

export default defineEventHandler(async (event) => {
  const userId = await requireUser(event)
  return toggleSave(userId, getRouterParam(event, 'postId') ?? '')
})
