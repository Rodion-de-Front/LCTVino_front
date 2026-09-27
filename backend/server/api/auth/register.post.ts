import { setResponseStatus } from 'h3'
import { register } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ email?: string; password?: string; name?: string }>(event)
  const result = await register(body ?? {})
  setResponseStatus(event, 201)
  return result
})
