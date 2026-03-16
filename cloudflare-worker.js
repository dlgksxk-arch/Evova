export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const isApiRequest = url.pathname.startsWith('/api/');
    const isLegacyTryOnRequest = url.pathname === '/generateTryOn';

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
    } else {
      targetUrl.hostname = 'hamdeva.web.app';
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
