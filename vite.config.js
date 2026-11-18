import fs from 'node:fs'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Blocks production builds when the crisis contact is still a placeholder.
const safetyGuard = {
  name: 'safety-contact-check',
  buildStart() {
    const src = fs.readFileSync('./src/data/safety.js', 'utf8')
    if (src.includes('to confirm')) {
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
})
