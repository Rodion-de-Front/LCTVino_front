import { requireUser } from '../../../utils/auth'
import { unfollowUser } from '../../../utils/users'

export default defineEventHandler(async (event) => {
  const viewerId = await requireUser(event)
  return unfollowUser(viewerId, getRouterParam(event, 'userId') ?? '')
})
