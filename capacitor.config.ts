import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.hamdeva.app',
  appName: 'hamdeva',
  webDir: 'android-shell',
  bundledWebRuntime: false,
  server: {
    url: 'https://hamdeva.com',
    cleartext: false,
  },
  android: {
    allowMixedContent: false,
  },
};

export default config;
