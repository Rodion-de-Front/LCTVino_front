<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import TopBar from '@/components/layout/TopBar.vue'
import BubblesLoader from '@/components/loaders/BubblesLoader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import BottomSheet from '@/components/ui/BottomSheet.vue'
import GlassButton from '@/components/ui/GlassButton.vue'
import GlassField from '@/components/ui/GlassField.vue'
import LazyImage from '@/components/ui/LazyImage.vue'
import SegmentedControl from '@/components/ui/SegmentedControl.vue'
import StarRating from '@/components/ui/StarRating.vue'
import type { CellarTab } from '@/stores/user'
import { useUserStore } from '@/stores/user'
import type { CellarWine } from '@/types'

const userStore = useUserStore()
const router = useRouter()

const tab = ref<CellarTab>('all')
const sortBy = ref<'recent' | 'rating' | 'name'>('recent')
const sortOpen = ref(false)
const selected = ref<CellarWine | null>(null)
const sheetOpen = ref(false)
const draftRating = ref(0)
const draftNote = ref('')

const segments = computed(() => [
  { value: 'all', label: 'Все', badge: userStore.myWines.length },
  { value: 'favorites', label: 'Избранное', badge: userStore.favorites.length },
  { value: 'scanned', label: 'Сканы', badge: userStore.scanned.length },
  { value: 'rated', label: 'Оценённые', badge: userStore.rated.length },
])

const SORTS = [
  { value: 'recent', label: 'Недавно добавленные' },
  { value: 'rating', label: 'По моей оценке' },
  { value: 'name', label: 'По названию' },
] as const

const items = computed(() => {
  const list = [...userStore.cellarTab(tab.value)]
  if (sortBy.value === 'rating') list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0))
  if (sortBy.value === 'name') list.sort((a, b) => a.wine.name.localeCompare(b.wine.name, 'ru'))
  return list
})

const sortLabel = computed(() => SORTS.find((s) => s.value === sortBy.value)?.label ?? '')

function openDetail(entry: CellarWine) {
  selected.value = entry
  draftRating.value = entry.rating ?? 0
  draftNote.value = entry.note
  sheetOpen.value = true
}

async function saveDetail() {
  if (!selected.value) return
  await userStore.rateWine(selected.value.wineId, draftRating.value, draftNote.value)
  sheetOpen.value = false
}

async function remove() {
  if (!selected.value) return
  await userStore.removeWine(selected.value.id)
  sheetOpen.value = false
}

onMounted(() => {
  if (!userStore.myWines.length) userStore.loadMyWines()
})
</script>

<template>
  <div class="h-full">
    <TopBar title="Мои вина" :searchable="false" />

    <main
      class="scroll-page px-4 pb-[calc(var(--tabbar-h)+var(--safe-bottom)+24px)] pt-[calc(var(--safe-top)+80px)]"
    >
      <SegmentedControl v-model="tab" :segments="segments" />

      <div class="relative mt-3 flex justify-end">
        <button
          type="button"
          class="press flex max-w-full items-center gap-1 rounded-pill bg-white/60 px-3 py-1.5 text-caption text-wine-700"
          @click="sortOpen = !sortOpen"
        >
          <AppIcon name="filter" :size="14" class="shrink-0" />
          <span class="min-w-0 truncate">{{ sortLabel }}</span>
        </button>

        <Transition name="pop">
          <ul
            v-if="sortOpen"
            class="glass-menu absolute right-0 top-9 z-30 w-56 overflow-hidden rounded-glass p-1"
          >
            <li v-for="option in SORTS" :key="option.value">
              <button
                type="button"
                class="flex w-full items-center justify-between rounded-[14px] px-3 py-2.5 text-left text-footnote transition-colors hover:bg-white/60"
                :class="sortBy === option.value ? 'text-wine-600' : 'text-ink'"
                @click="((sortBy = option.value), (sortOpen = false))"
              >
                {{ option.label }}
                <AppIcon v-if="sortBy === option.value" name="check" :size="15" :stroke="2.4" />
              </button>
            </li>
          </ul>
        </Transition>
      </div>

      <div v-if="userStore.loadingCellar" class="flex justify-center py-20">
        <BubblesLoader label="Открываем погреб…" />
      </div>

      <template v-else>
        <div class="mt-3 grid grid-cols-2 gap-3">
          <article
            v-for="(entry, index) in items"
            :key="entry.id"
            v-motion
            :initial="{ opacity: 0, y: 22 }"
            :visible-once="{
              opacity: 1,
              y: 0,
              transition: { duration: 400, delay: Math.min(index * 70, 420) },
            }"
            class="glass lift cursor-pointer rounded-glass p-2.5"
            @click="openDetail(entry)"
          >
            <div class="relative">
              <LazyImage
                :src="entry.wine.image"
                :alt="entry.wine.name"
                ratio="3 / 4"
                rounded="rounded-[16px]"
              />
              <button
                type="button"
                class="press absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/75 backdrop-blur-md transition-colors duration-200"
                :class="entry.favorite ? 'text-wine-600' : 'text-ink-faint'"
                :aria-pressed="entry.favorite"
                :aria-label="entry.favorite ? 'Убрать из избранного' : 'В избранное'"
                @click.stop="userStore.toggleFavorite(entry.wineId)"
              >
                <AppIcon name="heart" :size="18" :filled="entry.favorite" />
              </button>
            </div>
            <h3 class="mt-2 truncate px-1 text-footnote font-semibold text-ink">
              {{ entry.wine.name }}
            </h3>
            <div class="mt-1 flex items-center justify-between px-1 pb-1">
              <StarRating v-if="entry.rating" :model-value="entry.rating" :size="12" />
              <span v-else class="text-caption text-ink-faint">Без оценки</span>
              <span class="text-caption text-ink-faint">{{ entry.wine.year }}</span>
            </div>
          </article>
        </div>

        <div v-if="!items.length" class="py-20 text-center">
          <AppIcon name="bottle" :size="36" class="mx-auto text-ink-faint" />
          <p class="mt-3 text-footnote text-ink-muted">
            {{ tab === 'all' ? 'Погреб пока пуст' : 'Здесь пока ничего нет' }}
          </p>
          <GlassButton class="mt-4" variant="primary" size="sm" @click="router.push('/catalog')">
            Выбрать вино
          </GlassButton>
        </div>
      </template>
    </main>

    <BottomSheet v-model:open="sheetOpen" :title="selected?.wine.name ?? ''">
      <div v-if="selected" class="space-y-5 py-2">
        <div class="flex gap-4">
          <LazyImage
            :src="selected.wine.image"
            :alt="selected.wine.name"
            ratio="3 / 4"
            class="w-24 shrink-0"
            eager
          />
          <div class="min-w-0 flex-1 space-y-1">
            <p class="text-caption uppercase tracking-[0.14em] text-gold">
              {{ selected.wine.producer }}
            </p>
            <p class="text-footnote text-ink">{{ selected.wine.region }}, {{ selected.wine.country }}</p>
            <p class="text-caption text-ink-muted">{{ selected.wine.grapes.join(', ') }}</p>
            <div class="pt-1">
              <StarRating :model-value="selected.wine.rating" :size="14" show-value />
            </div>
          </div>
        </div>

        <div class="flex items-center justify-between gap-3">
          <p class="text-footnote font-medium text-ink-muted">Моя оценка</p>
          <StarRating v-model="draftRating" editable :size="28" />
        </div>

        <GlassField v-model="draftNote" label="Заметка о дегустации" multiline :rows="4" />

        <GlassButton v-if="tab !== 'favorites'" variant="glass" size="md" block @click="remove">
          Удалить
        </GlassButton>
      </div>

      <template #footer>
        <div class="flex gap-2">
          <GlassButton
            variant="glass"
            size="lg"
            block
            @click="selected && router.push(`/wine/${selected.wineId}`)"
          >
            О вине
          </GlassButton>
          <GlassButton variant="primary" size="lg" block @click="saveDetail">Сохранить</GlassButton>
        </div>
      </template>
    </BottomSheet>
  </div>
</template>
