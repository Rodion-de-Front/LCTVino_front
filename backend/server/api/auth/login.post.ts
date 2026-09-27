import { login } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string; password?: string }>(event)
  return login(body?.email ?? '', body?.password ?? '')
})
