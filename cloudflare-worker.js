const PREVIEW_HOST_MARKERS = ['pages.dev', 'workers.dev'];
const NON_INDEXABLE_PATHS = new Set([
  '/board',
  '/contact',
  '/mypage',
  '/admin',
  '/site-management',
  '/payment-success',
  '/payment-failed',
]);

const normalizePathname = (pathname) => pathname.replace(/\/+$/, '') || '/';
const isPreviewHost = (hostname) =>
  PREVIEW_HOST_MARKERS.some((marker) => hostname.includes(marker)) && hostname !== 'hamdeva.com' && hostname !== 'www.hamdeva.com';
const isNonIndexableRoute = (pathname) => {
  const normalizedPath = normalizePathname(pathname);
  return normalizedPath.startsWith('/result/') || NON_INDEXABLE_PATHS.has(normalizedPath);
};
const applyRobotsHeader = (request, response) => {
  const contentType = response.headers.get('content-type') || '';
  const shouldTag = contentType.includes('text/html');
  if (!shouldTag) {
    return response;
  }

  const url = new URL(request.url);
  const previewHost = isPreviewHost(url.hostname);
  const nonIndexableRoute = isNonIndexableRoute(url.pathname);
  if (!previewHost && !nonIndexableRoute) {
    return response;
  }

  const headers = new Headers(response.headers);
  headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive, nosnippet');
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
};

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const isApiRequest = url.pathname.startsWith('/api/');
    const isLegacyTryOnRequest = url.pathname === '/generateTryOn';
    const acceptsHtml = request.headers.get('accept')?.includes('text/html') ?? false;
    const isNavigationRequest = (request.method === 'GET' || request.method === 'HEAD') && acceptsHtml;
    const isStaticAssetRequest = /\.[a-z0-9]+$/i.test(url.pathname);

    // Preflight handling
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const targetUrl = new URL(request.url);

    if (isApiRequest) {
      targetUrl.hostname = 'asia-northeast3-hamdeva.cloudfunctions.net';
      targetUrl.pathname = url.pathname;
    } else if (isLegacyTryOnRequest) {
      targetUrl.hostname = 'asia-northeast3-hamdeva.cloudfunctions.net';
    } else if (env.ASSETS) {
      const assetResponse = await env.ASSETS.fetch(request);
      if (assetResponse.status !== 404 || isStaticAssetRequest || !isNavigationRequest) {
        return applyRobotsHeader(request, assetResponse);
      }

      const fallbackUrl = new URL(request.url);
      fallbackUrl.pathname = '/index.html';
      fallbackUrl.search = '';
      const fallbackResponse = await env.ASSETS.fetch(new Request(fallbackUrl.toString(), request));
      return applyRobotsHeader(request, fallbackResponse);
    } else {
      targetUrl.hostname = 'hamdeva.web.app';
      if (!isStaticAssetRequest && isNavigationRequest) {
        targetUrl.pathname = '/';
        targetUrl.search = '';
      }
    }

    console.log('[HAMDEVA-worker] proxy request', {
      path: url.pathname,
      method: request.method,
      target: targetUrl.toString(),
    });

    const proxyRequest = new Request(targetUrl.toString(), request);
    const response = await fetch(proxyRequest);

    console.log('[HAMDEVA-worker] proxy response', {
      path: url.pathname,
      method: request.method,
      status: response.status,
    });

    return applyRobotsHeader(request, response);
  },
};
