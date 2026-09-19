<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue'
import { useUiStore } from '@/stores/ui'

const ui = useUiStore()
</script>

<template>
  <Transition name="pop">
    <div
      v-if="ui.isOffline"
      class="glass-dark pointer-events-none fixed inset-x-3 bottom-[calc(var(--tabbar-h)+var(--safe-bottom)+14px)] z-[60] flex items-center gap-3 rounded-glass px-4 py-2.5"
    >
      <AppIcon name="offline" :size="19" />
      <p class="text-footnote">Офлайн-режим — показываем сохранённые данные</p>
    </div>
  </Transition>
</template>
