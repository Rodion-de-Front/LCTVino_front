<script setup lang="ts">
import { computed } from 'vue'

interface Segment {
  value: string
  label: string
  badge?: number
}

const props = defineProps<{ segments: Segment[] }>()
const model = defineModel<string>({ required: true })

const activeIndex = computed(() =>
  Math.max(0, props.segments.findIndex((s) => s.value === model.value)),
)
</script>

<template>
  <div class="overflow-x-auto rounded-pill">
    <div class="glass relative flex min-w-full w-max overflow-hidden rounded-pill p-1 [--segment-w:8.5rem]">
      <!-- The moving pill sits behind the labels and slides between segments. -->
      <span
        class="absolute inset-y-1 rounded-pill bg-gradient-to-br from-wine-500 to-wine-700 transition-all duration-400 ease-spring"
        :style="{
          width: 'var(--segment-w)',
          transform: `translateX(calc(${activeIndex} * var(--segment-w)))`,
          left: '4px',
        }"
      />
      <button
        v-for="segment in segments"
        :key="segment.value"
        type="button"
        class="relative z-10 flex w-[var(--segment-w)] shrink-0 items-center justify-center gap-1.5 rounded-pill py-2 text-footnote font-medium transition-colors duration-300"
        :class="model === segment.value ? 'text-white' : 'text-ink-muted'"
        @click="model = segment.value"
      >
        {{ segment.label }}
        <span
          v-if="segment.badge !== undefined"
          class="rounded-pill px-1.5 text-caption transition-colors duration-300"
          :class="model === segment.value ? 'bg-white/25 text-white' : 'bg-ink/8 text-ink-faint'"
        >
          {{ segment.badge }}
        </span>
      </button>
    </div>
  </div>
</template>
