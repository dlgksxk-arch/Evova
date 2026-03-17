import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

const VERSION_TRACK_START_DATE = '2026-03-17'
const VERSION_TRACK_START_MINOR = 2

const getTodayDateKey = () => new Date().toISOString().slice(0, 10)

const getMinorVersionForDate = (dateKey: string) => {
  const startDate = new Date(`${VERSION_TRACK_START_DATE}T00:00:00Z`)
  const currentDate = new Date(`${dateKey}T00:00:00Z`)
  const diffDays = Math.max(0, Math.floor((currentDate.getTime() - startDate.getTime()) / 86_400_000))
  return VERSION_TRACK_START_MINOR + diffDays
}

const parseExistingVersionMeta = () => {
  try {
    const existing = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'public/version.json'), 'utf8'))
    const version = typeof existing.version === 'string' ? existing.version : ''
    const dateKey = typeof existing.dateKey === 'string' ? existing.dateKey : ''
    const match = version.match(/^v0\.(\d+)\.(\d+)/)

    return {
      minor: match ? Number.parseInt(match[1], 10) : 0,
      build: match ? Number.parseInt(match[2], 10) : 0,
      dateKey,
    }
  } catch {
    return { minor: 0, build: 0, dateKey: '' }
  }
}

const formatVersion = (minorVersion: number, buildNumber: number, shortSha = '') => {
  const safeCount = Number.isNaN(buildNumber) || buildNumber < 1 ? 1 : buildNumber
  const safeMinor = Number.isNaN(minorVersion) || minorVersion < 1 ? VERSION_TRACK_START_MINOR : minorVersion
  return shortSha ? `v0.${safeMinor}.${safeCount}-${shortSha}` : `v0.${safeMinor}.${safeCount}`
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

const getGitShortSha = () => {
  // Cloudflare Pages injects CF_PAGES_COMMIT_SHA
  if (process.env.CF_PAGES_COMMIT_SHA) return process.env.CF_PAGES_COMMIT_SHA.slice(0, 7)
  try {
    return execSync('git rev-parse --short HEAD').toString().trim()
  } catch {
    return ''
  }
}

const getBuildNumber = () => {
  const currentDateKey = getTodayDateKey()
  const currentMinorVersion = getMinorVersionForDate(currentDateKey)
  const previousVersion = parseExistingVersionMeta()

  if (previousVersion.dateKey === currentDateKey && previousVersion.minor === currentMinorVersion && previousVersion.build > 0) {
    return {
      dateKey: currentDateKey,
      minorVersion: currentMinorVersion,
      buildNumber: previousVersion.build + 1,
    }
  }

  try {
    const dailyCommitCount = Number.parseInt(execSync(`git rev-list --count --since='${currentDateKey} 00:00:00' HEAD`).toString().trim(), 10)
    if (!Number.isNaN(dailyCommitCount) && dailyCommitCount > 0) {
      return {
        dateKey: currentDateKey,
        minorVersion: currentMinorVersion,
        buildNumber: dailyCommitCount,
      }
    }
  } catch {
  }

  const ciBuildNumber = readNumericEnv(
    'GITHUB_RUN_NUMBER',
    'BUILD_NUMBER',
    'CI_PIPELINE_IID',
  )

  if (ciBuildNumber) {
    return {
      dateKey: currentDateKey,
      minorVersion: currentMinorVersion,
      buildNumber: ciBuildNumber,
    }
  }

  return {
    dateKey: currentDateKey,
    minorVersion: currentMinorVersion,
    buildNumber: 1,
  }
}

const gitShortSha = getGitShortSha()
const versionInfo = getBuildNumber()
const appVersion = formatVersion(versionInfo.minorVersion, versionInfo.buildNumber, gitShortSha)

const resolveFunctionsProxyTarget = (env: Record<string, string>) => {
  const explicitBaseUrl = env.VITE_FUNCTIONS_BASE_URL?.trim()
  if (explicitBaseUrl) {
    return explicitBaseUrl.replace(/\/+$/, '')
  }

  const projectId = env.VITE_FIREBASE_PROJECT_ID?.trim()
  if (projectId) {
    return `http://127.0.0.1:5001/${projectId}/asia-northeast3`
  }

  throw new Error(
    'Missing VITE_FUNCTIONS_BASE_URL or VITE_FIREBASE_PROJECT_ID. Refusing to proxy /api to an implicit production backend.',
  )
}

function writeVersionFilePlugin() {
  const versionPayload = JSON.stringify({
    version: appVersion,
    sha: gitShortSha,
    dateKey: versionInfo.dateKey,
  }, null, 2)

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
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const functionsProxyTarget = resolveFunctionsProxyTarget(env)

  return {
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
          target: functionsProxyTarget,
          changeOrigin: true,
          secure: false,
        },
        '/generateTryOn': {
          target: functionsProxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  }
})
