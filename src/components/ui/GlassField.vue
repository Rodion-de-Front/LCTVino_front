<script setup lang="ts">
import { computed, ref, useId } from 'vue'

const props = withDefaults(
  defineProps<{
    label: string
    type?: string
    multiline?: boolean
    rows?: number
    autocomplete?: string
    error?: string | null
    icon?: boolean
  }>(),
  { type: 'text', multiline: false, rows: 4, error: null, icon: false },
)

const model = defineModel<string>({ default: '' })
const id = useId()
const focused = ref(false)
/** Floating label lifts when the field is focused or already holds a value. */
const lifted = computed(() => focused.value || model.value.length > 0)
</script>

<template>
  <div class="w-full">
    <div
      class="glass relative rounded-glass px-4 transition-all duration-300 ease-ios"
      :class="[
        focused && 'ring-2 ring-wine-500/35 shadow-glass-lg',
        props.error && 'ring-2 ring-[#B4404A]/45',
        multiline ? 'pb-3 pt-6' : 'h-16',
      ]"
    >
      <label
        :for="id"
        class="pointer-events-none absolute left-4 origin-left text-ink-muted transition-all duration-250 ease-ios"
        :class="lifted ? 'top-2 text-caption text-wine-600' : 'top-1/2 -translate-y-1/2 text-body'"
        :style="multiline && lifted ? 'top: 8px; transform: none' : multiline ? 'top: 22px; transform: none' : ''"
      >
        {{ label }}
      </label>

      <div v-if="icon" class="absolute right-4 top-1/2 -translate-y-1/2 text-ink-faint">
        <slot name="icon" />
      </div>

      <textarea
        v-if="multiline"
        :id="id"
        v-model="model"
        :rows="rows"
        class="w-full resize-none pt-3 text-body text-ink placeholder:text-ink-faint"
        @focus="focused = true"
        @blur="focused = false"
      />
      <input
        v-else
        :id="id"
        v-model="model"
        :type="type"
        :autocomplete="autocomplete"
        class="h-full w-full pt-5 text-body text-ink"
        :class="icon && 'pr-9'"
        @focus="focused = true"
        @blur="focused = false"
      />
    </div>

    <Transition name="fade">
      <p v-if="props.error" class="mt-1.5 pl-4 text-caption text-[#B4404A]">{{ props.error }}</p>
    </Transition>
  </div>
</template>
