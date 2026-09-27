import { requireUser } from '../../../../utils/auth'
import { updateCellar } from '../../../../utils/users'

export default defineEventHandler(async (event) => {
  const userId = await requireUser(event)
  const patch = await readBody<{ favorite?: boolean; scanned?: boolean; rating?: number | null; note?: string }>(event)
  return updateCellar(userId, getRouterParam(event, 'entryId') ?? '', patch ?? {})
})
