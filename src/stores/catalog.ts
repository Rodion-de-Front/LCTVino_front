import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { catalogApi, type WineDetail } from '@/api'
import { errorMessage } from '@/api/client'
import type { CatalogFilters, Wine } from '@/types'

export const REGIONS = ['Крым', 'Краснодарский край', 'Франция', 'Италия'] as const
export const MAX_PRICE = 7000

const emptyFilters = (): CatalogFilters => ({
  query: '',
  types: [],
  sweetness: [],
  regions: [],
  minRating: 0,
  maxPrice: MAX_PRICE,
  sort: 'rating',
})

export const useCatalogStore = defineStore('catalog', () => {
  const wines = ref<Wine[]>([])
  const filters = ref<CatalogFilters>(emptyFilters())
  const loading = ref(false)
  const loadingMore = ref(false)
  const hasMore = ref(false)
  const page = ref(1)
  const total = ref(0)
  const error = ref<string | null>(null)

  const detailCache = ref<Record<string, WineDetail>>({})
  const currentWine = ref<WineDetail | null>(null)
  const detailLoading = ref(false)

  const activeFilterCount = computed(() => {
    const f = filters.value
    return (
      f.types.length +
      f.sweetness.length +
      f.regions.length +
      (f.minRating > 0 ? 1 : 0) +
      (f.maxPrice < MAX_PRICE ? 1 : 0)
    )
  })

  async function searchWines({ reset = true } = {}) {
    loading.value = reset
    error.value = null
    try {
      const data = await catalogApi.search(filters.value, 1)
      wines.value = data.items
      page.value = data.page
      hasMore.value = data.hasMore
      total.value = data.total
    } catch (e) {
      error.value = errorMessage(e, 'Каталог недоступен')
    } finally {
      loading.value = false
    }
  }

  async function loadMore() {
    if (!hasMore.value || loadingMore.value) return
    loadingMore.value = true
    try {
      const data = await catalogApi.search(filters.value, page.value + 1)
      wines.value.push(...data.items)
      page.value = data.page
      hasMore.value = data.hasMore
    } finally {
      loadingMore.value = false
    }
  }

  async function loadWine(wineId: string) {
    const cached = detailCache.value[wineId]
    currentWine.value = cached ?? null
    detailLoading.value = !cached
    try {
      const detail = await catalogApi.wine(wineId)
      detailCache.value[wineId] = detail
      currentWine.value = detail
      return detail
    } catch (e) {
      if (!cached) error.value = errorMessage(e, 'Вино не найдено')
      return cached ?? null
    } finally {
      detailLoading.value = false
    }
  }

  async function addReview(wineId: string, rating: number, text: string) {
    const review = await catalogApi.addReview(wineId, rating, text)
    const detail = detailCache.value[wineId]
    if (detail) detail.reviews = [review, ...detail.reviews]
    return review
  }

  function resetFilters() {
    filters.value = emptyFilters()
  }

  function toggleIn<T>(list: T[], value: T) {
    const index = list.indexOf(value)
    index === -1 ? list.push(value) : list.splice(index, 1)
  }

  return {
    wines,
    filters,
    loading,
    loadingMore,
    hasMore,
    page,
    total,
    error,
    currentWine,
    detailLoading,
    activeFilterCount,
    searchWines,
    loadMore,
    loadWine,
    addReview,
    resetFilters,
    toggleIn,
  }
})
