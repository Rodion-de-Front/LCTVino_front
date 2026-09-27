/** Colour and category are independent: a rosé can be still or sparkling. */
export type WineColor = 'red' | 'white' | 'rose' | 'orange'
export type WineCategory = 'still' | 'sparkling' | 'fortified'
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
  color: WineColor
  category: WineCategory
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
  awards: string[]
  taste: TasteProfile
  similarIds: string[]
}

/** Option lists for the catalog filters, derived from the wine collection. */
export interface CatalogFacets {
  regions: string[]
  grapes: string[]
  producers: string[]
  pairings: string[]
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
  scanned: boolean
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

export type CatalogSort = 'rating' | 'price-asc' | 'price-desc' | 'newest' | 'name'

export interface CatalogFilters {
  query: string
  colors: WineColor[]
  categories: WineCategory[]
  sweetness: Sweetness[]
  regions: string[]
  grapes: string[]
  producers: string[]
  pairings: string[]
  minRating: number
  awardedOnly: boolean
  maxPrice: number
  sort: CatalogSort
}
