<script setup lang="ts">
import { ref } from 'vue'
import AppIcon from './AppIcon.vue'

const props = withDefaults(
  defineProps<{
    modelValue?: number
    editable?: boolean
    size?: number
    showValue?: boolean
    /** Staggers the fill-in when the component appears. */
    animateIn?: boolean
  }>(),
  { modelValue: 0, editable: false, size: 18, showValue: false, animateIn: false },
)

const emit = defineEmits<{ 'update:modelValue': [number] }>()

const bouncing = ref<number | null>(null)

function pick(value: number) {
  if (!props.editable) return
  bouncing.value = value
  navigator.vibrate?.(8)
  emit('update:modelValue', value)
  window.setTimeout(() => (bouncing.value = null), 420)
}

/** 0 = empty, 1 = full, fractions render a partially clipped star. */
const fillFor = (index: number) => Math.min(1, Math.max(0, props.modelValue - index))
</script>

<template>
  <div
    class="flex items-center gap-1"
    :role="editable ? 'group' : 'img'"
    :aria-label="editable ? 'Оценка' : `Рейтинг ${modelValue.toFixed(1)} из 5`"
  >
    <!-- Read-only ratings are decorative spans so screen readers hear one label,
         not five disabled buttons. -->
    <component
      :is="editable ? 'button' : 'span'"
      v-for="index in 5"
      :key="index"
      :type="editable ? 'button' : undefined"
      :aria-label="editable ? `${index} из 5` : undefined"
      :aria-hidden="editable ? undefined : 'true'"
      class="relative block transition-transform duration-300 ease-spring"
      :class="[
        editable && 'active:scale-90',
        bouncing === index && 'scale-125',
        animateIn && 'animate-[heart-pop_520ms_cubic-bezier(0.34,1.56,0.64,1)_both]',
      ]"
      :style="animateIn ? { animationDelay: `${index * 70}ms` } : undefined"
      @click="pick(index)"
    >
      <AppIcon name="star" :size="size" class="text-ink/15" filled />
      <span
        class="absolute inset-0 overflow-hidden text-gold"
        :style="{ width: `${fillFor(index - 1) * 100}%` }"
      >
        <AppIcon name="star" :size="size" filled />
      </span>
    </component>

    <span v-if="showValue" class="ml-1 text-footnote font-semibold text-ink">
      {{ modelValue.toFixed(1) }}
    </span>
  </div>
</template>
