const SW_URL = '/sw.js'

/** Registers the production Workbox service worker. */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return null

  const registration = await navigator.serviceWorker.register(SW_URL, { type: 'classic' })
  const applyUpdate = () => registration.waiting?.postMessage({ type: 'SKIP_WAITING' })

  const watchInstalling = (worker: ServiceWorker | null) => {
    if (!worker) return
    worker.addEventListener('statechange', () => {
      if (worker.state === 'installed' && navigator.serviceWorker.controller) applyUpdate()
    })
  }

  if (registration.waiting && navigator.serviceWorker.controller) applyUpdate()
  watchInstalling(registration.installing)
  registration.addEventListener('updatefound', () => watchInstalling(registration.installing))

  let reloading = false
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return
    reloading = true
    window.location.reload()
  })

  return registration
}

export const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as unknown as { standalone?: boolean }).standalone === true
