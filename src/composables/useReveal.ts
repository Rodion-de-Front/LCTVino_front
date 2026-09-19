import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

/** Fires `onEnter` whenever the element scrolls into view — the infinite-scroll trigger. */
export function useInView(target: Ref<HTMLElement | null>, onEnter: () => void, rootMargin = '320px') {
  let observer: IntersectionObserver | null = null

  onMounted(() => {
    if (!('IntersectionObserver' in window)) return
    observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && onEnter()),
      { rootMargin },
    )
    if (target.value) observer.observe(target.value)
  })

  onBeforeUnmount(() => observer?.disconnect())

  return {
    observe: (el: HTMLElement | null) => el && observer?.observe(el),
  }
}

/** Reveal-on-scroll flag for a single element, used for fade-in of new items. */
export function useRevealed(target: Ref<HTMLElement | null>) {
  const revealed = ref(false)
  let observer: IntersectionObserver | null = null

  onMounted(() => {
    if (!('IntersectionObserver' in window)) {
      revealed.value = true
      return
    }
    observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          revealed.value = true
          observer?.disconnect()
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 },
    )
    if (target.value) observer.observe(target.value)
  })

  onBeforeUnmount(() => observer?.disconnect())
  return revealed
}
