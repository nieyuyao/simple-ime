<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { routes } from './router'

const route = useRoute()
const isHome = computed(() => {
  return route.path === '/'
})
</script>

<template>
  <div>
    <div v-if="isHome">
      <router-link v-for="(targetRoute, i) in routes.filter(item => item.path !== '/')" :key="i" :to="targetRoute.path">
        {{ targetRoute.name }}
      </router-link>
    </div>
    <router-view v-if="!isHome" />
  </div>
</template>

<style scoped>
a {
  display: block;
}
</style>
