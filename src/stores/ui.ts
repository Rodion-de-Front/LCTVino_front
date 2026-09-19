import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { AppNotification } from '@/types'

type ModalName = 'comments' | 'filters' | 'editProfile' | 'createPost' | 'install' | 'wineSheet'

const MOTION_KEY = 'vinora:motion'

export const useUiStore = defineStore('ui', () => {
  const modals = ref<Record<ModalName, boolean>>({
    comments: false,
    filters: false,
    editProfile: false,
    createPost: false,
    install: false,
    wineSheet: false,
  })
  const loading = ref(false)
  const notifications = ref<AppNotification[]>([])
  const animationsEnabled = ref(localStorage.getItem(MOTION_KEY) !== 'off')
  const isOffline = ref(!navigator.onLine)
  const updateAvailable = ref(false)
  const installPromptReady = ref(false)
  const navDirection = ref<'forward' | 'back'>('forward')

  function openModal(name: ModalName) {
    modals.value[name] = true
  }
  function closeModal(name: ModalName) {
    modals.value[name] = false
  }
  function toggleModal(name: ModalName) {
    modals.value[name] = !modals.value[name]
  }

  function notify(notification: Omit<AppNotification, 'id'>, ttl = 3200) {
    const id = `n${Date.now()}${Math.random().toString(36).slice(2, 6)}`
    notifications.value.push({ ...notification, id })
    window.setTimeout(() => dismiss(id), ttl)
    return id
  }
  const dismiss = (id: string) => {
    notifications.value = notifications.value.filter((n) => n.id !== id)
  }

  function setAnimationsEnabled(value: boolean) {
    animationsEnabled.value = value
    localStorage.setItem(MOTION_KEY, value ? 'on' : 'off')
    document.documentElement.classList.toggle('motion-off', !value)
  }

  function haptic(pattern: number | number[] = 12) {
    if (!animationsEnabled.value) return
    navigator.vibrate?.(pattern)
  }

  document.documentElement.classList.toggle('motion-off', !animationsEnabled.value)
  window.addEventListener('online', () => (isOffline.value = false))
  window.addEventListener('offline', () => (isOffline.value = true))

  return {
    modals,
    loading,
    notifications,
    animationsEnabled,
    isOffline,
    updateAvailable,
    installPromptReady,
    navDirection,
    openModal,
    closeModal,
    toggleModal,
    notify,
    dismiss,
    setAnimationsEnabled,
    haptic,
  }
})
