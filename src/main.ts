import { createApp } from 'vue'
import { createPinia } from 'pinia'
import PrimeVue from 'primevue/config'
import ConfirmationService from 'primevue/confirmationservice'
import ToastService from 'primevue/toastservice'
import Aura from '@primeuix/themes/aura'
import 'primeicons/primeicons.css'
import App from './App.vue'
import './styles/base.css'
import './styles/animations.css'

const app = createApp(App)

app.use(createPinia())
app.use(ConfirmationService)
app.use(ToastService)
app.use(PrimeVue, {
  theme: {
    preset: Aura,
  },
})

app.mount('#app')
