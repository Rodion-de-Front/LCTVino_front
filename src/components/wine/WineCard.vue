<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import LazyImage from '@/components/ui/LazyImage.vue'
import StarRating from '@/components/ui/StarRating.vue'
import { useTilt } from '@/composables/useTilt'
import type { Wine } from '@/types'

const props = defineProps<{ wine: Wine; favorite?: boolean; index?: number }>()
const emit = defineEmits<{ open: [Wine]; favorite: [Wine] }>()

const { style, glare, onMove, onLeave } = useTilt(8)

const COLOR_LABELS: Record<string, string> = {
  red: 'Красное',
  white: 'Белое',
  rose: 'Розовое',
  orange: 'Оранжевое',
}
const CATEGORY_LABELS: Record<string, string> = {
  sparkling: 'Игристое',
  fortified: 'Креплёное',
}

// Still wines are the default, so the badge only spells out the colour;
// sparkling and fortified are the more useful thing to surface.
const typeLabel = computed(
  () => CATEGORY_LABELS[props.wine.category] ?? COLOR_LABELS[props.wine.color] ?? props.wine.color,
)
const price = computed(() => `${props.wine.price.toLocaleString('ru-RU')} ₽`)
</script>

<template>
  <article
    v-motion
    :initial="{ opacity: 0, y: 24, scale: 0.97 }"
    :visible-once="{
      opacity: 1,
      y: 0,
      scale: 1,
      transition: { duration: 420, delay: Math.min((index ?? 0) * 70, 420) },
    }"
    class="glass group relative cursor-pointer overflow-hidden rounded-glass p-2.5"
    :style="style"
    @pointermove="onMove"
    @pointerleave="onLeave"
    @click="emit('open', wine)"
  >
    <span
      class="pointer-events-none absolute inset-0 rounded-glass bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.8),transparent_60%)] transition-opacity duration-300"
      :style="glare"
      aria-hidden="true"
    />

    <div class="relative">
      <LazyImage :src="wine.image" :alt="wine.name" ratio="3 / 4" rounded="rounded-[16px]" />
      <span
        class="absolute left-2 top-2 rounded-pill bg-wine-900/45 px-2 py-0.5 text-caption text-white backdrop-blur-md"
      >
        {{ typeLabel }}
      </span>
      <button
        type="button"
        class="press absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/70 backdrop-blur-md transition-colors duration-200"
        :class="favorite ? 'text-wine-600' : 'text-ink-faint'"
        :aria-pressed="favorite"
        :aria-label="favorite ? 'Убрать из избранного' : 'В избранное'"
        @click.stop="emit('favorite', wine)"
      >
        <AppIcon
          name="heart"
          :size="18"
          :filled="favorite"
          :class="favorite && 'animate-pop-bounce'"
        />
      </button>
    </div>

    <div class="relative mt-2.5 px-1 pb-1">
      <h3 class="truncate text-footnote font-semibold text-ink">{{ wine.name }}</h3>
      <p class="truncate text-caption text-ink-muted">{{ wine.producer }} · {{ wine.region }}</p>
      <!-- Stars and price share a line when the card is wide enough,
           otherwise the price drops below instead of being clipped. -->
      <div class="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
        <StarRating :model-value="wine.rating" :size="12" show-value />
        <span class="ml-auto whitespace-nowrap text-footnote font-semibold text-wine-600">
          {{ price }}
        </span>
      </div>
    </div>
  </article>
</template>
