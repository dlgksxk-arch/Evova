import {
  LEGACY_ROUTE_REDIRECTS,
  SPA_FALLBACK_ROUTE_PATHS,
  SNAPSHOT_ROUTE_PATHS,
  X_ROBOTS_NOINDEX_ROUTE_PATHS,
} from './src/lib/routes/routeManifest.ts';

const PREVIEW_HOST_MARKERS = ['pages.dev', 'workers.dev'];

const normalizePathname = (pathname) => pathname.replace(/\/+$/, '') || '/';
const isPreviewHost = (hostname) =>
  PREVIEW_HOST_MARKERS.some((marker) => hostname.includes(marker)) && hostname !== 'hamdeva.com' && hostname !== 'www.hamdeva.com';
const isNonIndexableRoute = (pathname) => {
  const normalizedPath = normalizePathname(pathname);
  return normalizedPath.startsWith('/result/') || X_ROBOTS_NOINDEX_ROUTE_PATHS.has(normalizedPath);
};
const cloneRequestWithPath = (request, pathname) => {
  const url = new URL(request.url);
  url.pathname = pathname;
  url.search = '';
  return new Request(url.toString(), request);
};
const createNotFoundResponse = (request) => {
  const headers = new Headers({
    'Content-Type': 'text/html; charset=UTF-8',
    'Cache-Control': 'no-store',
    'X-Robots-Tag': 'noindex, nofollow, noarchive, nosnippet',
  });

  if (request.method === 'HEAD') {
    return new Response(null, { status: 404, headers });
  }

  return new Response(
    '<!doctype html><html lang="en"><head><meta charset="utf-8"><title>404 | HAMDEVA</title><meta name="robots" content="noindex, nofollow, noarchive, nosnippet"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body><main><h1>404</h1><p>The page you requested was not found.</p></main></body></html>',
    {
      status: 404,
      headers,
    },
  );
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
    const normalizedPath = normalizePathname(url.pathname);
    const isApiRequest = url.pathname.startsWith('/api/');
    const isLegacyTryOnRequest = url.pathname === '/generateTryOn';
    const acceptsHtml = request.headers.get('accept')?.includes('text/html') ?? false;
    const isNavigationRequest = (request.method === 'GET' || request.method === 'HEAD') && acceptsHtml;
    const isStaticAssetRequest = /\.[a-z0-9]+$/i.test(url.pathname);

    if (url.protocol === 'http:') {
      url.protocol = 'https:';
      return Response.redirect(url.toString(), 301);
    }

    if (isNavigationRequest && LEGACY_ROUTE_REDIRECTS.has(normalizedPath)) {
      const redirectUrl = new URL(request.url);
      redirectUrl.pathname = LEGACY_ROUTE_REDIRECTS.get(normalizedPath);
      redirectUrl.search = '';
      return Response.redirect(redirectUrl.toString(), 301);
    }

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
      if (isStaticAssetRequest || !isNavigationRequest) {
        const assetResponse = await env.ASSETS.fetch(request);
        return applyRobotsHeader(request, assetResponse);
      }

      if (SNAPSHOT_ROUTE_PATHS.has(normalizedPath)) {
        const assetResponse = await env.ASSETS.fetch(request);
        if (assetResponse.status !== 404) {
          return applyRobotsHeader(request, assetResponse);
        }
        return createNotFoundResponse(request);
      }

      if (normalizedPath.startsWith('/result/') || SPA_FALLBACK_ROUTE_PATHS.has(normalizedPath)) {
        const fallbackResponse = await env.ASSETS.fetch(cloneRequestWithPath(request, '/index.html'));
        return applyRobotsHeader(request, fallbackResponse);
      }

      return createNotFoundResponse(request);
    } else {
      targetUrl.hostname = 'hamdeva.web.app';
      if (!isStaticAssetRequest && isNavigationRequest && (normalizedPath.startsWith('/result/') || SPA_FALLBACK_ROUTE_PATHS.has(normalizedPath))) {
        targetUrl.pathname = '/';
        targetUrl.search = '';
      } else if (!isStaticAssetRequest && isNavigationRequest) {
        return createNotFoundResponse(request);
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
