import { requireUser } from '../../../utils/auth'
import { followUser } from '../../../utils/users'

export default defineEventHandler(async (event) => {
  const viewerId = await requireUser(event)
  return followUser(viewerId, getRouterParam(event, 'userId') ?? '')
})
