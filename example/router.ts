import type { RouteRecordRaw } from 'vue-router'
import { createRouter, createWebHistory } from 'vue-router'

const routesArray: Array<RouteRecordRaw> = [
  {
    path: '/',
    name: 'home',
    component: () => import('./App.vue'),
  },
  {
    path: '/basic',
    name: 'Basic',
    component: () => import('./Basic.vue'),
  },
  {
    path: '/placement',
    name: 'Placement',
    component: () => import('./Placement.vue'),
  },
]

const router = createRouter({
  history: createWebHistory('/'),
  routes: routesArray,
})

export const routes = routesArray

export default router
