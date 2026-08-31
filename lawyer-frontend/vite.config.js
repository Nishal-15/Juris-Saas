import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/',  // CRITICAL: Required for Electron/Capacitor file:// loading on mobile
  server: { port: 5174 },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.png'],
      manifest: {
        name: 'JurisBot PRO',
        short_name: 'JurisBot PRO',
        description: 'AI Legal Tools for Advocates',
        theme_color: '#0f111a',
        background_color: '#0f111a',
        display: 'standalone',
        icons: [
          { src: 'logo.png', sizes: '192x192', type: 'image/png' },
          { src: 'logo.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ],
})

