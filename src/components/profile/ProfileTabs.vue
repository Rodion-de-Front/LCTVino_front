<script setup lang="ts">
import { computed } from 'vue'

interface Tab {
  value: string
  label: string
  count: number
}

const props = defineProps<{ tabs: Tab[] }>()
const model = defineModel<string>({ required: true })

const activeIndex = computed(() =>
  Math.max(0, props.tabs.findIndex((t) => t.value === model.value)),
)
</script>

<template>
  <div class="relative flex border-b border-white/60">
    <button
      v-for="tab in tabs"
      :key="tab.value"
      type="button"
      class="flex-1 pb-3 pt-2 text-footnote font-medium transition-colors duration-300"
      :class="model === tab.value ? 'text-wine-600' : 'text-ink-faint'"
      @click="model = tab.value"
    >
      {{ tab.label }}
      <span class="ml-1 text-caption opacity-70">{{ tab.count }}</span>
    </button>

    <!-- Sliding underline -->
    <span
      class="absolute bottom-0 h-0.5 rounded-pill bg-gradient-to-r from-wine-600 to-gold transition-transform duration-400 ease-spring"
      :style="{
        width: `${100 / tabs.length}%`,
        transform: `translateX(${activeIndex * 100}%)`,
        left: 0,
      }"
    />
  </div>
</template>
