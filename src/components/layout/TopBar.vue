<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import BrandLogo from '@/components/layout/BrandLogo.vue'

withDefaults(defineProps<{ title?: string; searchable?: boolean }>(), {
  title: 'Своё Вино',
  searchable: true,
})

const query = defineModel<string>('query', { default: '' })
const router = useRouter()
const searchOpen = ref(false)
const input = ref<HTMLInputElement | null>(null)

async function toggleSearch() {
  searchOpen.value = !searchOpen.value
  if (searchOpen.value) {
    await nextTick()
    input.value?.focus()
  } else {
    query.value = ''
  }
}

</script>

<template>
  <header class="pointer-events-none fixed inset-x-0 top-0 z-40 px-3 pt-[calc(var(--safe-top)+10px)]">
    <div class="glass-strong pointer-events-auto flex h-14 items-center gap-2 rounded-[26px] px-3">
      <Transition name="fade" mode="out-in">
        <div v-if="!searchOpen" key="brand" class="flex min-w-0 flex-1 items-center">
          <BrandLogo size="sm" />
        </div>

        <div v-else key="search" class="flex min-w-0 flex-1 items-center gap-2">
          <AppIcon name="search" :size="19" class="text-ink-faint" />
          <input
            ref="input"
            v-model="query"
            type="search"
            placeholder="Вино, регион, сорт…"
            class="w-full text-body text-ink placeholder:text-ink-faint"
            @keydown.enter="router.push({ path: '/catalog', query: { q: query } })"
          />
        </div>
      </Transition>

      <button
        v-if="searchable"
        type="button"
        class="press flex h-10 w-10 items-center justify-center rounded-full text-ink-muted hover:bg-white/50"
        :aria-label="searchOpen ? 'Закрыть поиск' : 'Поиск'"
        @click="toggleSearch"
      >
        <AppIcon :name="searchOpen ? 'close' : 'search'" :size="21" />
      </button>

    </div>
  </header>
</template>
