import { logout } from '../../utils/auth'
import { noContent } from '../../utils/http'

export default defineEventHandler(async (event) => {
  await logout(event)
  return noContent(event)
})
