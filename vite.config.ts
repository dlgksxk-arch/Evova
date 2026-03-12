import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // Cloud Workstations / 로컬 개발 환경에서 /api/** 요청을
      // 배포된 Firebase Functions으로 프록시
      // (Firebase Hosting 재작성 규칙을 로컬에서 동일하게 재현)
      '/api': {
        target: 'https://asia-northeast3-fitall-ver1.cloudfunctions.net',
        changeOrigin: true,
        secure: true,
        // /api/tryon → https://.../api/tryon (함수명 'api' + path '/tryon')
      },
    },
  },
})
