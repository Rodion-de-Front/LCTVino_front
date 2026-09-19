export type WineType = 'red' | 'white' | 'rose' | 'sparkling'
export type Sweetness = 'dry' | 'semi-dry' | 'semi-sweet' | 'sweet'
export type Body = 'light' | 'medium' | 'full'
export type Level = 'low' | 'medium' | 'high'

export interface TasteProfile {
  /** Values are on a 1–5 scale, used by the animated profile bars. */
  body: number
  tannins: number
  acidity: number
  sweetness: number
  fruitiness: number
}

export interface Wine {
  id: string
  name: string
  producer: string
  country: string
  region: string
  type: WineType
  sweetness: Sweetness
  grapes: string[]
  year: number
  abv: number
  price: number
  rating: number
  ratingsCount: number
  image: string
  description: string
  pairing: string[]
  taste: TasteProfile
  similarIds: string[]
}

export interface User {
  id: string
  name: string
  email?: string
  avatar: string
  bio: string
  location: string
  stats: {
    posts: number
    reviews: number
    followers: number
    following: number
  }
  isFollowing?: boolean
}

export interface Comment {
  id: string
  postId: string
  author: Pick<User, 'id' | 'name' | 'avatar'>
  text: string
  createdAt: string
}

export interface Post {
  id: string
  author: Pick<User, 'id' | 'name' | 'avatar'>
  wineId: string
  wineName: string
  image: string
  text: string
  rating: number
  tags: string[]
  likes: number
  likedByMe: boolean
  savedByMe: boolean
  commentsCount: number
  comments: Comment[]
  createdAt: string
}

export interface Review {
  id: string
  wineId: string
  author: Pick<User, 'id' | 'name' | 'avatar'>
  rating: number
  text: string
  createdAt: string
}

export interface CellarWine {
  id: string
  wineId: string
  wine: Wine
  favorite: boolean
  rating: number | null
  note: string
  addedAt: string
}

export interface Preferences {
  wineType: string
  sweetness: string
  body: string
  tannins: string
  acidity: string
  grapes: string[]
  regions: string[]
}

export interface AuthUser extends User {
  email: string
  onboarded: boolean
  preferences: Preferences | null
}

export interface AuthResponse {
  token: string
  user: AuthUser
}

export interface ScanResult {
  wine: Wine
  confidence: number
  scannedAt: string
  source: 'label' | 'qr'
}

export interface Paginated<T> {
  items: T[]
  page: number
  perPage: number
  total: number
  hasMore: boolean
}

export interface AppNotification {
  id: string
  type: 'success' | 'error' | 'info'
  title: string
  description?: string
}

export type CatalogSort = 'rating' | 'price-asc' | 'price-desc' | 'newest' | 'name'

export interface CatalogFilters {
  query: string
  types: WineType[]
  sweetness: Sweetness[]
  regions: string[]
  minRating: number
  maxPrice: number
  sort: CatalogSort
}
