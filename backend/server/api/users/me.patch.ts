import { requireUser } from '../../utils/auth'
import { updateMe } from '../../utils/users'

export default defineEventHandler(async (event) => {
  const userId = await requireUser(event)
  const patch = await readBody<{
    name?: string
    bio?: string
    location?: string
    avatar?: string
    preferences?: Record<string, unknown> | null
    onboarded?: boolean
  }>(event)
  return updateMe(userId, patch ?? {})
})
