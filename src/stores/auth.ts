import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { authApi } from '@/api'
import { TOKEN_KEY, errorMessage, setUnauthorizedHandler } from '@/api/client'
import type { AuthUser, Preferences } from '@/types'

const USER_KEY = 'vinora:user'

function readCachedUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const user = ref<AuthUser | null>(readCachedUser())
  const pending = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => Boolean(token.value && user.value))
  const needsOnboarding = computed(() => Boolean(user.value && !user.value.onboarded))

  function persist(nextToken: string | null, nextUser: AuthUser | null) {
    token.value = nextToken
    user.value = nextUser
    if (nextToken) localStorage.setItem(TOKEN_KEY, nextToken)
    else localStorage.removeItem(TOKEN_KEY)
    if (nextUser) localStorage.setItem(USER_KEY, JSON.stringify(nextUser))
    else localStorage.removeItem(USER_KEY)
  }

  async function login(email: string, password: string) {
    pending.value = true
    error.value = null
    try {
      const { token: t, user: u } = await authApi.login(email, password)
      persist(t, u)
      return u
    } catch (e) {
      error.value = errorMessage(e, 'Не удалось войти')
      throw e
    } finally {
      pending.value = false
    }
  }

  async function register(payload: { email: string; password: string; name: string }) {
    pending.value = true
    error.value = null
    try {
      const { token: t, user: u } = await authApi.register(payload)
      persist(t, u)
      return u
    } catch (e) {
      error.value = errorMessage(e, 'Не удалось зарегистрироваться')
      throw e
    } finally {
      pending.value = false
    }
  }

  async function logout() {
    try {
      await authApi.logout()
    } catch {
      /* the session is dropped locally regardless */
    }
    persist(null, null)
  }

  /** Refreshes the cached profile; keeps the stale copy when offline. */
  async function hydrate() {
    if (!token.value) return null
    try {
      const fresh = await authApi.me()
      persist(token.value, fresh)
      return fresh
    } catch {
      return user.value
    }
  }

  function applyUser(next: AuthUser) {
    persist(token.value, next)
  }

  function setPreferences(preferences: Preferences) {
    if (!user.value) return
    applyUser({ ...user.value, preferences, onboarded: true })
  }

  setUnauthorizedHandler(() => persist(null, null))

  return {
    token,
    user,
    pending,
    error,
    isAuthenticated,
    needsOnboarding,
    login,
    register,
    logout,
    hydrate,
    applyUser,
    setPreferences,
  }
})
