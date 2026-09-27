import { requireUser } from '../utils/auth'
import { num } from '../utils/http'
import { postsFor } from '../utils/posts'

export default defineEventHandler(async (event) => {
  const userId = await requireUser(event)
  const params = getRequestURL(event).searchParams
  return postsFor({
    viewerId: userId,
    page: num(params.get('page'), 1),
    perPage: num(params.get('perPage'), 4),
  })
})
