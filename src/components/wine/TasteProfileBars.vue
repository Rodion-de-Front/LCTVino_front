<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { TasteProfile } from '@/types'

const props = defineProps<{ taste: TasteProfile }>()

/** Each axis runs between two opposite characteristics rather than 0→max. */
const AXES: { key: keyof TasteProfile; label: string; from: string; to: string }[] = [
  { key: 'body', label: 'Тельность', from: 'Лёгкое', to: 'Плотное' },
  { key: 'tannins', label: 'Танины', from: 'Мягкие', to: 'Терпкие' },
  { key: 'acidity', label: 'Кислотность', from: 'Спокойная', to: 'Звонкая' },
  { key: 'sweetness', label: 'Сладость', from: 'Сухое', to: 'Сладкое' },
  { key: 'fruitiness', label: 'Фруктовость', from: 'Сдержанное', to: 'Фруктовое' },
]

const STEPS = 5

const rows = AXES.map((axis) => {
  const value = props.taste[axis.key]
  return {
    ...axis,
    value,
    percent: ((value - 1) / (STEPS - 1)) * 100,
    leans: value === 3 ? 'none' : value < 3 ? 'from' : 'to',
  }
})

/** Markers start mid-scale and slide to their value once mounted. */
const settled = ref(false)
onMounted(() => requestAnimationFrame(() => (settled.value = true)))
</script>

<template>
  <ul class="space-y-4">
    <li v-for="(row, index) in rows" :key="row.key">
      <p class="text-caption text-ink-faint">{{ row.label }}</p>

      <div class="mt-1 flex items-center gap-2.5">
        <span
          class="w-[72px] shrink-0 text-right text-caption transition-colors"
          :class="row.leans === 'from' ? 'font-semibold text-wine-700' : 'text-ink-muted'"
        >
          {{ row.from }}
        </span>

        <div
          class="relative h-4 flex-1"
          role="img"
          :aria-label="`${row.label}: ${row.value} из ${STEPS}, ближе к «${row.leans === 'from' ? row.from : row.to}»`"
        >
          <span class="absolute inset-x-0 top-1/2 h-[3px] -translate-y-1/2 rounded-pill bg-white/70" />
          <span
            v-for="step in STEPS"
            :key="step"
            class="absolute top-1/2 h-[3px] w-[3px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-wine-700/25"
            :style="{ left: `${((step - 1) / (STEPS - 1)) * 100}%` }"
          />
          <span
            class="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-gradient-to-br from-wine-500 to-wine-700 shadow-float transition-[left] duration-[900ms] ease-ios"
            :style="{
              left: settled ? `${row.percent}%` : '50%',
              transitionDelay: `${index * 90}ms`,
            }"
          />
        </div>

        <span
          class="w-[72px] shrink-0 text-caption transition-colors"
          :class="row.leans === 'to' ? 'font-semibold text-wine-700' : 'text-ink-muted'"
        >
          {{ row.to }}
        </span>
      </div>
    </li>
  </ul>
</template>
