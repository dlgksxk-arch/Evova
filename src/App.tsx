import React, { useState, useRef, useEffect } from 'react';
import './App.css';
import AuthModal from './components/AuthModal';
import ClothSampleModal from './components/ClothSampleModal';
import ContentModal from './components/ContentModal';
import SampleModal from './components/SampleModal';
import { LANGUAGE_OPTIONS, type LanguageCode } from './constants/languages';
import { clothSampleOptions } from './data/clothSamples';
import { getContentLocale, NAV_PAGES, SITE_PAGES, type ModalTab, type SitePage } from './locales';
import { auth, db, firebaseConfigError, googleProvider, isFirebaseConfigured, missingFirebaseEnvKeys } from './firebase';
import type { User } from 'firebase/auth';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth';
import { addDoc, collection, deleteDoc, doc, getDoc, onSnapshot, orderBy, query, runTransaction, serverTimestamp, setDoc, updateDoc, where, type Timestamp } from 'firebase/firestore';
declare const __APP_VERSION__: string;
type ImageLoadState = 'idle' | 'loading' | 'ready' | 'error';
type FontTheme = 'latin' | 'korean' | 'japanese' | 'chinese' | 'arabic' | 'indic';
const APP_VERSION = __APP_VERSION__;
const MASTER_EMAIL = 'dlgksxk@gmail.com';
type AuthMode = 'login' | 'signup';
type UserPlan = 'free';

interface UserProfile {
  email: string;
  plan: UserPlan;
  dailyQuota: number;
  usedToday: number;
  lastUsageDate: string;
  createdAt?: Timestamp | null;
}

interface GenerationRecord {
  id: string;
  uid: string;
  faceImageUrl: string;
  clothImageUrl: string;
  resultImageUrl: string;
  createdAt?: Timestamp | null;
}

interface BbsPostRecord {
  id: string;
  nickname: string;
  content: string;
  tempPassword?: string;
  uid?: string | null;
  deleted?: boolean;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

// ─── 번역 ─────────────────────────────────────────────────────
const translations = {
  ko: {
    navFeatures: '기능 소개', navHowto: '사용 방법', navFaq: 'FAQ',
    heroEyebrow: 'AI 기반 가상 피팅 서비스',
    heroTitle: '입어보지 않아도\n완벽한 나의 스타일',
    heroSub: '단 한 장의 사진으로\nHAMDEVA AI가\n당신에게 가장 어울리는 스타일을\n미리 입혀드립니다',
    heroCta: 'AI 피팅 시작하기',
    featuresTitle: '왜 HAMDEVA인가요?', featuresSub: '빠르고, 정확하고, 누구나 쉽게 사용할 수 있습니다.',
    f1Title: 'AI 가상 피팅', f1Desc: 'HAMDEVA AI가 인물 사진과 의상을 분석하여 실제로 입은 것 같은 자연스러운 합성 이미지를 생성합니다.',
    f2Title: '즉시 결과 확인', f2Desc: '별도의 회원가입 없이 사진 두 장만 업로드하면 수 초 내에 결과 이미지를 확인할 수 있습니다.',
    f3Title: '프라이버시 보호', f3Desc: '모든 이미지 처리는 브라우저에서 이루어지며, 사진이 별도로 저장되거나 공유되지 않습니다.',
    f4Title: '모바일 완벽 지원', f4Desc: '스마트폰, 태블릿, PC 어디서든 동일한 품질로 이용할 수 있습니다.',
    howTitle: '이렇게 사용하세요', howSub: '단 3단계로 나만의 가상 피팅을 경험하세요.',
    h1Step: 'Step 01', h1Title: '얼굴 사진 업로드', h1Desc: '정면을 바라보는 전신 또는 상반신 사진을 업로드하세요. 배경이 단순하고 전체적인 체형이 보이면 결과 품질이 높아집니다.',
    h2Step: 'Step 02', h2Title: '옷 사진 업로드', h2Desc: '입어보고 싶은 의상 사진을 업로드하세요. 단독 제품 컷 또는 모델 착용 사진 모두 가능합니다.',
    h3Step: 'Step 03', h3Title: 'AI 합성 & 저장', h3Desc: 'AI 생성 버튼을 누르면 자동으로 분석 및 합성이 이루어집니다. 결과 이미지는 바로 저장할 수 있습니다.',
    tryTitle: '지금 바로 체험해보세요', trySub: '로그인 후 하루 3회 무료로 사용할 수 있습니다.',
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
    generate: 'AI 피팅 시작하기', generating: 'AI 분석 중... (최대 30초)',
    loadingDetail: 'HAMDEVA AI가 이미지를 분석하고 합성하고 있습니다...',
    alertBoth: '인물 사진과 의상 사진을 모두 업로드해주세요!', alertError: '이미지 생성에 실패했습니다. 다시 시도해주세요.', generationConfigError: '이미지 생성 설정이 아직 완료되지 않았습니다. 잠시 후 다시 시도해주세요.',
    resultTitle: '피팅 결과', download: '이미지 저장하기',
    freeLeft: (n: number) => `오늘 무료 사용 가능 횟수: ${n}회`,
    freeExhausted: '오늘 무료 사용 횟수(3회)를 모두 사용했습니다.',
    payTitle: '무료 횟수 소진',
    payDesc: '오늘의 무료 피팅(3회)을 모두 사용하셨습니다.\n추가 이용을 위해 결제가 필요합니다.',
    payBtn: '결제하고 계속 이용하기',
    payClose: '닫기',
    payPlan1: '일일 이용권', payPlan1Price: '₩990', payPlan1Desc: '오늘 하루 무제한',
    payPlan2: '월정액', payPlan2Price: '₩9,900', payPlan2Desc: '30일 무제한',
    login: '로그인',
    signup: '회원가입',
    googleLogin: 'Google 로그인',
    logout: '로그아웃',
    myPage: '마이페이지',
    emailLabel: '이메일',
    passwordLabel: '비밀번호',
    switchToSignup: '계정이 없나요? 회원가입',
    switchToLogin: '이미 계정이 있나요? 로그인',
    authRequired: '생성을 계속하려면 로그인해 주세요.',
    loginForFree: '로그인 후 하루 3회 무료로 피팅할 수 있습니다.',
    authInvalid: '이메일과 비밀번호를 모두 입력해 주세요.',
    authFailed: '로그인 처리 중 문제가 발생했습니다. 다시 시도해 주세요.',
    suggestionTitleLabel: '제안 제목',
    suggestionContentLabel: '제안 내용',
    suggestionSubmit: '제안 등록하기',
    suggestionLoginRequired: '제안 등록은 로그인 후 사용할 수 있습니다.',
    suggestionSubmitting: '제안을 등록하고 있습니다...',
    suggestionSaved: '제안이 등록되었습니다.',
    suggestionFailed: '제안 등록 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    suggestionPlaceholderTitle: '추가하고 싶은 의상이나 모델 제목',
    suggestionPlaceholderContent: '원하는 샘플 스타일, 국가, 의상 종류를 자유롭게 적어주세요.',
    boardNicknameLabel: '닉네임',
    boardContentLabel: '내용',
    boardTempPasswordLabel: '임시 비밀번호',
    boardNicknamePlaceholder: '게시글에 표시할 닉네임',
    boardContentPlaceholder: '남기고 싶은 의견이나 후기를 작성해 주세요.',
    boardTempPasswordPlaceholder: '수정/삭제할 때 사용할 임시 비밀번호',
    boardSubmit: '게시글 등록하기',
    boardUpdate: '게시글 수정하기',
    boardEdit: '수정',
    boardDelete: '삭제',
    boardCancelEdit: '수정 취소',
    boardSubmitting: '게시글을 등록하고 있습니다...',
    boardInvalid: '닉네임과 내용을 모두 입력해 주세요.',
    boardPasswordRequired: '임시 비밀번호를 입력해 주세요.',
    boardPasswordMismatch: '임시 비밀번호가 일치하지 않습니다.',
    boardSaved: '게시글이 등록되었습니다.',
    boardUpdated: '게시글이 수정되었습니다.',
    boardDeleted: '게시글이 삭제되었습니다.',
    boardFailed: '게시글 등록 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
    boardEmpty: '아직 등록된 게시글이 없습니다.',
    boardMetaAnonymous: '익명 방문자',
    siteManagementTitle: '사이트 관리',
    siteManagementIntro: '서비스 운영 상태와 주요 지표를 한 화면에서 확인할 수 있습니다.',
    siteVersionLabel: '현재 버전',
    siteFirebaseLabel: 'Firebase 상태',
    siteFirebaseReady: '정상 연결',
    siteFirebaseBlocked: '설정 확인 필요',
    siteLoginLabel: '현재 로그인 계정',
    siteBoardCountLabel: '게시판 글 수',
    siteHistoryCountLabel: '내 생성 기록 수',
    siteQuotaLabel: '오늘 남은 무료 횟수',
    remainingDaily: (n: number) => `오늘 남은 생성 횟수: ${n}회`,
    noHistory: '아직 생성된 결과가 없습니다.',
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
    heroCta: 'Start AI Fitting',
    featuresTitle: 'Why HAMDEVA?', featuresSub: 'Fast, accurate, and easy to use for everyone.',
    f1Title: 'AI Virtual Try-On', f1Desc: 'HAMDEVA AI analyzes your photo and clothing to generate a photorealistic composite image.',
    f2Title: 'Instant Results', f2Desc: 'No sign-up needed. Upload two photos and get your result in seconds.',
    f3Title: 'Privacy First', f3Desc: 'Your photos are not stored or shared beyond what is needed to generate your result.',
    f4Title: 'Works Everywhere', f4Desc: 'Fully optimized for smartphones, tablets, and desktop browsers.',
    howTitle: 'How It Works', howSub: 'Three simple steps to your virtual try-on.',
    h1Step: 'Step 01', h1Title: 'Upload Your Photo', h1Desc: 'Upload a front-facing full-body or upper-body photo. A simple background improves result quality.',
    h2Step: 'Step 02', h2Title: 'Upload Clothing', h2Desc: 'Upload the outfit you want to try on. Product shots or model photos both work well.',
    h3Step: 'Step 03', h3Title: 'Generate & Save', h3Desc: 'Hit the Generate button and the result is ready in seconds. Download it right away.',
    tryTitle: 'Try It Now', trySub: 'Log in to get 3 free try-ons per day.',
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
    alertBoth: 'Please upload both a person photo and a clothing photo!', alertError: 'Image generation failed. Please try again.', generationConfigError: 'Image generation is not configured yet. Please try again later.',
    resultTitle: 'Fitting Result', download: 'Save Image',
    freeLeft: (n: number) => `Free uses remaining today: ${n}`,
    freeExhausted: "You've used all 3 free tries for today.",
    payTitle: 'Daily Limit Reached',
    payDesc: "You've used all 3 free fittings for today.\nUpgrade to continue.",
    payBtn: 'Unlock More',
    payClose: 'Close',
    payPlan1: 'Day Pass', payPlan1Price: '$0.99', payPlan1Desc: 'Unlimited for today',
    payPlan2: 'Monthly', payPlan2Price: '$9.99', payPlan2Desc: '30 days unlimited',
    login: 'Log In',
    signup: 'Sign Up',
    googleLogin: 'Continue with Google',
    logout: 'Log Out',
    myPage: 'My Page',
    emailLabel: 'Email',
    passwordLabel: 'Password',
    switchToSignup: "Don't have an account? Sign up",
    switchToLogin: 'Already have an account? Log in',
    authRequired: 'Please log in to continue generation.',
    loginForFree: 'Log in to get 3 free try-ons per day.',
    authInvalid: 'Please enter both email and password.',
    authFailed: 'Authentication failed. Please try again.',
    suggestionTitleLabel: 'Suggestion title',
    suggestionContentLabel: 'Suggestion details',
    suggestionSubmit: 'Submit suggestion',
    suggestionLoginRequired: 'Log in to submit a suggestion.',
    suggestionSubmitting: 'Submitting your suggestion...',
    suggestionSaved: 'Suggestion submitted.',
    suggestionFailed: 'Failed to submit the suggestion. Please try again.',
    suggestionPlaceholderTitle: 'Title for the outfit or model suggestion',
    suggestionPlaceholderContent: 'Tell us which sample outfit, country look, or model style you want added.',
    boardNicknameLabel: 'Nickname',
    boardContentLabel: 'Post content',
    boardTempPasswordLabel: 'Temporary password',
    boardNicknamePlaceholder: 'Nickname to display on the board',
    boardContentPlaceholder: 'Write your feedback, request, or outfit note here.',
    boardTempPasswordPlaceholder: 'Temporary password for future edit or delete',
    boardSubmit: 'Post to board',
    boardUpdate: 'Save changes',
    boardEdit: 'Edit',
    boardDelete: 'Delete',
    boardCancelEdit: 'Cancel edit',
    boardSubmitting: 'Posting your message...',
    boardInvalid: 'Please enter both nickname and content.',
    boardPasswordRequired: 'Please enter the temporary password.',
    boardPasswordMismatch: 'Temporary password does not match.',
    boardSaved: 'Your post was published.',
    boardUpdated: 'Your post was updated.',
    boardDeleted: 'Your post was deleted.',
    boardFailed: 'Failed to publish the post. Please try again.',
    boardEmpty: 'No posts yet.',
    boardMetaAnonymous: 'Anonymous visitor',
    siteManagementTitle: 'Site Management',
    siteManagementIntro: 'Review the current service status and operating metrics in one place.',
    siteVersionLabel: 'Current version',
    siteFirebaseLabel: 'Firebase status',
    siteFirebaseReady: 'Connected',
    siteFirebaseBlocked: 'Needs attention',
    siteLoginLabel: 'Signed-in account',
    siteBoardCountLabel: 'Board posts',
    siteHistoryCountLabel: 'Saved generations',
    siteQuotaLabel: 'Remaining daily free uses',
    remainingDaily: (n: number) => `Remaining daily generations: ${n}`,
    noHistory: 'No saved generations yet.',
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
const SAME_ORIGIN_TRYON_ENDPOINT = '/api/tryon';
const FALLBACK_FUNCTIONS_TRYON_ENDPOINT = 'https://asia-northeast3-fitall-ver1.cloudfunctions.net/api/tryon';
const SAME_ORIGIN_LEGACY_TRYON_ENDPOINT = '/generateTryOn';
const FALLBACK_FUNCTIONS_LEGACY_TRYON_ENDPOINT = 'https://asia-northeast3-fitall-ver1.cloudfunctions.net/generateTryOn';
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
const getTodayKey = (): string => new Date().toISOString().slice(0, 10);

const getFirebaseDisabledMessage = (): string => (
  'Firebase 설정이 누락되어 로그인 기능을 사용할 수 없습니다. 관리자에게 문의하거나 .env 값을 확인해 주세요.'
);

const requireDb = () => {
  if (!db) {
    throw new Error('FIREBASE_NOT_CONFIGURED');
  }
  return db;
};

const normalizeUserProfile = (email: string, data?: Partial<UserProfile>): UserProfile => ({
  email: data?.email || email,
  plan: data?.plan || 'free',
  dailyQuota: typeof data?.dailyQuota === 'number' ? data.dailyQuota : FREE_LIMIT,
  usedToday: typeof data?.usedToday === 'number' ? data.usedToday : 0,
  lastUsageDate: data?.lastUsageDate || getTodayKey(),
  createdAt: data?.createdAt ?? null,
});

const ensureUserProfileDoc = async (user: User): Promise<UserProfile> => {
  const userRef = doc(requireDb(), 'users', user.uid);
  const snapshot = await getDoc(userRef);

  if (!snapshot.exists()) {
    const nextProfile = normalizeUserProfile(user.email || '', {
      email: user.email || '',
      usedToday: 0,
      lastUsageDate: getTodayKey(),
    });
    await setDoc(userRef, {
      ...nextProfile,
      createdAt: serverTimestamp(),
    });
    return nextProfile;
  }

  const currentProfile = normalizeUserProfile(user.email || '', snapshot.data() as Partial<UserProfile>);
  if (currentProfile.email !== user.email) {
    await setDoc(userRef, { email: user.email || currentProfile.email }, { merge: true });
  }
  return currentProfile;
};

const refreshUserQuota = async (user: User): Promise<UserProfile> => {
  const userRef = doc(requireDb(), 'users', user.uid);
  const currentProfile = await ensureUserProfileDoc(user);
  const today = getTodayKey();

  if (currentProfile.lastUsageDate === today) {
    return currentProfile;
  }

  const resetProfile = {
    usedToday: 0,
    lastUsageDate: today,
  };
  await setDoc(userRef, resetProfile, { merge: true });
  return {
    ...currentProfile,
    ...resetProfile,
  };
};

const incrementUserUsage = async (user: User): Promise<UserProfile> => {
  const firestore = requireDb();
  const userRef = doc(firestore, 'users', user.uid);
  const today = getTodayKey();

  await runTransaction(firestore, async (transaction) => {
    const snapshot = await transaction.get(userRef);
    const profile = normalizeUserProfile(user.email || '', snapshot.data() as Partial<UserProfile>);
    const currentUsedToday = profile.lastUsageDate === today ? profile.usedToday : 0;

    if (currentUsedToday >= profile.dailyQuota) {
      throw new Error('LIMIT_EXCEEDED');
    }

    transaction.set(userRef, {
      email: user.email || profile.email,
      plan: profile.plan,
      dailyQuota: profile.dailyQuota,
      usedToday: currentUsedToday + 1,
      lastUsageDate: today,
      createdAt: profile.createdAt ?? serverTimestamp(),
    }, { merge: true });
  });

  return refreshUserQuota(user);
};

const buildAuthErrorMessage = (error: unknown, fallbackMessage: string): string => {
  const errorCode = typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: string }).code)
    : '';

  if (!(error instanceof Error) && !errorCode) {
    return fallbackMessage;
  }

  if (errorCode.includes('auth/invalid-credential') || errorCode.includes('auth/wrong-password')) {
    return '이메일 또는 비밀번호를 다시 확인해 주세요.';
  }
  if (errorCode.includes('auth/email-already-in-use')) {
    return '이미 가입된 이메일입니다.';
  }
  if (errorCode.includes('auth/popup-closed-by-user')) {
    return '로그인 창이 닫혔습니다.';
  }
  if (errorCode.includes('auth/invalid-api-key') || errorCode.includes('auth/api-key-not-valid')) {
    return 'Firebase 설정이 아직 완료되지 않았습니다. 관리자에게 문의해 주세요.';
  }
  if (errorCode.includes('auth/too-many-requests')) {
    return '잠시 후 다시 시도해 주세요.';
  }

  return error instanceof Error ? error.message || fallbackMessage : fallbackMessage;
};

const isFirestorePermissionError = (error: unknown): boolean => {
  const errorCode = typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: string }).code)
    : '';

  return errorCode.includes('permission-denied');
};

const formatTimestampLabel = (value?: Timestamp | null): string => {
  if (!value) {
    return '';
  }

  try {
    return new Intl.DateTimeFormat('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(value.toDate());
  } catch {
    return '';
  }
};

const RAW_API_BASE = import.meta.env.VITE_API_BASE_URL?.trim();
const API_BASE: string =
  window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
    ? (RAW_API_BASE || 'http://127.0.0.1:5001/fitall-ver1/asia-northeast3/api')
    : (!RAW_API_BASE || RAW_API_BASE.startsWith('/')
        ? FALLBACK_FUNCTIONS_API_BASE
        : RAW_API_BASE);

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

const getGenerateErrorMessage = (
  error: unknown,
  t: { alertError: string; generationConfigError: string },
): string => {
  const raw = error instanceof Error ? error.message : '';
  if (
    raw.includes('IMAGE_GENERATION_NOT_CONFIGURED')
    || raw.includes('OPENAI_API_KEY')
    || raw.includes('설정이 아직 완료되지 않았습니다')
    || raw.includes('not configured yet')
  ) {
    return t.generationConfigError;
  }

  return raw ? `${t.alertError}\n\n${raw}` : t.alertError;
};

const isGenerationConfigError = (message: string): boolean =>
  message.includes('IMAGE_GENERATION_NOT_CONFIGURED')
  || message.includes('OPENAI_API_KEY')
  || message.includes('설정이 아직 완료되지 않았습니다')
  || message.includes('not configured yet');

const parseTryOnError = async (res: Response): Promise<Error> => {
  const errBody = await res.json().catch(() => ({})) as { error?: string, message?: string };
  if (errBody.error === 'LIMIT_EXCEEDED') {
    return new Error('LIMIT_EXCEEDED');
  }

  return new Error(errBody.message || errBody.error || `서버 오류 ${res.status}`);
};

const callNanoBanana = async (payload: { sessionId: string, personImage: string, garmentImage: string, bodyProfile?: any }): Promise<string> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);
  const endpoints = [
    SAME_ORIGIN_TRYON_ENDPOINT,
    FALLBACK_FUNCTIONS_TRYON_ENDPOINT,
    SAME_ORIGIN_LEGACY_TRYON_ENDPOINT,
    FALLBACK_FUNCTIONS_LEGACY_TRYON_ENDPOINT,
  ];

  let lastError: Error | null = null;
  try {
    for (const endpoint of endpoints) {
      try {
        console.info('[HAMDEVA] tryon request', { endpoint, method: 'POST' });
        const res = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });
        console.info('[HAMDEVA] tryon response', { endpoint: res.url || endpoint, method: 'POST', status: res.status });

        if (!res.ok) {
          const parsedError = await parseTryOnError(res);
          if (parsedError.message === 'LIMIT_EXCEEDED') {
            throw parsedError;
          }

          lastError = parsedError;
          const shouldRetry =
            res.status === 404
            || res.status === 405
            || isGenerationConfigError(parsedError.message);
          if (shouldRetry && endpoint !== endpoints[endpoints.length - 1]) {
            console.warn('[HAMDEVA] tryon request failed, retrying alternate endpoint', {
              endpoint,
              status: res.status,
              message: parsedError.message,
            });
            continue;
          }

          throw parsedError;
        }

        const data = await res.json() as { success?: boolean, image?: string, mimeType?: string };
        if (!data.image) throw new Error('응답에서 이미지를 찾을 수 없습니다.');
        return normalizeGeneratedImage(data.image, data.mimeType);
      } catch (error) {
        if (error instanceof Error && error.message === 'LIMIT_EXCEEDED') {
          throw error;
        }

        lastError = error instanceof Error ? error : new Error('이미지 생성 요청에 실패했습니다.');
        console.error('[HAMDEVA] tryon endpoint error', { endpoint, error: lastError });
        if (endpoint === endpoints[endpoints.length - 1]) {
          throw lastError;
        }
      }
    }
  } finally {
    clearTimeout(timer);
  }

  throw lastError ?? new Error('이미지 생성 요청에 실패했습니다.');
};

type CountryShowcaseCard = {
  code: string;
  country: string;
  clothing: string;
  description: string;
  image: string;
};

const getCountryShowcaseCards = (
  items: Array<{ code: string; country: string; clothing: string; description: string }>,
): CountryShowcaseCard[] =>
  items
    .map((item) => {
      const matchingSamples = clothSampleOptions.filter((sample) => sample.country === item.code && (sample.category === 'female' || sample.category === 'male'));
      const preferredSample = matchingSamples.find((sample) => sample.category === 'female') ?? matchingSamples[0];
      if (!preferredSample) {
        return null;
      }

      return {
        ...item,
        image: preferredSample.image,
      };
    })
    .filter((item): item is CountryShowcaseCard => item !== null);

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

const createHistoryPreview = (dataUrl: string, maxPx = 480): Promise<string> =>
  resizeImage(dataUrl, maxPx);

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

const getPageFromHash = (hash: string): SitePage => {
  const normalized = hash.replace(/^#/, '');
  return SITE_PAGES.includes(normalized as SitePage) ? normalized as SitePage : 'home';
};

// ─── App ──────────────────────────────────────────────────────
const App: React.FC = () => {
  const SUPPORT_EMAIL = 'dlgksxk@gmail.com';
  const personInputRef = useRef<HTMLInputElement>(null);
  const clothInputRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
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
  const [lang, setLang] = useState<LanguageCode>('ko');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('HAMDEVA-dark') === 'true');
  const [currentPage, setCurrentPage] = useState<SitePage>(() => getPageFromHash(window.location.hash));
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [suggestionForm, setSuggestionForm] = useState({ title: '', content: '' });
  const [suggestionStatus, setSuggestionStatus] = useState<string | null>(null);
  const [suggestionSubmitting, setSuggestionSubmitting] = useState(false);
  const [bbsForm, setBbsForm] = useState({ nickname: '', content: '', tempPassword: '' });
  const [bbsStatus, setBbsStatus] = useState<string | null>(null);
  const [bbsSubmitting, setBbsSubmitting] = useState(false);
  const [bbsPosts, setBbsPosts] = useState<BbsPostRecord[]>([]);
  const [editingBbsPostId, setEditingBbsPostId] = useState<string | null>(null);
  const [appVersion, setAppVersion] = useState(APP_VERSION);
  const [showContentModal, setShowContentModal] = useState(false);
  const [activeContentTab, setActiveContentTab] = useState<ModalTab>('overview');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [historyItems, setHistoryItems] = useState<GenerationRecord[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [authForm, setAuthForm] = useState({ email: '', password: '' });
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
  const t = uiTranslations[lang];
  const contentLocale = getContentLocale(lang);
  const countryShowcaseCards = getCountryShowcaseCards(contentLocale.modal.countries);
  const sessionId = currentUser?.uid || '';
  const fontTheme = LANGUAGE_FONT_THEMES[lang];
  const emptyFaceTips = FACE_TIPS[lang];
  const emptyClothTips = CLOTH_TIPS[lang];
  const firebaseDisabledMessage = firebaseConfigError
    ? `${getFirebaseDisabledMessage()}${missingFirebaseEnvKeys.length > 0 ? ` (${missingFirebaseEnvKeys.join(', ')})` : ''}`
    : null;
  const remainingUserCount = userProfile ? Math.max(0, userProfile.dailyQuota - userProfile.usedToday) : FREE_LIMIT;
  const remainingGenerationCount = remainingUserCount;
  const isMasterUser = currentUser?.email?.toLowerCase() === MASTER_EMAIL;
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('HAMDEVA-dark', String(darkMode));
  }, [darkMode]);
  useEffect(() => {
    let cancelled = false;

    fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' })
      .then((response) => response.ok ? response.json() as Promise<{ version?: string }> : null)
      .then((data) => {
        if (!cancelled && data?.version) {
          setAppVersion(data.version);
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, []);
  useEffect(() => {
    const syncPage = () => setCurrentPage(getPageFromHash(window.location.hash));
    window.addEventListener('hashchange', syncPage);
    window.addEventListener('popstate', syncPage);
    return () => {
      window.removeEventListener('hashchange', syncPage);
      window.removeEventListener('popstate', syncPage);
    };
  }, []);
  useEffect(() => {
    if (!auth) {
      setCurrentUser(null);
      setUserProfile(null);
      setHistoryItems([]);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setUserMenuOpen(false);

      if (!user) {
        setUserProfile(null);
        setHistoryItems([]);
        return;
      }

      try {
        await ensureUserProfileDoc(user);
      } catch (error) {
        console.error('Failed to sync user profile after auth change:', error);
      }
    });

    return () => unsubscribe();
  }, []);
  useEffect(() => {
    if (!db) {
      setBbsPosts([]);
      return;
    }

    const postsQuery = query(collection(db, 'bbsPosts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      setBbsPosts(snapshot.docs.map((postDoc) => ({
        id: postDoc.id,
        ...(postDoc.data() as Omit<BbsPostRecord, 'id'>),
      })).filter((post) => !post.deleted));
    }, (error) => {
      console.error('Failed to load board posts:', error);
      setBbsStatus(t.boardFailed);
    });

    return () => unsubscribe();
  }, [db, t.boardFailed]);
  useEffect(() => {
    if (!currentUser || !db) {
      return;
    }

    const userRef = doc(db, 'users', currentUser.uid);
    const unsubscribeProfile = onSnapshot(userRef, async (snapshot) => {
      if (!snapshot.exists()) {
        const profile = await ensureUserProfileDoc(currentUser);
        setUserProfile(profile);
        return;
      }

      const profile = normalizeUserProfile(currentUser.email || '', snapshot.data() as Partial<UserProfile>);
      if (profile.lastUsageDate !== getTodayKey()) {
        const refreshed = await refreshUserQuota(currentUser);
        setUserProfile(refreshed);
      } else {
        setUserProfile(profile);
      }
    });

    const historyQuery = query(
      collection(db, 'generations'),
      where('uid', '==', currentUser.uid),
      orderBy('createdAt', 'desc'),
    );
    const unsubscribeHistory = onSnapshot(historyQuery, (snapshot) => {
      setHistoryItems(snapshot.docs.map((historyDoc) => ({
        id: historyDoc.id,
        ...(historyDoc.data() as Omit<GenerationRecord, 'id'>),
      })));
    });

    return () => {
      unsubscribeProfile();
      unsubscribeHistory();
    };
  }, [currentUser]);
  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);
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
  useEffect(() => {
    const pageMeta = currentPage === 'home'
      ? {
          title: contentLocale.meta.homeTitle,
          description: contentLocale.meta.homeDescription,
        }
      : contentLocale.pages[currentPage];

    document.title = pageMeta.title;

    let descriptionTag = document.querySelector('meta[name="description"]');
    if (!descriptionTag) {
      descriptionTag = document.createElement('meta');
      descriptionTag.setAttribute('name', 'description');
      document.head.appendChild(descriptionTag);
    }

    descriptionTag.setAttribute('content', pageMeta.description);
  }, [contentLocale, currentPage]);

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
  const navigateToPage = (page: SitePage) => {
    const nextUrl = page === 'home'
      ? `${window.location.pathname}${window.location.search}`
      : `${window.location.pathname}${window.location.search}#${page}`;
    window.history.pushState(null, '', nextUrl);
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const openContentModal = (tab: ModalTab) => {
    setActiveContentTab(tab);
    setShowContentModal(true);
  };
  const scrollToTrySection = () => {
    window.setTimeout(() => {
      document.getElementById('try')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 120);
  };
  const handleHeroCta = () => {
    if (!currentUser) {
      openAuthModal('login');
      return;
    }

    if (currentPage !== 'home') {
      navigateToPage('home');
      scrollToTrySection();
      return;
    }

    scrollToTrySection();
  };
  const openAuthModal = (mode: AuthMode) => {
    if (!isFirebaseConfigured) {
      setAuthMode(mode);
      setAuthError(getFirebaseDisabledMessage());
      setShowAuthModal(true);
      return;
    }
    setAuthMode(mode);
    setAuthError(null);
    setShowAuthModal(true);
  };
  const syncUserProfileAfterAuth = async (user: User) => {
    try {
      const profile = await ensureUserProfileDoc(user);
      setUserProfile(profile);
    } catch (error) {
      if (isFirestorePermissionError(error)) {
        setUserProfile(normalizeUserProfile(user.email || ''));
        return;
      }
      console.error('Failed to sync user profile after login:', error);
    }
  };
  const handleAuthSubmit = async () => {
    if (!auth) {
      setAuthError(getFirebaseDisabledMessage());
      return;
    }
    if (!authForm.email || !authForm.password) {
      setAuthError(t.authInvalid);
      return;
    }

    setAuthSubmitting(true);
    setAuthError(null);
    try {
      let signedInUser: User;
      if (authMode === 'login') {
        const credential = await signInWithEmailAndPassword(auth, authForm.email, authForm.password);
        signedInUser = credential.user;
      } else {
        const credential = await createUserWithEmailAndPassword(auth, authForm.email, authForm.password);
        signedInUser = credential.user;
      }
      setShowAuthModal(false);
      setAuthForm({ email: '', password: '' });
      void syncUserProfileAfterAuth(signedInUser);
    } catch (error) {
      setAuthError(buildAuthErrorMessage(error, t.authFailed));
    } finally {
      setAuthSubmitting(false);
    }
  };
  const handleGoogleLogin = async () => {
    if (!auth || !googleProvider) {
      setAuthError(getFirebaseDisabledMessage());
      return;
    }
    setAuthSubmitting(true);
    setAuthError(null);
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      setShowAuthModal(false);
      setAuthForm({ email: '', password: '' });
      void syncUserProfileAfterAuth(credential.user);
    } catch (error) {
      setAuthError(buildAuthErrorMessage(error, t.authFailed));
    } finally {
      setAuthSubmitting(false);
    }
  };
  const handleLogout = async () => {
    if (!auth) {
      return;
    }
    await signOut(auth);
    if (currentPage === 'mypage') {
      navigateToPage('home');
    }
  };
  const handleContactSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const subject = encodeURIComponent(`HAMDEVA inquiry from ${contactForm.name || 'website visitor'}`);
    const body = encodeURIComponent(
      `Name: ${contactForm.name}\nEmail: ${contactForm.email}\n\nMessage:\n${contactForm.message}`,
    );
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`;
  };
  const handleSuggestionSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!db) {
      setSuggestionStatus(getFirebaseDisabledMessage());
      return;
    }

    if (!currentUser) {
      setSuggestionStatus(t.suggestionLoginRequired);
      openAuthModal('login');
      return;
    }

    if (!suggestionForm.title || !suggestionForm.content) {
      setSuggestionStatus(t.authInvalid);
      return;
    }

    setSuggestionSubmitting(true);
    setSuggestionStatus(t.suggestionSubmitting);
    try {
      await addDoc(collection(db, 'suggestions'), {
        uid: currentUser.uid,
        email: currentUser.email || '',
        title: suggestionForm.title,
        content: suggestionForm.content,
        createdAt: serverTimestamp(),
      });
      setSuggestionForm({ title: '', content: '' });
      setSuggestionStatus(t.suggestionSaved);
    } catch (error) {
      console.error('Failed to submit suggestion:', error);
      setSuggestionStatus(isFirestorePermissionError(error) ? t.suggestionFailed : buildAuthErrorMessage(error, t.suggestionFailed));
    } finally {
      setSuggestionSubmitting(false);
    }
  };

  const resetBbsEditor = () => {
    setEditingBbsPostId(null);
    setBbsForm({ nickname: '', content: '', tempPassword: '' });
  };

  const handleBbsSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!db) {
      setBbsStatus(getFirebaseDisabledMessage());
      return;
    }

    if (!bbsForm.nickname.trim() || !bbsForm.content.trim()) {
      setBbsStatus(t.boardInvalid);
      return;
    }
    if ((!editingBbsPostId || !isMasterUser) && !bbsForm.tempPassword.trim()) {
      setBbsStatus(t.boardPasswordRequired);
      return;
    }

    setBbsSubmitting(true);
    setBbsStatus(t.boardSubmitting);
    try {
      if (editingBbsPostId) {
        const currentPost = bbsPosts.find((post) => post.id === editingBbsPostId);
        if (!currentPost) {
          setBbsStatus(t.boardFailed);
          return;
        }
        if (!isMasterUser && currentPost.tempPassword !== bbsForm.tempPassword.trim()) {
          setBbsStatus(t.boardPasswordMismatch);
          return;
        }

        await updateDoc(doc(db, 'bbsPosts', editingBbsPostId), {
          nickname: bbsForm.nickname.trim(),
          content: bbsForm.content.trim(),
          tempPassword: isMasterUser ? (currentPost.tempPassword || bbsForm.tempPassword.trim()) : bbsForm.tempPassword.trim(),
          updatedAt: serverTimestamp(),
        });
        resetBbsEditor();
        setBbsStatus(t.boardUpdated);
      } else {
        await addDoc(collection(db, 'bbsPosts'), {
          nickname: bbsForm.nickname.trim(),
          content: bbsForm.content.trim(),
          tempPassword: bbsForm.tempPassword.trim(),
          uid: currentUser?.uid || null,
          deleted: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        resetBbsEditor();
        setBbsStatus(t.boardSaved);
      }
    } catch (error) {
      console.error('Failed to submit board post:', error);
      setBbsStatus(isFirestorePermissionError(error) ? t.boardFailed : buildAuthErrorMessage(error, t.boardFailed));
    } finally {
      setBbsSubmitting(false);
    }
  };

  const handleBbsEditStart = (post: BbsPostRecord) => {
    setEditingBbsPostId(post.id);
    setBbsStatus(null);
    setBbsForm({
      nickname: post.nickname,
      content: post.content,
      tempPassword: '',
    });
  };

  const handleBbsDelete = async (post: BbsPostRecord) => {
    if (!db) {
      setBbsStatus(getFirebaseDisabledMessage());
      return;
    }

    const typedPassword = isMasterUser ? post.tempPassword || '' : window.prompt(t.boardTempPasswordLabel) || '';
    if (!isMasterUser && !typedPassword.trim()) {
      setBbsStatus(t.boardPasswordRequired);
      return;
    }
    if (!isMasterUser && typedPassword.trim() !== post.tempPassword) {
      setBbsStatus(t.boardPasswordMismatch);
      return;
    }

    setBbsSubmitting(true);
    try {
      if (isMasterUser) {
        await deleteDoc(doc(db, 'bbsPosts', post.id));
      } else {
        await updateDoc(doc(db, 'bbsPosts', post.id), {
          deleted: true,
          updatedAt: serverTimestamp(),
          tempPassword: typedPassword.trim(),
        });
      }
      if (editingBbsPostId === post.id) {
        resetBbsEditor();
      }
      setBbsStatus(t.boardDeleted);
    } catch (error) {
      console.error('Failed to delete board post:', error);
      setBbsStatus(isFirestorePermissionError(error) ? t.boardFailed : buildAuthErrorMessage(error, t.boardFailed));
    } finally {
      setBbsSubmitting(false);
    }
  };

  const handleGenerate = async () => {
    if (!currentUser) {
      openAuthModal('login');
      return;
    }
    if (!activePersonImage || !activeClothImage) { alert(t.alertBoth); return; }

    const freshProfile = await refreshUserQuota(currentUser);
    setUserProfile(freshProfile);
    if (freshProfile.usedToday >= freshProfile.dailyQuota) { alert(t.freeExhausted); return; }

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

      try {
        const nextProfile = await incrementUserUsage(currentUser);
        setUserProfile(nextProfile);
        const [historyFaceImage, historyClothImage, historyResultImage] = await Promise.all([
          createHistoryPreview(preparedPersonImage, 360),
          createHistoryPreview(preparedClothImage, 360),
          createHistoryPreview(result, 720),
        ]);

        await addDoc(collection(requireDb(), 'generations'), {
          uid: currentUser.uid,
          faceImageUrl: historyFaceImage,
          clothImageUrl: historyClothImage,
          resultImageUrl: historyResultImage,
          createdAt: serverTimestamp(),
        });
      } catch (error) {
        if (error instanceof Error && error.message === 'LIMIT_EXCEEDED') {
          alert(t.freeExhausted);
          setIsGenerating(false);
          return;
        }
        throw error;
      }

      setCached(cacheKey, result);
      setResultImage(result);
      setTimeout(() => document.getElementById('result-area')?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      alert(getGenerateErrorMessage(err, t));
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className={`app-root ${darkMode ? 'dark' : ''} font-theme-${fontTheme}`}>
      <nav className="landing-nav">
        <div className="nav-content">
          <div className="nav-brand">
            <button className="nav-logo nav-logo-button" onClick={() => navigateToPage('home')} type="button">HAM<span>DEVA</span></button>
            <span className="app-version">{appVersion}</span>
          </div>
          <div className="nav-links">
            {NAV_PAGES.map((page) => (
              <button
                key={page}
                className={`nav-link ${currentPage === page ? 'active' : ''}`}
                onClick={() => navigateToPage(page)}
                type="button"
              >
                {contentLocale.nav[page]}
              </button>
            ))}
          </div>
          <div className="nav-right">
            {currentUser ? (
              <div className="user-menu" ref={userMenuRef}>
                <button className="lang-dropdown-trigger user-menu-trigger" onClick={() => setUserMenuOpen((prev) => !prev)} type="button">
                  <span>{currentUser.email?.split('@')[0] || t.myPage}</span>
                </button>
                {userMenuOpen && (
                  <div className="user-menu-dropdown">
                    <button className="lang-option" onClick={() => { navigateToPage('mypage'); setUserMenuOpen(false); }} type="button">
                      {t.myPage}
                    </button>
                    <button className="lang-option" onClick={() => { navigateToPage('site-management'); setUserMenuOpen(false); }} type="button">
                      {contentLocale.nav['site-management']}
                    </button>
                    <button className="lang-option" onClick={() => { void handleLogout(); setUserMenuOpen(false); }} type="button">
                      {t.logout}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                className="outline-btn auth-nav-btn"
                disabled={!isFirebaseConfigured}
                onClick={() => openAuthModal('login')}
                title={firebaseDisabledMessage || undefined}
                type="button"
              >
                {t.login}
              </button>
            )}
            <LangDropdown lang={lang} onChange={setLang} />
            <button className="dark-toggle" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? '☀️' : '🌙'}
            </button>
          </div>
        </div>
      </nav>

      {firebaseDisabledMessage && (
        <div className="config-banner" role="alert">
          <div className="section-inner">
            <strong>Firebase 설정 누락</strong>
            <p>{firebaseDisabledMessage}</p>
          </div>
        </div>
      )}

      <section className="hero-section">
        <video
          className="bg-video"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="/mainpage/hamdeva_bg_video_v2.mp4" type="video/mp4" />
        </video>
        <div className="hero-content">
          {currentPage === 'home' ? (
            <>
              <div className="hero-eyebrow">{contentLocale.hero.eyebrow}</div>
              <h1 className="hero-title">{contentLocale.hero.title}</h1>
              <p className="hero-sub">{contentLocale.hero.sub}</p>
              <button className="generate-btn hero-cta-btn" onClick={handleHeroCta} type="button">
                {t.heroCta}
              </button>
            </>
          ) : (
            <>
              <div className="hero-eyebrow">{contentLocale.hero.pageEyebrow}</div>
              <h1 className="hero-title page-title">{contentLocale.pages[currentPage].title}</h1>
              <p className="hero-sub">{contentLocale.pages[currentPage].description}</p>
            </>
          )}
        </div>
      </section>

      {currentPage === 'home' ? (
        <>
          <section className="section editorial-section">
            <div className="section-inner">
              <div className="compact-card-grid">
                {contentLocale.home.cards.map((card) => (
                  <article key={card.id} className="compact-info-card">
                    <h2>{card.title}</h2>
                    <p>{card.description}</p>
                    <button className="text-link-btn" onClick={() => openContentModal(card.id as ModalTab)} type="button">
                      {card.button}
                    </button>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section id="try" className="section try-section">
            <div className="section-inner">
              <div className="usage-bar">
                {currentUser ? t.remainingDaily(remainingGenerationCount) : t.loginForFree}
              </div>

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
                <button
                  className="generate-btn"
                  onClick={handleGenerate}
                  disabled={isGenerating || (Boolean(currentUser) && (!activePersonImage || !activeClothImage))}
                >
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

          <section className="section editorial-section">
            <div className="section-inner">
              <article className="content-card content-card-wide suggestion-board-card">
                <div className="suggestion-board-copy">
                  <h2>{contentLocale.home.suggestionBoardTitle}</h2>
                  <p>{contentLocale.home.suggestionBoardDescription}</p>
                </div>
                <form className="suggestion-form" onSubmit={handleSuggestionSubmit}>
                  <input
                    placeholder={t.suggestionPlaceholderTitle}
                    type="text"
                    value={suggestionForm.title}
                    onChange={(event) => setSuggestionForm((prev) => ({ ...prev, title: event.target.value }))}
                  />
                  <textarea
                    placeholder={t.suggestionPlaceholderContent}
                    rows={4}
                    value={suggestionForm.content}
                    onChange={(event) => setSuggestionForm((prev) => ({ ...prev, content: event.target.value }))}
                  />
                  <div className="suggestion-form-footer">
                    <div className="suggestion-chip-list">
                      {contentLocale.home.suggestionBoardItems.map((item) => (
                        <span key={item} className="suggestion-chip">{item}</span>
                      ))}
                    </div>
                    <button className="generate-btn suggestion-submit-btn" disabled={suggestionSubmitting} type="submit">
                      {suggestionSubmitting ? t.suggestionSubmitting : t.suggestionSubmit}
                    </button>
                  </div>
                  {suggestionStatus && <p className="suggestion-status">{suggestionStatus}</p>}
                </form>
              </article>
            </div>
          </section>
        </>
      ) : (
        <main className="section page-shell">
          <div className="section-inner page-layout">
            {contentLocale.pages[currentPage].sections?.map((section) => (
              <article key={section.heading} className="page-article">
                <h2>{section.heading}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </article>
            ))}

            {(currentPage === 'traditional-clothing' || currentPage === 'countries') && (
              <div className="country-card-grid page-country-grid">
                {countryShowcaseCards.map((item) => (
                  <article key={`${item.code}-${item.clothing}`} className="country-card country-card-visual">
                    <div className="country-card-thumb">
                      <img src={item.image} alt={`${item.country} ${item.clothing}`} loading="lazy" />
                    </div>
                    <span className="country-card-name">{item.country}</span>
                    <h4>{item.clothing}</h4>
                    <p>{item.description}</p>
                  </article>
                ))}
              </div>
            )}

            {currentPage === 'board' && (
              <div className="bbs-layout">
                <article className="page-article">
                  <h2>{contentLocale.pages.board.title}</h2>
                  <p>{contentLocale.pages.board.description}</p>
                  <form className="suggestion-form bbs-form" onSubmit={handleBbsSubmit}>
                    <label>
                      {t.boardNicknameLabel}
                      <input
                        placeholder={t.boardNicknamePlaceholder}
                        type="text"
                        value={bbsForm.nickname}
                        onChange={(event) => setBbsForm((prev) => ({ ...prev, nickname: event.target.value }))}
                      />
                    </label>
                    <label>
                      {t.boardContentLabel}
                      <textarea
                        placeholder={t.boardContentPlaceholder}
                        rows={5}
                        value={bbsForm.content}
                        onChange={(event) => setBbsForm((prev) => ({ ...prev, content: event.target.value }))}
                      />
                    </label>
                    <label>
                      {t.boardTempPasswordLabel}
                      <input
                        placeholder={t.boardTempPasswordPlaceholder}
                        type="password"
                        value={bbsForm.tempPassword}
                        onChange={(event) => setBbsForm((prev) => ({ ...prev, tempPassword: event.target.value }))}
                      />
                    </label>
                    <div className="bbs-form-footer">
                      <button className="generate-btn suggestion-submit-btn" disabled={bbsSubmitting} type="submit">
                        {bbsSubmitting ? t.boardSubmitting : editingBbsPostId ? t.boardUpdate : t.boardSubmit}
                      </button>
                      {editingBbsPostId && (
                        <button className="outline-btn auth-inline-btn" onClick={resetBbsEditor} type="button">
                          {t.boardCancelEdit}
                        </button>
                      )}
                      {bbsStatus && <p className="suggestion-status">{bbsStatus}</p>}
                    </div>
                  </form>
                </article>

                <div className="bbs-post-list">
                  {bbsPosts.length > 0 ? bbsPosts.map((post) => (
                    <article key={post.id} className="page-article bbs-post-card">
                      <div className="bbs-post-header">
                        <div className="bbs-post-meta">
                          <strong>{post.nickname || t.boardMetaAnonymous}</strong>
                          {post.createdAt && <span>{formatTimestampLabel(post.updatedAt || post.createdAt)}</span>}
                        </div>
                        <div className="bbs-post-actions">
                          <button
                            className="bbs-icon-btn"
                            onClick={() => handleBbsEditStart(post)}
                            title={t.boardEdit}
                            type="button"
                          >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M4 20h4l10-10-4-4L4 16v4zm12.7-12.3 1.6-1.6a1 1 0 0 1 1.4 0l1.3 1.3a1 1 0 0 1 0 1.4L19.4 10l-2.7-2.3z" fill="currentColor" />
                            </svg>
                          </button>
                          <button
                            className="bbs-icon-btn danger"
                            disabled={bbsSubmitting}
                            onClick={() => { void handleBbsDelete(post); }}
                            title={t.boardDelete}
                            type="button"
                          >
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v8h-2V9zm4 0h2v8h-2V9zM7 9h2v8H7V9z" fill="currentColor" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <p>{post.content}</p>
                    </article>
                  )) : (
                    <article className="page-article">
                      <p>{t.boardEmpty}</p>
                    </article>
                  )}
                </div>
              </div>
            )}

            {currentPage === 'site-management' && (
              <div className="management-grid">
                <article className="page-article">
                  <h2>{t.siteManagementTitle}</h2>
                  <p>{t.siteManagementIntro}</p>
                </article>
                <article className="page-article">
                  <h3>{t.siteVersionLabel}</h3>
                  <p>{appVersion}</p>
                </article>
                <article className="page-article">
                  <h3>{t.siteFirebaseLabel}</h3>
                  <p>{isFirebaseConfigured ? t.siteFirebaseReady : t.siteFirebaseBlocked}</p>
                </article>
                <article className="page-article">
                  <h3>{t.siteLoginLabel}</h3>
                  <p>{currentUser?.email || t.boardMetaAnonymous}</p>
                </article>
                <article className="page-article">
                  <h3>{t.siteBoardCountLabel}</h3>
                  <p>{bbsPosts.length}</p>
                </article>
                <article className="page-article">
                  <h3>{t.siteHistoryCountLabel}</h3>
                  <p>{historyItems.length}</p>
                </article>
                <article className="page-article">
                  <h3>{t.siteQuotaLabel}</h3>
                  <p>{remainingGenerationCount}</p>
                </article>
              </div>
            )}

            {currentPage === 'contact' && (
              <div className="contact-layout">
                <article className="page-article">
                  <h2>{contentLocale.contact.supportTitle}</h2>
                  <p>{contentLocale.contact.supportBody} <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>.</p>
                  <p>{contentLocale.contact.supportFootnote}</p>
                </article>
                <form className="contact-form" onSubmit={handleContactSubmit}>
                  <h2>{contentLocale.contact.formTitle}</h2>
                  <div className="contact-recipient-box">
                    <span>{contentLocale.contact.recipientLabel}</span>
                    <strong>{SUPPORT_EMAIL}</strong>
                  </div>
                  <label>
                    {contentLocale.contact.name}
                    <input
                      value={contactForm.name}
                      onChange={(event) => setContactForm((prev) => ({ ...prev, name: event.target.value }))}
                      type="text"
                      required
                    />
                  </label>
                  <label>
                    {contentLocale.contact.email}
                    <input
                      value={contactForm.email}
                      onChange={(event) => setContactForm((prev) => ({ ...prev, email: event.target.value }))}
                      type="email"
                      required
                    />
                  </label>
                  <label>
                    {contentLocale.contact.message}
                    <textarea
                      value={contactForm.message}
                      onChange={(event) => setContactForm((prev) => ({ ...prev, message: event.target.value }))}
                      rows={6}
                      required
                    />
                  </label>
                  <button className="generate-btn contact-submit" type="submit">{contentLocale.contact.send}</button>
                </form>
              </div>
            )}
            {currentPage === 'mypage' && (
              <div className="mypage-layout">
                <article className="page-article">
                  <h2>{t.myPage}</h2>
                  {currentUser && userProfile ? (
                    <div className="mypage-summary">
                      <p><strong>{t.emailLabel}</strong> {currentUser.email}</p>
                      <p><strong>{t.remainingDaily(remainingUserCount)}</strong></p>
                    </div>
                  ) : (
                    <div className="mypage-empty">
                      <p>{firebaseDisabledMessage || t.authRequired}</p>
                      {isFirebaseConfigured && (
                        <button className="generate-btn auth-inline-btn" onClick={() => openAuthModal('login')} type="button">
                          {t.login}
                        </button>
                      )}
                    </div>
                  )}
                </article>
                {currentUser && (
                  <div className="history-grid">
                    {historyItems.length > 0 ? historyItems.map((item) => (
                      <article key={item.id} className="history-card">
                        <div className="history-card-row">
                          <img src={item.faceImageUrl} alt="Face history" />
                          <img src={item.clothImageUrl} alt="Cloth history" />
                        </div>
                        <div className="history-result-box">
                          <img src={item.resultImageUrl} alt="Generated result history" />
                        </div>
                      </article>
                    )) : (
                      <article className="page-article">
                        <p>{t.noHistory}</p>
                      </article>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      )}

      <footer className="site-footer">
        <p className="footer-copy">{t.footer}</p>
        <div className="footer-links">
          {NAV_PAGES.map((page) => (
            <button key={page} className="footer-link-btn" onClick={() => navigateToPage(page)} type="button">
              {contentLocale.nav[page]}
            </button>
          ))}
        </div>
      </footer>

      {showContentModal && (
        <ContentModal
          activeTab={activeContentTab}
          countryCards={countryShowcaseCards}
          locale={contentLocale}
          onClose={() => setShowContentModal(false)}
          onTabChange={setActiveContentTab}
        />
      )}

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

      {showAuthModal && (
        <AuthModal
          copy={{
            loginTitle: t.login,
            signupTitle: t.signup,
            emailLabel: t.emailLabel,
            passwordLabel: t.passwordLabel,
            loginButton: t.login,
            signupButton: t.signup,
            googleButton: t.googleLogin,
            switchToSignup: t.switchToSignup,
            switchToLogin: t.switchToLogin,
          }}
          email={authForm.email}
          error={authError}
          isSubmitting={authSubmitting}
          mode={authMode}
          password={authForm.password}
          onClose={() => setShowAuthModal(false)}
          onEmailChange={(value) => setAuthForm((prev) => ({ ...prev, email: value }))}
          onGoogleLogin={() => { void handleGoogleLogin(); }}
          onPasswordChange={(value) => setAuthForm((prev) => ({ ...prev, password: value }))}
          onSubmit={() => { void handleAuthSubmit(); }}
          onSwitchMode={(mode) => { setAuthMode(mode); setAuthError(null); }}
        />
      )}
    </div>
  );
};

export default App;
