import { isNativeApp } from './platform';

const REMOTE_SAMPLE_ASSET_BASE_URL = 'https://hamdeva.com';

export const resolveSampleAssetUrl = (path: string): string => {
  if (!path.startsWith('/sample/')) {
    return path;
  }

  return isNativeApp() ? `${REMOTE_SAMPLE_ASSET_BASE_URL}${path}` : path;
};
