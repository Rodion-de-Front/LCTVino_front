<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import SplashScreen from '@/components/layout/SplashScreen.vue'
import TabBar from '@/components/layout/TabBar.vue'
import InstallPrompt from '@/components/pwa/InstallPrompt.vue'
import OfflineBanner from '@/components/pwa/OfflineBanner.vue'
import { registerServiceWorker } from '@/pwa/register'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const route = useRoute()
const ui = useUiStore()
const auth = useAuthStore()

const booting = ref(true)
const bootProgress = ref(0.08)

const showChrome = computed(() => !route.meta.hideChrome && auth.isAuthenticated)
const transitionName = computed(() =>
  route.meta.hideChrome ? 'nav-fade' : `nav-${ui.navDirection}`,
)

onMounted(async () => {
  await registerServiceWorker().catch(() => null)
  bootProgress.value = 0.4

  if (!import.meta.env.PROD && 'serviceWorker' in navigator) {
    const registrations = await navigator.serviceWorker.getRegistrations()
    await Promise.all(registrations.map((registration) => registration.unregister()))
    if (navigator.serviceWorker.controller) {
      window.location.reload()
      return
    }
  }
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
  </div>

  <InstallPrompt />
</template>
