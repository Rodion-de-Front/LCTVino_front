<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import SplashScreen from '@/components/layout/SplashScreen.vue'
import TabBar from '@/components/layout/TabBar.vue'
import ToastStack from '@/components/layout/ToastStack.vue'
import InstallPrompt from '@/components/pwa/InstallPrompt.vue'
import OfflineBanner from '@/components/pwa/OfflineBanner.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import GlassButton from '@/components/ui/GlassButton.vue'
import { startMockApi } from '@/mocks/browser'
import { registerServiceWorker, type SwHandle } from '@/pwa/register'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const route = useRoute()
const ui = useUiStore()
const auth = useAuthStore()

const booting = ref(true)
const bootProgress = ref(0.08)
const swHandle = ref<SwHandle | null>(null)

const showChrome = computed(() => !route.meta.hideChrome && auth.isAuthenticated)
const transitionName = computed(() =>
  route.meta.hideChrome ? 'nav-fade' : `nav-${ui.navDirection}`,
)

onMounted(async () => {
  // The service worker must exist before MSW looks for one to adopt.
  swHandle.value = await registerServiceWorker(() => (ui.updateAvailable = true)).catch(() => null)
  bootProgress.value = 0.4

  await startMockApi()
  bootProgress.value = 0.7

  await auth.hydrate()
  bootProgress.value = 1

  window.setTimeout(() => (booting.value = false), 320)
})
</script>

<template>
  <Transition name="fade">
    <SplashScreen v-if="booting" :progress="bootProgress" />
  </Transition>

  <div v-if="!booting" class="relative z-10 h-full">
    <RouterView v-slot="{ Component }">
      <Transition :name="transitionName" mode="out-in">
        <component :is="Component" :key="route.path" />
      </Transition>
    </RouterView>

    <TabBar v-if="showChrome" />
    <OfflineBanner />
    <ToastStack />
    <InstallPrompt />

    <Transition name="pop">
      <div
        v-if="ui.updateAvailable"
        class="glass-strong fixed inset-x-4 bottom-[calc(var(--safe-bottom)+96px)] z-[85] flex items-center gap-3 rounded-glass p-3"
      >
        <AppIcon name="refresh" :size="20" class="text-wine-600" />
        <p class="flex-1 text-footnote text-ink">Доступна новая версия</p>
        <GlassButton size="sm" variant="primary" @click="swHandle?.applyUpdate()">
          Обновить
        </GlassButton>
      </div>
    </Transition>
  </div>
</template>
