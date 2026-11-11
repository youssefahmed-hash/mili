import { resolve } from 'path'
import { defineConfig } from 'electron-vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {},
  preload: {},
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [react(), tailwindcss()],
    // السماح بالوصول من أجهزة الشبكة المحلية (موبايل/تابلت) أثناء التطوير
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: true
    }
  }
})
