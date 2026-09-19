import { MotionPlugin } from '@vueuse/motion'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import { vRipple } from './directives/ripple'
import { router } from './router'
import './assets/styles/main.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(MotionPlugin)
app.directive('ripple', vRipple)

router.isReady().then(() => {
  app.mount('#app')
  document.getElementById('boot')?.remove()
})
