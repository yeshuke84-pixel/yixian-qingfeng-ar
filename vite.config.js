import { defineConfig } from 'vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

export default defineConfig(({ mode }) => ({
  base: '/yixian-qingfeng-ar/',
  plugins: mode === 'https' ? [basicSsl()] : [],
  server: {
    host: '0.0.0.0',
  },
}))
