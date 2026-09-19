<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { TasteProfile } from '@/types'

const props = defineProps<{ taste: TasteProfile }>()

const LABELS: Record<keyof TasteProfile, string> = {
  body: 'Тельность',
  tannins: 'Танины',
  acidity: 'Кислотность',
  sweetness: 'Сладость',
  fruitiness: 'Фруктовость',
}

const rows = (Object.keys(LABELS) as (keyof TasteProfile)[]).map((key) => ({
  key,
  label: LABELS[key],
  value: props.taste[key],
}))

/** Bars start empty and fill left-to-right once mounted. */
const filled = ref(false)
onMounted(() => requestAnimationFrame(() => (filled.value = true)))
</script>

<template>
  <ul class="space-y-3">
    <li v-for="(row, index) in rows" :key="row.key" class="flex items-center gap-3">
      <span class="w-28 shrink-0 text-footnote text-ink-muted">{{ row.label }}</span>
      <div class="h-2.5 flex-1 overflow-hidden rounded-pill bg-white/60">
        <div
          class="h-full rounded-pill bg-gradient-to-r from-wine-600 via-wine-500 to-gold transition-[width] duration-[900ms] ease-ios"
          :style="{
            width: filled ? `${(row.value / 5) * 100}%` : '0%',
            transitionDelay: `${index * 90}ms`,
          }"
        />
      </div>
      <span class="w-6 shrink-0 text-right text-caption tabular-nums text-ink-faint">
        {{ row.value }}
      </span>
    </li>
  </ul>
</template>
