import { optionalUser } from '../../../utils/auth'
import { userPosts } from '../../../utils/users'

export default defineEventHandler(async (event) =>
  userPosts(getRouterParam(event, 'userId') ?? '', await optionalUser(event)),
)
