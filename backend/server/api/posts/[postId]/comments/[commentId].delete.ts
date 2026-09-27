import { requireUser } from '../../../../utils/auth'
import { noContent } from '../../../../utils/http'
import { removeComment } from '../../../../utils/posts'

export default defineEventHandler(async (event) => {
  await requireUser(event)
  await removeComment(getRouterParam(event, 'postId') ?? '', getRouterParam(event, 'commentId') ?? '')
  return noContent(event)
})
