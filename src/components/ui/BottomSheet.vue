<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue'

const props = withDefaults(
  defineProps<{ title?: string; fullHeight?: boolean; dismissible?: boolean }>(),
  { title: '', fullHeight: false, dismissible: true },
)

const open = defineModel<boolean>('open', { default: false })

const dragY = ref(0)
const dragging = ref(false)
let startY = 0

function onTouchStart(event: TouchEvent) {
  if (!props.dismissible) return
  dragging.value = true
  startY = event.touches[0].clientY
}

function onTouchMove(event: TouchEvent) {
  if (!dragging.value) return
  // Downward drags follow the finger; upward drags get heavy resistance.
  const delta = event.touches[0].clientY - startY
  dragY.value = delta > 0 ? delta : delta * 0.18
}

function onTouchEnd() {
  if (!dragging.value) return
  dragging.value = false
  if (dragY.value > 110) close()
  dragY.value = 0
}

function close() {
  if (props.dismissible) open.value = false
}

const onKey = (event: KeyboardEvent) => event.key === 'Escape' && close()

watch(open, (value) => {
  document.body.style.overflow = value ? 'hidden' : ''
  value ? window.addEventListener('keydown', onKey) : window.removeEventListener('keydown', onKey)
})

onBeforeUnmount(() => {
  document.body.style.overflow = ''
  window.removeEventListener('keydown', onKey)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-[70] bg-wine-900/30 backdrop-blur-[6px]"
        @click="close"
      />
    </Transition>

    <Transition name="sheet">
      <section
        v-if="open"
        role="dialog"
        aria-modal="true"
        class="glass-strong fixed inset-x-0 bottom-0 z-[71] flex flex-col rounded-t-sheet pb-[calc(var(--safe-bottom)+16px)]"
        :class="fullHeight ? 'top-[8vh]' : 'max-h-[86vh]'"
        :style="{
          transform: dragY ? `translateY(${dragY}px)` : undefined,
          transition: dragging ? 'none' : undefined,
        }"
      >
        <header
          class="shrink-0 cursor-grab touch-none px-5 pb-2 pt-3 active:cursor-grabbing"
          @touchstart.passive="onTouchStart"
          @touchmove.passive="onTouchMove"
          @touchend="onTouchEnd"
        >
          <div class="mx-auto h-1.5 w-11 rounded-pill bg-ink/15" />
          <div v-if="title || $slots.actions" class="mt-3 flex items-center justify-between gap-3">
            <h2 class="text-title text-ink">{{ title }}</h2>
            <slot name="actions" />
          </div>
        </header>

        <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-2">
          <slot />
        </div>

        <footer v-if="$slots.footer" class="shrink-0 px-5 pt-3">
          <slot name="footer" />
        </footer>
      </section>
    </Transition>
  </Teleport>
</template>
