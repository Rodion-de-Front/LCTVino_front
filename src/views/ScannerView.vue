<script setup lang="ts">
import { useUserMedia } from '@vueuse/core'
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import SpinningBottleLoader from '@/components/loaders/SpinningBottleLoader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import BottomSheet from '@/components/ui/BottomSheet.vue'
import GlassButton from '@/components/ui/GlassButton.vue'
import LazyImage from '@/components/ui/LazyImage.vue'
import StarRating from '@/components/ui/StarRating.vue'
import { scanApi } from '@/api'
import { errorMessage } from '@/api/client'
import { useUiStore } from '@/stores/ui'
import { useUserStore } from '@/stores/user'
import type { ScanResult } from '@/types'

const router = useRouter()
const ui = useUiStore()
const userStore = useUserStore()

const video = ref<HTMLVideoElement | null>(null)
const mode = ref<'label' | 'qr'>('label')
const scanning = ref(false)
const result = ref<ScanResult | null>(null)
const resultOpen = ref(false)
const cameraError = ref<string | null>(null)
const flash = ref(false)

const { stream, start, stop, isSupported } = useUserMedia({
  constraints: { video: { facingMode: 'environment' }, audio: false },
})

watch(stream, (value) => {
  if (video.value) video.value.srcObject = value ?? null
})

async function openCamera() {
  cameraError.value = null
  try {
    await start()
  } catch (error) {
    cameraError.value =
      error instanceof DOMException && error.name === 'NotAllowedError'
        ? 'Нет доступа к камере. Разрешите его в настройках браузера.'
        : 'Камера недоступна на этом устройстве.'
  }
}

async function capture() {
  if (scanning.value) return
  flash.value = true
  ui.haptic([14, 28, 14])
  window.setTimeout(() => (flash.value = false), 220)

  scanning.value = true
  try {
    result.value = mode.value === 'qr' ? await scanApi.qr() : await scanApi.label()
    resultOpen.value = true
    ui.haptic([10, 20, 10, 20, 30])
  } catch (error) {
    ui.notify({ type: 'error', title: errorMessage(error, 'Не удалось распознать') })
  } finally {
    scanning.value = false
  }
}

async function addToCellar() {
  if (!result.value) return
  await userStore.addWine(result.value.wine.id)
  resultOpen.value = false
}

function openWine() {
  if (!result.value) return
  resultOpen.value = false
  router.push(`/wine/${result.value.wine.id}`)
}

const confidenceLabel = computed(() =>
  result.value ? `${Math.round(result.value.confidence * 100)}% совпадение` : '',
)

onMounted(openCamera)
onBeforeUnmount(() => stop())
</script>

<template>
  <div class="relative h-full overflow-hidden bg-wine-900">
    <video
      ref="video"
      autoplay
      playsinline
      muted
      class="absolute inset-0 h-full w-full object-cover"
    />

    <!-- Fallback backdrop when there is no camera feed -->
    <div
      v-if="!stream"
      class="absolute inset-0 bg-[radial-gradient(90%_70%_at_50%_20%,#5C262C,#2B1214)]"
    />

    <Transition name="fade">
      <div v-if="flash" class="absolute inset-0 z-30 bg-white" />
    </Transition>

    <!-- Viewfinder -->
    <div class="pointer-events-none absolute inset-0 flex items-center justify-center">
      <div
        class="relative rounded-[32px] border-2 border-white/70 transition-all duration-500 ease-spring"
        :class="mode === 'qr' ? 'h-60 w-60' : 'h-[46vh] w-[62vw]'"
      >
        <!-- L-shaped corner accents: each keeps only two of its borders. -->
        <span
          v-for="corner in [
            '-top-1 -left-1 rounded-tl-[14px] border-l-[3px] border-t-[3px]',
            '-top-1 -right-1 rounded-tr-[14px] border-r-[3px] border-t-[3px]',
            '-bottom-1 -left-1 rounded-bl-[14px] border-b-[3px] border-l-[3px]',
            '-bottom-1 -right-1 rounded-br-[14px] border-b-[3px] border-r-[3px]',
          ]"
          :key="corner"
          class="absolute h-8 w-8 border-gold"
          :class="corner"
        />
        <!-- Sweeping scan line -->
        <span class="absolute inset-x-3 top-0 h-0.5 rounded-pill bg-gold/90 shadow-glow animate-scan" />
      </div>
    </div>

    <header
      class="absolute inset-x-3 top-[calc(var(--safe-top)+10px)] z-20 flex items-center gap-2"
    >
      <button
        type="button"
        class="press glass-dark flex h-11 w-11 items-center justify-center rounded-full"
        aria-label="Назад"
        @click="router.back()"
      >
        <AppIcon name="chevronLeft" :size="21" />
      </button>
      <div class="glass-dark flex flex-1 items-center justify-center rounded-full px-4 py-2.5">
        <p class="text-footnote">
          {{ mode === 'qr' ? 'Наведите на QR-код бутылки' : 'Наведите камеру на этикетку' }}
        </p>
      </div>
    </header>

    <Transition name="pop">
      <div
        v-if="cameraError"
        class="glass-dark absolute inset-x-5 top-1/2 z-20 -translate-y-1/2 rounded-sheet p-5 text-center"
      >
        <AppIcon name="camera" :size="30" class="mx-auto opacity-80" />
        <p class="mt-3 text-footnote">{{ cameraError }}</p>
        <GlassButton v-if="isSupported" class="mt-4" variant="gold" size="sm" @click="openCamera">
          Повторить
        </GlassButton>
      </div>
    </Transition>

    <!-- Controls -->
    <footer
      class="glass-dark absolute inset-x-3 bottom-[calc(var(--safe-bottom)+12px)] z-20 rounded-sheet px-5 pb-5 pt-4"
    >
      <div class="mx-auto mb-4 flex w-fit rounded-pill bg-white/10 p-1">
        <button
          v-for="option in (['label', 'qr'] as const)"
          :key="option"
          type="button"
          class="rounded-pill px-5 py-1.5 text-footnote transition-all duration-300"
          :class="mode === option ? 'bg-white/90 text-wine-700' : 'text-white/75'"
          @click="mode = option"
        >
          {{ option === 'label' ? 'Этикетка' : 'QR-код' }}
        </button>
      </div>

      <div class="flex items-center justify-between">
        <button
          type="button"
          class="press flex h-12 w-12 items-center justify-center rounded-full bg-white/12 text-white"
          aria-label="Каталог"
          @click="router.push('/catalog')"
        >
          <AppIcon name="glass" :size="22" />
        </button>

        <button
          v-ripple="'rgba(255,255,255,0.5)'"
          type="button"
          :disabled="scanning"
          class="press relative flex h-[78px] w-[78px] items-center justify-center rounded-full border-4 border-white/85 bg-gradient-to-br from-wine-500 to-wine-700 text-white shadow-glow disabled:opacity-70"
          aria-label="Сфотографировать"
          @click="capture"
        >
          <AppIcon :name="mode === 'qr' ? 'qr' : 'camera'" :size="30" />
        </button>

        <button
          type="button"
          class="press flex h-12 w-12 items-center justify-center rounded-full bg-white/12 text-white"
          aria-label="Мои вина"
          @click="router.push('/my-wines')"
        >
          <AppIcon name="bottle" :size="22" />
        </button>
      </div>
    </footer>

    <!-- Recognition loader -->
    <Transition name="fade">
      <div
        v-if="scanning"
        class="absolute inset-0 z-40 flex flex-col items-center justify-center gap-5 bg-wine-900/70 backdrop-blur-md"
      >
        <SpinningBottleLoader :size="130" />
        <p class="text-footnote text-white/85">Ищем вино в базе…</p>
      </div>
    </Transition>

    <BottomSheet v-model:open="resultOpen" title="Найдено">
      <div v-if="result" class="py-2">
        <div class="flex gap-4">
          <LazyImage
            :src="result.wine.image"
            :alt="result.wine.name"
            ratio="3 / 4"
            class="w-28 shrink-0"
            eager
          />
          <div class="min-w-0 flex-1">
            <p class="text-caption uppercase tracking-[0.14em] text-gold">
              {{ result.wine.producer }}
            </p>
            <h3 class="mt-1 text-title text-ink">{{ result.wine.name }}</h3>
            <p class="mt-1 text-footnote text-ink-muted">
              {{ result.wine.region }} · {{ result.wine.year }}
            </p>
            <div class="mt-2">
              <StarRating :model-value="result.wine.rating" :size="16" show-value animate-in />
            </div>
            <span
              class="mt-3 inline-block rounded-pill bg-wine-500/12 px-3 py-1 text-caption text-wine-700"
            >
              {{ confidenceLabel }}
            </span>
          </div>
        </div>

        <p class="mt-4 text-footnote leading-relaxed text-ink-muted">
          {{ result.wine.description }}
        </p>
      </div>

      <template #footer>
        <div class="flex gap-2">
          <GlassButton variant="primary" size="md" block @click="addToCellar">Добавить</GlassButton>
          <GlassButton variant="gold" size="md" block @click="openWine">В каталог</GlassButton>
        </div>
      </template>
    </BottomSheet>
  </div>
</template>

<style scoped>
@keyframes scan-sweep {
  0% {
    top: 6%;
    opacity: 0;
  }
  12% {
    opacity: 1;
  }
  88% {
    opacity: 1;
  }
  100% {
    top: 94%;
    opacity: 0;
  }
}
.animate-scan {
  animation: scan-sweep 2.6s cubic-bezier(0.45, 0, 0.55, 1) infinite;
  height: 2px;
}
</style>
