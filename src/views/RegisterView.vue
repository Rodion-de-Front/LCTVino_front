<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthBackdrop from '@/components/layout/AuthBackdrop.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import GlassButton from '@/components/ui/GlassButton.vue'
import GlassField from '@/components/ui/GlassField.vue'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'

const auth = useAuthStore()
const ui = useUiStore()
const router = useRouter()

const name = ref('')
const email = ref('')
const password = ref('')
const repeat = ref('')
const touched = ref(false)
const registered = ref(false)

const nameError = computed(() =>
  touched.value && name.value.trim().length < 2 ? 'Как вас зовут?' : null,
)
const emailError = computed(() =>
  touched.value && !/^\S+@\S+\.\S+$/.test(email.value) ? 'Введите корректный email' : null,
)
const passwordError = computed(() =>
  touched.value && password.value.length < 6 ? 'Минимум 6 символов' : null,
)
const repeatError = computed(() =>
  touched.value && repeat.value !== password.value ? 'Пароли не совпадают' : null,
)
const valid = computed(
  () => !nameError.value && !emailError.value && !passwordError.value && !repeatError.value,
)

async function submit() {
  touched.value = true
  if (!valid.value || !name.value || !email.value || !password.value) return
  try {
    await auth.register({
      name: name.value.trim(),
      email: email.value.trim(),
      password: password.value,
    })
    registered.value = true
  } catch {
    ui.haptic([20, 40, 20])
  }
}

function openInstallPrompt() {
  window.dispatchEvent(new Event('vinora:install-request'))
}

function continueToOnboarding() {
  router.replace('/onboarding')
}
</script>

<template>
  <main class="scroll-page relative flex flex-col justify-center px-5 py-10">
    <AuthBackdrop />

    <div class="relative mx-auto w-full max-w-md">
      <RouterLink
        to="/auth"
        class="press glass mb-5 inline-flex h-10 w-10 items-center justify-center rounded-full text-wine-600"
        aria-label="Назад"
      >
        <AppIcon name="chevronLeft" :size="20" />
      </RouterLink>

      <form
        v-if="!registered"
        v-motion
        :initial="{ opacity: 0, y: 32 }"
        :enter="{ opacity: 1, y: 0, transition: { duration: 480 } }"
        class="glass-strong space-y-4 rounded-sheet p-6"
        @submit.prevent="submit"
      >
        <header>
          <h1 class="text-title-lg text-ink">Создать аккаунт</h1>
          <p class="mt-1 text-footnote text-ink-muted">
            Аватар подберём автоматически — его можно сменить позже.
          </p>
        </header>

        <GlassField v-model="name" label="Имя" autocomplete="name" :error="nameError" />
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
          autocomplete="new-password"
          :error="passwordError"
        />
        <GlassField
          v-model="repeat"
          label="Повторите пароль"
          type="password"
          autocomplete="new-password"
          :error="repeatError"
        />

        <Transition name="fade">
          <p
            v-if="auth.error"
            class="rounded-glass bg-[#B4404A]/10 px-4 py-2.5 text-footnote text-[#8B2F38]"
          >
            {{ auth.error }}
          </p>
        </Transition>

        <GlassButton type="submit" variant="primary" size="lg" block :loading="auth.pending">
          Продолжить
        </GlassButton>
      </form>

      <div
        v-else
        v-motion
        :initial="{ opacity: 0, y: 32 }"
        :enter="{ opacity: 1, y: 0, transition: { duration: 480 } }"
        class="glass-strong rounded-sheet p-6 text-center"
      >
        <div
          class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-wine-500 to-wine-700 text-white shadow-float"
        >
          <AppIcon name="download" :size="24" />
        </div>
        <h1 class="mt-4 text-title-lg text-ink">Аккаунт готов</h1>
        <p class="mt-2 text-footnote text-ink-muted">
          Установите Своё Вино как приложение: так оно быстрее открывается и удобнее живёт на
          домашнем экране.
        </p>

        <div class="mt-5 flex flex-col gap-2">
          <GlassButton variant="primary" size="lg" block @click="openInstallPrompt">
            <AppIcon name="download" :size="19" />
            Скачать приложение
          </GlassButton>
          <GlassButton variant="ghost" size="lg" block @click="continueToOnboarding">
            Продолжить
          </GlassButton>
        </div>
      </div>

      <p v-if="!registered" class="mt-6 text-center text-footnote text-ink-muted">
        Уже с нами?
        <RouterLink to="/auth" class="font-semibold text-wine-600">Войти</RouterLink>
      </p>
    </div>
  </main>
</template>
