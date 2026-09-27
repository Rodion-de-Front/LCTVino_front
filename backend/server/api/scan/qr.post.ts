import { requireUser } from '../../utils/auth'
import { scanQr } from '../../utils/wines'

export default defineEventHandler(async (event) => {
  await requireUser(event)
  const body = await readBody<{ code?: string }>(event).catch(() => ({ code: undefined }))
  return scanQr(body?.code ?? '')
})
