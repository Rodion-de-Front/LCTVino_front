<script setup lang="ts">
import { computed, ref } from 'vue'
import BottomSheet from '@/components/ui/BottomSheet.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { useAuthStore } from '@/stores/auth'
import { useFeedStore } from '@/stores/feed'
import { useUiStore } from '@/stores/ui'

const feed = useFeedStore()
const auth = useAuthStore()
const ui = useUiStore()

const draft = ref('')
const sending = ref(false)

const open = computed({
  get: () => ui.modals.comments,
  set: (value: boolean) => (value ? ui.openModal('comments') : feed.closeComments()),
})

const relative = (iso: string) => {
  const hours = (Date.now() - +new Date(iso)) / 3_600_000
  if (hours < 1) return 'только что'
  if (hours < 24) return `${Math.floor(hours)} ч`
  return `${Math.floor(hours / 24)} дн`
}

async function send() {
  const text = draft.value.trim()
  if (!text || !feed.activePostId) return
  sending.value = true
  try {
    await feed.addComment(feed.activePostId, text)
    draft.value = ''
    ui.haptic()
  } finally {
    sending.value = false
  }
}
</script>

<template>
  <BottomSheet v-model:open="open" :title="`Комментарии (${feed.activePost?.commentsCount ?? 0})`">
    <ul v-if="feed.activePost?.comments.length" class="space-y-3 py-2">
      <li
        v-for="(comment, index) in feed.activePost.comments"
        :key="comment.id"
        v-motion
        :initial="{ opacity: 0, x: 18 }"
        :enter="{ opacity: 1, x: 0, transition: { delay: index * 55, duration: 320 } }"
        class="flex gap-3"
      >
        <img
          :src="comment.author.avatar"
          :alt="comment.author.name"
          class="h-9 w-9 shrink-0 rounded-full border-2 border-white/80"
        />
        <div class="min-w-0 flex-1 rounded-glass bg-white/55 px-3.5 py-2.5">
          <div class="flex items-baseline justify-between gap-2">
            <p class="truncate text-caption font-semibold text-ink">{{ comment.author.name }}</p>
            <span class="shrink-0 text-caption text-ink-faint">{{ relative(comment.createdAt) }}</span>
          </div>
          <p class="mt-0.5 text-footnote leading-snug text-ink">{{ comment.text }}</p>
        </div>
      </li>
    </ul>

    <p v-else class="py-10 text-center text-footnote text-ink-muted">
      Пока тихо. Станьте первым, кто оставит отзыв.
    </p>

    <template #footer>
      <form class="glass flex items-center gap-2 rounded-pill p-1.5 pl-3" @submit.prevent="send">
        <img
          v-if="auth.user"
          :src="auth.user.avatar"
          :alt="auth.user.name"
          class="h-8 w-8 shrink-0 rounded-full"
        />
        <input
          v-model="draft"
          type="text"
          placeholder="Ваш комментарий…"
          class="min-w-0 flex-1 text-footnote text-ink placeholder:text-ink-faint"
          maxlength="280"
        />
        <button
          type="submit"
          :disabled="!draft.trim() || sending"
          class="press flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-wine-500 to-wine-700 text-white shadow-float disabled:opacity-40"
          aria-label="Отправить"
        >
          <AppIcon name="share" :size="18" />
        </button>
      </form>
    </template>
  </BottomSheet>
</template>
