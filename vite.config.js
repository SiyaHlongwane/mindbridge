import fs from 'node:fs'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Blocks production builds if crisis contacts contain placeholder strings.
const safetyGuard = {
  name: 'safety-contact-check',
  buildStart() {
    const src = fs.readFileSync('./src/data/safety.js', 'utf8')
    if (src.includes('to confirm') || src.includes('pending verification')) {
      throw new Error(
        'BUILD BLOCKED: src/data/safety.js still contains a placeholder crisis contact. ' +
        'Set a verified number before building for production.'
      )
    }
  },
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), safetyGuard],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },
})
