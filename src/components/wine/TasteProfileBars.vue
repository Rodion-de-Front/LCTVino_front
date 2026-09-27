<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { TasteProfile } from '@/types'

const props = defineProps<{ taste: TasteProfile }>()

const AXES: { key: keyof TasteProfile; label: string; from: string; to: string }[] = [
  { key: 'acidity', label: 'Кислотность', from: 'Мягкое', to: 'Кислотное' },
  { key: 'sweetness', label: 'Сладость', from: 'Сухое', to: 'Сладкое' },
  { key: 'tannins', label: 'Танины', from: 'Бархатистое', to: 'Танинное' },
  { key: 'body', label: 'Тельность', from: 'Лёгкое', to: 'Плотное' },
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
      <div class="grid grid-cols-[minmax(76px,max-content)_minmax(112px,1fr)_minmax(76px,max-content)] items-center gap-4">
        <span
          class="text-right text-footnote transition-colors"
          :class="row.leans === 'from' ? 'font-semibold text-wine-700' : 'text-ink-muted'"
        >
          {{ row.from }}
        </span>

        <div
          class="relative h-5 min-w-0"
          role="img"
          :aria-label="`${row.label}: ${row.value} из ${STEPS}, ближе к «${row.leans === 'from' ? row.from : row.to}»`"
        >
          <span class="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-pill bg-white/70" />
          <span
            v-for="step in STEPS"
            :key="step"
            class="absolute top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-wine-700/25"
            :style="{ left: `${((step - 1) / (STEPS - 1)) * 100}%` }"
          />
          <span
            class="absolute top-1/2 h-[18px] w-[18px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-gradient-to-br from-wine-500 to-wine-700 shadow-float transition-[left] duration-[900ms] ease-ios"
            :style="{
              left: settled ? `${row.percent}%` : '50%',
              transitionDelay: `${index * 90}ms`,
            }"
          />
        </div>

        <span
          class="text-footnote transition-colors"
          :class="row.leans === 'to' ? 'font-semibold text-wine-700' : 'text-ink-muted'"
        >
          {{ row.to }}
        </span>
      </div>
    </li>
  </ul>
</template>
