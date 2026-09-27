import { createError, sendNoContent, type H3Event } from 'h3'

export function fail(statusCode: number, message: string): never {
  throw createError({ statusCode, statusMessage: 'Error', message })
}

export function noContent(event: H3Event) {
  return sendNoContent(event)
}

export function num(value: string | null, fallback: number) {
  const n = Number(value)
  return Number.isFinite(n) && value !== null && value !== '' ? n : fallback
}

export function paginate<T>(items: T[], page: number, perPage: number) {
  const start = (page - 1) * perPage
  return {
    items: items.slice(start, start + perPage),
    page,
    perPage,
    total: items.length,
    hasMore: start + perPage < items.length,
  }
}

export function iso(value: Date | string) {
  return new Date(value).toISOString()
}
