<script setup lang="ts">
import { computed, ref } from 'vue'
import AppIcon from './AppIcon.vue'

/** A long filter list — regions, grapes, producers — narrowed by a search box. */
const props = defineProps<{
  title: string
  options: string[]
  selected: string[]
  /** Reset row shown above the options, e.g. "Все регионы". */
  allLabel: string
  placeholder?: string
}>()

const emit = defineEmits<{ toggle: [string]; clear: [] }>()

const search = ref('')

const visible = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return props.options
  return props.options.filter((option) => option.toLowerCase().includes(q))
})
</script>

<template>
  <section>
    <div class="mb-2 flex items-baseline justify-between gap-2">
      <p class="text-footnote font-medium text-ink-muted">{{ title }}</p>
      <span v-if="selected.length" class="text-caption text-wine-600">
        Выбрано: {{ selected.length }}
      </span>
    </div>

    <label class="glass flex h-10 items-center gap-2 rounded-pill px-3.5">
      <AppIcon name="search" :size="16" class="shrink-0 text-ink-faint" />
      <input
        v-model="search"
        type="search"
        :placeholder="placeholder ?? 'Поиск'"
        class="min-w-0 flex-1 text-footnote text-ink placeholder:text-ink-faint"
      />
      <button
        v-if="search"
        type="button"
        class="press shrink-0 text-ink-faint"
        aria-label="Очистить поиск"
        @click="search = ''"
      >
        <AppIcon name="close" :size="15" />
      </button>
    </label>

    <ul class="mt-2 max-h-52 space-y-0.5 overflow-y-auto overscroll-contain pr-1">
      <li>
        <button
          type="button"
          class="flex w-full items-center justify-between gap-2 rounded-[14px] px-3 py-2 text-left text-footnote transition-colors hover:bg-white/55"
          :class="selected.length ? 'text-ink-muted' : 'font-medium text-wine-600'"
          @click="emit('clear')"
        >
          {{ allLabel }}
          <AppIcon v-if="!selected.length" name="check" :size="15" :stroke="2.4" />
        </button>
      </li>

      <li v-for="option in visible" :key="option">
        <button
          type="button"
          class="flex w-full items-center justify-between gap-2 rounded-[14px] px-3 py-2 text-left text-footnote text-ink transition-colors hover:bg-white/55"
          :aria-pressed="selected.includes(option)"
          @click="emit('toggle', option)"
        >
          <span class="min-w-0 truncate">{{ option }}</span>
          <span
            class="flex h-5 w-5 shrink-0 items-center justify-center rounded-[7px] border transition-all duration-200"
            :class="
              selected.includes(option)
                ? 'border-transparent bg-gradient-to-br from-wine-500 to-wine-700 text-white'
                : 'border-ink-faint/40 bg-white/60 text-transparent'
            "
          >
            <AppIcon name="check" :size="12" :stroke="2.6" />
          </span>
        </button>
      </li>

      <li v-if="!visible.length" class="py-3 text-center text-caption text-ink-faint">
        Ничего не найдено
      </li>
    </ul>
  </section>
</template>
