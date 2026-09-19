<script setup lang="ts">
withDefaults(defineProps<{ size?: number; label?: string }>(), { size: 120, label: '' })
</script>

<template>
  <div class="flex flex-col items-center gap-3">
    <div
      class="preserve-3d relative animate-bottle-spin"
      :style="{ width: `${size * 0.5}px`, height: `${size}px`, perspective: '600px' }"
    >
      <!-- Six slices arranged around the Y axis fake a solid 3D bottle. -->
      <div
        v-for="slice in 6"
        :key="slice"
        class="absolute inset-0"
        :style="{
          transform: `rotateY(${(slice - 1) * 30}deg)`,
          transformStyle: 'preserve-3d',
        }"
      >
        <svg viewBox="0 0 60 120" class="h-full w-full" fill="none">
          <defs>
            <linearGradient :id="`bottle-${slice}`" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stop-color="#2B1214" />
              <stop offset="0.45" stop-color="#8B3A3A" />
              <stop offset="1" stop-color="#2B1214" />
            </linearGradient>
          </defs>
          <path
            d="M24 8h12v22c0 6 10 11 10 24v54a6 6 0 0 1-6 6H20a6 6 0 0 1-6-6V54c0-13 10-18 10-24z"
            :fill="`url(#bottle-${slice})`"
            :opacity="slice === 1 ? 1 : 0.22"
          />
          <rect x="24" y="4" width="12" height="8" rx="2" fill="#C9A961" :opacity="slice === 1 ? 1 : 0.2" />
          <rect
            x="15"
            y="68"
            width="30"
            height="30"
            rx="3"
            fill="#FBF7F1"
            :opacity="slice === 1 ? 0.95 : 0.18"
          />
        </svg>
      </div>
      <div
        class="absolute -bottom-3 left-1/2 h-3 w-16 -translate-x-1/2 rounded-[50%] bg-wine-700/25 blur-md"
      />
    </div>
    <p v-if="label" class="text-footnote text-ink-muted">{{ label }}</p>
  </div>
</template>
