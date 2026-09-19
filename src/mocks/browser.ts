import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)

export async function startMockApi() {
  await worker.start({
    serviceWorker: { url: '/mockServiceWorker.js' },
    // In production the mock script is bundled into our own `/sw.js`, so MSW
    // must adopt that registration instead of installing a competing worker.
    findWorker: (scriptUrl) =>
      import.meta.env.PROD ? scriptUrl.endsWith('/sw.js') : scriptUrl.includes('mockServiceWorker'),
    onUnhandledRequest: 'bypass',
    quiet: true,
  })
}
