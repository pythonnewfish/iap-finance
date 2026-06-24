import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  base: '/iap-finance/',
  plugins: [react(), viteSingleFile()],
  server: {
    port: 5173,
    host: true
  }
})
