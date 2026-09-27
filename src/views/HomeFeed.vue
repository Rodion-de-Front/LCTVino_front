<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import CommentsSheet from '@/components/feed/CommentsSheet.vue'
import PostCard from '@/components/feed/PostCard.vue'
import TopBar from '@/components/layout/TopBar.vue'
import BubblesLoader from '@/components/loaders/BubblesLoader.vue'
import WineFillLoader from '@/components/loaders/WineFillLoader.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import GlassButton from '@/components/ui/GlassButton.vue'
import { useInView } from '@/composables/useReveal'
import { usePullToRefresh } from '@/composables/usePullToRefresh'
import { useFeedStore } from '@/stores/feed'

const feed = useFeedStore()

const scroller = ref<HTMLElement | null>(null)
const sentinel = ref<HTMLElement | null>(null)
const search = ref('')

const { distance, refreshing, progress } = usePullToRefresh(scroller, () =>
  feed.loadFeed({ refresh: true }),
)

useInView(sentinel, () => feed.loadMore())

const visiblePosts = computed(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return feed.posts
  return feed.posts.filter((p) =>
    `${p.wineName} ${p.text} ${p.author.name} ${p.tags.join(' ')}`.toLowerCase().includes(q),
  )
})

onMounted(() => {
  if (!feed.posts.length) feed.loadFeed()
})
</script>

<template>
  <div class="h-full">
    <TopBar v-model:query="search" title="Своё Вино" />

    <!-- Pull-to-refresh indicator sits behind the list and is revealed as it moves. -->
    <div
      class="pointer-events-none absolute inset-x-0 top-[calc(var(--safe-top)+74px)] z-10 flex justify-center"
      :style="{ opacity: refreshing ? 1 : progress }"
    >
      <div
        class="glass-strong flex h-16 w-16 items-center justify-center rounded-full"
        :style="{
          transform: `translateY(${(refreshing ? 88 : distance) * 0.55}px) scale(${0.6 + progress * 0.4})`,
          transition: refreshing ? 'transform 300ms cubic-bezier(0.32,0.72,0,1)' : 'none',
        }"
      >
        <WineFillLoader :size="44" :progress="refreshing ? undefined : progress" />
      </div>
    </div>

    <main
      ref="scroller"
      class="scroll-page px-4 pb-[calc(var(--tabbar-h)+var(--safe-bottom)+24px)] pt-[calc(var(--safe-top)+80px)]"
      :style="{
        transform: `translateY(${refreshing ? 56 : distance}px)`,
        transition: distance === 0 || refreshing ? 'transform 380ms cubic-bezier(0.32,0.72,0,1)' : 'none',
      }"
    >
      <div v-if="feed.loading && !feed.posts.length" class="flex flex-col items-center gap-4 pt-16">
        <BubblesLoader label="Наливаем вашу ленту…" />
      </div>

      <template v-else>
        <div class="space-y-4">
          <PostCard
            v-for="(post, index) in visiblePosts"
            :key="post.id"
            :post="post"
            :index="index"
            @like="feed.likePost"
            @comment="feed.openComments"
          />
        </div>

        <p v-if="search && !visiblePosts.length" class="py-16 text-center text-footnote text-ink-muted">
          По запросу «{{ search }}» ничего не нашлось
        </p>

        <div ref="sentinel" class="h-10" />

        <div v-if="feed.loadingMore" class="flex justify-center py-6">
          <WineFillLoader :size="52" />
        </div>

        <div v-else-if="!feed.hasMore && feed.posts.length" class="py-8 text-center">
          <AppIcon name="sparkles" :size="26" class="mx-auto text-gold" />
          <p class="mt-2 text-footnote text-ink-muted">Вы дочитали ленту до дна бокала</p>
          <GlassButton
            class="mt-4"
            variant="glass"
            size="sm"
            @click="scroller?.scrollTo({ top: 0, behavior: 'smooth' })"
          >
            Наверх
          </GlassButton>
        </div>
      </template>
    </main>

    <CommentsSheet />
  </div>
</template>
