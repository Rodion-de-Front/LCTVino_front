import type { Directive } from 'vue'

export type RippleDirective = Directive<HTMLElement, string | undefined>

/** `v-ripple` — Material-style touch feedback tuned for the glass surfaces. */
export const vRipple: RippleDirective = {
  mounted(el, binding) {
    const color = binding.value ?? 'rgba(255, 255, 255, 0.55)'
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative'
    el.style.overflow = 'hidden'

    el.addEventListener('pointerdown', (event) => {
      if (document.documentElement.classList.contains('motion-off')) return
      const rect = el.getBoundingClientRect()
      const size = Math.max(rect.width, rect.height)
      const ripple = document.createElement('span')
      ripple.style.cssText = [
        'position:absolute',
        `left:${event.clientX - rect.left - size / 2}px`,
        `top:${event.clientY - rect.top - size / 2}px`,
        `width:${size}px`,
        `height:${size}px`,
        `background:${color}`,
        'border-radius:50%',
        'pointer-events:none',
        'transform:scale(0)',
        'opacity:0.5',
      ].join(';')
      el.appendChild(ripple)
      ripple
        .animate(
          [
            { transform: 'scale(0)', opacity: 0.5 },
            { transform: 'scale(2.6)', opacity: 0 },
          ],
          { duration: 560, easing: 'cubic-bezier(0.22, 0.8, 0.3, 1)', fill: 'forwards' },
        )
        .addEventListener('finish', () => ripple.remove())
    })
  },
}
