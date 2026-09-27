import { useDb } from '../utils/db'

export default defineEventHandler(async () => {
  const sql = useDb()
  const [row] = await sql<{ wines: number; users: number }[]>`
    SELECT
      (SELECT count(*)::int FROM wines) AS wines,
      (SELECT count(*)::int FROM users) AS users
  `
  return { ok: true, wines: row?.wines ?? 0, users: row?.users ?? 0 }
})
