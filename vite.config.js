import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  // 关键：启用 Vue 单文件组件（.vue）支持
  plugins: [vue()],

  // 给出明确端口，便于课堂演示/调试（可按需修改）
  server: {
    port: 5173,
    host: true
  }
});
