import { requireUser } from '../../../../utils/auth'
import { noContent } from '../../../../utils/http'
import { removeCellar } from '../../../../utils/users'

export default defineEventHandler(async (event) => {
  const userId = await requireUser(event)
  await removeCellar(userId, getRouterParam(event, 'entryId') ?? '')
  return noContent(event)
})
