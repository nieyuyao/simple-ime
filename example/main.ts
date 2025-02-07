import { createApp } from 'vue'
import { createSimpleIme } from '../src'
import App from './App.vue'
import router from './router'

createApp(App).use(router).mount('#app')

createSimpleIme().turnOn()
