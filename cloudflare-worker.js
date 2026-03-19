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
        return assetResponse;
      }

      const fallbackUrl = new URL(request.url);
      fallbackUrl.pathname = '/index.html';
      fallbackUrl.search = '';
      return env.ASSETS.fetch(new Request(fallbackUrl.toString(), request));
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

    return response;
  },
};
