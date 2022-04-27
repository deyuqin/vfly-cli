<template>
  <div>
    <h1>Home</h1>
    <div>count: {{ count }}</div>
    <button @click="addCount">+1</button>
  </div>
</template>

<script>
import { countStores } from '../store/count'
import pinia from '../store/index'
export default {
  setup() {
    const counterStore = countStores(pinia)
    return { counterStore }
  },
  computed: {
    count() {
      return this.counterStore.count
    },
  },
  methods: {
    addCount() {
      this.counterStore.addCount(1)
    },
  },
}
</script>