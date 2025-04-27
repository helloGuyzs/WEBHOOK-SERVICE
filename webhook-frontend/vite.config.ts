// @ts-ignore
import { defineConfig } from 'vite'
// @ts-ignore 
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
    strictPort: true
  }
})
