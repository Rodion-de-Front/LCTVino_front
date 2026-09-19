<script setup lang="ts">
withDefaults(defineProps<{ count?: number; label?: string }>(), { count: 4, label: '' })
</script>

<template>
  <div class="flex flex-col items-center gap-3">
    <div class="flex h-12 items-end gap-2.5">
      <span
        v-for="drop in count"
        :key="drop"
        class="block h-3.5 w-3.5 rounded-full bg-gradient-to-b from-wine-500 to-wine-700 shadow-[0_2px_6px_rgba(114,47,55,0.4)]"
        :style="{
          animation: `drop-fall 1.15s cubic-bezier(0.5, 0, 0.5, 1) ${drop * 0.13}s infinite`,
          borderRadius: '52% 52% 50% 50% / 62% 62% 40% 40%',
        }"
      />
    </div>
    <p v-if="label" class="text-footnote text-ink-muted">{{ label }}</p>
  </div>
</template>
