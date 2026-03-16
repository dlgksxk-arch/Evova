import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './App.css';
import AuthModal from './components/AuthModal';
import ClothSampleModal from './components/ClothSampleModal';
import ContentModal from './components/ContentModal';
import SampleModal from './components/SampleModal';
import { LANGUAGE_CODES, LANGUAGE_OPTIONS, type LanguageCode } from './constants/languages';
import { clothSampleOptions } from './data/clothSamples';
import { getContentLocale, NAV_PAGES, SITE_PAGES, type ModalTab, type SitePage } from './locales';
import { auth, db, firebaseConfigError, googleProvider, isFirebaseConfigured, missingFirebaseEnvKeys } from './firebase';
import type { User } from 'firebase/auth';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth';
import { addDoc, collection, deleteDoc, doc, getCountFromServer, getDoc, getDocs, limit, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where, type Timestamp } from 'firebase/firestore';
declare const __APP_VERSION__: string;
type KakaoSdk = {
  isInitialized?: () => boolean;
  init?: (key: string) => void;
  Share?: {
    sendDefault: (payload: Record<string, unknown>) => void;
  };
};

declare global {
  interface Window {
    Kakao?: KakaoSdk;
  }
}

type ImageLoadState = 'idle' | 'loading' | 'ready' | 'error';
type FontTheme = 'latin' | 'korean' | 'japanese' | 'chinese' | 'arabic' | 'indic';
const APP_VERSION = __APP_VERSION__;
const ADMIN_EMAILS = new Set(['dlgksxk@gmail.com']);
const DEFAULT_GENERATION_ESTIMATE_MS = 30_000;
const MIN_GENERATION_ESTIMATE_MS = 12_000;
const MAX_GENERATION_ESTIMATE_MS = 45_000;
const GENERATION_DURATION_CACHE_KEY = 'HAMDEVA-generation-durations';
const VIDEO_GENERATION_COST = 1000;
const SAME_ORIGIN_CLASSIFY_SUBJECT_ENDPOINT = '/api/classify-subject';
const SAME_ORIGIN_VIDEO_ENDPOINT = '/api/video';
const SAME_ORIGIN_VIDEO_STATUS_ENDPOINT = '/api/video-status';
const SUBJECT_TYPES = ['human', 'dog', 'cat'] as const;
const KAKAO_SDK_URL = 'https://developers.kakao.com/sdk/js/kakao.min.js';
const KAKAO_JS_KEY = (import.meta.env.VITE_KAKAO_JS_KEY as string | undefined)?.trim();
type SubjectType = typeof SUBJECT_TYPES[number];
const OPENAI_IMAGE_TOKEN_PRICING = {
  'gpt-image-1': { inputPer1M: 10, outputPer1M: 40 },
  'gpt-image-1-mini': { inputPer1M: 2.5, outputPer1M: 8 },
  'gpt-image-1.5': { inputPer1M: 8, outputPer1M: 32 },
  'chatgpt-image-latest': { inputPer1M: 8, outputPer1M: 32 },
} as const;
const OPENAI_IMAGE_UNIT_PRICING = {
  'gpt-image-1': {
    low: { '1024x1024': 0.011, '1024x1536': 0.016, '1536x1024': 0.016 },
    medium: { '1024x1024': 0.042, '1024x1536': 0.063, '1536x1024': 0.063 },
    high: { '1024x1024': 0.167, '1024x1536': 0.25, '1536x1024': 0.25 },
  },
  'gpt-image-1-mini': {
    low: { '1024x1024': 0.005, '1024x1536': 0.006, '1536x1024': 0.006 },
    medium: { '1024x1024': 0.011, '1024x1536': 0.015, '1536x1024': 0.015 },
    high: { '1024x1024': 0.036, '1024x1536': 0.052, '1536x1024': 0.052 },
  },
  'gpt-image-1.5': {
    low: { '1024x1024': 0.009, '1024x1536': 0.013, '1536x1024': 0.013 },
    medium: { '1024x1024': 0.034, '1024x1536': 0.05, '1536x1024': 0.05 },
    high: { '1024x1024': 0.133, '1024x1536': 0.2, '1536x1024': 0.2 },
  },
  'chatgpt-image-latest': {
    low: { '1024x1024': 0.009, '1024x1536': 0.013, '1536x1024': 0.013 },
    medium: { '1024x1024': 0.034, '1024x1536': 0.05, '1536x1024': 0.05 },
    high: { '1024x1024': 0.133, '1024x1536': 0.2, '1536x1024': 0.2 },
  },
} as const;
type AuthMode = 'login' | 'signup';
type SubscriptionPlan = 'free' | 'basic' | 'pro';
type UserRole = 'user' | 'admin';

interface UserProfile {
  email: string;
  credits: number;
  isSubscribed: boolean;
  subscriptionPlan: SubscriptionPlan;
  role: UserRole;
  createdAt?: Timestamp | null;
  lastDailyRewardAt?: Timestamp | null;
  lastLoginAt?: Timestamp | null;
}

interface CreditBootstrapResponse {
  success?: boolean;
  profile?: {
    credits: number;
    isSubscribed: boolean;
    subscriptionPlan: SubscriptionPlan;
    role: UserRole;
  };
  signupBonusGranted?: number;
  dailyRewardGranted?: number;
  subscriptionBonusGranted?: number;
  generationCost?: number;
  videoGenerationCost?: number;
}

interface AdminUserRecord {
  id: string;
  email: string;
  credits: number;
  subscriptionPlan: SubscriptionPlan;
  role: UserRole;
  createdAt?: Timestamp | null;
}

interface CreditLogRecord {
  id: string;
  uid: string;
  type: string;
  amount: number;
  balanceAfter: number;
  note?: string;
  email?: string;
  createdAt?: Timestamp | null;
}

interface GenerationRequestRecord {
  id: string;
  uid: string;
  email?: string;
  requestId: string;
  type?: 'image_generation' | 'video_generation';
  subjectType?: SubjectType;
  sourceResultId?: string | null;
  openaiVideoId?: string;
  model?: string;
  quality?: string;
  size?: string;
  durationSeconds?: number;
  estimatedCost?: number | null;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
  status?: string;
  success?: boolean;
  refunded?: boolean;
  errorMessage?: string;
  createdAt?: Timestamp | null;
}

interface VideoGenerationResponse {
  success?: boolean;
  requestId?: string;
  openaiVideoId?: string;
  status?: string;
  creditsRemaining?: number;
  estimatedCost?: number;
  subjectType?: SubjectType;
  refunded?: boolean;
}

interface GenerationRecord {
  id: string;
  uid: string;
  faceImageUrl: string;
  clothImageUrl: string;
  resultImageUrl: string;
  createdAt?: Timestamp | null;
}

interface PublicResultRecord {
  id: string;
  uid?: string | null;
  resultImageUrl: string;
  language?: LanguageCode;
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
    tryTitle: '지금 바로 체험해보세요', trySub: '회원가입 시 300 크레딧, 매일 로그인 시 300 크레딧이 지급됩니다.',
    step1Label: 'Step 1', step1Title: '인물 사진 등록', step1Desc: '정면을 바라보는 전신 또는 상반신 사진을 드래그하거나 클릭하여 업로드하세요',
    step2Label: 'Step 2', step2Title: '의상 사진 등록', step2Desc: '입어보고 싶은 옷 사진을 드래그하거나 클릭하여 업로드하세요',
    faceCopyrightNotice: '인물사진에는 유명인을 저작권 없이 사용해서는 안됩니다.',
    clothingSafetyNotice: '의상사진 등록 시 과도한 노출이나 선정적인 이미지는 업로드하지 마세요.',
    resultPrivacyNotice: '본 이미지는 저장되지 않으며, 결과 확인과 다운로드 용도로만 일시적으로 처리됩니다.',
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
    share: '공유하기',
    realGenerationCta: '실제로 생성하기',
    shareSectionTitle: '공유하기',
    shareHelperText: '친구들과 결과를 공유해보세요',
    shareKakao: '카카오 공유',
    shareLine: 'LINE 공유',
    shareXShort: 'X 공유',
    shareFacebookShort: '페이스북 공유',
    downloadImage: '이미지 다운로드',
    saveForInstagram: '인스타용 저장',
    instagramHelperText: '이미지를 저장한 뒤 인스타그램에 업로드해보세요',
    linkCopied: '링크가 복사되었습니다',
    linkCopyFailed: '링크 복사에 실패했습니다',
    imageNotReady: '이미지가 준비되지 않았습니다',
    noResultToShare: '공유할 결과가 없습니다',
    copyLink: '링크 복사',
    copied: '링크가 복사되었습니다.',
    copyFailed: '링크 복사에 실패했습니다.',
    tryAnotherOutfit: '다른 의상 입혀보기',
    randomOutfit: '랜덤 의상',
    resultNotFound: '공유된 결과를 찾을 수 없습니다.',
    shareOnX: 'X에 공유',
    shareOnFacebook: 'Facebook에 공유',
    shareLinkUnavailable: '공유 링크를 준비하는 중입니다.',
    sharedResultTitle: '공유된 피팅 결과',
    sharedResultDescription: 'HAMDEVA에서 생성된 결과 이미지를 확인하고 저장하거나 다시 체험해 보세요.',
    loadingSharedResult: '공유 결과를 불러오는 중입니다...',
    freeLeft: (n: number) => `현재 보유 크레딧: ${n}`,
    freeExhausted: '크레딧이 부족합니다.',
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
    loginForFree: '회원가입 시 300 크레딧, 매일 로그인 시 300 크레딧이 지급됩니다.',
    credits: '크레딧',
    currentCredits: (n: number) => `현재 보유 크레딧: ${n}`,
    generationCost: '1회 생성 = 100 크레딧',
    generationCostDetailed: (n: number) => `1회 생성 = ${n} 크레딧`,
    signUpGetCredits: '회원가입하고 300 크레딧 받기',
    dailyLoginCredits: '매일 로그인하면 300 크레딧 지급',
    subscriptionCreditBonus: '구독 시 매일 추가 크레딧 지급',
    notEnoughCredits: '크레딧이 부족합니다.',
    refundedAfterFailure: '이미지 생성에 실패하여 100 크레딧이 환불되었습니다.',
    duplicateRequestBlocked: '이미 생성 요청이 처리 중입니다. 잠시 후 다시 시도해 주세요.',
    todayDailyRewardGranted: '오늘의 300 크레딧이 지급되었습니다.',
    todayDailyRewardAlreadyClaimed: '오늘은 이미 일일 크레딧을 받았습니다.',
    subscriptionBonusGranted: (n: number) => `구독 보너스 ${n} 크레딧이 추가 지급되었습니다.`,
    signupBonusGranted: (n: number) => `회원가입 보너스 ${n} 크레딧이 지급되었습니다.`,
    viewSubscription: '구독 보기',
    creditCheck: '크레딧 확인',
    subscriptionPlanLabel: '구독 플랜',
    subscriptionPlanValue: (plan: string) => plan === 'pro' ? 'PRO' : plan === 'basic' ? 'BASIC' : 'FREE',
    siteCreditsLabel: '현재 크레딧',
    siteCreditCostLabel: '생성 비용',
    authSignupCreditsHint: '회원가입 시 300 크레딧 지급',
    adminNav: '관리',
    adminTitle: '관리자 페이지',
    adminSubtitle: '운영 지표와 최근 활동을 한 화면에서 확인할 수 있습니다.',
    adminAccessDenied: '관리자 권한이 필요합니다.',
    adminDashboard: '대시보드 요약',
    adminUsersSection: '최근 사용자',
    adminBoardSection: '최근 게시글',
    adminGenerationSection: '최근 생성 활동',
    adminCreditsSection: '최근 크레딧 로그',
    adminSystemSection: '시스템 상태',
    adminTotalUsers: '총 사용자 수',
    adminTotalPosts: '총 게시글 수',
    adminTotalGenerations: '총 생성 기록 수',
    adminTotalSharedResults: '총 공유 결과 수',
    adminTodayGenerations: '오늘 생성 수',
    adminTodayEstimatedCost: '오늘 예상 비용',
    adminTotalEstimatedCost: '총 예상 비용',
    adminRecent7DaysEstimatedCost: '최근 7일 예상 비용',
    adminRecentUsers: '최근 가입 사용자',
    adminRecentPosts: '최근 게시글',
    adminRecentGenerations: '최근 생성 요청',
    adminRecentCredits: '최근 크레딧 로그',
    adminRole: '권한',
    adminJoinedAt: '가입일',
    adminCreatedAt: '생성일',
    adminCreditsColumn: '크레딧',
    adminStatus: '상태',
    adminResultId: '요청 ID',
    adminEstimatedCost: '예상 비용',
    adminModel: '모델',
    adminNoData: '표시할 데이터가 없습니다.',
    adminDeletePost: '게시글 삭제',
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
    siteQuotaLabel: '현재 크레딧',
    remainingDaily: (n: number) => `현재 보유 크레딧: ${n}`,
    noHistory: '아직 생성된 결과가 없습니다.',
    faqTitle: '자주 묻는 질문', faqSub: 'HAMDEVA 사용에 대한 궁금증을 해결해 드립니다.',
    faqs: [
      { q: '크레딧은 어떻게 지급되나요?', a: '회원가입 시 300 크레딧이 지급되고, 이후에는 매일 로그인 시 300 크레딧이 추가됩니다. 구독자는 플랜에 따라 추가 일일 크레딧을 받을 수 있습니다.' },
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
    tryTitle: 'Try It Now', trySub: 'Get 300 credits on sign-up and 300 more credits every day you log in.',
    step1Label: 'Step 1', step1Title: 'Upload Person Photo', step1Desc: 'Drag or click to upload a front-facing photo',
    step2Label: 'Step 2', step2Title: 'Upload Clothing Photo', step2Desc: 'Drag or click to upload the outfit you want to try on',
    faceCopyrightNotice: 'Do not use celebrity photos without permission or rights.',
    clothingSafetyNotice: 'Do not upload overly revealing or sexually explicit clothing images.',
    resultPrivacyNotice: 'This image is not stored and is processed temporarily only for preview and download.',
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
    share: 'Share',
    realGenerationCta: 'Generate for Real',
    shareSectionTitle: 'Share',
    shareHelperText: 'Share your result with friends',
    shareKakao: 'Share on Kakao',
    shareLine: 'Share on LINE',
    shareXShort: 'Share on X',
    shareFacebookShort: 'Share on Facebook',
    downloadImage: 'Download Image',
    saveForInstagram: 'Save for Instagram',
    instagramHelperText: 'Save the image and upload it to Instagram',
    linkCopied: 'Link copied',
    linkCopyFailed: 'Failed to copy link',
    imageNotReady: 'Image is not ready',
    noResultToShare: 'No result to share',
    copyLink: 'Copy link',
    copied: 'Link copied.',
    copyFailed: 'Failed to copy the link.',
    tryAnotherOutfit: 'Try another outfit',
    randomOutfit: 'Random outfit',
    resultNotFound: 'The shared result could not be found.',
    shareOnX: 'Share on X',
    shareOnFacebook: 'Share on Facebook',
    shareLinkUnavailable: 'The share link is still being prepared.',
    sharedResultTitle: 'Shared fitting result',
    sharedResultDescription: 'View the generated HAMDEVA result, download it, or try another outfit.',
    loadingSharedResult: 'Loading shared result...',
    freeLeft: (n: number) => `Current credits: ${n}`,
    freeExhausted: 'Not enough credits.',
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
    loginForFree: 'Get 300 credits on sign-up and 300 daily credits when you log in.',
    credits: 'Credits',
    currentCredits: (n: number) => `Current credits: ${n}`,
    generationCost: '1 generation = 100 credits',
    generationCostDetailed: (n: number) => `1 generation = ${n} credits`,
    signUpGetCredits: 'Sign up and get 300 credits',
    dailyLoginCredits: 'Get 300 daily credits',
    subscriptionCreditBonus: 'Subscribers can get extra daily credits',
    notEnoughCredits: 'Not enough credits.',
    refundedAfterFailure: '100 credits refunded due to generation failure.',
    duplicateRequestBlocked: 'A generation request is already being processed. Please try again shortly.',
    todayDailyRewardGranted: 'Today’s 300 credits have been added.',
    todayDailyRewardAlreadyClaimed: 'Today’s daily credits were already claimed.',
    subscriptionBonusGranted: (n: number) => `${n} subscription bonus credits were added.`,
    signupBonusGranted: (n: number) => `${n} sign-up bonus credits were added.`,
    viewSubscription: 'View subscription',
    creditCheck: 'Check credits',
    subscriptionPlanLabel: 'Subscription plan',
    subscriptionPlanValue: (plan: string) => plan === 'pro' ? 'PRO' : plan === 'basic' ? 'BASIC' : 'FREE',
    siteCreditsLabel: 'Current credits',
    siteCreditCostLabel: 'Generation cost',
    authSignupCreditsHint: 'Sign up and get 300 credits',
    adminNav: 'Admin',
    adminTitle: 'Admin Dashboard',
    adminSubtitle: 'Review the service overview and recent activity in one place.',
    adminAccessDenied: 'Admin access is required.',
    adminDashboard: 'Dashboard Summary',
    adminUsersSection: 'Recent Users',
    adminBoardSection: 'Recent Board Posts',
    adminGenerationSection: 'Recent Generation Activity',
    adminCreditsSection: 'Recent Credit Logs',
    adminSystemSection: 'System Status',
    adminTotalUsers: 'Total users',
    adminTotalPosts: 'Total posts',
    adminTotalGenerations: 'Total generations',
    adminTotalSharedResults: 'Total shared results',
    adminTodayGenerations: 'Today generations',
    adminTodayEstimatedCost: 'Today estimated cost',
    adminTotalEstimatedCost: 'Total estimated cost',
    adminRecent7DaysEstimatedCost: 'Recent 7 days estimated cost',
    adminRecentUsers: 'Recently joined users',
    adminRecentPosts: 'Recent posts',
    adminRecentGenerations: 'Recent generation requests',
    adminRecentCredits: 'Recent credit logs',
    adminRole: 'Role',
    adminJoinedAt: 'Joined',
    adminCreatedAt: 'Created',
    adminCreditsColumn: 'Credits',
    adminStatus: 'Status',
    adminResultId: 'Request ID',
    adminEstimatedCost: 'Estimated cost',
    adminModel: 'Model',
    adminNoData: 'No data to display.',
    adminDeletePost: 'Delete post',
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
    siteQuotaLabel: 'Current credits',
    remainingDaily: (n: number) => `Current credits: ${n}`,
    noHistory: 'No saved generations yet.',
    faqTitle: 'FAQ', faqSub: 'Everything you need to know about HAMDEVA.',
    faqs: [
      { q: 'How do credits work?', a: 'You get 300 credits when you sign up and 300 more credits each day you log in. Subscribers can receive additional daily credits based on their plan.' },
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
    faceCopyrightNotice: '人物照片请勿在未获授权的情况下使用名人照片。',
    clothingSafetyNotice: '上传服装图片时，请勿使用过度暴露或带有明显色情性质的图片。',
    resultPrivacyNotice: '本图片不会被保存，仅会为结果预览和下载进行临时处理。',
    share: '分享',
    realGenerationCta: '真实生成',
    shareSectionTitle: '分享',
    shareHelperText: '和朋友分享你的结果',
    shareKakao: '分享到 Kakao',
    shareLine: '分享到 LINE',
    shareXShort: '分享到 X',
    shareFacebookShort: '分享到 Facebook',
    downloadImage: '下载图片',
    saveForInstagram: '保存到 Instagram',
    instagramHelperText: '保存图片后上传到 Instagram',
    linkCopied: '链接已复制',
    linkCopyFailed: '链接复制失败',
    imageNotReady: '图片尚未准备好',
    noResultToShare: '没有可分享的结果',
    copyLink: '复制链接',
    copied: '链接已复制。',
    copyFailed: '复制链接失败。',
    tryAnotherOutfit: '再试一套穿搭',
    randomOutfit: '随机服装',
    resultNotFound: '找不到分享结果。',
    shareOnX: '分享到 X',
    shareOnFacebook: '分享到 Facebook',
    shareLinkUnavailable: '分享链接正在准备中。',
    sharedResultTitle: '分享试穿结果',
    sharedResultDescription: '查看 HAMDEVA 生成结果，下载图片，或再次尝试其他服装。',
    loadingSharedResult: '正在加载分享结果...',
    loginForFree: '注册可获得 300 积分，每日登录再获得 300 积分。',
    credits: '积分',
    currentCredits: (n: number) => `当前积分：${n}`,
    generationCost: '1 次生成 = 100 积分',
    generationCostDetailed: (n: number) => `1 次生成 = ${n} 积分`,
    signUpGetCredits: '注册并领取 300 积分',
    dailyLoginCredits: '每日登录可获得 300 积分',
    subscriptionCreditBonus: '订阅后可获得额外每日积分',
    notEnoughCredits: '积分不足。',
    refundedAfterFailure: '由于生成失败，100 积分已退回。',
    duplicateRequestBlocked: '生成请求正在处理中，请稍后再试。',
    todayDailyRewardGranted: '今天的 300 积分已发放。',
    todayDailyRewardAlreadyClaimed: '今天的每日积分已领取。',
    subscriptionBonusGranted: (n: number) => `已额外发放 ${n} 订阅奖励积分。`,
    signupBonusGranted: (n: number) => `已发放 ${n} 注册奖励积分。`,
    viewSubscription: '查看订阅',
    creditCheck: '查看积分',
    subscriptionPlanLabel: '订阅方案',
    subscriptionPlanValue: (plan: string) => plan === 'pro' ? 'PRO' : plan === 'basic' ? 'BASIC' : 'FREE',
    adminNav: '管理',
    adminTitle: '管理员页面',
    adminSubtitle: '在一个页面中查看核心运营指标与最近活动。',
    adminAccessDenied: '需要管理员权限。',
    adminDashboard: '仪表盘摘要',
    adminUsersSection: '最近用户',
    adminBoardSection: '最近帖子',
    adminGenerationSection: '最近生成活动',
    adminCreditsSection: '最近积分日志',
    adminSystemSection: '系统状态',
    adminTotalUsers: '总用户数',
    adminTotalPosts: '总帖子数',
    adminTotalGenerations: '总生成记录数',
    adminTotalSharedResults: '总分享结果数',
    adminTodayGenerations: '今日生成数',
    adminTodayEstimatedCost: '今日预估成本',
    adminTotalEstimatedCost: '总预估成本',
    adminRecent7DaysEstimatedCost: '最近 7 天预估成本',
    adminRecentUsers: '最近注册用户',
    adminRecentPosts: '最近帖子',
    adminRecentGenerations: '最近生成请求',
    adminRecentCredits: '最近积分日志',
    adminRole: '权限',
    adminJoinedAt: '注册时间',
    adminCreatedAt: '创建时间',
    adminCreditsColumn: '积分',
    adminStatus: '状态',
    adminResultId: '请求 ID',
    adminEstimatedCost: '预估成本',
    adminModel: '模型',
    adminNoData: '暂无可显示的数据。',
    adminDeletePost: '删除帖子',
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
    faceCopyrightNotice: '人物写真には、権利なく有名人の写真を使用しないでください。',
    clothingSafetyNotice: '衣装写真には、過度な露出や性的に露骨な画像をアップロードしないでください。',
    resultPrivacyNotice: 'この画像は保存されず、結果確認とダウンロードのために一時的に処理されます。',
    share: '共有',
    realGenerationCta: '実際に生成する',
    shareSectionTitle: '共有',
    shareHelperText: '結果を友達と共有してみましょう',
    shareKakao: 'カカオで共有',
    shareLine: 'LINEで共有',
    shareXShort: 'Xで共有',
    shareFacebookShort: 'Facebookで共有',
    downloadImage: '画像をダウンロード',
    saveForInstagram: 'Instagram用に保存',
    instagramHelperText: '画像を保存してInstagramにアップロードしてみましょう',
    linkCopied: 'リンクをコピーしました',
    linkCopyFailed: 'リンクのコピーに失敗しました',
    imageNotReady: '画像の準備ができていません',
    noResultToShare: '共有する結果がありません',
    copyLink: 'リンクをコピー',
    copied: 'リンクをコピーしました。',
    copyFailed: 'リンクのコピーに失敗しました。',
    tryAnotherOutfit: '別の衣装を試す',
    randomOutfit: 'ランダム衣装',
    resultNotFound: '共有結果が見つかりません。',
    shareOnX: 'Xで共有',
    shareOnFacebook: 'Facebookで共有',
    shareLinkUnavailable: '共有リンクを準備しています。',
    sharedResultTitle: '共有された試着結果',
    sharedResultDescription: 'HAMDEVA の生成結果を表示し、保存したり別の衣装を試したりできます。',
    loadingSharedResult: '共有結果を読み込み中...',
    loginForFree: '新規登録で 300 クレジット、毎日ログインで 300 クレジットを受け取れます。',
    credits: 'クレジット',
    currentCredits: (n: number) => `現在のクレジット: ${n}`,
    generationCost: '1 回の生成 = 100 クレジット',
    generationCostDetailed: (n: number) => `1 回の生成 = ${n} クレジット`,
    signUpGetCredits: '登録して 300 クレジットを受け取る',
    dailyLoginCredits: '毎日ログインで 300 クレジット',
    subscriptionCreditBonus: '購読すると毎日追加クレジット',
    notEnoughCredits: 'クレジットが不足しています。',
    refundedAfterFailure: '生成に失敗したため 100 クレジットが返金されました。',
    duplicateRequestBlocked: '生成リクエストはすでに処理中です。少し待ってから再試行してください。',
    todayDailyRewardGranted: '本日の 300 クレジットが付与されました。',
    todayDailyRewardAlreadyClaimed: '本日のデイリークレジットはすでに受け取り済みです。',
    subscriptionBonusGranted: (n: number) => `購読ボーナス ${n} クレジットが追加されました。`,
    signupBonusGranted: (n: number) => `登録ボーナス ${n} クレジットが付与されました。`,
    viewSubscription: '購読を見る',
    creditCheck: 'クレジット確認',
    subscriptionPlanLabel: '購読プラン',
    subscriptionPlanValue: (plan: string) => plan === 'pro' ? 'PRO' : plan === 'basic' ? 'BASIC' : 'FREE',
    adminNav: '管理',
    adminTitle: '管理者ページ',
    adminSubtitle: '運営指標と最近の活動を一画面で確認できます。',
    adminAccessDenied: '管理者権限が必要です。',
    adminDashboard: 'ダッシュボード概要',
    adminUsersSection: '最近のユーザー',
    adminBoardSection: '最近の掲示板投稿',
    adminGenerationSection: '最近の生成アクティビティ',
    adminCreditsSection: '最近のクレジットログ',
    adminSystemSection: 'システム状態',
    adminTotalUsers: '総ユーザー数',
    adminTotalPosts: '総投稿数',
    adminTotalGenerations: '総生成数',
    adminTotalSharedResults: '総共有結果数',
    adminTodayGenerations: '本日の生成数',
    adminTodayEstimatedCost: '本日の推定コスト',
    adminTotalEstimatedCost: '総推定コスト',
    adminRecent7DaysEstimatedCost: '直近7日間の推定コスト',
    adminRecentUsers: '最近登録したユーザー',
    adminRecentPosts: '最近の投稿',
    adminRecentGenerations: '最近の生成リクエスト',
    adminRecentCredits: '最近のクレジットログ',
    adminRole: '権限',
    adminJoinedAt: '登録日',
    adminCreatedAt: '作成日時',
    adminCreditsColumn: 'クレジット',
    adminStatus: '状態',
    adminResultId: 'リクエスト ID',
    adminEstimatedCost: '推定コスト',
    adminModel: 'モデル',
    adminNoData: '表示できるデータがありません。',
    adminDeletePost: '投稿を削除',
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

const GENERATION_COST = 100;
const SIGNUP_BONUS_CREDITS = 300;
const DAILY_LOGIN_CREDITS = 300;
const SAME_ORIGIN_TRYON_ENDPOINT = '/api/tryon';
const SAME_ORIGIN_BOOTSTRAP_ENDPOINT = '/api/bootstrap';
const RESULT_ROUTE_PREFIX = '/result/';
const DEFAULT_OG_IMAGE = 'https://hamdeva.com/og-image.png';
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
const getSharedResultIdFromPath = (pathname: string): string | null => {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';
  if (!normalizedPath.startsWith(RESULT_ROUTE_PREFIX)) {
    return null;
  }

  const rawId = normalizedPath.slice(RESULT_ROUTE_PREFIX.length);
  return rawId ? decodeURIComponent(rawId) : null;
};

const buildSharedResultUrl = (resultId: string): string =>
  `https://hamdeva.com/result/${encodeURIComponent(resultId)}`;
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
  credits: typeof data?.credits === 'number' ? data.credits : 0,
  isSubscribed: data?.isSubscribed === true,
  subscriptionPlan: data?.subscriptionPlan === 'basic' || data?.subscriptionPlan === 'pro' ? data.subscriptionPlan : 'free',
  role: data?.role === 'admin' || ADMIN_EMAILS.has((data?.email || email).toLowerCase()) ? 'admin' : 'user',
  createdAt: data?.createdAt ?? null,
  lastDailyRewardAt: data?.lastDailyRewardAt ?? null,
  lastLoginAt: data?.lastLoginAt ?? null,
});

const normalizeSubjectType = (value: unknown): SubjectType => (
  value === 'dog' || value === 'cat' ? value : 'human'
);

const getSubjectTypeLabel = (lang: LanguageCode, subjectType: SubjectType): string => {
  const labels = {
    ko: { human: '사람', dog: '강아지', cat: '고양이' },
    ja: { human: '人間', dog: '犬', cat: '猫' },
    zh: { human: '人物', dog: '狗', cat: '猫' },
    en: { human: 'Human', dog: 'Dog', cat: 'Cat' },
  } as const;
  const labelSet = labels[lang as keyof typeof labels] ?? labels.en;
  return labelSet[subjectType];
};

const getSubjectUiText = (lang: LanguageCode) => {
  if (lang === 'ko') {
    return {
      title: '피사체 유형',
      auto: '자동 감지',
      autoDetecting: '피사체를 자동 감지하는 중...',
      autoDetected: '자동 감지 결과',
      autoFailed: '자동 감지에 실패해 기본값(사람)을 유지합니다.',
      videoPrompt: '이 사진으로 영상을 제작 하시겠습니까?',
      videoButton: '🎬 영상 제작하기 (1000 credits)',
      videoGenerating: '영상 생성 중...',
      videoReady: '영상 생성이 완료되었습니다.',
      videoFailed: '영상 생성에 실패했습니다.',
      videoSection: '생성된 영상',
    };
  }
  if (lang === 'ja') {
    return {
      title: '被写体タイプ',
      auto: '自動検出',
      autoDetecting: '被写体を自動判定中...',
      autoDetected: '自動検出結果',
      autoFailed: '自動検出に失敗したため、既定値の Human を使用します。',
      videoPrompt: 'この画像から動画を生成しますか？',
      videoButton: '🎬 動画を生成する (1000 credits)',
      videoGenerating: '動画を生成中...',
      videoReady: '動画生成が完了しました。',
      videoFailed: '動画生成に失敗しました。',
      videoSection: '生成された動画',
    };
  }
  if (lang === 'zh') {
    return {
      title: '主体类型',
      auto: '自动识别',
      autoDetecting: '正在自动识别主体...',
      autoDetected: '自动识别结果',
      autoFailed: '自动识别失败，已保留默认值 Human。',
      videoPrompt: '要基于这张图片生成视频吗？',
      videoButton: '🎬 生成视频 (1000 credits)',
      videoGenerating: '正在生成视频...',
      videoReady: '视频生成完成。',
      videoFailed: '视频生成失败。',
      videoSection: '生成的视频',
    };
  }
  return {
    title: 'Subject type',
    auto: 'Auto detect',
    autoDetecting: 'Detecting subject type...',
    autoDetected: 'Detected subject',
    autoFailed: 'Subject detection failed. Keeping the default Human setting.',
    videoPrompt: 'Would you like to create a video from this image?',
    videoButton: '🎬 Generate Video (1000 credits)',
    videoGenerating: 'Generating video...',
    videoReady: 'Video generation completed.',
    videoFailed: 'Video generation failed.',
    videoSection: 'Generated video',
  };
};

const loadKakaoSdk = async (): Promise<KakaoSdk | null> => {
  if (!KAKAO_JS_KEY) {
    return null;
  }

  if (!window.Kakao) {
    await new Promise<void>((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>(`script[src="${KAKAO_SDK_URL}"]`);
      if (existingScript) {
        existingScript.addEventListener('load', () => resolve(), { once: true });
        existingScript.addEventListener('error', () => reject(new Error('KAKAO_SDK_LOAD_FAILED')), { once: true });
        return;
      }

      const script = document.createElement('script');
      script.src = KAKAO_SDK_URL;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('KAKAO_SDK_LOAD_FAILED'));
      document.head.appendChild(script);
    });
  }

  if (!window.Kakao) {
    return null;
  }

  if (typeof window.Kakao.isInitialized === 'function' && !window.Kakao.isInitialized() && typeof window.Kakao.init === 'function') {
    window.Kakao.init(KAKAO_JS_KEY);
  }

  return window.Kakao;
};

const getAdminVideoLabels = (lang: LanguageCode) => {
  if (lang === 'ko') {
    return {
      totalVideoCount: '총 영상 생성 수',
      todayVideoCount: '오늘 영상 생성 수',
      estimatedVideoCost: '영상 예상 비용',
      requestType: '요청 유형',
      subjectType: '피사체',
      recentVideos: '최근 영상 생성',
    };
  }
  if (lang === 'ja') {
    return {
      totalVideoCount: '総動画生成数',
      todayVideoCount: '本日の動画生成数',
      estimatedVideoCost: '動画の推定コスト',
      requestType: 'リクエスト種別',
      subjectType: '被写体',
      recentVideos: '最近の動画生成',
    };
  }
  if (lang === 'zh') {
    return {
      totalVideoCount: '总视频生成数',
      todayVideoCount: '今日视频生成数',
      estimatedVideoCost: '视频预估成本',
      requestType: '请求类型',
      subjectType: '主体',
      recentVideos: '最近视频生成',
    };
  }
  return {
    totalVideoCount: 'Total video generations',
    todayVideoCount: 'Today video generations',
    estimatedVideoCost: 'Estimated video cost',
    requestType: 'Request type',
    subjectType: 'Subject',
    recentVideos: 'Recent video generations',
  };
};

const roundEstimatedCost = (value: number): number =>
  Math.round(value * 1_000_000) / 1_000_000;

const estimateGenerationCost = (record: Partial<GenerationRequestRecord>): number | null => {
  if (typeof record.estimatedCost === 'number' && Number.isFinite(record.estimatedCost)) {
    return roundEstimatedCost(record.estimatedCost);
  }

  const model = typeof record.model === 'string' ? record.model : '';
  const quality = typeof record.quality === 'string' ? record.quality : '';
  const size = typeof record.size === 'string' ? record.size : '';
  const inputTokens = typeof record.usage?.input_tokens === 'number' ? Math.max(0, record.usage.input_tokens) : 0;
  const outputTokens = typeof record.usage?.output_tokens === 'number' ? Math.max(0, record.usage.output_tokens) : 0;
  const tokenPricing = OPENAI_IMAGE_TOKEN_PRICING[model as keyof typeof OPENAI_IMAGE_TOKEN_PRICING];

  if (tokenPricing && (inputTokens > 0 || outputTokens > 0)) {
    return roundEstimatedCost(
      (inputTokens / 1_000_000) * tokenPricing.inputPer1M
      + (outputTokens / 1_000_000) * tokenPricing.outputPer1M,
    );
  }

  const qualityPricing = OPENAI_IMAGE_UNIT_PRICING[model as keyof typeof OPENAI_IMAGE_UNIT_PRICING];
  const sizePricing = qualityPricing?.[quality as keyof typeof qualityPricing];
  const fallback = sizePricing?.[size as keyof typeof sizePricing];
  return typeof fallback === 'number' ? roundEstimatedCost(fallback) : null;
};

const createRequestId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

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
  if (errorCode.includes('auth/unauthorized-domain')) {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    return hostname
      ? `현재 도메인(${hostname})이 Firebase Auth 허용 도메인에 등록되지 않았습니다. 관리자에게 도메인 등록 여부를 확인해 주세요.`
      : '현재 도메인이 Firebase Auth 허용 도메인에 등록되지 않았습니다. 관리자에게 도메인 등록 여부를 확인해 주세요.';
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

const formatEstimatedCostLabel = (value: number | null | undefined): string =>
  typeof value === 'number' && Number.isFinite(value)
    ? new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 4,
        maximumFractionDigits: 4,
      }).format(value)
    : '-';

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

const preloadImageSource = (src: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = () => reject(new Error('RESULT_IMAGE_INVALID'));
    img.decoding = 'async';
    img.src = src;
  });

const getGenerateErrorMessage = (
  error: unknown,
  t: { alertError: string; generationConfigError: string; notEnoughCredits: string; refundedAfterFailure: string; authRequired: string; duplicateRequestBlocked: string },
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

  if (raw === 'INSUFFICIENT_CREDITS') {
    return t.notEnoughCredits;
  }

  if (raw === 'AUTH_REQUIRED') {
    return t.authRequired;
  }

  if (raw === 'DUPLICATE_REQUEST') {
    return t.duplicateRequestBlocked;
  }

  if (raw.includes('100 credits refunded')) {
    return `${t.alertError}\n\n${t.refundedAfterFailure}`;
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
  if (errBody.error === 'INSUFFICIENT_CREDITS') {
    return new Error('INSUFFICIENT_CREDITS');
  }
  if (errBody.error === 'INSUFFICIENT_VIDEO_CREDITS') {
    return new Error('INSUFFICIENT_VIDEO_CREDITS');
  }
  if (errBody.error === 'AUTH_REQUIRED') {
    return new Error('AUTH_REQUIRED');
  }
  if (errBody.error === 'DUPLICATE_REQUEST') {
    return new Error('DUPLICATE_REQUEST');
  }

  return new Error(errBody.message || errBody.error || `서버 오류 ${res.status}`);
};

const callCreditBootstrap = async (user: User): Promise<CreditBootstrapResponse> => {
  const token = await user.getIdToken();
  const res = await fetch(SAME_ORIGIN_BOOTSTRAP_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    throw await parseTryOnError(res);
  }

  return await res.json() as CreditBootstrapResponse;
};

const callNanoBanana = async (payload: { authToken: string, personImage: string, garmentImage: string, requestId: string, subjectType: SubjectType, bodyProfile?: any }): Promise<{ image: string; subjectType?: SubjectType; creditsRemaining?: number; signupBonusGranted?: number; dailyRewardGranted?: number; subscriptionBonusGranted?: number }> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60_000);
  try {
    console.info('[HAMDEVA] tryon request', { endpoint: SAME_ORIGIN_TRYON_ENDPOINT, method: 'POST', requestId: payload.requestId });
    const res = await fetch(SAME_ORIGIN_TRYON_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${payload.authToken}`,
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    console.info('[HAMDEVA] tryon response', { endpoint: res.url || SAME_ORIGIN_TRYON_ENDPOINT, method: 'POST', status: res.status, requestId: payload.requestId });

    if (!res.ok) {
      throw await parseTryOnError(res);
    }

    const data = await res.json() as {
      success?: boolean;
      image?: string;
      mimeType?: string;
      subjectType?: SubjectType;
      creditsRemaining?: number;
      signupBonusGranted?: number;
      dailyRewardGranted?: number;
      subscriptionBonusGranted?: number;
    };
    if (!data.image) throw new Error('응답에서 이미지를 찾을 수 없습니다.');
    return {
      image: normalizeGeneratedImage(data.image, data.mimeType),
      subjectType: normalizeSubjectType(data.subjectType),
      creditsRemaining: data.creditsRemaining,
      signupBonusGranted: data.signupBonusGranted,
      dailyRewardGranted: data.dailyRewardGranted,
      subscriptionBonusGranted: data.subscriptionBonusGranted,
    };
  } finally {
    clearTimeout(timer);
  }
};

const callSubjectClassifier = async (subjectImage: string): Promise<SubjectType> => {
  const res = await fetch(SAME_ORIGIN_CLASSIFY_SUBJECT_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ subjectImage }),
  });

  if (!res.ok) {
    throw await parseTryOnError(res);
  }

  const data = await res.json() as { subjectType?: SubjectType };
  return normalizeSubjectType(data.subjectType);
};

const callVideoGeneration = async (payload: {
  authToken: string;
  image: string;
  requestId: string;
  subjectType: SubjectType;
  sourceResultId?: string | null;
}): Promise<VideoGenerationResponse> => {
  const res = await fetch(SAME_ORIGIN_VIDEO_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${payload.authToken}`,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw await parseTryOnError(res);
  }

  return await res.json() as VideoGenerationResponse;
};

const pollVideoGeneration = async (authToken: string, requestId: string): Promise<VideoGenerationResponse & { contentUrl?: string }> => {
  const res = await fetch(`${SAME_ORIGIN_VIDEO_STATUS_ENDPOINT}?requestId=${encodeURIComponent(requestId)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!res.ok) {
    throw await parseTryOnError(res);
  }

  return await res.json() as VideoGenerationResponse & { contentUrl?: string };
};

const fetchVideoBlobUrl = async (authToken: string, requestId: string): Promise<string> => {
  const res = await fetch(`${SAME_ORIGIN_VIDEO_STATUS_ENDPOINT.replace('/video-status', '/video-content')}?requestId=${encodeURIComponent(requestId)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${authToken}`,
    },
  });

  if (!res.ok) {
    throw await parseTryOnError(res);
  }

  return URL.createObjectURL(await res.blob());
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

const downloadImageFile = async (src: string, filename = 'hamdeva-ai-fitting.png'): Promise<void> => {
  const response = await fetch(src);
  if (!response.ok) {
    throw new Error('DOWNLOAD_FAILED');
  }

  const objectUrl = URL.createObjectURL(await response.blob());
  try {
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    link.click();
  } finally {
    setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }
};

const openShareWindow = (url: string) => {
  window.open(url, '_blank', 'noopener,noreferrer');
};

const simpleHash = (a: string, b: string): string => {
  const s = a.slice(-300) + b.slice(-300);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
};

const getCached = (k: string) => {
  try {
    return JSON.parse(localStorage.getItem('HAMDEVA-cache') ?? '{}')[k] ?? null;
  } catch {
    return null;
  }
};
const setCached = (k: string, v: string) => {
  try {
    const c = JSON.parse(localStorage.getItem('HAMDEVA-cache') ?? '{}');
    c[k] = v;
    localStorage.setItem('HAMDEVA-cache', JSON.stringify(c));
  } catch (error) {
    try {
      localStorage.removeItem('HAMDEVA-cache');
    } catch {
    }
    console.warn('Failed to persist HAMDEVA cache:', error);
  }
};

const readGenerationDurations = (): number[] => {
  try {
    const raw = JSON.parse(localStorage.getItem(GENERATION_DURATION_CACHE_KEY) ?? '[]');
    return Array.isArray(raw)
      ? raw.filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0)
      : [];
  } catch {
    return [];
  }
};

const writeGenerationDuration = (durationMs: number) => {
  try {
    const next = [...readGenerationDurations(), durationMs].slice(-6);
    localStorage.setItem(GENERATION_DURATION_CACHE_KEY, JSON.stringify(next));
  } catch (error) {
    console.warn('Failed to persist generation duration estimate:', error);
  }
};

const getEstimatedGenerationDuration = (): number => {
  const durations = readGenerationDurations();
  if (durations.length === 0) {
    return DEFAULT_GENERATION_ESTIMATE_MS;
  }

  const average = durations.reduce((sum, value) => sum + value, 0) / durations.length;
  return Math.min(MAX_GENERATION_ESTIMATE_MS, Math.max(MIN_GENERATION_ESTIMATE_MS, Math.round(average)));
};

const formatSecondsLabel = (ms: number): string => `${Math.max(0, Math.ceil(ms / 1000))}s`;

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

const PAGE_PATHS: Record<SitePage, string> = {
  home: '/',
  admin: '/admin',
  about: '/about',
  'how-it-works': '/how-to-use',
  'traditional-clothing': '/sample-outfits',
  countries: '/countries',
  'fashion-technology': '/fashion-technology',
  privacy: '/privacy',
  terms: '/terms',
  contact: '/contact',
  board: '/board',
  'site-management': '/site-management',
  mypage: '/mypage',
};

const PATH_TO_PAGE = Object.entries(PAGE_PATHS).reduce<Record<string, SitePage>>((acc, [page, path]) => {
  acc[path] = page as SitePage;
  return acc;
}, {});

const getPageFromLocation = (pathname: string, hash: string): SitePage => {
  const normalizedPath = pathname.replace(/\/+$/, '') || '/';
  const pageFromPath = PATH_TO_PAGE[normalizedPath];
  if (pageFromPath) {
    return pageFromPath === 'privacy' || pageFromPath === 'contact' ? 'terms' : pageFromPath;
  }

  const normalizedHash = hash.replace(/^#/, '');
  return SITE_PAGES.includes(normalizedHash as SitePage) ? normalizedHash as SitePage : 'home';
};

const SUPPORTED_LANGUAGE_CODES = LANGUAGE_CODES;
const DEFAULT_LANGUAGE: LanguageCode = 'en';

const isSupportedLanguageCode = (value: string | null): value is LanguageCode =>
  value !== null && SUPPORTED_LANGUAGE_CODES.includes(value as LanguageCode);

const normalizeLanguageCode = (value: string | null | undefined): LanguageCode => {
  const normalized = value?.toLowerCase().split('-')[0] ?? DEFAULT_LANGUAGE;
  return isSupportedLanguageCode(normalized) ? normalized : DEFAULT_LANGUAGE;
};

// ─── App ──────────────────────────────────────────────────────
const App: React.FC = () => {
  const { i18n: i18next } = useTranslation();
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
  const [subjectType, setSubjectType] = useState<SubjectType>('human');
  const [detectedSubjectType, setDetectedSubjectType] = useState<SubjectType | null>(null);
  const [subjectDetectionStatus, setSubjectDetectionStatus] = useState<'idle' | 'detecting' | 'ready' | 'error'>('idle');
  const [subjectTypeManualOverride, setSubjectTypeManualOverride] = useState(false);
  
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

  const [finalImageSrc, setFinalImageSrc] = useState<string | null>(null);
  const [generatedVideoUrl, setGeneratedVideoUrl] = useState<string | null>(null);
  const [generatedVideoRequestId, setGeneratedVideoRequestId] = useState<string | null>(null);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoStatusMessage, setVideoStatusMessage] = useState<string | null>(null);
  const [showVideoPrompt, setShowVideoPrompt] = useState(false);
  const [latestSharedResultId, setLatestSharedResultId] = useState<string | null>(null);
  const [sharedResultRouteId, setSharedResultRouteId] = useState<string | null>(() => getSharedResultIdFromPath(window.location.pathname));
  const [sharedResultRecord, setSharedResultRecord] = useState<PublicResultRecord | null>(null);
  const [sharedResultLoading, setSharedResultLoading] = useState(false);
  const [sharedResultError, setSharedResultError] = useState<string | null>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [creditNotice, setCreditNotice] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('HAMDEVA-dark') === 'true');
  const [currentPage, setCurrentPage] = useState<SitePage>(() => getPageFromLocation(window.location.pathname, window.location.hash));
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
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
  const [adminSummary, setAdminSummary] = useState({
    users: 0,
    posts: 0,
    generations: 0,
    sharedResults: 0,
    todayGenerations: 0,
    todayEstimatedCost: 0,
    totalEstimatedCost: 0,
    recent7DaysEstimatedCost: 0,
    totalVideoGenerations: 0,
    todayVideoGenerations: 0,
    estimatedVideoCost: 0,
  });
  const [adminUsers, setAdminUsers] = useState<AdminUserRecord[]>([]);
  const [adminGenerationLogs, setAdminGenerationLogs] = useState<GenerationRequestRecord[]>([]);
  const [adminCreditLogs, setAdminCreditLogs] = useState<CreditLogRecord[]>([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [authForm, setAuthForm] = useState({ email: '', password: '' });
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [generationStartedAt, setGenerationStartedAt] = useState<number | null>(null);
  const [generationElapsedMs, setGenerationElapsedMs] = useState(0);
  const [generationEstimateMs, setGenerationEstimateMs] = useState(DEFAULT_GENERATION_ESTIMATE_MS);
  const generationLockRef = useRef(false);
  
  const lang = normalizeLanguageCode(i18next.language);
  const contentLocale = getContentLocale(lang);
  const t = uiTranslations[lang];
  const countryShowcaseCards = getCountryShowcaseCards(contentLocale.modal.countries);
  const fontTheme = LANGUAGE_FONT_THEMES[lang];
  const emptyFaceTips = FACE_TIPS[lang];
  const emptyClothTips = CLOTH_TIPS[lang];
  const shareResultLink = latestSharedResultId ? buildSharedResultUrl(latestSharedResultId) : null;
  const sharedPageLink = sharedResultRouteId ? buildSharedResultUrl(sharedResultRouteId) : null;
  const sharedPageImage = sharedResultRecord?.resultImageUrl ?? null;
  const firebaseDisabledMessage = firebaseConfigError
    ? `${getFirebaseDisabledMessage()}${missingFirebaseEnvKeys.length > 0 ? ` (${missingFirebaseEnvKeys.join(', ')})` : ''}`
    : null;
  const currentCredits = userProfile?.credits ?? 0;
  const isAdminUser = userProfile?.role === 'admin';
  const generationRemainingMs = Math.max(0, generationEstimateMs - generationElapsedMs);
  const generationProgressRatio = isGenerating
    ? Math.min(0.97, generationElapsedMs / generationEstimateMs)
    : resultPreviewState === 'ready'
      ? 1
      : 0;
  const generationProgressPercent = Math.round(generationProgressRatio * 100);
  const subjectUi = getSubjectUiText(lang);
  const adminVideoLabels = getAdminVideoLabels(lang);
  const generationStatusLabel = lang === 'ko'
    ? '예상 완료까지'
    : lang === 'ja'
      ? '完了予想まで'
      : lang === 'zh'
        ? '预计剩余时间'
        : 'Estimated time';
  const handleLanguageChange = (nextLanguage: LanguageCode) => {
    if (!isSupportedLanguageCode(nextLanguage)) {
      return;
    }
    void i18next.changeLanguage(nextLanguage);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    try {
      localStorage.setItem('HAMDEVA-dark', String(darkMode));
    } catch (error) {
      console.warn('Failed to persist theme preference:', error);
    }
  }, [darkMode]);
  useEffect(() => {
    try {
      localStorage.setItem('HAMDEVA-lang', lang);
    } catch (error) {
      console.warn('Failed to persist language preference:', error);
    }
    document.documentElement.lang = lang;
  }, [lang]);
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
    const syncRoute = () => {
      setCurrentPage(getPageFromLocation(window.location.pathname, window.location.hash));
      setSharedResultRouteId(getSharedResultIdFromPath(window.location.pathname));
    };

    window.addEventListener('hashchange', syncRoute);
    window.addEventListener('popstate', syncRoute);
    return () => {
      window.removeEventListener('hashchange', syncRoute);
      window.removeEventListener('popstate', syncRoute);
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
        setCreditNotice(null);
        return;
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
    const unsubscribeProfile = onSnapshot(userRef, (snapshot) => {
      if (!snapshot.exists()) {
        setUserProfile(null);
        return;
      }

      const profile = normalizeUserProfile(currentUser.email || '', snapshot.data() as Partial<UserProfile>);
      setUserProfile(profile);
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
    if (!currentUser) {
      return;
    }

    let cancelled = false;

    callCreditBootstrap(currentUser)
      .then((response) => {
        if (cancelled) {
          return;
        }

        if (response.profile) {
          setUserProfile((prev) => ({
            ...normalizeUserProfile(currentUser.email || '', prev ?? {}),
            ...response.profile,
          }));
        }

        const notices = [
          response.signupBonusGranted ? t.signupBonusGranted(response.signupBonusGranted) : '',
          response.dailyRewardGranted ? t.todayDailyRewardGranted : '',
          response.subscriptionBonusGranted ? t.subscriptionBonusGranted(response.subscriptionBonusGranted) : '',
        ].filter(Boolean);

        if (notices.length > 0) {
          setCreditNotice(notices.join(' '));
        }
      })
      .catch((error) => {
        console.error('Failed to bootstrap credits:', error);
      });

    return () => {
      cancelled = true;
    };
  }, [currentUser, t]);
  useEffect(() => {
    if (!isAdminUser || !db) {
      setAdminSummary({
        users: 0,
        posts: 0,
        generations: 0,
        sharedResults: 0,
        todayGenerations: 0,
        todayEstimatedCost: 0,
        totalEstimatedCost: 0,
        recent7DaysEstimatedCost: 0,
        totalVideoGenerations: 0,
        todayVideoGenerations: 0,
        estimatedVideoCost: 0,
      });
      setAdminUsers([]);
      setAdminGenerationLogs([]);
      setAdminCreditLogs([]);
      setAdminLoading(false);
      return;
    }

    let cancelled = false;
    setAdminLoading(true);

    const loadAdminData = async () => {
      const [
        usersCountSnapshot,
        postsCountSnapshot,
        sharedResultsCountSnapshot,
        usersSnapshot,
        generationSnapshot,
        creditSnapshot,
      ] = await Promise.all([
        getCountFromServer(collection(db, 'users')),
        getCountFromServer(collection(db, 'bbsPosts')),
        getCountFromServer(collection(db, 'publicResults')),
        getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(20))),
        getDocs(query(collection(db, 'generationRequests'), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'creditLogs'), orderBy('createdAt', 'desc'), limit(20))),
      ]);

      if (cancelled) {
        return;
      }

      const now = Date.now();
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
      const allGenerationLogs = generationSnapshot.docs.map((snapshot) => ({
        id: snapshot.id,
        ...(snapshot.data() as Omit<GenerationRequestRecord, 'id'>),
      }));
      const imageGenerationLogs = allGenerationLogs.filter((item) => (item.type || 'image_generation') === 'image_generation');
      const videoGenerationLogs = allGenerationLogs.filter((item) => item.type === 'video_generation');
      const todayGenerations = imageGenerationLogs.filter((item) => item.createdAt?.toDate().getTime() >= todayStart.getTime());
      const todayVideoGenerations = videoGenerationLogs.filter((item) => item.createdAt?.toDate().getTime() >= todayStart.getTime());
      const recent7DayGenerations = allGenerationLogs.filter((item) => item.createdAt?.toDate().getTime() >= sevenDaysAgo);
      const totalEstimatedCost = allGenerationLogs.reduce((sum, item) => sum + (estimateGenerationCost(item) ?? 0), 0);
      const todayEstimatedCost = todayGenerations.reduce((sum, item) => sum + (estimateGenerationCost(item) ?? 0), 0);
      const recent7DaysEstimatedCost = recent7DayGenerations.reduce((sum, item) => sum + (estimateGenerationCost(item) ?? 0), 0);
      const estimatedVideoCost = videoGenerationLogs.reduce((sum, item) => sum + (estimateGenerationCost(item) ?? 0), 0);

      setAdminSummary({
        users: usersCountSnapshot.data().count,
        posts: postsCountSnapshot.data().count,
        generations: allGenerationLogs.length,
        sharedResults: sharedResultsCountSnapshot.data().count,
        todayGenerations: todayGenerations.length,
        todayEstimatedCost,
        totalEstimatedCost,
        recent7DaysEstimatedCost,
        totalVideoGenerations: videoGenerationLogs.length,
        todayVideoGenerations: todayVideoGenerations.length,
        estimatedVideoCost,
      });
      setAdminUsers(usersSnapshot.docs.map((snapshot) => ({
        id: snapshot.id,
        ...(snapshot.data() as Omit<AdminUserRecord, 'id'>),
      })));
      setAdminGenerationLogs(allGenerationLogs.slice(0, 20));
      setAdminCreditLogs(creditSnapshot.docs.map((snapshot) => ({
        id: snapshot.id,
        ...(snapshot.data() as Omit<CreditLogRecord, 'id'>),
      })));
      setAdminLoading(false);
    };

    loadAdminData().catch((error) => {
      if (!cancelled) {
        console.error('Failed to load admin data:', error);
        setAdminLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [db, isAdminUser]);
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
    if (!finalImageSrc) {
      setResultPreviewState('idle');
    }
  }, [finalImageSrc]);
  useEffect(() => {
    if (!isGenerating || generationStartedAt === null) {
      return;
    }

    const timer = window.setInterval(() => {
      setGenerationElapsedMs(Date.now() - generationStartedAt);
    }, 200);

    return () => window.clearInterval(timer);
  }, [generationStartedAt, isGenerating]);
  useEffect(() => {
    if (!shareStatus) {
      return;
    }

    const timer = window.setTimeout(() => setShareStatus(null), 2400);
    return () => window.clearTimeout(timer);
  }, [shareStatus]);
  useEffect(() => {
    if (!creditNotice) {
      return;
    }

    const timer = window.setTimeout(() => setCreditNotice(null), 4200);
    return () => window.clearTimeout(timer);
  }, [creditNotice]);
  useEffect(() => () => {
    if (personImage?.startsWith('blob:')) URL.revokeObjectURL(personImage);
    if (clothImage?.startsWith('blob:')) URL.revokeObjectURL(clothImage);
    if (generatedVideoUrl?.startsWith('blob:')) URL.revokeObjectURL(generatedVideoUrl);
  }, [generatedVideoUrl, personImage, clothImage]);
  useEffect(() => {
    if (!sharedResultRouteId) {
      setSharedResultRecord(null);
      setSharedResultError(null);
      setSharedResultLoading(false);
      return;
    }

    if (!db) {
      setSharedResultRecord(null);
      setSharedResultError(t.resultNotFound);
      setSharedResultLoading(false);
      return;
    }

    let cancelled = false;
    setSharedResultLoading(true);
    setSharedResultError(null);

    getDoc(doc(db, 'publicResults', sharedResultRouteId))
      .then((snapshot) => {
        if (cancelled) {
          return;
        }

        if (!snapshot.exists()) {
          setSharedResultRecord(null);
          setSharedResultError(t.resultNotFound);
          return;
        }

        setSharedResultRecord({
          id: snapshot.id,
          ...(snapshot.data() as Omit<PublicResultRecord, 'id'>),
        });
      })
      .catch((error) => {
        if (!cancelled) {
          console.error('Failed to load shared result:', error);
          setSharedResultRecord(null);
          setSharedResultError(t.resultNotFound);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setSharedResultLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [db, sharedResultRouteId, t.resultNotFound]);
  useEffect(() => {
    const pageMeta = sharedResultRouteId
      ? {
          title: `${t.sharedResultTitle} | HAMDEVA`,
          description: t.sharedResultDescription,
        }
      : currentPage === 'admin'
        ? {
            title: `${t.adminTitle} | HAMDEVA`,
            description: t.adminSubtitle,
          }
      : currentPage === 'home'
        ? {
            title: contentLocale.meta.homeTitle,
            description: contentLocale.meta.homeDescription,
          }
        : contentLocale.pages[currentPage];
    const canonicalUrl = sharedResultRouteId
      ? buildSharedResultUrl(sharedResultRouteId)
      : `https://hamdeva.com${PAGE_PATHS[currentPage]}`;
    const ogImage = sharedResultRecord?.resultImageUrl || DEFAULT_OG_IMAGE;

    document.title = pageMeta.title;

    let descriptionTag = document.querySelector('meta[name="description"]');
    if (!descriptionTag) {
      descriptionTag = document.createElement('meta');
      descriptionTag.setAttribute('name', 'description');
      document.head.appendChild(descriptionTag);
    }

    descriptionTag.setAttribute('content', pageMeta.description);

    const upsertMeta = (selector: string, attributes: Record<string, string>) => {
      let tag = document.head.querySelector(selector) as HTMLMetaElement | HTMLLinkElement | null;
      if (!tag) {
        tag = document.createElement(attributes.rel ? 'link' : 'meta') as HTMLMetaElement | HTMLLinkElement;
        document.head.appendChild(tag);
      }

      Object.entries(attributes).forEach(([key, value]) => {
        tag?.setAttribute(key, value);
      });
    };

    upsertMeta('meta[property="og:title"]', { property: 'og:title', content: pageMeta.title });
    upsertMeta('meta[property="og:description"]', { property: 'og:description', content: pageMeta.description });
    upsertMeta('meta[property="og:type"]', { property: 'og:type', content: 'website' });
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalUrl });
    upsertMeta('meta[property="og:image"]', { property: 'og:image', content: ogImage });
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
    upsertMeta('link[rel="canonical"]', { rel: 'canonical', href: canonicalUrl });
  }, [contentLocale, currentPage, sharedResultRecord, sharedResultRouteId, t.adminSubtitle, t.adminTitle, t.sharedResultDescription, t.sharedResultTitle]);

  const clearGeneratedVideo = () => {
    if (generatedVideoUrl?.startsWith('blob:')) {
      URL.revokeObjectURL(generatedVideoUrl);
    }
    setGeneratedVideoUrl(null);
    setGeneratedVideoRequestId(null);
    setVideoStatusMessage(null);
    setShowVideoPrompt(false);
    setIsGeneratingVideo(false);
  };

  const detectSubjectTypeFromImage = async (source: File | string) => {
    setSubjectDetectionStatus('detecting');
    try {
      const prepared = source instanceof File
        ? await blobToDataUrl(source).then((src) => resizeImage(src, 768))
        : await ensureDataUrl(source).then((src) => resizeImage(src, 768));
      const detected = await callSubjectClassifier(prepared);
      setDetectedSubjectType(detected);
      if (!subjectTypeManualOverride) {
        setSubjectType(detected);
      }
      setSubjectDetectionStatus('ready');
    } catch (error) {
      console.error('Failed to classify subject type:', error);
      setSubjectDetectionStatus('error');
    }
  };

  const loadPersonUpload = async (file: File) => {
    if (personImage?.startsWith('blob:')) URL.revokeObjectURL(personImage);
    const previewUrl = URL.createObjectURL(file);
    setSelectedSampleUrl(null);
    setPersonFile(file);
    setPersonImage(previewUrl);
    setSubjectTypeManualOverride(false);
    setDetectedSubjectType(null);
    setPersonUploadMessage(null);
    setPersonPreviewState('ready');
    clearGeneratedVideo();
    void detectSubjectTypeFromImage(file);
  };

  const loadClothUpload = async (file: File) => {
    if (clothImage?.startsWith('blob:')) URL.revokeObjectURL(clothImage);
    const previewUrl = URL.createObjectURL(file);
    setSelectedClothSampleUrl(null);
    setClothFile(file);
    setClothImage(previewUrl);
    setClothUploadMessage(null);
    setClothPreviewState('ready');
    clearGeneratedVideo();
  };

  const handleOpenPersonSampleModal = () => setShowSampleModal(true);
  const handleOpenClothSampleModal = () => {
    if (clothSampleOptions.length === 0) {
      alert(t.clothingSamplesPending);
      return;
    }
    setShowClothSampleModal(true);
  };
  const getRandomClothSample = () => {
    const byGender = subjectType === 'dog' || subjectType === 'cat'
      ? clothSampleOptions.filter((sample) => sample.category === 'animal' && sample.country === subjectType)
      : gender === 'female'
      ? clothSampleOptions.filter((sample) => sample.category === 'female' || sample.category === 'future' || sample.category === 'classic' || sample.category === 'fashin')
      : gender === 'male'
        ? clothSampleOptions.filter((sample) => sample.category === 'male' || sample.category === 'future' || sample.category === 'classic' || sample.category === 'fashin')
        : clothSampleOptions.filter((sample) => sample.category === 'animal' && sample.country === gender);
    const pool = byGender.length > 0 ? byGender : clothSampleOptions;
    return pool[Math.floor(Math.random() * pool.length)] ?? null;
  };
  const clearGeneratedResult = () => {
    setFinalImageSrc(null);
    setLatestSharedResultId(null);
    setShareStatus(null);
    setResultPreviewState('idle');
    clearGeneratedVideo();
  };
  const handleRandomOutfit = () => {
    if (clothSampleOptions.length === 0) {
      alert(t.clothingSamplesPending);
      return;
    }

    const randomSample = getRandomClothSample();
    if (!randomSample) {
      alert(t.clothingSamplesPending);
      return;
    }

    if (clothImage?.startsWith('blob:')) URL.revokeObjectURL(clothImage);
    setClothImage(null);
    setClothFile(null);
    setSelectedClothSampleUrl(randomSample.image);
    setClothUploadMessage(null);
    setClothPreviewState('loading');
    clearGeneratedResult();
    if (currentPage !== 'home' || sharedResultRouteId) {
      navigateToPage('home');
    }
    scrollToTrySection();
  };
  const handleTryAnotherOutfit = () => {
    if (clothImage?.startsWith('blob:')) URL.revokeObjectURL(clothImage);
    setClothImage(null);
    setClothFile(null);
    setSelectedClothSampleUrl(null);
    setClothUploadMessage(null);
    setClothPreviewState('idle');
    clearGeneratedResult();
    if (currentPage !== 'home' || sharedResultRouteId) {
      navigateToPage('home');
    }
    scrollToTrySection();
  };
  const handleDownloadResult = async (src: string) => {
    try {
      await downloadImageFile(src);
    } catch (error) {
      console.error('Failed to download result image:', error);
      setShareStatus(t.alertError);
    }
  };
  const handleCopyLink = async (link: string | null) => {
    if (!link) {
      setShareStatus(t.noResultToShare);
      return;
    }

    try {
      await navigator.clipboard.writeText(link);
      setShareStatus(t.linkCopied);
    } catch (error) {
      console.error('Failed to copy share link:', error);
      setShareStatus(t.linkCopyFailed);
    }
  };
  const handleShareLink = async (link: string | null) => {
    if (!link) {
      setShareStatus(t.noResultToShare);
      return;
    }

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'HAMDEVA - AI Virtual Fitting Playground',
          text: 'I tried AI virtual fitting on HAMDEVA',
          url: link,
        });
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
      }
    }

    openShareWindow(`https://twitter.com/intent/tweet?text=${encodeURIComponent('I tried AI virtual fitting on HAMDEVA')}&url=${encodeURIComponent(link)}`);
  };
  const handleShareOnKakao = async (link: string | null) => {
    if (!link) {
      setShareStatus(t.noResultToShare);
      return;
    }

    try {
      const kakao = await loadKakaoSdk();
      if (!kakao?.Share?.sendDefault) {
        await handleShareLink(link);
        return;
      }

      kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: 'HAMDEVA - AI Virtual Fitting Playground',
          description: 'Try AI virtual fitting online with HAMDEVA.',
          imageUrl: 'https://hamdeva.com/og-image.png',
          link: {
            mobileWebUrl: link,
            webUrl: link,
          },
        },
        buttons: [
          {
            title: 'Open Result',
            link: {
              mobileWebUrl: link,
              webUrl: link,
            },
          },
        ],
      });
    } catch (error) {
      console.error('Failed to share on Kakao:', error);
      await handleShareLink(link);
    }
  };
  const handleShareOnLine = (link: string | null) => {
    if (!link) {
      setShareStatus(t.noResultToShare);
      return;
    }

    openShareWindow(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(link)}`);
  };
  const handleShareOnX = (link: string | null) => {
    if (!link) {
      setShareStatus(t.noResultToShare);
      return;
    }

    openShareWindow(`https://twitter.com/intent/tweet?text=${encodeURIComponent('I tried AI virtual fitting on HAMDEVA')}&url=${encodeURIComponent(link)}`);
  };
  const handleShareOnFacebook = (link: string | null) => {
    if (!link) {
      setShareStatus(t.noResultToShare);
      return;
    }

    openShareWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(link)}`);
  };
  const handleInstagramSave = async (src: string | null) => {
    if (!src) {
      setShareStatus(t.imageNotReady);
      return;
    }

    try {
      await downloadImageFile(src);
      setShareStatus(t.instagramHelperText);
    } catch (error) {
      console.error('Failed to prepare Instagram save:', error);
      setShareStatus(t.imageNotReady);
    }
  };
  const handleSubjectTypeChange = (nextSubjectType: SubjectType) => {
    setSubjectType(nextSubjectType);
    setSubjectTypeManualOverride(true);
  };
  const handleVideoGenerate = async () => {
    if (!currentUser || !finalImageSrc || isGeneratingVideo) {
      return;
    }
    if (currentCredits < VIDEO_GENERATION_COST) {
      alert(t.notEnoughCredits);
      return;
    }

    clearGeneratedVideo();
    setIsGeneratingVideo(true);
    setVideoStatusMessage(subjectUi.videoGenerating);
    try {
      const authToken = await currentUser.getIdToken();
      const requestId = createRequestId();
      const result = await callVideoGeneration({
        authToken,
        image: finalImageSrc,
        requestId,
        subjectType,
        sourceResultId: latestSharedResultId,
      });
      setGeneratedVideoRequestId(requestId);
      setUserProfile((prev) => prev ? {
        ...prev,
        credits: typeof result.creditsRemaining === 'number' ? result.creditsRemaining : prev.credits,
      } : prev);

      let attempts = 0;
      while (attempts < 40) {
        attempts += 1;
        await new Promise((resolve) => window.setTimeout(resolve, 5000));
        const status = await pollVideoGeneration(authToken, requestId);
        if (typeof status.creditsRemaining === 'number') {
          setUserProfile((prev) => prev ? { ...prev, credits: status.creditsRemaining as number } : prev);
        }
        if (status.status === 'completed') {
          const videoUrl = await fetchVideoBlobUrl(authToken, requestId);
          setGeneratedVideoUrl(videoUrl);
          setVideoStatusMessage(subjectUi.videoReady);
          return;
        }
        if (status.status === 'failed' || status.status === 'canceled') {
          throw new Error(subjectUi.videoFailed);
        }
      }

      throw new Error(subjectUi.videoFailed);
    } catch (error) {
      console.error('Failed to generate video:', error);
      setVideoStatusMessage(error instanceof Error ? error.message : subjectUi.videoFailed);
    } finally {
      setIsGeneratingVideo(false);
    }
  };
  const renderResultActions = (imageSrc: string, link: string | null, disableDownload = false, showVideoControls = false) => (
    <>
      <div className="page-article share-section">
        <div className="share-section-copy">
          <h3>{t.shareSectionTitle}</h3>
          <p>{t.shareHelperText}</p>
        </div>
        <div className="result-action-grid share-grid-primary">
          <button aria-label={t.shareKakao} className="outline-btn result-action-btn share-platform-btn" onClick={() => { void handleShareOnKakao(link); }} type="button">
            <span aria-hidden="true" className="share-platform-icon">💬</span>
            <span>{t.shareKakao}</span>
          </button>
          <button aria-label={t.shareLine} className="outline-btn result-action-btn share-platform-btn" onClick={() => handleShareOnLine(link)} type="button">
            <span aria-hidden="true" className="share-platform-icon">🟢</span>
            <span>{t.shareLine}</span>
          </button>
          <button aria-label={t.shareXShort} className="outline-btn result-action-btn share-platform-btn" onClick={() => handleShareOnX(link)} type="button">
            <span aria-hidden="true" className="share-platform-icon">✕</span>
            <span>{t.shareXShort}</span>
          </button>
          <button aria-label={t.shareFacebookShort} className="outline-btn result-action-btn share-platform-btn" onClick={() => handleShareOnFacebook(link)} type="button">
            <span aria-hidden="true" className="share-platform-icon">f</span>
            <span>{t.shareFacebookShort}</span>
          </button>
        </div>
        <div className="result-action-grid share-grid-secondary">
          <button aria-label={t.share} className="outline-btn result-action-btn share-platform-btn utility" onClick={() => { void handleShareLink(link); }} type="button">
            <span aria-hidden="true" className="share-platform-icon">↗</span>
            <span>{t.share}</span>
          </button>
          <button aria-label={t.copyLink} className="outline-btn result-action-btn share-platform-btn utility" onClick={() => { void handleCopyLink(link); }} type="button">
            <span aria-hidden="true" className="share-platform-icon">🔗</span>
            <span>{t.copyLink}</span>
          </button>
          <button aria-label={t.downloadImage} className="download-btn result-action-btn share-platform-btn utility" disabled={disableDownload} onClick={() => { void handleDownloadResult(imageSrc); }} type="button">
            <span aria-hidden="true" className="share-platform-icon">⬇</span>
            <span>{t.downloadImage}</span>
          </button>
          <button aria-label={t.saveForInstagram} className="outline-btn result-action-btn share-platform-btn utility" disabled={disableDownload} onClick={() => { void handleInstagramSave(imageSrc); }} type="button">
            <span aria-hidden="true" className="share-platform-icon">📷</span>
            <span>{t.saveForInstagram}</span>
          </button>
        </div>
      </div>
      <div className="result-action-grid result-utility-grid">
        <button className="outline-btn result-action-btn" onClick={handleTryAnotherOutfit} type="button">
          {t.tryAnotherOutfit}
        </button>
        <button className="outline-btn result-action-btn" onClick={handleRandomOutfit} type="button">
          {t.randomOutfit}
        </button>
      </div>
      {showVideoControls && (showVideoPrompt || isGeneratingVideo || generatedVideoUrl) && (
        <div className="page-article result-video-panel">
          <p>{subjectUi.videoPrompt}</p>
          <button
            className="generate-btn"
            disabled={disableDownload || isGeneratingVideo || currentCredits < VIDEO_GENERATION_COST}
            onClick={() => { void handleVideoGenerate(); }}
            type="button"
          >
            {isGeneratingVideo ? subjectUi.videoGenerating : subjectUi.videoButton}
          </button>
          {videoStatusMessage && <p className="result-status-text">{videoStatusMessage}</p>}
          {generatedVideoUrl && (
            <div className="composite-result result-video-shell">
              <video controls playsInline preload="metadata" className="is-visible">
                <source src={generatedVideoUrl} type="video/mp4" />
              </video>
            </div>
          )}
        </div>
      )}
      {shareStatus && <p className="result-status-text">{shareStatus}</p>}
    </>
  );
  const navigateToPage = (page: SitePage) => {
    const nextUrl = `${PAGE_PATHS[page]}${window.location.search}`;
    window.history.pushState(null, '', nextUrl);
    setCurrentPage(page);
    setSharedResultRouteId(null);
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
  const syncUserCreditsAfterAuth = async (user: User) => {
    try {
      const response = await callCreditBootstrap(user);
      if (response.profile) {
        setUserProfile(normalizeUserProfile(user.email || '', response.profile));
      }

      const notices = [
        response.signupBonusGranted ? t.signupBonusGranted(response.signupBonusGranted) : '',
        response.dailyRewardGranted ? t.todayDailyRewardGranted : '',
        response.subscriptionBonusGranted ? t.subscriptionBonusGranted(response.subscriptionBonusGranted) : '',
      ].filter(Boolean);

      if (notices.length > 0) {
        setCreditNotice(notices.join(' '));
      }
    } catch (error) {
      if (isFirestorePermissionError(error)) {
        setUserProfile(normalizeUserProfile(user.email || ''));
        return;
      }
      console.error('Failed to sync user credits after login:', error);
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
      void syncUserCreditsAfterAuth(signedInUser);
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
      void syncUserCreditsAfterAuth(credential.user);
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
    if ((!editingBbsPostId || !isAdminUser) && !bbsForm.tempPassword.trim()) {
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
        if (!isAdminUser && currentPost.tempPassword !== bbsForm.tempPassword.trim()) {
          setBbsStatus(t.boardPasswordMismatch);
          return;
        }

        await updateDoc(doc(db, 'bbsPosts', editingBbsPostId), {
          nickname: bbsForm.nickname.trim(),
          content: bbsForm.content.trim(),
          tempPassword: isAdminUser ? (currentPost.tempPassword || bbsForm.tempPassword.trim()) : bbsForm.tempPassword.trim(),
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

    const typedPassword = isAdminUser ? post.tempPassword || '' : window.prompt(t.boardTempPasswordLabel) || '';
    if (!isAdminUser && !typedPassword.trim()) {
      setBbsStatus(t.boardPasswordRequired);
      return;
    }
    if (!isAdminUser && typedPassword.trim() !== post.tempPassword) {
      setBbsStatus(t.boardPasswordMismatch);
      return;
    }

    setBbsSubmitting(true);
    try {
      if (isAdminUser) {
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
    if (generationLockRef.current) {
      return;
    }
    if (!currentUser) {
      openAuthModal('login');
      return;
    }
    if (!activePersonImage || !activeClothImage) { alert(t.alertBoth); return; }
    if (currentCredits < GENERATION_COST) {
      alert(t.notEnoughCredits);
      return;
    }

    generationLockRef.current = true;
    setIsGenerating(true);
    clearGeneratedVideo();
    const startedAt = Date.now();
    setGenerationStartedAt(startedAt);
    setGenerationElapsedMs(0);
    setGenerationEstimateMs(getEstimatedGenerationDuration());
    setShareStatus(null);
    setCreditNotice(null);
    setLatestSharedResultId(null);
    setShowVideoPrompt(false);
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
        clearGeneratedResult();
        setFinalImageSrc(cached);
        setResultPreviewState('ready');
        setShowVideoPrompt(true);
        writeGenerationDuration(Date.now() - startedAt);
        setTimeout(() => document.getElementById('result-area')?.scrollIntoView({ behavior: 'smooth' }), 100);
        return;
      }

      let resolvedSubjectType = subjectType;
      if (subjectDetectionStatus !== 'ready' && !subjectTypeManualOverride) {
        try {
          resolvedSubjectType = await callSubjectClassifier(preparedPersonImage);
          setDetectedSubjectType(resolvedSubjectType);
          setSubjectType(resolvedSubjectType);
          setSubjectDetectionStatus('ready');
        } catch (error) {
          console.error('Failed to auto-detect subject before generation:', error);
          setSubjectDetectionStatus('error');
        }
      }

      const requestId = createRequestId();
      const authToken = await currentUser.getIdToken();
      const resultPayload = await callNanoBanana({
        authToken,
        requestId,
        personImage: preparedPersonImage,
        garmentImage: preparedClothImage,
        subjectType: resolvedSubjectType,
        bodyProfile: { gender },
      });
      const result = await preloadImageSource(resultPayload.image);
      setResultPreviewState('loading');

      try {
        setUserProfile((prev) => prev ? {
          ...prev,
          credits: typeof resultPayload.creditsRemaining === 'number' ? resultPayload.creditsRemaining : prev.credits,
        } : prev);

        const notices = [
          resultPayload.signupBonusGranted ? t.signupBonusGranted(resultPayload.signupBonusGranted) : '',
          resultPayload.dailyRewardGranted ? t.todayDailyRewardGranted : '',
          resultPayload.subscriptionBonusGranted ? t.subscriptionBonusGranted(resultPayload.subscriptionBonusGranted) : '',
        ].filter(Boolean);
        if (notices.length > 0) {
          setCreditNotice(notices.join(' '));
        }

        const [historyFaceImage, historyClothImage, historyResultImage] = await Promise.all([
          createHistoryPreview(preparedPersonImage, 360),
          createHistoryPreview(preparedClothImage, 360),
          createHistoryPreview(result, 720),
        ]);
        const publicResultRef = doc(collection(requireDb(), 'publicResults'));

        await Promise.all([
          addDoc(collection(requireDb(), 'generations'), {
            uid: currentUser.uid,
            faceImageUrl: historyFaceImage,
            clothImageUrl: historyClothImage,
            resultImageUrl: historyResultImage,
            createdAt: serverTimestamp(),
          }),
          setDoc(publicResultRef, {
            uid: currentUser.uid,
            resultImageUrl: historyResultImage,
            language: lang,
            createdAt: serverTimestamp(),
          }),
        ]);
        setLatestSharedResultId(publicResultRef.id);
      } catch (error) {
        if (error instanceof Error && error.message === 'INSUFFICIENT_CREDITS') {
          alert(t.notEnoughCredits);
          setIsGenerating(false);
          return;
        }
        throw error;
      }

      setCached(cacheKey, result);
      setFinalImageSrc(result);
      setSubjectType(normalizeSubjectType(resultPayload.subjectType || resolvedSubjectType));
      setShowVideoPrompt(true);
      writeGenerationDuration(Date.now() - startedAt);
      setTimeout(() => document.getElementById('result-area')?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) {
      setResultPreviewState('error');
      alert(getGenerateErrorMessage(err, t));
    } finally {
      generationLockRef.current = false;
      setIsGenerating(false);
      setGenerationStartedAt(null);
      setGenerationElapsedMs(0);
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
            {isAdminUser && (
              <button
                className={`nav-link ${currentPage === 'admin' ? 'active' : ''}`}
                onClick={() => navigateToPage('admin')}
                type="button"
              >
                {t.adminNav}
              </button>
            )}
          </div>
          <div className="nav-right">
            {currentUser && (
              <div className="credit-pill" aria-label={t.currentCredits(currentCredits)}>
                <span>{t.credits}</span>
                <strong>{currentCredits}</strong>
              </div>
            )}
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
                    {isAdminUser && (
                      <button className="lang-option" onClick={() => { navigateToPage('admin'); setUserMenuOpen(false); }} type="button">
                        {t.adminNav}
                      </button>
                    )}
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
            <LangDropdown lang={lang} onChange={handleLanguageChange} />
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
          {sharedResultRouteId ? (
            <>
              <div className="hero-eyebrow">{t.share}</div>
              <h1 className="hero-title page-title">{t.sharedResultTitle}</h1>
              <p className="hero-sub">{t.sharedResultDescription}</p>
            </>
          ) : currentPage === 'admin' ? (
            <>
              <div className="hero-eyebrow">{t.adminNav}</div>
              <h1 className="hero-title page-title">{t.adminTitle}</h1>
              <p className="hero-sub">{t.adminSubtitle}</p>
            </>
          ) : currentPage === 'home' ? (
            <>
              <div className="hero-eyebrow">{t.heroEyebrow}</div>
              <h1 className="hero-title">
                {t.heroTitle.split('\n')[0] ?? t.heroTitle}
                <br />
                {t.heroTitle.split('\n')[1] ?? ''}
              </h1>
              <p className="hero-subtitle">{contentLocale.hero.subtitle}</p>
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

      {sharedResultRouteId ? (
        <main className="section page-shell">
          <div className="section-inner page-layout">
            <article className="page-article shared-result-shell">
              {sharedResultLoading ? (
                <p>{t.loadingSharedResult}</p>
              ) : sharedResultError || !sharedResultRecord ? (
                <>
                  <h2>{t.sharedResultTitle}</h2>
                  <p>{sharedResultError || t.resultNotFound}</p>
                  <div className="result-action-grid single-row">
                    <button className="outline-btn result-action-btn" onClick={handleTryAnotherOutfit} type="button">
                      {t.tryAnotherOutfit}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="section-heading">{t.resultTitle}</h2>
                  <div className="composite-result">
                    <img
                      src={sharedResultRecord.resultImageUrl}
                      alt="Shared HAMDEVA fitting result"
                      className="is-visible"
                    />
                    <div className="watermark">HAMDEVA AI</div>
                  </div>
                  {renderResultActions(sharedResultRecord.resultImageUrl, sharedPageLink, false, false)}
                </>
              )}
            </article>
          </div>
        </main>
      ) : currentPage === 'home' ? (
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
                {currentUser ? t.currentCredits(currentCredits) : t.loginForFree}
              </div>
              {creditNotice && <div className="credit-notice-banner">{creditNotice}</div>}
              {!currentUser && (
                <div className="credit-cta-panel">
                  <p>{t.authSignupCreditsHint}</p>
                  <p>{t.dailyLoginCredits}</p>
                  <p>{t.subscriptionCreditBonus}</p>
                  <div className="credit-cta-actions">
                    <button className="generate-btn auth-inline-btn" onClick={() => openAuthModal('signup')} type="button">
                      {t.signUpGetCredits}
                    </button>
                    <button className="outline-btn auth-inline-btn" onClick={() => openAuthModal('login')} type="button">
                      {t.login}
                    </button>
                  </div>
                </div>
              )}

              <div className="try-layout">
                <div className="try-column">
                  <div className="card-header">
                    <span className="section-label">{t.step1Label}</span>
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
                        setSubjectType('human');
                        setDetectedSubjectType(null);
                        setSubjectDetectionStatus('idle');
                        setSubjectTypeManualOverride(false);
                        setPersonUploadMessage(null);
                        setPersonPreviewState('idle');
                      }}>&times;</button>
                    )}
                  </div>
                  <p className="upload-guidance-text">{t.faceCopyrightNotice}</p>
                </div>

                <div className="try-column">
                  <div className="card-header">
                    <span className="section-label">{t.step2Label}</span>
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
                  <p className="upload-guidance-text">{t.clothingSafetyNotice}</p>
                </div>
              </div>

              <div className="subject-type-panel page-article">
                <div className="subject-type-head">
                  <strong>{subjectUi.title}</strong>
                  <button className="outline-btn subject-detect-btn" onClick={() => {
                    const source = personFile || activePersonImage;
                    if (source) {
                      setSubjectTypeManualOverride(false);
                      void detectSubjectTypeFromImage(source);
                    }
                  }} type="button">
                    {subjectUi.auto}
                  </button>
                </div>
                <div className="subject-type-controls">
                  <select
                    className="subject-type-select"
                    value={subjectType}
                    onChange={(event) => handleSubjectTypeChange(normalizeSubjectType(event.target.value))}
                  >
                    {SUBJECT_TYPES.map((item) => (
                      <option key={item} value={item}>{getSubjectTypeLabel(lang, item)}</option>
                    ))}
                  </select>
                  <span className="subject-type-status">
                    {subjectDetectionStatus === 'detecting'
                      ? subjectUi.autoDetecting
                      : subjectDetectionStatus === 'ready' && detectedSubjectType
                        ? `${subjectUi.autoDetected}: ${getSubjectTypeLabel(lang, detectedSubjectType)}`
                        : subjectDetectionStatus === 'error'
                          ? subjectUi.autoFailed
                          : `${subjectUi.autoDetected}: ${getSubjectTypeLabel(lang, subjectType)}`}
                  </span>
                </div>
              </div>

              <div className="action-section">
                <p className="real-generation-label">{t.realGenerationCta}</p>
                <p className="credit-cost-text">{t.generationCostDetailed(GENERATION_COST)}</p>
                <p className="credit-balance-text">{t.currentCredits(currentCredits)}</p>
                <button
                  className="generate-btn"
                  onClick={handleGenerate}
                  disabled={isGenerating || !currentUser || !activePersonImage || !activeClothImage || currentCredits < GENERATION_COST}
                >
                  {isGenerating ? (
                    <><span className="spinner"></span>{t.generating}</>
                  ) : t.generate}
                </button>
                {currentUser && currentCredits < GENERATION_COST && (
                  <p className="loading-subtext">{t.notEnoughCredits}</p>
                )}
                {isGenerating && (
                  <>
                    <p className="loading-subtext">{t.loadingDetail}</p>
                    <div className="generation-gauge" aria-live="polite">
                      <div className="generation-gauge-head">
                        <strong>{generationStatusLabel}</strong>
                        <span>{formatSecondsLabel(generationRemainingMs)}</span>
                      </div>
                      <div
                        className="generation-gauge-track"
                        role="progressbar"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={generationProgressPercent}
                      >
                        <div className="generation-gauge-fill" style={{ width: `${generationProgressPercent}%` }} />
                        <div className="generation-gauge-ticks">
                          <span />
                          <span />
                          <span />
                          <span />
                        </div>
                      </div>
                      <div className="generation-gauge-meta">
                        <span>0s</span>
                        <span>{formatSecondsLabel(generationElapsedMs)}</span>
                        <span>{formatSecondsLabel(generationEstimateMs)}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {finalImageSrc && (
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
                        src={finalImageSrc}
                        alt="Result"
                        className={resultPreviewState === 'ready' ? 'is-visible' : ''}
                        onLoad={() => setResultPreviewState('ready')}
                        onError={() => setResultPreviewState('error')}
                      />
                    )}
                    <div className="watermark">HAMDEVA AI</div>
                  </div>
                  {renderResultActions(finalImageSrc, shareResultLink, resultPreviewState !== 'ready', true)}
                  <p className="result-disclaimer-text">{t.resultPrivacyNotice}</p>
                </div>
              )}
            </div>
          </section>

        </>
      ) : (
        <main className="section page-shell">
          <div className="section-inner page-layout">
            {currentPage === 'admin' && (
              !currentUser ? (
                <article className="page-article">
                  <h2>{t.adminTitle}</h2>
                  <p>{t.authRequired}</p>
                  <button className="generate-btn auth-inline-btn" onClick={() => openAuthModal('login')} type="button">
                    {t.login}
                  </button>
                </article>
              ) : !userProfile ? (
                <article className="page-article">
                  <h2>{t.adminTitle}</h2>
                  <p>{t.loadingSharedResult}</p>
                </article>
              ) : !isAdminUser ? (
                <article className="page-article">
                  <h2>{t.adminTitle}</h2>
                  <p>{t.adminAccessDenied}</p>
                  <button className="outline-btn auth-inline-btn" onClick={() => navigateToPage('home')} type="button">
                    {t.heroCta}
                  </button>
                </article>
              ) : (
                <div className="admin-layout">
                  <article className="page-article">
                    <h2>{t.adminTitle}</h2>
                    <p>{currentUser.email}</p>
                    <p>{t.adminSubtitle}</p>
                  </article>
                  <div className="management-grid admin-summary-grid">
                    <article className="page-article">
                      <h3>{t.adminTotalUsers}</h3>
                      <p>{adminSummary.users}</p>
                    </article>
                    <article className="page-article">
                      <h3>{t.adminTotalPosts}</h3>
                      <p>{adminSummary.posts}</p>
                    </article>
                    <article className="page-article">
                      <h3>{t.adminTotalGenerations}</h3>
                      <p>{adminSummary.generations}</p>
                    </article>
                    <article className="page-article">
                      <h3>{t.adminTotalSharedResults}</h3>
                      <p>{adminSummary.sharedResults}</p>
                    </article>
                    <article className="page-article">
                      <h3>{t.adminTodayGenerations}</h3>
                      <p>{adminSummary.todayGenerations}</p>
                    </article>
                    <article className="page-article">
                      <h3>{t.adminTodayEstimatedCost}</h3>
                      <p>{formatEstimatedCostLabel(adminSummary.todayEstimatedCost)}</p>
                    </article>
                    <article className="page-article">
                      <h3>{t.adminTotalEstimatedCost}</h3>
                      <p>{formatEstimatedCostLabel(adminSummary.totalEstimatedCost)}</p>
                    </article>
                    <article className="page-article">
                      <h3>{t.adminRecent7DaysEstimatedCost}</h3>
                      <p>{formatEstimatedCostLabel(adminSummary.recent7DaysEstimatedCost)}</p>
                    </article>
                    <article className="page-article">
                      <h3>{adminVideoLabels.totalVideoCount}</h3>
                      <p>{adminSummary.totalVideoGenerations}</p>
                    </article>
                    <article className="page-article">
                      <h3>{adminVideoLabels.todayVideoCount}</h3>
                      <p>{adminSummary.todayVideoGenerations}</p>
                    </article>
                    <article className="page-article">
                      <h3>{adminVideoLabels.estimatedVideoCost}</h3>
                      <p>{formatEstimatedCostLabel(adminSummary.estimatedVideoCost)}</p>
                    </article>
                  </div>
                  <article className="page-article">
                    <h3>{t.adminSystemSection}</h3>
                    <p>{t.siteVersionLabel}: {appVersion}</p>
                    <p>{t.siteFirebaseLabel}: {isFirebaseConfigured ? t.siteFirebaseReady : t.siteFirebaseBlocked}</p>
                    <p>{t.siteCreditCostLabel}: {GENERATION_COST}</p>
                    {adminLoading && <p>{t.loadingSharedResult}</p>}
                  </article>
                  <article className="page-article">
                    <h3>{t.adminUsersSection}</h3>
                    <div className="admin-table">
                      <div className="admin-table-head">
                        <span>{t.emailLabel}</span>
                        <span>{t.adminJoinedAt}</span>
                        <span>{t.adminCreditsColumn}</span>
                        <span>{t.subscriptionPlanLabel}</span>
                        <span>{t.adminRole}</span>
                      </div>
                      {adminUsers.length > 0 ? adminUsers.map((item) => (
                        <div key={item.id} className="admin-table-row">
                          <span>{item.email || '-'}</span>
                          <span>{formatTimestampLabel(item.createdAt)}</span>
                          <span>{item.credits ?? 0}</span>
                          <span>{t.subscriptionPlanValue(item.subscriptionPlan || 'free')}</span>
                          <span>{item.role || 'user'}</span>
                        </div>
                      )) : (
                        <p>{t.adminNoData}</p>
                      )}
                    </div>
                  </article>
                  <article className="page-article">
                    <h3>{t.adminBoardSection}</h3>
                    <div className="admin-table">
                      <div className="admin-table-head admin-board-head">
                        <span>{t.boardNicknameLabel}</span>
                        <span>{t.boardContentLabel}</span>
                        <span>{t.adminCreatedAt}</span>
                        <span>{t.boardDelete}</span>
                      </div>
                      {bbsPosts.length > 0 ? bbsPosts.slice(0, 20).map((post) => (
                        <div key={post.id} className="admin-table-row admin-board-row">
                          <span>{post.nickname || t.boardMetaAnonymous}</span>
                          <span>{post.content}</span>
                          <span>{formatTimestampLabel(post.createdAt)}</span>
                          <button className="bbs-icon-btn danger" disabled={bbsSubmitting} onClick={() => { void handleBbsDelete(post); }} title={t.adminDeletePost} type="button">
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                              <path d="M9 3h6l1 2h4v2H4V5h4l1-2zm1 6h2v8h-2V9zm4 0h2v8h-2V9zM7 9h2v8H7V9z" fill="currentColor" />
                            </svg>
                          </button>
                        </div>
                      )) : (
                        <p>{t.adminNoData}</p>
                      )}
                    </div>
                  </article>
                  <article className="page-article">
                    <h3>{t.adminGenerationSection}</h3>
                    <div className="admin-table">
                      <div className="admin-table-head">
                        <span>{t.emailLabel}</span>
                        <span>{t.adminCreatedAt}</span>
                        <span>{adminVideoLabels.requestType}</span>
                        <span>{adminVideoLabels.subjectType}</span>
                        <span>{t.adminStatus}</span>
                        <span>{t.adminModel}</span>
                        <span>{t.adminEstimatedCost}</span>
                        <span>{t.adminResultId}</span>
                      </div>
                      {adminGenerationLogs.length > 0 ? adminGenerationLogs.map((item) => (
                        <div key={item.id} className="admin-table-row">
                          <span>{item.email || item.uid}</span>
                          <span>{formatTimestampLabel(item.createdAt)}</span>
                          <span>{item.type || 'image_generation'}</span>
                          <span>{item.subjectType || '-'}</span>
                          <span>{item.status || (item.success ? 'completed' : 'unknown')}{item.refunded ? ' / refunded' : ''}</span>
                          <span>{item.model || '-'}</span>
                          <span>{formatEstimatedCostLabel(estimateGenerationCost(item))}</span>
                          <span>{item.requestId}</span>
                        </div>
                      )) : (
                        <p>{t.adminNoData}</p>
                      )}
                    </div>
                  </article>
                  <article className="page-article">
                    <h3>{adminVideoLabels.recentVideos}</h3>
                    <div className="admin-table">
                      <div className="admin-table-head">
                        <span>{t.emailLabel}</span>
                        <span>{t.adminCreatedAt}</span>
                        <span>{adminVideoLabels.subjectType}</span>
                        <span>{t.adminStatus}</span>
                        <span>{t.adminEstimatedCost}</span>
                        <span>{t.adminResultId}</span>
                      </div>
                      {adminGenerationLogs.filter((item) => item.type === 'video_generation').length > 0 ? adminGenerationLogs.filter((item) => item.type === 'video_generation').map((item) => (
                        <div key={item.id} className="admin-table-row">
                          <span>{item.email || item.uid}</span>
                          <span>{formatTimestampLabel(item.createdAt)}</span>
                          <span>{item.subjectType || '-'}</span>
                          <span>{item.status || (item.success ? 'completed' : 'unknown')}</span>
                          <span>{formatEstimatedCostLabel(estimateGenerationCost(item))}</span>
                          <span>{item.requestId}</span>
                        </div>
                      )) : (
                        <p>{t.adminNoData}</p>
                      )}
                    </div>
                  </article>
                  <article className="page-article">
                    <h3>{t.adminCreditsSection}</h3>
                    <div className="admin-table">
                      <div className="admin-table-head">
                        <span>{t.emailLabel}</span>
                        <span>{t.adminStatus}</span>
                        <span>{t.adminCreditsColumn}</span>
                        <span>{t.adminCreatedAt}</span>
                      </div>
                      {adminCreditLogs.length > 0 ? adminCreditLogs.map((item) => (
                        <div key={item.id} className="admin-table-row">
                          <span>{item.email || item.uid}</span>
                          <span>{item.type}</span>
                          <span>{item.amount}</span>
                          <span>{formatTimestampLabel(item.createdAt)}</span>
                        </div>
                      )) : (
                        <p>{t.adminNoData}</p>
                      )}
                    </div>
                  </article>
                </div>
              )
            )}
            {currentPage !== 'admin' && contentLocale.pages[currentPage].sections?.map((section) => (
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
                  <h3>{t.siteCreditsLabel}</h3>
                  <p>{currentCredits}</p>
                </article>
                <article className="page-article">
                  <h3>{t.siteCreditCostLabel}</h3>
                  <p>{GENERATION_COST}</p>
                </article>
              </div>
            )}

            {(currentPage === 'contact' || currentPage === 'terms') && (
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
                      <p><strong>{t.currentCredits(currentCredits)}</strong></p>
                      <p><strong>{t.subscriptionPlanLabel}</strong> {t.subscriptionPlanValue(userProfile.subscriptionPlan)}</p>
                      <div className="credit-cta-actions">
                        <button className="outline-btn auth-inline-btn" onClick={() => navigateToPage('site-management')} type="button">
                          {t.creditCheck}
                        </button>
                        <button className="outline-btn auth-inline-btn" onClick={() => navigateToPage('terms')} type="button">
                          {t.viewSubscription}
                        </button>
                      </div>
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
            setSubjectTypeManualOverride(false);
            setDetectedSubjectType(null);
            setPersonImage(null);
            setPersonFile(null);
            setPersonUploadMessage(null);
            setPersonPreviewState('loading');
            clearGeneratedVideo();
            void detectSubjectTypeFromImage(url);
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
            clearGeneratedVideo();
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
