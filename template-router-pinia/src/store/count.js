import { defineStore } from "pinia";

export const countStores = defineStore("count", {
  state: () => {
    return {
      count: 0,
    };
  },
  getters: {},
  actions: {
    addCount(num) {
      this.count += num;
    },
  },
});
