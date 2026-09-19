<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SpinningBottleLoader from '@/components/loaders/SpinningBottleLoader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import BottomSheet from '@/components/ui/BottomSheet.vue'
import GlassButton from '@/components/ui/GlassButton.vue'
import GlassField from '@/components/ui/GlassField.vue'
import LazyImage from '@/components/ui/LazyImage.vue'
import StarRating from '@/components/ui/StarRating.vue'
import TasteProfileBars from '@/components/wine/TasteProfileBars.vue'
import { burst } from '@/composables/useConfetti'
import { useCatalogStore } from '@/stores/catalog'
import { useUiStore } from '@/stores/ui'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const catalog = useCatalogStore()
const userStore = useUserStore()
const ui = useUiStore()

const scroller = ref<HTMLElement | null>(null)
const scrollY = ref(0)
const reviewOpen = ref(false)
const myRating = ref(4)
const myNote = ref('')
const saving = ref(false)

const wineId = computed(() => String(route.params.wineId))
const wine = computed(() => catalog.currentWine)
const entry = computed(() => userStore.cellarEntry(wineId.value))

const TYPE_LABELS: Record<string, string> = {
  red: 'Красное',
  white: 'Белое',
  rose: 'Розовое',
  sparkling: 'Игристое',
}
const SWEETNESS_LABELS: Record<string, string> = {
  dry: 'сухое',
  'semi-dry': 'полусухое',
  'semi-sweet': 'полусладкое',
  sweet: 'сладкое',
}

const facts = computed(() =>
  wine.value
    ? [
        { icon: 'location', label: 'Регион', value: `${wine.value.region}, ${wine.value.country}` },
        { icon: 'grape', label: 'Сорта', value: wine.value.grapes.join(', ') },
        {
          icon: 'glass',
          label: 'Тип',
          value: `${TYPE_LABELS[wine.value.type]}, ${SWEETNESS_LABELS[wine.value.sweetness]}`,
        },
        { icon: 'sparkles', label: 'Урожай и крепость', value: `${wine.value.year} · ${wine.value.abv}%` },
      ]
    : [],
)

const onScroll = (event: Event) => (scrollY.value = (event.target as HTMLElement).scrollTop)

async function addToCellar() {
  if (!wine.value) return
  await userStore.addWine(wine.value.id)
}

async function toggleFavorite(event: MouseEvent) {
  if (!wine.value) return
  const wasFavorite = entry.value?.favorite ?? false
  await userStore.toggleFavorite(wine.value.id)
  if (!wasFavorite) {
    burst(event.currentTarget as HTMLElement, { count: 12, power: 90, shape: 'heart' })
  }
}

async function submitReview() {
  if (!wine.value) return
  saving.value = true
  try {
    await catalog.addReview(wine.value.id, myRating.value, myNote.value.trim())
    await userStore.rateWine(wine.value.id, myRating.value, myNote.value.trim())
    reviewOpen.value = false
    myNote.value = ''
  } catch {
    ui.notify({ type: 'error', title: 'Отзыв не сохранился' })
  } finally {
    saving.value = false
  }
}

watch(wineId, (id) => id && catalog.loadWine(id))
onMounted(() => {
  catalog.loadWine(wineId.value)
  if (!userStore.myWines.length) userStore.loadMyWines()
})
</script>

<template>
  <div class="h-full">
    <button
      type="button"
      class="press glass-strong fixed left-4 top-[calc(var(--safe-top)+12px)] z-40 flex h-11 w-11 items-center justify-center rounded-full text-wine-700"
      aria-label="Назад"
      @click="router.back()"
    >
      <AppIcon name="chevronLeft" :size="21" />
    </button>

    <div v-if="catalog.detailLoading && !wine" class="flex h-full items-center justify-center">
      <SpinningBottleLoader label="Открываем бутылку…" />
    </div>

    <main
      v-else-if="wine"
      ref="scroller"
      class="scroll-page pb-[calc(var(--tabbar-h)+var(--safe-bottom)+32px)]"
      @scroll.passive="onScroll"
    >
      <!-- Parallax hero -->
      <div class="relative h-[52vh] overflow-hidden">
        <div
          class="absolute inset-0"
          :style="{ transform: `translateY(${scrollY * 0.42}px) scale(${1 + scrollY * 0.0006})` }"
        >
          <LazyImage
            :src="wine.image"
            :alt="wine.name"
            ratio="auto"
            rounded="rounded-none"
            eager
            class="!h-[52vh]"
          />
        </div>
        <div class="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-cream-soft to-transparent" />
      </div>

      <div class="relative -mt-16 space-y-4 px-4">
        <section
          v-motion
          :initial="{ opacity: 0, y: 26 }"
          :enter="{ opacity: 1, y: 0, transition: { duration: 460 } }"
          class="glass-strong rounded-sheet p-5"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0">
              <p class="text-caption uppercase tracking-[0.14em] text-gold">{{ wine.producer }}</p>
              <h1 class="mt-1 text-title-lg text-ink">{{ wine.name }}</h1>
            </div>
            <button
              type="button"
              class="press flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/70"
              :class="entry?.favorite ? 'text-wine-600' : 'text-ink-faint'"
              :aria-label="entry?.favorite ? 'Убрать из избранного' : 'В избранное'"
              @click="toggleFavorite"
            >
              <AppIcon name="heart" :size="22" :filled="entry?.favorite ?? false" />
            </button>
          </div>

          <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <StarRating :model-value="wine.rating" :size="18" show-value animate-in />
            <span class="text-caption text-ink-muted">{{ wine.ratingsCount }} оценок</span>
            <span class="ml-auto text-title font-semibold text-wine-600">
              {{ wine.price.toLocaleString('ru-RU') }} ₽
            </span>
          </div>

          <div class="mt-4 flex gap-2">
            <GlassButton variant="primary" size="md" block @click="addToCellar">
              <AppIcon name="plus" :size="18" />
              {{ entry ? 'В погребе' : 'В погреб' }}
            </GlassButton>
            <GlassButton variant="gold" size="md" block @click="reviewOpen = true">
              <AppIcon name="star" :size="18" />
              Оценить
            </GlassButton>
          </div>
        </section>

        <section
          v-motion
          :initial="{ opacity: 0, y: 26 }"
          :enter="{ opacity: 1, y: 0, transition: { duration: 460, delay: 90 } }"
          class="glass rounded-sheet p-5"
        >
          <h2 class="text-title text-ink">О вине</h2>
          <p class="mt-2 text-body leading-relaxed text-ink">{{ wine.description }}</p>

          <ul class="mt-4 space-y-3">
            <li v-for="fact in facts" :key="fact.label" class="flex items-start gap-3">
              <span
                class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/70 text-wine-600"
              >
                <AppIcon :name="fact.icon" :size="18" />
              </span>
              <div class="min-w-0">
                <p class="text-caption text-ink-faint">{{ fact.label }}</p>
                <p class="text-footnote text-ink">{{ fact.value }}</p>
              </div>
            </li>
          </ul>
        </section>

        <section
          v-motion
          :initial="{ opacity: 0, y: 26 }"
          :enter="{ opacity: 1, y: 0, transition: { duration: 460, delay: 160 } }"
          class="glass rounded-sheet p-5"
        >
          <h2 class="mb-4 text-title text-ink">Вкусовой профиль</h2>
          <TasteProfileBars :taste="wine.taste" />

          <div class="mt-5">
            <p class="mb-2 text-footnote text-ink-muted">Сочетается с</p>
            <div class="flex flex-wrap gap-2">
              <span
                v-for="dish in wine.pairing"
                :key="dish"
                class="rounded-pill bg-white/65 px-3 py-1.5 text-caption text-wine-700"
              >
                {{ dish }}
              </span>
            </div>
          </div>
        </section>

        <section
          v-motion
          :initial="{ opacity: 0, y: 26 }"
          :enter="{ opacity: 1, y: 0, transition: { duration: 460, delay: 220 } }"
          class="glass rounded-sheet p-5"
        >
          <h2 class="text-title text-ink">Отзывы ({{ wine.reviews.length }})</h2>
          <ul class="mt-4 space-y-3">
            <li
              v-for="(review, index) in wine.reviews"
              :key="review.id"
              v-motion
              :initial="{ opacity: 0, x: 20 }"
              :visible-once="{ opacity: 1, x: 0, transition: { delay: index * 70, duration: 360 } }"
              class="flex gap-3 rounded-glass bg-white/50 p-3"
            >
              <img
                :src="review.author.avatar"
                :alt="review.author.name"
                class="h-9 w-9 shrink-0 rounded-full border-2 border-white/80"
              />
              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between gap-2">
                  <p class="truncate text-caption font-semibold text-ink">{{ review.author.name }}</p>
                  <StarRating :model-value="review.rating" :size="12" />
                </div>
                <p class="mt-1 text-footnote leading-snug text-ink">{{ review.text }}</p>
              </div>
            </li>
          </ul>
        </section>

        <section v-if="wine.similar.length">
          <h2 class="mb-3 px-1 text-title text-ink">Похожие вина</h2>
          <div class="snap-row -mx-4 px-4">
            <button
              v-for="similar in wine.similar"
              :key="similar.id"
              type="button"
              class="press glass w-[150px] overflow-hidden rounded-glass p-2 text-left"
              @click="router.push(`/wine/${similar.id}`)"
            >
              <LazyImage :src="similar.image" :alt="similar.name" ratio="3 / 4" rounded="rounded-[14px]" />
              <p class="mt-2 truncate text-caption font-semibold text-ink">{{ similar.name }}</p>
              <div class="mt-1 flex items-center justify-between">
                <StarRating :model-value="similar.rating" :size="11" />
                <span class="text-caption text-wine-600">{{ similar.price.toLocaleString('ru-RU') }} ₽</span>
              </div>
            </button>
          </div>
        </section>
      </div>
    </main>

    <BottomSheet v-model:open="reviewOpen" title="Ваша оценка">
      <div class="space-y-5 py-3">
        <div class="flex justify-center">
          <StarRating v-model="myRating" editable :size="36" />
        </div>
        <GlassField v-model="myNote" label="Что запомнилось?" multiline :rows="5" />
      </div>
      <template #footer>
        <GlassButton variant="primary" size="lg" block :loading="saving" @click="submitReview">
          Сохранить отзыв
        </GlassButton>
      </template>
    </BottomSheet>
  </div>
</template>
