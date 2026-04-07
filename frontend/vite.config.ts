import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@/components', replacement: path.resolve(__dirname, './app/components') },
      { find: '@/features', replacement: path.resolve(__dirname, './app/features') },
      { find: '@/lib', replacement: path.resolve(__dirname, './lib') },
      { find: '@/hooks', replacement: path.resolve(__dirname, './app/hooks') },
      { find: '@', replacement: path.resolve(__dirname, './') },
    ],
  },
  server: {
    port: 3001,
  },
})

