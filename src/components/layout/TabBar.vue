<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import { useUiStore } from '@/stores/ui'

const route = useRoute()
const router = useRouter()
const ui = useUiStore()

interface Tab {
  name: string
  to: string
  icon: string
  label: string
  /** The scanner tab renders as the raised centre button. */
  center?: boolean
}

const tabs: Tab[] = [
  { name: 'home', to: '/', icon: 'home', label: 'Лента' },
  { name: 'catalog', to: '/catalog', icon: 'glass', label: 'Каталог' },
  { name: 'scanner', to: '/scanner', icon: 'scan', label: 'Сканер', center: true },
  { name: 'my-wines', to: '/my-wines', icon: 'bottle', label: 'Мои вина' },
  { name: 'profile', to: '/profile', icon: 'person', label: 'Профиль' },
]

const isActive = (to: string) => (to === '/' ? route.path === '/' : route.path.startsWith(to))

function go(to: string) {
  if (isActive(to)) return
  ui.haptic(8)
  router.push(to)
}
</script>

<template>
  <nav
    class="glass-strong pointer-events-auto fixed inset-x-3 bottom-[calc(var(--safe-bottom)+10px)] z-50 flex h-[68px] items-stretch rounded-[30px] px-2"
  >
    <button
      v-for="tab in tabs"
      :key="tab.name"
      type="button"
      class="relative flex flex-1 flex-col items-center justify-center gap-1 outline-none"
      :aria-current="isActive(tab.to) ? 'page' : undefined"
      @click="go(tab.to)"
    >
      <template v-if="tab.center">
        <!-- The scanner button breaks out of the bar and glows. -->
        <span
          class="press absolute -top-6 flex h-[58px] w-[58px] items-center justify-center rounded-full bg-gradient-to-br from-wine-500 to-wine-700 text-white shadow-float transition-all duration-400 ease-spring"
          :class="isActive(tab.to) ? 'scale-105 shadow-glow' : ''"
        >
          <span
            class="absolute inset-0 rounded-full border border-white/40"
            :class="isActive(tab.to) && 'animate-ping-slow'"
          />
          <AppIcon name="scan" :size="26" :stroke="1.9" />
        </span>
        <span class="mt-8 text-[10px] font-medium text-ink-muted">{{ tab.label }}</span>
      </template>

      <template v-else>
        <AppIcon
          :name="tab.icon"
          :size="24"
          class="transition-all duration-400 ease-spring"
          :class="isActive(tab.to) ? 'scale-[1.18] text-wine-600' : 'scale-100 text-ink-faint'"
        />
        <span
          class="text-[10px] font-medium transition-colors duration-300"
          :class="isActive(tab.to) ? 'text-wine-600' : 'text-ink-faint'"
        >
          {{ tab.label }}
        </span>
        <span
          class="absolute bottom-1.5 h-1 w-1 rounded-full bg-gold transition-all duration-300"
          :class="isActive(tab.to) ? 'opacity-100' : 'opacity-0'"
        />
      </template>
    </button>
  </nav>
</template>

<style scoped>
@keyframes ping-slow {
  0% {
    transform: scale(1);
    opacity: 0.7;
  }
  100% {
    transform: scale(1.45);
    opacity: 0;
  }
}
.animate-ping-slow {
  animation: ping-slow 2.2s cubic-bezier(0, 0, 0.2, 1) infinite;
}
</style>
