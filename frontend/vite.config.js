import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const proxyConfig = {
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

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3000,
    allowedHosts: true,
    proxy: proxyConfig
  },
  preview: {
    host: true,
    port: 3000,
    allowedHosts: true,
    proxy: proxyConfig
  }
})
