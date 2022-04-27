import { createPinia, PiniaVuePlugin } from "pinia";
import piniaPluginPersist from "pinia-plugin-persist";
import Vue from "vue";
Vue.use(PiniaVuePlugin);
const pinia = createPinia();
pinia.use(piniaPluginPersist);

export default pinia;
