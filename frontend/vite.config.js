import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig({
  plugins: [react(), basicSsl()],
  server: {
    host: true,
    port: 3000,
    https: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true
      },
      '/chatHub': {
        target: 'http://127.0.0.1:5000',
        ws: true,
        changeOrigin: true
      },
      '/audios': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true
      },
      '/avatars': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true
      }
    }
  }
})
