
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

const routesArray: Array<RouteRecordRaw> = [
	{
		path: '/',
		name: 'home',
		component: () => import('./App.vue')
	},
	{
		path: '/basic',
		name: 'Basic',
		component: () => import('./Basic.vue')
	},
]


const router = createRouter({
	history: createWebHistory('/'),
	routes: routesArray
})

export const routes = routesArray

export default router
