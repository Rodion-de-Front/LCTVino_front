import { setResponseStatus } from 'h3'
import { requireUser } from '../../../../utils/auth'
import { addCellar } from '../../../../utils/users'

export default defineEventHandler(async (event) => {
  const userId = await requireUser(event)
  const body = await readBody<{
    wineId?: string
    favorite?: boolean
    scanned?: boolean
    rating?: number | null
    note?: string
  }>(event)
  const result = await addCellar(userId, body ?? {})
  if (result.created) setResponseStatus(event, 201)
  return result.entry
})
