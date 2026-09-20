<script setup lang="ts">
import BrandLogo from '@/components/layout/BrandLogo.vue'
import WineFillLoader from '@/components/loaders/WineFillLoader.vue'

defineProps<{ progress?: number }>()
</script>

<template>
  <div
    class="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6"
    style="background: radial-gradient(120% 90% at 50% 0%, #faf3f0 0%, #f5f0eb 52%, #efe2df 100%)"
  >
    <div class="animate-float-y">
      <WineFillLoader :progress="progress" :size="112" />
    </div>
    <div class="text-center">
      <BrandLogo size="lg" stacked class="justify-center" />
      <p class="mt-1 text-footnote tracking-[0.2em] text-ink-faint">СОЦИАЛЬНАЯ СЕТЬ О ВИНЕ</p>
    </div>
  </div>
</template>
