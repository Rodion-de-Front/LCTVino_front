import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { feedApi, userApi } from '@/api'
import type { CellarWine, Post, Preferences, Review, User } from '@/types'
import { useAuthStore } from './auth'
import { useUiStore } from './ui'

export type CellarTab = 'all' | 'favorites' | 'scanned' | 'rated'

export const useUserStore = defineStore('user', () => {
  const auth = useAuthStore()
  const ui = useUiStore()

  const profile = computed(() => auth.user)
  const preferences = computed<Preferences | null>(() => auth.user?.preferences ?? null)

  const myWines = ref<CellarWine[]>([])
  const myPosts = ref<Post[]>([])
  const myReviews = ref<Review[]>([])
  const loadingCellar = ref(false)
  const loadingProfile = ref(false)

  const viewedUser = ref<User | null>(null)
  const viewedPosts = ref<Post[]>([])
  const viewedReviews = ref<Review[]>([])
  const loadingViewed = ref(false)

  const favorites = computed(() => myWines.value.filter((w) => w.favorite))
  const scanned = computed(() => myWines.value.filter((w) => w.scanned))
  const rated = computed(() => myWines.value.filter((w) => w.rating !== null))

  function cellarTab(tab: CellarTab) {
    if (tab === 'favorites') return favorites.value
    if (tab === 'scanned') return scanned.value
    if (tab === 'rated') return rated.value
    return myWines.value
  }

  const isInCellar = (wineId: string) => myWines.value.some((w) => w.wineId === wineId)
  const cellarEntry = (wineId: string) => myWines.value.find((w) => w.wineId === wineId) ?? null

  async function loadProfile() {
    loadingProfile.value = true
    try {
      const [fresh, posts, reviews] = await Promise.all([
        auth.hydrate(),
        auth.user ? feedApi.byAuthor(auth.user.id) : Promise.resolve([]),
        auth.user ? userApi.reviewsOf(auth.user.id) : Promise.resolve([]),
      ])
      myPosts.value = posts
      myReviews.value = reviews
      return fresh
    } finally {
      loadingProfile.value = false
    }
  }

  async function loadMyWines() {
    loadingCellar.value = true
    try {
      myWines.value = await userApi.cellar()
    } catch {
    } finally {
      loadingCellar.value = false
    }
  }

  async function updateProfile(patch: Partial<Pick<User, 'name' | 'bio' | 'location' | 'avatar'>>) {
    const updated = await userApi.update(patch)
    auth.applyUser(updated)
    return updated
  }

  async function savePreferences(prefs: Preferences) {
    const updated = await userApi.savePreferences(prefs)
    auth.applyUser(updated)
    return updated
  }

  async function addWine(
    wineId: string,
    options: { favorite?: boolean; scanned?: boolean; rating?: number | null; note?: string } = {},
  ) {
    const entry = await userApi.addWine({ wineId, ...options })
    const index = myWines.value.findIndex((w) => w.wineId === wineId)
    index === -1 ? myWines.value.unshift(entry) : (myWines.value[index] = entry)
    ui.haptic([10, 20, 10])
    return entry
  }

  async function rateWine(wineId: string, rating: number, note?: string) {
    const entry = cellarEntry(wineId)
    if (!entry) return addWine(wineId, { rating, note })
    const updated = await userApi.updateWine(entry.id, { rating, ...(note !== undefined && { note }) })
    Object.assign(entry, updated)
    return updated
  }

  async function removeWine(entryId: string) {
    await userApi.removeWine(entryId)
    myWines.value = myWines.value.filter((w) => w.id !== entryId)
  }

  async function toggleFavorite(wineId: string) {
    const entry = cellarEntry(wineId)
    if (!entry) return addWine(wineId, { favorite: true })
    const favorite = !entry.favorite
    if (!favorite && !entry.scanned && entry.rating === null) {
      await removeWine(entry.id)
      return null
    }
    const updated = await userApi.updateWine(entry.id, { favorite })
    Object.assign(entry, updated)
    ui.haptic()
    return updated
  }

  async function loadUser(userId: string) {
    loadingViewed.value = true
    viewedUser.value = null
    try {
      const [user, posts, reviews] = await Promise.all([
        userApi.profile(userId),
        userApi.posts(userId),
        userApi.reviewsOf(userId),
      ])
      viewedUser.value = user
      viewedPosts.value = posts
      viewedReviews.value = reviews
      return user
    } catch {
      return null
    } finally {
      loadingViewed.value = false
    }
  }

  async function followUser(userId: string) {
    const target = viewedUser.value
    if (!target || target.id !== userId) return
    const wasFollowing = target.isFollowing
    target.isFollowing = !wasFollowing
    target.stats.followers += wasFollowing ? -1 : 1
    try {
      const data = wasFollowing ? await userApi.unfollow(userId) : await userApi.follow(userId)
      target.isFollowing = data.isFollowing
      target.stats.followers = data.followers
      ui.haptic([12, 30, 12])
    } catch {
      target.isFollowing = wasFollowing
      target.stats.followers += wasFollowing ? 1 : -1
    }
  }

  return {
    profile,
    preferences,
    myWines,
    myPosts,
    myReviews,
    favorites,
    scanned,
    rated,
    loadingCellar,
    loadingProfile,
    viewedUser,
    viewedPosts,
    viewedReviews,
    loadingViewed,
    cellarTab,
    isInCellar,
    cellarEntry,
    loadProfile,
    loadMyWines,
    updateProfile,
    savePreferences,
    addWine,
    toggleFavorite,
    rateWine,
    removeWine,
    loadUser,
    followUser,
  }
})
