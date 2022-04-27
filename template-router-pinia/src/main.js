import Vue from "vue";
import App from "./App.vue";

import pinia from "./store/index";
import router from "./router/index";

new Vue({
  pinia,
  router,
  render: (h) => h(App),
}).$mount("#app");
