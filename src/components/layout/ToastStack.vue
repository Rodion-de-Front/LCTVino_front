<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()

const icons = { success: 'check', error: 'close', info: 'sparkles' } as const
</script>

<template>
  <Teleport to="body">
    <div
      class="pointer-events-none fixed inset-x-3 top-[calc(var(--safe-top)+78px)] z-[95] flex flex-col items-center gap-2"
    >
      <TransitionGroup name="pop">
        <div
          v-for="toast in ui.notifications"
          :key="toast.id"
          class="glass-strong pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-glass px-4 py-3"
          role="status"
          @click="ui.dismiss(toast.id)"
        >
          <span
            class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white"
            :class="
              toast.type === 'error'
                ? 'bg-gradient-to-br from-[#B4404A] to-wine-700'
                : 'bg-gradient-to-br from-wine-500 to-wine-700'
            "
          >
            <AppIcon :name="icons[toast.type]" :size="17" :stroke="2.2" />
          </span>
          <div class="min-w-0">
            <p class="truncate text-footnote font-semibold text-ink">{{ toast.title }}</p>
            <p v-if="toast.description" class="truncate text-caption text-ink-muted">
              {{ toast.description }}
            </p>
          </div>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>
