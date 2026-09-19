const SW_URL = '/sw.js'

export interface SwHandle {
  registration: ServiceWorkerRegistration
  /** Activates a waiting worker and reloads once it takes control. */
  applyUpdate: () => void
}

/**
 * Registers the merged Workbox + MSW worker.
 *
 * Only production builds ship `/sw.js`; in dev MSW registers its own worker
 * and Workbox stays out of the way.
 */
export async function registerServiceWorker(
  onUpdateAvailable: () => void,
): Promise<SwHandle | null> {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return null

  const registration = await navigator.serviceWorker.register(SW_URL, { type: 'classic' })

  const watchInstalling = (worker: ServiceWorker | null) => {
    if (!worker) return
    worker.addEventListener('statechange', () => {
      if (worker.state === 'installed' && navigator.serviceWorker.controller) onUpdateAvailable()
    })
  }

  if (registration.waiting && navigator.serviceWorker.controller) onUpdateAvailable()
  watchInstalling(registration.installing)
  registration.addEventListener('updatefound', () => watchInstalling(registration.installing))

  let reloading = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return
    reloading = true
    window.location.reload()
  })

  return {
    registration,
    applyUpdate: () => registration.waiting?.postMessage({ type: 'SKIP_WAITING' }),
  }
}

export const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as unknown as { standalone?: boolean }).standalone === true
