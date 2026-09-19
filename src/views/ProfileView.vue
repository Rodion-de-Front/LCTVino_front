<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, toRef } from 'vue'
import { useRouter } from 'vue-router'
import CommentsSheet from '@/components/feed/CommentsSheet.vue'
import CreatePostModal from '@/components/feed/CreatePostModal.vue'
import PostCard from '@/components/feed/PostCard.vue'
import TopBar from '@/components/layout/TopBar.vue'
import ProfileTabs from '@/components/profile/ProfileTabs.vue'
import StatCounter from '@/components/profile/StatCounter.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import BottomSheet from '@/components/ui/BottomSheet.vue'
import GlassButton from '@/components/ui/GlassButton.vue'
import GlassField from '@/components/ui/GlassField.vue'
import StarRating from '@/components/ui/StarRating.vue'
import WineCard from '@/components/wine/WineCard.vue'
import { useAuthStore } from '@/stores/auth'
import { useFeedStore } from '@/stores/feed'
import { useUiStore } from '@/stores/ui'
import { useUserStore } from '@/stores/user'
import type { Wine } from '@/types'

const auth = useAuthStore()
const userStore = useUserStore()
const feed = useFeedStore()
const ui = useUiStore()
const router = useRouter()

const tab = ref('posts')
const fabSpin = ref(false)
const savingProfile = ref(false)

const draft = ref({ name: '', bio: '', location: '' })

const user = computed(() => auth.user)
const tabs = computed(() => [
  { value: 'posts', label: 'Посты', count: userStore.myPosts.length },
  { value: 'reviews', label: 'Отзывы', count: userStore.myReviews.length },
  { value: 'favorites', label: 'Избранное', count: userStore.favorites.length },
])

const editOpen = computed({
  get: () => ui.modals.editProfile,
  set: (value: boolean) => (value ? ui.openModal('editProfile') : ui.closeModal('editProfile')),
})

const prefChips = computed(() => {
  const p = auth.user?.preferences
  if (!p) return []
  const TYPES: Record<string, string> = {
    red: 'Красное',
    white: 'Белое',
    rose: 'Розовое',
    orange: 'Оранжевое',
    sparkling: 'Игристое',
    unknown: 'Открыт(а) ко всему',
  }
  const SWEET: Record<string, string> = {
    dry: 'Сухое',
    'semi-dry': 'Полусухое',
    'semi-sweet': 'Полусладкое',
    sweet: 'Сладкое',
  }
  return [TYPES[p.wineType], SWEET[p.sweetness], ...p.grapes, ...p.regions].filter(Boolean)
})

function openEdit() {
  if (!user.value) return
  draft.value = { name: user.value.name, bio: user.value.bio, location: user.value.location }
  editOpen.value = true
}

async function saveProfile() {
  savingProfile.value = true
  try {
    await userStore.updateProfile(draft.value)
    editOpen.value = false
  } finally {
    savingProfile.value = false
  }
}

function openCreate() {
  fabSpin.value = true
  ui.haptic()
  ui.openModal('createPost')
  window.setTimeout(() => (fabSpin.value = false), 500)
}

async function signOut() {
  await auth.logout()
  router.replace('/auth')
}

function openWine(wine: Wine) {
  router.push(`/wine/${wine.id}`)
}

// Likes and comments made here have to reach the copy shown in the feed too.
let untrack = () => {}

onMounted(() => {
  untrack = feed.trackPosts(toRef(userStore, 'myPosts'))
  userStore.loadProfile()
  if (!userStore.myWines.length) userStore.loadMyWines()
})

onUnmounted(() => untrack())
</script>

<template>
  <div class="h-full">
    <TopBar title="Профиль" :searchable="false" />

    <main
      v-if="user"
      class="scroll-page px-4 pb-[calc(var(--tabbar-h)+var(--safe-bottom)+24px)] pt-[calc(var(--safe-top)+80px)]"
    >
      <section
        v-motion
        :initial="{ opacity: 0, y: 24 }"
        :enter="{ opacity: 1, y: 0, transition: { duration: 460 } }"
        class="glass-strong rounded-sheet p-5"
      >
        <div class="flex items-center gap-4">
          <div class="relative shrink-0">
            <span class="absolute -inset-1 rounded-full bg-gradient-to-br from-gold to-wine-500 opacity-70 blur-[6px]" />
            <img
              :src="user.avatar"
              :alt="user.name"
              class="relative h-20 w-20 rounded-full border-[3px] border-white/90 shadow-float"
            />
          </div>
          <div class="min-w-0 flex-1">
            <h1 class="truncate text-title-lg text-ink">{{ user.name }}</h1>
            <p class="flex items-center gap-1 text-caption text-ink-muted">
              <AppIcon name="location" :size="13" />
              {{ user.location }}
            </p>
            <p class="mt-1.5 line-clamp-2 text-footnote text-ink-muted">{{ user.bio }}</p>
          </div>
        </div>

        <div class="mt-5 grid grid-cols-4 gap-2">
          <StatCounter :value="userStore.myPosts.length" label="Посты" :delay="60" />
          <StatCounter :value="userStore.myReviews.length" label="Отзывы" :delay="140" />
          <StatCounter :value="user.stats.followers" label="Подписчики" :delay="220" />
          <StatCounter :value="user.stats.following" label="Подписки" :delay="300" />
        </div>

        <div class="mt-5 flex gap-2">
          <GlassButton variant="glass" size="md" block @click="openEdit">
            <AppIcon name="edit" :size="17" />
            Редактировать
          </GlassButton>
          <GlassButton variant="ghost" size="md" @click="signOut">
            <AppIcon name="logout" :size="18" />
          </GlassButton>
        </div>
      </section>

      <section
        v-if="prefChips.length"
        v-motion
        :initial="{ opacity: 0, y: 20 }"
        :enter="{ opacity: 1, y: 0, transition: { duration: 420, delay: 100 } }"
        class="glass mt-4 rounded-sheet p-5"
      >
        <div class="flex items-center justify-between">
          <h2 class="text-title text-ink">Мой вкус</h2>
          <button
            type="button"
            class="press text-caption text-wine-600"
            @click="router.push('/onboarding')"
          >
            Пройти заново
          </button>
        </div>
        <div class="mt-3 flex flex-wrap gap-2">
          <span
            v-for="(chip, index) in prefChips"
            :key="chip"
            v-motion
            :initial="{ opacity: 0, scale: 0.85 }"
            :enter="{ opacity: 1, scale: 1, transition: { delay: 140 + index * 45 } }"
            class="rounded-pill bg-white/65 px-3 py-1.5 text-caption text-wine-700"
          >
            {{ chip }}
          </span>
        </div>
      </section>

      <div class="glass mt-4 rounded-sheet px-4 pb-1 pt-2">
        <ProfileTabs v-model="tab" :tabs="tabs" />
      </div>

      <!-- Tab content sits on the page background: posts and wines are glass
           cards themselves and would otherwise stack glass on glass. -->
      <div class="mt-4">
        <Transition name="fade" mode="out-in">
          <div v-if="tab === 'posts'" key="posts" class="space-y-4">
            <PostCard
              v-for="(post, index) in userStore.myPosts"
              :key="post.id"
              :post="post"
              :index="index"
              @like="feed.likePost"
              @comment="feed.openComments"
              @save="feed.toggleSave"
            />
            <p
              v-if="!userStore.myPosts.length"
              class="py-10 text-center text-footnote text-ink-muted"
            >
              Постов пока нет — расскажите о любимой бутылке
            </p>
          </div>

          <ul v-else-if="tab === 'reviews'" key="reviews" class="space-y-2.5">
            <li
              v-for="(review, index) in userStore.myReviews"
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
              v-if="!userStore.myReviews.length"
              class="py-10 text-center text-footnote text-ink-muted"
            >
              Отзывов пока нет
            </p>
          </ul>

          <div v-else key="favorites" class="grid grid-cols-2 gap-3">
            <WineCard
              v-for="(entry, index) in userStore.favorites"
              :key="entry.id"
              :wine="entry.wine"
              :index="index"
              favorite
              @open="openWine"
              @favorite="userStore.toggleFavorite(entry.wineId)"
            />
            <p
              v-if="!userStore.favorites.length"
              class="col-span-2 py-10 text-center text-footnote text-ink-muted"
            >
              В избранном пусто
            </p>
          </div>
        </Transition>
      </div>
    </main>

    <!-- Floating create button -->
    <button
      type="button"
      class="press fixed bottom-[calc(var(--tabbar-h)+var(--safe-bottom)+22px)] right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-wine-500 to-wine-700 text-white shadow-glow transition-transform duration-500 ease-spring"
      :class="fabSpin && 'rotate-[135deg] scale-110'"
      aria-label="Создать пост"
      @click="openCreate"
    >
      <AppIcon name="plus" :size="26" :stroke="2.2" />
    </button>

    <CreatePostModal @created="userStore.loadProfile()" />
    <CommentsSheet />

    <BottomSheet v-model:open="editOpen" title="Редактировать профиль">
      <div class="space-y-4 py-2">
        <GlassField v-model="draft.name" label="Имя" />
        <GlassField v-model="draft.location" label="Город" />
        <GlassField v-model="draft.bio" label="О себе" multiline :rows="4" />
      </div>
      <template #footer>
        <GlassButton variant="primary" size="lg" block :loading="savingProfile" @click="saveProfile">
          Сохранить
        </GlassButton>
      </template>
    </BottomSheet>
  </div>
</template>
