import React, { useState, useRef, useEffect } from 'react';
import './App.css';

// ─── 번역 ─────────────────────────────────────────────────────
const translations = {
  ko: {
    login: '로그인',
    navFeatures: '기능 소개', navHowto: '사용 방법', navFaq: 'FAQ',
    heroEyebrow: 'AI 기반 가상 피팅 서비스',
    heroTitle: '입어보지 않아도\n완벽한 나의 스타일',
    heroSub: '내 사진 한 장이면 충분합니다. hamdeva의 AI가 얼굴을 인식하고, 원하는 옷을 실제로 입은 것처럼 합성해 드립니다.',
    heroCta: '지금 무료로 시작하기',
    featuresTitle: '왜 hamdeva인가요?', featuresSub: '빠르고, 정확하고, 누구나 쉽게 사용할 수 있습니다.',
    f1Title: 'AI 가상 피팅', f1Desc: 'Google Gemini AI가 인물 사진과 의상을 분석하여 실제로 입은 것 같은 자연스러운 합성 이미지를 생성합니다.',
    f2Title: '즉시 결과 확인', f2Desc: '별도의 회원가입 없이 사진 두 장만 업로드하면 수 초 내에 결과 이미지를 확인할 수 있습니다.',
    f3Title: '프라이버시 보호', f3Desc: '모든 이미지 처리는 브라우저에서 이루어지며, 사진이 별도로 저장되거나 공유되지 않습니다.',
    f4Title: '모바일 완벽 지원', f4Desc: '스마트폰, 태블릿, PC 어디서든 동일한 품질로 이용할 수 있습니다.',
    howTitle: '이렇게 사용하세요', howSub: '단 3단계로 나만의 가상 피팅을 경험하세요.',
    h1Step: 'Step 01', h1Title: '얼굴 사진 업로드', h1Desc: '정면을 바라보는 전신 또는 상반신 사진을 업로드하세요. 배경이 단순하고 전체적인 체형이 보이면 결과 품질이 높아집니다.',
    h2Step: 'Step 02', h2Title: '옷 사진 업로드', h2Desc: '입어보고 싶은 의상 사진을 업로드하세요. 단독 제품 컷 또는 모델 착용 사진 모두 가능합니다.',
    h3Step: 'Step 03', h3Title: 'AI 합성 & 저장', h3Desc: 'AI 생성 버튼을 누르면 자동으로 분석 및 합성이 이루어집니다. 결과 이미지는 바로 저장할 수 있습니다.',
    tryTitle: '지금 바로 체험해보세요', trySub: '하루 5회 무료로 사용할 수 있습니다.',
    step1Label: 'Step 1', step1Title: '인물 사진 등록', step1Desc: '정면을 바라보는 전신 또는 상반신 사진을 드래그하거나 클릭하여 업로드하세요',
    step2Label: 'Step 2', step2Title: '의상 사진 등록', step2Desc: '입어보고 싶은 옷 사진을 드래그하거나 클릭하여 업로드하세요',
    generate: 'AI 피팅 생성하기', generating: 'AI 분석 중... (최대 30초)',
    alertBoth: '인물 사진과 의상 사진을 모두 업로드해주세요!', alertError: '이미지 생성에 실패했습니다. 다시 시도해주세요.',
    resultTitle: '피팅 결과', download: '이미지 저장하기',
    freeLeft: (n: number) => `오늘 무료 사용 가능 횟수: ${n}회`,
    freeExhausted: '오늘 무료 사용 횟수(5회)를 모두 사용했습니다.',
    payTitle: '무료 횟수 소진',
    payDesc: '오늘의 무료 피팅(5회)을 모두 사용하셨습니다.\n추가 이용을 위해 결제가 필요합니다.',
    payBtn: '결제하고 계속 이용하기',
    payClose: '닫기',
    payPlan1: '일일 이용권', payPlan1Price: '₩990', payPlan1Desc: '오늘 하루 무제한',
    payPlan2: '월정액', payPlan2Price: '₩9,900', payPlan2Desc: '30일 무제한',
    faqTitle: '자주 묻는 질문', faqSub: 'hamdeva 사용에 대한 궁금증을 해결해 드립니다.',
    faqs: [
      { q: '하루 무료 횟수는 몇 번인가요?', a: '매일 자정 기준으로 5회 무료 사용이 제공됩니다. 추가 사용은 일일 이용권 또는 월정액 구독을 통해 가능합니다.' },
      { q: '어떤 사진을 올려야 가장 좋은 결과가 나오나요?', a: '인물 사진은 배경이 단순하고 전신 또는 상반신이 잘 보이는 정면 사진을 권장합니다. 의상 사진은 제품 단독 컷이나 착용 모델 사진이 적합합니다.' },
      { q: '합성 결과가 마음에 들지 않으면 어떻게 하나요?', a: '다른 사진으로 다시 시도해보세요. 인물 사진의 배경이 단순할수록, 의상 사진이 선명할수록 더 좋은 결과가 나옵니다.' },
      { q: '모바일에서도 사용할 수 있나요?', a: '네. hamdeva는 모바일 퍼스트로 설계되어 스마트폰과 태블릿에서도 최적화된 환경을 제공합니다.' },
      { q: '내 사진은 저장되나요?', a: '결제 및 처리 목적으로 일시적으로 전송되며, 별도로 저장하거나 다른 목적으로 사용하지 않습니다.' },
    ],
    footer: '© 2025 hamdeva. All rights reserved.',
    footerPrivacy: '개인정보 처리방침', footerTerms: '이용약관', footerAbout: '서비스 소개',
  },
  en: {
    login: 'Login',
    navFeatures: 'Features', navHowto: 'How It Works', navFaq: 'FAQ',
    heroEyebrow: 'AI-Powered Virtual Try-On',
    heroTitle: 'Your Perfect Style\nBefore You Buy',
    heroSub: "All you need is one photo. hamdeva's AI creates a realistic virtual try-on — instantly.",
    heroCta: 'Try for Free',
    featuresTitle: 'Why hamdeva?', featuresSub: 'Fast, accurate, and easy to use for everyone.',
    f1Title: 'AI Virtual Try-On', f1Desc: 'Google Gemini AI analyzes your photo and clothing to generate a photorealistic composite image.',
    f2Title: 'Instant Results', f2Desc: 'No sign-up needed. Upload two photos and get your result in seconds.',
    f3Title: 'Privacy First', f3Desc: 'Your photos are not stored or shared beyond what is needed to generate your result.',
    f4Title: 'Works Everywhere', f4Desc: 'Fully optimized for smartphones, tablets, and desktop browsers.',
    howTitle: 'How It Works', howSub: 'Three simple steps to your virtual try-on.',
    h1Step: 'Step 01', h1Title: 'Upload Your Photo', h1Desc: 'Upload a front-facing full-body or upper-body photo. A simple background improves result quality.',
    h2Step: 'Step 02', h2Title: 'Upload Clothing', h2Desc: 'Upload the outfit you want to try on. Product shots or model photos both work well.',
    h3Step: 'Step 03', h3Title: 'Generate & Save', h3Desc: 'Hit the Generate button and the result is ready in seconds. Download it right away.',
    tryTitle: 'Try It Now', trySub: '5 free uses per day. No sign-up required.',
    step1Label: 'Step 1', step1Title: 'Upload Person Photo', step1Desc: 'Drag or click to upload a front-facing photo',
    step2Label: 'Step 2', step2Title: 'Upload Clothing Photo', step2Desc: 'Drag or click to upload the outfit you want to try on',
    generate: 'Generate AI Fitting', generating: 'AI Processing... (up to 30s)',
    alertBoth: 'Please upload both a person photo and a clothing photo!', alertError: 'Image generation failed. Please try again.',
    resultTitle: 'Fitting Result', download: 'Save Image',
    freeLeft: (n: number) => `Free uses remaining today: ${n}`,
    freeExhausted: "You've used all 5 free tries for today.",
    payTitle: 'Daily Limit Reached',
    payDesc: "You've used all 5 free fittings for today.\nUpgrade to continue.",
    payBtn: 'Unlock More',
    payClose: 'Close',
    payPlan1: 'Day Pass', payPlan1Price: '$0.99', payPlan1Desc: 'Unlimited for today',
    payPlan2: 'Monthly', payPlan2Price: '$9.99', payPlan2Desc: '30 days unlimited',
    faqTitle: 'FAQ', faqSub: 'Everything you need to know about hamdeva.',
    faqs: [
      { q: 'How many free uses do I get per day?', a: '5 free virtual try-ons are provided daily, resetting at midnight. Additional usage requires a Day Pass or monthly subscription.' },
      { q: 'What kind of photos work best?', a: 'For person photos, use a front-facing shot with a simple background showing your full or upper body. For clothing, solo product shots work best.' },
      { q: "What if I don't like the result?", a: "Try again with different photos. Simpler backgrounds and clearer clothing images produce better results." },
      { q: 'Can I use it on mobile?', a: 'Yes. hamdeva is mobile-first and fully optimized for smartphones and tablets.' },
      { q: 'Are my photos stored?', a: 'Photos are temporarily transmitted for processing only and are not stored or used for any other purpose.' },
    ],
    footer: '© 2025 hamdeva. All rights reserved.',
    footerPrivacy: 'Privacy Policy', footerTerms: 'Terms of Service', footerAbout: 'About',
  },
  es: {
    login: 'Iniciar sesión',
    navFeatures: 'Funciones', navHowto: 'Cómo funciona', navFaq: 'FAQ',
    heroEyebrow: 'Prueba virtual con IA',
    heroTitle: 'Tu estilo perfecto\nantes de comprarlo',
    heroSub: 'Solo necesitas una foto. La IA de hamdeva crea un resultado fotorrealista al instante.',
    heroCta: 'Pruébalo gratis',
    featuresTitle: '¿Por qué hamdeva?', featuresSub: 'Rápido, preciso y fácil de usar.',
    f1Title: 'Prueba virtual con IA', f1Desc: 'Google Gemini AI analiza tu foto y la ropa para generar una imagen compuesta fotorrealista.',
    f2Title: 'Resultados instantáneos', f2Desc: 'Sin registro. Sube dos fotos y obtén tu resultado en segundos.',
    f3Title: 'Privacidad primero', f3Desc: 'Tus fotos no se almacenan ni comparten más allá de lo necesario para generar tu resultado.',
    f4Title: 'Funciona en todos lados', f4Desc: 'Optimizado para smartphones, tablets y navegadores de escritorio.',
    howTitle: 'Cómo funciona', howSub: 'Tres sencillos pasos.',
    h1Step: 'Paso 01', h1Title: 'Sube tu foto', h1Desc: 'Sube una foto de frente con cuerpo completo o medio cuerpo. Un fondo simple mejora los resultados.',
    h2Step: 'Paso 02', h2Title: 'Sube la ropa', h2Desc: 'Sube la prenda que quieres probar. Fotos de producto o de modelo, ambas funcionan bien.',
    h3Step: 'Paso 03', h3Title: 'Genera y guarda', h3Desc: 'Pulsa Generar y el resultado estará listo en segundos. Descárgalo de inmediato.',
    tryTitle: 'Pruébalo ahora', trySub: '5 usos gratuitos por día. Sin registro.',
    step1Label: 'Paso 1', step1Title: 'Foto de persona', step1Desc: 'Arrastra o haz clic para subir una foto de frente',
    step2Label: 'Paso 2', step2Title: 'Foto de ropa', step2Desc: 'Arrastra o haz clic para subir la prenda',
    generate: 'Generar prueba IA', generating: 'Procesando... (hasta 30s)',
    alertBoth: '¡Sube una foto de persona y una de ropa!', alertError: 'Error al generar. Inténtalo de nuevo.',
    resultTitle: 'Resultado', download: 'Guardar imagen',
    freeLeft: (n: number) => `Usos gratuitos restantes hoy: ${n}`,
    freeExhausted: 'Has usado los 5 intentos gratuitos de hoy.',
    payTitle: 'Límite diario alcanzado',
    payDesc: 'Has usado los 5 fittings gratuitos de hoy.\nActualiza para continuar.',
    payBtn: 'Desbloquear más',
    payClose: 'Cerrar',
    payPlan1: 'Pase diario', payPlan1Price: '€0,99', payPlan1Desc: 'Ilimitado hoy',
    payPlan2: 'Mensual', payPlan2Price: '€9,99', payPlan2Desc: '30 días ilimitados',
    faqTitle: 'Preguntas frecuentes', faqSub: 'Todo lo que necesitas saber sobre hamdeva.',
    faqs: [
      { q: '¿Cuántos usos gratuitos tengo por día?', a: 'Se proporcionan 5 pruebas virtuales gratuitas al día, que se reinician a medianoche. El uso adicional requiere un pase diario o suscripción mensual.' },
      { q: '¿Qué tipo de fotos funcionan mejor?', a: 'Usa una foto de frente con fondo simple mostrando cuerpo completo. Para ropa, las fotos de producto individuales son ideales.' },
      { q: '¿Qué hago si no me gusta el resultado?', a: 'Intenta con otras fotos. Fondos más simples e imágenes de ropa más nítidas producen mejores resultados.' },
      { q: '¿Puedo usarlo en móvil?', a: 'Sí. hamdeva está diseñado móvil-primero y optimizado para smartphones y tablets.' },
      { q: '¿Se almacenan mis fotos?', a: 'Las fotos se transmiten temporalmente solo para el procesamiento y no se almacenan ni usan para ningún otro fin.' },
    ],
    footer: '© 2025 hamdeva. Todos los derechos reservados.',
    footerPrivacy: 'Privacidad', footerTerms: 'Términos', footerAbout: 'Acerca de',
  },
  zh: {
    login: '登录',
    navFeatures: '功能介绍', navHowto: '使用方法', navFaq: '常见问题',
    heroEyebrow: 'AI虚拟试穿服务',
    heroTitle: '无需试穿\n即可找到完美风格',
    heroSub: '只需一张照片。hamdeva的AI立即生成逼真的虚拟试穿效果。',
    heroCta: '免费开始体验',
    featuresTitle: '为什么选择hamdeva？', featuresSub: '快速、精准，人人都能轻松使用。',
    f1Title: 'AI虚拟试穿', f1Desc: 'Google Gemini AI分析您的照片和服装，生成逼真的合成图像。',
    f2Title: '即时查看结果', f2Desc: '无需注册。上传两张照片，几秒内即可查看结果。',
    f3Title: '隐私保护', f3Desc: '您的照片仅用于生成结果，不会被存储或分享。',
    f4Title: '完美支持移动端', f4Desc: '无论是智能手机、平板还是PC，均可享受同等品质的服务。',
    howTitle: '使用方法', howSub: '只需三步，体验专属虚拟试穿。',
    h1Step: '第一步', h1Title: '上传人物照片', h1Desc: '请上传正面清晰的全身或半身照片。背景简单时效果更佳。',
    h2Step: '第二步', h2Title: '上传服装照片', h2Desc: '上传您想试穿的服装照片，单品图或模特穿搭图均可。',
    h3Step: '第三步', h3Title: 'AI合成与保存', h3Desc: '点击生成按钮，系统自动分析并合成。结果图像可立即保存。',
    tryTitle: '立即体验', trySub: '每天5次免费使用，无需注册。',
    step1Label: '第1步', step1Title: '上传人物照片', step1Desc: '拖拽或点击上传正面照片',
    step2Label: '第2步', step2Title: '上传服装照片', step2Desc: '拖拽或点击上传服装照片',
    generate: '生成AI试穿效果', generating: 'AI分析中...（最多30秒）',
    alertBoth: '请上传人物照片和服装照片！', alertError: '图像生成失败，请重试。',
    resultTitle: '试穿结果', download: '保存图像',
    freeLeft: (n: number) => `今日剩余免费次数：${n}次`,
    freeExhausted: '您今日的5次免费试穿已全部使用完毕。',
    payTitle: '今日次数已用完',
    payDesc: '您已使用完今日5次免费试穿。\n请付费继续使用。',
    payBtn: '解锁更多次数',
    payClose: '关闭',
    payPlan1: '日票', payPlan1Price: '¥7', payPlan1Desc: '今日无限次使用',
    payPlan2: '月度套餐', payPlan2Price: '¥68', payPlan2Desc: '30天无限次使用',
    faqTitle: '常见问题', faqSub: '解答您关于hamdeva使用的疑问。',
    faqs: [
      { q: '每天有几次免费使用？', a: '每天提供5次免费虚拟试穿，每日午夜重置。额外使用需购买日票或月度套餐。' },
      { q: '什么样的照片效果最好？', a: '人物照片建议使用背景简单的正面全身或半身照。服装照片建议使用单品拍摄图。' },
      { q: '如果结果不满意怎么办？', a: '请尝试换其他照片。背景越简单、服装图越清晰，效果越好。' },
      { q: '可以在手机上使用吗？', a: '可以。hamdeva采用移动优先设计，在智能手机和平板上也能提供最佳体验。' },
      { q: '我的照片会被存储吗？', a: '照片仅用于生成结果的临时处理，不会被存储或用于其他目的。' },
    ],
    footer: '© 2025 hamdeva. 保留所有权利。',
    footerPrivacy: '隐私政策', footerTerms: '服务条款', footerAbout: '关于我们',
  },
};

type Lang = 'ko' | 'en' | 'es' | 'zh';

const langOptions: { value: Lang; label: string; flag: string }[] = [
  { value: 'ko', label: '한국어', flag: '🇰🇷' },
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'es', label: 'Español', flag: '🇪🇸' },
  { value: 'zh', label: '中文', flag: '🇨🇳' },
];

const FREE_LIMIT = 5;

// ─── 세션 ID (익명 식별자) ────────────────────────────────────
const getSessionId = (): string => {
  let sid = localStorage.getItem('hamdeva-sid');
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem('hamdeva-sid', sid);
  }
  return sid;
};

// ─── Functions API 기본 URL ───────────────────────────────────
const API_BASE =
  import.meta.env.DEV
    ? 'http://127.0.0.1:5001/fitall-ver1/asia-northeast3/api'  // 로컬 에뮬레이터
    : '/api';                                               // 프로덕션 (Hosting rewrite)

const TRYON_ENDPOINT =
  import.meta.env.DEV
    ? 'http://127.0.0.1:5001/fitall-ver1/asia-northeast3/generateTryOn'
    : 'https://hamdeva-server-398391697481.asia-northeast3.run.app/generate';

// ─── 무료 횟수 조회 (서버 기준) ──────────────────────────────
const fetchUsage = async (sessionId: string): Promise<number> => {
  try {
    const res = await fetch(`${API_BASE}/usage?sessionId=${sessionId}`);
    if (!res.ok) return 0;
    const data = await res.json() as { count: number };
    return data.count;
  } catch {
    // 오프라인 fallback — localStorage
    const stored = localStorage.getItem('hamdeva-usage');
    if (!stored) return 0;
    const { date, count } = JSON.parse(stored) as { date: string; count: number };
    return date === new Date().toDateString() ? count : 0;
  }
};

// ─── Virtual Try-On API 호출 (generateTryOn Function 경유) ────
const callNanoBanana = async (personDataUrl: string, garmentDataUrl: string): Promise<string> => {
  const sessionId = getSessionId();

  const res = await fetch(TRYON_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, personImage: personDataUrl, garmentImage: garmentDataUrl }),
  });

  if (res.status === 402) {
    throw new Error('LIMIT_EXCEEDED');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? `서버 오류 ${res.status}`);
  }

  const data = await res.json() as { image?: string };
  if (!data.image) throw new Error('응답에서 이미지를 찾을 수 없습니다.');
  return data.image;
};

// ─── Image helpers ────────────────────────────────────────────
const resizeImage = (dataUrl: string, maxPx = 1024): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
      if (scale >= 1) { resolve(dataUrl); return; }
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = reject;
    img.src = dataUrl;
  });

const simpleHash = (a: string, b: string): string => {
  const s = a.slice(-300) + b.slice(-300);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
};

const getTryOnCache = (): Record<string, string> => {
  try { return JSON.parse(localStorage.getItem('hamdeva-cache') ?? '{}') as Record<string, string>; }
  catch { return {}; }
};
const getCached = (k: string) => getTryOnCache()[k] ?? null;
const setCached = (k: string, v: string) => {
  const c = getTryOnCache(); c[k] = v;
  const keys = Object.keys(c); if (keys.length > 5) delete c[keys[0]];
  localStorage.setItem('hamdeva-cache', JSON.stringify(c));
};

// ─── Wardrobe helpers ─────────────────────────────────────────
interface WardrobeItem { id: string; image: string; createdAt: number; }

const getWardrobe = (): WardrobeItem[] => {
  try { return JSON.parse(localStorage.getItem('hamdeva-wardrobe') ?? '[]') as WardrobeItem[]; }
  catch { return []; }
};
const addToWardrobe = (image: string): WardrobeItem[] => {
  const items = [{ id: crypto.randomUUID(), image, createdAt: Date.now() }, ...getWardrobe()].slice(0, 20);
  localStorage.setItem('hamdeva-wardrobe', JSON.stringify(items));
  return items;
};
const deleteFromWardrobe = (id: string): WardrobeItem[] => {
  const items = getWardrobe().filter(i => i.id !== id);
  localStorage.setItem('hamdeva-wardrobe', JSON.stringify(items));
  return items;
};

// ─── Rating helpers ───────────────────────────────────────────
interface RatingData { hot: number; not: number; voted: string | null; }
const getRatings = (key: string): RatingData => {
  try {
    const all = JSON.parse(localStorage.getItem('hamdeva-ratings') ?? '{}') as Record<string, RatingData>;
    return all[key] ?? { hot: 0, not: 0, voted: null };
  } catch { return { hot: 0, not: 0, voted: null }; }
};
const saveRating = (key: string, vote: 'hot' | 'not'): RatingData => {
  const all = JSON.parse(localStorage.getItem('hamdeva-ratings') ?? '{}') as Record<string, RatingData>;
  const cur = all[key] ?? { hot: 0, not: 0, voted: null };
  if (!cur.voted) cur[vote]++;
  cur.voted = vote;
  all[key] = cur;
  localStorage.setItem('hamdeva-ratings', JSON.stringify(all));
  return cur;
};

// ─── Outfit prompts ───────────────────────────────────────────
const OUTFIT_PROMPTS = [
  'Minimalist black streetwear outfit',
  'Summer beach casual outfit',
  'Korean oversized hoodie look',
  'Business casual smart outfit',
  'Y2K retro colorful fashion',
  'Classic navy blazer prep look',
  'Cozy knit sweater autumn style',
  'Edgy leather jacket biker look',
  'Floral sundress bohemian style',
  'Monochrome all-white outfit',
];
const getRandomPrompts = () => [...OUTFIT_PROMPTS].sort(() => Math.random() - 0.5).slice(0, 3);

// ─── ShareSection ─────────────────────────────────────────────
const ShareSection: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const url = window.location.href;
  const text = encodeURIComponent('I just tried this AI virtual fitting tool 🤯 Check my result!');
  const enc = encodeURIComponent(url);
  const platforms = [
    { name: 'WhatsApp', icon: '💬', color: '#25D366', href: `https://wa.me/?text=${text}%20${enc}` },
    { name: 'Telegram', icon: '✈️', color: '#229ED9', href: `https://t.me/share/url?url=${enc}&text=${text}` },
    { name: 'X',        icon: '✖',  color: '#000',    href: `https://twitter.com/intent/tweet?text=${text}&url=${enc}` },
    { name: 'Facebook', icon: '📘', color: '#1877F2', href: `https://www.facebook.com/sharer/sharer.php?u=${enc}` },
    { name: 'Reddit',   icon: '🤖', color: '#FF4500', href: `https://www.reddit.com/submit?url=${enc}&title=${text}` },
    { name: 'LINE',     icon: '💚', color: '#06C755', href: `https://social-plugins.line.me/lineit/share?url=${enc}` },
  ];
  const handleCopy = async () => {
    await navigator.clipboard.writeText(url).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };
  const handleNative = () => {
    if (navigator.share) navigator.share({ title: 'HAMDEVA AI Try-On', text: 'Check my AI fitting result!', url }).catch(() => {});
  };
  return (
    <div className="share-section">
      <p className="share-title">🌍 Share your look</p>
      <div className="share-grid">
        {platforms.map(p => (
          <a key={p.name} href={p.href} target="_blank" rel="noopener noreferrer"
            className="share-button" style={{ '--sc': p.color } as React.CSSProperties}>
            <span>{p.icon}</span><span>{p.name}</span>
          </a>
        ))}
        {typeof navigator.share === 'function' && (
          <button className="share-button" style={{ '--sc': '#576BFF' } as React.CSSProperties} onClick={handleNative}>
            <span>📤</span><span>Share</span>
          </button>
        )}
        <button className="share-button" style={{ '--sc': '#555' } as React.CSSProperties} onClick={handleCopy}>
          <span>{copied ? '✅' : '🔗'}</span><span>{copied ? 'Copied!' : 'Copy Link'}</span>
        </button>
      </div>
    </div>
  );
};

// ─── RatingSection ────────────────────────────────────────────
const RatingSection: React.FC<{ ratingKey: string }> = ({ ratingKey }) => {
  const [r, setR] = useState<RatingData>(() => getRatings(ratingKey));
  useEffect(() => { setR(getRatings(ratingKey)); }, [ratingKey]);
  const vote = (v: 'hot' | 'not') => { if (!r.voted) setR(saveRating(ratingKey, v)); };
  return (
    <div className="rating-section">
      <p className="rating-title">🔥 Rate this outfit</p>
      <div className="rating-buttons">
        <button className={`rating-btn ${r.voted === 'hot' ? 'voted' : ''}`} onClick={() => vote('hot')} disabled={!!r.voted}>
          👍 Hot <span className="vote-count">{r.hot}</span>
        </button>
        <button className={`rating-btn ${r.voted === 'not' ? 'voted' : ''}`} onClick={() => vote('not')} disabled={!!r.voted}>
          👎 Not for me <span className="vote-count">{r.not}</span>
        </button>
      </div>
    </div>
  );
};

// ─── OutfitGenerator ─────────────────────────────────────────
const OutfitGenerator: React.FC<{ onSelect: (p: string) => void }> = ({ onSelect }) => {
  const [prompts, setPrompts] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const pick = (p: string) => { setSelected(p); onSelect(p); };
  return (
    <div className="outfit-generator">
      <div className="outfit-gen-header">
        <span className="outfit-gen-title">✨ AI Outfit Generator</span>
        <button className="outfit-gen-btn" onClick={() => { setPrompts(getRandomPrompts()); setSelected(null); }}>
          Generate Outfit Ideas
        </button>
      </div>
      {prompts.length > 0 && (
        <div className="outfit-prompts">
          {prompts.map(p => (
            <button key={p} className={`outfit-prompt-card ${selected === p ? 'selected' : ''}`} onClick={() => pick(p)}>
              {p}
            </button>
          ))}
          {selected && <p className="outfit-hint">🔍 Search for "<strong>{selected}</strong>" and upload the image above</p>}
        </div>
      )}
    </div>
  );
};

// ─── WardrobeSection ─────────────────────────────────────────
const WardrobeSection: React.FC<{
  items: WardrobeItem[];
  onDelete: (id: string) => void;
  onView: (img: string) => void;
}> = ({ items, onDelete, onView }) => {
  if (items.length === 0) return null;
  return (
    <section className="section wardrobe-section">
      <div className="section-inner">
        <div className="section-header">
          <h2 className="section-heading">👗 My AI Wardrobe</h2>
          <p className="section-desc">{items.length} saved outfit{items.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="wardrobe-grid">
          {items.map(item => (
            <div key={item.id} className="wardrobe-card">
              <img src={item.image} alt="saved outfit" onClick={() => onView(item.image)} />
              <div className="wardrobe-card-actions">
                <button className="wc-btn view" onClick={() => onView(item.image)}>View</button>
                <button className="wc-btn delete" onClick={() => onDelete(item.id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── Leaderboard helpers ──────────────────────────────────────
interface LbVotes { hot: number; voted: boolean; }
const LB_KEY = 'hamdeva-lb';

const getLbVotes = (): Record<string, LbVotes> => {
  try { return JSON.parse(localStorage.getItem(LB_KEY) ?? '{}') as Record<string, LbVotes>; }
  catch { return {}; }
};
const voteLb = (id: string): Record<string, LbVotes> => {
  const all = getLbVotes();
  const cur = all[id] ?? { hot: 0, voted: false };
  if (!cur.voted) { cur.hot++; cur.voted = true; }
  all[id] = cur;
  localStorage.setItem(LB_KEY, JSON.stringify(all));
  return all;
};

// ─── LeaderboardSection ───────────────────────────────────────
const LeaderboardSection: React.FC<{ items: WardrobeItem[] }> = ({ items }) => {
  const [lbVotes, setLbVotes] = useState<Record<string, LbVotes>>(() => getLbVotes());

  if (items.length === 0) return null;

  const ranked = [...items]
    .map(item => ({ ...item, hot: lbVotes[item.id]?.hot ?? 0, voted: lbVotes[item.id]?.voted ?? false }))
    .sort((a, b) => b.hot - a.hot)
    .slice(0, 10);

  const handleVote = (id: string) => {
    setLbVotes(voteLb(id));
  };

  const medals = ['🥇', '🥈', '🥉'];

  return (
    <section className="section leaderboard-section">
      <div className="section-inner">
        <div className="section-header">
          <h2 className="section-heading">🔥 Top AI Outfits Today</h2>
          <p className="section-desc">Vote for your favourites to push them up the ranking</p>
        </div>
        <div className="leaderboard-grid">
          {ranked.map((item, i) => (
            <div key={item.id} className="leaderboard-card">
              <div className="leaderboard-rank">
                {i < 3 ? medals[i] : `#${i + 1}`}
              </div>
              <img src={item.image} alt={`Rank ${i + 1}`} />
              <div className="leaderboard-footer">
                <span className="lb-votes">🔥 {item.hot}</span>
                <button
                  className={`lb-vote-btn ${item.voted ? 'voted' : ''}`}
                  onClick={() => handleVote(item.id)}
                  disabled={item.voted}
                >
                  {item.voted ? 'Voted' : '👍 Vote'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

// ─── CompareSection ───────────────────────────────────────────
interface CompareVotes { a: number; b: number; voted: string | null; }
const CompareSection: React.FC<{ items: WardrobeItem[] }> = ({ items }) => {
  const [selA, setSelA] = useState<string | null>(null);
  const [selB, setSelB] = useState<string | null>(null);
  const [votes, setVotes] = useState<CompareVotes>({ a: 0, b: 0, voted: null });
  const [comparing, setComparing] = useState(false);

  if (items.length < 2) return null;

  const startCompare = () => {
    if (!selA || !selB) return;
    const key = `cmp-${simpleHash(selA, selB)}`;
    const stored = JSON.parse(localStorage.getItem('hamdeva-compare') ?? '{}') as Record<string, CompareVotes>;
    setVotes(stored[key] ?? { a: 0, b: 0, voted: null });
    setComparing(true);
  };

  const vote = (side: 'a' | 'b') => {
    if (votes.voted || !selA || !selB) return;
    const key = `cmp-${simpleHash(selA, selB)}`;
    const stored = JSON.parse(localStorage.getItem('hamdeva-compare') ?? '{}') as Record<string, CompareVotes>;
    const cur = stored[key] ?? { a: 0, b: 0, voted: null };
    cur[side]++; cur.voted = side;
    stored[key] = cur;
    localStorage.setItem('hamdeva-compare', JSON.stringify(stored));
    setVotes({ ...cur });
  };

  return (
    <section className="section compare-section">
      <div className="section-inner">
        <div className="section-header">
          <h2 className="section-heading">⚔️ Compare Outfits</h2>
          <p className="section-desc">Pick two outfits and vote for your favourite</p>
        </div>

        {!comparing ? (
          <>
            <div className="compare-pick-grid">
              {items.map(item => (
                <div key={item.id}
                  className={`compare-pick-card ${selA === item.image ? 'sel-a' : ''} ${selB === item.image ? 'sel-b' : ''}`}
                  onClick={() => {
                    if (!selA || (selA && selB)) { setSelA(item.image); setSelB(null); }
                    else if (item.image !== selA) setSelB(item.image);
                  }}>
                  <img src={item.image} alt="outfit" />
                  {selA === item.image && <div className="compare-badge a">A</div>}
                  {selB === item.image && <div className="compare-badge b">B</div>}
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <button className="generate-btn" style={{ maxWidth: 200 }} onClick={startCompare} disabled={!selA || !selB}>
                Compare →
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="compare-vs">
              <div className="compare-side">
                <img src={selA!} alt="A" />
                <button className={`compare-vote-btn ${votes.voted === 'a' ? 'won' : ''}`}
                  onClick={() => vote('a')} disabled={!!votes.voted}>
                  Vote A {votes.voted && `(${votes.a})`}
                </button>
              </div>
              <div className="compare-vs-badge">VS</div>
              <div className="compare-side">
                <img src={selB!} alt="B" />
                <button className={`compare-vote-btn ${votes.voted === 'b' ? 'won' : ''}`}
                  onClick={() => vote('b')} disabled={!!votes.voted}>
                  Vote B {votes.voted && `(${votes.b})`}
                </button>
              </div>
            </div>
            <div style={{ textAlign: 'center', marginTop: 16 }}>
              <button className="download-btn" onClick={() => { setComparing(false); setSelA(null); setSelB(null); }}>
                ← New Comparison
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

// ─── UploadCard ───────────────────────────────────────────────
const UploadCard: React.FC<{
  label: string; title: string; icon: string;
  description: string; image: string | null; onUpload: (f: File) => void;
}> = ({ label, title, icon, description, image, onUpload }) => {
  const ref = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
      e.target.value = ''; // 같은 파일 재선택 허용
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) onUpload(file);
  };

  return (
    <div className="upload-card">
      <div className="card-header">
        <span className="section-label">{label}</span>
        <h3 className="card-title">{title}</h3>
      </div>
      <div
        className={`upload-area ${image ? 'has-image' : ''}`}
        onClick={() => ref.current?.click()}
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
      >
        <input
          type="file"
          ref={ref}
          onChange={handleChange}
          accept="image/*"
          style={{ display: 'none' }}
        />
        {image ? <img src={image} alt={title} /> : (
          <div className="upload-placeholder">
            <span className="upload-icon">{icon}</span>
            <p>{description}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── FAQ ─────────────────────────────────────────────────────
const FaqItem: React.FC<{ q: string; a: string }> = ({ q, a }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={`faq-item ${open ? 'open' : ''}`} onClick={() => setOpen(!open)}>
      <div className="faq-question"><span>{q}</span><span className="faq-icon">{open ? '−' : '+'}</span></div>
      {open && <div className="faq-answer">{a}</div>}
    </div>
  );
};

// ─── LangDropdown ─────────────────────────────────────────────
const LangDropdown: React.FC<{ lang: Lang; onChange: (l: Lang) => void }> = ({ lang, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cur = langOptions.find((o) => o.value === lang)!;

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div className="lang-dropdown" ref={ref}>
      <button className="lang-dropdown-trigger" onClick={() => setOpen(!open)}>
        <span>{cur.flag}</span>
        <span className="lang-label">{cur.label}</span>
        <span className={`lang-caret ${open ? 'open' : ''}`}>▾</span>
      </button>
      {open && (
        <div className="lang-dropdown-menu">
          {langOptions.map((opt) => (
            <button key={opt.value} className={`lang-option ${lang === opt.value ? 'active' : ''}`}
              onClick={() => { onChange(opt.value); setOpen(false); }}>
              <span>{opt.flag}</span><span>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ─── PaywallModal ─────────────────────────────────────────────
const PaywallModal: React.FC<{ t: typeof translations['ko']; onClose: () => void }> = ({ t, onClose }) => (
  <div className="modal-backdrop" onClick={onClose}>
    <div className="modal-box" onClick={(e) => e.stopPropagation()}>
      <div className="modal-icon">🔒</div>
      <h2 className="modal-title">{t.payTitle}</h2>
      <p className="modal-desc">{t.payDesc}</p>
      <div className="pay-plans">
        <div className="pay-plan">
          <div className="pay-plan-name">{t.payPlan1}</div>
          <div className="pay-plan-price">{t.payPlan1Price}</div>
          <div className="pay-plan-desc">{t.payPlan1Desc}</div>
          <button className="pay-plan-btn">{t.payBtn}</button>
        </div>
        <div className="pay-plan featured">
          <div className="pay-plan-badge">추천</div>
          <div className="pay-plan-name">{t.payPlan2}</div>
          <div className="pay-plan-price">{t.payPlan2Price}</div>
          <div className="pay-plan-desc">{t.payPlan2Desc}</div>
          <button className="pay-plan-btn featured">{t.payBtn}</button>
        </div>
      </div>
      <button className="modal-close" onClick={onClose}>{t.payClose}</button>
    </div>
  </div>
);

// ─── App ──────────────────────────────────────────────────────
const App: React.FC = () => {
  const [personImage, setPersonImage] = useState<string | null>(null);
  const [clothImage, setClothImage]   = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage]   = useState<string | null>(null);
  const [resultKey, setResultKey]       = useState('');
  const [showPaywall, setShowPaywall]   = useState(false);
  const [menuOpen, setMenuOpen]         = useState(false);
  const [usageCount, setUsageCount]     = useState(0);
  const [wardrobe, setWardrobe]         = useState<WardrobeItem[]>(() => getWardrobe());
  const [viewImage, setViewImage]       = useState<string | null>(null);
  const sessionId = getSessionId();

  // 마운트 시 서버에서 오늘 사용 횟수 조회
  useEffect(() => {
    fetchUsage(sessionId).then(setUsageCount).catch(() => setUsageCount(0));
  }, [sessionId]);

  const [darkMode, setDarkMode] = useState<boolean>(() => localStorage.getItem('hamdeva-dark') === 'true');
  const [lang, setLang]         = useState<Lang>(() => (localStorage.getItem('hamdeva-lang') as Lang) || 'ko');
  const t = translations[lang];

  const freeLeft = Math.max(0, FREE_LIMIT - usageCount);

  useEffect(() => {
    localStorage.setItem('hamdeva-dark', String(darkMode));
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [darkMode]);

  useEffect(() => { localStorage.setItem('hamdeva-lang', lang); }, [lang]);

  const handleImageUpload = (file: File, type: 'person' | 'cloth') => {
    if (file.size > 2 * 1024 * 1024) { alert('이미지 크기는 2MB 이하여야 합니다.'); return; }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result !== 'string') return;
      resizeImage(result)
        .then((resized) => {
          if (type === 'person') setPersonImage(resized);
          else setClothImage(resized);
        })
        .catch(() => {
          // resize 실패 시 원본 그대로 사용
          if (type === 'person') setPersonImage(result);
          else setClothImage(result);
        });
    };
    reader.onerror = () => alert('이미지를 읽을 수 없습니다.');
    reader.readAsDataURL(file);
  };

  const handleGenerate = async () => {
    if (!personImage || !clothImage) { alert(t.alertBoth); return; }

    // 무료 횟수 체크
    if (freeLeft <= 0) { setShowPaywall(true); return; }

    // 캐시 확인 — 동일 이미지 조합은 API 호출 없이 재사용
    const cacheKey = simpleHash(personImage, clothImage);
    const cached = getCached(cacheKey);
    if (cached) {
      setResultImage(cached);
      setResultKey(cacheKey);
      setTimeout(() => document.getElementById('result-area')?.scrollIntoView({ behavior: 'smooth' }), 100);
      return;
    }

    setIsGenerating(true);
    setResultImage(null);

    try {
      const result = await callNanoBanana(personImage, clothImage);
      const newCount = await fetchUsage(sessionId);
      setUsageCount(newCount);
      setCached(cacheKey, result);
      setResultKey(cacheKey);
      setResultImage(result);
      setTimeout(() => document.getElementById('result-area')?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      console.error(err);
      if (err instanceof Error && err.message === 'LIMIT_EXCEEDED') {
        setShowPaywall(true);
      } else {
        alert(t.alertError + (err instanceof Error ? `\n\n${err.message}` : ''));
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!resultImage) return;
    const a = document.createElement('a');
    a.href = resultImage; a.download = 'hamdeva-fitting.jpg'; a.click();
  };

  const scrollTo = (id: string) => { document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' }); setMenuOpen(false); };

  return (
    <div className={`app-root ${darkMode ? 'dark' : ''}`}>

      {/* ── Navbar ── */}
      <nav className="landing-nav">
        <div className="nav-content">
          <a href="/" className="nav-logo">ham<span>deva</span></a>
          <div className="nav-links desktop-only">
            <button onClick={() => scrollTo('features')}>{t.navFeatures}</button>
            <button onClick={() => scrollTo('howto')}>{t.navHowto}</button>
            <button onClick={() => scrollTo('faq')}>{t.navFaq}</button>
          </div>
          <div className="nav-right">
            <LangDropdown lang={lang} onChange={setLang} />
            <button className="dark-toggle" onClick={() => setDarkMode(!darkMode)} aria-label="테마 전환">
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button className="nav-login-btn desktop-only">{t.login}</button>
            <button className="hamburger mobile-only" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>
        {menuOpen && (
          <div className="mobile-menu">
            <button onClick={() => scrollTo('features')}>{t.navFeatures}</button>
            <button onClick={() => scrollTo('howto')}>{t.navHowto}</button>
            <button onClick={() => scrollTo('faq')}>{t.navFaq}</button>
            <button className="nav-login-btn" style={{ marginTop: 8 }}>{t.login}</button>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section className="hero-section">
        <div className="dancheong-bar top" />
        <div className="hero-overlay" />
        <div className="hero-content">
          <div className="hero-eyebrow">{t.heroEyebrow}</div>
          <h1 className="hero-title">{t.heroTitle}</h1>
          <p className="hero-sub">{t.heroSub}</p>
          <button className="hero-cta-btn" onClick={() => scrollTo('try')}>{t.heroCta}</button>
        </div>
        <div className="dancheong-bar bottom" />
      </section>

      {/* ── Features ── */}
      <section id="features" className="section features-section">
        <div className="section-inner">
          <div className="section-header">
            <h2 className="section-heading">{t.featuresTitle}</h2>
            <p className="section-desc">{t.featuresSub}</p>
          </div>
          <div className="features-grid">
            {([
              { icon: '🧠', title: t.f1Title, desc: t.f1Desc, color: 'blue' },
              { icon: '⚡', title: t.f2Title, desc: t.f2Desc, color: 'red' },
              { icon: '🔒', title: t.f3Title, desc: t.f3Desc, color: 'green' },
              { icon: '📱', title: t.f4Title, desc: t.f4Desc, color: 'gold' },
            ] as const).map((f) => (
              <div key={f.title} className={`feature-card accent-${f.color}`}>
                <div className="feature-icon">{f.icon}</div>
                <h3 className="feature-title">{f.title}</h3>
                <p className="feature-desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="howto" className="section howto-section">
        <div className="section-inner">
          <div className="section-header">
            <h2 className="section-heading">{t.howTitle}</h2>
            <p className="section-desc">{t.howSub}</p>
          </div>
          <div className="steps-grid">
            {[
              { step: t.h1Step, title: t.h1Title, desc: t.h1Desc, icon: '🧍' },
              { step: t.h2Step, title: t.h2Title, desc: t.h2Desc, icon: '👕' },
              { step: t.h3Step, title: t.h3Title, desc: t.h3Desc, icon: '✨' },
            ].map((s, i) => (
              <div key={i} className="step-card">
                <div className="step-num">{s.step}</div>
                <div className="step-icon-wrap">{s.icon}</div>
                <h3 className="step-title">{s.title}</h3>
                <p className="step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Try ── */}
      <section id="try" className="section try-section">
        <div className="section-inner">
          <div className="section-header">
            <h2 className="section-heading">{t.tryTitle}</h2>
            <p className="section-desc">{t.trySub}</p>
          </div>

          {/* 무료 횟수 표시 */}
          <div className="usage-bar">
            <div className="usage-dots">
              {Array.from({ length: FREE_LIMIT }).map((_, i) => (
                <span key={i} className={`usage-dot ${i < (FREE_LIMIT - freeLeft) ? 'used' : 'avail'}`} />
              ))}
            </div>
            <span className="usage-text">
              {freeLeft > 0 ? t.freeLeft(freeLeft) : t.freeExhausted}
            </span>
          </div>

          <OutfitGenerator onSelect={() => {}} />

          <div className="upload-grid">
            <UploadCard label={t.step1Label} title={t.step1Title} icon="🧍"
              description={t.step1Desc} image={personImage} onUpload={(f) => handleImageUpload(f, 'person')} />
            <UploadCard label={t.step2Label} title={t.step2Title} icon="👕"
              description={t.step2Desc} image={clothImage} onUpload={(f) => handleImageUpload(f, 'cloth')} />
          </div>

          <div className="action-section">
            <button className="generate-btn" onClick={handleGenerate}
              disabled={isGenerating || !personImage || !clothImage}>
              {isGenerating ? (
                <><span className="spinner" />{t.generating}</>
              ) : (
                freeLeft > 0 ? t.generate : '🔒 ' + t.generate
              )}
            </button>
          </div>

          {isGenerating && (
            <div className="generating-hint">
              <div className="generating-bar"><div className="generating-fill" /></div>
              <p>Gemini AI가 이미지를 분석하고 합성하고 있습니다...</p>
            </div>
          )}

          {resultImage && (
            <div id="result-area" className="results-section">
              <h2 className="section-heading" style={{ marginBottom: 24 }}>{t.resultTitle}</h2>
              <div className="composite-result">
                <img src={resultImage} alt="Fitting Result" />
                <div className="watermark">hamdeva AI</div>
              </div>
              <div className="result-actions">
                <button className="download-btn" onClick={handleDownload}>{t.download}</button>
                <button className="save-wardrobe-btn" onClick={() => setWardrobe(addToWardrobe(resultImage))}>
                  💾 Save to Wardrobe
                </button>
              </div>
              <RatingSection ratingKey={resultKey} />
              <ShareSection />
            </div>
          )}
        </div>
      </section>

      <WardrobeSection
        items={wardrobe}
        onDelete={(id) => setWardrobe(deleteFromWardrobe(id))}
        onView={(img) => setViewImage(img)}
      />

      <LeaderboardSection items={wardrobe} />

      <CompareSection items={wardrobe} />

      {/* ── FAQ ── */}
      <section id="faq" className="section faq-section">
        <div className="section-inner narrow">
          <div className="section-header">
            <h2 className="section-heading">{t.faqTitle}</h2>
            <p className="section-desc">{t.faqSub}</p>
          </div>
          <div className="faq-list">
            {t.faqs.map((item, i) => <FaqItem key={i} q={item.q} a={item.a} />)}
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-logo">ham<span>deva</span></div>
          <nav className="footer-links">
            <a href="/privacy">{t.footerPrivacy}</a>
            <a href="/terms">{t.footerTerms}</a>
            <a href="/about">{t.footerAbout}</a>
          </nav>
          <p className="footer-copy">{t.footer}</p>
        </div>
      </footer>

      {/* ── Paywall Modal ── */}
      {showPaywall && <PaywallModal t={t} onClose={() => setShowPaywall(false)} />}

      {/* ── View Image Modal ── */}
      {viewImage && (
        <div className="modal-backdrop" onClick={() => setViewImage(null)}>
          <div className="view-modal" onClick={e => e.stopPropagation()}>
            <img src={viewImage} alt="wardrobe item" />
            <button className="modal-close" onClick={() => setViewImage(null)}>✕ Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
