<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import BottomSheet from '@/components/ui/BottomSheet.vue'
import GlassButton from '@/components/ui/GlassButton.vue'
import GlassField from '@/components/ui/GlassField.vue'
import LazyImage from '@/components/ui/LazyImage.vue'
import StarRating from '@/components/ui/StarRating.vue'
import { catalogApi } from '@/api'
import { useFeedStore } from '@/stores/feed'
import { useUiStore } from '@/stores/ui'
import type { Wine } from '@/types'

const emit = defineEmits<{ created: [] }>()

const ui = useUiStore()
const feed = useFeedStore()

const open = computed({
  get: () => ui.modals.createPost,
  set: (value: boolean) => (value ? ui.openModal('createPost') : ui.closeModal('createPost')),
})

const wines = ref<Wine[]>([])
const selected = ref<Wine | null>(null)
const text = ref('')
const rating = ref(4)
const tags = ref('')
const posting = ref(false)

onMounted(async () => {
  const data = await catalogApi.search(
    { query: '', types: [], sweetness: [], regions: [], minRating: 0, maxPrice: Infinity, sort: 'rating' },
    1,
    12,
  )
  wines.value = data.items
})

async function publish() {
  if (!selected.value || !text.value.trim()) return
  posting.value = true
  try {
    await feed.createPost({
      wineId: selected.value.id,
      text: text.value.trim(),
      rating: rating.value,
      tags: tags.value
        .split(',')
        .map((t) => t.trim().replace(/^#/, ''))
        .filter(Boolean),
    })
    open.value = false
    selected.value = null
    text.value = ''
    tags.value = ''
    rating.value = 4
    emit('created')
  } finally {
    posting.value = false
  }
}
</script>

<template>
  <BottomSheet v-model:open="open" title="Новый пост" full-height>
    <div class="space-y-5 py-2">
      <section>
        <p class="mb-2 text-footnote font-medium text-ink-muted">Выберите вино</p>
        <div class="snap-row">
          <button
            v-for="wine in wines"
            :key="wine.id"
            type="button"
            class="press w-[104px] overflow-hidden rounded-glass border-2 transition-all duration-300"
            :class="selected?.id === wine.id ? 'border-wine-500 shadow-glass-lg' : 'border-white/60'"
            @click="selected = wine"
          >
            <LazyImage :src="wine.image" :alt="wine.name" ratio="3 / 4" rounded="rounded-none" />
            <span class="block truncate bg-white/70 px-2 py-1.5 text-caption text-ink">
              {{ wine.name }}
            </span>
          </button>
        </div>
      </section>

      <section class="flex items-center justify-between gap-3">
        <p class="text-footnote font-medium text-ink-muted">Ваша оценка</p>
        <StarRating v-model="rating" editable :size="26" />
      </section>

      <GlassField v-model="text" label="Впечатления" multiline :rows="5" />
      <GlassField v-model="tags" label="Теги через запятую" />
    </div>

    <template #footer>
      <GlassButton
        variant="primary"
        size="lg"
        block
        :disabled="!selected || !text.trim()"
        :loading="posting"
        @click="publish"
      >
        Опубликовать
      </GlassButton>
    </template>
  </BottomSheet>
</template>
