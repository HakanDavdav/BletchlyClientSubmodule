import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import svgr from 'vite-plugin-svgr'
import { figmaSvgrPlugin } from './vite.figma-svgr.js'
import fs from 'fs'
import path from 'path'

function clientLoggerPlugin() {
  return {
    name: 'client-logger',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url === '/__client_log' && req.method === 'POST') {
          let body = ''
          req.on('data', chunk => {
            body += chunk.toString()
          })
          req.on('end', () => {
            try {
              const logFile = path.resolve(process.cwd(), 'debug.txt')
              const timestamp = new Date().toISOString()
              const newLine = `[${timestamp}] ${body}\n`

              if (fs.existsSync(logFile)) {
                const content = fs.readFileSync(logFile, 'utf-8')
                let lines = content.split('\n')
                if (lines.length > 0 && lines[lines.length - 1] === '') {
                  lines.pop()
                }
                lines.push(`[${timestamp}] ${body}`)
                if (lines.length > 500) {
                  lines = lines.slice(-500)
                }
                fs.writeFileSync(logFile, lines.join('\n') + '\n')
              } else {
                fs.writeFileSync(logFile, newLine)
              }
            } catch (e) {
              console.error('Error writing to debug.txt', e)
            }
            res.statusCode = 200
            res.end('ok')
          })
        } else {
          next()
        }
      })
    }
  }
}

export default defineConfig({
  cacheDir: 'node_modules/.vite-admin',
  build: {
    outDir: 'dist-admin',
    emptyOutDir: true,
  },
  plugins: [react(), figmaSvgrPlugin(), svgr({ include: '**/*.svg?*react' }), clientLoggerPlugin()],
  server: {
    host: '127.0.0.1',
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/avatars': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/media': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/bot-api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      },
      '/hubs': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true,
        secure: false,
      },
    },
  },
  define: {
    'import.meta.env.VITE_IS_ADMIN_BUILD': JSON.stringify('true')
  }
})
