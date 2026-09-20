<script setup lang="ts">
import { nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import BrandLogo from '@/components/layout/BrandLogo.vue'

withDefaults(defineProps<{ title?: string; notifications?: number; searchable?: boolean }>(), {
  title: 'LCT Vino',
  notifications: 0,
  searchable: true,
})

const query = defineModel<string>('query', { default: '' })
const router = useRouter()
const searchOpen = ref(false)
const input = ref<HTMLInputElement | null>(null)
const bellRinging = ref(false)

async function toggleSearch() {
  searchOpen.value = !searchOpen.value
  if (searchOpen.value) {
    await nextTick()
    input.value?.focus()
  } else {
    query.value = ''
  }
}

function ringBell() {
  bellRinging.value = true
  window.setTimeout(() => (bellRinging.value = false), 700)
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

      <button
        type="button"
        class="press relative flex h-10 w-10 items-center justify-center rounded-full text-ink-muted hover:bg-white/50"
        aria-label="Уведомления"
        @click="ringBell"
      >
        <AppIcon name="bell" :size="21" :class="bellRinging && 'animate-bell'" />
        <span
          v-if="notifications > 0"
          class="absolute right-1.5 top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-pill bg-gradient-to-br from-wine-500 to-wine-700 px-1 text-[10px] font-semibold text-white shadow-float"
          :class="bellRinging && 'animate-heart-pop'"
        >
          {{ notifications > 9 ? '9+' : notifications }}
        </span>
      </button>
    </div>
  </header>
</template>

<style scoped>
@keyframes bell-swing {
  0%,
  100% {
    transform: rotate(0);
  }
  20% {
    transform: rotate(14deg);
  }
  40% {
    transform: rotate(-11deg);
  }
  60% {
    transform: rotate(7deg);
  }
  80% {
    transform: rotate(-4deg);
  }
}
.animate-bell {
  animation: bell-swing 700ms ease-in-out;
  transform-origin: top center;
}
</style>
