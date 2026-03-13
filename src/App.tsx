import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import ClothSampleModal from './components/ClothSampleModal';
import SampleModal from './components/SampleModal';
import { LANGUAGE_OPTIONS, type LanguageCode } from './constants/languages';
import { clothSampleOptions } from './data/clothSamples';
type ImageLoadState = 'idle' | 'loading' | 'ready' | 'error';
type FontTheme = 'latin' | 'korean' | 'japanese' | 'chinese' | 'arabic' | 'indic';

// ─── 번역 ─────────────────────────────────────────────────────
const translations = {
  ko: {
    navFeatures: '기능 소개', navHowto: '사용 방법', navFaq: 'FAQ',
    heroEyebrow: 'AI 기반 가상 피팅 서비스',
    heroTitle: '입어보지 않아도\n완벽한 나의 스타일',
    heroSub: '내 사진 한 장이면 충분합니다. HAMDEVA의 AI가 얼굴을 인식하고, 원하는 옷을 실제로 입은 것처럼 합성해 드립니다.',
    heroCta: '지금 무료로 시작하기',
    featuresTitle: '왜 HAMDEVA인가요?', featuresSub: '빠르고, 정확하고, 누구나 쉽게 사용할 수 있습니다.',
    f1Title: 'AI 가상 피팅', f1Desc: 'HAMDEVA AI가 인물 사진과 의상을 분석하여 실제로 입은 것 같은 자연스러운 합성 이미지를 생성합니다.',
    f2Title: '즉시 결과 확인', f2Desc: '별도의 회원가입 없이 사진 두 장만 업로드하면 수 초 내에 결과 이미지를 확인할 수 있습니다.',
    f3Title: '프라이버시 보호', f3Desc: '모든 이미지 처리는 브라우저에서 이루어지며, 사진이 별도로 저장되거나 공유되지 않습니다.',
    f4Title: '모바일 완벽 지원', f4Desc: '스마트폰, 태블릿, PC 어디서든 동일한 품질로 이용할 수 있습니다.',
    howTitle: '이렇게 사용하세요', howSub: '단 3단계로 나만의 가상 피팅을 경험하세요.',
    h1Step: 'Step 01', h1Title: '얼굴 사진 업로드', h1Desc: '정면을 바라보는 전신 또는 상반신 사진을 업로드하세요. 배경이 단순하고 전체적인 체형이 보이면 결과 품질이 높아집니다.',
    h2Step: 'Step 02', h2Title: '옷 사진 업로드', h2Desc: '입어보고 싶은 의상 사진을 업로드하세요. 단독 제품 컷 또는 모델 착용 사진 모두 가능합니다.',
    h3Step: 'Step 03', h3Title: 'AI 합성 & 저장', h3Desc: 'AI 생성 버튼을 누르면 자동으로 분석 및 합성이 이루어집니다. 결과 이미지는 바로 저장할 수 있습니다.',
    tryTitle: '지금 바로 체험해보세요', trySub: '하루 3회 무료로 사용할 수 있습니다.',
    step1Label: 'Step 1', step1Title: '인물 사진 등록', step1Desc: '정면을 바라보는 전신 또는 상반신 사진을 드래그하거나 클릭하여 업로드하세요',
    step2Label: 'Step 2', step2Title: '의상 사진 등록', step2Desc: '입어보고 싶은 옷 사진을 드래그하거나 클릭하여 업로드하세요',
    generate: 'AI 피팅 생성하기', generating: 'AI 분석 중... (최대 30초)',
    loadingDetail: 'HAMDEVA AI가 이미지를 분석하고 합성하고 있습니다...',
    alertBoth: '인물 사진과 의상 사진을 모두 업로드해주세요!', alertError: '이미지 생성에 실패했습니다. 다시 시도해주세요.',
    resultTitle: '피팅 결과', download: '이미지 저장하기',
    freeLeft: (n: number) => `오늘 무료 사용 가능 횟수: ${n}회`,
    freeExhausted: '오늘 무료 사용 횟수(3회)를 모두 사용했습니다.',
    payTitle: '무료 횟수 소진',
    payDesc: '오늘의 무료 피팅(3회)을 모두 사용하셨습니다.\n추가 이용을 위해 결제가 필요합니다.',
    payBtn: '결제하고 계속 이용하기',
    payClose: '닫기',
    payPlan1: '일일 이용권', payPlan1Price: '₩990', payPlan1Desc: '오늘 하루 무제한',
    payPlan2: '월정액', payPlan2Price: '₩9,900', payPlan2Desc: '30일 무제한',
    faqTitle: '자주 묻는 질문', faqSub: 'HAMDEVA 사용에 대한 궁금증을 해결해 드립니다.',
    faqs: [
      { q: '하루 무료 횟수는 몇 번인가요?', a: '매일 자정 기준으로 3회 무료 사용이 제공됩니다. 추가 사용은 일일 이용권 또는 월정액 구독을 통해 가능합니다.' },
      { q: '어떤 사진을 올려야 가장 좋은 결과가 나오나요?', a: '인물 사진은 배경이 단순하고 전신 또는 상반신이 잘 보이는 정면 사진을 권장합니다. 의상 사진은 제품 단독 컷이나 착용 모델 사진이 적합합니다.' },
      { q: '합성 결과가 마음에 들지 않으면 어떻게 하나요?', a: '다른 사진으로 다시 시도해보세요. 인물 사진의 배경이 단순할수록, 의상 사진이 선명할수록 더 좋은 결과가 나옵니다.' },
      { q: '모바일에서도 사용할 수 있나요?', a: '네. HAMDEVA는 모바일 퍼스트로 설계되어 스마트폰과 태블릿에서도 최적화된 환경을 제공합니다.' },
      { q: '내 사진은 저장되나요?', a: '결제 및 처리 목적으로 일시적으로 전송되며, 별도로 저장하거나 다른 목적으로 사용하지 않습니다.' },
    ],
    footer: '© 2025 HAMDEVA. All rights reserved.',
    footerPrivacy: '개인정보 처리방침', footerTerms: '이용약관', footerAbout: '서비스 소개',
  },
  en: {
    navFeatures: 'Features', navHowto: 'How It Works', navFaq: 'FAQ',
    heroEyebrow: 'AI-Powered Virtual Try-On',
    heroTitle: 'Your Perfect Style\nBefore You Buy',
    heroSub: "All you need is one photo. HAMDEVA's AI creates a realistic virtual try-on — instantly.",
    heroCta: 'Try for Free',
    featuresTitle: 'Why HAMDEVA?', featuresSub: 'Fast, accurate, and easy to use for everyone.',
    f1Title: 'AI Virtual Try-On', f1Desc: 'HAMDEVA AI analyzes your photo and clothing to generate a photorealistic composite image.',
    f2Title: 'Instant Results', f2Desc: 'No sign-up needed. Upload two photos and get your result in seconds.',
    f3Title: 'Privacy First', f3Desc: 'Your photos are not stored or shared beyond what is needed to generate your result.',
    f4Title: 'Works Everywhere', f4Desc: 'Fully optimized for smartphones, tablets, and desktop browsers.',
    howTitle: 'How It Works', howSub: 'Three simple steps to your virtual try-on.',
    h1Step: 'Step 01', h1Title: 'Upload Your Photo', h1Desc: 'Upload a front-facing full-body or upper-body photo. A simple background improves result quality.',
    h2Step: 'Step 02', h2Title: 'Upload Clothing', h2Desc: 'Upload the outfit you want to try on. Product shots or model photos both work well.',
    h3Step: 'Step 03', h3Title: 'Generate & Save', h3Desc: 'Hit the Generate button and the result is ready in seconds. Download it right away.',
    tryTitle: 'Try It Now', trySub: '3 free uses per day. No sign-up required.',
    step1Label: 'Step 1', step1Title: 'Upload Person Photo', step1Desc: 'Drag or click to upload a front-facing photo',
    step2Label: 'Step 2', step2Title: 'Upload Clothing Photo', step2Desc: 'Drag or click to upload the outfit you want to try on',
    generate: 'Generate AI Fitting', generating: 'AI Processing... (up to 30s)',
    loadingDetail: 'HAMDEVA AI is analyzing and compositing the images...',
    alertBoth: 'Please upload both a person photo and a clothing photo!', alertError: 'Image generation failed. Please try again.',
    resultTitle: 'Fitting Result', download: 'Save Image',
    freeLeft: (n: number) => `Free uses remaining today: ${n}`,
    freeExhausted: "You've used all 3 free tries for today.",
    payTitle: 'Daily Limit Reached',
    payDesc: "You've used all 3 free fittings for today.\nUpgrade to continue.",
    payBtn: 'Unlock More',
    payClose: 'Close',
    payPlan1: 'Day Pass', payPlan1Price: '$0.99', payPlan1Desc: 'Unlimited for today',
    payPlan2: 'Monthly', payPlan2Price: '$9.99', payPlan2Desc: '30 days unlimited',
    faqTitle: 'FAQ', faqSub: 'Everything you need to know about HAMDEVA.',
    faqs: [
      { q: 'How many free uses do I get per day?', a: '3 free virtual try-ons are provided daily, resetting at midnight. Additional usage requires a Day Pass or monthly subscription.' },
      { q: 'What kind of photos work best?', a: 'For person photos, use a front-facing shot with a simple background showing your full or upper body. For clothing, solo product shots work best.' },
      { q: "What if I don't like the result?", a: "Try again with different photos. Simpler backgrounds and clearer clothing images produce better results." },
      { q: 'Can I use it on mobile?', a: 'Yes. HAMDEVA is mobile-first and fully optimized for smartphones and tablets.' },
      { q: 'Are my photos stored?', a: 'Photos are temporarily transmitted for processing only and are not stored or used for any other purpose.' },
    ],
    footer: '© 2025 HAMDEVA. All rights reserved.',
    footerPrivacy: 'Privacy Policy', footerTerms: 'Terms of Service', footerAbout: 'About',
  },
};

const FREE_LIMIT = 3;
const PRODUCTION_API_BASE = '/api';
const FALLBACK_FUNCTIONS_API_BASE = 'https://asia-northeast3-fitall-ver1.cloudfunctions.net/api';
const LANGUAGE_FONT_THEMES: Record<LanguageCode, FontTheme> = {
  en: 'latin',
  es: 'latin',
  zh: 'chinese',
  ja: 'japanese',
  ko: 'korean',
  hi: 'indic',
  fr: 'latin',
  ar: 'arabic',
  bn: 'indic',
  ru: 'latin',
  pt: 'latin',
  ur: 'arabic',
  id: 'latin',
  de: 'latin',
  mr: 'indic',
  te: 'indic',
  tr: 'latin',
  ta: 'indic',
  vi: 'latin',
  it: 'latin',
};
const EMPTY_FACE_TIPS = {
  ko: [
    '정면에 가깝고 얼굴이 선명한 사진이 가장 좋습니다.',
    '머리카락, 손, 마스크, 안경, 소품 등에 얼굴이 가려지지 않은 사진을 권장합니다.',
    '조명이 밝고 배경이 단순한 사진일수록 인식률이 좋습니다.',
    '상반신 또는 얼굴 중심 사진이 가장 적합합니다.',
  ],
  default: [
    'A clear photo close to the front view works best.',
    'Use a photo where the face is not blocked by hair, hands, masks, glasses, or props.',
    'Bright lighting and a simple background improve recognition.',
    'Upper-body or face-focused photos work best.',
  ],
};
const EMPTY_CLOTH_TIPS = {
  ko: [
    '의상 전체 형태가 잘 보이는 사진이 가장 좋습니다.',
    '옷이 잘리지 않고 배경이 단순한 이미지를 권장합니다.',
    '정면에 가깝고 주름이나 가림이 적은 사진일수록 결과가 좋습니다.',
  ],
  default: [
    'A photo that clearly shows the full clothing shape works best.',
    'Use an image where the outfit is not cropped and the background is simple.',
    'Front-facing clothing photos with fewer wrinkles or obstructions produce better results.',
  ],
};

// ─── 세션 ID (익명 식별자) ────────────────────────────────────
const getSessionId = (): string => {
  let sid = localStorage.getItem('HAMDEVA-sid');
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem('HAMDEVA-sid', sid);
  }
  return sid;
};

const API_BASE: string =
  import.meta.env.VITE_API_BASE_URL ||
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? 'http://127.0.0.1:5001/fitall-ver1/asia-northeast3/api'
    : PRODUCTION_API_BASE);

const fetchUsage = async (sessionId: string): Promise<number> => {
  try {
    const res = await fetch(`${API_BASE}/usage?sessionId=${sessionId}`);
    if (!res.ok) return 0;
    const data = await res.json() as { count: number };
    return data.count;
  } catch {
    const stored = localStorage.getItem('HAMDEVA-usage');
    if (!stored) return 0;
    const { date, count } = JSON.parse(stored) as { date: string; count: number };
    return date === new Date().toDateString() ? count : 0;
  }
};

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('이미지를 읽는 중 오류가 발생했습니다.'));
    reader.readAsDataURL(blob);
  });

const dataUrlByteLength = (dataUrl: string): number => {
  const base64 = dataUrl.split(',')[1] ?? '';
  const padding = (base64.match(/=+$/)?.[0].length ?? 0);
  return Math.max(0, Math.floor((base64.length * 3) / 4) - padding);
};

const loadImageElement = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('이미지를 불러오지 못했습니다.'));
    img.src = src;
  });

const preprocessImageFile = async (
  file: File,
  options: { maxDimension?: number; maxBytes?: number; mimeType?: string } = {},
): Promise<string> => {
  const { maxDimension = 1536, maxBytes = 2_400_000, mimeType = 'image/jpeg' } = options;
  const originalDataUrl = await blobToDataUrl(file);
  const img = await loadImageElement(originalDataUrl);

  let scale = Math.min(1, maxDimension / Math.max(img.width, img.height));
  const qualities = [0.9, 0.82, 0.74, 0.66, 0.58];

  for (const quality of qualities) {
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(img.width * scale));
    canvas.height = Math.max(1, Math.round(img.height * scale));
    canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL(mimeType, quality);

    if (dataUrlByteLength(dataUrl) <= maxBytes || scale <= 0.45) {
      return dataUrl;
    }

    scale *= 0.86;
  }

  return originalDataUrl;
};

const ensureDataUrl = async (src: string): Promise<string> => {
  if (src.startsWith('data:')) return src;

  const res = await fetch(src);
  if (!res.ok) {
    throw new Error('샘플 이미지를 불러오지 못했습니다.');
  }

  return blobToDataUrl(await res.blob());
};

const normalizeGeneratedImage = (image: string, mimeType = 'image/png'): string =>
  image.startsWith('data:') ? image : `data:${mimeType};base64,${image}`;

const callNanoBanana = async (payload: { sessionId: string, personImage: string, garmentImage: string, bodyProfile?: any }): Promise<string> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);
  const primaryEndpoint = `${API_BASE}/tryon`;
  const fallbackEndpoint = `${FALLBACK_FUNCTIONS_API_BASE}/tryon`;

  let res: Response;
  try {
    try {
      console.info('[HAMDEVA] tryon request', { endpoint: primaryEndpoint, method: 'POST' });
      res = await fetch(primaryEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch (e) {
      console.error('[HAMDEVA] primary tryon network error', e);
      console.info('[HAMDEVA] tryon fallback request', { endpoint: fallbackEndpoint, method: 'POST' });
      res = await fetch(fallbackEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    }

    if ((res.status === 404 || res.status === 405) && primaryEndpoint !== fallbackEndpoint) {
      console.warn('[HAMDEVA] primary tryon route failed, retrying fallback', {
        primaryEndpoint,
        fallbackEndpoint,
        status: res.status,
      });
      res = await fetch(fallbackEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    }
  } finally {
    clearTimeout(timer);
  }
  console.info('[HAMDEVA] tryon response', { endpoint: res.url || primaryEndpoint, method: 'POST', status: res.status });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({})) as { error?: string, message?: string };
    if (errBody.error === 'LIMIT_EXCEEDED') throw new Error('LIMIT_EXCEEDED');
    throw new Error(errBody.message || errBody.error || `서버 오류 ${res.status}`);
  }

  const data = await res.json() as { success?: boolean, image?: string, mimeType?: string };
  if (!data.image) throw new Error('응답에서 이미지를 찾을 수 없습니다.');
  return normalizeGeneratedImage(data.image, data.mimeType);
};

const resizeImage = (dataUrl: string, maxPx = 1024): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
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

const getCached = (k: string) => JSON.parse(localStorage.getItem('HAMDEVA-cache') ?? '{}')[k] ?? null;
const setCached = (k: string, v: string) => {
  const c = JSON.parse(localStorage.getItem('HAMDEVA-cache') ?? '{}'); c[k] = v;
  localStorage.setItem('HAMDEVA-cache', JSON.stringify(c));
};

const LangDropdown: React.FC<{ lang: LanguageCode; onChange: (l: LanguageCode) => void }> = ({ lang, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const currentLanguage = LANGUAGE_OPTIONS.find((option) => option.value === lang) ?? LANGUAGE_OPTIONS[0];
  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  return (
    <div className="lang-dropdown" ref={ref}>
      <button className="lang-dropdown-trigger" onClick={() => setOpen(!open)} type="button">
        <span className="lang-text">{currentLanguage.shortLabel}</span>
      </button>
      {open && (
        <div className="lang-dropdown-menu" style={{ maxHeight: '320px', overflowY: 'auto', minWidth: '220px' }}>
          {LANGUAGE_OPTIONS.map((opt) => (
            <button key={opt.value} className={`lang-option ${lang === opt.value ? 'active' : ''}`}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              type="button">
              <span>{opt.nativeLabel}</span><span>{opt.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const EmptyPreviewState: React.FC<{ title: string; tips: string[]; type: 'face' | 'cloth' }> = ({ title, tips, type }) => (
  <div className={`empty-preview empty-preview-${type}`}>
    <div className="empty-preview-badge">{type === 'face' ? 'FACE GUIDE' : 'STYLE GUIDE'}</div>
    <strong className="empty-preview-title">{title}</strong>
    <div className="empty-preview-tips">
      {tips.map((tip) => (
        <p key={tip} className="empty-preview-tip">
          {tip}
        </p>
      ))}
    </div>
  </div>
);

// ─── App ──────────────────────────────────────────────────────
const App: React.FC = () => {
  const [personImage, setPersonImage] = useState<string | null>(null);
  const [clothImage, setClothImage]   = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [gender, setGender] = useState<'female' | 'male' | 'dog' | 'cat'>('female');
  
  const [showSampleModal, setShowSampleModal] = useState(false);
  const [showClothSampleModal, setShowClothSampleModal] = useState(false);
  const [selectedSampleUrl, setSelectedSampleUrl] = useState<string | null>(null);
  const [selectedClothSampleUrl, setSelectedClothSampleUrl] = useState<string | null>(null);
  const activePersonImage = personImage || selectedSampleUrl;
  const activeClothImage = clothImage || selectedClothSampleUrl;
  const [personPreviewState, setPersonPreviewState] = useState<ImageLoadState>('idle');
  const [clothPreviewState, setClothPreviewState] = useState<ImageLoadState>('idle');
  const [resultPreviewState, setResultPreviewState] = useState<ImageLoadState>('idle');
  const [personUploadMessage, setPersonUploadMessage] = useState<string | null>(null);
  const [clothUploadMessage, setClothUploadMessage] = useState<string | null>(null);

  const [resultImage, setResultImage]   = useState<string | null>(null);
  const [usageCount, setUsageCount]     = useState(0);
  const [lang, setLang] = useState<LanguageCode>('ko');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('HAMDEVA-dark') === 'true');
  
  const t = lang === 'ko' ? translations.ko : translations.en;
  const sessionId = getSessionId();
  const fontTheme = LANGUAGE_FONT_THEMES[lang];
  const emptyFaceTips = lang === 'ko' ? EMPTY_FACE_TIPS.ko : EMPTY_FACE_TIPS.default;
  const emptyClothTips = lang === 'ko' ? EMPTY_CLOTH_TIPS.ko : EMPTY_CLOTH_TIPS.default;

  useEffect(() => { fetchUsage(sessionId).then(setUsageCount); }, [sessionId]);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('HAMDEVA-dark', String(darkMode));
  }, [darkMode]);
  useEffect(() => {
    setPersonPreviewState(activePersonImage ? 'loading' : 'idle');
  }, [activePersonImage]);
  useEffect(() => {
    setClothPreviewState(activeClothImage ? 'loading' : 'idle');
  }, [activeClothImage]);
  useEffect(() => {
    setResultPreviewState(resultImage ? 'loading' : 'idle');
  }, [resultImage]);

  const handleOpenPersonSampleModal = () => setShowSampleModal(true);
  const handleOpenClothSampleModal = () => {
    if (clothSampleOptions.length === 0) {
      alert(lang === 'ko' ? '샘플 의상 데이터 준비 중입니다.' : 'Clothing samples are being prepared.');
      return;
    }
    setShowClothSampleModal(true);
  };

  const handleGenerate = async () => {
    if (!activePersonImage || !activeClothImage) { alert(t.alertBoth); return; }
    if (FREE_LIMIT - usageCount <= 0) { alert(t.freeExhausted); return; }

    setIsGenerating(true);
    console.log('HAMDEVA AI: Starting image analysis and composition...');
    try {
      const [preparedPersonImage, preparedClothImage] = await Promise.all([
        ensureDataUrl(activePersonImage).then((src) => resizeImage(src, 1280)),
        ensureDataUrl(activeClothImage).then((src) => resizeImage(src, 1280)),
      ]);

      const cacheKey = simpleHash(preparedPersonImage, preparedClothImage);
      const cached = getCached(cacheKey);
      if (cached) {
        setResultImage(cached);
        setTimeout(() => document.getElementById('result-area')?.scrollIntoView({ behavior: 'smooth' }), 100);
        return;
      }

      const result = await callNanoBanana({
        sessionId,
        personImage: preparedPersonImage,
        garmentImage: preparedClothImage,
        bodyProfile: { gender },
      });
      setUsageCount(await fetchUsage(sessionId));
      setCached(cacheKey, result);
      setResultImage(result);
      setTimeout(() => document.getElementById('result-area')?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      alert(t.alertError + (err instanceof Error ? `\n\n${err.message}` : ''));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={`app-root ${darkMode ? 'dark' : ''} font-theme-${fontTheme}`}>
      <nav className="landing-nav">
        <div className="nav-content">
          <a href="/" className="nav-logo">HAM<span>DEVA</span></a>
          <div className="nav-right">
            <LangDropdown lang={lang} onChange={setLang} />
            <button className="dark-toggle" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </nav>

      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-eyebrow">{t.heroEyebrow}</div>
          <h1 className="hero-title">{t.heroTitle}</h1>
          <p className="hero-sub">{t.heroSub}</p>
        </div>
      </section>

      <section id="try" className="section try-section">
        <div className="section-inner">
          <div className="usage-bar">{t.freeLeft(Math.max(0, FREE_LIMIT - usageCount))}</div>

          <div className="try-layout">
            <div className="try-column">
              <div className="card-header">
                <span className="section-label">Step 1</span>
                <h3 className="card-title">{t.step1Title}</h3>
              </div>
              
              <div className="try-actions">
                <button className="outline-btn primary" onClick={handleOpenPersonSampleModal}>
                  {lang === 'ko' ? '샘플 선택' : 'Choose Sample'}
                </button>
                <button className="outline-btn" onClick={() => document.getElementById('p-up')?.click()}>
                  {lang === 'ko' ? '내 사진 업로드' : 'Upload My Photo'}
                </button>
                <input id="p-up" type="file" hidden accept="image/*" onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setPersonUploadMessage(lang === 'ko' ? '이미지를 업로드하기 좋게 정리하고 있습니다...' : 'Preparing your image for upload...');
                    setPersonPreviewState('loading');
                    preprocessImageFile(f, { maxDimension: 1440, maxBytes: 2_100_000 })
                      .then((src) => {
                        setSelectedSampleUrl(null);
                        setPersonImage(src);
                      })
                      .catch(() => {
                        setPersonUploadMessage(null);
                        setPersonPreviewState('error');
                      });
                  }
                }} />
              </div>

              <div className={`preview-box ${activePersonImage ? 'has-image' : ''}`}>
                {activePersonImage ? (
                  <>
                    {personPreviewState === 'loading' && (
                      <div className="preview-overlay">
                        <span className="spinner"></span>
                        <span>{personUploadMessage || (lang === 'ko' ? '이미지 불러오는 중...' : 'Loading image...')}</span>
                      </div>
                    )}
                    {personPreviewState === 'error' && (
                      <div className="img-error-msg">{lang === 'ko' ? '이미지를 불러올 수 없습니다.' : 'Unable to load image.'}</div>
                    )}
                    <img 
                      src={activePersonImage} 
                      alt="Face" 
                      onLoad={() => {
                        setPersonPreviewState('ready');
                        setPersonUploadMessage(null);
                      }}
                      onError={() => setPersonPreviewState('error')}
                      className={`${personImage ? 'user-uploaded' : 'sample-img'} ${personPreviewState === 'ready' ? 'is-visible' : ''}`}
                    />
                  </>
                ) : (
                  <EmptyPreviewState
                    title={lang === 'ko' ? '얼굴 사진을 넣어주세요' : 'Add a face photo'}
                    tips={emptyFaceTips}
                    type="face"
                  />
                )}
                {!personImage && activePersonImage && <div className="sample-badge">SAMPLE</div>}
                {(personImage || selectedSampleUrl) && (
                  <button className="clear-img-btn" onClick={() => {
                    setPersonImage(null);
                    setSelectedSampleUrl(null);
                    setPersonPreviewState('idle');
                  }}>&times;</button>
                )}
              </div>
            </div>

            <div className="try-column">
              <div className="card-header">
                <span className="section-label">Step 2</span>
                <h3 className="card-title">{t.step2Title}</h3>
              </div>
              <div className="try-actions">
                <button className="outline-btn primary" onClick={handleOpenClothSampleModal}>
                  {lang === 'ko' ? '샘플 의상 선택' : 'Choose Clothing Sample'}
                </button>
                <button className="outline-btn" onClick={() => document.getElementById('c-up')?.click()}>
                  {lang === 'ko' ? '의상 사진 업로드' : 'Upload Clothing'}
                </button>
                <input id="c-up" type="file" hidden accept="image/*" onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) {
                    setClothUploadMessage(lang === 'ko' ? '큰 의상 이미지를 자동으로 최적화하고 있습니다...' : 'Optimizing the clothing image for upload...');
                    setClothPreviewState('loading');
                    preprocessImageFile(f, { maxDimension: 1600, maxBytes: 2_400_000 })
                      .then((src) => {
                        setSelectedClothSampleUrl(null);
                        setClothImage(src);
                      })
                      .catch(() => {
                        setClothUploadMessage(null);
                        setClothPreviewState('error');
                      });
                  }
                }} />
              </div>
              <div className={`preview-box ${activeClothImage ? 'has-image' : ''}`}>
                {activeClothImage ? (
                  <>
                    {clothPreviewState === 'loading' && (
                      <div className="preview-overlay">
                        <span className="spinner"></span>
                        <span>{clothUploadMessage || (lang === 'ko' ? '이미지 불러오는 중...' : 'Loading image...')}</span>
                      </div>
                    )}
                    {clothPreviewState === 'error' ? (
                      <div className="img-error-msg">{lang === 'ko' ? '이미지를 불러올 수 없습니다.' : 'Unable to load image.'}</div>
                    ) : (
                      <img
                        src={activeClothImage}
                        alt="Cloth"
                        className={clothPreviewState === 'ready' ? 'is-visible' : ''}
                        onLoad={() => {
                          setClothPreviewState('ready');
                          setClothUploadMessage(null);
                        }}
                        onError={() => setClothPreviewState('error')}
                      />
                    )}
                    {!clothImage && activeClothImage && <div className="sample-badge">SAMPLE</div>}
                    {(clothImage || selectedClothSampleUrl) && (
                      <button className="clear-img-btn" onClick={() => {
                        setClothImage(null);
                        setSelectedClothSampleUrl(null);
                        setClothPreviewState('idle');
                      }}>&times;</button>
                    )}
                  </>
                ) : (
                  <EmptyPreviewState
                    title={lang === 'ko' ? '의상 사진을 넣어주세요' : 'Add clothing photo'}
                    tips={emptyClothTips}
                    type="cloth"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="action-section">
            <button className="generate-btn" onClick={handleGenerate} disabled={isGenerating || !activePersonImage || !activeClothImage}>
              {isGenerating ? (
                <><span className="spinner"></span>{t.generating}</>
              ) : t.generate}
            </button>
            {isGenerating && <p className="loading-subtext">{t.loadingDetail}</p>}
          </div>

          {resultImage && (
            <div id="result-area" className="results-section">
              <h2 className="section-heading">{t.resultTitle}</h2>
              <div className="composite-result">
                {resultPreviewState === 'loading' && (
                  <div className="preview-overlay result-overlay">
                    <span className="spinner"></span>
                    <span>{lang === 'ko' ? '결과 이미지 렌더링 중...' : 'Rendering result...'}</span>
                  </div>
                )}
                {resultPreviewState === 'error' ? (
                  <div className="img-error-msg">{lang === 'ko' ? '결과 이미지를 표시할 수 없습니다.' : 'Unable to display the result.'}</div>
                ) : (
                  <img 
                    src={resultImage}
                    alt="Result"
                    className={resultPreviewState === 'ready' ? 'is-visible' : ''}
                    onLoad={() => setResultPreviewState('ready')}
                    onError={() => setResultPreviewState('error')}
                  />
                )}
                <div className="watermark">HAMDEVA AI</div>
              </div>
              <button className="download-btn" onClick={() => {
                const a = document.createElement('a'); a.href = resultImage; a.download = 'hamdeva-fitting.png'; a.click();
              }}>{t.download}</button>
            </div>
          )}
        </div>
      </section>

      <footer className="site-footer">
        <p className="footer-copy">{t.footer}</p>
      </footer>

      {showSampleModal && (
        <SampleModal 
          currentUrl={activePersonImage}
          lang={lang}
          onSelect={(url, category) => {
            setSelectedSampleUrl(url);
            setGender(category);
            setPersonImage(null);
            setPersonUploadMessage(null);
            setPersonPreviewState('loading');
          }}
          onClose={() => setShowSampleModal(false)}
        />
      )}

      {showClothSampleModal && (
        <ClothSampleModal
          currentUrl={activeClothImage}
          lang={lang}
          onSelect={(url) => {
            setSelectedClothSampleUrl(url);
            setClothImage(null);
            setClothUploadMessage(null);
            setClothPreviewState('loading');
          }}
          onClose={() => setShowClothSampleModal(false)}
        />
      )}
    </div>
  );
};

export default App;
