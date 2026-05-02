import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' // 👈 1. 加上這行引入

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(), // 👈 2. 加上這個外掛
  ],
})