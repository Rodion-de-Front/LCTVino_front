<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import BrandLogo from '@/components/layout/BrandLogo.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import GlassButton from '@/components/ui/GlassButton.vue'
import { isStandalone } from '@/pwa/register'
import { useUiStore } from '@/stores/ui'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'vinora:a2hs-dismissed-until'
const SESSION_BANNER_KEY = 'vinora:a2hs-session-banner'
const DISMISS_TTL = 1000 * 60 * 60 * 24
const BANNER_DELAY = 1200

const ui = useUiStore()
const deferred = ref<BeforeInstallPromptEvent | null>(null)
const showBanner = ref(false)
let bannerTimer: number | undefined
const hasNativePrompt = computed(() => Boolean(deferred.value))
const isIosDevice = computed(() => {
  const platform = navigator.platform || ''
  const ua = navigator.userAgent || ''
  const touchMac = platform === 'MacIntel' && navigator.maxTouchPoints > 1
  return /iPad|iPhone|iPod/.test(ua) || touchMac
})
const isAndroidDevice = computed(() => /Android/i.test(navigator.userAgent || ''))
const instructionTitle = computed(() =>
  isIosDevice.value ? 'Установите через браузер' : 'Своё Вино на домашнем экране',
)

function isDismissed() {
  const dismissedUntil = Number(localStorage.getItem(DISMISS_KEY) || 0)
  if (!dismissedUntil) return false
  if (Date.now() < dismissedUntil) return true
  localStorage.removeItem(DISMISS_KEY)
  return false
}

function canOfferInstall() {
  return !isStandalone() && !isDismissed()
}

function scheduleBanner(delay = 6000) {
  if (!canOfferInstall() || sessionStorage.getItem(SESSION_BANNER_KEY)) return
  if (bannerTimer) window.clearTimeout(bannerTimer)
  bannerTimer = window.setTimeout(() => {
    if (!canOfferInstall() || sessionStorage.getItem(SESSION_BANNER_KEY) || ui.modals.install) return
    showBanner.value = true
    sessionStorage.setItem(SESSION_BANNER_KEY, '1')
  }, delay)
}

function onBeforeInstall(event: Event) {
  event.preventDefault()
  deferred.value = event as BeforeInstallPromptEvent
  ui.installPromptReady = true
  scheduleBanner(BANNER_DELAY)
}

async function install() {
  const event = deferred.value
  if (!event) {
    ui.closeModal('install')
    return
  }
  showBanner.value = false
  await event.prompt()
  await event.userChoice
  ui.closeModal('install')
  deferred.value = null
  ui.installPromptReady = false
}

async function requestInstall() {
  if (isStandalone()) return
  if (isAndroidDevice.value && deferred.value) {
    await install()
    return
  }
  showBanner.value = false
  ui.openModal('install')
}

function dismiss() {
  localStorage.setItem(DISMISS_KEY, String(Date.now() + DISMISS_TTL))
  showBanner.value = false
  ui.closeModal('install')
}

function closeBanner() {
  showBanner.value = false
}

onMounted(() => {
  window.addEventListener('beforeinstallprompt', onBeforeInstall)
  window.addEventListener('vinora:install-request', requestInstall)
  scheduleBanner()
})
onBeforeUnmount(() => {
  if (bannerTimer) window.clearTimeout(bannerTimer)
  window.removeEventListener('beforeinstallprompt', onBeforeInstall)
  window.removeEventListener('vinora:install-request', requestInstall)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="pop">
      <div
        v-if="showBanner"
        class="glass-strong fixed inset-x-4 bottom-[calc(var(--tabbar-h)+var(--safe-bottom)+16px)] z-[82] flex items-center gap-3 rounded-glass p-3"
      >
        <AppIcon name="download" :size="20" class="shrink-0 text-wine-600" />
        <p class="min-w-0 flex-1 text-footnote text-ink">
          Установите Своё Вино на домашний экран
        </p>
        <GlassButton size="sm" variant="primary" @click="requestInstall">Скачать</GlassButton>
        <button type="button" class="press text-ink-faint" aria-label="Скрыть" @click="closeBanner">
          <AppIcon name="close" :size="18" />
        </button>
      </div>
    </Transition>

    <Transition name="fade">
      <div
        v-if="ui.modals.install"
        class="fixed inset-0 z-[80] flex items-end justify-center bg-wine-900/35 p-4 pb-[calc(var(--safe-bottom)+20px)] backdrop-blur-[8px]"
        @click.self="dismiss"
      >
        <Transition name="sheet" appear>
          <div class="glass-strong w-full max-w-md rounded-sheet p-6 text-center">
            <BrandLogo size="md" stacked class="justify-center" />
            <h2 class="mt-4 text-title-lg text-ink">{{ instructionTitle }}</h2>
            <p class="mt-2 text-footnote text-ink-muted">
              Быстрый запуск, полноэкранный режим и доступ к погребу даже без интернета.
            </p>
            <ol
              v-if="isIosDevice"
              class="mt-4 space-y-2 rounded-glass bg-white/55 p-4 text-left text-footnote text-ink-muted"
            >
              <li>1. Нажмите кнопку «Поделиться» внизу Safari.</li>
              <li>2. Выберите «На экран Домой».</li>
              <li>3. Нажмите «Добавить».</li>
            </ol>
            <p v-else-if="!hasNativePrompt" class="mt-3 text-caption text-ink-muted">
              Откройте меню браузера и выберите установку приложения на домашний экран.
            </p>

            <div class="mt-5 flex flex-col gap-2">
              <GlassButton
                v-if="hasNativePrompt && !isIosDevice"
                variant="primary"
                size="lg"
                block
                @click="install"
              >
                <AppIcon name="download" :size="19" />
                Установить
              </GlassButton>
              <GlassButton v-else variant="primary" size="lg" block @click="ui.closeModal('install')">
                Понятно
              </GlassButton>
              <GlassButton variant="ghost" block @click="dismiss">Не сейчас</GlassButton>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
