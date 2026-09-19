<script setup lang="ts">
import { onMounted, ref } from 'vue'

const props = withDefaults(
  defineProps<{ src: string; alt?: string; ratio?: string; rounded?: string; eager?: boolean }>(),
  { alt: '', ratio: '4 / 5', rounded: 'rounded-glass', eager: false },
)

const loaded = ref(false)
const root = ref<HTMLElement | null>(null)
const visible = ref(props.eager)

onMounted(() => {
  if (visible.value || !('IntersectionObserver' in window)) {
    visible.value = true
    return
  }
  const observer = new IntersectionObserver(
    ([entry]) => {
      if (entry?.isIntersecting) {
        visible.value = true
        observer.disconnect()
      }
    },
    { rootMargin: '400px' },
  )
  if (root.value) observer.observe(root.value)
})
</script>

<template>
  <div
    ref="root"
    class="relative overflow-hidden bg-gradient-to-br from-cream-deep to-wine-100"
    :class="rounded"
    :style="{ aspectRatio: ratio }"
  >
    <!-- Shimmering placeholder until the real image decodes. -->
    <div
      v-if="!loaded"
      class="absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      <div
        class="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/55 to-transparent"
      />
    </div>

    <img
      v-if="visible"
      :src="src"
      :alt="alt"
      :loading="eager ? 'eager' : 'lazy'"
      decoding="async"
      class="h-full w-full object-cover"
      :class="loaded ? 'blur-up-done' : 'blur-up'"
      @load="loaded = true"
      @error="loaded = true"
    />
    <slot />
  </div>
</template>
