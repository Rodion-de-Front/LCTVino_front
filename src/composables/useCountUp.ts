import { onBeforeUnmount, ref, watch } from 'vue'

const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t))

/** Animates a number from 0 to `target` — used for the profile statistics. */
export function useCountUp(target: () => number, duration = 1100, delay = 0) {
  const value = ref(0)
  let frame = 0

  function run(to: number) {
    cancelAnimationFrame(frame)
    const from = value.value
    const start = performance.now() + delay
    const tick = (now: number) => {
      const elapsed = now - start
      if (elapsed < 0) {
        frame = requestAnimationFrame(tick)
        return
      }
      const t = Math.min(1, elapsed / duration)
      value.value = Math.round(from + (to - from) * easeOutExpo(t))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
  }

  watch(target, (to) => run(to), { immediate: true })
  onBeforeUnmount(() => cancelAnimationFrame(frame))

  return value
}
