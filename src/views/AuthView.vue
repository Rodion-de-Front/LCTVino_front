<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import AuthBackdrop from '@/components/layout/AuthBackdrop.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import GlassButton from '@/components/ui/GlassButton.vue'
import GlassField from '@/components/ui/GlassField.vue'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const auth = useAuthStore()
const ui = useUiStore()
const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')
const touched = ref(false)

const emailError = computed(() =>
  touched.value && !/^\S+@\S+\.\S+$/.test(email.value) ? 'Введите корректный email' : null,
)
const passwordError = computed(() =>
  touched.value && password.value.length < 6 ? 'Минимум 6 символов' : null,
)
const valid = computed(() => !emailError.value && !passwordError.value && email.value && password.value)

async function submit() {
  touched.value = true
  if (!valid.value) return
  try {
    const user = await auth.login(email.value.trim(), password.value)
    ui.notify({ type: 'success', title: `С возвращением, ${user.name.split(' ')[0]}` })
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : null
    router.replace(user.onboarded ? redirect ?? '/' : '/onboarding')
  } catch {
    ui.haptic([20, 40, 20])
  }
}

function useDemo() {
  email.value = 'anna@vinora.ru'
  password.value = 'vinora2026'
}
</script>

<template>
  <main class="scroll-page relative flex flex-col justify-center px-5 py-12">
    <AuthBackdrop />

    <div class="relative mx-auto w-full max-w-md">
      <div
        v-motion
        :initial="{ opacity: 0, y: 24 }"
        :enter="{ opacity: 1, y: 0, transition: { duration: 480 } }"
        class="mb-8 text-center"
      >
        <span
          class="mx-auto mb-4 flex h-[72px] w-[72px] items-center justify-center rounded-[24px] bg-gradient-to-br from-wine-500 to-wine-700 text-white shadow-float"
        >
          <AppIcon name="glass" :size="36" />
        </span>
        <h1 class="text-hero text-gradient-wine">Vinora</h1>
        <p class="mt-1 text-footnote text-ink-muted">Ваш винный дневник и сообщество</p>
      </div>

      <form
        v-motion
        :initial="{ opacity: 0, y: 32 }"
        :enter="{ opacity: 1, y: 0, transition: { duration: 520, delay: 120 } }"
        class="glass-strong space-y-4 rounded-sheet p-6"
        @submit.prevent="submit"
      >
        <h2 class="text-title text-ink">Вход</h2>

        <GlassField
          v-model="email"
          label="Email"
          type="email"
          autocomplete="email"
          :error="emailError"
        />
        <GlassField
          v-model="password"
          label="Пароль"
          type="password"
          autocomplete="current-password"
          :error="passwordError"
        />

        <Transition name="fade">
          <p v-if="auth.error" class="rounded-glass bg-[#B4404A]/10 px-4 py-2.5 text-footnote text-[#8B2F38]">
            {{ auth.error }}
          </p>
        </Transition>

        <GlassButton type="submit" variant="primary" size="lg" block :loading="auth.pending">
          Войти
        </GlassButton>

        <button
          type="button"
          class="w-full text-center text-footnote text-ink-muted underline-offset-4 hover:underline"
          @click="useDemo"
        >
          Заполнить демо-доступом
        </button>
      </form>

      <p
        v-motion
        :initial="{ opacity: 0 }"
        :enter="{ opacity: 1, transition: { delay: 320 } }"
        class="mt-6 text-center text-footnote text-ink-muted"
      >
        Нет аккаунта?
        <RouterLink to="/register" class="font-semibold text-wine-600">Зарегистрироваться</RouterLink>
      </p>
    </div>
  </main>
</template>
