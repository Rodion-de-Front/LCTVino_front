import { authUser, requireUser } from '../../utils/auth'

export default defineEventHandler(async (event) => authUser(await requireUser(event)))
