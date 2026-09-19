<script setup lang="ts">
import { computed, toRef } from 'vue'
import { useCountUp } from '@/composables/useCountUp'

const props = withDefaults(defineProps<{ value: number; label: string; delay?: number }>(), {
  delay: 0,
})

const target = toRef(props, 'value')
const animated = useCountUp(() => target.value, 1100, props.delay)

const formatted = computed(() =>
  animated.value >= 1000
    ? `${(animated.value / 1000).toFixed(1).replace('.0', '')}K`
    : String(animated.value),
)
</script>

<template>
  <div class="text-center">
    <p class="text-title font-semibold tabular-nums text-ink">{{ formatted }}</p>
    <p class="text-caption text-ink-muted">{{ label }}</p>
  </div>
</template>
