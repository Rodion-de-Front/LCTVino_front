<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import GlassButton from '@/components/ui/GlassButton.vue'
import { isStandalone } from '@/pwa/register'
import { useUiStore } from '@/stores/ui'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'vinora:a2hs-dismissed'

const ui = useUiStore()
const deferred = ref<BeforeInstallPromptEvent | null>(null)

function onBeforeInstall(event: Event) {
  event.preventDefault()
  deferred.value = event as BeforeInstallPromptEvent
  ui.installPromptReady = true
  if (localStorage.getItem(DISMISS_KEY) || isStandalone()) return
  window.setTimeout(() => ui.openModal('install'), 6000)
}

async function install() {
  const event = deferred.value
  if (!event) return
  await event.prompt()
  const { outcome } = await event.userChoice
  ui.closeModal('install')
  deferred.value = null
  ui.installPromptReady = false
  if (outcome === 'accepted') ui.notify({ type: 'success', title: 'Vinora добавлена на экран' })
}

function dismiss() {
  localStorage.setItem(DISMISS_KEY, '1')
  ui.closeModal('install')
}

onMounted(() => window.addEventListener('beforeinstallprompt', onBeforeInstall))
onBeforeUnmount(() => window.removeEventListener('beforeinstallprompt', onBeforeInstall))
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="ui.modals.install"
        class="fixed inset-0 z-[80] flex items-end justify-center bg-wine-900/35 p-4 pb-[calc(var(--safe-bottom)+20px)] backdrop-blur-[8px]"
        @click.self="dismiss"
      >
        <Transition name="sheet" appear>
          <div class="glass-strong w-full max-w-md rounded-sheet p-6 text-center">
            <span
              class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[20px] bg-gradient-to-br from-wine-500 to-wine-700 text-white shadow-float"
            >
              <AppIcon name="glass" :size="32" />
            </span>
            <h2 class="text-title-lg text-ink">Vinora на домашнем экране</h2>
            <p class="mt-2 text-footnote text-ink-muted">
              Быстрый запуск, полноэкранный режим и доступ к погребу даже без интернета.
            </p>

            <div class="mt-5 flex flex-col gap-2">
              <GlassButton variant="primary" size="lg" block @click="install">
                <AppIcon name="download" :size="19" />
                Установить
              </GlassButton>
              <GlassButton variant="ghost" block @click="dismiss">Не сейчас</GlassButton>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>
