export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const isApiRequest = url.pathname.startsWith('/api/');
    const targetUrl = new URL(request.url);

    if (isApiRequest) {
      targetUrl.hostname = 'asia-northeast3-fitall-ver1.cloudfunctions.net';
      targetUrl.pathname = url.pathname.replace(/^\/api/, '/api');
    } else {
      targetUrl.hostname = 'fitall-ver1.web.app';
    }

    console.log('[HAMDEVA-worker] proxy request', {
      path: url.pathname,
      method: request.method,
      target: targetUrl.toString(),
    });

    const proxyRequest = new Request(targetUrl.toString(), request);
    proxyRequest.headers.set('Host', targetUrl.hostname);

    const response = await fetch(proxyRequest);
    console.log('[HAMDEVA-worker] proxy response', {
      path: url.pathname,
      method: request.method,
      status: response.status,
    });

    return response;
  }
};
