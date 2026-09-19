import { ref } from 'vue'

/** Pointer-following 3D tilt for catalog cards. */
export function useTilt(maxDeg = 9) {
  const style = ref({
    transform: 'perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0)',
    transition: 'transform 420ms cubic-bezier(0.32, 0.72, 0, 1)',
  })
  const glare = ref({ opacity: 0, transform: 'translate(0,0)' })

  function onMove(event: PointerEvent) {
    const el = event.currentTarget as HTMLElement
    const rect = el.getBoundingClientRect()
    const px = (event.clientX - rect.left) / rect.width
    const py = (event.clientY - rect.top) / rect.height
    style.value = {
      transform: `perspective(900px) rotateX(${(0.5 - py) * maxDeg * 2}deg) rotateY(${(px - 0.5) * maxDeg * 2}deg) translateZ(14px)`,
      transition: 'transform 120ms linear',
    }
    glare.value = { opacity: 0.35, transform: `translate(${px * 100 - 50}%, ${py * 100 - 50}%)` }
  }

  function onLeave() {
    style.value = {
      transform: 'perspective(900px) rotateX(0deg) rotateY(0deg) translateZ(0)',
      transition: 'transform 420ms cubic-bezier(0.32, 0.72, 0, 1)',
    }
    glare.value = { opacity: 0, transform: 'translate(0,0)' }
  }

  return { style, glare, onMove, onLeave }
}
