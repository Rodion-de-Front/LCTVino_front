import postgres from 'postgres'
import { fail } from './http'

let client: ReturnType<typeof postgres> | undefined

export function databaseUrl() {
  return (
    process.env.NUXT_DATABASE_URL ||
    process.env.DATABASE_URL ||
    useRuntimeConfig().databaseUrl ||
    'postgres://vinora:vinora@127.0.0.1:5432/vinora'
  )
}

export function useDb() {
  if (!client) {
    client = postgres(databaseUrl(), { max: 10 })
  }
  return client
}

export async function nextId(prefix: string) {
  const [row] = await useDb()`UPDATE id_seq SET value = value + 1 WHERE id = 1 RETURNING value`
  if (!row) fail(500, 'Счётчик идентификаторов не инициализирован')
  return `${prefix}${row.value}`
}
