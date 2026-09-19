import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
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

  const activePostId = ref<string | null>(null)
  const activePost = computed(() => posts.value.find((p) => p.id === activePostId.value) ?? null)

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
    const post = posts.value.find((p) => p.id === postId)
    if (!post) return
    // Optimistic: the heart animation must not wait for the round-trip.
    const previous = { likes: post.likes, likedByMe: post.likedByMe }
    post.likedByMe = !post.likedByMe
    post.likes += post.likedByMe ? 1 : -1
    ui.haptic(post.likedByMe ? [8, 24, 12] : 8)
    try {
      const data = await feedApi.like(postId)
      post.likes = data.likes
      post.likedByMe = data.likedByMe
    } catch {
      Object.assign(post, previous)
      ui.notify({ type: 'error', title: 'Лайк не сохранился' })
    }
  }

  async function toggleSave(postId: string) {
    const post = posts.value.find((p) => p.id === postId)
    if (!post) return
    post.savedByMe = !post.savedByMe
    try {
      const data = await feedApi.save(postId)
      post.savedByMe = data.savedByMe
      ui.notify({
        type: 'success',
        title: data.savedByMe ? 'Сохранено' : 'Удалено из сохранённых',
      })
    } catch {
      post.savedByMe = !post.savedByMe
    }
  }

  async function addComment(postId: string, text: string) {
    const post = posts.value.find((p) => p.id === postId)
    if (!post || !text.trim()) return
    try {
      const comment = await feedApi.comment(postId, text.trim())
      post.comments.push(comment)
      post.commentsCount = post.comments.length
    } catch (e) {
      ui.notify({ type: 'error', title: errorMessage(e, 'Комментарий не отправлен') })
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
    ui.notify({ type: 'success', title: 'Пост опубликован' })
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
    likePost,
    toggleSave,
    addComment,
    createPost,
    openComments,
    closeComments,
  }
})
