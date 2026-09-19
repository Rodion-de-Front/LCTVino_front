<script setup lang="ts">
import { computed } from 'vue'
import { vRipple } from '@/directives/ripple'

const props = withDefaults(
  defineProps<{
    variant?: 'primary' | 'glass' | 'ghost' | 'gold' | 'danger'
    size?: 'sm' | 'md' | 'lg'
    block?: boolean
    loading?: boolean
    disabled?: boolean
    type?: 'button' | 'submit'
  }>(),
  { variant: 'primary', size: 'md', block: false, loading: false, disabled: false, type: 'button' },
)

const rippleColor = computed(() =>
  props.variant === 'primary' || props.variant === 'danger'
    ? 'rgba(255,255,255,0.4)'
    : 'rgba(114,47,55,0.18)',
)

const variants: Record<string, string> = {
  primary:
    'bg-gradient-to-br from-wine-500 to-wine-700 text-white shadow-float border border-white/20',
  glass: 'glass text-wine-700',
  ghost: 'text-wine-600 hover:bg-white/50',
  gold: 'bg-gradient-to-br from-gold-light to-gold text-wine-800 shadow-float border border-white/40',
  danger: 'bg-gradient-to-br from-[#B4404A] to-wine-700 text-white shadow-float',
}

const sizes: Record<string, string> = {
  sm: 'h-9 px-4 text-footnote',
  md: 'h-12 px-5 text-body',
  lg: 'h-14 px-6 text-body font-semibold',
}
</script>

<template>
  <button
    v-ripple="rippleColor"
    :type="type"
    :disabled="disabled || loading"
    class="press inline-flex items-center justify-center gap-2 rounded-pill font-medium transition-all duration-200 ease-ios disabled:cursor-not-allowed disabled:opacity-50"
    :class="[variants[variant], sizes[size], block && 'w-full']"
  >
    <span
      v-if="loading"
      class="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
      aria-hidden="true"
    />
    <slot />
  </button>
</template>
