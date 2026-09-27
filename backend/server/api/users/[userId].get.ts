import { authUser, optionalUser, requireUser } from '../../utils/auth'
import { publicProfile } from '../../utils/users'

export default defineEventHandler(async (event) => {
  const userId = getRouterParam(event, 'userId') ?? ''
  if (userId === 'me') return authUser(await requireUser(event))
  return publicProfile(userId, await optionalUser(event))
})
