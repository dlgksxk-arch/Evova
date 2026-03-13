export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Firebase Hosting 원본 주소
    const firebaseHost = "fitall-ver1.web.app";
    
    // 원래 요청의 경로(pathname)와 쿼리 파라미터(search)를 그대로 유지한 채
    // 호스트만 Firebase Hosting 주소로 변경합니다.
    url.hostname = firebaseHost;
    
    // 새 요청을 생성합니다. (원래 요청의 헤더, 메서드, 바디 등을 유지)
    const proxyRequest = new Request(url.toString(), request);
    
    // 중요: Firebase Hosting이 요청을 인식할 수 있도록 Host 헤더를 원본 주소로 덮어씁니다.
    proxyRequest.headers.set("Host", firebaseHost);
    
    // Firebase 원본 서버로 요청을 전달하고 응답을 반환합니다.
    return fetch(proxyRequest);
  }
};
