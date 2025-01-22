import { createApp } from 'vue'
import { SimpleIme } from '../src'
import App from './App.vue'
import router from './router'

createApp(App).use(router).mount('#app')

const ime = new SimpleIme()
ime.init()
ime.turnOn()
