<script setup lang="ts">
withDefaults(defineProps<{ size?: 'sm' | 'md' | 'lg'; stacked?: boolean }>(), {
  size: 'md',
  stacked: false,
})

const imageSize = {
  sm: 'h-9 w-36',
  md: 'h-12 w-48',
  lg: 'h-16 w-64',
}
</script>

<template>
  <img src="/images/logo.svg" alt="Своё Вино" class="shrink-0 object-contain" :class="imageSize[size]" />
</template>
