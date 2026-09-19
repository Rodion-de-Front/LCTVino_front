<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AuthBackdrop from '@/components/layout/AuthBackdrop.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import GlassButton from '@/components/ui/GlassButton.vue'
import { celebrate } from '@/composables/useConfetti'
import { useUiStore } from '@/stores/ui'
import { useUserStore } from '@/stores/user'
import type { Preferences } from '@/types'

interface Question {
  key: keyof Preferences
  title: string
  hint: string
  multi?: boolean
  options: { value: string; label: string; emoji: string }[]
}

const QUESTIONS: Question[] = [
  {
    key: 'wineType',
    title: 'Какое вино предпочитаете?',
    hint: 'С этого начнём подбор ленты',
    options: [
      { value: 'red', label: 'Красное', emoji: '🍷' },
      { value: 'white', label: 'Белое', emoji: '🥂' },
      { value: 'rose', label: 'Розовое', emoji: '🌸' },
      { value: 'orange', label: 'Оранжевое', emoji: '🍑' },
      { value: 'sparkling', label: 'Игристое', emoji: '🫧' },
      { value: 'unknown', label: 'Пока не знаю', emoji: '🤷' },
    ],
  },
  {
    key: 'sweetness',
    title: 'Насколько сладким?',
    hint: 'Сахар влияет на баланс вкуса',
    options: [
      { value: 'dry', label: 'Сухое', emoji: '🍋' },
      { value: 'semi-dry', label: 'Полусухое', emoji: '🍐' },
      { value: 'semi-sweet', label: 'Полусладкое', emoji: '🍑' },
      { value: 'sweet', label: 'Сладкое', emoji: '🍯' },
    ],
  },
  {
    key: 'body',
    title: 'Какая тельность?',
    hint: 'Насколько плотным должно ощущаться вино',
    options: [
      { value: 'light', label: 'Лёгкое', emoji: '🪶' },
      { value: 'medium', label: 'Среднее', emoji: '⚖️' },
      { value: 'full', label: 'Плотное', emoji: '🪨' },
    ],
  },
  {
    key: 'tannins',
    title: 'Танинность?',
    hint: 'Та самая вяжущая терпкость',
    options: [
      { value: 'low', label: 'Низкая', emoji: '☁️' },
      { value: 'medium', label: 'Средняя', emoji: '🌿' },
      { value: 'high', label: 'Высокая', emoji: '🌳' },
    ],
  },
  {
    key: 'acidity',
    title: 'Кислотность?',
    hint: 'Свежесть и «звонкость» вкуса',
    options: [
      { value: 'low', label: 'Низкая', emoji: '🍈' },
      { value: 'medium', label: 'Средняя', emoji: '🍏' },
      { value: 'high', label: 'Высокая', emoji: '🍋‍🟩' },
    ],
  },
  {
    key: 'grapes',
    title: 'Любимые сорта винограда',
    hint: 'Можно выбрать несколько',
    multi: true,
    options: [
      { value: 'Каберне Совиньон', label: 'Каберне Совиньон', emoji: '🍇' },
      { value: 'Пино Нуар', label: 'Пино Нуар', emoji: '🍇' },
      { value: 'Саперави', label: 'Саперави', emoji: '🍇' },
      { value: 'Мерло', label: 'Мерло', emoji: '🍇' },
      { value: 'Шардоне', label: 'Шардоне', emoji: '🍾' },
      { value: 'Рислинг', label: 'Рислинг', emoji: '🍾' },
      { value: 'Совиньон Блан', label: 'Совиньон Блан', emoji: '🍾' },
      { value: 'Ркацители', label: 'Ркацители', emoji: '🍾' },
    ],
  },
  {
    key: 'regions',
    title: 'Какие регионы интересны?',
    hint: 'Можно выбрать несколько',
    multi: true,
    options: [
      { value: 'Крым', label: 'Крым', emoji: '🏖️' },
      { value: 'Краснодарский край', label: 'Краснодарский край', emoji: '⛰️' },
      { value: 'Франция', label: 'Франция', emoji: '🇫🇷' },
      { value: 'Италия', label: 'Италия', emoji: '🇮🇹' },
      { value: 'Испания', label: 'Испания', emoji: '🇪🇸' },
    ],
  },
]

const router = useRouter()
const userStore = useUserStore()
const ui = useUiStore()

const step = ref(0)
const done = ref(false)
const saving = ref(false)

const answers = ref<Preferences>({
  wineType: '',
  sweetness: '',
  body: '',
  tannins: '',
  acidity: '',
  grapes: [],
  regions: [],
})

const question = computed(() => QUESTIONS[step.value])
const progress = computed(() => (done.value ? 1 : step.value / QUESTIONS.length))

const isPicked = (value: string) => {
  const current = answers.value[question.value.key]
  return Array.isArray(current) ? current.includes(value) : current === value
}

const canContinue = computed(() => {
  const current = answers.value[question.value.key]
  return Array.isArray(current) ? current.length > 0 : Boolean(current)
})

function pick(value: string) {
  const key = question.value.key
  ui.haptic(10)
  if (question.value.multi) {
    const list = answers.value[key] as string[]
    const index = list.indexOf(value)
    index === -1 ? list.push(value) : list.splice(index, 1)
    return
  }
  ;(answers.value[key] as string) = value
  // Single-choice questions advance on their own after the tap animation.
  window.setTimeout(next, 260)
}

function next() {
  if (!canContinue.value) return
  if (step.value < QUESTIONS.length - 1) {
    step.value += 1
    return
  }
  finish()
}

function back() {
  if (step.value > 0) step.value -= 1
}

async function finish() {
  saving.value = true
  try {
    await userStore.savePreferences(answers.value)
    done.value = true
    celebrate()
    ui.haptic([14, 40, 14, 40, 20])
  } catch {
    ui.notify({ type: 'error', title: 'Не удалось сохранить предпочтения' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <main class="scroll-page relative flex flex-col px-5 pb-10 pt-[calc(var(--safe-top)+20px)]">
    <AuthBackdrop />

    <!-- Wine-filled progress bar -->
    <div class="relative z-10 mb-6 flex items-center gap-3">
      <button
        v-if="step > 0 && !done"
        type="button"
        class="press glass flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-wine-600"
        aria-label="Назад"
        @click="back"
      >
        <AppIcon name="chevronLeft" :size="18" />
      </button>

      <div class="glass h-3 flex-1 overflow-hidden rounded-pill p-0.5">
        <div
          class="relative h-full overflow-hidden rounded-pill bg-gradient-to-r from-wine-600 to-wine-500 transition-all duration-500 ease-ios"
          :style="{ width: `${Math.max(progress * 100, 4)}%` }"
        >
          <span
            class="absolute inset-y-0 -left-full w-[200%] animate-wave-shift bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.5),transparent)]"
          />
        </div>
      </div>

      <span class="w-10 shrink-0 text-right text-caption tabular-nums text-ink-muted">
        {{ done ? QUESTIONS.length : step + 1 }}/{{ QUESTIONS.length }}
      </span>
    </div>

    <!-- Questions -->
    <div v-if="!done" class="relative z-10 min-h-[460px] flex-1">
      <Transition name="slide-quiz" mode="out-in">
        <section :key="step" class="glass-strong rounded-sheet p-6">
          <p class="text-caption uppercase tracking-[0.16em] text-gold">Шаг {{ step + 1 }}</p>
          <h1 class="mt-1 text-title-lg text-ink">{{ question.title }}</h1>
          <p class="mt-1 text-footnote text-ink-muted">{{ question.hint }}</p>

          <div class="mt-5 grid gap-2.5" :class="question.multi ? 'grid-cols-2' : 'grid-cols-1'">
            <button
              v-for="(option, index) in question.options"
              :key="option.value"
              v-ripple="'rgba(114,47,55,0.16)'"
              v-motion
              :initial="{ opacity: 0, y: 16 }"
              :enter="{ opacity: 1, y: 0, transition: { delay: 60 + index * 55, duration: 320 } }"
              type="button"
              class="press flex items-center gap-3 rounded-glass border px-4 py-3.5 text-left transition-all duration-300 ease-ios"
              :class="
                isPicked(option.value)
                  ? 'border-wine-500/40 bg-gradient-to-br from-wine-500/15 to-gold/15 shadow-glass'
                  : 'border-white/60 bg-white/45 hover:bg-white/65'
              "
              @click="pick(option.value)"
            >
              <span class="text-[22px] leading-none">{{ option.emoji }}</span>
              <span
                class="min-w-0 flex-1 text-footnote font-medium"
                :class="isPicked(option.value) ? 'text-wine-700' : 'text-ink'"
              >
                {{ option.label }}
              </span>
              <span
                class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-all duration-300 ease-spring"
                :class="
                  isPicked(option.value)
                    ? 'scale-100 border-wine-600 bg-wine-600 text-white'
                    : 'scale-90 border-ink/20 text-transparent'
                "
              >
                <AppIcon name="check" :size="12" :stroke="2.6" />
              </span>
            </button>
          </div>

          <GlassButton
            v-if="question.multi"
            class="mt-5"
            variant="primary"
            size="lg"
            block
            :disabled="!canContinue"
            :loading="saving"
            @click="next"
          >
            {{ step === QUESTIONS.length - 1 ? 'Завершить' : 'Далее' }}
          </GlassButton>
        </section>
      </Transition>
    </div>

    <!-- Completion -->
    <section
      v-else
      v-motion
      :initial="{ opacity: 0, scale: 0.9 }"
      :enter="{ opacity: 1, scale: 1, transition: { type: 'spring', stiffness: 220, damping: 18 } }"
      class="glass-strong relative z-10 mt-6 rounded-sheet p-8 text-center"
    >
      <span
        class="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-wine-500 to-wine-700 text-white shadow-glow"
      >
        <AppIcon name="check" :size="38" :stroke="2.4" />
      </span>
      <h1 class="text-hero text-gradient-wine">Готово!</h1>
      <p class="mx-auto mt-2 max-w-xs text-footnote text-ink-muted">
        Лента настроена под ваш вкус. Можно открывать первую бутылку.
      </p>

      <div class="mt-6 flex flex-wrap justify-center gap-2">
        <span
          v-for="tag in [...answers.grapes, ...answers.regions].slice(0, 5)"
          :key="tag"
          class="rounded-pill bg-white/60 px-3 py-1 text-caption text-wine-700"
        >
          {{ tag }}
        </span>
      </div>

      <GlassButton class="mt-7" variant="primary" size="lg" block @click="router.replace('/')">
        Перейти в ленту
      </GlassButton>
    </section>
  </main>
</template>
