<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, toRef, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import CommentsSheet from '@/components/feed/CommentsSheet.vue'
import PostCard from '@/components/feed/PostCard.vue'
import WineDropsLoader from '@/components/loaders/WineDropsLoader.vue'
import ProfileTabs from '@/components/profile/ProfileTabs.vue'
import StatCounter from '@/components/profile/StatCounter.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import GlassButton from '@/components/ui/GlassButton.vue'
import StarRating from '@/components/ui/StarRating.vue'
import { burst } from '@/composables/useConfetti'
import { useFeedStore } from '@/stores/feed'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const feed = useFeedStore()

const tab = ref('posts')
const followBtn = ref<HTMLElement | null>(null)

const userId = computed(() => String(route.params.userId))
const user = computed(() => userStore.viewedUser)

const tabs = computed(() => [
  { value: 'posts', label: 'Посты', count: userStore.viewedPosts.length },
  { value: 'reviews', label: 'Отзывы', count: userStore.viewedReviews.length },
])

async function toggleFollow() {
  const wasFollowing = user.value?.isFollowing ?? false
  await userStore.followUser(userId.value)
  if (!wasFollowing && followBtn.value) {
    burst(followBtn.value, { count: 22, power: 130 })
  }
}

watch(userId, (id) => id && userStore.loadUser(id))

// Likes here must also land on the copy rendered in the main feed.
let untrack = () => {}

onMounted(() => {
  untrack = feed.trackPosts(toRef(userStore, 'viewedPosts'))
  userStore.loadUser(userId.value)
})

onUnmounted(() => untrack())
</script>

<template>
  <div class="h-full">
    <button
      type="button"
      class="press glass-strong fixed left-4 top-[calc(var(--safe-top)+12px)] z-40 flex h-11 w-11 items-center justify-center rounded-full text-wine-700"
      aria-label="Назад"
      @click="router.back()"
    >
      <AppIcon name="chevronLeft" :size="21" />
    </button>

    <div v-if="userStore.loadingViewed" class="flex h-full items-center justify-center">
      <WineDropsLoader label="Загружаем профиль…" />
    </div>

    <main
      v-else-if="user"
      class="scroll-page px-4 pb-[calc(var(--tabbar-h)+var(--safe-bottom)+24px)] pt-[calc(var(--safe-top)+76px)]"
    >
      <section
        v-motion
        :initial="{ opacity: 0, y: 24 }"
        :enter="{ opacity: 1, y: 0, transition: { duration: 460 } }"
        class="glass-strong rounded-sheet p-5 text-center"
      >
        <div class="relative mx-auto w-fit">
          <span class="absolute -inset-1 rounded-full bg-gradient-to-br from-gold to-wine-500 opacity-70 blur-[6px]" />
          <img
            :src="user.avatar"
            :alt="user.name"
            class="relative h-24 w-24 rounded-full border-[3px] border-white/90 shadow-float"
          />
        </div>

        <h1 class="mt-3 text-title-lg text-ink">{{ user.name }}</h1>
        <p class="flex items-center justify-center gap-1 text-caption text-ink-muted">
          <AppIcon name="location" :size="13" />
          {{ user.location }}
        </p>
        <p class="mx-auto mt-2 max-w-xs text-footnote text-ink-muted">{{ user.bio }}</p>

        <div class="mt-5 grid grid-cols-4 gap-2">
          <StatCounter :value="user.stats.posts" label="Посты" :delay="60" />
          <StatCounter :value="user.stats.reviews" label="Отзывы" :delay="140" />
          <StatCounter :value="user.stats.followers" label="Подписчики" :delay="220" />
          <StatCounter :value="user.stats.following" label="Подписки" :delay="300" />
        </div>

        <div ref="followBtn" class="mt-5">
          <GlassButton
            :variant="user.isFollowing ? 'glass' : 'primary'"
            size="lg"
            block
            @click="toggleFollow"
          >
            <AppIcon :name="user.isFollowing ? 'check' : 'plus'" :size="18" :stroke="2.2" />
            {{ user.isFollowing ? 'Вы подписаны' : 'Подписаться' }}
          </GlassButton>
        </div>
      </section>

      <div class="glass mt-4 rounded-sheet px-4 pb-1 pt-2">
        <ProfileTabs v-model="tab" :tabs="tabs" />
      </div>

      <!-- Same as the feed: post cards bring their own glass surface. -->
      <div class="mt-4">
        <Transition name="fade" mode="out-in">
          <div v-if="tab === 'posts'" key="posts" class="space-y-4">
            <PostCard
              v-for="(post, index) in userStore.viewedPosts"
              :key="post.id"
              :post="post"
              :index="index"
              @like="feed.likePost"
              @comment="feed.openComments"
            />
            <p
              v-if="!userStore.viewedPosts.length"
              class="py-10 text-center text-footnote text-ink-muted"
            >
              Постов пока нет
            </p>
          </div>

          <ul v-else-if="tab === 'reviews'" key="reviews" class="space-y-2.5">
            <li
              v-for="(review, index) in userStore.viewedReviews"
              :key="review.id"
              v-motion
              :initial="{ opacity: 0, x: 18 }"
              :enter="{ opacity: 1, x: 0, transition: { delay: index * 60, duration: 340 } }"
              class="glass rounded-glass p-3.5"
            >
              <div class="flex items-center justify-between gap-2">
                <StarRating :model-value="review.rating" :size="13" />
                <span class="text-caption text-ink-faint">
                  {{ new Date(review.createdAt).toLocaleDateString('ru-RU') }}
                </span>
              </div>
              <p class="mt-1.5 text-footnote text-ink">{{ review.text }}</p>
            </li>
            <p
              v-if="!userStore.viewedReviews.length"
              class="py-10 text-center text-footnote text-ink-muted"
            >
              Отзывов пока нет
            </p>
          </ul>

        </Transition>
      </div>
    </main>

    <CommentsSheet />
  </div>
</template>
