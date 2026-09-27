import { requireUser } from '../../../../utils/auth'
import { listCellar } from '../../../../utils/users'

export default defineEventHandler(async (event) => listCellar(await requireUser(event)))
