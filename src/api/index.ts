import type {
  AuthResponse,
  AuthUser,
  CatalogFacets,
  CatalogFilters,
  CellarWine,
  Comment,
  Paginated,
  Post,
  Preferences,
  Review,
  ScanResult,
  User,
  Wine,
} from '@/types'
import { api } from './client'

export interface WineDetail extends Wine {
  similar: Wine[]
  reviews: Review[]
}

export const authApi = {
  login: (email: string, password: string) =>
    api.post<AuthResponse>('/auth/login', { email, password }).then((r) => r.data),
  register: (payload: { email: string; password: string; name: string }) =>
    api.post<AuthResponse>('/auth/register', payload).then((r) => r.data),
  logout: () => api.post('/auth/logout').then(() => undefined),
  me: () => api.get<AuthUser>('/auth/me').then((r) => r.data),
}

export const feedApi = {
  list: (page: number, perPage = 4) =>
    api.get<Paginated<Post>>('/feed', { params: { page, perPage } }).then((r) => r.data),
  like: (postId: string) =>
    api
      .post<{ likes: number; likedByMe: boolean }>(`/posts/${postId}/like`)
      .then((r) => r.data),
  comment: (postId: string, text: string) =>
    api.post<Comment>(`/posts/${postId}/comments`, { text }).then((r) => r.data),
  create: (payload: { wineId: string; text: string; rating: number; tags?: string[] }) =>
    api.post<Post>('/posts', payload).then((r) => r.data),
  byAuthor: (authorId: string) =>
    api
      .get<Paginated<Post>>('/posts', { params: { authorId, perPage: 50 } })
      .then((r) => r.data.items),
}

function filterParams(filters: CatalogFilters, page: number, perPage: number) {
  const params = new URLSearchParams()
  if (filters.query) params.set('query', filters.query)
  filters.colors.forEach((c) => params.append('color', c))
  filters.categories.forEach((c) => params.append('category', c))
  filters.sweetness.forEach((s) => params.append('sweetness', s))
  filters.regions.forEach((r) => params.append('region', r))
  filters.grapes.forEach((g) => params.append('grape', g))
  filters.producers.forEach((p) => params.append('producer', p))
  filters.pairings.forEach((p) => params.append('pairing', p))
  if (filters.minRating > 0) params.set('minRating', String(filters.minRating))
  if (filters.awardedOnly) params.set('awarded', '1')
  if (Number.isFinite(filters.maxPrice)) params.set('maxPrice', String(filters.maxPrice))
  params.set('sort', filters.sort)
  params.set('page', String(page))
  params.set('perPage', String(perPage))
  return params
}

export const catalogApi = {
  search: (filters: CatalogFilters, page = 1, perPage = 12) =>
    api
      .get<Paginated<Wine>>('/wines', { params: filterParams(filters, page, perPage) })
      .then((r) => r.data),
  facets: () => api.get<CatalogFacets>('/wines/facets').then((r) => r.data),
  wine: (wineId: string) => api.get<WineDetail>(`/wines/${wineId}`).then((r) => r.data),
  reviews: (wineId: string) => api.get<Review[]>(`/wines/${wineId}/reviews`).then((r) => r.data),
  addReview: (wineId: string, rating: number, text: string) =>
    api.post<Review>(`/wines/${wineId}/reviews`, { rating, text }).then((r) => r.data),
}

export const scanApi = {
  label: (image?: string) =>
    api.post<ScanResult>('/scan/label', { image }).then((r) => r.data),
  qr: (code: string) => api.post<ScanResult>('/scan/qr', { code }).then((r) => r.data),
}

export const userApi = {
  me: () => api.get<AuthUser>('/users/me').then((r) => r.data),
  update: (patch: Partial<Pick<User, 'name' | 'bio' | 'location' | 'avatar'>>) =>
    api.patch<AuthUser>('/users/me', patch).then((r) => r.data),
  savePreferences: (preferences: Preferences) =>
    api.patch<AuthUser>('/users/me', { preferences, onboarded: true }).then((r) => r.data),
  cellar: () => api.get<CellarWine[]>('/users/me/wines').then((r) => r.data),
  addWine: (payload: {
    wineId: string
    favorite?: boolean
    scanned?: boolean
    rating?: number | null
    note?: string
  }) =>
    api.post<CellarWine>('/users/me/wines', payload).then((r) => r.data),
  updateWine: (entryId: string, patch: Partial<Pick<CellarWine, 'favorite' | 'scanned' | 'rating' | 'note'>>) =>
    api.patch<CellarWine>(`/users/me/wines/${entryId}`, patch).then((r) => r.data),
  removeWine: (entryId: string) => api.delete(`/users/me/wines/${entryId}`).then(() => undefined),
  profile: (userId: string) => api.get<User>(`/users/${userId}`).then((r) => r.data),
  posts: (userId: string) => api.get<Post[]>(`/users/${userId}/posts`).then((r) => r.data),
  reviewsOf: (userId: string) => api.get<Review[]>(`/users/${userId}/reviews`).then((r) => r.data),
  follow: (userId: string) =>
    api
      .post<{ isFollowing: boolean; followers: number }>(`/users/${userId}/follow`)
      .then((r) => r.data),
  unfollow: (userId: string) =>
    api
      .delete<{ isFollowing: boolean; followers: number }>(`/users/${userId}/follow`)
      .then((r) => r.data),
}
