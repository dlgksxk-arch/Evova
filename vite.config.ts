import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const appVersion = (() => {
  const baseVersion = process.env.npm_package_version || '0.0.0'

  try {
    const gitHash = execSync('git rev-parse --short HEAD').toString().trim()
    return `v${baseVersion}-${gitHash}`
  } catch {
    return `v${baseVersion}`
  }
})()

function sampleScannerPlugin() {
  const virtualModuleId = 'virtual:samples'
  const resolvedVirtualModuleId = '\0' + virtualModuleId

  return {
    name: 'vite-plugin-sample-scanner',
    resolveId(id: string) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId
      }
    },
    load(id: string) {
      if (id === resolvedVirtualModuleId) {
        const baseDir = 'Z:\\HDD2\\샘플사진'
        const samples: Record<string, string[]> = { female: [], male: [], dog: [], cat: [] }
        const mapDir: Record<string, string> = { '여성': 'female', '남성': 'male', '강아지': 'dog', '고양이': 'cat' }
        
        try {
          if (fs.existsSync(baseDir)) {
            const dirs = fs.readdirSync(baseDir)
            for (const d of dirs) {
              const key = mapDir[d]
              if (key) {
                const dirPath = path.join(baseDir, d)
                if (fs.statSync(dirPath).isDirectory()) {
                  const files = fs.readdirSync(dirPath)
                  const pngs = files.filter(f => f.toLowerCase().endsWith('.png'))
                  // Convert local path to Vite's /@fs/ path
                  samples[key] = pngs.map(f => `/@fs/${baseDir.replace(/\\/g, '/')}/${d}/${f}`)
                }
              }
            }
          } else {
            // Fallback for missing directory
            console.warn(`Sample directory not found: ${baseDir}`)
          }
        } catch (e) {
          console.error('Error scanning samples:', e)
        }
        
        return `export const samples = ${JSON.stringify(samples)};`
      }
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), sampleScannerPlugin()],
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  server: {
    fs: {
      allow: ['Z:/HDD2/샘플사진', '..']
    },
    proxy: {
      '/api': {
        target: 'https://asia-northeast3-fitall-ver1.cloudfunctions.net',
        changeOrigin: true,
        secure: true,
      },
    },
  },
})
