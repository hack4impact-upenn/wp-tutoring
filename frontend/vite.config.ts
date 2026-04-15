import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load repo-root .env so VITE_* works from wp-tutoring/.env (not only frontend/.env)
  const envDir = path.resolve(__dirname, '..')
  const env = loadEnv(mode, envDir, '')
  const apiProxyTarget = env.VITE_DEV_API_PROXY || 'http://127.0.0.1:8000'

  return {
    envDir,
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
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
        },
      },
    },
  }
})
