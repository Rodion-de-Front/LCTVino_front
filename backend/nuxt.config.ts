export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  nitro: {
    externals: {
      external: ['postgres'],
    },
  },
  routeRules: {
    '/api/**': { cors: true },
  },
  runtimeConfig: {
    databaseUrl: 'postgres://vinora:vinora@127.0.0.1:5432/vinora',
  },
})
