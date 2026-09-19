const WINE_COLORS = ['#722F37', '#8B3A3A', '#C9A961', '#D4A574', '#E2A0A6', '#FBF4F4']

interface BurstOptions {
  count?: number
  spread?: number
  power?: number
  colors?: string[]
  shape?: 'confetti' | 'heart'
}

/**
 * Lightweight DOM confetti — no canvas, no dependency.
 * Particles are absolutely positioned and animated with the Web Animations API.
 */
export function burst(origin: HTMLElement | { x: number; y: number }, options: BurstOptions = {}) {
  if (document.documentElement.classList.contains('motion-off')) return

  const { count = 18, spread = 360, power = 120, colors = WINE_COLORS, shape = 'confetti' } = options

  let x: number
  let y: number
  if (origin instanceof HTMLElement) {
    const rect = origin.getBoundingClientRect()
    x = rect.left + rect.width / 2
    y = rect.top + rect.height / 2
  } else {
    x = origin.x
    y = origin.y
  }

  const layer = document.createElement('div')
  layer.style.cssText = `position:fixed;left:0;top:0;width:0;height:0;pointer-events:none;z-index:90;`
  document.body.appendChild(layer)

  for (let i = 0; i < count; i++) {
    const particle = document.createElement('span')
    const color = colors[i % colors.length]
    const size = shape === 'heart' ? 10 + Math.random() * 8 : 5 + Math.random() * 6
    particle.style.cssText = [
      'position:absolute',
      `left:${x}px`,
      `top:${y}px`,
      `width:${size}px`,
      `height:${shape === 'confetti' ? size * (0.6 + Math.random()) : size}px`,
      `background:${color}`,
      shape === 'heart' ? 'clip-path:polygon(50% 100%,0 35%,15% 0,50% 20%,85% 0,100% 35%)' : `border-radius:${Math.random() > 0.5 ? '50%' : '2px'}`,
      'will-change:transform,opacity',
    ].join(';')
    layer.appendChild(particle)

    const angle = ((Math.random() * spread - spread / 2 - 90) * Math.PI) / 180
    const velocity = power * (0.45 + Math.random() * 0.85)
    const dx = Math.cos(angle) * velocity
    const dy = Math.sin(angle) * velocity
    const duration = 750 + Math.random() * 650

    particle
      .animate(
        [
          { transform: 'translate3d(0,0,0) rotate(0deg) scale(1)', opacity: 1 },
          {
            transform: `translate3d(${dx * 0.62}px, ${dy * 0.62 + 18}px, 0) rotate(${Math.random() * 220}deg) scale(1)`,
            opacity: 1,
            offset: 0.55,
          },
          {
            transform: `translate3d(${dx}px, ${dy + 190}px, 0) rotate(${Math.random() * 520}deg) scale(0.4)`,
            opacity: 0,
          },
        ],
        { duration, easing: 'cubic-bezier(0.16, 0.9, 0.3, 1)', fill: 'forwards' },
      )
      .addEventListener('finish', () => particle.remove())
  }

  window.setTimeout(() => layer.remove(), 1800)
}

/** Full-width celebration used at the end of onboarding. */
export function celebrate() {
  const y = window.innerHeight * 0.32
  burst({ x: window.innerWidth * 0.2, y }, { count: 26, power: 200, spread: 120 })
  window.setTimeout(
    () => burst({ x: window.innerWidth * 0.8, y }, { count: 26, power: 200, spread: 120 }),
    140,
  )
  window.setTimeout(
    () => burst({ x: window.innerWidth * 0.5, y: y * 0.8 }, { count: 34, power: 240, spread: 180 }),
    280,
  )
}
