import { iso } from './http'

export interface UserRow {
  id: string
  name: string
  email: string
  password_hash: string | null
  avatar: string
  bio: string
  location: string
  onboarded: boolean
  preferences: Record<string, unknown> | null
  posts_count: number
  reviews_count: number
  followers_count: number
  following_count: number
}

export interface WineRow {
  id: string
  name: string
  producer: string
  country: string
  region: string
  color: string
  category: string
  sweetness: string
  grapes: string[]
  year: number
  abv: number
  price: number
  rating: number
  ratings_count: number
  image: string
  description: string
  pairing: string[]
  awards: string[]
  taste: {
    body: number
    tannins: number
    acidity: number
    sweetness: number
    fruitiness: number
  }
  similar_ids: string[]
}

export function mapUser(row: UserRow, isFollowing = false) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatar: row.avatar,
    bio: row.bio,
    location: row.location,
    stats: {
      posts: row.posts_count,
      reviews: row.reviews_count,
      followers: row.followers_count,
      following: row.following_count,
    },
    isFollowing,
  }
}

export function mapAuthUser(row: UserRow) {
  return {
    ...mapUser(row, false),
    email: row.email,
    onboarded: row.onboarded,
    preferences: row.preferences,
  }
}

export function mapWine(row: WineRow) {
  return {
    id: row.id,
    name: row.name,
    producer: row.producer,
    country: row.country,
    region: row.region,
    color: row.color,
    category: row.category,
    sweetness: row.sweetness,
    grapes: row.grapes ?? [],
    year: row.year,
    abv: Number(row.abv),
    price: row.price,
    rating: Number(row.rating),
    ratingsCount: row.ratings_count,
    image: row.image,
    description: row.description,
    pairing: row.pairing ?? [],
    awards: row.awards ?? [],
    taste: row.taste,
    similarIds: row.similar_ids ?? [],
  }
}

export function mapComment(row: {
  id: string
  post_id: string
  text: string
  created_at: Date | string
  author_id: string
  author_name: string
  author_avatar: string
}) {
  return {
    id: row.id,
    postId: row.post_id,
    author: { id: row.author_id, name: row.author_name, avatar: row.author_avatar },
    text: row.text,
    createdAt: iso(row.created_at),
  }
}

export function mapReview(row: {
  id: string
  wine_id: string
  rating: number
  text: string
  created_at: Date | string
  author_id: string
  author_name: string
  author_avatar: string
}) {
  return {
    id: row.id,
    wineId: row.wine_id,
    author: { id: row.author_id, name: row.author_name, avatar: row.author_avatar },
    rating: row.rating,
    text: row.text,
    createdAt: iso(row.created_at),
  }
}
