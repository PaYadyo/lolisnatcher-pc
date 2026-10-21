import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    proxy: {
      '/danbooru-api': {
        target: 'https://danbooru.donmai.us',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/danbooru-api/, ''),
        headers: {
          'User-Agent': 'LoliSnatcherPC/1.0 (Windows NT 10.0; Win64; x64)',
          'Referer': 'https://danbooru.donmai.us/',
        },
      },
      '/safebooru-api': {
        target: 'https://safebooru.donmai.us',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/safebooru-api/, ''),
        headers: {
          'User-Agent': 'LoliSnatcherPC/1.0 (Windows NT 10.0; Win64; x64)',
          'Referer': 'https://safebooru.donmai.us/',
        },
      },
      '/yandere-api': {
        target: 'https://yande.re',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/yandere-api/, ''),
        headers: {
          'User-Agent': 'LoliSnatcherPC/1.0 (Windows NT 10.0; Win64; x64)',
        },
      },
      '/konachan-api': {
        target: 'https://konachan.net',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/konachan-api/, ''),
        headers: {
          'User-Agent': 'LoliSnatcherPC/1.0 (Windows NT 10.0; Win64; x64)',
        },
      },
    },
  },
})
