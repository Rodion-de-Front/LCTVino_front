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
    ui.notify({ type: 'success', title: 'Аккаунт создан', description: 'Расскажите о своём вкусе' })
    router.replace('/onboarding')
  } catch {
    ui.haptic([20, 40, 20])
  }
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

      <p class="mt-6 text-center text-footnote text-ink-muted">
        Уже с нами?
        <RouterLink to="/auth" class="font-semibold text-wine-600">Войти</RouterLink>
      </p>
    </div>
  </main>
</template>
