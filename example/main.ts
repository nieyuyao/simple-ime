import { createApp } from 'vue'
import router from './router'
import App from './App.vue'
import { SimpleIme } from '../src'

createApp(App).use(router).mount('#app')


const ime = new SimpleIme()
ime.init()
ime.turnOn()