import { defineStore } from 'pinia'
import { computed, ref, shallowRef, type Ref } from 'vue'
import { feedApi } from '@/api'
import { errorMessage } from '@/api/client'
import type { Post } from '@/types'
import { useUiStore } from './ui'

const PER_PAGE = 4

export const useFeedStore = defineStore('feed', () => {
  const ui = useUiStore()
  const posts = ref<Post[]>([])
  const page = ref(1)
  const hasMore = ref(true)
  const loading = ref(false)
  const loadingMore = ref(false)
  const refreshing = ref(false)
  const error = ref<string | null>(null)

  // A post can be on screen in more than one list — the feed and a profile,
  // for instance. Views register their list so a like reaches every copy.
  const mirrors = shallowRef<Ref<Post[]>[]>([])

  function trackPosts(list: Ref<Post[]>) {
    mirrors.value = [...mirrors.value, list]
    return () => {
      mirrors.value = mirrors.value.filter((other) => other !== list)
    }
  }

  function copiesOf(postId: string | null) {
    if (!postId) return []
    return [posts, ...mirrors.value]
      .map((list) => list.value.find((p) => p.id === postId))
      .filter((p): p is Post => Boolean(p))
  }

  const activePostId = ref<string | null>(null)
  const activePost = computed(() => copiesOf(activePostId.value)[0] ?? null)

  async function loadFeed({ refresh = false } = {}) {
    if (loading.value) return
    refresh ? (refreshing.value = true) : (loading.value = true)
    error.value = null
    try {
      const data = await feedApi.list(1, PER_PAGE)
      posts.value = data.items
      page.value = data.page
      hasMore.value = data.hasMore
    } catch (e) {
      error.value = errorMessage(e, 'Лента недоступна')
    } finally {
      loading.value = false
      refreshing.value = false
    }
  }

  async function loadMore() {
    if (loadingMore.value || !hasMore.value || loading.value) return
    loadingMore.value = true
    try {
      const data = await feedApi.list(page.value + 1, PER_PAGE)
      const known = new Set(posts.value.map((p) => p.id))
      posts.value.push(...data.items.filter((p) => !known.has(p.id)))
      page.value = data.page
      hasMore.value = data.hasMore
    } catch (e) {
      error.value = errorMessage(e, 'Не удалось загрузить ещё')
    } finally {
      loadingMore.value = false
    }
  }

  async function likePost(postId: string) {
    const copies = copiesOf(postId)
    if (!copies.length) return
    // Optimistic: the like animation must not wait for the round-trip.
    const previous = { likes: copies[0].likes, likedByMe: copies[0].likedByMe }
    const liked = !previous.likedByMe
    copies.forEach((post) => {
      post.likedByMe = liked
      post.likes = previous.likes + (liked ? 1 : -1)
    })
    ui.haptic(liked ? [8, 24, 12] : 8)
    try {
      const data = await feedApi.like(postId)
      copies.forEach((post) => {
        post.likes = data.likes
        post.likedByMe = data.likedByMe
      })
    } catch {
      copies.forEach((post) => Object.assign(post, previous))
    }
  }

  async function addComment(postId: string, text: string) {
    const copies = copiesOf(postId)
    if (!copies.length || !text.trim()) return
    try {
      const comment = await feedApi.comment(postId, text.trim())
      copies.forEach((post) => {
        post.comments.push(comment)
        post.commentsCount = post.comments.length
      })
    } catch {
    }
  }

  async function createPost(payload: {
    wineId: string
    text: string
    rating: number
    tags?: string[]
  }) {
    const post = await feedApi.create(payload)
    posts.value.unshift(post)
    return post
  }

  function openComments(postId: string) {
    activePostId.value = postId
    ui.openModal('comments')
  }
  function closeComments() {
    ui.closeModal('comments')
    activePostId.value = null
  }

  return {
    posts,
    page,
    hasMore,
    loading,
    loadingMore,
    refreshing,
    error,
    activePost,
    activePostId,
    loadFeed,
    loadMore,
    trackPosts,
    likePost,
    addComment,
    createPost,
    openComments,
    closeComments,
  }
})
