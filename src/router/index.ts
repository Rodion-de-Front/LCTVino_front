import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

declare module 'vue-router' {
  interface RouteMeta {
    requiresAuth?: boolean
    guest?: boolean
    /** Position in the navigation hierarchy — drives the slide direction. */
    depth?: number
    hideChrome?: boolean
    title?: string
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/auth',
    name: 'auth',
    component: () => import('@/views/AuthView.vue'),
    meta: { guest: true, depth: 0, hideChrome: true },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/RegisterView.vue'),
    meta: { guest: true, depth: 1, hideChrome: true },
  },
  {
    path: '/onboarding',
    name: 'onboarding',
    component: () => import('@/views/OnboardingView.vue'),
    meta: { requiresAuth: true, depth: 2, hideChrome: true },
  },
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeFeed.vue'),
    meta: { requiresAuth: true, depth: 1, title: 'Лента' },
  },
  {
    path: '/catalog',
    name: 'catalog',
    component: () => import('@/views/CatalogView.vue'),
    meta: { requiresAuth: true, depth: 1, title: 'Каталог' },
  },
  {
    path: '/catalog/:wineId',
    name: 'catalog-wine',
    component: () => import('@/views/WineDetailView.vue'),
    meta: { requiresAuth: true, depth: 2 },
  },
  {
    path: '/scanner',
    name: 'scanner',
    component: () => import('@/views/ScannerView.vue'),
    meta: { requiresAuth: true, depth: 1, hideChrome: true },
  },
  {
    path: '/my-wines',
    name: 'my-wines',
    component: () => import('@/views/MyWinesView.vue'),
    meta: { requiresAuth: true, depth: 1, title: 'Мои вина' },
  },
  {
    path: '/profile',
    name: 'profile',
    component: () => import('@/views/ProfileView.vue'),
    meta: { requiresAuth: true, depth: 1, title: 'Профиль' },
  },
  {
    path: '/profile/:userId',
    name: 'user-profile',
    component: () => import('@/views/UserProfileView.vue'),
    meta: { requiresAuth: true, depth: 2 },
  },
  {
    path: '/wine/:wineId',
    name: 'wine',
    component: () => import('@/views/WineDetailView.vue'),
    meta: { requiresAuth: true, depth: 2 },
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: (_to, _from, saved) => saved ?? { top: 0 },
})

router.beforeEach((to, from) => {
  const auth = useAuthStore()
  const ui = useUiStore()

  const toDepth = to.meta.depth ?? 0
  const fromDepth = from.meta.depth ?? 0
  ui.navDirection = toDepth < fromDepth ? 'back' : 'forward'

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'auth', query: to.fullPath === '/' ? undefined : { redirect: to.fullPath } }
  }
  if (to.meta.guest && auth.isAuthenticated) {
    return { name: auth.needsOnboarding ? 'onboarding' : 'home' }
  }
  if (auth.isAuthenticated && auth.needsOnboarding && to.name !== 'onboarding') {
    return { name: 'onboarding' }
  }
  if (to.name === 'onboarding' && auth.isAuthenticated && !auth.needsOnboarding) {
    return { name: 'home' }
  }
  return true
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · Своё Вино` : 'Своё Вино'
})
