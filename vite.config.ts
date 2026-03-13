import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const formatVersion = (buildNumber: number) => {
  const safeCount = Number.isNaN(buildNumber) || buildNumber < 1 ? 1 : buildNumber
  const major = Math.floor(safeCount / 100)
  const minor = safeCount % 100
  return `v${major}.${minor}`
}

const readNumericEnv = (...keys: string[]) => {
  for (const key of keys) {
    const raw = process.env[key]
    if (!raw) continue
    const parsed = Number.parseInt(raw, 10)
    if (!Number.isNaN(parsed) && parsed > 0) {
      return parsed
    }
  }
  return null
}

const appVersion = (() => {
  try {
    const commitCount = Number.parseInt(execSync('git rev-list --count HEAD').toString().trim(), 10)
    return formatVersion(commitCount)
  } catch {
    const ciBuildNumber = readNumericEnv(
      'GITHUB_RUN_NUMBER',
      'BUILD_NUMBER',
      'CI_PIPELINE_IID',
    )

    if (ciBuildNumber) {
      return formatVersion(ciBuildNumber)
    }

    return 'v0.63'
  }
})()

function writeVersionFilePlugin() {
  const versionPayload = JSON.stringify({ version: appVersion }, null, 2)

  return {
    name: 'write-version-file',
    buildStart() {
      fs.writeFileSync(path.resolve(__dirname, 'public/version.json'), versionPayload)
    },
    configureServer() {
      fs.writeFileSync(path.resolve(__dirname, 'public/version.json'), versionPayload)
    },
  }
}

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
  plugins: [react(), sampleScannerPlugin(), writeVersionFilePlugin()],
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
