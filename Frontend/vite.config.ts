import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              debugName: 'package-vendors',
              name: (moduleId) => {
                const packagePath = moduleId.split(/node_modules[\\/]/).pop()
                const segments = packagePath?.split(/[\\/]/)
                if (!segments?.[0]) return null

                const packageName = segments[0].startsWith('@')
                  ? `${segments[0].slice(1)}-${segments[1]}`
                  : segments[0]
                return `vendor-${packageName}`
              },
              test: /node_modules[\\/]/,
              priority: 1,
            },
          ],
          maxSize: 450 * 1024,
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
})
