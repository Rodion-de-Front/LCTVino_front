import { computed, onBeforeUnmount, ref, watch, type Ref } from 'vue'

const THRESHOLD = 88
const MAX_PULL = 140

/**
 * Touch-driven pull-to-refresh with rubber-band resistance.
 * Only engages when the container is already scrolled to the top.
 */
export function usePullToRefresh(
  container: Ref<HTMLElement | null>,
  onRefresh: () => Promise<unknown> | unknown,
) {
  const distance = ref(0)
  const refreshing = ref(false)
  const armed = computed(() => distance.value >= THRESHOLD)
  const progress = computed(() => Math.min(1, distance.value / THRESHOLD))

  let startY = 0
  let tracking = false

  const onTouchStart = (event: TouchEvent) => {
    if (refreshing.value || !container.value) return
    tracking = container.value.scrollTop <= 0
    startY = event.touches[0].clientY
  }

  const onTouchMove = (event: TouchEvent) => {
    if (!tracking || refreshing.value) return
    const delta = event.touches[0].clientY - startY
    if (delta <= 0) {
      distance.value = 0
      return
    }
    // Resistance curve: the further you pull, the slower it follows.
    distance.value = Math.min(MAX_PULL, delta * 0.55 * (1 - distance.value / (MAX_PULL * 2.4)))
    if (distance.value > 4 && event.cancelable) event.preventDefault()
  }

  const onTouchEnd = async () => {
    if (!tracking) return
    tracking = false
    if (!armed.value) {
      distance.value = 0
      return
    }
    refreshing.value = true
    distance.value = THRESHOLD
    try {
      await onRefresh()
    } finally {
      refreshing.value = false
      distance.value = 0
    }
  }

  const attach = (el: HTMLElement) => {
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: false })
    el.addEventListener('touchend', onTouchEnd)
    el.addEventListener('touchcancel', onTouchEnd)
  }
  const detach = (el: HTMLElement) => {
    el.removeEventListener('touchstart', onTouchStart)
    el.removeEventListener('touchmove', onTouchMove)
    el.removeEventListener('touchend', onTouchEnd)
    el.removeEventListener('touchcancel', onTouchEnd)
  }

  watch(
    container,
    (el, previous) => {
      if (previous) detach(previous)
      if (el) attach(el)
    },
    { immediate: true },
  )

  onBeforeUnmount(() => {
    if (container.value) detach(container.value)
  })

  return { distance, refreshing, armed, progress }
}
