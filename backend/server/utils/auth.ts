import { getHeader, type H3Event } from 'h3'
import { randomBytes } from 'node:crypto'
import { nextId, useDb } from './db'
import { fail } from './http'
import { hashPassword, verifyPassword } from './password'
import { mapAuthUser, type UserRow } from './mappers'

export async function findUser(id: string) {
  const sql = useDb()
  const [row] = await sql<UserRow[]>`SELECT * FROM users WHERE id = ${id}`
  return row ?? null
}

export async function optionalUser(event: H3Event) {
  const header = getHeader(event, 'authorization')
  if (!header) return null
  const token = header.replace(/^Bearer\s+/i, '').trim()
  if (!token) return null
  const [row] = await useDb()`SELECT user_id FROM sessions WHERE token = ${token}`
  return (row?.user_id as string | undefined) ?? null
}

export async function requireUser(event: H3Event) {
  const id = await optionalUser(event)
  if (!id) fail(401, 'Требуется авторизация')
  return id
}

export async function issueToken(userId: string) {
  const token = randomBytes(24).toString('hex')
  await useDb()`INSERT INTO sessions (token, user_id) VALUES (${token}, ${userId})`
  return token
}

export async function login(email: string, password: string) {
  const normalized = String(email ?? '').trim().toLowerCase()
  const sql = useDb()
  const [account] = await sql<UserRow[]>`
    SELECT * FROM users WHERE lower(email) = ${normalized}
  `
  if (!account || !account.password_hash || !verifyPassword(String(password ?? ''), account.password_hash)) {
    fail(401, 'Неверный email или пароль')
  }
  return { token: await issueToken(account.id), user: mapAuthUser(account) }
}

export async function register(payload: { email?: string; password?: string; name?: string }) {
  const email = String(payload.email ?? '').trim().toLowerCase()
  const password = String(payload.password ?? '')
  const name = String(payload.name ?? '').trim() || 'Новый дегустатор'
  if (!email || !password) fail(400, 'Нужны email и пароль')

  const [existing] = await useDb()`SELECT id FROM users WHERE lower(email) = ${email}`
  if (existing) fail(409, 'Такой email уже зарегистрирован')

  const id = await nextId('u')
  const sql = useDb()
  const [user] = await sql<UserRow[]>`
    INSERT INTO users (
      id, name, email, password_hash, avatar, bio, location, onboarded, preferences,
      posts_count, reviews_count, followers_count, following_count
    ) VALUES (
      ${id}, ${name}, ${email}, ${hashPassword(password)},
      '/images/avatars/guest.svg',
      'Только начинаю свой винный путь.',
      'Россия',
      false,
      NULL,
      0, 0, 0, 0
    )
    RETURNING *
  `
  if (!user) fail(500, 'Не удалось создать пользователя')
  return { token: await issueToken(id), user: mapAuthUser(user) }
}

export async function logout(event: H3Event) {
  const header = getHeader(event, 'authorization')
  const token = header?.replace(/^Bearer\s+/i, '').trim()
  if (token) await useDb()`DELETE FROM sessions WHERE token = ${token}`
}

export async function authUser(id: string) {
  const user = await findUser(id)
  if (!user) fail(401, 'Требуется авторизация')
  return mapAuthUser(user)
}
