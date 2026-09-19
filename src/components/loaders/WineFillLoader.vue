<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 0–1. Omit to let the glass fill on a loop. */
    progress?: number
    size?: number
    label?: string
  }>(),
  { size: 84, label: '' },
)

const auto = ref(0)
let frame = 0

function loop() {
  const start = performance.now()
  const tick = (now: number) => {
    auto.value = ((now - start) / 1800) % 1
    frame = requestAnimationFrame(tick)
  }
  frame = requestAnimationFrame(tick)
}

watch(
  () => props.progress,
  (value) => {
    cancelAnimationFrame(frame)
    if (value === undefined) loop()
  },
  { immediate: true },
)

onBeforeUnmount(() => cancelAnimationFrame(frame))

const level = computed(() => Math.min(1, Math.max(0, props.progress ?? auto.value)))
// The bowl interior spans y = 26…62 in the 100×100 viewBox.
const liquidTop = computed(() => 62 - level.value * 36)
</script>

<template>
  <div class="flex flex-col items-center gap-2">
    <svg :width="size" :height="size" viewBox="0 0 100 100" fill="none">
      <defs>
        <clipPath id="wine-bowl">
          <path d="M28 26h44c0 22-9 32-22 32S28 48 28 26Z" />
        </clipPath>
        <linearGradient id="wine-liquid" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#8B3A3A" />
          <stop offset="1" stop-color="#722F37" />
        </linearGradient>
      </defs>

      <g clip-path="url(#wine-bowl)">
        <g :style="{ transform: `translateY(${liquidTop - 6}px)`, transition: 'transform 420ms cubic-bezier(0.32,0.72,0,1)' }">
          <!-- Two stacked sine humps scrolled sideways read as a moving surface. -->
          <path
            class="animate-wave-shift"
            d="M-20 8 q10 -6 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 v60 h-120 z"
            fill="url(#wine-liquid)"
          />
          <path
            class="animate-wave-shift"
            style="animation-duration: 3.4s; animation-direction: reverse"
            d="M-20 10 q10 -5 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 v60 h-120 z"
            fill="#8B3A3A"
            opacity="0.55"
          />
        </g>
      </g>

      <path
        d="M28 26h44c0 22-9 32-22 32S28 48 28 26Z"
        stroke="#722F37"
        stroke-width="2.6"
        stroke-linejoin="round"
      />
      <path d="M50 58v22M36 80h28" stroke="#722F37" stroke-width="2.6" stroke-linecap="round" />
      <path d="M34 30c1.5 9 5 15 10 18" stroke="#fff" stroke-opacity="0.65" stroke-width="2.4" stroke-linecap="round" />
    </svg>
    <p v-if="label" class="text-footnote text-ink-muted">{{ label }}</p>
  </div>
</template>
