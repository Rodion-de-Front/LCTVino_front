<script setup lang="ts">
import { computed, ref } from 'vue'
import { RouterLink } from 'vue-router'
import AppIcon from '@/components/ui/AppIcon.vue'
import LazyImage from '@/components/ui/LazyImage.vue'
import StarRating from '@/components/ui/StarRating.vue'
import { burst } from '@/composables/useConfetti'
import type { Post } from '@/types'

const props = defineProps<{ post: Post; index?: number }>()
const emit = defineEmits<{ like: [string]; comment: [string]; share: [Post] }>()

const likeTarget = ref<HTMLElement | null>(null)
const popping = ref(false)

function like() {
  if (!props.post.likedByMe && likeTarget.value) {
    burst(likeTarget.value, { count: 14, power: 96, colors: ['#8B3A3A', '#722F37', '#D4A574'] })
  }
  popping.value = true
  window.setTimeout(() => (popping.value = false), 500)
  emit('like', props.post.id)
}

async function share() {
  const data = {
    title: props.post.wineName,
    text: props.post.text,
    url: `${window.location.origin}/wine/${props.post.wineId}`,
  }
  if (navigator.share) {
    await navigator.share(data).catch(() => undefined)
  } else {
    emit('share', props.post)
  }
}

const age = computed(() => {
  const hours = (Date.now() - +new Date(props.post.createdAt)) / 3_600_000
  if (hours < 1) return 'только что'
  if (hours < 24) return `${Math.floor(hours)} ч назад`
  const days = Math.floor(hours / 24)
  return days === 1 ? 'вчера' : `${days} дн назад`
})
</script>

<template>
  <article
    v-motion
    :initial="{ opacity: 0, y: 26 }"
    :visible-once="{
      opacity: 1,
      y: 0,
      transition: { duration: 460, delay: Math.min((index ?? 0) * 80, 400) },
    }"
    class="glass lift rounded-sheet p-4"
  >
    <header class="flex items-center gap-3">
      <RouterLink :to="`/profile/${post.author.id}`" class="press shrink-0">
        <img
          :src="post.author.avatar"
          :alt="post.author.name"
          class="h-11 w-11 rounded-full border-2 border-white/80 shadow-glass"
        />
      </RouterLink>
      <div class="min-w-0 flex-1">
        <RouterLink
          :to="`/profile/${post.author.id}`"
          class="block truncate text-footnote font-semibold text-ink"
        >
          {{ post.author.name }}
        </RouterLink>
        <p class="text-caption text-ink-faint">{{ age }}</p>
      </div>
      <StarRating :model-value="post.rating" :size="15" show-value />
    </header>

    <RouterLink :to="`/wine/${post.wineId}`" class="mt-3 block">
      <LazyImage :src="post.image" :alt="post.wineName" ratio="4 / 3" rounded="rounded-glass">
        <div
          class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-wine-900/70 to-transparent p-3 pt-10"
        >
          <p class="text-footnote font-semibold text-white drop-shadow">{{ post.wineName }}</p>
        </div>
      </LazyImage>
    </RouterLink>

    <p class="mt-3 text-body leading-relaxed text-ink">{{ post.text }}</p>

    <div v-if="post.tags.length" class="mt-3 flex flex-wrap gap-1.5">
      <span
        v-for="tag in post.tags"
        :key="tag"
        class="rounded-pill bg-white/60 px-2.5 py-1 text-caption text-wine-700"
      >
        #{{ tag }}
      </span>
    </div>

    <footer class="mt-3 flex items-center gap-1 border-t border-white/50 pt-3">
      <button
        ref="likeTarget"
        type="button"
        class="press flex items-center gap-1.5 rounded-pill px-2.5 py-1.5 transition-colors duration-200"
        :class="post.likedByMe ? 'text-wine-600' : 'text-ink-muted hover:bg-white/50'"
        :aria-pressed="post.likedByMe"
        @click="like"
      >
        <AppIcon
          name="sparkles"
          :size="21"
          :filled="post.likedByMe"
          :class="popping && 'animate-pop-bounce'"
        />
        <span class="text-footnote font-medium tabular-nums">{{ post.likes }}</span>
      </button>

      <button
        type="button"
        class="press flex items-center gap-1.5 rounded-pill px-2.5 py-1.5 text-ink-muted transition-colors duration-200 hover:bg-white/50"
        @click="emit('comment', post.id)"
      >
        <AppIcon name="comment" :size="21" />
        <span class="text-footnote font-medium tabular-nums">{{ post.commentsCount }}</span>
      </button>

      <span class="flex-1" />

      <button
        type="button"
        class="press flex h-9 w-9 items-center justify-center rounded-full text-ink-muted transition-colors duration-200 hover:bg-white/50"
        @click="share"
      >
        <AppIcon name="share" :size="20" />
      </button>
    </footer>
  </article>
</template>
