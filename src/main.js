import { createApp } from 'vue';
import App from './App.vue';
import './styles/global.css';
import { globalConfig } from './config/globalConfig';
import { createGlobalState } from './store/globalState';

const app = createApp(App);

app.provide('globalConfig', globalConfig);
app.provide('globalState', createGlobalState());

app.mount('#app');
