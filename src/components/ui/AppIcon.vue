<script setup lang="ts">
import { computed } from 'vue'

/** SF-Symbols-flavoured icon set: 24×24 grid, rounded strokes. */
const PATHS: Record<string, string> = {
  home: 'M3.6 10.4 12 3.6l8.4 6.8V20a1 1 0 0 1-1 1h-4.6v-6.2H9.2V21H4.6a1 1 0 0 1-1-1z',
  glass: 'M7 3h10c0 6.2-2.2 8.8-4 9.6V19h3.2v2H7.8v-2H11v-6.4C9.2 11.8 7 9.2 7 3Z',
  scan: 'M3 8V5a2 2 0 0 1 2-2h3M16 3h3a2 2 0 0 1 2 2v3M21 16v3a2 2 0 0 1-2 2h-3M8 21H5a2 2 0 0 1-2-2v-3M3.5 12h17',
  bottle: 'M10 2.5h4v4.2c0 1.2 2.6 2.6 2.6 5.3V20a1.5 1.5 0 0 1-1.5 1.5H8.9A1.5 1.5 0 0 1 7.4 20v-8c0-2.7 2.6-4.1 2.6-5.3zM7.6 14.5h8.8',
  person: 'M12 12.2a4.1 4.1 0 1 0 0-8.2 4.1 4.1 0 0 0 0 8.2ZM4.5 20.6c.7-3.6 3.8-5.6 7.5-5.6s6.8 2 7.5 5.6',
  heart:
    'M12 20.3s-7.8-4.6-7.8-9.7A4.4 4.4 0 0 1 12 7.6a4.4 4.4 0 0 1 7.8 3c0 5.1-7.8 9.7-7.8 9.7Z',
  comment: 'M20.5 11.8c0 4-3.8 7.2-8.5 7.2a9.9 9.9 0 0 1-2.6-.34L4.2 20.5l1.2-3.5a6.9 6.9 0 0 1-1.9-4.6C3.5 7.8 7.3 4.6 12 4.6s8.5 3.2 8.5 7.2Z',
  bookmark: 'M6.5 3.8h11a1 1 0 0 1 1 1v15.6L12 16.4l-6.5 4V4.8a1 1 0 0 1 1-1Z',
  share: 'M12 15.6V3.8m0 0L8.2 7.6M12 3.8l3.8 3.8M5 13.4v5.8a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-5.8',
  search: 'M10.8 17.6a6.8 6.8 0 1 0 0-13.6 6.8 6.8 0 0 0 0 13.6Zm5-1.8 4.2 4.2',
  star: 'm12 3.6 2.6 5.3 5.9.86-4.25 4.14 1 5.86L12 17l-5.25 2.76 1-5.86L3.5 9.76l5.9-.86z',
  chevronLeft: 'm14.5 5.5-6.4 6.5 6.4 6.5',
  chevronRight: 'm9.5 5.5 6.4 6.5-6.4 6.5',
  chevronDown: 'm5.5 9.5 6.5 6.4 6.5-6.4',
  close: 'M6.4 6.4 17.6 17.6M17.6 6.4 6.4 17.6',
  plus: 'M12 5v14M5 12h14',
  filter: 'M4 7h16M7 12h10M10 17h4',
  sliders: 'M4 8h9m3 0h4M4 16h4m3 0h9M13 5.4v5.2M8 13.4v5.2',
  check: 'm5 12.6 4.6 4.4L19 7',
  edit: 'M16.5 4.5 19.5 7.5M4.5 19.5h3.2L19 8.2a1.6 1.6 0 0 0 0-2.3l-.9-.9a1.6 1.6 0 0 0-2.3 0L4.5 16.3z',
  logout: 'M15 8V5.8a1.6 1.6 0 0 0-1.6-1.6H6.1A1.6 1.6 0 0 0 4.5 5.8v12.4a1.6 1.6 0 0 0 1.6 1.6h7.3a1.6 1.6 0 0 0 1.6-1.6V16M10.5 12h9m0 0-3-3m3 3-3 3',
  qr: 'M4 4h5v5H4zM15 4h5v5h-5zM4 15h5v5H4zM15 15.5h2M19 15.5h1M15 19h5M17.5 17.5h2',
  flash: 'M13.2 3 5.5 13.5h5.3L10.2 21l7.7-10.5h-5.3z',
  offline: 'M3 3l18 18M8.6 15.2a5 5 0 0 1 6.8 0M5 11.7a10 10 0 0 1 3.4-2.2m7.2.1a10 10 0 0 1 3.4 2.1M12 19.2h.01',
  download: 'M12 4v10.5m0 0 4-4m-4 4-4-4M5 17.5v1.6a1.4 1.4 0 0 0 1.4 1.4h11.2a1.4 1.4 0 0 0 1.4-1.4v-1.6',
  location: 'M12 21s6.5-5.6 6.5-10.2A6.5 6.5 0 0 0 5.5 10.8C5.5 15.4 12 21 12 21Zm0-8.4a2.2 2.2 0 1 0 0-4.4 2.2 2.2 0 0 0 0 4.4Z',
  refresh: 'M20 12a8 8 0 1 1-2.6-5.9M20 4v4.4h-4.4',
  grape: 'M12 3.5v4m0 12a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Zm-4.6-2.6a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Zm9.2 0a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Zm-4.6-3.6a2.4 2.4 0 1 0 0-4.8 2.4 2.4 0 0 0 0 4.8Z',
  sparkles: 'M12 3.5 13.6 8 18 9.6 13.6 11.2 12 15.7l-1.6-4.5L6 9.6 10.4 8zM18.4 15.4l.8 2 2 .8-2 .8-.8 2-.8-2-2-.8 2-.8z',
  trash: 'M5 7h14M9.5 7V5.4a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V7M6.6 7l.8 12.1a1.4 1.4 0 0 0 1.4 1.3h6.4a1.4 1.4 0 0 0 1.4-1.3L17.4 7',
  camera:
    'M4 8.8h3l1.4-2.3h7.2L17 8.8h3a1 1 0 0 1 1 1v8.4a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.8a1 1 0 0 1 1-1Zm8 9a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2Z',
}

const props = withDefaults(
  defineProps<{ name: keyof typeof PATHS | string; size?: number | string; filled?: boolean; stroke?: number }>(),
  { size: 24, filled: false, stroke: 1.7 },
)

const d = computed(() => PATHS[props.name] ?? PATHS.glass)
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
    class="shrink-0"
  >
    <path
      :d="d"
      :stroke="filled ? 'none' : 'currentColor'"
      :fill="filled ? 'currentColor' : 'none'"
      :stroke-width="stroke"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>
