import { requireUser } from '../../utils/auth'
import { scanLabel } from '../../utils/wines'

export default defineEventHandler(async (event) => {
  await requireUser(event)
  const body = await readBody<{ image?: string }>(event).catch(() => ({ image: undefined }))
  return scanLabel(body?.image)
})
