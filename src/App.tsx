import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import ClothSampleModal from './components/ClothSampleModal';
import SampleModal from './components/SampleModal';
import { LANGUAGE_OPTIONS, type LanguageCode } from './constants/languages';
import { clothSampleOptions } from './data/clothSamples';
type ImageLoadState = 'idle' | 'loading' | 'ready' | 'error';
type FontTheme = 'latin' | 'korean' | 'japanese' | 'chinese' | 'arabic' | 'indic';
const APP_VERSION = 'v0.0.1';

// ─── 번역 ─────────────────────────────────────────────────────
const translations = {
  ko: {
    navFeatures: '기능 소개', navHowto: '사용 방법', navFaq: 'FAQ',
    heroEyebrow: 'AI 기반 가상 피팅 서비스',
    heroTitle: '입어보지 않아도\n완벽한 나의 스타일',
    heroSub: '단 한 장의 사진으로\nHAMDEVA AI가\n당신에게 가장 어울리는 스타일을\n미리 입혀드립니다',
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
    chooseSample: '샘플 선택',
    uploadMyPhoto: '내 사진 업로드',
    chooseClothingSample: '샘플 의상 선택',
    uploadClothing: '의상 사진 업로드',
    preparingPersonUpload: '이미지를 업로드하기 좋게 정리하고 있습니다...',
    preparingClothingUpload: '큰 의상 이미지를 자동으로 최적화하고 있습니다...',
    loadingImage: '이미지 불러오는 중...',
    imageLoadError: '이미지를 불러올 수 없습니다.',
    facePlaceholderTitle: '얼굴 사진을 넣어주세요',
    clothingPlaceholderTitle: '의상 사진을 넣어주세요',
    renderingResult: '결과 이미지 렌더링 중...',
    resultDisplayError: '결과 이미지를 표시할 수 없습니다.',
    clothingSamplesPending: '샘플 의상 데이터 준비 중입니다.',
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
    chooseSample: 'Choose Sample',
    uploadMyPhoto: 'Upload My Photo',
    chooseClothingSample: 'Choose Clothing Sample',
    uploadClothing: 'Upload Clothing',
    preparingPersonUpload: 'Preparing your image for upload...',
    preparingClothingUpload: 'Optimizing the clothing image for upload...',
    loadingImage: 'Loading image...',
    imageLoadError: 'Unable to load image.',
    facePlaceholderTitle: 'Add a face photo',
    clothingPlaceholderTitle: 'Add clothing photo',
    renderingResult: 'Rendering result...',
    resultDisplayError: 'Unable to display the result.',
    clothingSamplesPending: 'Clothing samples are being prepared.',
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

const uiTranslations: Record<LanguageCode, typeof translations.en> = {
  ko: translations.ko,
  en: translations.en,
  es: {
    ...translations.en,
    heroEyebrow: 'Servicio de prueba virtual con IA',
    heroTitle: 'Tu estilo perfecto\nantes de comprar',
    heroSub: 'Solo necesitas una foto. La IA de HAMDEVA reconoce tu rostro y prueba la prenda elegida de forma natural.',
    step1Title: 'Sube la foto de la persona',
    step2Title: 'Sube la foto de la prenda',
    chooseSample: 'Elegir muestra',
    uploadMyPhoto: 'Subir mi foto',
    chooseClothingSample: 'Elegir prenda de muestra',
    uploadClothing: 'Subir prenda',
    preparingPersonUpload: 'Preparando tu imagen para subir...',
    preparingClothingUpload: 'Optimizando la imagen de la prenda...',
    loadingImage: 'Cargando imagen...',
    imageLoadError: 'No se pudo cargar la imagen.',
    facePlaceholderTitle: 'Añade una foto del rostro',
    clothingPlaceholderTitle: 'Añade una foto de la prenda',
    generate: 'Generar prueba con IA',
    generating: 'Procesando con IA... (hasta 30 s)',
    loadingDetail: 'HAMDEVA AI está analizando y componiendo las imágenes...',
    alertBoth: 'Por favor, sube una foto de persona y una foto de prenda.',
    alertError: 'No se pudo generar la imagen. Inténtalo de nuevo.',
    resultTitle: 'Resultado de prueba',
    download: 'Guardar imagen',
    freeLeft: (n: number) => `Usos gratuitos restantes hoy: ${n}`,
    freeExhausted: 'Has usado los 3 intentos gratuitos de hoy.',
    renderingResult: 'Renderizando el resultado...',
    resultDisplayError: 'No se puede mostrar el resultado.',
    clothingSamplesPending: 'Las muestras de prendas aún se están preparando.',
    footer: '© 2025 HAMDEVA. Todos los derechos reservados.',
  },
  zh: {
    ...translations.en,
    heroEyebrow: 'AI 虚拟试穿服务',
    heroTitle: '购买前先看见\n最适合你的风格',
    heroSub: '只需一张照片。HAMDEVA AI 会识别人脸，并自然地将所选服装试穿到你的照片上。',
    step1Title: '上传人物照片',
    step2Title: '上传服装照片',
    chooseSample: '选择示例',
    uploadMyPhoto: '上传我的照片',
    chooseClothingSample: '选择示例服装',
    uploadClothing: '上传服装',
    preparingPersonUpload: '正在整理图片以便上传...',
    preparingClothingUpload: '正在优化服装图片...',
    loadingImage: '正在加载图片...',
    imageLoadError: '无法加载图片。',
    facePlaceholderTitle: '请添加人脸照片',
    clothingPlaceholderTitle: '请添加服装照片',
    generate: '生成 AI 试穿',
    generating: 'AI 处理中...（最多 30 秒）',
    loadingDetail: 'HAMDEVA AI 正在分析并合成图像...',
    alertBoth: '请同时上传人物照片和服装照片。',
    alertError: '图像生成失败，请重试。',
    resultTitle: '试穿结果',
    download: '保存图片',
    freeLeft: (n: number) => `今日剩余免费次数：${n}`,
    freeExhausted: '你今天的 3 次免费试穿已全部用完。',
    renderingResult: '正在渲染结果图...',
    resultDisplayError: '无法显示结果图。',
    clothingSamplesPending: '示例服装数据正在准备中。',
    footer: '© 2025 HAMDEVA。保留所有权利。',
  },
  ja: {
    ...translations.en,
    heroEyebrow: 'AI バーチャル試着サービス',
    heroTitle: '買う前にわかる\nあなたに似合うスタイル',
    heroSub: '写真 1 枚で十分です。HAMDEVA AI が顔を認識し、選んだ服を自然に着せ替えます。',
    step1Title: '人物写真をアップロード',
    step2Title: '服の写真をアップロード',
    chooseSample: 'サンプルを選ぶ',
    uploadMyPhoto: '自分の写真をアップロード',
    chooseClothingSample: '服のサンプルを選ぶ',
    uploadClothing: '服をアップロード',
    preparingPersonUpload: 'アップロードしやすいように画像を調整しています...',
    preparingClothingUpload: '服画像を自動で最適化しています...',
    loadingImage: '画像を読み込み中...',
    imageLoadError: '画像を読み込めませんでした。',
    facePlaceholderTitle: '顔写真を追加してください',
    clothingPlaceholderTitle: '服の写真を追加してください',
    generate: 'AI 試着を生成',
    generating: 'AI 処理中...（最大 30 秒）',
    loadingDetail: 'HAMDEVA AI が画像を解析して合成しています...',
    alertBoth: '人物写真と服の写真の両方をアップロードしてください。',
    alertError: '画像の生成に失敗しました。もう一度お試しください。',
    resultTitle: '試着結果',
    download: '画像を保存',
    freeLeft: (n: number) => `本日の無料利用残り回数: ${n}`,
    freeExhausted: '本日の無料 3 回分をすべて使いました。',
    renderingResult: '結果画像を描画中...',
    resultDisplayError: '結果画像を表示できません。',
    clothingSamplesPending: '服サンプルは準備中です。',
    footer: '© 2025 HAMDEVA. All rights reserved.',
  },
  hi: {
    ...translations.en,
    heroEyebrow: 'AI आधारित वर्चुअल ट्राय-ऑन सेवा',
    heroTitle: 'खरीदने से पहले\nअपना सही स्टाइल देखें',
    heroSub: 'सिर्फ एक फोटो काफी है। HAMDEVA AI चेहरा पहचानकर चुने हुए कपड़े को स्वाभाविक रूप से पहनाकर दिखाता है।',
    step1Title: 'व्यक्ति की फोटो अपलोड करें',
    step2Title: 'कपड़ों की फोटो अपलोड करें',
    chooseSample: 'नमूना चुनें',
    uploadMyPhoto: 'मेरी फोटो अपलोड करें',
    chooseClothingSample: 'नमूना कपड़ा चुनें',
    uploadClothing: 'कपड़ा अपलोड करें',
    preparingPersonUpload: 'अपलोड के लिए आपकी छवि तैयार की जा रही है...',
    preparingClothingUpload: 'कपड़ों की छवि को अनुकूलित किया जा रहा है...',
    loadingImage: 'छवि लोड हो रही है...',
    imageLoadError: 'छवि लोड नहीं हो सकी।',
    facePlaceholderTitle: 'चेहरे की फोटो जोड़ें',
    clothingPlaceholderTitle: 'कपड़ों की फोटो जोड़ें',
    generate: 'AI ट्राय-ऑन बनाएँ',
    generating: 'AI प्रोसेस कर रहा है... (अधिकतम 30 सेकंड)',
    loadingDetail: 'HAMDEVA AI छवियों का विश्लेषण और संयोजन कर रहा है...',
    alertBoth: 'कृपया व्यक्ति और कपड़ों की दोनों तस्वीरें अपलोड करें।',
    alertError: 'छवि निर्माण विफल रहा। कृपया फिर से कोशिश करें।',
    resultTitle: 'ट्राय-ऑन परिणाम',
    download: 'छवि सहेजें',
    freeLeft: (n: number) => `आज शेष निःशुल्क उपयोग: ${n}`,
    freeExhausted: 'आज के 3 मुफ्त उपयोग पूरे हो चुके हैं।',
    renderingResult: 'परिणाम छवि रेंडर हो रही है...',
    resultDisplayError: 'परिणाम छवि प्रदर्शित नहीं की जा सकती।',
    clothingSamplesPending: 'नमूना कपड़ों का डेटा तैयार किया जा रहा है।',
    footer: '© 2025 HAMDEVA. सर्वाधिकार सुरक्षित।',
  },
  fr: {
    ...translations.en,
    heroEyebrow: 'Service d’essayage virtuel par IA',
    heroTitle: 'Votre style parfait\navant d’acheter',
    heroSub: 'Une seule photo suffit. L’IA de HAMDEVA reconnaît le visage et applique naturellement le vêtement choisi.',
    step1Title: 'Importer la photo de la personne',
    step2Title: 'Importer la photo du vêtement',
    chooseSample: 'Choisir un exemple',
    uploadMyPhoto: 'Importer ma photo',
    chooseClothingSample: 'Choisir un vêtement exemple',
    uploadClothing: 'Importer un vêtement',
    preparingPersonUpload: 'Préparation de votre image pour l’envoi...',
    preparingClothingUpload: 'Optimisation de l’image du vêtement...',
    loadingImage: 'Chargement de l’image...',
    imageLoadError: 'Impossible de charger l’image.',
    facePlaceholderTitle: 'Ajoutez une photo du visage',
    clothingPlaceholderTitle: 'Ajoutez une photo du vêtement',
    generate: 'Générer l’essayage IA',
    generating: 'Traitement IA... (jusqu’à 30 s)',
    loadingDetail: 'HAMDEVA AI analyse et compose les images...',
    alertBoth: 'Veuillez importer une photo de la personne et une photo du vêtement.',
    alertError: 'La génération de l’image a échoué. Veuillez réessayer.',
    resultTitle: 'Résultat de l’essayage',
    download: 'Enregistrer l’image',
    freeLeft: (n: number) => `Utilisations gratuites restantes aujourd'hui : ${n}`,
    freeExhausted: 'Vous avez utilisé vos 3 essais gratuits du jour.',
    renderingResult: 'Rendu du résultat...',
    resultDisplayError: 'Impossible d’afficher le résultat.',
    clothingSamplesPending: 'Les exemples de vêtements sont en cours de préparation.',
    footer: '© 2025 HAMDEVA. Tous droits réservés.',
  },
  ar: {
    ...translations.en,
    heroEyebrow: 'خدمة قياس افتراضي بالذكاء الاصطناعي',
    heroTitle: 'أسلوبك المثالي\nقبل الشراء',
    heroSub: 'كل ما تحتاجه صورة واحدة. يتعرف HAMDEVA AI على الوجه ويجرب الملابس المختارة بشكل طبيعي.',
    step1Title: 'ارفع صورة الشخص',
    step2Title: 'ارفع صورة الملابس',
    chooseSample: 'اختر نموذجًا',
    uploadMyPhoto: 'ارفع صورتي',
    chooseClothingSample: 'اختر عينة ملابس',
    uploadClothing: 'ارفع الملابس',
    preparingPersonUpload: 'جارٍ تجهيز الصورة للرفع...',
    preparingClothingUpload: 'جارٍ تحسين صورة الملابس...',
    loadingImage: 'جارٍ تحميل الصورة...',
    imageLoadError: 'تعذر تحميل الصورة.',
    facePlaceholderTitle: 'أضف صورة للوجه',
    clothingPlaceholderTitle: 'أضف صورة للملابس',
    generate: 'إنشاء قياس بالذكاء الاصطناعي',
    generating: 'جارٍ المعالجة بالذكاء الاصطناعي... (حتى 30 ثانية)',
    loadingDetail: 'يقوم HAMDEVA AI بتحليل الصور ودمجها...',
    alertBoth: 'يرجى رفع صورة الشخص وصورة الملابس معًا.',
    alertError: 'فشل إنشاء الصورة. حاول مرة أخرى.',
    resultTitle: 'نتيجة القياس',
    download: 'حفظ الصورة',
    freeLeft: (n: number) => `مرات الاستخدام المجانية المتبقية اليوم: ${n}`,
    freeExhausted: 'لقد استخدمت كل المحاولات المجانية الثلاث اليوم.',
    renderingResult: 'جارٍ عرض النتيجة...',
    resultDisplayError: 'تعذر عرض النتيجة.',
    clothingSamplesPending: 'يتم تجهيز عينات الملابس حاليًا.',
    footer: '© 2025 HAMDEVA. جميع الحقوق محفوظة.',
  },
  bn: {
    ...translations.en,
    heroEyebrow: 'এআই ভার্চুয়াল ট্রাই-অন সেবা',
    heroTitle: 'কেনার আগে দেখুন\nআপনার সেরা স্টাইল',
    heroSub: 'একটি ছবিই যথেষ্ট। HAMDEVA AI মুখ চিনে নিয়ে পছন্দের পোশাকটি স্বাভাবিকভাবে পরিয়ে দেখায়।',
    step1Title: 'ব্যক্তির ছবি আপলোড করুন',
    step2Title: 'পোশাকের ছবি আপলোড করুন',
    chooseSample: 'স্যাম্পল নির্বাচন করুন',
    uploadMyPhoto: 'আমার ছবি আপলোড করুন',
    chooseClothingSample: 'স্যাম্পল পোশাক নির্বাচন করুন',
    uploadClothing: 'পোশাক আপলোড করুন',
    preparingPersonUpload: 'আপলোডের জন্য ছবিটি প্রস্তুত করা হচ্ছে...',
    preparingClothingUpload: 'পোশাকের ছবিটি অপ্টিমাইজ করা হচ্ছে...',
    loadingImage: 'ছবি লোড হচ্ছে...',
    imageLoadError: 'ছবি লোড করা যায়নি।',
    facePlaceholderTitle: 'মুখের ছবি যোগ করুন',
    clothingPlaceholderTitle: 'পোশাকের ছবি যোগ করুন',
    generate: 'এআই ট্রাই-অন তৈরি করুন',
    generating: 'এআই প্রসেস করছে... (সর্বোচ্চ ৩০ সেকেন্ড)',
    loadingDetail: 'HAMDEVA AI ছবি বিশ্লেষণ ও কম্পোজিট করছে...',
    alertBoth: 'অনুগ্রহ করে ব্যক্তি ও পোশাকের উভয় ছবি আপলোড করুন।',
    alertError: 'ছবি তৈরি ব্যর্থ হয়েছে। আবার চেষ্টা করুন।',
    resultTitle: 'ট্রাই-অন ফলাফল',
    download: 'ছবি সংরক্ষণ করুন',
    freeLeft: (n: number) => `আজ বাকি ফ্রি ব্যবহার: ${n}`,
    freeExhausted: 'আজকের ৩টি ফ্রি ব্যবহার শেষ হয়েছে।',
    renderingResult: 'ফলাফলের ছবি রেন্ডার হচ্ছে...',
    resultDisplayError: 'ফলাফলের ছবি দেখানো যাচ্ছে না।',
    clothingSamplesPending: 'স্যাম্পল পোশাক প্রস্তুত করা হচ্ছে।',
    footer: '© 2025 HAMDEVA. সর্বস্বত্ব সংরক্ষিত।',
  },
  ru: {
    ...translations.en,
    heroEyebrow: 'Сервис виртуальной примерки на ИИ',
    heroTitle: 'Ваш идеальный стиль\nещё до покупки',
    heroSub: 'Нужна всего одна фотография. HAMDEVA AI распознаёт лицо и естественно примеряет выбранную одежду.',
    step1Title: 'Загрузите фото человека',
    step2Title: 'Загрузите фото одежды',
    chooseSample: 'Выбрать образец',
    uploadMyPhoto: 'Загрузить моё фото',
    chooseClothingSample: 'Выбрать образец одежды',
    uploadClothing: 'Загрузить одежду',
    preparingPersonUpload: 'Подготавливаем изображение к загрузке...',
    preparingClothingUpload: 'Оптимизируем изображение одежды...',
    loadingImage: 'Загрузка изображения...',
    imageLoadError: 'Не удалось загрузить изображение.',
    facePlaceholderTitle: 'Добавьте фото лица',
    clothingPlaceholderTitle: 'Добавьте фото одежды',
    generate: 'Создать примерку ИИ',
    generating: 'ИИ обрабатывает... (до 30 сек.)',
    loadingDetail: 'HAMDEVA AI анализирует и объединяет изображения...',
    alertBoth: 'Пожалуйста, загрузите фото человека и фото одежды.',
    alertError: 'Не удалось создать изображение. Попробуйте снова.',
    resultTitle: 'Результат примерки',
    download: 'Сохранить изображение',
    freeLeft: (n: number) => `Бесплатных использований осталось сегодня: ${n}`,
    freeExhausted: 'Вы использовали все 3 бесплатные попытки на сегодня.',
    renderingResult: 'Отрисовка результата...',
    resultDisplayError: 'Не удалось показать результат.',
    clothingSamplesPending: 'Образцы одежды ещё готовятся.',
    footer: '© 2025 HAMDEVA. Все права защищены.',
  },
  pt: {
    ...translations.en,
    heroEyebrow: 'Serviço de prova virtual com IA',
    heroTitle: 'Seu estilo perfeito\nantes de comprar',
    heroSub: 'Uma foto é suficiente. A IA da HAMDEVA reconhece o rosto e veste naturalmente a peça escolhida.',
    step1Title: 'Enviar foto da pessoa',
    step2Title: 'Enviar foto da roupa',
    chooseSample: 'Escolher amostra',
    uploadMyPhoto: 'Enviar minha foto',
    chooseClothingSample: 'Escolher roupa de amostra',
    uploadClothing: 'Enviar roupa',
    preparingPersonUpload: 'Preparando sua imagem para upload...',
    preparingClothingUpload: 'Otimizando a imagem da roupa...',
    loadingImage: 'Carregando imagem...',
    imageLoadError: 'Não foi possível carregar a imagem.',
    facePlaceholderTitle: 'Adicione uma foto do rosto',
    clothingPlaceholderTitle: 'Adicione uma foto da roupa',
    generate: 'Gerar prova com IA',
    generating: 'Processando com IA... (até 30 s)',
    loadingDetail: 'HAMDEVA AI está analisando e compondo as imagens...',
    alertBoth: 'Envie a foto da pessoa e a foto da roupa.',
    alertError: 'Falha ao gerar a imagem. Tente novamente.',
    resultTitle: 'Resultado da prova',
    download: 'Salvar imagem',
    freeLeft: (n: number) => `Usos gratuitos restantes hoje: ${n}`,
    freeExhausted: 'Você já usou as 3 tentativas gratuitas de hoje.',
    renderingResult: 'Renderizando resultado...',
    resultDisplayError: 'Não foi possível exibir o resultado.',
    clothingSamplesPending: 'As amostras de roupa ainda estão sendo preparadas.',
    footer: '© 2025 HAMDEVA. Todos os direitos reservados.',
  },
  ur: {
    ...translations.en,
    heroEyebrow: 'اے آئی ورچوئل ٹرائی آن سروس',
    heroTitle: 'خریدنے سے پہلے\nاپنا بہترین انداز دیکھیں',
    heroSub: 'صرف ایک تصویر کافی ہے۔ HAMDEVA AI چہرہ پہچان کر منتخب لباس کو قدرتی انداز میں پہناتا ہے۔',
    step1Title: 'شخص کی تصویر اپ لوڈ کریں',
    step2Title: 'لباس کی تصویر اپ لوڈ کریں',
    chooseSample: 'نمونہ منتخب کریں',
    uploadMyPhoto: 'میری تصویر اپ لوڈ کریں',
    chooseClothingSample: 'نمونہ لباس منتخب کریں',
    uploadClothing: 'لباس اپ لوڈ کریں',
    preparingPersonUpload: 'تصویر اپ لوڈ کے لیے تیار کی جا رہی ہے...',
    preparingClothingUpload: 'لباس کی تصویر کو بہتر بنایا جا رہا ہے...',
    loadingImage: 'تصویر لوڈ ہو رہی ہے...',
    imageLoadError: 'تصویر لوڈ نہیں ہو سکی۔',
    facePlaceholderTitle: 'چہرے کی تصویر شامل کریں',
    clothingPlaceholderTitle: 'لباس کی تصویر شامل کریں',
    generate: 'اے آئی ٹرائی آن بنائیں',
    generating: 'اے آئی پروسیس کر رہا ہے... (زیادہ سے زیادہ 30 سیکنڈ)',
    loadingDetail: 'HAMDEVA AI تصاویر کا تجزیہ اور امتزاج کر رہا ہے...',
    alertBoth: 'براہ کرم شخص اور لباس دونوں کی تصاویر اپ لوڈ کریں۔',
    alertError: 'تصویر بنانا ناکام رہا۔ دوبارہ کوشش کریں۔',
    resultTitle: 'ٹرائی آن نتیجہ',
    download: 'تصویر محفوظ کریں',
    freeLeft: (n: number) => `آج باقی مفت استعمال: ${n}`,
    freeExhausted: 'آج کے 3 مفت استعمال ختم ہو چکے ہیں۔',
    renderingResult: 'نتیجے کی تصویر تیار ہو رہی ہے...',
    resultDisplayError: 'نتیجہ دکھایا نہیں جا سکتا۔',
    clothingSamplesPending: 'نمونہ لباس تیار کیا جا رہا ہے۔',
    footer: '© 2025 HAMDEVA. جملہ حقوق محفوظ ہیں۔',
  },
  id: {
    ...translations.en,
    heroEyebrow: 'Layanan virtual try-on berbasis AI',
    heroTitle: 'Gaya terbaikmu\nsebelum membeli',
    heroSub: 'Cukup satu foto. HAMDEVA AI mengenali wajah dan memasangkan pakaian pilihan secara alami.',
    step1Title: 'Unggah foto orang',
    step2Title: 'Unggah foto pakaian',
    chooseSample: 'Pilih sampel',
    uploadMyPhoto: 'Unggah foto saya',
    chooseClothingSample: 'Pilih sampel pakaian',
    uploadClothing: 'Unggah pakaian',
    preparingPersonUpload: 'Menyiapkan gambar untuk diunggah...',
    preparingClothingUpload: 'Mengoptimalkan gambar pakaian...',
    loadingImage: 'Memuat gambar...',
    imageLoadError: 'Gambar tidak dapat dimuat.',
    facePlaceholderTitle: 'Tambahkan foto wajah',
    clothingPlaceholderTitle: 'Tambahkan foto pakaian',
    generate: 'Buat try-on AI',
    generating: 'AI sedang memproses... (hingga 30 dtk)',
    loadingDetail: 'HAMDEVA AI sedang menganalisis dan mengomposisi gambar...',
    alertBoth: 'Silakan unggah foto orang dan foto pakaian.',
    alertError: 'Gagal membuat gambar. Silakan coba lagi.',
    resultTitle: 'Hasil try-on',
    download: 'Simpan gambar',
    freeLeft: (n: number) => `Sisa penggunaan gratis hari ini: ${n}`,
    freeExhausted: '3 percobaan gratis hari ini sudah habis.',
    renderingResult: 'Merender hasil...',
    resultDisplayError: 'Hasil tidak dapat ditampilkan.',
    clothingSamplesPending: 'Sampel pakaian masih disiapkan.',
    footer: '© 2025 HAMDEVA. Hak cipta dilindungi.',
  },
  de: {
    ...translations.en,
    heroEyebrow: 'KI-gestützter virtueller Anprobe-Service',
    heroTitle: 'Dein perfekter Stil\nvor dem Kauf',
    heroSub: 'Ein Foto reicht aus. HAMDEVA AI erkennt das Gesicht und legt das gewählte Outfit natürlich an.',
    step1Title: 'Personenfoto hochladen',
    step2Title: 'Kleidungsfoto hochladen',
    chooseSample: 'Beispiel wählen',
    uploadMyPhoto: 'Mein Foto hochladen',
    chooseClothingSample: 'Kleidungsbeispiel wählen',
    uploadClothing: 'Kleidung hochladen',
    preparingPersonUpload: 'Bild wird für den Upload vorbereitet...',
    preparingClothingUpload: 'Kleidungsbild wird optimiert...',
    loadingImage: 'Bild wird geladen...',
    imageLoadError: 'Bild konnte nicht geladen werden.',
    facePlaceholderTitle: 'Gesichtsfoto hinzufügen',
    clothingPlaceholderTitle: 'Kleidungsfoto hinzufügen',
    generate: 'KI-Anprobe erzeugen',
    generating: 'KI verarbeitet... (bis zu 30 Sek.)',
    loadingDetail: 'HAMDEVA AI analysiert und kombiniert die Bilder...',
    alertBoth: 'Bitte lade ein Personenfoto und ein Kleidungsfoto hoch.',
    alertError: 'Die Bildgenerierung ist fehlgeschlagen. Bitte versuche es erneut.',
    resultTitle: 'Anprobe-Ergebnis',
    download: 'Bild speichern',
    freeLeft: (n: number) => `Verbleibende kostenlose Nutzungen heute: ${n}`,
    freeExhausted: 'Du hast heute alle 3 kostenlosen Versuche verbraucht.',
    renderingResult: 'Ergebnis wird gerendert...',
    resultDisplayError: 'Das Ergebnis kann nicht angezeigt werden.',
    clothingSamplesPending: 'Kleidungsbeispiele werden noch vorbereitet.',
    footer: '© 2025 HAMDEVA. Alle Rechte vorbehalten.',
  },
  mr: {
    ...translations.en,
    heroEyebrow: 'AI आधारित व्हर्च्युअल ट्राय-ऑन सेवा',
    heroTitle: 'खरेदीपूर्वी पाहा\nतुमचा परफेक्ट स्टाइल',
    heroSub: 'फक्त एक फोटो पुरेसा आहे. HAMDEVA AI चेहरा ओळखते आणि निवडलेले कपडे नैसर्गिकरीत्या परिधान करून दाखवते.',
    step1Title: 'व्यक्तीचा फोटो अपलोड करा',
    step2Title: 'कपड्यांचा फोटो अपलोड करा',
    chooseSample: 'नमुना निवडा',
    uploadMyPhoto: 'माझा फोटो अपलोड करा',
    chooseClothingSample: 'नमुना कपडा निवडा',
    uploadClothing: 'कपडा अपलोड करा',
    preparingPersonUpload: 'अपलोडसाठी प्रतिमा तयार केली जात आहे...',
    preparingClothingUpload: 'कपड्यांची प्रतिमा ऑप्टिमाइझ केली जात आहे...',
    loadingImage: 'प्रतिमा लोड होत आहे...',
    imageLoadError: 'प्रतिमा लोड करता आली नाही.',
    facePlaceholderTitle: 'चेहऱ्याचा फोटो जोडा',
    clothingPlaceholderTitle: 'कपड्यांचा फोटो जोडा',
    generate: 'AI ट्राय-ऑन तयार करा',
    generating: 'AI प्रक्रिया करत आहे... (कमाल 30 सेकंद)',
    loadingDetail: 'HAMDEVA AI प्रतिमा विश्लेषित करून संयोजित करत आहे...',
    alertBoth: 'कृपया व्यक्ती आणि कपड्यांचे दोन्ही फोटो अपलोड करा.',
    alertError: 'प्रतिमा तयार करण्यात अयशस्वी. पुन्हा प्रयत्न करा.',
    resultTitle: 'ट्राय-ऑन निकाल',
    download: 'प्रतिमा जतन करा',
    freeLeft: (n: number) => `आज उरलेले मोफत वापर: ${n}`,
    freeExhausted: 'आजचे 3 मोफत वापर संपले आहेत.',
    renderingResult: 'निकालाची प्रतिमा रेंडर होत आहे...',
    resultDisplayError: 'निकाल दाखवता येत नाही.',
    clothingSamplesPending: 'नमुना कपड्यांची तयारी सुरू आहे.',
    footer: '© 2025 HAMDEVA. सर्व हक्क राखीव.',
  },
  te: {
    ...translations.en,
    heroEyebrow: 'AI ఆధారిత వర్చువల్ ట్రై-ఆన్ సేవ',
    heroTitle: 'కొనుగోలు చేసే ముందు\nమీకు సరైన స్టైల్ చూడండి',
    heroSub: 'ఒక ఫోటో చాలు. HAMDEVA AI ముఖాన్ని గుర్తించి ఎంచుకున్న దుస్తులను సహజంగా వేసి చూపిస్తుంది.',
    step1Title: 'వ్యక్తి ఫోటోను అప్‌లోడ్ చేయండి',
    step2Title: 'దుస్తుల ఫోటోను అప్‌లోడ్ చేయండి',
    chooseSample: 'సాంపిల్ ఎంచుకోండి',
    uploadMyPhoto: 'నా ఫోటో అప్‌లోడ్ చేయండి',
    chooseClothingSample: 'సాంపిల్ దుస్తులు ఎంచుకోండి',
    uploadClothing: 'దుస్తులు అప్‌లోడ్ చేయండి',
    preparingPersonUpload: 'అప్‌లోడ్ కోసం చిత్రాన్ని సిద్ధం చేస్తున్నాం...',
    preparingClothingUpload: 'దుస్తుల చిత్రాన్ని ఆప్టిమైజ్ చేస్తున్నాం...',
    loadingImage: 'చిత్రం లోడ్ అవుతోంది...',
    imageLoadError: 'చిత్రాన్ని లోడ్ చేయలేకపోయాం.',
    facePlaceholderTitle: 'ముఖ చిత్రం జోడించండి',
    clothingPlaceholderTitle: 'దుస్తుల చిత్రం జోడించండి',
    generate: 'AI ట్రై-ఆన్ సృష్టించండి',
    generating: 'AI ప్రాసెస్ చేస్తోంది... (గరిష్టం 30 సెకండ్లు)',
    loadingDetail: 'HAMDEVA AI చిత్రాలను విశ్లేషించి కలుపుతోంది...',
    alertBoth: 'దయచేసి వ్యక్తి ఫోటో మరియు దుస్తుల ఫోటో రెండూ అప్‌లోడ్ చేయండి.',
    alertError: 'చిత్రం సృష్టించడం విఫలమైంది. మళ్లీ ప్రయత్నించండి.',
    resultTitle: 'ట్రై-ఆన్ ఫలితం',
    download: 'చిత్రం సేవ్ చేయండి',
    freeLeft: (n: number) => `ఈరోజు మిగిలిన ఉచిత వినియోగాలు: ${n}`,
    freeExhausted: 'ఈరోజు 3 ఉచిత ప్రయత్నాలు పూర్తయ్యాయి.',
    renderingResult: 'ఫలిత చిత్రాన్ని రેન્ડర్ చేస్తున్నాం...',
    resultDisplayError: 'ఫలితాన్ని చూపించలేం.',
    clothingSamplesPending: 'సాంపిల్ దుస్తుల డేటా సిద్ధమవుతోంది.',
    footer: '© 2025 HAMDEVA. అన్ని హక్కులు పరిరక్షించబడ్డాయి.',
  },
  tr: {
    ...translations.en,
    heroEyebrow: 'Yapay zekâ destekli sanal deneme hizmeti',
    heroTitle: 'Satın almadan önce\nmükemmel stilini gör',
    heroSub: 'Tek bir fotoğraf yeterli. HAMDEVA AI yüzü tanır ve seçilen kıyafeti doğal şekilde uygular.',
    step1Title: 'Kişi fotoğrafını yükleyin',
    step2Title: 'Kıyafet fotoğrafını yükleyin',
    chooseSample: 'Örnek seç',
    uploadMyPhoto: 'Fotoğrafımı yükle',
    chooseClothingSample: 'Örnek kıyafet seç',
    uploadClothing: 'Kıyafet yükle',
    preparingPersonUpload: 'Görseliniz yükleme için hazırlanıyor...',
    preparingClothingUpload: 'Kıyafet görseli optimize ediliyor...',
    loadingImage: 'Görsel yükleniyor...',
    imageLoadError: 'Görsel yüklenemedi.',
    facePlaceholderTitle: 'Yüz fotoğrafı ekleyin',
    clothingPlaceholderTitle: 'Kıyafet fotoğrafı ekleyin',
    generate: 'Yapay zekâ ile deneme oluştur',
    generating: 'Yapay zekâ işliyor... (30 sn’ye kadar)',
    loadingDetail: 'HAMDEVA AI görselleri analiz ediyor ve birleştiriyor...',
    alertBoth: 'Lütfen kişi fotoğrafı ve kıyafet fotoğrafı yükleyin.',
    alertError: 'Görsel oluşturulamadı. Lütfen tekrar deneyin.',
    resultTitle: 'Deneme sonucu',
    download: 'Görseli kaydet',
    freeLeft: (n: number) => `Bugün kalan ücretsiz kullanım: ${n}`,
    freeExhausted: 'Bugünkü 3 ücretsiz hakkınızı kullandınız.',
    renderingResult: 'Sonuç işleniyor...',
    resultDisplayError: 'Sonuç gösterilemiyor.',
    clothingSamplesPending: 'Örnek kıyafetler hazırlanıyor.',
    footer: '© 2025 HAMDEVA. Tüm hakları saklıdır.',
  },
  ta: {
    ...translations.en,
    heroEyebrow: 'AI அடிப்படையிலான மெய்நிகர் அணிவிப்பு சேவை',
    heroTitle: 'வாங்கும் முன் பாருங்கள்\nஉங்களுக்கு பொருந்தும் ஸ்டைல்',
    heroSub: 'ஒரு புகைப்படம் போதும். HAMDEVA AI முகத்தை அடையாளம் கண்டு தேர்ந்தெடுத்த உடையை இயல்பாக அணிவித்து காட்டும்.',
    step1Title: 'நபரின் புகைப்படத்தை பதிவேற்றவும்',
    step2Title: 'உடை புகைப்படத்தை பதிவேற்றவும்',
    chooseSample: 'மாதிரி தேர்வு',
    uploadMyPhoto: 'என் புகைப்படத்தை பதிவேற்று',
    chooseClothingSample: 'மாதிரி உடை தேர்வு',
    uploadClothing: 'உடை பதிவேற்று',
    preparingPersonUpload: 'பதிவேற்றத்திற்காக படத்தை தயார் செய்கிறோம்...',
    preparingClothingUpload: 'உடை படத்தை மேம்படுத்துகிறோம்...',
    loadingImage: 'படம் ஏற்றப்படுகிறது...',
    imageLoadError: 'படத்தை ஏற்ற முடியவில்லை.',
    facePlaceholderTitle: 'முகப் புகைப்படத்தை சேர்க்கவும்',
    clothingPlaceholderTitle: 'உடை புகைப்படத்தை சேர்க்கவும்',
    generate: 'AI அணிவிப்பு உருவாக்கவும்',
    generating: 'AI செயலாக்குகிறது... (அதிகபட்சம் 30 விநாடிகள்)',
    loadingDetail: 'HAMDEVA AI படங்களை பகுப்பாய்வு செய்து இணைக்கிறது...',
    alertBoth: 'நபர் மற்றும் உடை புகைப்படங்களை இரண்டையும் பதிவேற்றவும்.',
    alertError: 'படம் உருவாக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.',
    resultTitle: 'அணிவிப்பு முடிவு',
    download: 'படத்தை சேமிக்கவும்',
    freeLeft: (n: number) => `இன்றைக்கு மீதமுள்ள இலவச பயன்பாடுகள்: ${n}`,
    freeExhausted: 'இன்றைய 3 இலவச முயற்சிகளும் முடிந்துவிட்டன.',
    renderingResult: 'முடிவு படம் உருவாக்கப்படுகிறது...',
    resultDisplayError: 'முடிவை காட்ட முடியவில்லை.',
    clothingSamplesPending: 'மாதிரி உடைகள் தயார் செய்யப்படுகின்றன.',
    footer: '© 2025 HAMDEVA. அனைத்து உரிமைகளும் பாதுகாக்கப்பட்டவை.',
  },
  vi: {
    ...translations.en,
    heroEyebrow: 'Dịch vụ thử đồ ảo bằng AI',
    heroTitle: 'Xem phong cách hoàn hảo\ntrước khi mua',
    heroSub: 'Chỉ cần một bức ảnh. HAMDEVA AI nhận diện khuôn mặt và mặc thử trang phục đã chọn một cách tự nhiên.',
    step1Title: 'Tải ảnh người mẫu lên',
    step2Title: 'Tải ảnh trang phục lên',
    chooseSample: 'Chọn mẫu',
    uploadMyPhoto: 'Tải ảnh của tôi',
    chooseClothingSample: 'Chọn trang phục mẫu',
    uploadClothing: 'Tải trang phục lên',
    preparingPersonUpload: 'Đang chuẩn bị ảnh để tải lên...',
    preparingClothingUpload: 'Đang tối ưu ảnh trang phục...',
    loadingImage: 'Đang tải ảnh...',
    imageLoadError: 'Không thể tải ảnh.',
    facePlaceholderTitle: 'Thêm ảnh khuôn mặt',
    clothingPlaceholderTitle: 'Thêm ảnh trang phục',
    generate: 'Tạo thử đồ bằng AI',
    generating: 'AI đang xử lý... (tối đa 30 giây)',
    loadingDetail: 'HAMDEVA AI đang phân tích và ghép ảnh...',
    alertBoth: 'Vui lòng tải lên cả ảnh người và ảnh trang phục.',
    alertError: 'Tạo ảnh thất bại. Vui lòng thử lại.',
    resultTitle: 'Kết quả thử đồ',
    download: 'Lưu ảnh',
    freeLeft: (n: number) => `Lượt dùng miễn phí còn lại hôm nay: ${n}`,
    freeExhausted: 'Bạn đã dùng hết 3 lượt miễn phí hôm nay.',
    renderingResult: 'Đang hiển thị kết quả...',
    resultDisplayError: 'Không thể hiển thị kết quả.',
    clothingSamplesPending: 'Dữ liệu trang phục mẫu đang được chuẩn bị.',
    footer: '© 2025 HAMDEVA. Bảo lưu mọi quyền.',
  },
  it: {
    ...translations.en,
    heroEyebrow: 'Servizio di prova virtuale con IA',
    heroTitle: 'Il tuo stile perfetto\nprima di acquistare',
    heroSub: 'Basta una sola foto. HAMDEVA AI riconosce il volto e applica naturalmente il capo scelto.',
    step1Title: 'Carica la foto della persona',
    step2Title: 'Carica la foto del capo',
    chooseSample: 'Scegli campione',
    uploadMyPhoto: 'Carica la mia foto',
    chooseClothingSample: 'Scegli capo campione',
    uploadClothing: 'Carica il capo',
    preparingPersonUpload: 'Preparazione dell’immagine per il caricamento...',
    preparingClothingUpload: 'Ottimizzazione dell’immagine del capo...',
    loadingImage: 'Caricamento immagine...',
    imageLoadError: 'Impossibile caricare l’immagine.',
    facePlaceholderTitle: 'Aggiungi una foto del viso',
    clothingPlaceholderTitle: 'Aggiungi una foto del capo',
    generate: 'Genera prova con IA',
    generating: 'Elaborazione IA... (fino a 30 s)',
    loadingDetail: 'HAMDEVA AI sta analizzando e componendo le immagini...',
    alertBoth: 'Carica sia una foto della persona sia una del capo.',
    alertError: 'Generazione dell’immagine non riuscita. Riprova.',
    resultTitle: 'Risultato della prova',
    download: 'Salva immagine',
    freeLeft: (n: number) => `Utilizzi gratuiti rimasti oggi: ${n}`,
    freeExhausted: 'Hai esaurito i 3 tentativi gratuiti di oggi.',
    renderingResult: 'Rendering del risultato...',
    resultDisplayError: 'Impossibile visualizzare il risultato.',
    clothingSamplesPending: 'I campioni di abbigliamento sono in preparazione.',
    footer: '© 2025 HAMDEVA. Tutti i diritti riservati.',
  },
};

const FACE_TIPS: Record<LanguageCode, string[]> = {
  ko: [
    '정면에 가깝고 얼굴이 선명한 사진이 가장 좋습니다.',
    '머리카락, 손, 마스크, 안경, 소품 등에 얼굴이 가려지지 않은 사진을 권장합니다.',
    '조명이 밝고 배경이 단순한 사진일수록 인식률이 좋습니다.',
    '상반신 또는 얼굴 중심 사진이 가장 적합합니다.',
  ],
  en: [
    'A clear photo close to the front view works best.',
    'Use a photo where the face is not blocked by hair, hands, masks, glasses, or props.',
    'Bright lighting and a simple background improve recognition.',
    'Upper-body or face-focused photos work best.',
  ],
  es: [
    'Funciona mejor una foto clara y casi de frente.',
    'Se recomienda una foto donde el rostro no esté cubierto por pelo, manos, mascarilla, gafas u objetos.',
    'Cuanto mejor sea la luz y más simple el fondo, mejor será el reconocimiento.',
    'Las fotos del rostro o del torso superior son las más adecuadas.',
  ],
  zh: [
    '接近正面的清晰照片效果最好。',
    '建议使用没有被头发、手、口罩、眼镜或道具遮挡脸部的照片。',
    '光线越明亮、背景越简单，识别效果越好。',
    '半身照或以脸部为中心的照片最合适。',
  ],
  ja: [
    '正面に近く、顔がはっきり見える写真が最適です。',
    '髪、手、マスク、メガネ、小物などで顔が隠れていない写真をおすすめします。',
    '明るく、背景がシンプルな写真ほど認識精度が上がります。',
    '上半身または顔中心の写真が最も適しています。',
  ],
  hi: [
    'सामने के करीब और साफ़ चेहरा दिखने वाली फोटो सबसे अच्छी होती है।',
    'ऐसी फोटो चुनें जिसमें बाल, हाथ, मास्क, चश्मा या अन्य वस्तुओं से चेहरा ढका न हो।',
    'रोशनी अच्छी और पृष्ठभूमि सरल होने पर पहचान बेहतर होती है।',
    'ऊपरी शरीर या चेहरे पर केंद्रित फोटो सबसे उपयुक्त है।',
  ],
  fr: [
    'Une photo nette, prise presque de face, fonctionne le mieux.',
    'Utilisez de préférence une photo où le visage n’est pas caché par les cheveux, les mains, un masque, des lunettes ou des accessoires.',
    'Plus la lumière est bonne et l’arrière-plan simple, meilleure sera la détection.',
    'Une photo centrée sur le visage ou le haut du corps est idéale.',
  ],
  ar: [
    'أفضل نتيجة تكون لصورة واضحة وقريبة من الوضع الأمامي.',
    'يُفضَّل استخدام صورة لا يكون فيها الوجه مغطى بالشعر أو اليد أو الكمامة أو النظارات أو الإكسسوارات.',
    'كلما كانت الإضاءة أفضل والخلفية أبسط، كانت دقة التعرف أعلى.',
    'الصور التي تركز على الوجه أو الجزء العلوي من الجسم هي الأنسب.',
  ],
  bn: [
    'সামনের দিকে তোলা ও পরিষ্কার মুখ দেখা যায় এমন ছবি সবচেয়ে ভালো।',
    'চুল, হাত, মাস্ক, চশমা বা অন্য কোনো জিনিসে মুখ ঢাকা নেই এমন ছবি ব্যবহার করুন।',
    'আলো যত ভালো এবং ব্যাকগ্রাউন্ড যত সহজ হবে, শনাক্তকরণ তত ভালো হবে।',
    'মুখ বা উপরের শরীরভিত্তিক ছবি সবচেয়ে উপযুক্ত।',
  ],
  ru: [
    'Лучше всего подходит чёткая фотография, близкая к фронтальному ракурсу.',
    'Рекомендуется фото, где лицо не закрыто волосами, руками, маской, очками или аксессуарами.',
    'Чем лучше освещение и проще фон, тем выше точность распознавания.',
    'Лучше всего подходят фото лица или верхней части тела.',
  ],
  pt: [
    'Uma foto nítida e próxima da posição frontal funciona melhor.',
    'Prefira uma foto em que o rosto não esteja coberto por cabelo, mãos, máscara, óculos ou acessórios.',
    'Quanto melhor a iluminação e mais simples o fundo, melhor será o reconhecimento.',
    'Fotos do rosto ou da parte superior do corpo são as mais indicadas.',
  ],
  ur: [
    'سامنے کے قریب اور واضح چہرے والی تصویر بہترین رہتی ہے۔',
    'ایسی تصویر بہتر ہے جس میں بال، ہاتھ، ماسک، چشمہ یا اشیا سے چہرہ نہ چھپا ہو۔',
    'روشن روشنی اور سادہ پس منظر سے شناخت بہتر ہوتی ہے۔',
    'اوپری جسم یا چہرے پر مرکوز تصویر سب سے موزوں ہے۔',
  ],
  id: [
    'Foto yang jelas dan mendekati tampak depan memberikan hasil terbaik.',
    'Gunakan foto saat wajah tidak tertutup rambut, tangan, masker, kacamata, atau properti.',
    'Pencahayaan yang terang dan latar belakang sederhana meningkatkan akurasi pengenalan.',
    'Foto wajah atau tubuh bagian atas adalah yang paling sesuai.',
  ],
  de: [
    'Am besten funktioniert ein klares Foto, das möglichst frontal aufgenommen ist.',
    'Empfohlen wird ein Foto, auf dem das Gesicht nicht durch Haare, Hände, Maske, Brille oder Accessoires verdeckt ist.',
    'Je heller das Licht und je schlichter der Hintergrund, desto besser die Erkennung.',
    'Am besten geeignet sind Fotos vom Gesicht oder Oberkörper.',
  ],
  mr: [
    'समोरून जवळचा आणि स्पष्ट चेहरा असलेला फोटो सर्वात चांगला असतो.',
    'केस, हात, मास्क, चष्मा किंवा इतर वस्तूंनी चेहरा झाकलेला नसलेला फोटो वापरा.',
    'प्रकाश चांगला आणि पार्श्वभूमी साधी असेल तर ओळख अधिक चांगली होते.',
    'अपर बॉडी किंवा चेहऱ्यावर लक्ष केंद्रित केलेला फोटो सर्वात योग्य आहे.',
  ],
  te: [
    'సమీప ఫ్రంట్ వ్యూలో స్పష్టంగా కనిపించే ఫోటో ఉత్తమంగా పనిచేస్తుంది.',
    'జుట్టు, చేతులు, మాస్క్, కళ్లజోడు లేదా వస్తువులతో ముఖం కప్పబడని ఫోటోను ఉపయోగించండి.',
    'ప్రకాశం మంచి‌గా ఉండి నేపథ్యం సరళంగా ఉంటే గుర్తింపు మెరుగ్గా ఉంటుంది.',
    'పై భాగం లేదా ముఖం కేంద్రంగా ఉన్న ఫోటోలు అత్యంత అనుకూలం.',
  ],
  tr: [
    'Öne yakın, yüzün net göründüğü bir fotoğraf en iyi sonucu verir.',
    'Yüzün saç, el, maske, gözlük veya aksesuarlarla kapanmadığı bir fotoğraf önerilir.',
    'Işık ne kadar iyi ve arka plan ne kadar sade olursa tanıma o kadar başarılı olur.',
    'Yüz odaklı veya üst beden fotoğrafları en uygunudur.',
  ],
  ta: [
    'முன்புறத்திற்கு அருகிலான தெளிவான முகப் படம் சிறந்தது.',
    'முடி, கை, முககவசம், கண்ணாடி அல்லது பொருட்களால் முகம் மறைக்கப்படாத படத்தைப் பயன்படுத்துங்கள்.',
    'ஒளி பிரகாசமாகவும் பின்னணி எளிமையாகவும் இருந்தால் அடையாளம் சிறப்பாக இருக்கும்.',
    'முகம் அல்லது மேல் உடல் மையப்படுத்திய படங்கள் மிகவும் பொருத்தமானவை.',
  ],
  vi: [
    'Ảnh rõ nét, gần chính diện sẽ cho kết quả tốt nhất.',
    'Nên dùng ảnh mà khuôn mặt không bị che bởi tóc, tay, khẩu trang, kính hoặc phụ kiện.',
    'Ánh sáng càng tốt và nền càng đơn giản thì khả năng nhận diện càng cao.',
    'Ảnh tập trung vào khuôn mặt hoặc nửa thân trên là phù hợp nhất.',
  ],
  it: [
    'Funziona meglio una foto nitida e quasi frontale.',
    'Si consiglia una foto in cui il viso non sia coperto da capelli, mani, maschera, occhiali o accessori.',
    'Più la luce è buona e lo sfondo semplice, migliore sarà il riconoscimento.',
    'Le foto del viso o della parte superiore del corpo sono le più adatte.',
  ],
};

const CLOTH_TIPS: Record<LanguageCode, string[]> = {
  ko: [
    '의상 전체 형태가 잘 보이는 사진이 가장 좋습니다.',
    '옷이 잘리지 않고 배경이 단순한 이미지를 권장합니다.',
    '정면에 가깝고 주름이나 가림이 적은 사진일수록 결과가 좋습니다.',
  ],
  en: [
    'A photo that clearly shows the full clothing shape works best.',
    'Use an image where the outfit is not cropped and the background is simple.',
    'Front-facing clothing photos with fewer wrinkles or obstructions produce better results.',
  ],
  es: [
    'Lo mejor es una foto donde se vea claramente la forma completa de la prenda.',
    'Se recomienda una imagen donde la ropa no esté recortada y el fondo sea simple.',
    'Las fotos casi frontales, con pocas arrugas u obstrucciones, dan mejores resultados.',
  ],
  zh: [
    '能清楚看到整件服装轮廓的照片效果最好。',
    '建议使用服装未被裁切、背景简单的图片。',
    '越接近正面、褶皱和遮挡越少，效果越好。',
  ],
  ja: [
    '服全体の形がはっきり見える写真が最適です。',
    '服が切れておらず、背景がシンプルな画像をおすすめします。',
    '正面に近く、しわや遮りが少ない写真ほど結果が良くなります。',
  ],
  hi: [
    'ऐसी फोटो सबसे अच्छी है जिसमें कपड़ों का पूरा आकार साफ़ दिखे।',
    'ऐसी छवि चुनें जिसमें कपड़ा कटा न हो और पृष्ठभूमि सरल हो।',
    'सामने के करीब और कम सिलवटों या अवरोध वाली तस्वीरें बेहतर परिणाम देती हैं।',
  ],
  fr: [
    'Une photo montrant clairement la forme complète du vêtement est idéale.',
    'Utilisez une image où le vêtement n’est pas coupé et où l’arrière-plan reste simple.',
    'Les photos proches de face, avec peu de plis ou d’obstructions, donnent de meilleurs résultats.',
  ],
  ar: [
    'أفضل صورة هي التي تُظهر شكل القطعة كاملة بوضوح.',
    'يُنصح باستخدام صورة لا تكون فيها الملابس مقصوصة والخلفية بسيطة.',
    'كلما كانت الصورة أقرب للأمام وبها تجاعيد أو عوائق أقل، كانت النتيجة أفضل.',
  ],
  bn: [
    'যে ছবিতে পোশাকের পুরো আকৃতি পরিষ্কার দেখা যায় সেটাই সবচেয়ে ভালো।',
    'পোশাক কাটা নয় এবং ব্যাকগ্রাউন্ড সহজ এমন ছবি ব্যবহার করুন।',
    'সামনের দিকের কাছাকাছি এবং কম ভাঁজ বা বাধা থাকা ছবি ভালো ফল দেয়।',
  ],
  ru: [
    'Лучше всего подходит фото, где хорошо видна вся форма одежды.',
    'Рекомендуется изображение, где одежда не обрезана, а фон простой.',
    'Чем ближе ракурс к фронтальному и чем меньше складок и перекрытий, тем лучше результат.',
  ],
  pt: [
    'O ideal é uma foto que mostre claramente a forma completa da roupa.',
    'Use uma imagem em que a peça não esteja cortada e o fundo seja simples.',
    'Fotos mais frontais, com menos dobras ou obstruções, geram resultados melhores.',
  ],
  ur: [
    'ایسی تصویر بہترین ہے جس میں لباس کی پوری شکل واضح نظر آئے۔',
    'ایسی تصویر استعمال کریں جس میں لباس کٹا ہوا نہ ہو اور پس منظر سادہ ہو۔',
    'سامنے کے قریب اور کم شکنوں یا رکاوٹوں والی تصاویر بہتر نتیجہ دیتی ہیں۔',
  ],
  id: [
    'Foto yang memperlihatkan bentuk pakaian secara utuh akan memberikan hasil terbaik.',
    'Gunakan gambar saat pakaian tidak terpotong dan latar belakangnya sederhana.',
    'Foto pakaian yang mendekati tampak depan dan minim lipatan atau halangan memberikan hasil lebih baik.',
  ],
  de: [
    'Am besten ist ein Foto, auf dem die gesamte Form des Kleidungsstücks klar zu sehen ist.',
    'Verwende ein Bild, auf dem das Kleidungsstück nicht abgeschnitten ist und der Hintergrund schlicht bleibt.',
    'Je frontaler das Bild und je weniger Falten oder Verdeckungen vorhanden sind, desto besser das Ergebnis.',
  ],
  mr: [
    'कपड्याचा पूर्ण आकार स्पष्ट दिसणारा फोटो सर्वात चांगला असतो.',
    'कपडा कापलेला नसलेली आणि पार्श्वभूमी साधी असलेली प्रतिमा वापरा.',
    'समोरच्या जवळचा आणि कमी सुरकुत्या किंवा अडथळे असलेला फोटो चांगला परिणाम देतो.',
  ],
  te: [
    'దుస్తుల మొత్తం ఆకారం స్పష్టంగా కనిపించే ఫోటో ఉత్తమం.',
    'దుస్తులు కట్ కాకుండా ఉండి నేపథ్యం సరళంగా ఉండే చిత్రాన్ని ఉపయోగించండి.',
    'ముందువైపు దగ్గరగా ఉండి మడతలు లేదా అడ్డంకులు తక్కువగా ఉన్న ఫోటోలు మంచి ఫలితాలు ఇస్తాయి.',
  ],
  tr: [
    'Kıyafetin tüm şeklini net gösteren bir fotoğraf en iyisidir.',
    'Kıyafetin kesilmediği ve arka planın sade olduğu bir görsel kullanın.',
    'Öne yakın açıdaki, daha az kırışıklık veya engel içeren fotoğraflar daha iyi sonuç verir.',
  ],
  ta: [
    'உடையின் முழு வடிவமும் தெளிவாகத் தெரியும் படம் சிறந்தது.',
    'உடை வெட்டப்படாமல், பின்னணி எளிமையாக உள்ள படத்தைப் பயன்படுத்தவும்.',
    'முன்புறத்திற்கு அருகில், சுருக்கங்களும் மறைப்புகளும் குறைவாக உள்ள படங்கள் நல்ல முடிவை தரும்.',
  ],
  vi: [
    'Ảnh thể hiện rõ toàn bộ hình dáng trang phục sẽ cho kết quả tốt nhất.',
    'Hãy dùng ảnh mà trang phục không bị cắt và nền đơn giản.',
    'Ảnh gần chính diện, ít nếp nhăn hoặc che khuất sẽ cho kết quả tốt hơn.',
  ],
  it: [
    'Funziona meglio una foto che mostri chiaramente l’intera forma del capo.',
    'Usa un’immagine in cui il capo non sia tagliato e lo sfondo sia semplice.',
    'Le foto quasi frontali, con poche pieghe o ostruzioni, danno risultati migliori.',
  ],
};

const FREE_LIMIT = 3;
const FALLBACK_FUNCTIONS_API_BASE = 'https://asia-northeast3-fitall-ver1.cloudfunctions.net/api';
const SAME_ORIGIN_TRYON_ENDPOINT = '/tryon';
const FALLBACK_FUNCTIONS_TRYON_ENDPOINT = 'https://asia-northeast3-fitall-ver1.cloudfunctions.net/tryon';
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
// ─── 세션 ID (익명 식별자) ────────────────────────────────────
const getSessionId = (): string => {
  let sid = localStorage.getItem('HAMDEVA-sid');
  if (!sid) {
    sid = crypto.randomUUID();
    localStorage.setItem('HAMDEVA-sid', sid);
  }
  return sid;
};

const RAW_API_BASE = import.meta.env.VITE_API_BASE_URL?.trim();
const API_BASE: string =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? (RAW_API_BASE || 'http://127.0.0.1:5001/fitall-ver1/asia-northeast3/api')
    : (!RAW_API_BASE || RAW_API_BASE.startsWith('/')
        ? FALLBACK_FUNCTIONS_API_BASE
        : RAW_API_BASE);

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

const imageSrcToDataUrl = (src: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth || img.width;
      canvas.height = img.naturalHeight || img.height;
      const context = canvas.getContext('2d');

      if (!context) {
        reject(new Error('이미지 변환 컨텍스트를 만들 수 없습니다.'));
        return;
      }

      context.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => reject(new Error('샘플 이미지를 불러오지 못했습니다.'));
    img.decoding = 'async';
    img.src = src;
  });

const ensureDataUrl = async (src: string): Promise<string> => {
  if (src.startsWith('data:')) return src;

  if (!src.startsWith('blob:')) {
    try {
      return await imageSrcToDataUrl(src);
    } catch (error) {
      console.error('[HAMDEVA] sample image conversion failed', { src, error });
    }
  }

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
  const primaryEndpoint =
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      ? `${API_BASE}/tryon`
      : FALLBACK_FUNCTIONS_TRYON_ENDPOINT;
  const fallbackEndpoint =
    primaryEndpoint === FALLBACK_FUNCTIONS_TRYON_ENDPOINT
      ? SAME_ORIGIN_TRYON_ENDPOINT
      : FALLBACK_FUNCTIONS_TRYON_ENDPOINT;

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
      console.warn('[HAMDEVA] tryon route failed, retrying alternate endpoint', {
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
  const personInputRef = useRef<HTMLInputElement>(null);
  const clothInputRef = useRef<HTMLInputElement>(null);
  const [personImage, setPersonImage] = useState<string | null>(null);
  const [clothImage, setClothImage]   = useState<string | null>(null);
  const [personFile, setPersonFile] = useState<File | null>(null);
  const [clothFile, setClothFile] = useState<File | null>(null);
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
  
  const t = uiTranslations[lang];
  const sessionId = getSessionId();
  const fontTheme = LANGUAGE_FONT_THEMES[lang];
  const emptyFaceTips = FACE_TIPS[lang];
  const emptyClothTips = CLOTH_TIPS[lang];

  useEffect(() => { fetchUsage(sessionId).then(setUsageCount); }, [sessionId]);
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('HAMDEVA-dark', String(darkMode));
  }, [darkMode]);
  useEffect(() => {
    setPersonPreviewState(!activePersonImage ? 'idle' : personFile ? 'ready' : 'loading');
  }, [activePersonImage, personFile]);
  useEffect(() => {
    setClothPreviewState(!activeClothImage ? 'idle' : clothFile ? 'ready' : 'loading');
  }, [activeClothImage, clothFile]);
  useEffect(() => {
    setResultPreviewState(resultImage ? 'loading' : 'idle');
  }, [resultImage]);
  useEffect(() => () => {
    if (personImage?.startsWith('blob:')) URL.revokeObjectURL(personImage);
    if (clothImage?.startsWith('blob:')) URL.revokeObjectURL(clothImage);
  }, [personImage, clothImage]);

  const loadPersonUpload = async (file: File) => {
    if (personImage?.startsWith('blob:')) URL.revokeObjectURL(personImage);
    const previewUrl = URL.createObjectURL(file);
    setSelectedSampleUrl(null);
    setPersonFile(file);
    setPersonImage(previewUrl);
    setPersonUploadMessage(null);
    setPersonPreviewState('ready');
  };

  const loadClothUpload = async (file: File) => {
    if (clothImage?.startsWith('blob:')) URL.revokeObjectURL(clothImage);
    const previewUrl = URL.createObjectURL(file);
    setSelectedClothSampleUrl(null);
    setClothFile(file);
    setClothImage(previewUrl);
    setClothUploadMessage(null);
    setClothPreviewState('ready');
  };

  const handleOpenPersonSampleModal = () => setShowSampleModal(true);
  const handleOpenClothSampleModal = () => {
    if (clothSampleOptions.length === 0) {
      alert(t.clothingSamplesPending);
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
        personFile
          ? blobToDataUrl(personFile).then((src) => resizeImage(src, 1280))
          : ensureDataUrl(activePersonImage).then((src) => resizeImage(src, 1280)),
        clothFile
          ? blobToDataUrl(clothFile).then((src) => resizeImage(src, 1280))
          : ensureDataUrl(activeClothImage).then((src) => resizeImage(src, 1280)),
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
            <span className="app-version">{APP_VERSION}</span>
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
                  {t.chooseSample}
                </button>
                <button className="outline-btn" onClick={() => personInputRef.current?.click()}>
                  {t.uploadMyPhoto}
                </button>
                <input
                  id="p-up"
                  ref={personInputRef}
                  type="file"
                  hidden
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  onClick={(e) => { e.currentTarget.value = ''; }}
                  onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) {
                    void loadPersonUpload(f);
                  }
                }}
                />
              </div>

              <div className={`preview-box ${activePersonImage ? 'has-image' : ''}`}>
                {activePersonImage ? (
                  <>
                    {personPreviewState === 'loading' && (
                      <div className="preview-overlay">
                        <span className="spinner"></span>
                        <span>{personUploadMessage || t.loadingImage}</span>
                      </div>
                    )}
                    {personPreviewState === 'error' && (
                      <div className="img-error-msg">{t.imageLoadError}</div>
                    )}
                    <img 
                      src={activePersonImage} 
                      alt="Face" 
                      onLoad={() => {
                        setPersonPreviewState('ready');
                        setPersonUploadMessage(null);
                      }}
                      onError={() => {
                        setPersonUploadMessage(null);
                        setPersonPreviewState('error');
                      }}
                      className={`${personImage ? 'user-uploaded' : 'sample-img'} ${personPreviewState === 'ready' ? 'is-visible' : ''}`}
                    />
                  </>
                ) : (
                  <EmptyPreviewState
                    title={t.facePlaceholderTitle}
                    tips={emptyFaceTips}
                    type="face"
                  />
                )}
                {!personImage && activePersonImage && <div className="sample-badge">SAMPLE</div>}
                {(personImage || selectedSampleUrl) && (
                  <button className="clear-img-btn" onClick={() => {
                    if (personImage?.startsWith('blob:')) URL.revokeObjectURL(personImage);
                    setPersonImage(null);
                    setPersonFile(null);
                    setSelectedSampleUrl(null);
                    setPersonUploadMessage(null);
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
                  {t.chooseClothingSample}
                </button>
                <button className="outline-btn" onClick={() => clothInputRef.current?.click()}>
                  {t.uploadClothing}
                </button>
                <input
                  id="c-up"
                  ref={clothInputRef}
                  type="file"
                  hidden
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  onClick={(e) => { e.currentTarget.value = ''; }}
                  onChange={e => {
                  const f = e.target.files?.[0];
                  if (f) {
                    void loadClothUpload(f);
                  }
                }}
                />
              </div>
              <div className={`preview-box ${activeClothImage ? 'has-image' : ''}`}>
                {activeClothImage ? (
                  <>
                    {clothPreviewState === 'loading' && (
                      <div className="preview-overlay">
                        <span className="spinner"></span>
                        <span>{clothUploadMessage || t.loadingImage}</span>
                      </div>
                    )}
                    {clothPreviewState === 'error' ? (
                      <div className="img-error-msg">{t.imageLoadError}</div>
                    ) : (
                      <img
                        src={activeClothImage}
                        alt="Cloth"
                        className={clothPreviewState === 'ready' ? 'is-visible' : ''}
                        onLoad={() => {
                          setClothPreviewState('ready');
                          setClothUploadMessage(null);
                        }}
                        onError={() => {
                          setClothUploadMessage(null);
                          setClothPreviewState('error');
                        }}
                      />
                    )}
                    {!clothImage && activeClothImage && <div className="sample-badge">SAMPLE</div>}
                    {(clothImage || selectedClothSampleUrl) && (
                      <button className="clear-img-btn" onClick={() => {
                        if (clothImage?.startsWith('blob:')) URL.revokeObjectURL(clothImage);
                        setClothImage(null);
                        setClothFile(null);
                        setSelectedClothSampleUrl(null);
                        setClothUploadMessage(null);
                        setClothPreviewState('idle');
                      }}>&times;</button>
                    )}
                  </>
                ) : (
                  <EmptyPreviewState
                    title={t.clothingPlaceholderTitle}
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
                    <span>{t.renderingResult}</span>
                  </div>
                )}
                {resultPreviewState === 'error' ? (
                  <div className="img-error-msg">{t.resultDisplayError}</div>
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
            if (personImage?.startsWith('blob:')) URL.revokeObjectURL(personImage);
            setSelectedSampleUrl(url);
            setGender(category);
            setPersonImage(null);
            setPersonFile(null);
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
            if (clothImage?.startsWith('blob:')) URL.revokeObjectURL(clothImage);
            setSelectedClothSampleUrl(url);
            setClothImage(null);
            setClothFile(null);
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
