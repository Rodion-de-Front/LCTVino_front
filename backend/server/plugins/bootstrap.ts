import { schemaSql } from '../db/schema'
import { seedIfEmpty } from '../db/seed'
import { useDb } from '../utils/db'

export default defineNitroPlugin(async () => {
  const sql = useDb()
  let lastError: unknown
  for (let attempt = 1; attempt <= 30; attempt++) {
    try {
      await sql`SELECT 1`
      await sql.unsafe(schemaSql)
      await seedIfEmpty(sql)
      console.log('[vinora] database ready')
      return
    } catch (error) {
      lastError = error
      console.warn(`[vinora] waiting for postgres (${attempt}/30)`)
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
  }
  console.error(lastError)
  throw lastError
})
