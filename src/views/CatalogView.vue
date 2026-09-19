<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import TopBar from '@/components/layout/TopBar.vue'
import WineDropsLoader from '@/components/loaders/WineDropsLoader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import BottomSheet from '@/components/ui/BottomSheet.vue'
import GlassButton from '@/components/ui/GlassButton.vue'
import SearchableChecklist from '@/components/ui/SearchableChecklist.vue'
import WineCard from '@/components/wine/WineCard.vue'
import { useInView } from '@/composables/useReveal'
import { MAX_PRICE, useCatalogStore } from '@/stores/catalog'
import { useUiStore } from '@/stores/ui'
import { useUserStore } from '@/stores/user'
import type { CatalogSort, Sweetness, Wine, WineCategory, WineColor } from '@/types'

const catalog = useCatalogStore()
const userStore = useUserStore()
const ui = useUiStore()
const router = useRouter()
const route = useRoute()

const sentinel = ref<HTMLElement | null>(null)
const sortOpen = ref(false)

const COLORS: { value: WineColor; label: string }[] = [
  { value: 'red', label: 'Красное' },
  { value: 'white', label: 'Белое' },
  { value: 'rose', label: 'Розовое' },
  { value: 'orange', label: 'Оранжевое' },
]
const CATEGORIES: { value: WineCategory; label: string }[] = [
  { value: 'still', label: 'Тихое' },
  { value: 'sparkling', label: 'Игристое' },
  { value: 'fortified', label: 'Креплёное' },
]
const SWEETNESS: { value: Sweetness; label: string }[] = [
  { value: 'dry', label: 'Сухое' },
  { value: 'semi-dry', label: 'Полусухое' },
  { value: 'semi-sweet', label: 'Полусладкое' },
  { value: 'sweet', label: 'Сладкое' },
]
const SORTS: { value: CatalogSort; label: string }[] = [
  { value: 'rating', label: 'По рейтингу' },
  { value: 'price-asc', label: 'Сначала дешевле' },
  { value: 'price-desc', label: 'Сначала дороже' },
  { value: 'newest', label: 'Новый урожай' },
  { value: 'name', label: 'По названию' },
]

const query = computed({
  get: () => catalog.filters.query,
  set: (value: string) => (catalog.filters.query = value),
})
const sortLabel = computed(
  () => SORTS.find((s) => s.value === catalog.filters.sort)?.label ?? 'По рейтингу',
)

const filtersOpen = computed({
  get: () => ui.modals.filters,
  set: (value: boolean) => (value ? ui.openModal('filters') : ui.closeModal('filters')),
})

// Debounced search: the store call waits until typing pauses.
let debounce = 0
watch(query, () => {
  window.clearTimeout(debounce)
  debounce = window.setTimeout(() => catalog.searchWines(), 300)
})

// Any filter change re-runs the search; the query itself is debounced above.
watch(
  () => {
    const { query: _query, ...rest } = catalog.filters
    return rest
  },
  () => catalog.searchWines(),
  { deep: true },
)

useInView(sentinel, () => catalog.loadMore())

function openWine(wine: Wine) {
  router.push(`/wine/${wine.id}`)
}

async function toggleFavorite(wine: Wine) {
  await userStore.toggleFavorite(wine.id)
}

function pickSort(value: CatalogSort) {
  catalog.filters.sort = value
  sortOpen.value = false
}

onMounted(() => {
  const q = route.query.q
  if (typeof q === 'string') catalog.filters.query = q
  if (!catalog.wines.length || q) catalog.searchWines()
  catalog.loadFacets()
  if (!userStore.myWines.length) userStore.loadMyWines()
})
</script>

<template>
  <div class="h-full">
    <TopBar title="Каталог" :searchable="false" />

    <main
      class="scroll-page px-4 pb-[calc(var(--tabbar-h)+var(--safe-bottom)+24px)] pt-[calc(var(--safe-top)+80px)]"
    >
      <!-- Search + filter row -->
      <div class="sticky top-0 z-20 -mx-4 bg-gradient-to-b from-cream-soft/80 to-transparent px-4 pb-3 pt-1 backdrop-blur-sm">
        <div class="flex items-center gap-2">
          <label class="glass flex h-12 flex-1 items-center gap-2.5 rounded-pill px-4">
            <AppIcon name="search" :size="19" class="shrink-0 text-ink-faint" />
            <input
              v-model="query"
              type="search"
              placeholder="Вино, производитель, сорт…"
              class="min-w-0 flex-1 text-footnote text-ink placeholder:text-ink-faint"
            />
            <button
              v-if="query"
              type="button"
              class="press shrink-0 text-ink-faint"
              aria-label="Очистить"
              @click="query = ''"
            >
              <AppIcon name="close" :size="17" />
            </button>
          </label>

          <button
            type="button"
            class="press glass relative flex h-12 w-12 items-center justify-center rounded-full text-wine-600"
            aria-label="Фильтры"
            @click="filtersOpen = true"
          >
            <AppIcon name="sliders" :size="21" />
            <span
              v-if="catalog.activeFilterCount"
              class="absolute -right-0.5 -top-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-pill bg-gradient-to-br from-wine-500 to-wine-700 px-1 text-[10px] font-semibold text-white"
            >
              {{ catalog.activeFilterCount }}
            </span>
          </button>
        </div>

        <div class="mt-2 flex items-center justify-between gap-2">
          <p class="text-caption text-ink-muted">Найдено: {{ catalog.total }}</p>

          <div class="relative">
            <button
              type="button"
              class="press flex items-center gap-1 rounded-pill bg-white/60 px-3 py-1.5 text-caption text-wine-700"
              @click="sortOpen = !sortOpen"
            >
              {{ sortLabel }}
              <AppIcon
                name="chevronDown"
                :size="14"
                class="transition-transform duration-300"
                :class="sortOpen && 'rotate-180'"
              />
            </button>

            <Transition name="pop">
              <ul
                v-if="sortOpen"
                class="glass-strong absolute right-0 top-10 z-30 w-52 overflow-hidden rounded-glass p-1"
              >
                <li v-for="option in SORTS" :key="option.value">
                  <button
                    type="button"
                    class="flex w-full items-center justify-between rounded-[14px] px-3 py-2.5 text-left text-footnote transition-colors hover:bg-white/60"
                    :class="catalog.filters.sort === option.value ? 'text-wine-600' : 'text-ink'"
                    @click="pickSort(option.value)"
                  >
                    {{ option.label }}
                    <AppIcon
                      v-if="catalog.filters.sort === option.value"
                      name="check"
                      :size="15"
                      :stroke="2.4"
                    />
                  </button>
                </li>
              </ul>
            </Transition>
          </div>
        </div>
      </div>

      <div v-if="catalog.loading" class="flex justify-center py-20">
        <WineDropsLoader label="Подбираем вина…" />
      </div>

      <template v-else>
        <div class="grid grid-cols-2 gap-3">
          <WineCard
            v-for="(wine, index) in catalog.wines"
            :key="wine.id"
            :wine="wine"
            :index="index"
            :favorite="userStore.cellarEntry(wine.id)?.favorite ?? false"
            @open="openWine"
            @favorite="toggleFavorite"
          />
        </div>

        <div v-if="!catalog.wines.length" class="py-20 text-center">
          <AppIcon name="search" :size="34" class="mx-auto text-ink-faint" />
          <p class="mt-3 text-footnote text-ink-muted">Ничего не нашлось</p>
          <GlassButton class="mt-4" variant="glass" size="sm" @click="catalog.resetFilters()">
            Сбросить фильтры
          </GlassButton>
        </div>

        <div ref="sentinel" class="h-8" />
        <div v-if="catalog.loadingMore" class="flex justify-center py-4">
          <WineDropsLoader :count="3" />
        </div>
      </template>
    </main>

    <!-- Filters bottom sheet -->
    <BottomSheet v-model:open="filtersOpen" title="Фильтры">
      <div class="space-y-6 py-2">
        <section>
          <p class="mb-2.5 text-footnote font-medium text-ink-muted">Цвет</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="color in COLORS"
              :key="color.value"
              v-ripple="'rgba(114,47,55,0.14)'"
              type="button"
              class="press rounded-pill border px-4 py-2 text-footnote transition-all duration-300"
              :class="
                catalog.filters.colors.includes(color.value)
                  ? 'border-transparent bg-gradient-to-br from-wine-500 to-wine-700 text-white shadow-float'
                  : 'border-white/70 bg-white/50 text-ink'
              "
              @click="catalog.toggleIn(catalog.filters.colors, color.value)"
            >
              {{ color.label }}
            </button>
          </div>
        </section>

        <section>
          <p class="mb-2.5 text-footnote font-medium text-ink-muted">Категория</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="option in CATEGORIES"
              :key="option.value"
              type="button"
              class="press rounded-pill border px-4 py-2 text-footnote transition-all duration-300"
              :class="
                catalog.filters.categories.includes(option.value)
                  ? 'border-transparent bg-gradient-to-br from-wine-500 to-wine-700 text-white shadow-float'
                  : 'border-white/70 bg-white/50 text-ink'
              "
              @click="catalog.toggleIn(catalog.filters.categories, option.value)"
            >
              {{ option.label }}
            </button>
          </div>
        </section>

        <section>
          <p class="mb-2.5 text-footnote font-medium text-ink-muted">Сладость</p>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="option in SWEETNESS"
              :key="option.value"
              type="button"
              class="press rounded-pill border px-4 py-2 text-footnote transition-all duration-300"
              :class="
                catalog.filters.sweetness.includes(option.value)
                  ? 'border-transparent bg-gradient-to-br from-wine-500 to-wine-700 text-white shadow-float'
                  : 'border-white/70 bg-white/50 text-ink'
              "
              @click="catalog.toggleIn(catalog.filters.sweetness, option.value)"
            >
              {{ option.label }}
            </button>
          </div>
        </section>

        <SearchableChecklist
          title="Регион"
          all-label="Все регионы"
          placeholder="Поиск региона"
          :options="catalog.facets.regions"
          :selected="catalog.filters.regions"
          @toggle="catalog.toggleIn(catalog.filters.regions, $event)"
          @clear="catalog.filters.regions = []"
        />

        <SearchableChecklist
          title="Сорт винограда"
          all-label="Все сорта винограда"
          placeholder="Поиск сорта"
          :options="catalog.facets.grapes"
          :selected="catalog.filters.grapes"
          @toggle="catalog.toggleIn(catalog.filters.grapes, $event)"
          @clear="catalog.filters.grapes = []"
        />

        <SearchableChecklist
          title="Производитель"
          all-label="Все производители"
          placeholder="Поиск производителя"
          :options="catalog.facets.producers"
          :selected="catalog.filters.producers"
          @toggle="catalog.toggleIn(catalog.filters.producers, $event)"
          @clear="catalog.filters.producers = []"
        />

        <SearchableChecklist
          title="Гастросочетания"
          all-label="Все гастросочетания"
          placeholder="Поиск блюда"
          :options="catalog.facets.pairings"
          :selected="catalog.filters.pairings"
          @toggle="catalog.toggleIn(catalog.filters.pairings, $event)"
          @clear="catalog.filters.pairings = []"
        />

        <section>
          <p class="mb-2.5 text-footnote font-medium text-ink-muted">Рейтинги и награды</p>

          <div class="mb-2 flex items-center justify-between">
            <span class="text-caption text-ink-muted">Рейтинг от</span>
            <span class="text-footnote font-semibold text-wine-600">
              {{ catalog.filters.minRating.toFixed(1) }}
            </span>
          </div>
          <input
            v-model.number="catalog.filters.minRating"
            type="range"
            min="0"
            max="5"
            step="0.5"
            class="w-full accent-wine-600"
          />

          <button
            type="button"
            class="press mt-3 flex w-full items-center gap-2.5 rounded-glass border px-3.5 py-2.5 text-left text-footnote transition-all duration-300"
            :class="
              catalog.filters.awardedOnly
                ? 'border-transparent bg-gradient-to-br from-wine-500 to-wine-700 text-white shadow-float'
                : 'border-white/70 bg-white/50 text-ink'
            "
            :aria-pressed="catalog.filters.awardedOnly"
            @click="catalog.filters.awardedOnly = !catalog.filters.awardedOnly"
          >
            <AppIcon name="sparkles" :size="18" />
            Только отмеченные наградами
          </button>
        </section>

        <section>
          <div class="mb-2 flex items-center justify-between">
            <p class="text-footnote font-medium text-ink-muted">Цена до</p>
            <span class="text-footnote font-semibold text-wine-600">
              {{ catalog.filters.maxPrice.toLocaleString('ru-RU') }} ₽
            </span>
          </div>
          <input
            v-model.number="catalog.filters.maxPrice"
            type="range"
            min="1000"
            :max="MAX_PRICE"
            step="100"
            class="w-full accent-wine-600"
          />
        </section>
      </div>

      <template #footer>
        <div class="flex gap-2">
          <GlassButton variant="glass" size="lg" block @click="catalog.resetFilters()">
            Сбросить
          </GlassButton>
          <GlassButton variant="primary" size="lg" block @click="filtersOpen = false">
            Показать {{ catalog.total }}
          </GlassButton>
        </div>
      </template>
    </BottomSheet>
  </div>
</template>
