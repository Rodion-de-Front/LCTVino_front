<script setup lang="ts">
const bubbles = Array.from({ length: 11 }, (_, i) => ({
  left: 8 + ((i * 37) % 84),
  size: 4 + ((i * 5) % 9),
  delay: (i * 0.21) % 2.2,
  duration: 1.9 + ((i * 7) % 13) / 10,
}))

withDefaults(defineProps<{ label?: string; height?: number }>(), { label: '', height: 150 })
</script>

<template>
  <div class="flex flex-col items-center gap-3">
    <div
      class="glass relative w-24 overflow-hidden rounded-b-[46px] rounded-t-glass"
      :style="{ height: `${height}px` }"
    >
      <div class="absolute inset-x-0 bottom-0 top-1/3 bg-gradient-to-t from-gold/45 to-gold-light/15" />
      <span
        v-for="(bubble, index) in bubbles"
        :key="index"
        class="absolute bottom-2 rounded-full bg-white/80 shadow-[0_0_6px_rgba(255,255,255,0.8)]"
        :style="{
          left: `${bubble.left}%`,
          width: `${bubble.size}px`,
          height: `${bubble.size}px`,
          animation: `bubble-rise ${bubble.duration}s linear ${bubble.delay}s infinite`,
        }"
      />
    </div>
    <p v-if="label" class="text-footnote text-ink-muted">{{ label }}</p>
  </div>
</template>
