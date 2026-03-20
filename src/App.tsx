import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './App.css';
import AuthModal from './components/AuthModal';
import ClothSampleModal from './components/ClothSampleModal';
import ContentModal from './components/ContentModal';
import SampleModal from './components/SampleModal';
import FAQSection from './components/seo/FAQSection';
import StructuredData from './components/seo/StructuredData';
import AdminDashboard from './features/admin/AdminDashboard';
import MyPageSection from './features/account/MyPageSection';
import BoardPage from './features/board/BoardPage';
import HowItWorksVisualGuide from './features/guide/HowItWorksVisualGuide';
import PaymentStatusPage from './features/payment/PaymentStatusPage';
import SharedResultSection from './features/shared/SharedResultSection';
import TryOnStudio from './features/tryon/TryOnStudio';
import { useAdminDashboardData } from './hooks/useAdminDashboardData';
import { useCreditBootstrap } from './hooks/useCreditBootstrap';
import { usePaymentSessionStatus } from './hooks/usePaymentSessionStatus';
import { useSharedResult } from './hooks/useSharedResult';
import { aboutFaqs, homeFaqs, howToUseFaqs, sampleOutfitsFaqs, type FAQItem } from './data/faq';
import {
  createBreadcrumbSchema,
  createFAQPageSchema,
  createOrganizationSchema,
  createWebPageSchema,
  createWebSiteSchema,
} from './lib/seo/schema';
import {
  getEditorialPage,
  getEditorialPageSummary,
  getEditorialPageTitle,
  getEditorialUiCopy,
  type EditorialFaqItem,
} from './lib/editorial';
import { getLandingContent } from './data/landingContent';
import {
  callCreditBootstrap,
  callCreateCheckoutSession,
  callSubjectClassifier,
  callTryOn,
} from './lib/api/hamdeva';
import { normalizeUserProfile } from './lib/profile';
import { LANGUAGE_OPTIONS, type LanguageCode } from './constants/languages';
import { clothSampleOptions, getOutfitPromptHints, getTraditionalOutfitGuides } from './data/clothSamples';
import { FACE_SAMPLES, getFaceSampleBreed, getPetBreedGuides, type FaceCategory } from './data/faceSamples';
import { getContentLocale, SITE_PAGES, type ModalTab, type SitePage } from './locales';
import { auth, db, firebaseConfigError, googleProvider, isFirebaseConfigured, missingFirebaseEnvKeys } from './firebase';
import type { User } from 'firebase/auth';
import { createUserWithEmailAndPassword, onAuthStateChanged, signInWithEmailAndPassword, signInWithPopup, signOut } from 'firebase/auth';
import { Timestamp, addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc, where } from 'firebase/firestore';
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
    adsbygoogle?: Array<Record<string, unknown>> & {
      pauseAdRequests?: number;
    };
  }
}

type ImageLoadState = 'idle' | 'loading' | 'ready' | 'error';
type FontTheme = 'latin' | 'korean' | 'japanese' | 'chinese' | 'arabic' | 'indic';
const APP_VERSION = __APP_VERSION__;
const GENERATION_DURATION_CACHE_KEY = 'HAMDEVA-generation-durations';
const GENERATION_PREP_TIMEOUT_MS = 60_000;
const GENERATION_AUTH_TIMEOUT_MS = 15_000;
const GENERATION_REQUEST_TIMEOUT_MS = 75_000;
const GENERATION_IMAGE_READY_TIMEOUT_MS = 15_000;
const HISTORY_RETENTION_MS = 15 * 24 * 60 * 60 * 1000;
const PRESERVED_HISTORY_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const PRESERVED_HISTORY_LIMIT = 5;
const SUBJECT_TYPES = ['dog', 'cat'] as const;
type CreditProductKind = 'subscription' | 'extra_credit';
type CreditProduct = {
  id: CheckoutProductId;
  kind: CreditProductKind;
  label: string;
  paidCredit: number;
  salePriceUsd: number;
  comparePriceUsd?: number;
  description: string;
  badge?: string;
  bonusEligible?: boolean;
};
const CREDIT_PRODUCTS = [
  { id: 'starter', kind: 'subscription', label: 'Starter', paidCredit: 1000, salePriceUsd: 6.99, comparePriceUsd: 9.99, description: 'Ideal for light use', bonusEligible: true },
  { id: 'popular', kind: 'subscription', label: 'Popular', paidCredit: 5000, salePriceUsd: 12.90, description: 'Best for most users', badge: 'Most Popular', bonusEligible: true },
  { id: 'pro', kind: 'subscription', label: 'Pro', paidCredit: 10000, salePriceUsd: 49.90, description: 'For heavy and frequent use', bonusEligible: true },
  { id: 'small_pack', kind: 'extra_credit', label: 'Small Pack', paidCredit: 1000, salePriceUsd: 12.90, description: 'Instant extra credits when you need a quick refill' },
  { id: 'medium_pack', kind: 'extra_credit', label: 'Medium Pack', paidCredit: 5000, salePriceUsd: 59.00, description: 'A larger refill for ongoing pet fitting sessions' },
  { id: 'large_pack', kind: 'extra_credit', label: 'Large Pack', paidCredit: 10000, salePriceUsd: 99.90, description: 'Best when you need a big extra credit top-up right away' },
] as const satisfies readonly CreditProduct[];
const ADMIN_EMAIL = 'dlgksxk@gmail.com';
const KAKAO_SDK_URL = 'https://developers.kakao.com/sdk/js/kakao.min.js';
const KAKAO_JS_KEY = (import.meta.env.VITE_KAKAO_JS_KEY as string | undefined)?.trim();
const SITE_URL = 'https://hamdeva.com';
const ADSENSE_CLIENT_ID = 'ca-pub-1448821236094477';
const ADSENSE_SCRIPT_SRC = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT_ID}`;
const ADSENSE_SCRIPT_ID = 'hamdeva-adsense-loader';
const PREVIEW_HOST_MARKERS = ['pages.dev', 'workers.dev'];
const SUPPORTED_UI_LANGUAGE_CODES = ['en', 'ko', 'ja', 'zh'] as const;
const VISIBLE_LANGUAGE_OPTIONS = LANGUAGE_OPTIONS.filter((option) =>
  SUPPORTED_UI_LANGUAGE_CODES.includes(option.value as (typeof SUPPORTED_UI_LANGUAGE_CODES)[number]),
);
const HEADER_NAV_PAGES: SitePage[] = ['home', 'about', 'how-it-works', 'traditional-clothing', 'sample-friends', 'fashion-technology', 'pricing', 'mypage'];
const MOBILE_NAV_PAGES: SitePage[] = ['home', 'about', 'how-it-works', 'traditional-clothing', 'sample-friends', 'fashion-technology', 'pricing'];
const FOOTER_EDITORIAL_PAGES: SitePage[] = [
  'about',
  'how-it-works',
  'traditional-clothing',
  'sample-friends',
  'fashion-technology',
  'pricing',
  'virtual-try-on-guide',
  'outfit-photo-tips',
  'ai-fitting-faq',
];
const FOOTER_UTILITY_PAGES: SitePage[] = ['privacy', 'refund-policy', 'terms', 'contact'];
const EDITORIAL_AD_PAGES = new Set<SitePage>([
  'about',
  'how-it-works',
  'traditional-clothing',
  'sample-friends',
  'countries',
  'fashion-technology',
  'pricing',
  'virtual-try-on-guide',
  'outfit-photo-tips',
  'ai-fitting-faq',
]);
const getHomeQuickCopy = (lang: LanguageCode) => {
  if (lang === 'ko') {
    return {
      previewEyebrow: '결과 예시',
      previewTitle: '이런 흐름으로 바로 결과를 만들어요',
      previewBody: '반려동물 사진과 의상 이미지를 넣으면, 귀여운 결과 예시처럼 빠르게 비교할 수 있습니다.',
      petLabel: '반려동물 사진',
      outfitLabel: '의상 이미지',
      resultLabel: '결과 예시',
      ctaTitle: '지금 바로 시작해보세요',
      ctaBody: '반려동물 의상 미리보기를 몇 초 안에 만들어볼 수 있어요.',
    };
  }
  if (lang === 'ja') {
    return {
      previewEyebrow: '結果プレビュー',
      previewTitle: 'こんな流れですぐに結果を作れます',
      previewBody: 'ペット写真と衣装画像を入れるだけで、かわいい結果をすばやく比較できます。',
      petLabel: 'ペット写真',
      outfitLabel: '衣装画像',
      resultLabel: '結果イメージ',
      ctaTitle: '今すぐ試してみましょう',
      ctaBody: '数秒でペット衣装プレビューを作れます。',
    };
  }
  if (lang === 'zh') {
    return {
      previewEyebrow: '结果预览',
      previewTitle: '按这个流程就能快速生成结果',
      previewBody: '上传宠物照片和服装图片后，就能像下面这样快速看到可爱的效果预览。',
      petLabel: '宠物照片',
      outfitLabel: '服装图片',
      resultLabel: '结果示例',
      ctaTitle: '现在就试试看',
      ctaBody: '几秒内就能生成宠物穿搭预览。',
    };
  }
  return {
    previewEyebrow: 'Preview',
    previewTitle: 'See the result before you scroll',
    previewBody: 'Upload your pet, add an outfit image, and get a cute preview like this in seconds.',
    petLabel: 'Pet photo',
    outfitLabel: 'Outfit image',
    resultLabel: 'Result preview',
    ctaTitle: 'Try it now',
    ctaBody: 'Create your pet outfit preview in seconds.',
  };
};
const getAboutVisualCopy = (lang: LanguageCode) => {
  if (lang === 'ko') {
    return {
      eyebrow: 'ABOUT HAMDEVA',
      title: '반려동물 사진 한 장에서 시작되는 스타일 실험',
      body: 'HAMDEVA는 펫 사진, 의상 이미지, 결과 미리보기를 한 흐름으로 연결해 반려동물 스타일 아이디어를 빠르게 비교하도록 만든 서비스입니다.',
      petLabel: '반려동물 사진',
      outfitLabel: '의상 이미지',
      resultLabel: '펫 피팅 결과',
      cards: [
        {
          title: '왜 만들었나요?',
          body: '막상 옷을 사거나 촬영을 준비하기 전에, 우리 아이에게 어떤 분위기가 어울릴지 먼저 보고 싶은 순간이 많기 때문입니다.',
        },
        {
          title: '어떻게 읽으면 좋을까요?',
          body: 'HAMDEVA는 정답을 주는 도구보다 비교를 돕는 도구에 가깝습니다. 여러 의상 중 어떤 방향이 더 잘 맞는지 빠르게 좁혀볼 수 있습니다.',
        },
        {
          title: '언제 유용할까요?',
          body: '기념 촬영, SNS 공유, 시즌 코스튬, 선물용 의상 고민처럼 실제 구매와 촬영 전에 가볍게 미리 보는 용도로 잘 맞습니다.',
        },
      ],
    };
  }
  if (lang === 'ja') {
    return {
      eyebrow: 'ABOUT HAMDEVA',
      title: 'ペット写真から始まるスタイルの比較体験',
      body: 'HAMDEVA はペット写真、衣装画像、結果プレビューを一つの流れでつなぎ、ペットのスタイルアイデアをすばやく比べられるようにしたサービスです。',
      petLabel: 'ペット写真',
      outfitLabel: '衣装画像',
      resultLabel: 'ペット試着結果',
      cards: [
        { title: 'なぜ作られたのか', body: '衣装を買う前や撮影前に、まず似合う雰囲気を見たい場面が多いからです。' },
        { title: 'どう見るべきか', body: 'HAMDEVA は最終回答よりも比較のためのプレビューです。どの方向が合うかを早く絞れます。' },
        { title: 'どんな時に役立つか', body: '記念撮影、SNS 共有、季節コスチューム、イベント準備の前段階で特に便利です。' },
      ],
    };
  }
  if (lang === 'zh') {
    return {
      eyebrow: 'ABOUT HAMDEVA',
      title: '从一张宠物照片开始的穿搭比较体验',
      body: 'HAMDEVA 把宠物照片、服装图片和结果预览连接成一个清晰流程，让你更快比较宠物穿搭灵感。',
      petLabel: '宠物照片',
      outfitLabel: '服装图片',
      resultLabel: '宠物试穿结果',
      cards: [
        { title: '为什么做这个服务', body: '很多时候在购买或拍摄前，用户更想先知道自己的宠物适合什么样的气质。' },
        { title: '应该如何理解结果', body: 'HAMDEVA 更像比较工具，而不是最终答案。它适合先筛选方向，再做下一步决定。' },
        { title: '适合哪些场景', body: '纪念拍摄、社交分享、节日服装和活动准备前，都很适合先用它看看预览。' },
      ],
    };
  }
  return {
    eyebrow: 'ABOUT HAMDEVA',
    title: 'A quick way to compare pet outfit ideas',
    body: 'HAMDEVA connects a pet photo, an outfit image, and a result preview so you can compare cute style directions before you commit to one.',
    petLabel: 'Pet photo',
    outfitLabel: 'Outfit image',
    resultLabel: 'Pet fitting result',
    cards: [
      { title: 'Why it exists', body: 'Many people want to check the mood of an outfit before they buy, plan, or share something for their dog or cat.' },
      { title: 'How to use it', body: 'HAMDEVA works best as an early comparison tool. It helps you narrow ideas and spot what feels right first.' },
      { title: 'Where it helps', body: 'It is useful for themed shoots, social posts, holiday looks, and playful outfit planning before the real step.' },
    ],
  };
};
const getStyleGuideVisualCopy = (lang: LanguageCode) => {
  if (lang === 'ko') {
    return {
      eyebrow: 'PET STYLE GUIDE',
      title: '반려동물 의상을 고를 때 먼저 보면 좋은 기준',
      body: '펫 스타일 가이드는 어떤 의상이 사진에서 잘 보이는지, 언제 코트가 필요한지, 어떤 룩이 과해지기 쉬운지를 빠르게 훑어보게 도와주는 페이지입니다.',
      petLabel: '펫 기준 사진',
      outfitLabel: '의상 기준 이미지',
      resultLabel: '비교용 결과',
      cards: [
        { title: '계절과 체온', body: '짧은 털, 작은 체구, 젖은 산책 환경에서는 보온 의상이 더 필요할 수 있고, 더운 날씨에는 장식보다 통기성과 과열 방지가 우선입니다.' },
        { title: '핏과 움직임', body: '움직임을 막거나 목, 가슴, 다리 주변을 과하게 조이는 옷은 사진상으로도 답답해 보이기 쉽습니다. 눈으로 보기만 예쁜지, 움직이기에도 편해 보이는지 함께 봐야 합니다.' },
        { title: '강아지와 고양이 차이', body: '강아지는 산책·야외 상황을 먼저 고려하는 경우가 많고, 고양이는 실내 적응과 거부감 여부를 더 먼저 보는 편이 좋습니다.' },
        { title: '사진에서 잘 보이는 룩', body: '얼굴 주변이 너무 복잡하지 않고, 몸통 실루엣과 장식 위치가 분명한 의상일수록 결과 비교가 쉽고 공유 이미지로도 보기 좋습니다.' },
      ],
    };
  }
  if (lang === 'ja') {
    return {
      eyebrow: 'PET STYLE GUIDE',
      title: 'ペット衣装を選ぶ前に見ておきたい基準',
      body: 'このページは、どんな衣装が写真で見やすいか、どんな時に防寒が必要か、どこから過剰になりやすいかを先に整理するためのガイドです。',
      petLabel: 'ペット基準写真',
      outfitLabel: '衣装基準画像',
      resultLabel: '比較用結果',
      cards: [
        { title: '季節と体温', body: '短毛、小型、寒い日や濡れた散歩では保温が役立つ場合があり、暑い日は見た目より通気性と熱のこもりに注意が必要です。' },
        { title: 'フィットと動き', body: '首、胸、脚まわりを締めすぎる服は、見た目だけでなく動きやすさの面でも不利です。' },
        { title: '犬と猫の違い', body: '犬は屋外や散歩条件、猫は室内適応とストレスの少なさを先に考えると判断しやすくなります。' },
        { title: '写真で見やすいルック', body: '顔まわりが重すぎず、輪郭と装飾位置が読みやすい服ほど比較しやすくなります。' },
      ],
    };
  }
  if (lang === 'zh') {
    return {
      eyebrow: 'PET STYLE GUIDE',
      title: '给宠物选衣服前先看这些标准',
      body: '这页会先帮你整理：什么衣服在照片里更好看、什么时候更需要保暖、什么造型容易看起来过重。',
      petLabel: '宠物参考照片',
      outfitLabel: '服装参考图片',
      resultLabel: '对比结果',
      cards: [
        { title: '季节与体温', body: '短毛、小体型、寒冷或潮湿环境下更可能需要保暖；天气热时则应优先避免闷热和过热。' },
        { title: '版型与活动', body: '过紧或限制颈部、胸口、腿部活动的衣服，不只不舒服，照片里也容易显得别扭。' },
        { title: '狗和猫的差异', body: '狗更常先考虑散步与户外环境，猫则更需要优先考虑室内适应和抗拒程度。' },
        { title: '更适合拍照的造型', body: '脸部周围不过于复杂、身体轮廓清楚、装饰位置明确的服装，更适合做预览和分享。' },
      ],
    };
  }
  return {
    eyebrow: 'PET STYLE GUIDE',
    title: 'Practical filters for better pet outfit ideas',
    body: 'This page helps you judge which outfits are easier to read in photos, when warmth matters, and which styling choices look cute without becoming too much.',
    petLabel: 'Pet reference',
    outfitLabel: 'Outfit reference',
    resultLabel: 'Preview result',
    cards: [
      { title: 'Season and temperature', body: 'Short-haired or smaller pets may need more warmth in cold conditions, while hot weather makes breathability and overheating risk more important than decoration.' },
      { title: 'Fit and movement', body: 'Outfits that squeeze the neck, chest, or legs can look awkward in photos and feel restrictive in real use. Style works best when it still looks easy to move in.' },
      { title: 'Dog vs. cat context', body: 'Dogs are often evaluated around walks and weather, while cats usually need more emphasis on indoor comfort and tolerance.' },
      { title: 'What reads well on camera', body: 'Cleaner face framing, visible body shape, and readable trim placement usually create stronger previews and better shareable images.' },
    ],
  };
};

const getPricingUiCopy = (lang: LanguageCode) => {
  if (lang === 'ko') {
    return {
      subscriptionTitle: 'Choose Your Plan',
      subscriptionSubtitle: '구독 플랜을 선택하고 매달 반려동물 피팅 크레딧을 받아보세요.',
      extraCreditsTitle: 'Need More Credits?',
      extraCreditsSubtitle: '구독 보너스 없이 필요한 만큼 추가 크레딧을 바로 구매할 수 있습니다.',
      firstPurchaseBonus: 'First purchase bonus: +20% extra credits (one-time only)',
      subscribeCta: 'Subscribe',
      buyCreditsCta: 'Buy Credits',
      subscriptionIntro: '구독 플랜은 첫 결제 1회에 한해 20% 추가 크레딧이 적용됩니다.',
      extraCreditsIntro: '추가 크레딧은 구독과 별개로 즉시 충전되며 첫 결제 보너스는 적용되지 않습니다.',
      descriptionById: {
        starter: '가볍게 시작하기 좋은 플랜',
        popular: '가장 많은 사용자가 선택하는 플랜',
        pro: '자주 생성하는 사용자를 위한 플랜',
        small_pack: '빠르게 부족한 크레딧을 채우는 소형 팩',
        medium_pack: '추가 생성이 필요한 순간에 바로 쓰는 중형 팩',
        large_pack: '대량 생성 전에 한 번에 보충하는 대형 팩',
      } as Record<CheckoutProductId, string>,
    };
  }
  if (lang === 'ja') {
    return {
      subscriptionTitle: 'Choose Your Plan',
      subscriptionSubtitle: '毎月の利用量に合わせてサブスクリプションを選べます。',
      extraCreditsTitle: 'Need More Credits?',
      extraCreditsSubtitle: 'サブスクリプション特典なしで追加クレジットをすぐ購入できます。',
      firstPurchaseBonus: 'First purchase bonus: +20% extra credits (one-time only)',
      subscribeCta: 'Subscribe',
      buyCreditsCta: 'Buy Credits',
      subscriptionIntro: 'サブスクリプションは初回決済時のみ 20% 追加クレジットの対象です。',
      extraCreditsIntro: '追加クレジットは即時購入用で、初回購入ボーナスは適用されません。',
      descriptionById: {
        starter: '軽い利用に向いたプラン',
        popular: '多くのユーザーに最適なプラン',
        pro: '高頻度で使う方向けのプラン',
        small_pack: '少量をすぐ補充したい時の追加パック',
        medium_pack: '継続利用向けの追加クレジット',
        large_pack: '多めにまとめて補充したい時の追加クレジット',
      } as Record<CheckoutProductId, string>,
    };
  }
  if (lang === 'zh') {
    return {
      subscriptionTitle: 'Choose Your Plan',
      subscriptionSubtitle: '选择适合你使用频率的订阅方案。',
      extraCreditsTitle: 'Need More Credits?',
      extraCreditsSubtitle: '无需订阅奖励，也可以立即购买额外积分。',
      firstPurchaseBonus: 'First purchase bonus: +20% extra credits (one-time only)',
      subscribeCta: 'Subscribe',
      buyCreditsCta: 'Buy Credits',
      subscriptionIntro: '订阅方案仅在首次付款时享受一次性 20% 额外积分。',
      extraCreditsIntro: '额外积分可立即购买，不适用首次购买奖励。',
      descriptionById: {
        starter: '适合轻度使用',
        popular: '最适合大多数用户',
        pro: '适合高频和重度使用',
        small_pack: '适合临时补充少量积分',
        medium_pack: '适合继续生成时快速补充',
        large_pack: '适合一次性补充大量积分',
      } as Record<CheckoutProductId, string>,
    };
  }
  return {
    subscriptionTitle: 'Choose Your Plan',
    subscriptionSubtitle: 'Pick a subscription that matches how often you create pet fitting previews.',
    extraCreditsTitle: 'Need More Credits?',
    extraCreditsSubtitle: 'Purchase additional credits instantly without a subscription bonus.',
    firstPurchaseBonus: 'First purchase bonus: +20% extra credits (one-time only)',
    subscribeCta: 'Subscribe',
    buyCreditsCta: 'Buy Credits',
    subscriptionIntro: 'Subscription plans include a one-time +20% extra credits message for the first purchase only.',
    extraCreditsIntro: 'Extra credits are separate one-time purchases and do not include the first purchase bonus.',
    descriptionById: {
      starter: 'Ideal for light use',
      popular: 'Best for most users',
      pro: 'For heavy and frequent use',
      small_pack: 'Instant extra credits for quick top-ups',
      medium_pack: 'More credits when you need continued usage',
      large_pack: 'A larger refill for heavy extra demand',
    } as Record<CheckoutProductId, string>,
  };
};
type SubjectType = typeof SUBJECT_TYPES[number];
type CheckoutProductId = typeof CREDIT_PRODUCTS[number]['id'];
type CreditKind = 'daily' | 'paid';
type AuthMode = 'login' | 'signup';
type SubscriptionPlan = 'free' | 'basic' | 'pro';
type UserRole = 'user' | 'admin';

interface UserProfile {
  email: string;
  dailyCredit: number;
  paidCredit: number;
  credits: number;
  totalGenerated: number;
  isSubscribed: boolean;
  subscriptionPlan: SubscriptionPlan;
  role: UserRole;
  createdAt?: Timestamp | null;
  lastDailyResetAt?: Timestamp | null;
  lastLoginAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

interface GenerationRecord {
  id: string;
  uid: string;
  imageUrl?: string | null;
  subjectType?: SubjectType;
  personInputLabel?: string | null;
  garmentInputLabel?: string | null;
  personPreviewUrl?: string | null;
  garmentPreviewUrl?: string | null;
  requestId?: string;
  resultType?: 'image_generation' | 'video_generation';
  videoRequestId?: string | null;
  preservedUntil?: Timestamp | null;
  preservedAt?: Timestamp | null;
  expiresAt?: Timestamp | null;
  status?: string;
  usedCreditType?: CreditKind;
  usedCreditAmount?: number;
  watermarkApplied?: boolean;
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

interface BoardNoticeRecord {
  id: string;
  title: string;
  content: string;
  authorUid?: string | null;
  authorEmail?: string | null;
  createdAt?: Timestamp | null;
  updatedAt?: Timestamp | null;
}

// ─── 번역 ─────────────────────────────────────────────────────
const translations = {
  ko: {
    navFeatures: '기능 소개', navHowto: '사용 방법', navFaq: 'FAQ',
    heroEyebrow: 'AI 기반 펫 피팅 서비스',
    heroTitle: '우리 집 반려동물의\n귀여운 스타일 미리보기',
    heroSub: '단 한 장의 반려동물 사진으로\n어울리는 의상 분위기를\n빠르게 미리 보여드립니다',
    heroCta: '펫 피팅 시작하기',
    featuresTitle: '왜 HAMDEVA인가요?', featuresSub: '빠르고, 정확하고, 누구나 쉽게 사용할 수 있습니다.',
    f1Title: 'AI 펫 피팅', f1Desc: 'HAMDEVA AI가 반려동물 사진과 의상을 분석하여 자연스러운 펫 의상 미리보기를 생성합니다.',
    f2Title: '즉시 결과 확인', f2Desc: '반려동물 사진과 의상 이미지를 올리면 수 초 안에 결과를 확인할 수 있습니다.',
    f3Title: '프라이버시 보호', f3Desc: '모든 이미지 처리는 브라우저에서 이루어지며, 사진이 별도로 저장되거나 공유되지 않습니다.',
    f4Title: '모바일 완벽 지원', f4Desc: '스마트폰, 태블릿, PC 어디서든 동일한 품질로 이용할 수 있습니다.',
    howTitle: '이렇게 사용하세요', howSub: '단 3단계로 반려동물 피팅을 시작할 수 있습니다.',
    h1Step: 'Step 01', h1Title: '반려동물 사진 업로드', h1Desc: '강아지나 고양이가 잘 보이는 사진을 업로드하세요. 배경이 단순하고 자세가 분명하면 결과 품질이 높아집니다.',
    h2Step: 'Step 02', h2Title: '옷 사진 업로드', h2Desc: '입어보고 싶은 의상 사진을 업로드하세요. 단독 제품 컷 또는 모델 착용 사진 모두 가능합니다.',
    h3Step: 'Step 03', h3Title: 'AI 합성 & 저장', h3Desc: 'AI 생성 버튼을 누르면 자동으로 분석 및 합성이 이루어집니다. 결과 이미지는 바로 저장할 수 있습니다.',
    tryTitle: '지금 바로 시작해보세요', trySub: '회원가입 시 300 크레딧이 한 번 지급됩니다.',
    step1Label: 'Step 1', step1Title: '반려동물 사진 등록', step1Desc: '반려동물이 잘 보이는 사진을 선택하거나 샘플을 불러오세요',
    step2Label: 'Step 2', step2Title: '의상 사진 등록', step2Desc: '입혀보고 싶은 의상 사진을 선택하거나 샘플 의상을 골라보세요',
    faceCopyrightNotice: '',
    clothingSafetyNotice: '',
    resultPrivacyNotice: '본 이미지는 저장되지 않으며, 결과 확인과 다운로드 용도로만 일시적으로 처리됩니다.',
    chooseSample: '샘플 펫 선택',
    uploadMyPhoto: '내 반려동물 사진 업로드',
    chooseClothingSample: '샘플 의상 선택',
    uploadClothing: '의상 사진 업로드',
    preparingPersonUpload: '이미지를 업로드하기 좋게 정리하고 있습니다...',
    preparingClothingUpload: '큰 의상 이미지를 자동으로 최적화하고 있습니다...',
    loadingImage: '이미지 불러오는 중...',
    imageLoadError: '이미지를 불러올 수 없습니다.',
    facePlaceholderTitle: '반려동물 사진을 넣어주세요',
    clothingPlaceholderTitle: '의상 사진을 넣어주세요',
    renderingResult: '결과 이미지 렌더링 중...',
    resultDisplayError: '결과 이미지를 표시할 수 없습니다.',
    clothingSamplesPending: '샘플 의상 데이터 준비 중입니다.',
    generate: '펫 피팅 시작하기', generating: 'AI 분석 중...',
    loadingDetail: 'HAMDEVA AI가 반려동물 사진과 의상을 분석하고 있습니다...',
    generationEstimateNotice: '인터넷 상태와 업로드 이미지 크기에 따라 실제 완료 시간은 달라질 수 있습니다.',
    alertBoth: '반려동물 사진과 의상 사진을 모두 업로드해주세요!', alertError: '이미지 생성에 실패했습니다. 다시 시도해주세요.', generationConfigError: '이미지 생성 설정이 아직 완료되지 않았습니다. 잠시 후 다시 시도해주세요.',
    resultTitle: '피팅 결과', download: '이미지 저장하기',
    share: '공유하기',
    realGenerationCta: '',
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
    tryAnotherOutfit: '다른 펫 의상 입혀보기',
    randomOutfit: '랜덤 의상',
    resultNotFound: '공유된 결과를 찾을 수 없습니다.',
    shareOnX: 'X에 공유',
    shareOnFacebook: 'Facebook에 공유',
    shareLinkUnavailable: '공유 링크를 준비하는 중입니다.',
    sharedResultTitle: '공유된 펫 피팅 결과',
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
    loginForFree: '회원가입 시 300 크레딧이 한 번 지급됩니다.',
    credits: '크레딧',
    currentCredits: (n: number) => `현재 보유 크레딧: ${n}`,
    dailyCreditLabel: '무료 크레딧',
    paidCreditLabel: '유료 크레딧',
    totalCreditLabel: '총 크레딧',
    generationCost: '1회 생성 = 100 크레딧',
    generationCostDetailed: (n: number) => `1회 생성 = ${n} 크레딧`,
    signUpGetCredits: '회원가입하고 300 크레딧 받기',
    dailyLoginCredits: '매일 로그인 크레딧 없음',
    subscriptionCreditBonus: '구독 추가 크레딧은 준비 중',
    notEnoughCredits: '크레딧이 부족합니다.',
    refundedAfterFailure: '이미지 생성에 실패하여 100 크레딧이 환불되었습니다.',
    paymentConfigError: '결제 설정이 아직 완료되지 않았습니다. 잠시 후 다시 시도해 주세요.',
    duplicateRequestBlocked: '이미 생성 요청이 처리 중입니다. 잠시 후 다시 시도해 주세요.',
    todayDailyRewardGranted: '',
    todayDailyRewardAlreadyClaimed: '',
    subscriptionBonusGranted: (n: number) => `구독 보너스 ${n} 크레딧이 추가 지급되었습니다.`,
    signupBonusGranted: (n: number) => `회원가입 보너스 ${n} 크레딧이 지급되었습니다.`,
    viewSubscription: '구독 보기',
    creditCheck: '크레딧 확인',
    subscriptionPlanLabel: '구독 플랜',
    subscriptionPlanValue: (plan: string) => plan === 'pro' ? 'PRO' : plan === 'basic' ? 'BASIC' : 'FREE',
    siteCreditsLabel: '현재 크레딧',
    siteCreditCostLabel: '생성 비용',
    authSignupCreditsHint: '회원가입 시 300 크레딧 지급',
    chargeCredits: '크레딧 충전',
    chargeDescription: '무료 크레딧이 먼저 사용되고, 부족하면 유료 크레딧이 차감됩니다.',
    purchaseNow: '구매하기',
    paymentRedirecting: '결제창으로 이동 중...',
    paymentSuccessTitle: '결제가 완료되었습니다',
    paymentSuccessReady: '결제가 확인되어 유료 크레딧이 지급되었습니다.',
    paymentFailedTitle: '결제가 완료되지 않았습니다',
    paymentFailedDescription: '결제가 취소되었거나 실패했습니다. 다시 시도해 주세요.',
    paymentVerifying: '결제 확인 중입니다. 잠시만 기다려 주세요.',
    paymentVerifyFailed: '결제 상태를 확인하지 못했습니다. 잠시 후 마이페이지에서 다시 확인해 주세요.',
    paymentSessionLabel: '결제 세션',
    goToMyPage: '마이페이지로 이동',
    starterProductName: 'starter',
    popularProductName: 'popular',
    proProductName: 'pro',
    freeResultNoticeTitle: '이미지에 워터마크가 적용됩니다.',
    freeResultNoticeBody: '모든 이미지 결과에는 HAMDEVA AI 워터마크가 포함됩니다.',
    watermarkEnabled: '워터마크 적용',
    watermarkRemoved: '워터마크 없음',
    adminNav: '관리',
    adminTitle: '관리자 페이지',
    adminSubtitle: '운영 지표와 최근 활동을 한 화면에서 확인할 수 있습니다.',
    adminAccessDenied: '관리자 권한이 필요합니다.',
    adminDashboard: '대시보드 요약',
    adminUsersSection: '최근 사용자',
    adminMemberListSection: '회원 리스트',
    adminBoardSection: '최근 게시글',
    adminGenerationSection: '최근 생성 활동',
    adminCreditsSection: '최근 크레딧 로그',
    adminPaymentsSection: '결제 로그',
    adminActivitiesSection: '활동 로그',
    adminLogsTitle: '관리자 로그',
    adminLogsSubtitle: '로그는 탭을 열었을 때만 불러오며, 자동 새로고침하지 않습니다.',
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
    adminUsersSectionHelper: '최근 사용자 프리뷰는 유지하고, 전체 검색/선물은 별도 모달에서만 조회합니다.',
    adminMemberListHelper: '최근 사용자와 같은 형식으로 전체 회원을 바로 조회하고 관리할 수 있습니다.',
    adminOpenUserList: '사용자 검색 / 선물',
    adminUserListTitle: '사용자 리스트',
    adminUserListSubtitle: 'ID(uid), 이메일, 닉네임 또는 displayName 기준으로 필요할 때만 조회합니다.',
    adminUserSearchLabel: '사용자 검색',
    adminUserSearchPlaceholder: 'uid / email / displayName',
    adminUserSearchHint: 'ID(uid), 이메일, 닉네임 또는 displayName prefix 검색을 지원합니다. 검색어가 없으면 최근 사용자 20명을 조회합니다.',
    adminMemberListSearchHint: '회원 리스트에서는 이메일이 등록된 실제 회원만 검색 결과에 표시합니다.',
    adminUserListLoading: '사용자 목록을 불러오는 중입니다...',
    adminUserListLoadingMore: '불러오는 중...',
    adminUserSearchEmpty: '검색 결과가 없습니다.',
    adminLoadMore: '더 보기',
    refresh: '새로고침',
    adminDisplayName: '닉네임 / 이름',
    adminLastLoginAt: '최근 로그인',
    adminDailyCredit: 'dailyCredit',
    adminPaidCredit: 'paidCredit',
    adminSubscribed: '구독',
    adminSubscribedYes: 'Y',
    adminSubscribedNo: 'N',
    adminSubscribedYesLabel: '구독 중',
    adminSubscribedNoLabel: '미구독',
    adminTotalGenerated: '총 생성 수',
    adminActions: '작업',
    adminDetailButton: '상세보기',
    adminGiftButton: '선물하기',
    adminUserDetailTitle: '사용자 상세',
    adminUserDetailHint: '목록 행 클릭 또는 상세보기 버튼으로 선택한 사용자 정보입니다.',
    adminUserDetailLoading: '사용자 상세를 불러오는 중입니다...',
    adminUserDetailEmpty: '상세를 보려면 사용자를 선택하세요.',
    adminUpdatedAt: '수정일',
    adminGiftModalTitle: '크레딧 선물',
    adminGiftModalSubtitle: '선물은 즉시 지급되며, 사용자 로그인 팝업/알림은 생성하지 않습니다.',
    adminGiftTargetUid: '대상 사용자 uid',
    adminGiftAmount: '크레딧 수량 amount',
    adminGiftTitleLabel: '선물 제목 title',
    adminGiftMessageLabel: '선물 메시지 message',
    adminGiftSenderLabel: '발송자 표시명 senderName',
    adminGiftAdminMemoLabel: '내부 관리자 메모 adminMemo',
    adminGiftSubmitting: '지급 중...',
    adminGiftSubmit: '즉시 지급',
    adminGiftSuccess: '크레딧 선물이 즉시 지급되었습니다.',
    adminGiftFailed: '크레딧 선물 지급에 실패했습니다.',
    adminGiftInvalidAmount: '선물 크레딧 수량은 1 이상이어야 합니다.',
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
      { q: '크레딧은 어떻게 지급되나요?', a: '회원가입 시 300 크레딧이 한 번 지급됩니다. 현재는 매일 로그인 보너스는 제공하지 않습니다.' },
      { q: '어떤 사진을 올려야 가장 좋은 결과가 나오나요?', a: '반려동물 사진은 배경이 단순하고 얼굴과 상반신이 잘 보이는 정면 사진을 권장합니다. 의상 사진은 제품 단독 컷이나 착용 예시 이미지가 적합합니다.' },
      { q: '합성 결과가 마음에 들지 않으면 어떻게 하나요?', a: '다른 사진으로 다시 시도해보세요. 반려동물 사진의 배경이 단순할수록, 의상 사진이 선명할수록 더 좋은 결과가 나옵니다.' },
      { q: '모바일에서도 사용할 수 있나요?', a: '네. HAMDEVA는 모바일 퍼스트로 설계되어 스마트폰과 태블릿에서도 최적화된 환경을 제공합니다.' },
      { q: '내 사진은 저장되나요?', a: '결제 및 처리 목적으로 일시적으로 전송되며, 별도로 저장하거나 다른 목적으로 사용하지 않습니다.' },
    ],
    footer: '© 2025 HAMDEVA. All rights reserved.',
    footerPrivacy: '개인정보 처리방침', footerTerms: '이용약관', footerAbout: '서비스 소개',
    comingSoon: '준비 중',
    languageLabel: '언어',
    lightMode: '라이트 모드',
    darkMode: '다크 모드',
    closeMobileMenu: '모바일 메뉴 닫기',
    shareDefaultText: 'HAMDEVA에서 반려동물 AI 피팅을 체험해봤어요',
    paymentFailedMessage: '결제가 실패했습니다.',
    cancel: '취소',
    logoutConfirmTitle: '로그아웃',
    logoutConfirmBody: '정말 로그아웃하시겠습니까?',
    logoutConfirmAction: '로그아웃',
    generationRemainingLabel: '예상 완료까지',
    resultPreviewZoomOut: '축소',
    resultPreviewZoomIn: '확대',
    resultPreviewLoading: '결과를 불러오는 중입니다...',
    resultPreviewLoadFailed: '결과를 불러오지 못했습니다.',
    resultPreviewAlt: '확대된 결과 이미지',
    historyTitle: '펫 피팅 히스토리',
    historyGuide: '생성물은 기본 15일 보관되며, 최대 5개까지 30일 보관할 수 있습니다.',
    historyEmpty: '생성 이력이 없습니다.',
    historyPreviewClose: '클릭하여 닫기',
    historyPreviewOpen: '클릭하여 아래에서 보기',
    historyExpiresAt: '만료일',
    close: '닫기',
    historyZoomOut: '-',
    historyZoomReset: '기본 크기',
    historyZoomIn: '+',
    historyLoading: '불러오는 중...',
    historyZoomHint: '이미지 전체가 보이도록 기본 크기를 절반으로 줄였습니다. 필요하면 + / - 버튼으로만 조절할 수 있습니다.',
    historyDownload: '다운로드',
    historyArchived: '보관됨',
    historyArchive: '보관',
    historyDelete: '삭제',
    historyProcessing: '처리 중...',
    historyArchiveLimit: (n: number) => `보관은 최대 ${n}개까지 가능합니다.`,
    historyArchiveFailed: '보관 상태를 변경하지 못했습니다. 잠시 후 다시 시도해 주세요.',
    historyDownloadFailed: '결과물을 다운로드하지 못했습니다. 잠시 후 다시 시도해 주세요.',
    historyDeleteConfirm: '이 결과물을 히스토리에서 삭제하시겠습니까?',
    historyDeleteFailed: '히스토리 삭제에 실패했습니다. 잠시 후 다시 시도해 주세요.',
    savePercent: (n: number) => `${n}% 할인`,
    saveAmountOff: (amount: string) => `${amount} 절약`,
    adminGenerationType: '유형',
    adminGenerationSubject: '피사체',
    adminPaymentProvider: '결제사',
    adminPaymentProduct: '상품',
    adminActivityUserId: '사용자 ID',
    adminActivityTitle: '제목',
    adminActivitySender: '발송자',
    adminSummaryLoadFailed: '관리자 데이터를 불러오지 못했습니다.',
  },
  en: {
    navFeatures: 'Features', navHowto: 'How It Works', navFaq: 'FAQ',
    heroEyebrow: 'AI-Powered Pet Fitting',
    heroTitle: 'Cute Pet Looks\nBefore You Dress Up',
    heroSub: "All you need is one pet photo. HAMDEVA creates a playful outfit preview in seconds.",
    heroCta: 'Start Pet Fitting',
    featuresTitle: 'Why HAMDEVA?', featuresSub: 'Fast, accurate, and easy to use for everyone.',
    f1Title: 'AI Pet Fitting', f1Desc: 'HAMDEVA AI analyzes your pet photo and outfit image to generate a natural-looking pet outfit preview.',
    f2Title: 'Instant Results', f2Desc: 'Upload a pet photo and an outfit image, then review the result in seconds.',
    f3Title: 'Privacy First', f3Desc: 'Your photos are not stored or shared beyond what is needed to generate your result.',
    f4Title: 'Works Everywhere', f4Desc: 'Fully optimized for smartphones, tablets, and desktop browsers.',
    howTitle: 'How It Works', howSub: 'Start your pet fitting flow in three simple steps.',
    h1Step: 'Step 01', h1Title: 'Upload Your Pet Photo', h1Desc: 'Upload a clear photo of your dog or cat. A simple background and visible pose improve result quality.',
    h2Step: 'Step 02', h2Title: 'Upload Clothing', h2Desc: 'Upload the outfit you want to try on. Product shots or model photos both work well.',
    h3Step: 'Step 03', h3Title: 'Generate & Save', h3Desc: 'Hit the Generate button and the result is ready in seconds. Download it right away.',
    tryTitle: 'Start Now', trySub: 'Get 300 credits once when you sign up.',
    step1Label: 'Step 1', step1Title: 'Upload Pet Photo', step1Desc: 'Drag or click to upload a clear photo of your dog or cat',
    step2Label: 'Step 2', step2Title: 'Upload Clothing Photo', step2Desc: 'Drag or click to upload the outfit you want to try on',
    faceCopyrightNotice: 'Do not upload pet photos or images you do not have permission to use.',
    clothingSafetyNotice: 'Do not upload overly revealing or sexually explicit clothing images.',
    resultPrivacyNotice: 'This image is not stored and is processed temporarily only for preview and download.',
    chooseSample: 'Choose Pet Sample',
    uploadMyPhoto: 'Upload My Pet Photo',
    chooseClothingSample: 'Choose Clothing Sample',
    uploadClothing: 'Upload Clothing',
    preparingPersonUpload: 'Preparing your image for upload...',
    preparingClothingUpload: 'Optimizing the clothing image for upload...',
    loadingImage: 'Loading image...',
    imageLoadError: 'Unable to load image.',
    facePlaceholderTitle: 'Add a pet photo',
    clothingPlaceholderTitle: 'Add clothing photo',
    renderingResult: 'Rendering result...',
    resultDisplayError: 'Unable to display the result.',
    clothingSamplesPending: 'Clothing samples are being prepared.',
    generate: 'Start Pet Fitting', generating: 'AI Processing...',
    loadingDetail: 'HAMDEVA AI is analyzing your pet photo and outfit image...',
    generationEstimateNotice: 'Actual completion time may vary depending on network conditions and image size.',
    alertBoth: 'Please upload both a pet photo and a clothing photo!', alertError: 'Image generation failed. Please try again.', generationConfigError: 'Image generation is not configured yet. Please try again later.',
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
    tryAnotherOutfit: 'Try another pet outfit',
    randomOutfit: 'Random outfit',
    resultNotFound: 'The shared result could not be found.',
    shareOnX: 'Share on X',
    shareOnFacebook: 'Share on Facebook',
    shareLinkUnavailable: 'The share link is still being prepared.',
    sharedResultTitle: 'Shared pet fitting result',
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
    loginForFree: 'Get 300 credits once when you sign up.',
    credits: 'Credits',
    currentCredits: (n: number) => `Current credits: ${n}`,
    dailyCreditLabel: 'Free credits',
    paidCreditLabel: 'Paid credits',
    totalCreditLabel: 'Total credits',
    generationCost: '1 generation = 100 credits',
    generationCostDetailed: (n: number) => `1 generation = ${n} credits`,
    signUpGetCredits: 'Sign up and get 300 credits',
    dailyLoginCredits: 'No daily login credits',
    subscriptionCreditBonus: 'Extra subscription credits are coming soon',
    notEnoughCredits: 'Not enough credits.',
    refundedAfterFailure: '100 credits refunded due to generation failure.',
    paymentConfigError: 'Payments are not configured yet. Please try again later.',
    duplicateRequestBlocked: 'A generation request is already being processed. Please try again shortly.',
    todayDailyRewardGranted: '',
    todayDailyRewardAlreadyClaimed: '',
    subscriptionBonusGranted: (n: number) => `${n} subscription bonus credits were added.`,
    signupBonusGranted: (n: number) => `${n} sign-up bonus credits were added.`,
    viewSubscription: 'View subscription',
    creditCheck: 'Check credits',
    subscriptionPlanLabel: 'Subscription plan',
    subscriptionPlanValue: (plan: string) => plan === 'pro' ? 'PRO' : plan === 'basic' ? 'BASIC' : 'FREE',
    siteCreditsLabel: 'Current credits',
    siteCreditCostLabel: 'Generation cost',
    authSignupCreditsHint: 'Sign up and get 300 credits',
    chargeCredits: 'Buy credits',
    chargeDescription: 'Free credits are used first. Paid credits are used only when the free balance is insufficient.',
    purchaseNow: 'Purchase',
    paymentRedirecting: 'Opening checkout...',
    paymentSuccessTitle: 'Payment completed',
    paymentSuccessReady: 'Your payment was verified and paid credits were added.',
    paymentFailedTitle: 'Payment not completed',
    paymentFailedDescription: 'The payment was canceled or failed. Please try again.',
    paymentVerifying: 'Verifying your payment. Please wait a moment.',
    paymentVerifyFailed: 'We could not confirm the payment yet. Please check again from My Page shortly.',
    paymentSessionLabel: 'Session',
    goToMyPage: 'Go to My Page',
    starterProductName: 'starter',
    popularProductName: 'popular',
    proProductName: 'pro',
    freeResultNoticeTitle: 'Watermark applied to this image.',
    freeResultNoticeBody: 'All generated image results include the HAMDEVA AI watermark.',
    watermarkEnabled: 'Watermark on',
    watermarkRemoved: 'Watermark off',
    adminNav: 'Admin',
    adminTitle: 'Admin Dashboard',
    adminSubtitle: 'Review the service overview and recent activity in one place.',
    adminAccessDenied: 'Admin access is required.',
    adminDashboard: 'Dashboard Summary',
    adminUsersSection: 'Recent Users',
    adminMemberListSection: 'Member List',
    adminBoardSection: 'Recent Board Posts',
    adminGenerationSection: 'Recent Generation Activity',
    adminCreditsSection: 'Recent Credit Logs',
    adminPaymentsSection: 'Payment Logs',
    adminActivitiesSection: 'Activity Logs',
    adminLogsTitle: 'Admin Logs',
    adminLogsSubtitle: 'Logs load only when you open a tab, and they never auto-refresh.',
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
    adminUsersSectionHelper: 'Keep the recent-user preview here and load full search/gift actions only in the modal.',
    adminMemberListHelper: 'Browse and manage the full member list in the same format as recent users.',
    adminOpenUserList: 'Search Users / Gift',
    adminUserListTitle: 'User List',
    adminUserListSubtitle: 'Load users on demand by uid, email, nickname, or displayName.',
    adminUserSearchLabel: 'User search',
    adminUserSearchPlaceholder: 'uid / email / displayName',
    adminUserSearchHint: 'Supports uid, email, nickname, or displayName prefix search. Without a query, it loads the latest 20 users.',
    adminMemberListSearchHint: 'The member list only shows registered users with an email account.',
    adminUserListLoading: 'Loading user list...',
    adminUserListLoadingMore: 'Loading...',
    adminUserSearchEmpty: 'No matching users found.',
    adminLoadMore: 'Load more',
    refresh: 'Refresh',
    adminDisplayName: 'Nickname / Name',
    adminLastLoginAt: 'Last login',
    adminDailyCredit: 'dailyCredit',
    adminPaidCredit: 'paidCredit',
    adminSubscribed: 'Subscribed',
    adminSubscribedYes: 'Y',
    adminSubscribedNo: 'N',
    adminSubscribedYesLabel: 'Subscribed',
    adminSubscribedNoLabel: 'Not subscribed',
    adminTotalGenerated: 'Total generated',
    adminActions: 'Actions',
    adminDetailButton: 'Details',
    adminGiftButton: 'Gift',
    adminUserDetailTitle: 'User Detail',
    adminUserDetailHint: 'Details for the selected user from the list.',
    adminUserDetailLoading: 'Loading user detail...',
    adminUserDetailEmpty: 'Select a user to inspect details.',
    adminUpdatedAt: 'Updated',
    adminGiftModalTitle: 'Gift Credits',
    adminGiftModalSubtitle: 'Credits are granted immediately without any login popup or notification flow.',
    adminGiftTargetUid: 'Target uid',
    adminGiftAmount: 'Credit amount',
    adminGiftTitleLabel: 'Gift title',
    adminGiftMessageLabel: 'Gift message',
    adminGiftSenderLabel: 'Sender name',
    adminGiftAdminMemoLabel: 'Internal admin memo',
    adminGiftSubmitting: 'Granting...',
    adminGiftSubmit: 'Grant now',
    adminGiftSuccess: 'Credits were granted immediately.',
    adminGiftFailed: 'Failed to grant credits.',
    adminGiftInvalidAmount: 'Gift credit amount must be at least 1.',
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
      { q: 'How do credits work?', a: 'You get 300 credits once when you sign up. Daily login bonus credits are not currently provided.' },
      { q: 'What kind of photos work best?', a: 'For pet photos, use a front-facing shot with a simple background where your dog or cat is easy to see. For outfits, solo product shots work best.' },
      { q: "What if I don't like the result?", a: "Try again with different photos. Simpler backgrounds and clearer clothing images produce better results." },
      { q: 'Can I use it on mobile?', a: 'Yes. HAMDEVA is mobile-first and fully optimized for smartphones and tablets.' },
      { q: 'Are my photos stored?', a: 'Photos are temporarily transmitted for processing only and are not stored or used for any other purpose.' },
    ],
    footer: '© 2025 HAMDEVA. All rights reserved.',
    footerPrivacy: 'Privacy Policy', footerTerms: 'Terms of Service', footerAbout: 'About',
    comingSoon: 'Coming Soon',
    languageLabel: 'Language',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    closeMobileMenu: 'Close mobile menu',
    shareDefaultText: 'I tried pet outfit previews on HAMDEVA',
    paymentFailedMessage: 'Payment failed.',
    cancel: 'Cancel',
    logoutConfirmTitle: 'Log out',
    logoutConfirmBody: 'Are you sure you want to log out?',
    logoutConfirmAction: 'Log out',
    generationRemainingLabel: 'Estimated time',
    resultPreviewZoomOut: 'Zoom out',
    resultPreviewZoomIn: 'Zoom in',
    resultPreviewLoading: 'Loading result...',
    resultPreviewLoadFailed: 'Failed to load the result.',
    resultPreviewAlt: 'Expanded result preview',
    historyTitle: 'Pet fitting history',
    historyGuide: 'Results are kept for 15 days by default, and you can preserve up to 5 items for 30 days.',
    historyEmpty: 'No generation history yet.',
    historyPreviewClose: 'Click to close',
    historyPreviewOpen: 'Click to view below',
    historyExpiresAt: 'Expires',
    close: 'Close',
    historyZoomOut: '-',
    historyZoomReset: 'Reset zoom',
    historyZoomIn: '+',
    historyLoading: 'Loading...',
    historyZoomHint: 'The default zoom is reduced so the full image stays visible. Use only the + / - buttons if you need to adjust it.',
    historyDownload: 'Download',
    historyArchived: 'Archived',
    historyArchive: 'Archive',
    historyDelete: 'Delete',
    historyProcessing: 'Processing...',
    historyArchiveLimit: (n: number) => `You can preserve up to ${n} items.`,
    historyArchiveFailed: 'Failed to update the preserve status. Please try again later.',
    historyDownloadFailed: 'Failed to download the result. Please try again later.',
    historyDeleteConfirm: 'Delete this result from your history?',
    historyDeleteFailed: 'Failed to delete the history item. Please try again later.',
    savePercent: (n: number) => `Save ${n}%`,
    saveAmountOff: (amount: string) => `${amount} off`,
    adminGenerationType: 'Type',
    adminGenerationSubject: 'Subject',
    adminPaymentProvider: 'Provider',
    adminPaymentProduct: 'Product',
    adminActivityUserId: 'User ID',
    adminActivityTitle: 'Title',
    adminActivitySender: 'Sender',
    adminSummaryLoadFailed: 'Failed to load admin data.',
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
    heroEyebrow: 'AI 宠物试穿服务',
    heroTitle: '先看看\n你的宠物适合什么造型',
    heroSub: '只需一张宠物照片。HAMDEVA AI 会快速生成可爱的宠物穿搭预览。',
    step1Title: '上传宠物照片',
    step2Title: '上传服装照片',
    chooseSample: '选择宠物示例',
    uploadMyPhoto: '上传我的宠物照片',
    chooseClothingSample: '选择示例服装',
    uploadClothing: '上传服装',
    preparingPersonUpload: '正在整理图片以便上传...',
    preparingClothingUpload: '正在优化服装图片...',
    loadingImage: '正在加载图片...',
    imageLoadError: '无法加载图片。',
    facePlaceholderTitle: '请添加宠物照片',
    clothingPlaceholderTitle: '请添加服装照片',
    generate: '生成宠物试穿',
    generating: 'AI 处理中...（最多 30 秒）',
    loadingDetail: 'HAMDEVA AI 正在分析宠物照片与服装图像...',
    generationEstimateNotice: '实际完成时间可能会因网络状态和图片大小而有所不同。',
    alertBoth: '请同时上传宠物照片和服装照片。',
    alertError: '图像生成失败，请重试。',
    resultTitle: '试穿结果',
    download: '保存图片',
    faceCopyrightNotice: '请勿上传无权使用的宠物照片或他人的图片。',
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
    sharedResultTitle: '分享宠物试穿结果',
    sharedResultDescription: '查看 HAMDEVA 生成结果，下载图片，或再次尝试其他服装。',
    loadingSharedResult: '正在加载分享结果...',
    loginForFree: '注册时一次性获得 300 积分。',
    credits: '积分',
    currentCredits: (n: number) => `当前积分：${n}`,
    totalCreditLabel: '总积分',
    generationCost: '1 次生成 = 100 积分',
    generationCostDetailed: (n: number) => `1 次生成 = ${n} 积分`,
    signUpGetCredits: '注册并领取 300 积分',
    dailyLoginCredits: '目前没有每日登录积分',
    subscriptionCreditBonus: '订阅额外积分即将开放',
    notEnoughCredits: '积分不足。',
    refundedAfterFailure: '由于生成失败，100 积分已退回。',
    duplicateRequestBlocked: '生成请求正在处理中，请稍后再试。',
    todayDailyRewardGranted: '',
    todayDailyRewardAlreadyClaimed: '',
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
    adminMemberListSection: '会员列表',
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
    freeLeft: (n: number) => `当前积分：${n}`,
    freeExhausted: '积分不足。',
    renderingResult: '正在渲染结果图...',
    resultDisplayError: '无法显示结果图。',
    clothingSamplesPending: '示例服装数据正在准备中。',
    footer: '© 2025 HAMDEVA。保留所有权利。',
    comingSoon: '即将上线',
    languageLabel: '语言',
    lightMode: '浅色模式',
    darkMode: '深色模式',
    closeMobileMenu: '关闭移动菜单',
    shareDefaultText: '我在 HAMDEVA 体验了宠物穿搭预览',
    paymentFailedMessage: '支付失败。',
    cancel: '取消',
    logoutConfirmTitle: '退出登录',
    logoutConfirmBody: '确定要退出登录吗？',
    logoutConfirmAction: '退出登录',
    generationRemainingLabel: '预计剩余时间',
    resultPreviewZoomOut: '缩小',
    resultPreviewZoomIn: '放大',
    resultPreviewLoading: '正在加载结果...',
    resultPreviewLoadFailed: '无法加载结果。',
    resultPreviewAlt: '放大的结果预览',
    historyTitle: '宠物试穿历史',
    historyGuide: '生成结果默认保留 15 天，最多可额外保留 5 个结果 30 天。',
    historyEmpty: '还没有生成记录。',
    historyPreviewClose: '点击关闭',
    historyPreviewOpen: '点击在下方查看',
    historyExpiresAt: '到期时间',
    close: '关闭',
    historyZoomOut: '-',
    historyZoomReset: '恢复默认大小',
    historyZoomIn: '+',
    historyLoading: '加载中...',
    historyZoomHint: '默认缩放已调低，方便完整查看图片。如需调整，请使用 + / - 按钮。',
    historyDownload: '下载',
    historyArchived: '已保留',
    historyArchive: '保留',
    historyDelete: '删除',
    historyProcessing: '处理中...',
    historyArchiveLimit: (n: number) => `最多只能保留 ${n} 个结果。`,
    historyArchiveFailed: '无法更新保留状态，请稍后再试。',
    historyDownloadFailed: '无法下载结果，请稍后再试。',
    historyDeleteConfirm: '要从历史记录中删除这个结果吗？',
    historyDeleteFailed: '删除历史记录失败，请稍后再试。',
    savePercent: (n: number) => `立省 ${n}%`,
    saveAmountOff: (amount: string) => `优惠 ${amount}`,
    adminGenerationType: '类型',
    adminGenerationSubject: '主体',
    adminPaymentProvider: '支付渠道',
    adminPaymentProduct: '商品',
    adminActivityUserId: '用户 ID',
    adminActivityTitle: '标题',
    adminActivitySender: '发放者',
    adminSummaryLoadFailed: '无法加载管理员数据。',
  },
  ja: {
    ...translations.en,
    heroEyebrow: 'AI ペット試着サービス',
    heroTitle: '先に見られる\nペットのかわいいスタイル',
    heroSub: 'ペット写真 1 枚で十分です。HAMDEVA AI がかわいいペット衣装プレビューをすばやく作成します。',
    step1Title: 'ペット写真をアップロード',
    step2Title: '服の写真をアップロード',
    chooseSample: 'ペットサンプルを選ぶ',
    uploadMyPhoto: '自分のペット写真をアップロード',
    chooseClothingSample: '服のサンプルを選ぶ',
    uploadClothing: '服をアップロード',
    preparingPersonUpload: 'アップロードしやすいように画像を調整しています...',
    preparingClothingUpload: '服画像を自動で最適化しています...',
    loadingImage: '画像を読み込み中...',
    imageLoadError: '画像を読み込めませんでした。',
    facePlaceholderTitle: 'ペット写真を追加してください',
    clothingPlaceholderTitle: '服の写真を追加してください',
    generate: 'ペット試着を生成',
    generating: 'AI 処理中...（最大 30 秒）',
    loadingDetail: 'HAMDEVA AI がペット写真と衣装画像を解析しています...',
    generationEstimateNotice: 'ネットワーク状況や画像サイズによって、実際の完了時間は変動する場合があります。',
    alertBoth: 'ペット写真と服の写真の両方をアップロードしてください。',
    alertError: '画像の生成に失敗しました。もう一度お試しください。',
    resultTitle: '試着結果',
    download: '画像を保存',
    faceCopyrightNotice: '権利のないペット写真や他人の画像をアップロードしないでください。',
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
    sharedResultTitle: '共有されたペット試着結果',
    sharedResultDescription: 'HAMDEVA の生成結果を表示し、保存したり別の衣装を試したりできます。',
    loadingSharedResult: '共有結果を読み込み中...',
    loginForFree: '新規登録時に 300 クレジットを一度だけ受け取れます。',
    credits: 'クレジット',
    currentCredits: (n: number) => `現在のクレジット: ${n}`,
    totalCreditLabel: '合計クレジット',
    generationCost: '1 回の生成 = 100 クレジット',
    generationCostDetailed: (n: number) => `1 回の生成 = ${n} クレジット`,
    signUpGetCredits: '登録して 300 クレジットを受け取る',
    dailyLoginCredits: '毎日ログインクレジットはありません',
    subscriptionCreditBonus: '購読追加クレジットは準備中です',
    notEnoughCredits: 'クレジットが不足しています。',
    refundedAfterFailure: '生成に失敗したため 100 クレジットが返金されました。',
    duplicateRequestBlocked: '生成リクエストはすでに処理中です。少し待ってから再試行してください。',
    todayDailyRewardGranted: '',
    todayDailyRewardAlreadyClaimed: '',
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
    adminMemberListSection: '会員リスト',
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
    freeLeft: (n: number) => `現在のクレジット: ${n}`,
    freeExhausted: 'クレジットが不足しています。',
    renderingResult: '結果画像を描画中...',
    resultDisplayError: '結果画像を表示できません。',
    clothingSamplesPending: '服サンプルは準備中です。',
    footer: '© 2025 HAMDEVA. All rights reserved.',
    comingSoon: '近日公開',
    languageLabel: '言語',
    lightMode: 'ライトモード',
    darkMode: 'ダークモード',
    closeMobileMenu: 'モバイルメニューを閉じる',
    shareDefaultText: 'HAMDEVA でペット衣装プレビューを体験しました',
    paymentFailedMessage: '決済に失敗しました。',
    cancel: 'キャンセル',
    logoutConfirmTitle: 'ログアウト',
    logoutConfirmBody: 'ログアウトしてもよろしいですか？',
    logoutConfirmAction: 'ログアウト',
    generationRemainingLabel: '完了予想まで',
    resultPreviewZoomOut: '縮小',
    resultPreviewZoomIn: '拡大',
    resultPreviewLoading: '結果を読み込み中...',
    resultPreviewLoadFailed: '結果を読み込めませんでした。',
    resultPreviewAlt: '拡大した結果プレビュー',
    historyTitle: 'ペット試着履歴',
    historyGuide: '生成結果は通常 15 日間保存され、最大 5 件まで 30 日間保管できます。',
    historyEmpty: '生成履歴はまだありません。',
    historyPreviewClose: 'クリックして閉じる',
    historyPreviewOpen: 'クリックして下に表示',
    historyExpiresAt: '有効期限',
    close: '閉じる',
    historyZoomOut: '-',
    historyZoomReset: '標準サイズ',
    historyZoomIn: '+',
    historyLoading: '読み込み中...',
    historyZoomHint: '画像全体が見えるように初期倍率を下げています。必要に応じて + / - ボタンで調整してください。',
    historyDownload: 'ダウンロード',
    historyArchived: '保管済み',
    historyArchive: '保管',
    historyDelete: '削除',
    historyProcessing: '処理中...',
    historyArchiveLimit: (n: number) => `保管できる件数は最大 ${n} 件です。`,
    historyArchiveFailed: '保管状態を更新できませんでした。しばらくしてからもう一度お試しください。',
    historyDownloadFailed: '結果をダウンロードできませんでした。しばらくしてからもう一度お試しください。',
    historyDeleteConfirm: 'この結果を履歴から削除しますか？',
    historyDeleteFailed: '履歴の削除に失敗しました。しばらくしてからもう一度お試しください。',
    savePercent: (n: number) => `${n}% オフ`,
    saveAmountOff: (amount: string) => `${amount} お得`,
    adminGenerationType: '種類',
    adminGenerationSubject: '被写体',
    adminPaymentProvider: '決済事業者',
    adminPaymentProduct: '商品',
    adminActivityUserId: 'ユーザー ID',
    adminActivityTitle: 'タイトル',
    adminActivitySender: '送信者',
    adminSummaryLoadFailed: '管理データを読み込めませんでした。',
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
    '狗狗或猫咪正面较清晰的照片效果最好。',
    '建议使用没有被头发、手、口罩、眼镜或道具遮挡脸部的照片。',
    '光线越明亮、背景越简单，识别效果越好。',
    '半身照或以脸部为中心的照片最合适。',
  ],
  ja: [
    '犬や猫の顔が見やすい、正面に近い写真が最適です。',
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
const isPreviewRuntimeHost = (hostname: string): boolean =>
  PREVIEW_HOST_MARKERS.some((marker) => hostname.includes(marker)) && hostname !== 'hamdeva.com' && hostname !== 'www.hamdeva.com';
const getFirebaseDisabledMessage = (message: string): string => message;

const requireDb = () => {
  if (!db) {
    throw new Error('FIREBASE_NOT_CONFIGURED');
  }
  return db;
};

const normalizeSubjectType = (value: unknown): SubjectType => (
  value === 'dog' || value === 'cat' ? value : 'dog'
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
      videoPrompt: '이 사진으로 영상을 제작 하시겠습니까? 성공 시 1500 credits가 차감됩니다.',
      videoButton: '🎬 영상 제작하기 (성공 시 1500 credits 차감)',
      videoGenerating: '영상 생성 중...',
      videoDialogueLabel: '대사 입력',
      videoDialoguePlaceholder: '',
      videoDialogueHint: '모든 언어와 공백, ! ? , . 입력 가능, 최대 30자',
      videoDialogueInvalid: '대사는 모든 언어와 공백, ! ? , . 만 입력할 수 있으며 최대 30자입니다.',
      videoDialogueRequired: '영상 생성에는 대사 입력이 필요합니다.',
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
      videoPrompt: 'この画像から動画を生成しますか？成功時に1500 creditsが差し引かれます。',
      videoButton: '🎬 動画を生成する (成功時に1500 credits差し引き)',
      videoGenerating: '動画を生成中...',
      videoDialogueLabel: 'Dialogue',
      videoDialoguePlaceholder: '',
      videoDialogueHint: 'Any language, spaces, and ! ? , . up to 30 characters',
      videoDialogueInvalid: 'Dialogue can use any language, spaces, and ! ? , . only, up to 30 characters.',
      videoDialogueRequired: 'Dialogue is required for video generation.',
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
      videoPrompt: '要基于这张图片生成视频吗？仅在成功完成后扣除 1500 credits。',
      videoButton: '🎬 生成视频 (成功后扣除 1500 credits)',
      videoGenerating: '正在生成视频...',
      videoDialogueLabel: 'Dialogue',
      videoDialoguePlaceholder: '',
      videoDialogueHint: '支持所有语言、空格和 ! ? , .，最多 30 个字符',
      videoDialogueInvalid: '台词仅可使用所有语言字符、空格和 ! ? , .，且最多 30 个字符。',
      videoDialogueRequired: 'Dialogue is required for video generation.',
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
    videoPrompt: 'Would you like to create a video from this image? 1500 credits are charged only after a successful result.',
    videoButton: '🎬 Generate Video (Charge 1500 credits on success)',
    videoGenerating: 'Generating video...',
    videoDialogueLabel: 'Dialogue',
    videoDialoguePlaceholder: '',
    videoDialogueHint: 'Any language, spaces, and ! ? , . up to 30 characters',
    videoDialogueInvalid: 'Dialogue can use any language, spaces, and ! ? , . only, up to 30 characters.',
    videoDialogueRequired: 'Dialogue is required for video generation.',
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

const createRequestId = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

const buildAuthErrorMessage = (
  error: unknown,
  fallbackMessage: string,
  messages: {
    invalidCredential: string;
    emailAlreadyInUse: string;
    popupClosed: string;
    unauthorizedDomain: string;
    unauthorizedDomainWithHost: string;
    invalidApiKey: string;
    googlePolicyBlocked: string;
    tooManyRequests: string;
  },
): string => {
  const errorCode = typeof error === 'object' && error !== null && 'code' in error
    ? String((error as { code?: string }).code)
    : '';
  const rawMessage = error instanceof Error ? error.message || '' : '';
  const normalizedError = `${errorCode} ${rawMessage}`.toLowerCase();

  if (!(error instanceof Error) && !errorCode) {
    return fallbackMessage;
  }

  if (errorCode.includes('auth/invalid-credential') || errorCode.includes('auth/wrong-password')) {
    return messages.invalidCredential;
  }
  if (errorCode.includes('auth/email-already-in-use')) {
    return messages.emailAlreadyInUse;
  }
  if (errorCode.includes('auth/popup-closed-by-user')) {
    return messages.popupClosed;
  }
  if (errorCode.includes('auth/unauthorized-domain')) {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    return hostname
      ? messages.unauthorizedDomainWithHost.replace('{{hostname}}', hostname)
      : messages.unauthorizedDomain;
  }
  if (errorCode.includes('auth/invalid-api-key') || errorCode.includes('auth/api-key-not-valid')) {
    return messages.invalidApiKey;
  }
  if (
    normalizedError.includes('access_blocked')
    || normalizedError.includes('google policy')
    || normalizedError.includes('google 정책')
    || normalizedError.includes('oauth')
    || normalizedError.includes('auth/operation-not-allowed')
  ) {
    return messages.googlePolicyBlocked;
  }
  if (errorCode.includes('auth/too-many-requests')) {
    return messages.tooManyRequests;
  }

  return error instanceof Error ? rawMessage || fallbackMessage : fallbackMessage;
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

const formatCreditProductPrice = (product: Pick<CreditProduct, 'salePriceUsd' | 'kind'>): string =>
  `$${product.salePriceUsd.toFixed(2)}${product.kind === 'subscription' ? '/month' : ''}`;

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

const createImageFileFromRemoteSource = async (src: string, prefix: string): Promise<File> => {
  const response = await fetch(src);
  if (!response.ok) {
    throw new Error('REMOTE_IMAGE_FETCH_FAILED');
  }

  const blob = await response.blob();
  if (!blob.type.startsWith('image/')) {
    throw new Error('REMOTE_IMAGE_INVALID');
  }

  const url = new URL(src, window.location.href);
  const fileNameFromPath = url.pathname.split('/').pop()?.trim();
  const fallbackExtension = blob.type.split('/')[1] || 'png';
  const fileName = fileNameFromPath && fileNameFromPath.includes('.')
    ? fileNameFromPath
    : `${prefix}-${Date.now()}.${fallbackExtension}`;

  return new File([blob], fileName, { type: blob.type });
};

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

const fetchAssetDataUrl = async (src: string): Promise<string> => {
  if (src.startsWith('data:')) {
    return src;
  }

  const response = await fetch(src, { cache: 'force-cache' });
  if (!response.ok) {
    throw new Error('샘플 이미지를 불러오지 못했습니다.');
  }

  return blobToDataUrl(await response.blob());
};

const preloadImageSource = (src: string): Promise<string> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(src);
    img.onerror = () => reject(new Error('RESULT_IMAGE_INVALID'));
    img.decoding = 'async';
    img.src = src;
  });

const withTimeout = async <T,>(promise: Promise<T>, timeoutMs: number, errorCode: string): Promise<T> => {
  let timer: number | null = null;

  try {
    return await Promise.race([
      promise,
      new Promise<T>((_, reject) => {
        timer = window.setTimeout(() => reject(new Error(errorCode)), timeoutMs);
      }),
    ]);
  } finally {
    if (timer !== null) {
      window.clearTimeout(timer);
    }
  }
};

const getGenerateErrorMessage = (
  error: unknown,
  t: { alertError: string; generationConfigError: string; paymentConfigError: string; notEnoughCredits: string; refundedAfterFailure: string; authRequired: string; duplicateRequestBlocked: string },
  details: {
    timeoutDetail: string;
    prepTimeoutDetail: string;
    authTimeoutDetail: string;
    resultImageTimeoutDetail: string;
    petOnlyDetail: string;
  },
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

  if (raw === 'PAYMENT_NOT_CONFIGURED') {
    return t.paymentConfigError;
  }

  if (raw === 'PAYMENT_REQUIRED' || raw === 'INSUFFICIENT_CREDITS') {
    return t.notEnoughCredits;
  }

  if (raw === 'AUTH_REQUIRED') {
    return t.authRequired;
  }

  if (raw === 'DUPLICATE_REQUEST') {
    return t.duplicateRequestBlocked;
  }

  if (raw === 'PET_ONLY_SUBJECT') {
    return details.petOnlyDetail;
  }

  if (raw === 'GENERATION_TIMEOUT') {
    return `${t.alertError}\n\n${details.timeoutDetail}`;
  }

  if (raw === 'GENERATION_PREP_TIMEOUT') {
    return `${t.alertError}\n\n${details.prepTimeoutDetail}`;
  }

  if (
    raw === 'IMAGE_RESIZE_TIMEOUT'
    || raw === 'IMAGE_RESIZE_CONTEXT_UNAVAILABLE'
    || raw === 'IMAGE_RESIZE_FAILED'
  ) {
    return `${t.alertError}\n\n${details.prepTimeoutDetail}`;
  }

  if (raw === 'GENERATION_AUTH_TIMEOUT') {
    return `${t.alertError}\n\n${details.authTimeoutDetail}`;
  }

  if (raw === 'RESULT_IMAGE_TIMEOUT') {
    return `${t.alertError}\n\n${details.resultImageTimeoutDetail}`;
  }

  if (raw.includes('100 credits refunded')) {
    return `${t.alertError}\n\n${t.refundedAfterFailure}`;
  }

  return raw ? `${t.alertError}\n\n${raw}` : t.alertError;
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
    let timedOut = false;
    const timeoutId = window.setTimeout(() => {
      timedOut = true;
      reject(new Error('IMAGE_RESIZE_TIMEOUT'));
    }, 15_000);

    img.onload = () => {
      if (timedOut) {
        return;
      }

      try {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.max(1, Math.round(img.width * scale));
        c.height = Math.max(1, Math.round(img.height * scale));
        const context = c.getContext('2d');

        if (!context) {
          throw new Error('IMAGE_RESIZE_CONTEXT_UNAVAILABLE');
        }

        context.drawImage(img, 0, 0, c.width, c.height);
        window.clearTimeout(timeoutId);
        resolve(c.toDataURL('image/jpeg', 0.85));
      } catch (error) {
        window.clearTimeout(timeoutId);
        reject(error instanceof Error ? error : new Error('IMAGE_RESIZE_FAILED'));
      }
    };
    img.onerror = () => {
      window.clearTimeout(timeoutId);
      reject(new Error('IMAGE_RESIZE_FAILED'));
    };
    img.decoding = 'async';
    img.src = dataUrl;
  });

const createHistoryPreview = (dataUrl: string, maxPx = 480): Promise<string> =>
  resizeImage(dataUrl, maxPx);

const getTimestampMillis = (value?: Timestamp | null): number | null => {
  if (!value) {
    return null;
  }

  try {
    return value.toDate().getTime();
  } catch {
    return null;
  }
};

const getHistoryExpiryMillis = (item: GenerationRecord): number | null => {
  const preservedUntil = getTimestampMillis(item.preservedUntil);
  if (preservedUntil) {
    return preservedUntil;
  }

  const expiresAt = getTimestampMillis(item.expiresAt);
  if (expiresAt) {
    return expiresAt;
  }

  const createdAt = getTimestampMillis(item.createdAt);
  return createdAt ? createdAt + HISTORY_RETENTION_MS : null;
};

const prepareGenerationInput = async (source: File | string, maxPx = 1024): Promise<string> => {
  const dataUrl = source instanceof File
    ? await blobToDataUrl(source)
    : source.startsWith('data:')
      ? source
      : await ensureDataUrl(source);

  return resizeImage(dataUrl, maxPx);
};

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

const buildTimestampedImageFilename = (prefix = 'hamdeva-pet-fitting'): string => {
  const now = new Date();
  const parts = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, '0'),
    String(now.getDate()).padStart(2, '0'),
    String(now.getHours()).padStart(2, '0'),
    String(now.getMinutes()).padStart(2, '0'),
    String(now.getSeconds()).padStart(2, '0'),
  ];

  return `${prefix}-${parts[0]}${parts[1]}${parts[2]}-${parts[3]}${parts[4]}${parts[5]}.png`;
};

const createShareImageFile = async (src: string, filename = 'hamdeva-share-image.png'): Promise<File> => {
  const response = await fetch(src);
  if (!response.ok) {
    throw new Error('SHARE_IMAGE_FETCH_FAILED');
  }

  const blob = await response.blob();
  if (!blob.type.startsWith('image/')) {
    throw new Error('SHARE_IMAGE_INVALID');
  }

  const extension = blob.type.split('/')[1] || 'png';
  const resolvedName = filename.includes('.') ? filename : `${filename}.${extension}`;
  return new File([blob], resolvedName, { type: blob.type });
};

const downloadBlobUrl = (src: string, filename: string): void => {
  const link = document.createElement('a');
  link.href = src;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
};

const openShareWindow = (url: string) => {
  window.open(url, '_blank', 'noopener,noreferrer');
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

const getFaqTitle = (page: SitePage, pageTitle?: string): string => {
  switch (page) {
    case 'home':
      return 'HAMDEVA FAQ';
    default:
      return pageTitle ? `${pageTitle} FAQ` : 'FAQ';
  }
};

const getFaqItemsForPage = (page: SitePage, editorialFaq?: EditorialFaqItem[]): FAQItem[] => {
  switch (page) {
    case 'home':
      return homeFaqs;
    default:
      if (editorialFaq && editorialFaq.length > 0) {
        return editorialFaq;
      }
      if (page === 'about') {
        return aboutFaqs;
      }
      if (page === 'how-it-works') {
        return howToUseFaqs;
      }
      if (page === 'traditional-clothing') {
        return sampleOutfitsFaqs;
      }
      return [];
  }
};

const renderSeoContent = (page: SitePage | 'contact-route', contentLocale?: ReturnType<typeof getContentLocale>): React.ReactNode => {
  if (page !== 'home' || !contentLocale) {
    return null;
  }

  return (
    <section className="seo-content">
      <h2>{contentLocale.homeSeo.title}</h2>
      {contentLocale.homeSeo.introParagraphs.map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
      <h3>{contentLocale.homeSeo.whyTitle}</h3>
      <p>{contentLocale.homeSeo.whyBody}</p>
      <h3>{contentLocale.homeSeo.exploreTitle}</h3>
      <p>{contentLocale.homeSeo.exploreBody}</p>
    </section>
  );
};

const getPageCopy = (
  page: SitePage,
  lang: LanguageCode,
  contentLocale: ReturnType<typeof getContentLocale>,
) => {
  const editorialPage = getEditorialPage(page);
  const localizedPage = contentLocale.pages[page as keyof typeof contentLocale.pages] as {
    title?: string;
    description?: string;
    sections?: Array<{ heading: string; paragraphs: string[] }>;
  } | undefined;

  if (!editorialPage) {
    return localizedPage ?? null;
  }

  if (lang === 'en') {
    return editorialPage;
  }

  if (localizedPage?.sections && localizedPage.sections.length > 0) {
    return localizedPage;
  }

  return {
    ...editorialPage,
    title: localizedPage?.title ?? editorialPage.title,
    description: localizedPage?.description ?? editorialPage.description,
  };
};

const ShellModal: React.FC<{
  title: string;
  subtitle?: string;
  className?: string;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ title, subtitle, className = '', onClose, children }) => {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`auth-modal account-modal ${className}`.trim()} onClick={(event) => event.stopPropagation()}>
        <div className="modal-header account-modal-header">
          <div>
            <h3>{title}</h3>
            {subtitle ? <p className="modal-subtitle">{subtitle}</p> : null}
          </div>
          <button className="close-btn" onClick={onClose} type="button">
            &times;
          </button>
        </div>
        <div className="account-modal-body">{children}</div>
      </div>
    </div>
  );
};

const PAGE_PATHS: Record<SitePage, string> = {
  home: '/',
  admin: '/admin',
  about: '/about',
  'how-it-works': '/how-to-use',
  'traditional-clothing': '/sample-outfits',
  'sample-friends': '/sample-friends',
  countries: '/countries',
  'fashion-technology': '/fashion-technology',
  pricing: '/pricing',
  'virtual-try-on-guide': '/virtual-try-on-guide',
  'outfit-photo-tips': '/outfit-photo-tips',
  'ai-fitting-faq': '/ai-fitting-faq',
  privacy: '/privacy',
  'refund-policy': '/refund-policy',
  terms: '/terms',
  contact: '/contact',
  board: '/board',
  'site-management': '/site-management',
  mypage: '/mypage',
  'payment-success': '/payment-success',
  'payment-failed': '/payment-failed',
};
const INDEXABLE_PAGES = new Set<SitePage>([
  'home',
  'about',
  'how-it-works',
  'traditional-clothing',
  'sample-friends',
  'fashion-technology',
  'pricing',
  'virtual-try-on-guide',
  'outfit-photo-tips',
  'ai-fitting-faq',
  'privacy',
  'refund-policy',
  'terms',
]);
const ADSENSE_ELIGIBLE_PAGES = EDITORIAL_AD_PAGES;
const LEGACY_PAGE_PATHS: Record<string, SitePage> = {
  '/how-it-works': 'how-it-works',
  '/traditional-clothing': 'traditional-clothing',
  '/countries': 'traditional-clothing',
};

const PATH_TO_PAGE = Object.entries(PAGE_PATHS).reduce<Record<string, SitePage>>((acc, [page, path]) => {
  acc[path] = page as SitePage;
  return acc;
}, {});

const normalizePathname = (pathname: string): string => pathname.replace(/\/+$/, '') || '/';
const getPageFromHash = (hash: string): SitePage | null => {
  const normalizedHash = hash.replace(/^#/, '');
  return SITE_PAGES.includes(normalizedHash as SitePage) ? normalizedHash as SitePage : null;
};
const getPageFromPath = (pathname: string): SitePage | null => {
  const normalizedPath = normalizePathname(pathname);
  if (normalizedPath === '/countries') {
    return 'traditional-clothing';
  }
  return PATH_TO_PAGE[normalizedPath] ?? LEGACY_PAGE_PATHS[normalizedPath] ?? null;
};
const getPageFromLocation = (pathname: string, hash: string): SitePage => {
  const pageFromPath = getPageFromPath(pathname);
  if (pageFromPath) {
    return pageFromPath;
  }

  return getPageFromHash(hash) ?? 'home';
};
const getCanonicalPathFromLocation = (pathname: string, hash: string): string => {
  const pageFromPath = getPageFromPath(pathname);
  if (pageFromPath) {
    return PAGE_PATHS[pageFromPath];
  }

  const pageFromHash = getPageFromHash(hash);
  if (pageFromHash) {
    return PAGE_PATHS[pageFromHash];
  }

  return PAGE_PATHS.home;
};
const getFaceSampleCategoryName = (lang: LanguageCode, category: keyof typeof FACE_SAMPLES): string => {
  const categoryNames = {
    ko: { dog: '강아지', cat: '고양이' },
    ja: { dog: '犬', cat: '猫' },
    zh: { dog: '狗', cat: '猫' },
    en: { dog: 'Dog', cat: 'Cat' },
  } as const;
  const normalizedLang = lang === 'ja' || lang === 'zh' || lang === 'ko' ? lang : 'en';
  return categoryNames[normalizedLang][category];
};
const getFaceInputLabel = (
  lang: LanguageCode,
  sampleBadgeLabel: string,
  selectedSampleUrl: string | null,
  personFile: File | null,
): string => {
  if (selectedSampleUrl) {
    const matchedEntry = (Object.entries(FACE_SAMPLES) as [keyof typeof FACE_SAMPLES, string[]][])
      .find(([, samples]) => samples.includes(selectedSampleUrl));
    if (matchedEntry) {
      const [category, samples] = matchedEntry;
      const sampleIndex = samples.indexOf(selectedSampleUrl);
      const breedLabel = getFaceSampleBreed(selectedSampleUrl);
      if (breedLabel) {
        return `${sampleBadgeLabel} ${getFaceSampleCategoryName(lang, category)} ${breedLabel}`;
      }
      return `${sampleBadgeLabel} ${getFaceSampleCategoryName(lang, category)} ${sampleIndex + 1}`;
    }
  }

  if (personFile?.name?.trim()) {
    return personFile.name.trim();
  }

  return lang === 'ko' ? '업로드한 반려동물 사진' : 'Uploaded pet photo';
};
const getGarmentInputLabel = (
  lang: LanguageCode,
  sampleBadgeLabel: string,
  selectedClothSampleUrl: string | null,
  clothFile: File | null,
): string => {
  if (selectedClothSampleUrl) {
    const matchedSample = clothSampleOptions.find((sample) => sample.image === selectedClothSampleUrl);
    if (matchedSample) {
      return `${sampleBadgeLabel} ${lang === 'en' ? matchedSample.countryLabelEn : matchedSample.label}`;
    }
  }

  if (clothFile?.name?.trim()) {
    return clothFile.name.trim();
  }

  return lang === 'ko' ? '업로드한 의상 사진' : 'Uploaded garment photo';
};
const removeAutoAdsArtifacts = (): void => {
  if (typeof document === 'undefined') {
    return;
  }

  document
    .querySelectorAll('.google-auto-placed, ins.adsbygoogle[data-ad-status], ins.adsbygoogle[data-adsbygoogle-status]')
    .forEach((node) => node.remove());
};
const setAdRequestsPaused = (paused: boolean): void => {
  if (typeof window === 'undefined') {
    return;
  }

  window.adsbygoogle = window.adsbygoogle || [];
  window.adsbygoogle.pauseAdRequests = paused ? 1 : 0;
};
const ensureAdSenseScript = (): void => {
  if (typeof document === 'undefined') {
    return;
  }

  if (document.getElementById(ADSENSE_SCRIPT_ID)) {
    return;
  }

  const script = document.createElement('script');
  script.id = ADSENSE_SCRIPT_ID;
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = ADSENSE_SCRIPT_SRC;
  document.head.appendChild(script);
};
const removeAdSenseScript = (): void => {
  if (typeof document === 'undefined') {
    return;
  }

  document.getElementById(ADSENSE_SCRIPT_ID)?.remove();
};

const SUPPORTED_LANGUAGE_CODES = SUPPORTED_UI_LANGUAGE_CODES;
const DEFAULT_LANGUAGE: LanguageCode = 'en';
const SITE_KEYWORDS = '반려동물 옷입혀보기, 강아지 옷입혀보기, 고양이 옷입혀보기, 펫 의상 미리보기, 펫 코디, 펫 코스튬, 반려동물 코디, 강아지 옷 추천, 고양이 옷 추천, 펫 스타일 추천, pet outfit generator, dog outfit generator, cat outfit generator, pet costume generator, pet outfit preview, virtual pet try on, dress up your pet, dog costume ideas, cat costume ideas, HAMDEVA, hamdeva';
const PAGE_KEYWORDS: Partial<Record<SitePage, string>> = {
  home: `${SITE_KEYWORDS}, 반려동물 ai 옷입혀보기, 강아지 ai 옷입혀보기, 고양이 ai 옷입혀보기, ai pet outfit, ai dog outfit, ai cat outfit`,
  about: `${SITE_KEYWORDS}, 반려동물 옷입혀보기 사이트, 펫 피팅 서비스, pet fitting service`,
  'how-it-works': `${SITE_KEYWORDS}, 반려동물 사진 업로드, 의상 이미지 업로드, 펫 피팅 사용법, pet photo upload, outfit image upload`,
  'traditional-clothing': `${SITE_KEYWORDS}, 샘플 의상, 반려동물 전통의상, 강아지 한복, 고양이 한복, 강아지 기모노, 고양이 기모노, 강아지 치파오, 고양이 치파오, 강아지 사리, 고양이 사리, 강아지 아오자이, 고양이 아오자이, 강아지 추트타이, 고양이 추트타이, 강아지 케바야, 고양이 케바야, 강아지 플라멩코 드레스, 고양이 플라멩코 드레스, pet hanbok, pet kimono, pet qipao, pet saree, pet ao dai, pet chut thai, pet kebaya, pet flamenco dress, 한국 전통의상, 일본 전통의상, 중국 전통의상, 인도 전통의상, 베트남 전통의상, 태국 전통의상, 인도네시아 전통의상, 스페인 전통의상`,
  'sample-friends': `${SITE_KEYWORDS}, 샘플 강아지, 샘플 고양이, 강아지 품종, 고양이 품종, dog breeds, cat breeds, pet sample photo`,
  'fashion-technology': `${SITE_KEYWORDS}, 펫 스타일 가이드, 반려동물 의상 아이디어, dog outfit ideas, cat outfit ideas`,
  pricing: `${SITE_KEYWORDS}, 가격, 요금제, 크레딧 가격, pricing, credits, plans, pet fitting price`,
  'virtual-try-on-guide': `${SITE_KEYWORDS}, 반려동물 가상피팅 가이드, pet virtual try on guide`,
  'outfit-photo-tips': `${SITE_KEYWORDS}, 반려동물 사진 팁, 의상 사진 팁, pet photo tips, outfit photo tips`,
  'ai-fitting-faq': `${SITE_KEYWORDS}, 반려동물 옷입혀보기 faq, pet outfit faq, dog outfit faq, cat outfit faq`,
};

const isSupportedLanguageCode = (value: string | null): value is LanguageCode =>
  value !== null && SUPPORTED_LANGUAGE_CODES.includes(value as (typeof SUPPORTED_UI_LANGUAGE_CODES)[number]);

const normalizeLanguageCode = (value: string | null | undefined): LanguageCode => {
  const normalized = value?.toLowerCase().split('-')[0] ?? DEFAULT_LANGUAGE;
  return isSupportedLanguageCode(normalized) ? normalized : DEFAULT_LANGUAGE;
};

// ─── App ──────────────────────────────────────────────────────
const App: React.FC = () => {
  const { i18n: i18next, t: translate } = useTranslation();
  const SUPPORT_EMAIL = 'dlgksxk@gmail.com';
  const personInputRef = useRef<HTMLInputElement>(null);
  const clothInputRef = useRef<HTMLInputElement>(null);
  const [personImage, setPersonImage] = useState<string | null>(null);
  const [clothImage, setClothImage]   = useState<string | null>(null);
  const [personFile, setPersonFile] = useState<File | null>(null);
  const [clothFile, setClothFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [gender, setGender] = useState<'female' | 'male' | 'dog' | 'cat'>('female');
  const [subjectType, setSubjectType] = useState<SubjectType>('dog');
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
  const [latestSharedResultId, setLatestSharedResultId] = useState<string | null>(null);
  const [sharedResultRouteId, setSharedResultRouteId] = useState<string | null>(() => getSharedResultIdFromPath(window.location.pathname));
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  const [creditNotice, setCreditNotice] = useState<string | null>(null);
  const [resultWatermarkApplied, setResultWatermarkApplied] = useState(false);
  const [resultUsedCreditType, setResultUsedCreditType] = useState<CreditKind | null>(null);
  const [isStartingCheckout, setIsStartingCheckout] = useState<CheckoutProductId | null>(null);
  const [paymentStatusMessage, setPaymentStatusMessage] = useState<string | null>(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('HAMDEVA-dark') === 'true');
  const [currentPage, setCurrentPage] = useState<SitePage>(() => getPageFromLocation(window.location.pathname, window.location.hash));
  const [routeSearch, setRouteSearch] = useState(() => window.location.search);
  const [contactForm, setContactForm] = useState({ name: '', email: '', message: '' });
  const [bbsForm, setBbsForm] = useState({ nickname: '', content: '', tempPassword: '' });
  const [bbsStatus, setBbsStatus] = useState<string | null>(null);
  const [bbsSubmitting, setBbsSubmitting] = useState(false);
  const [bbsPosts, setBbsPosts] = useState<BbsPostRecord[]>([]);
  const [boardNotices, setBoardNotices] = useState<BoardNoticeRecord[]>([]);
  const [noticeForm, setNoticeForm] = useState({ title: '', content: '' });
  const [noticeStatus, setNoticeStatus] = useState<string | null>(null);
  const [noticeSubmitting, setNoticeSubmitting] = useState(false);
  const [editingBbsPostId, setEditingBbsPostId] = useState<string | null>(null);
  const [appVersion, setAppVersion] = useState(APP_VERSION);
  const [showContentModal, setShowContentModal] = useState(false);
  const [showTryOnModal, setShowTryOnModal] = useState(false);
  const [selectedOutfitGuideId, setSelectedOutfitGuideId] = useState<string | null>(null);
  const [selectedBreedGuideId, setSelectedBreedGuideId] = useState<string | null>(null);
  const [activeContentTab, setActiveContentTab] = useState<ModalTab>('overview');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [historyItems, setHistoryItems] = useState<GenerationRecord[]>([]);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<AuthMode>('login');
  const [authForm, setAuthForm] = useState({ email: '', password: '' });
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [headerLangMenuOpen, setHeaderLangMenuOpen] = useState(false);
  const [headerAccountMenuOpen, setHeaderAccountMenuOpen] = useState(false);
  const [showCreditPlanModal, setShowCreditPlanModal] = useState(false);
  const [showMyPageModal, setShowMyPageModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showLogoutConfirmModal, setShowLogoutConfirmModal] = useState(false);
  const [showResultPreviewModal, setShowResultPreviewModal] = useState(false);
  const [resultPreviewModalSrc, setResultPreviewModalSrc] = useState<string | null>(null);
  const [resultPreviewModalLoading, setResultPreviewModalLoading] = useState(false);
  const [resultPreviewZoom, setResultPreviewZoom] = useState(1);
  const mobileMenuCloseRef = useRef<HTMLButtonElement | null>(null);
  const headerLangMenuRef = useRef<HTMLDivElement | null>(null);
  const headerAccountMenuRef = useRef<HTMLDivElement | null>(null);
  const generationLockRef = useRef(false);
  
  const lang = normalizeLanguageCode(i18next.resolvedLanguage ?? i18next.language);
  const contentLocale = getContentLocale(lang);
  const landingContent = getLandingContent(lang);
  const traditionalOutfitGuides = getTraditionalOutfitGuides(lang);
  const petBreedGuides = getPetBreedGuides(lang);
  const selectedOutfitGuide = traditionalOutfitGuides.find((guide) => guide.id === selectedOutfitGuideId) ?? null;
  const selectedBreedGuide = petBreedGuides.find((guide) => guide.id === selectedBreedGuideId) ?? null;
  const t = uiTranslations[lang];
  const homeQuickCopy = getHomeQuickCopy(lang);
  const aboutVisualCopy = getAboutVisualCopy(lang);
  const styleGuideVisualCopy = getStyleGuideVisualCopy(lang);
  const sampleCategoryLabels = translate('sampleModal.categories', { returnObjects: true }) as Record<FaceCategory, string>;
  const petBreedGuideGroups = (['dog', 'cat'] as FaceCategory[]).map((category) => ({
    category,
    label: sampleCategoryLabels[category],
    guides: petBreedGuides.filter((guide) => guide.category === category),
  }));
  const countryShowcaseCards = getCountryShowcaseCards(contentLocale.modal.countries);
  const fontTheme = LANGUAGE_FONT_THEMES[lang];
  const emptyFaceTips = translate('uploadGuides.faceTips', { returnObjects: true }) as string[];
  const emptyClothTips = translate('uploadGuides.clothTips', { returnObjects: true }) as string[];
  const firebaseConfigMissingLabel = translate('ui.firebaseConfigMissing');
  const firebaseDisabledBaseMessage = translate('ui.firebaseDisabledMessage');
  const emptyPreviewCopy = translate('emptyPreview', { returnObjects: true }) as {
    faceBadge: string;
    styleBadge: string;
  };
  const sampleBadgeLabel = translate('ui.sampleBadge');
  const petOnlyImageMessage = lang === 'ko'
    ? '사람 사진은 지원하지 않습니다. 강아지나 고양이 사진만 업로드해 주세요.'
    : lang === 'ja'
      ? '人物写真には対応していません。犬または猫の写真のみアップロードしてください。'
      : lang === 'zh'
        ? '暂不支持人物照片。请仅上传狗或猫的照片。'
        : 'Human photos are not supported. Please upload a dog or cat photo only.';
  const generationErrorCopy = (() => {
    const base = translate('errors.generation', { returnObjects: true }) as {
      timeoutDetail: string;
      prepTimeoutDetail: string;
      authTimeoutDetail: string;
      resultImageTimeoutDetail: string;
      petOnlyDetail?: string;
    };
    return {
      ...base,
      petOnlyDetail: base.petOnlyDetail || petOnlyImageMessage,
    };
  })();
  const authErrorCopy = translate('errors.auth', { returnObjects: true }) as {
    invalidCredential: string;
    emailAlreadyInUse: string;
    popupClosed: string;
    unauthorizedDomain: string;
    unauthorizedDomainWithHost: string;
    invalidApiKey: string;
    googlePolicyBlocked: string;
    tooManyRequests: string;
  };
  const shareResultLink = latestSharedResultId ? buildSharedResultUrl(latestSharedResultId) : null;
  const sharedPageLink = sharedResultRouteId ? buildSharedResultUrl(sharedResultRouteId) : null;
  const firebaseDisabledMessage = firebaseConfigError
    ? `${getFirebaseDisabledMessage(firebaseDisabledBaseMessage)}${missingFirebaseEnvKeys.length > 0 ? ` (${missingFirebaseEnvKeys.join(', ')})` : ''}`
    : null;
  const currentCredits = userProfile?.credits ?? 0;
  const currentDailyCredit = userProfile?.dailyCredit ?? 0;
  const currentPaidCredit = userProfile?.paidCredit ?? 0;
  const isAdminUser = (currentUser?.email || userProfile?.email || '').trim().toLowerCase() === ADMIN_EMAIL;
  const guideSampleCat = FACE_SAMPLES.cat[0];
  const guideFixedPet = '/howto-fixed/step-1-pet.jpg';
  const guideFixedCloth = '/howto-fixed/step-2-outfit.jpg';
  const guideFixedResult = '/howto-fixed/step-3-result.jpg';
  const guideSampleCloth = guideFixedCloth;
  const canAffordGeneration = currentDailyCredit >= GENERATION_COST || currentPaidCredit >= GENERATION_COST;
  const preservedHistoryCount = historyItems.filter((item) => {
    const preservedUntil = getTimestampMillis(item.preservedUntil);
    return typeof preservedUntil === 'number' && preservedUntil > Date.now();
  }).length;
  const loginComingSoonLabel = `${t.login} (${t.comingSoon})`;
  const googleLoginComingSoonLabel = `${t.googleLogin} (${t.comingSoon})`;
  const headerAccountLabel = currentUser ? t.myPage : t.login;
  const headerCreditLabel = lang === 'ko'
    ? `남은 크레딧 ${currentCredits}`
    : lang === 'ja'
      ? `残り ${currentCredits} クレジット`
      : lang === 'zh'
        ? `剩余积分 ${currentCredits}`
        : `${currentCredits} credits left`;
  const headerSubscriptionLabel = currentUser
    ? lang === 'ko'
      ? `구독 ${t.subscriptionPlanValue(userProfile?.subscriptionPlan ?? 'free')}`
      : lang === 'ja'
        ? `購読 ${t.subscriptionPlanValue(userProfile?.subscriptionPlan ?? 'free')}`
        : lang === 'zh'
          ? `订阅 ${t.subscriptionPlanValue(userProfile?.subscriptionPlan ?? 'free')}`
          : `Plan ${t.subscriptionPlanValue(userProfile?.subscriptionPlan ?? 'free')}`
    : '';
  const boardUiCopy = lang === 'ko'
    ? {
        boardNoticeTitle: '공지사항',
        boardNoticeDescription: '운영 공지와 중요한 안내를 먼저 확인해 주세요.',
        boardNoticeFormTitle: '공지 제목',
        boardNoticeFormContent: '공지 내용',
        boardNoticeTitlePlaceholder: '공지 제목을 입력해 주세요.',
        boardNoticeContentPlaceholder: '게시판 상단에 노출할 공지 내용을 입력해 주세요.',
        boardNoticeSubmit: '공지 등록하기',
        boardNoticeSubmitting: '공지사항을 등록하고 있습니다...',
        boardNoticeSaved: '공지사항이 등록되었습니다.',
        boardNoticeDeleted: '공지사항이 삭제되었습니다.',
        boardNoticeDeleteConfirm: '이 공지사항을 삭제하시겠습니까?',
        boardNoticeInvalid: '공지 제목과 내용을 모두 입력해 주세요.',
        boardNoticeAdminOnly: '공지 등록은 관리자만 가능합니다.',
        boardNoticeFailed: '공지 처리 중 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.',
        boardNoticeEmpty: '등록된 공지사항이 없습니다.',
      }
    : {
        boardNoticeTitle: 'Notices',
        boardNoticeDescription: 'Check service updates and important announcements first.',
        boardNoticeFormTitle: 'Notice title',
        boardNoticeFormContent: 'Notice content',
        boardNoticeTitlePlaceholder: 'Enter a notice title.',
        boardNoticeContentPlaceholder: 'Enter the notice text shown at the top of the board.',
        boardNoticeSubmit: 'Publish notice',
        boardNoticeSubmitting: 'Publishing notice...',
        boardNoticeSaved: 'Notice published.',
        boardNoticeDeleted: 'Notice deleted.',
        boardNoticeDeleteConfirm: 'Delete this notice?',
        boardNoticeInvalid: 'Enter both a notice title and content.',
        boardNoticeAdminOnly: 'Only administrators can publish notices.',
        boardNoticeFailed: 'Failed to process the notice. Please try again later.',
        boardNoticeEmpty: 'No notices have been posted yet.',
      };
  const howItWorksVisualCopy = lang === 'ko'
    ? {
        eyebrow: '실제 화면 기준 안내',
        title: '강아지/고양이 이미지로 바로 따라하는 HAMDEVA 사용 방법',
        description: '반려동물 사진 업로드, 다른 웹사이트 이미지 드래그 업로드, 생성 후 마이페이지에서 다시 확인하는 흐름을 한 화면에 정리했습니다.',
        summaryCards: [
          {
            title: '1. 반려동물 사진 준비',
            body: '정면에 가깝고 얼굴과 상체가 잘 보이는 강아지 또는 고양이 사진을 준비합니다.',
          },
          {
            title: '2. 의상 이미지 넣기',
            body: '직접 업로드해도 되고, 다른 웹사이트에서 의상 이미지를 바로 끌어와 업로드 박스에 놓아도 됩니다.',
          },
          {
            title: '3. 결과 확인',
            body: '생성이 끝나면 결과를 저장하고, 마이페이지 히스토리에서 다시 열어 비교할 수 있습니다.',
          },
        ],
        sampleShowcaseTitle: '이런 이미지로 시작하면 이해가 빠릅니다',
        sampleShowcaseDescription: '사용 방법 페이지에는 강아지/고양이 샘플과 의상 샘플을 함께 보여줘서 어떤 입력을 넣는지 바로 감이 오게 구성했습니다.',
        dogSampleLabel: '강아지 샘플 사진',
        catSampleLabel: '고양이 샘플 사진',
        outfitSampleLabel: '의상 샘플 이미지',
        inputFaceLabel: '반려동물 사진',
        inputClothLabel: '샘플 의상',
        resultLabel: '예시 결과',
        stepChooseFace: '반려동물 사진 넣기',
        stepChooseCloth: '샘플 의상 선택',
        stepGenerate: '생성 후 결과 확인',
        faceCaption: '실제 히스토리에서 사용한 반려동물 입력 이미지를 예시로 고정해 두었습니다.',
        clothCaption: '의상 이미지는 직접 업로드하거나 외부 웹페이지에서 드래그해서 넣을 수 있습니다.',
        resultCaption: '2026-03-19 23:03 기준 히스토리 결과 이미지를 예시로 고정해 두었습니다.',
        emptyResultTitle: '히스토리 결과가 아직 없습니다',
        emptyResultDescription: '로그인 후 강아지나 고양이 이미지를 한 번 생성하면 이 칸에 내 실제 결과가 표시됩니다.',
        dragGuideTitle: '다른 웹사이트 이미지도 바로 끌어다 넣을 수 있습니다',
        dragGuideDescription: '의상 쇼핑몰, 블로그, 이미지 검색 페이지에서 마음에 드는 의상 사진을 찾았다면 저장하지 않고 바로 드래그해서 업로드 박스에 놓아도 됩니다.',
        dragBrowserLabel: '웹페이지의 의상 이미지',
        dragDropzoneLabel: '의상 업로드 박스',
        dragDropzoneHint: '이미지를 끌어서 여기 놓기',
        dragGuideSteps: [
          '브라우저에서 의상 이미지를 찾습니다.',
          '이미지를 클릭한 채로 HAMDEVA 업로드 박스로 끌어옵니다.',
          '놓는 즉시 이미지가 업로드되어 미리보기에 반영됩니다.',
        ],
        checklistTitle: '업로드 전 체크하면 좋은 것',
        checklistItems: [
          '강아지나 고양이 얼굴이 너무 작거나 심하게 가려지지 않은 사진을 고릅니다.',
          '의상은 전체 형태와 앞면 디테일이 보이는 이미지를 고르는 편이 안정적입니다.',
          '배경이 단순하고 조명이 고른 이미지를 쓰면 결과가 더 깔끔합니다.',
        ],
        resultTipsTitle: '생성 후 이렇게 확인하세요',
        resultTips: [
          '마이페이지 히스토리에서 입력 이미지와 결과 이미지를 함께 비교할 수 있습니다.',
          '마음에 드는 결과는 다운로드해서 저장하거나 다음 의상과 비교해 볼 수 있습니다.',
          '의상만 바꿔 다시 생성하면 같은 반려동물로 여러 스타일을 빠르게 비교할 수 있습니다.',
        ],
      }
    : {
        eyebrow: 'Real on-screen flow',
        title: 'How to use HAMDEVA with pet photos and outfit images',
        description: 'This guide shows the full flow: upload a pet photo, drag an outfit image from another website if you want, then review the saved result in My Page.',
        summaryCards: [
          {
            title: '1. Prepare a pet photo',
            body: 'Use a clear dog or cat photo where the face and upper body are easy to read.',
          },
          {
            title: '2. Add an outfit image',
            body: 'You can upload a file directly or drag an outfit image from another website into the upload box.',
          },
          {
            title: '3. Review the result',
            body: 'After generation, save the result and open it again from your My Page history.',
          },
        ],
        sampleShowcaseTitle: 'Quick visual examples',
        sampleShowcaseDescription: 'The page shows dog, cat, and outfit sample images so the input structure is easy to understand at a glance.',
        dogSampleLabel: 'Dog sample photo',
        catSampleLabel: 'Cat sample photo',
        outfitSampleLabel: 'Outfit sample image',
        inputFaceLabel: 'Pet photo',
        inputClothLabel: 'Sample outfit',
        resultLabel: 'Example result',
        stepChooseFace: 'Add pet photo',
        stepChooseCloth: 'Choose sample outfit',
        stepGenerate: 'Generate and review',
        faceCaption: 'This stage uses a fixed pet input image from the saved history example.',
        clothCaption: 'The outfit image can be uploaded directly or dragged in from another web page.',
        resultCaption: 'This stage uses the saved history result captured on 2026-03-19 23:03 as a fixed example.',
        emptyResultTitle: 'No history result yet',
        emptyResultDescription: 'Generate one pet fitting result after signing in and this guide will show your saved result here.',
        dragGuideTitle: 'You can drag images in from other websites',
        dragGuideDescription: 'If you find an outfit image on a shopping page, blog, or image search result, you can drag it straight into HAMDEVA without saving it first.',
        dragBrowserLabel: 'Outfit image on a web page',
        dragDropzoneLabel: 'Outfit upload box',
        dragDropzoneHint: 'Drag the image here to upload',
        dragGuideSteps: [
          'Open a web page that shows the outfit image you want to test.',
          'Drag the image from the page into the HAMDEVA upload area.',
          'Drop it and the preview will update right away.',
        ],
        checklistTitle: 'Before you upload',
        checklistItems: [
          'Choose a dog or cat photo with a visible face and stable pose.',
          'Use an outfit image where the full shape and front details are easy to see.',
          'Simple backgrounds and balanced lighting usually give cleaner results.',
        ],
        resultTipsTitle: 'After generation',
        resultTips: [
          'Open My Page history to compare the input images and the final result together.',
          'Download the result you want to keep or compare it with another outfit.',
          'Try the same pet photo with different outfits to review multiple looks quickly.',
        ],
      };
  const paymentSessionId = (() => {
    const params = new URLSearchParams(routeSearch);
    return params.get('session_id') || params.get('transaction_id') || params.get('checkout_id');
  })();
  const editorialUiCopy = getEditorialUiCopy(lang);
  const pricingUiCopy = getPricingUiCopy(lang);
  const subscriptionProducts = CREDIT_PRODUCTS.filter((product) => product.kind === 'subscription');
  const extraCreditProducts = CREDIT_PRODUCTS.filter((product) => product.kind === 'extra_credit');
  const currentPageCopy = getPageCopy(currentPage, lang, contentLocale);
  const currentEditorialPage = getEditorialPage(currentPage);
  const relatedEditorialCards = currentEditorialPage
    ? Array.from(new Set(currentEditorialPage.relatedPages.map((page) => page === 'countries' ? 'traditional-clothing' : page)))
      .filter((page): page is typeof FEATURED_EDITORIAL_PAGES[number] => page !== currentPage)
      .map((page) => ({
        page,
        title: contentLocale.nav[page] ?? getEditorialPageTitle(page),
        description: lang === 'en'
          ? getEditorialPageSummary(page)
          : ((contentLocale.pages[page as keyof typeof contentLocale.pages] as { description?: string } | undefined)?.description ?? getEditorialPageSummary(page)),
      }))
    : [];
  const currentHomeFaqItems = landingContent.faq.items;
  const subjectUi = getSubjectUiText(lang);
  const logoutModalCopy = {
    title: t.logoutConfirmTitle,
    body: t.logoutConfirmBody,
    cancel: t.cancel,
    confirm: t.logoutConfirmAction,
  };
  const normalizedPathname = window.location.pathname.replace(/\/+$/, '') || '/';
  const currentFaqItems = getFaqItemsForPage(currentPage, currentEditorialPage?.faq);
  const breadcrumbItems = currentPage === 'home'
    ? [{ name: 'Home', url: `${SITE_URL}/` }]
    : currentPageCopy
      ? [
          { name: 'Home', url: `${SITE_URL}/` },
          { name: currentPageCopy.title, url: `${SITE_URL}${PAGE_PATHS[currentPage]}` },
        ]
      : [];
  const homeStructuredData = currentPage === 'home' && !sharedResultRouteId
    ? [
        createFAQPageSchema(currentHomeFaqItems),
        createBreadcrumbSchema(breadcrumbItems),
        createOrganizationSchema({
          name: 'HAMDEVA',
          url: SITE_URL,
          logo: `${SITE_URL}/og-image.png`,
          description: 'HAMDEVA is an AI pet fitting platform for dogs and cats.',
          contactEmail: SUPPORT_EMAIL,
          contactType: 'customer support',
        }),
        createWebSiteSchema({
          name: 'HAMDEVA',
          url: SITE_URL,
          description: 'Upload your dog or cat photo and try different outfits instantly with AI.',
        }),
      ]
    : [];
  const pageStructuredData = currentPage !== 'home' && !sharedResultRouteId && INDEXABLE_PAGES.has(currentPage) && currentPageCopy && breadcrumbItems.length > 0
    ? [
        createWebPageSchema({
          title: currentPageCopy.title,
          url: `${SITE_URL}${PAGE_PATHS[currentPage]}`,
          description: currentPageCopy.description,
          pageType: currentPage === 'about' ? 'AboutPage' : 'WebPage',
        }),
        createBreadcrumbSchema(breadcrumbItems),
        ...(currentFaqItems.length > 0 ? [createFAQPageSchema(currentFaqItems)] : []),
      ]
    : [];
  const {
    adminSummary,
    adminLoading,
    adminError,
    refreshAdminSummary,
  } = useAdminDashboardData({
    db,
    enabled: Boolean(isAdminUser),
  });
  const {
    sharedResultRecord,
    sharedResultLoading,
    sharedResultError,
  } = useSharedResult({
    db,
    sharedResultRouteId,
    notFoundMessage: t.resultNotFound,
  });
  useCreditBootstrap({
    currentUser,
    rewardMessage: t.todayDailyRewardGranted,
    signupBonusMessage: t.signupBonusGranted,
    setCreditNotice,
    setUserProfile,
  });
  usePaymentSessionStatus({
    currentPage,
    currentUser,
    paymentSessionId,
    statusMessages: {
      verifying: t.paymentVerifying,
      success: t.paymentSuccessReady,
      failed: t.paymentFailedMessage,
      verifyFailed: t.paymentVerifyFailed,
    },
    setPaymentStatusMessage,
    setUserProfile,
  });
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
      const pathname = window.location.pathname;
      const hash = window.location.hash;
      const search = window.location.search;
      const sharedResultId = getSharedResultIdFromPath(pathname);

      if (!sharedResultId) {
        const normalizedPath = normalizePathname(pathname);
        const canonicalPath = getCanonicalPathFromLocation(pathname, hash);
        if (normalizedPath !== canonicalPath || hash) {
          window.history.replaceState(null, '', `${canonicalPath}${search}`);
        }
      }

      setCurrentPage(getPageFromLocation(window.location.pathname, window.location.hash));
      setSharedResultRouteId(getSharedResultIdFromPath(window.location.pathname));
      setRouteSearch(window.location.search);
    };

    syncRoute();
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
      setBoardNotices([]);
      return;
    }

    const postsQuery = query(collection(db, 'bbsPosts'), orderBy('createdAt', 'desc'));
    const noticesQuery = query(collection(db, 'boardNotices'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
      setBbsPosts(snapshot.docs.map((postDoc) => ({
        id: postDoc.id,
        ...(postDoc.data() as Omit<BbsPostRecord, 'id'>),
      })).filter((post) => !post.deleted));
    }, (error) => {
      console.error('Failed to load board posts:', error);
      setBbsStatus(t.boardFailed);
    });

    const unsubscribeNotices = onSnapshot(noticesQuery, (snapshot) => {
      setBoardNotices(snapshot.docs.map((noticeDoc) => ({
        id: noticeDoc.id,
        ...(noticeDoc.data() as Omit<BoardNoticeRecord, 'id'>),
      })));
    }, (error) => {
      console.error('Failed to load board notices:', error);
      setNoticeStatus(boardUiCopy.boardNoticeFailed);
    });

    return () => {
      unsubscribe();
      unsubscribeNotices();
    };
  }, [boardUiCopy.boardNoticeFailed, db, t.boardFailed]);
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
      const nextItems = snapshot.docs.map((historyDoc) => ({
        id: historyDoc.id,
        ...(historyDoc.data() as Omit<GenerationRecord, 'id'>),
      }));
      const now = Date.now();
      const expiredItems = nextItems.filter((item) => {
        const expiresAt = getHistoryExpiryMillis(item);
        return typeof expiresAt === 'number' && expiresAt <= now;
      });

      if (expiredItems.length > 0) {
        void Promise.all(expiredItems.map((item) =>
          deleteDoc(doc(db, 'generations', item.id)).catch((error) => {
            console.error('Failed to delete expired history item:', error);
          }),
        ));
      }

      setHistoryItems(nextItems.filter((item) => {
        const expiresAt = getHistoryExpiryMillis(item);
        return !(typeof expiresAt === 'number' && expiresAt <= now);
      }));
    });

    return () => {
      unsubscribeProfile();
      unsubscribeHistory();
    };
  }, [currentUser]);
  useEffect(() => {
    const handleOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!headerLangMenuRef.current?.contains(target)) {
        setHeaderLangMenuOpen(false);
      }
      if (!headerAccountMenuRef.current?.contains(target)) {
        setHeaderAccountMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);
  useEffect(() => {
    setMobileMenuOpen(false);
    setHeaderLangMenuOpen(false);
    setHeaderAccountMenuOpen(false);
  }, [currentPage, lang]);
  useEffect(() => {
    setShowCreditPlanModal(false);
    setShowMyPageModal(false);
    setShowAdminModal(false);
    setShowLogoutConfirmModal(false);
    if (resultPreviewModalSrc?.startsWith('blob:')) {
      URL.revokeObjectURL(resultPreviewModalSrc);
    }
    setShowResultPreviewModal(false);
    setResultPreviewModalSrc(null);
    setResultPreviewModalLoading(false);
    setResultPreviewZoom(1);
  }, [currentPage]);
  useEffect(() => {
    if (currentUser) {
      return;
    }

    setShowCreditPlanModal(false);
    setShowMyPageModal(false);
    setShowAdminModal(false);
    closeResultPreviewModal();
  }, [currentUser]);
  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }

    setHeaderAccountMenuOpen(false);

    mobileMenuCloseRef.current?.focus();
  }, [mobileMenuOpen]);
  useEffect(() => {
    if (!mobileMenuOpen) {
      document.body.style.removeProperty('overflow');
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileMenuOpen]);
  useEffect(() => {
    const hasOverlayModal = showCreditPlanModal
      || showMyPageModal
      || showAdminModal
      || showLogoutConfirmModal
      || showResultPreviewModal;
    if (!hasOverlayModal) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [showCreditPlanModal, showMyPageModal, showAdminModal, showLogoutConfirmModal, showResultPreviewModal]);
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  useEffect(() => {
    if (!mobileMenuOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);
  useEffect(() => {
    if (!activePersonImage) {
      setPersonPreviewState('idle');
      return;
    }

    if (personFile) {
      setPersonPreviewState('ready');
      return;
    }

    if (personImage?.startsWith('data:')) {
      return;
    }

    setPersonPreviewState('loading');
  }, [activePersonImage, personFile, personImage]);
  useEffect(() => {
    if (!activeClothImage) {
      setClothPreviewState('idle');
      return;
    }

    if (clothFile) {
      setClothPreviewState('ready');
      return;
    }

    if (clothImage?.startsWith('data:')) {
      return;
    }

    setClothPreviewState('loading');
  }, [activeClothImage, clothFile, clothImage]);
  useEffect(() => {
    if (!finalImageSrc) {
      setResultPreviewState('idle');
    }
  }, [finalImageSrc]);
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
  }, []);
  useEffect(() => {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    const isPreviewHost = isPreviewRuntimeHost(hostname);
    const isIndexablePage = !sharedResultRouteId && INDEXABLE_PAGES.has(currentPage);
    const isAdSenseEligiblePage = !isPreviewHost && !sharedResultRouteId && ADSENSE_ELIGIBLE_PAGES.has(currentPage);
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
      : currentPage === 'payment-success'
        ? {
            title: `${t.paymentSuccessTitle} | HAMDEVA`,
            description: paymentStatusMessage || t.paymentVerifying,
          }
      : currentPage === 'payment-failed'
        ? {
            title: `${t.paymentFailedTitle} | HAMDEVA`,
            description: t.paymentFailedDescription,
          }
      : currentPage === 'home'
        ? {
            title: contentLocale.meta.homeTitle,
            description: contentLocale.meta.homeDescription,
          }
        : currentPageCopy ?? {
            title: 'HAMDEVA',
            description: 'HAMDEVA content page',
          };
    const pageUrl = sharedResultRouteId
      ? buildSharedResultUrl(sharedResultRouteId)
      : `${SITE_URL}${PAGE_PATHS[currentPage]}`;
    const pageKeywords = PAGE_KEYWORDS[currentPage] ?? SITE_KEYWORDS;
    const ogImage = sharedResultRecord?.resultImageUrl || `${SITE_URL}/og-image.png`;
    const robotsContent = isPreviewHost || !isIndexablePage
      ? 'noindex, nofollow, noarchive, nosnippet'
      : 'index, follow';

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
    upsertMeta('meta[property="og:url"]', { property: 'og:url', content: pageUrl });
    upsertMeta('meta[property="og:image"]', { property: 'og:image', content: ogImage });
    upsertMeta('meta[name="keywords"]', { name: 'keywords', content: pageKeywords });
    upsertMeta('meta[name="twitter:card"]', { name: 'twitter:card', content: 'summary_large_image' });
    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: pageMeta.title });
    upsertMeta('meta[name="twitter:description"]', { name: 'twitter:description', content: pageMeta.description });
    upsertMeta('link[rel="canonical"]', { rel: 'canonical', href: pageUrl });
    upsertMeta('meta[name="robots"]', { name: 'robots', content: robotsContent });

    if (isAdSenseEligiblePage) {
      setAdRequestsPaused(false);
      ensureAdSenseScript();
    } else {
      setAdRequestsPaused(true);
      removeAutoAdsArtifacts();
      removeAdSenseScript();
    }
  }, [contentLocale, currentPage, currentPageCopy, paymentStatusMessage, sharedResultRecord, sharedResultRouteId, t.adminSubtitle, t.adminTitle, t.paymentFailedDescription, t.paymentFailedTitle, t.paymentSuccessTitle, t.paymentVerifying, t.sharedResultDescription, t.sharedResultTitle]);

  const detectSubjectTypeFromImage = async (source: File | string) => {
    setSubjectDetectionStatus('detecting');
    try {
      const prepared = source instanceof File
        ? await blobToDataUrl(source).then((src) => resizeImage(src, 768))
        : await ensureDataUrl(source).then((src) => resizeImage(src, 768));
      const detected = await callSubjectClassifier(prepared);
      setDetectedSubjectType(detected);
      if (detected === 'human') {
        setSubjectDetectionStatus('error');
        setPersonUploadMessage(petOnlyImageMessage);
        alert(petOnlyImageMessage);
        return;
      }
      if (!subjectTypeManualOverride) {
        setSubjectType(detected);
      }
      setPersonUploadMessage(null);
      setSubjectDetectionStatus('ready');
    } catch (error) {
      console.error('Failed to classify subject type:', error);
      setSubjectDetectionStatus('error');
    }
  };

  const loadPersonUpload = async (file: File) => {
    if (isGenerating) {
      return;
    }
    if (personImage?.startsWith('blob:')) URL.revokeObjectURL(personImage);
    const previewUrl = URL.createObjectURL(file);
    setSelectedSampleUrl(null);
    setPersonFile(file);
    setPersonImage(previewUrl);
    setSubjectTypeManualOverride(false);
    setDetectedSubjectType(null);
    setPersonUploadMessage(null);
    setPersonPreviewState('ready');
    void detectSubjectTypeFromImage(file);
  };

  const loadClothUpload = async (file: File) => {
    if (isGenerating) {
      return;
    }
    if (clothImage?.startsWith('blob:')) URL.revokeObjectURL(clothImage);
    const previewUrl = URL.createObjectURL(file);
    setSelectedClothSampleUrl(null);
    setClothFile(file);
    setClothImage(previewUrl);
    setClothUploadMessage(null);
    setClothPreviewState('ready');
  };

  const handlePersonExternalDrop = async (source: File | string) => {
    try {
      setPersonUploadMessage(t.loadingImage);
      setPersonPreviewState('loading');
      const file = source instanceof File ? source : await createImageFileFromRemoteSource(source, 'hamdeva-person-drop');
      await loadPersonUpload(file);
    } catch (error) {
      console.error('Failed to import dropped person image:', error);
      setPersonUploadMessage(null);
      setPersonPreviewState('error');
      alert(t.imageLoadError);
    }
  };

  const handleClothExternalDrop = async (source: File | string) => {
    try {
      setClothUploadMessage(t.loadingImage);
      setClothPreviewState('loading');
      const file = source instanceof File ? source : await createImageFileFromRemoteSource(source, 'hamdeva-cloth-drop');
      await loadClothUpload(file);
    } catch (error) {
      console.error('Failed to import dropped clothing image:', error);
      setClothUploadMessage(null);
      setClothPreviewState('error');
      alert(t.imageLoadError);
    }
  };

  const loadPersonSample = async (url: string, category: FaceCategory) => {
    if (isGenerating) {
      return;
    }

    if (personImage?.startsWith('blob:')) URL.revokeObjectURL(personImage);
    setSelectedSampleUrl(url);
    setGender(category);
    setSubjectTypeManualOverride(false);
    setDetectedSubjectType(null);
    setPersonImage(null);
    setPersonFile(null);
    setPersonUploadMessage(null);
    setPersonPreviewState('loading');

    try {
      const sampleDataUrl = await fetchAssetDataUrl(url);
      setPersonImage(sampleDataUrl);
      setPersonPreviewState('ready');
      void detectSubjectTypeFromImage(sampleDataUrl);
    } catch (error) {
      console.error('[HAMDEVA] failed to prepare face sample', { url, error });
      setPersonPreviewState('error');
    }
  };

  const loadClothSample = async (url: string) => {
    if (isGenerating) {
      return;
    }

    if (clothImage?.startsWith('blob:')) URL.revokeObjectURL(clothImage);
    setSelectedClothSampleUrl(url);
    setClothImage(null);
    setClothFile(null);
    setClothUploadMessage(null);
    setClothPreviewState('loading');

    try {
      const sampleDataUrl = await fetchAssetDataUrl(url);
      setClothImage(sampleDataUrl);
      setClothPreviewState('ready');
    } catch (error) {
      console.error('[HAMDEVA] failed to prepare cloth sample', { url, error });
      setClothPreviewState('error');
    }
  };

  const handleOpenPersonSampleModal = () => {
    if (isGenerating) {
      return;
    }
    setShowSampleModal(true);
  };
  const handleOpenClothSampleModal = () => {
    if (isGenerating) {
      return;
    }
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
    setResultWatermarkApplied(false);
    setResultUsedCreditType(null);
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
    clearGeneratedResult();
    void loadClothSample(randomSample.image);
    setShowTryOnModal(true);
  };
  const handleTryAnotherOutfit = () => {
    if (clothImage?.startsWith('blob:')) URL.revokeObjectURL(clothImage);
    setClothImage(null);
    setClothFile(null);
    setSelectedClothSampleUrl(null);
    setClothUploadMessage(null);
    setClothPreviewState('idle');
    clearGeneratedResult();
    setShowTryOnModal(true);
  };
  const handleDownloadResult = async (src: string) => {
    try {
      await downloadImageFile(src, buildTimestampedImageFilename());
    } catch (error) {
      console.error('Failed to download result image:', error);
      setShareStatus(t.alertError);
    }
  };
  const ensureSharedResultLink = async (link: string | null): Promise<string | null> => {
    if (link) {
      return link;
    }

    if (latestSharedResultId) {
      return buildSharedResultUrl(latestSharedResultId);
    }

    if (!finalImageSrc || !currentUser) {
      setShareStatus(t.noResultToShare);
      return null;
    }

    try {
      const sharedPreview = await createHistoryPreview(finalImageSrc, 720);
      const publicResultRef = doc(collection(requireDb(), 'publicResults'));

      await setDoc(publicResultRef, {
        uid: currentUser.uid,
        resultImageUrl: sharedPreview,
        language: lang,
        createdAt: serverTimestamp(),
        sharedAt: serverTimestamp(),
      });

      setLatestSharedResultId(publicResultRef.id);
      return buildSharedResultUrl(publicResultRef.id);
    } catch (error) {
      console.error('Failed to create shared result link:', error);
      setShareStatus(t.shareLinkUnavailable);
      return null;
    }
  };
  const handleCopyLink = async (link: string | null) => {
    const resolvedLink = await ensureSharedResultLink(link);
    if (!resolvedLink) {
      return;
    }

    try {
      await navigator.clipboard.writeText(resolvedLink);
      setShareStatus(t.linkCopied);
    } catch (error) {
      console.error('Failed to copy share link:', error);
      setShareStatus(t.linkCopyFailed);
    }
  };
  const handleShareLink = async (link: string | null) => {
    const resolvedLink = await ensureSharedResultLink(link);
    if (!resolvedLink) {
      return;
    }

    const shareImageSrc = finalImageSrc || sharedResultRecord?.resultImageUrl || null;

    if (navigator.share) {
      try {
        const sharePayload = {
          title: 'HAMDEVA | AI Pet Outfit Generator',
          text: t.shareDefaultText,
          url: resolvedLink,
        };

        if (shareImageSrc) {
          try {
            const shareFile = await createShareImageFile(shareImageSrc);
            if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [shareFile] })) {
              await navigator.share({
                ...sharePayload,
                files: [shareFile],
              });
              return;
            }
          } catch (error) {
            console.error('Failed to attach image to share payload:', error);
          }
        }

        await navigator.share(sharePayload);
        return;
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
      }
    }

    openShareWindow(`https://twitter.com/intent/tweet?text=${encodeURIComponent(t.shareDefaultText)}&url=${encodeURIComponent(resolvedLink)}`);
  };
  const handleShareOnKakao = async (link: string | null) => {
    const resolvedLink = await ensureSharedResultLink(link);
    if (!resolvedLink) {
      return;
    }

    const shareImageSrc = [finalImageSrc, sharedResultRecord?.resultImageUrl]
      .find((value): value is string => typeof value === 'string' && /^https?:\/\//.test(value))
      ?? 'https://hamdeva.com/og-image.png';

    try {
      const kakao = await loadKakaoSdk();
      if (!kakao?.Share?.sendDefault) {
        await handleShareLink(link);
        return;
      }

      kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title: 'HAMDEVA | AI Pet Outfit Generator',
          description: 'Upload your pet photo and outfit image to generate an AI pet fitting preview in seconds.',
          imageUrl: shareImageSrc,
          link: {
            mobileWebUrl: resolvedLink,
            webUrl: resolvedLink,
          },
        },
        buttons: [
          {
            title: 'Open Result',
            link: {
              mobileWebUrl: resolvedLink,
              webUrl: resolvedLink,
            },
          },
        ],
      });
    } catch (error) {
      console.error('Failed to share on Kakao:', error);
      await handleShareLink(link);
    }
  };
  const handleShareOnLine = async (link: string | null) => {
    const resolvedLink = await ensureSharedResultLink(link);
    if (!resolvedLink) {
      return;
    }

    openShareWindow(`https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(resolvedLink)}`);
  };
  const handleShareOnX = async (link: string | null) => {
    const resolvedLink = await ensureSharedResultLink(link);
    if (!resolvedLink) {
      return;
    }

    openShareWindow(`https://twitter.com/intent/tweet?text=${encodeURIComponent(t.shareDefaultText)}&url=${encodeURIComponent(resolvedLink)}`);
  };
  const handleShareOnFacebook = async (link: string | null) => {
    const resolvedLink = await ensureSharedResultLink(link);
    if (!resolvedLink) {
      return;
    }

    openShareWindow(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(resolvedLink)}`);
  };
  const handleInstagramSave = async (src: string | null) => {
    if (!src) {
      setShareStatus(t.imageNotReady);
      return;
    }

    try {
      await downloadImageFile(src, buildTimestampedImageFilename('hamdeva-instagram'));
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
  const handleStartCheckout = async (productId: CheckoutProductId) => {
    if (!currentUser || isStartingCheckout) {
      if (!currentUser) {
        openAuthModal('login');
      }
      return;
    }

    setIsStartingCheckout(productId);
    try {
      const authToken = await currentUser.getIdToken();
      const session = await callCreateCheckoutSession({
        authToken,
        productId,
        uid: currentUser.uid,
      });

      if (!session.checkoutUrl) {
        throw new Error('PAYMENT_NOT_CONFIGURED');
      }

      setShowCreditPlanModal(false);
      setMobileMenuOpen(false);
      window.location.href = session.checkoutUrl;
    } catch (error) {
      console.error('Failed to start LemonSqueezy checkout:', error);
      const message = error instanceof Error && error.message === 'PAYMENT_NOT_CONFIGURED'
        ? t.paymentConfigError
        : t.paymentConfigError;
      alert(message);
    } finally {
      setIsStartingCheckout(null);
    }
  };
  const openCreditPlanModal = () => {
    if (!currentUser) {
      openAuthModal('login');
      return;
    }

    setHeaderAccountMenuOpen(false);
    setMobileMenuOpen(false);
    setShowMyPageModal(false);
    setShowAdminModal(false);
    setShowCreditPlanModal(true);
  };
  const openMyPageModal = () => {
    if (!currentUser) {
      openAuthModal('login');
      return;
    }

    setHeaderAccountMenuOpen(false);
    setMobileMenuOpen(false);
    setShowCreditPlanModal(false);
    setShowAdminModal(false);
    navigateToPage('mypage');
  };
  const openAdminModal = () => {
    if (!currentUser) {
      openAuthModal('login');
      return;
    }
    if (!isAdminUser) {
      return;
    }

    setMobileMenuOpen(false);
    setShowCreditPlanModal(false);
    setShowMyPageModal(false);
    navigateToPage('admin');
  };
  const closeResultPreviewModal = () => {
    if (resultPreviewModalSrc?.startsWith('blob:')) {
      URL.revokeObjectURL(resultPreviewModalSrc);
    }
    setShowResultPreviewModal(false);
    setResultPreviewModalSrc(null);
    setResultPreviewModalLoading(false);
    setResultPreviewZoom(1);
  };
  const openResultPreviewModal = (src: string) => {
    if (resultPreviewModalSrc?.startsWith('blob:')) {
      URL.revokeObjectURL(resultPreviewModalSrc);
    }
    setResultPreviewModalLoading(false);
    setResultPreviewZoom(1);
    setResultPreviewModalSrc(src);
    setShowResultPreviewModal(true);
  };
  const handleOpenHistoryItem = async (item: GenerationRecord) => {
    if (item.imageUrl) {
      openResultPreviewModal(item.imageUrl);
    }
  };
  const handleToggleHistoryPreserve = async (item: GenerationRecord) => {
    if (!db || !currentUser) {
      return;
    }

    const generationRef = doc(db, 'generations', item.id);
    const preservedUntil = getTimestampMillis(item.preservedUntil);
    const isCurrentlyPreserved = typeof preservedUntil === 'number' && preservedUntil > Date.now();

    if (!isCurrentlyPreserved && preservedHistoryCount >= PRESERVED_HISTORY_LIMIT) {
      alert(t.historyArchiveLimit(PRESERVED_HISTORY_LIMIT));
      return;
    }

    try {
      await updateDoc(generationRef, isCurrentlyPreserved ? {
        preservedAt: null,
        preservedUntil: null,
        updatedAt: serverTimestamp(),
      } : {
        preservedAt: serverTimestamp(),
        preservedUntil: Timestamp.fromMillis(Date.now() + PRESERVED_HISTORY_RETENTION_MS),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Failed to update history retention:', error);
      alert(t.historyArchiveFailed);
    }
  };
  const handleDownloadHistoryItem = async (item: GenerationRecord) => {
    try {
      if (item.imageUrl) {
        await downloadImageFile(item.imageUrl, `hamdeva-result-${item.id}.png`);
      }
    } catch (error) {
      console.error('Failed to download history item:', error);
      alert(t.historyDownloadFailed);
    }
  };
  const handleDeleteHistoryItem = async (item: GenerationRecord) => {
    if (!db) {
      return;
    }

    const confirmed = window.confirm(t.historyDeleteConfirm);
    if (!confirmed) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'generations', item.id));
    } catch (error) {
      console.error('Failed to delete history item:', error);
      alert(t.historyDeleteFailed);
    }
  };
  const openLogoutConfirmModal = () => {
    setHeaderAccountMenuOpen(false);
    setMobileMenuOpen(false);
    setShowLogoutConfirmModal(true);
  };
  const handleConfirmedLogout = async () => {
    await handleLogout();
    setShowMyPageModal(false);
    setShowAdminModal(false);
    setShowCreditPlanModal(false);
    setShowLogoutConfirmModal(false);
  };
  const navigateToPage = (page: SitePage) => {
    const resolvedPage = page === 'countries' ? 'traditional-clothing' : page;
    const nextUrl = PAGE_PATHS[resolvedPage];
    window.history.pushState(null, '', nextUrl);
    setCurrentPage(resolvedPage);
    setSharedResultRouteId(null);
    setRouteSearch('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const handleHeroCta = () => {
    setShowTryOnModal(true);
  };
  const openOutfitGuide = (guideId: string) => {
    setSelectedOutfitGuideId(guideId);
  };
  const closeOutfitGuide = () => {
    setSelectedOutfitGuideId(null);
  };
  const openBreedGuide = (guideId: string) => {
    setSelectedBreedGuideId(guideId);
  };
  const closeBreedGuide = () => {
    setSelectedBreedGuideId(null);
  };
  const handleStartGuideTryOn = async (imageUrl: string) => {
    closeOutfitGuide();
    await loadClothSample(imageUrl);
    setShowTryOnModal(true);
  };
  const handleStartBreedTryOn = async (imageUrl: string, category: FaceCategory) => {
    closeBreedGuide();
    await loadPersonSample(imageUrl, category);
    setShowTryOnModal(true);
  };
  const openAuthModal = (mode: AuthMode) => {
    if (!isFirebaseConfigured) {
      setAuthMode(mode);
      setAuthError(getFirebaseDisabledMessage(firebaseDisabledBaseMessage));
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
      setAuthError(getFirebaseDisabledMessage(firebaseDisabledBaseMessage));
      return;
    }
    const normalizedEmail = authForm.email.trim();
    if (!normalizedEmail || !authForm.password) {
      setAuthError(t.authInvalid);
      return;
    }

    setAuthSubmitting(true);
    setAuthError(null);
    try {
      let signedInUser: User;
      if (authMode === 'login') {
        const credential = await signInWithEmailAndPassword(auth, normalizedEmail, authForm.password);
        signedInUser = credential.user;
      } else {
        const credential = await createUserWithEmailAndPassword(auth, normalizedEmail, authForm.password);
        signedInUser = credential.user;
      }
      setShowAuthModal(false);
      setAuthForm({ email: '', password: '' });
      void syncUserCreditsAfterAuth(signedInUser);
    } catch (error) {
      setAuthError(buildAuthErrorMessage(error, t.authFailed, authErrorCopy));
    } finally {
      setAuthSubmitting(false);
    }
  };
  const handleGoogleLogin = async () => {
    if (!auth || !googleProvider) {
      setAuthError(getFirebaseDisabledMessage(firebaseDisabledBaseMessage));
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
      setAuthError(buildAuthErrorMessage(error, t.authFailed, authErrorCopy));
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
      setBbsStatus(getFirebaseDisabledMessage(firebaseDisabledBaseMessage));
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
      setBbsStatus(isFirestorePermissionError(error) ? t.boardFailed : buildAuthErrorMessage(error, t.boardFailed, authErrorCopy));
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
      setBbsStatus(getFirebaseDisabledMessage(firebaseDisabledBaseMessage));
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
      setBbsStatus(isFirestorePermissionError(error) ? t.boardFailed : buildAuthErrorMessage(error, t.boardFailed, authErrorCopy));
    } finally {
      setBbsSubmitting(false);
    }
  };

  const handleBoardNoticeSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!db) {
      setNoticeStatus(getFirebaseDisabledMessage(firebaseDisabledBaseMessage));
      return;
    }

    if (!isAdminUser) {
      setNoticeStatus(boardUiCopy.boardNoticeAdminOnly);
      return;
    }

    if (!noticeForm.title.trim() || !noticeForm.content.trim()) {
      setNoticeStatus(boardUiCopy.boardNoticeInvalid);
      return;
    }

    setNoticeSubmitting(true);
    setNoticeStatus(boardUiCopy.boardNoticeSubmitting);
    try {
      await addDoc(collection(db, 'boardNotices'), {
        title: noticeForm.title.trim(),
        content: noticeForm.content.trim(),
        authorUid: currentUser?.uid || null,
        authorEmail: currentUser?.email || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setNoticeForm({ title: '', content: '' });
      setNoticeStatus(boardUiCopy.boardNoticeSaved);
    } catch (error) {
      console.error('Failed to create board notice:', error);
      setNoticeStatus(boardUiCopy.boardNoticeFailed);
    } finally {
      setNoticeSubmitting(false);
    }
  };

  const handleBoardNoticeDelete = async (notice: BoardNoticeRecord) => {
    if (!db || !isAdminUser) {
      setNoticeStatus(boardUiCopy.boardNoticeAdminOnly);
      return;
    }

    const confirmed = window.confirm(boardUiCopy.boardNoticeDeleteConfirm);
    if (!confirmed) {
      return;
    }

    setNoticeSubmitting(true);
    try {
      await deleteDoc(doc(db, 'boardNotices', notice.id));
      setNoticeStatus(boardUiCopy.boardNoticeDeleted);
    } catch (error) {
      console.error('Failed to delete board notice:', error);
      setNoticeStatus(boardUiCopy.boardNoticeFailed);
    } finally {
      setNoticeSubmitting(false);
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
    if (!canAffordGeneration) {
      alert(t.notEnoughCredits);
      return;
    }

    generationLockRef.current = true;
    setIsGenerating(true);
    const startedAt = Date.now();
    setShareStatus(null);
    setCreditNotice(null);
    setLatestSharedResultId(null);
    console.log('HAMDEVA AI: Starting image analysis and composition...');
    try {
      const [preparedPersonImage, preparedClothImage] = await withTimeout(
        Promise.all([
          prepareGenerationInput(personFile ?? activePersonImage, 1280),
          prepareGenerationInput(clothFile ?? activeClothImage, 1280),
        ]),
        GENERATION_PREP_TIMEOUT_MS,
        'GENERATION_PREP_TIMEOUT',
      );

      const verifiedSubjectType = await withTimeout(
        callSubjectClassifier(preparedPersonImage),
        GENERATION_PREP_TIMEOUT_MS,
        'SUBJECT_CLASSIFY_TIMEOUT',
      );
      if (verifiedSubjectType === 'human') {
        throw new Error('PET_ONLY_SUBJECT');
      }

      const resolvedSubjectType = normalizeSubjectType(verifiedSubjectType);
      const personInputLabel = getFaceInputLabel(lang, sampleBadgeLabel, selectedSampleUrl, personFile);
      const garmentInputLabel = getGarmentInputLabel(lang, sampleBadgeLabel, selectedClothSampleUrl, clothFile);
      const [personPreviewImage, garmentPreviewImage] = await Promise.all([
        createHistoryPreview(preparedPersonImage, 240),
        createHistoryPreview(preparedClothImage, 240),
      ]);

      const requestId = createRequestId();
      const authToken = await withTimeout(currentUser.getIdToken(), GENERATION_AUTH_TIMEOUT_MS, 'GENERATION_AUTH_TIMEOUT');
      const outfitPromptHints = getOutfitPromptHints({
        garmentLabel: garmentInputLabel,
        garmentImageUrl: selectedClothSampleUrl,
      });
      const resultPayload = await withTimeout(
        callTryOn({
          authToken,
          requestId,
          personImage: preparedPersonImage,
          garmentImage: preparedClothImage,
          personInputLabel,
          garmentInputLabel,
          personPreviewImage,
          garmentPreviewImage,
          subjectType: resolvedSubjectType,
          bodyProfile: {
            gender,
            outfitName: outfitPromptHints?.outfitName,
            outfitMood: outfitPromptHints?.mood,
            poseHint: outfitPromptHints?.pose,
            backgroundHint: outfitPromptHints?.background,
          },
        }),
        GENERATION_REQUEST_TIMEOUT_MS,
        'GENERATION_TIMEOUT',
      );
      const result = await withTimeout(
        preloadImageSource(resultPayload.image),
        GENERATION_IMAGE_READY_TIMEOUT_MS,
        'RESULT_IMAGE_TIMEOUT',
      );
      setResultPreviewState('loading');
      setFinalImageSrc(result);
      setSubjectType(normalizeSubjectType(resultPayload.subjectType || resolvedSubjectType));
      setResultWatermarkApplied(resultPayload.watermarkApplied === true);
      setResultUsedCreditType(resultPayload.usedCreditType ?? null);
      writeGenerationDuration(Date.now() - startedAt);
      setTimeout(() => document.getElementById('result-area')?.scrollIntoView({ behavior: 'smooth' }), 100);
      setIsGenerating(false);

      try {
        setUserProfile((prev) => prev ? {
          ...prev,
          dailyCredit: typeof resultPayload.dailyCredit === 'number' ? resultPayload.dailyCredit : prev.dailyCredit,
          paidCredit: typeof resultPayload.paidCredit === 'number' ? resultPayload.paidCredit : prev.paidCredit,
          totalGenerated: typeof resultPayload.totalGenerated === 'number' ? resultPayload.totalGenerated : prev.totalGenerated,
          credits: typeof resultPayload.creditsRemaining === 'number' ? resultPayload.creditsRemaining : prev.credits,
        } : prev);

        const notices = [
          resultPayload.dailyRewardGranted ? t.todayDailyRewardGranted : '',
        ].filter(Boolean);
        if (notices.length > 0) {
          setCreditNotice(notices.join(' '));
        }

      } catch (error) {
        console.error('Failed to persist generation history:', error);
      }
    } catch (err) {
      setResultPreviewState('error');
      alert(getGenerateErrorMessage(err, t, generationErrorCopy));
    } finally {
      generationLockRef.current = false;
      setIsGenerating(false);
    }
  };

  const tryOnStudioProps = {
    currentUser,
    isGenerating,
    activePersonImage,
    activeClothImage,
    personImage,
    clothImage,
    selectedSampleUrl,
    selectedClothSampleUrl,
    personPreviewState,
    clothPreviewState,
    resultPreviewState,
    personUploadMessage,
    clothUploadMessage,
    subjectType,
    detectedSubjectType,
    subjectDetectionStatus,
    finalImageSrc,
    creditNotice,
    currentCredits,
    currentDailyCredit,
    currentPaidCredit,
    canAffordGeneration,
    generationCost: GENERATION_COST,
    resultWatermarkApplied,
    shareResultLink,
    shareStatus,
    subjectUi,
    lang,
    subjectTypes: SUBJECT_TYPES,
    emptyFaceTips,
    emptyClothTips,
    emptyPreviewCopy,
    sampleBadgeLabel,
    copy: {
      ...t,
      loginComingSoon: loginComingSoonLabel,
      faceCopyrightNotice: translate('uploadGuides.faceCopyrightNotice'),
      clothingSafetyNotice: translate('uploadGuides.clothingSafetyNotice'),
      resultPrivacyNotice: translate('uploadGuides.resultPrivacyNotice'),
      openAuthModal,
      setPersonPreviewReady: () => {
        setPersonPreviewState('ready');
        setPersonUploadMessage(null);
      },
      setPersonPreviewError: () => {
        setPersonUploadMessage(null);
        setPersonPreviewState('error');
      },
      setClothPreviewReady: () => {
        setClothPreviewState('ready');
        setClothUploadMessage(null);
      },
      setClothPreviewError: () => {
        setClothUploadMessage(null);
        setClothPreviewState('error');
      },
      setResultPreviewReady: () => setResultPreviewState('ready'),
      setResultPreviewError: () => setResultPreviewState('error'),
    },
    personInputRef,
    clothInputRef,
    onOpenPersonSampleModal: handleOpenPersonSampleModal,
    onOpenClothSampleModal: handleOpenClothSampleModal,
    onPersonFileChange: (file: File) => { void loadPersonUpload(file); },
    onClothFileChange: (file: File) => { void loadClothUpload(file); },
    onPersonExternalDrop: (source: File | string) => { void handlePersonExternalDrop(source); },
    onClothExternalDrop: (source: File | string) => { void handleClothExternalDrop(source); },
    onClearPerson: () => {
      if (personImage?.startsWith('blob:')) URL.revokeObjectURL(personImage);
      setPersonImage(null);
      setPersonFile(null);
      setSelectedSampleUrl(null);
      setSubjectType('dog');
      setDetectedSubjectType(null);
      setSubjectDetectionStatus('idle');
      setSubjectTypeManualOverride(false);
      setPersonUploadMessage(null);
      setPersonPreviewState('idle');
    },
    onClearCloth: () => {
      if (clothImage?.startsWith('blob:')) URL.revokeObjectURL(clothImage);
      setClothImage(null);
      setClothFile(null);
      setSelectedClothSampleUrl(null);
      setClothUploadMessage(null);
      setClothPreviewState('idle');
    },
    onAutoDetectSubject: () => {
      const source = personFile || activePersonImage;
      if (source) {
        setSubjectTypeManualOverride(false);
        void detectSubjectTypeFromImage(source);
      }
    },
    onSubjectTypeChange: (value: SubjectType) => handleSubjectTypeChange(normalizeSubjectType(value)),
    onGenerate: () => { void handleGenerate(); },
    onNavigateToMyPage: () => navigateToPage('mypage'),
    onDownloadResult: (src: string) => { void handleDownloadResult(src); },
    onShareLink: (link: string | null) => { void handleShareLink(link); },
    onCopyLink: (link: string | null) => { void handleCopyLink(link); },
    onShareOnKakao: (link: string | null) => { void handleShareOnKakao(link); },
    onShareOnLine: handleShareOnLine,
    onShareOnX: handleShareOnX,
    onShareOnFacebook: handleShareOnFacebook,
    onInstagramSave: (src: string | null) => { void handleInstagramSave(src); },
    onTryAnotherOutfit: handleTryAnotherOutfit,
    onRandomOutfit: handleRandomOutfit,
    onOpenResultPreview: openResultPreviewModal,
    getSubjectTypeLabel,
  };

  return (
    <div className={`app-root ${darkMode ? 'dark' : ''} font-theme-${fontTheme}`}>
      <StructuredData data={homeStructuredData.length > 0 ? homeStructuredData : pageStructuredData} />
      <nav className="landing-nav">
        <div className="nav-content">
          <div className="nav-brand">
            <button className="nav-logo nav-logo-button" onClick={() => navigateToPage('home')} type="button">HAM<span>DEVA</span></button>
            <span className="app-version">{appVersion}</span>
          </div>
          <div className="nav-quick-scroll nav-inline-actions">
            <button className="generate-btn nav-quick-primary" onClick={handleHeroCta} type="button">
              {landingContent.hero.primaryButton}
            </button>
            <button className="nav-quick-btn" onClick={() => navigateToPage('how-it-works')} type="button">
              {contentLocale.nav['how-it-works']}
            </button>
            <button
              className={`nav-quick-btn nav-credit-btn ${currentUser ? 'has-balance' : ''}`}
              onClick={currentUser ? openMyPageModal : () => openAuthModal('login')}
              type="button"
            >
              {currentUser ? headerCreditLabel : t.creditCheck}
            </button>
            {currentUser && (
              <button className="nav-quick-btn nav-subscription-btn" onClick={openMyPageModal} type="button">
                {headerSubscriptionLabel}
              </button>
            )}
            <button className="outline-btn nav-quick-buy-btn" onClick={openCreditPlanModal} type="button">
              {t.chargeCredits}
            </button>
          </div>
          <div className="nav-mobile-tools">
            <div className="user-menu header-account-menu" ref={headerAccountMenuRef}>
              <button
                className={`outline-btn auth-inline-btn header-account-trigger ${currentUser ? 'is-authenticated' : ''}`}
                onClick={() => {
                  if (!currentUser) {
                    openAuthModal('login');
                    return;
                  }
                  setHeaderAccountMenuOpen((prev) => !prev);
                }}
                type="button"
              >
                {headerAccountLabel}
              </button>
              {currentUser && headerAccountMenuOpen && (
                <div className="user-menu-dropdown header-account-dropdown">
                  <button
                    className="header-account-dropdown-link"
                    onClick={openMyPageModal}
                    type="button"
                  >
                    {t.myPage}
                  </button>
                  <button
                    className="header-account-dropdown-link"
                    onClick={openLogoutConfirmModal}
                    type="button"
                  >
                    {t.logout}
                  </button>
                </div>
              )}
            </div>
            <div className="header-icon-menu" ref={headerLangMenuRef}>
              <button
                className="icon-toggle-btn"
                aria-expanded={headerLangMenuOpen}
                aria-label={t.languageLabel}
                onClick={() => setHeaderLangMenuOpen((prev) => !prev)}
                title={t.languageLabel}
                type="button"
              >
                <span aria-hidden="true">🌐</span>
              </button>
              {headerLangMenuOpen && (
                <div className="header-icon-dropdown">
                  {VISIBLE_LANGUAGE_OPTIONS.map((option) => (
                    <button
                      key={`header-lang-${option.value}`}
                      className={`lang-option ${lang === option.value ? 'active' : ''}`}
                      onClick={() => {
                        handleLanguageChange(option.value as LanguageCode);
                        setHeaderLangMenuOpen(false);
                      }}
                      type="button"
                    >
                      <span>{option.nativeLabel}</span>
                      <span>{option.shortLabel}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              className="dark-toggle icon-toggle-btn"
              aria-label={darkMode ? t.lightMode : t.darkMode}
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? t.lightMode : t.darkMode}
              type="button"
            >
              <span aria-hidden="true">{darkMode ? '☀️' : '🌙'}</span>
            </button>
            <button
              className="mobile-menu-toggle"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              type="button"
            >
              <span className="hamburger-icon" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
            </button>
          </div>
        </div>
      </nav>
      {mobileMenuOpen && (
        <div className="mobile-nav-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div
            id="mobile-menu"
            className="mobile-nav-panel"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mobile-nav-header">
              <button className="nav-logo nav-logo-button" onClick={() => navigateToPage('home')} type="button">
                HAM<span>DEVA</span>
              </button>
              <button
                ref={mobileMenuCloseRef}
                className="mobile-nav-close"
                aria-label={t.closeMobileMenu}
                onClick={() => setMobileMenuOpen(false)}
                type="button"
              >
                ×
              </button>
            </div>
            <div className="mobile-nav-section mobile-nav-links">
              {MOBILE_NAV_PAGES.map((page) => (
                <button
                  key={`mobile-${page}`}
                  className={`mobile-menu-link ${
                    normalizedPathname === PAGE_PATHS[page] || currentPage === page ? 'active' : ''
                  }`}
                  onClick={() => {
                    navigateToPage(page);
                    setMobileMenuOpen(false);
                  }}
                  type="button"
                >
                  {page === 'mypage' ? t.myPage : contentLocale.nav[page]}
                </button>
              ))}
            </div>
            <div className="mobile-menu-divider" />
            <div className="mobile-nav-section mobile-nav-actions">
              {currentUser && (
                <button
                  className="mobile-menu-link mobile-menu-action"
                  onClick={openCreditPlanModal}
                  type="button"
                >
                  {t.subscriptionPlanLabel}
                </button>
              )}
              {!currentUser && (
                <button
                  className="mobile-menu-link mobile-menu-action"
                  onClick={() => {
                    openAuthModal('login');
                    setMobileMenuOpen(false);
                  }}
                  type="button"
                >
                  {t.login}
                </button>
              )}
              {currentUser && (
                <button
                  className="mobile-menu-link mobile-menu-action"
                  onClick={openLogoutConfirmModal}
                  type="button"
                >
                  {t.logout}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {firebaseDisabledMessage && (
        <div className="config-banner" role="alert">
          <div className="section-inner">
            <strong>{firebaseConfigMissingLabel}</strong>
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
              <div className="hero-eyebrow">{landingContent.hero.eyebrow}</div>
              <h1 className="hero-title page-title">{landingContent.hero.title}</h1>
              <p className="hero-sub">{landingContent.hero.subtitle}</p>
              <p className="hero-detail">{landingContent.hero.body}</p>
              <div className="hero-cta-group">
                <button className="generate-btn hero-cta-btn" onClick={handleHeroCta} type="button">
                  {landingContent.hero.primaryButton}
                </button>
                <button className="outline-btn hero-secondary-btn" onClick={() => navigateToPage('how-it-works')} type="button">
                  {landingContent.hero.secondaryButton}
                </button>
              </div>
            </>
          ) : currentPage === 'payment-success' ? (
            <>
              <div className="hero-eyebrow">{t.chargeCredits}</div>
              <h1 className="hero-title page-title">{t.paymentSuccessTitle}</h1>
              <p className="hero-sub">{paymentStatusMessage || t.paymentVerifying}</p>
            </>
          ) : currentPage === 'payment-failed' ? (
            <>
              <div className="hero-eyebrow">{t.chargeCredits}</div>
              <h1 className="hero-title page-title">{t.paymentFailedTitle}</h1>
              <p className="hero-sub">{t.paymentFailedDescription}</p>
            </>
          ) : (
            <>
              <div className="hero-eyebrow">{contentLocale.hero.pageEyebrow}</div>
              <h1 className="hero-title page-title">{currentPageCopy?.title ?? 'HAMDEVA'}</h1>
              <p className="hero-sub">{currentPageCopy?.description ?? ''}</p>
            </>
          )}
        </div>
      </section>

      {sharedResultRouteId ? (
        <SharedResultSection
          loading={sharedResultLoading}
          error={sharedResultError}
          record={sharedResultRecord}
          link={sharedPageLink}
          copy={t}
          shareStatus={shareStatus}
          onTryAnotherOutfit={handleTryAnotherOutfit}
          onDownloadResult={(src) => { void handleDownloadResult(src); }}
          onShareLink={(link) => { void handleShareLink(link); }}
          onCopyLink={(link) => { void handleCopyLink(link); }}
          onShareOnKakao={(link) => { void handleShareOnKakao(link); }}
          onShareOnLine={handleShareOnLine}
          onShareOnX={handleShareOnX}
          onShareOnFacebook={handleShareOnFacebook}
          onInstagramSave={(src) => { void handleInstagramSave(src); }}
          onRandomOutfit={handleRandomOutfit}
        />
      ) : currentPage === 'home' ? (
        <>
          <main className="landing-home-shell">
            <section className="section landing-preview-section">
              <div className="section-inner">
                <div className="section-copy landing-copy landing-preview-copy">
                  <span className="howto-visual-eyebrow">{homeQuickCopy.previewEyebrow}</span>
                  <h2>{homeQuickCopy.previewTitle}</h2>
                  <p>{homeQuickCopy.previewBody}</p>
                </div>
                <div className="howto-visual-flow landing-preview-flow">
                  <article className="howto-visual-stage">
                    <div className="howto-visual-stage-header">
                      <span className="howto-stage-badge">1</span>
                      <strong>{homeQuickCopy.petLabel}</strong>
                    </div>
                    <div className="howto-stage-image-card">
                      <span className="howto-stage-chip howto-stage-chip-static">{homeQuickCopy.petLabel}</span>
                      <img src={guideFixedPet} alt={homeQuickCopy.petLabel} loading="lazy" />
                    </div>
                  </article>
                  <div className="howto-flow-arrow">→</div>
                  <article className="howto-visual-stage">
                    <div className="howto-visual-stage-header">
                      <span className="howto-stage-badge">2</span>
                      <strong>{homeQuickCopy.outfitLabel}</strong>
                    </div>
                    <div className="howto-stage-image-card">
                      <span className="howto-stage-chip howto-stage-chip-static">{homeQuickCopy.outfitLabel}</span>
                      <img src={guideFixedCloth} alt={homeQuickCopy.outfitLabel} loading="lazy" />
                    </div>
                  </article>
                  <div className="howto-flow-arrow">→</div>
                  <article className="howto-visual-stage">
                    <div className="howto-visual-stage-header">
                      <span className="howto-stage-badge">3</span>
                      <strong>{homeQuickCopy.resultLabel}</strong>
                    </div>
                    <div className="howto-stage-image-card">
                      <span className="howto-stage-chip howto-stage-chip-static">{homeQuickCopy.resultLabel}</span>
                      <img src={guideFixedResult} alt={homeQuickCopy.resultLabel} loading="lazy" />
                    </div>
                  </article>
                </div>
              </div>
            </section>

            <section className="section landing-feature-section">
              <div className="section-inner">
                <div className="section-copy">
                  <h2>{landingContent.features.title}</h2>
                </div>
                <div className="landing-card-grid">
                  {landingContent.features.items.map((item) => (
                    <article key={item.title} className="compact-info-card landing-feature-card">
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="section landing-step-section">
              <div className="section-inner">
                <div className="section-copy">
                  <h2>{landingContent.steps.title}</h2>
                </div>
                <div className="landing-step-grid">
                  {landingContent.steps.items.map((item) => (
                    <article key={item.step} className="page-article landing-step-card">
                      <span className="landing-step-badge">{item.step}</span>
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="section landing-example-section">
              <div className="section-inner">
                <div className="section-copy">
                  <h2>{landingContent.examples.title}</h2>
                </div>
                <div className="landing-card-grid">
                  {landingContent.examples.items.map((item) => (
                    <article key={item.title} className="compact-info-card landing-example-card">
                      <h3>{item.title}</h3>
                      <p>{item.description}</p>
                    </article>
                  ))}
                </div>
              </div>
            </section>

            <section className="section landing-sample-section landing-bottom-cta-section">
              <div className="section-inner">
                <article className="page-article landing-sample-cta">
                  <div className="section-copy">
                    <h2>{landingContent.sampleInfo.title}</h2>
                    <p>{landingContent.sampleInfo.body}</p>
                  </div>
                  <div className="landing-inline-actions">
                    <button className="generate-btn" onClick={handleHeroCta} type="button">
                      {landingContent.hero.primaryButton}
                    </button>
                    <button className="outline-btn" onClick={() => navigateToPage('traditional-clothing')} type="button">
                      {landingContent.sampleInfo.button}
                    </button>
                  </div>
                </article>
              </div>
            </section>
          </main>
        </>
      ) : (
        <main className="section page-shell">
          <div className="section-inner page-layout">
            {currentPage === 'admin' && (
              <AdminDashboard
                currentUser={currentUser}
                userProfile={userProfile}
                isAdminUser={isAdminUser}
                adminSummary={adminSummary}
                adminLoading={adminLoading}
                adminError={adminError}
                onRefreshSummary={refreshAdminSummary}
                appVersion={appVersion}
                isFirebaseConfigured={isFirebaseConfigured}
                boardNotices={boardNotices}
                bbsPosts={bbsPosts}
                bbsSubmitting={bbsSubmitting}
                copy={{
                  ...t,
                  ...boardUiCopy,
                  loginComingSoon: loginComingSoonLabel,
                  generationCost: GENERATION_COST,
                  formatEstimatedCostLabel,
                }}
                onOpenAuth={() => openAuthModal('login')}
                onGoHome={() => navigateToPage('home')}
                onDeletePost={(post) => { void handleBbsDelete(post); }}
                formatTimestampLabel={formatTimestampLabel}
              />
            )}
            {currentPage === 'about' && (
              <article className="page-article about-visual-article">
                <div className="howto-visual-header">
                  <span className="howto-visual-eyebrow">{aboutVisualCopy.eyebrow}</span>
                  <h2>{aboutVisualCopy.title}</h2>
                  <p>{aboutVisualCopy.body}</p>
                </div>
                <div className="about-visual-grid">
                  <div className="howto-visual-flow about-visual-flow">
                    <article className="howto-visual-stage">
                      <div className="howto-visual-stage-header">
                        <span className="howto-stage-badge">1</span>
                        <strong>{aboutVisualCopy.petLabel}</strong>
                      </div>
                      <div className="howto-stage-image-card">
                        <span className="howto-stage-chip howto-stage-chip-static">{aboutVisualCopy.petLabel}</span>
                        <img src={guideFixedPet} alt={aboutVisualCopy.petLabel} loading="lazy" />
                      </div>
                    </article>
                    <div className="howto-flow-arrow">→</div>
                    <article className="howto-visual-stage">
                      <div className="howto-visual-stage-header">
                        <span className="howto-stage-badge">2</span>
                        <strong>{aboutVisualCopy.outfitLabel}</strong>
                      </div>
                      <div className="howto-stage-image-card">
                        <span className="howto-stage-chip howto-stage-chip-static">{aboutVisualCopy.outfitLabel}</span>
                        <img src={guideFixedCloth} alt={aboutVisualCopy.outfitLabel} loading="lazy" />
                      </div>
                    </article>
                    <div className="howto-flow-arrow">→</div>
                    <article className="howto-visual-stage">
                      <div className="howto-visual-stage-header">
                        <span className="howto-stage-badge">3</span>
                        <strong>{aboutVisualCopy.resultLabel}</strong>
                      </div>
                      <div className="howto-stage-image-card">
                        <span className="howto-stage-chip howto-stage-chip-static">{aboutVisualCopy.resultLabel}</span>
                        <img src={guideFixedResult} alt={aboutVisualCopy.resultLabel} loading="lazy" />
                      </div>
                    </article>
                  </div>
                  <div className="about-story-card-grid">
                    {aboutVisualCopy.cards.map((card) => (
                      <article key={card.title} className="compact-info-card about-story-card">
                        <h3>{card.title}</h3>
                        <p>{card.body}</p>
                      </article>
                    ))}
                  </div>
                </div>
              </article>
            )}

            {currentPage === 'fashion-technology' && (
              <article className="page-article about-visual-article">
                <div className="howto-visual-header">
                  <span className="howto-visual-eyebrow">{styleGuideVisualCopy.eyebrow}</span>
                  <h2>{styleGuideVisualCopy.title}</h2>
                  <p>{styleGuideVisualCopy.body}</p>
                </div>
                <div className="about-visual-grid">
                  <div className="howto-visual-flow about-visual-flow">
                    <article className="howto-visual-stage">
                      <div className="howto-visual-stage-header">
                        <span className="howto-stage-badge">1</span>
                        <strong>{styleGuideVisualCopy.petLabel}</strong>
                      </div>
                      <div className="howto-stage-image-card">
                        <span className="howto-stage-chip howto-stage-chip-static">{styleGuideVisualCopy.petLabel}</span>
                        <img src={guideFixedPet} alt={styleGuideVisualCopy.petLabel} loading="lazy" />
                      </div>
                    </article>
                    <div className="howto-flow-arrow">→</div>
                    <article className="howto-visual-stage">
                      <div className="howto-visual-stage-header">
                        <span className="howto-stage-badge">2</span>
                        <strong>{styleGuideVisualCopy.outfitLabel}</strong>
                      </div>
                      <div className="howto-stage-image-card">
                        <span className="howto-stage-chip howto-stage-chip-static">{styleGuideVisualCopy.outfitLabel}</span>
                        <img src={guideFixedCloth} alt={styleGuideVisualCopy.outfitLabel} loading="lazy" />
                      </div>
                    </article>
                    <div className="howto-flow-arrow">→</div>
                    <article className="howto-visual-stage">
                      <div className="howto-visual-stage-header">
                        <span className="howto-stage-badge">3</span>
                        <strong>{styleGuideVisualCopy.resultLabel}</strong>
                      </div>
                      <div className="howto-stage-image-card">
                        <span className="howto-stage-chip howto-stage-chip-static">{styleGuideVisualCopy.resultLabel}</span>
                        <img src={guideFixedResult} alt={styleGuideVisualCopy.resultLabel} loading="lazy" />
                      </div>
                    </article>
                  </div>
                  <div className="about-story-card-grid">
                    {styleGuideVisualCopy.cards.map((card) => (
                      <article key={card.title} className="compact-info-card about-story-card">
                        <h3>{card.title}</h3>
                        <p>{card.body}</p>
                      </article>
                    ))}
                  </div>
                </div>
              </article>
            )}

            {currentPage !== 'admin' && currentPage !== 'payment-success' && currentPage !== 'payment-failed' && currentPage !== 'traditional-clothing' && currentPage !== 'how-it-works' && currentPageCopy?.sections?.map((section) => (
              <article key={section.heading} className="page-article">
                <h2>{section.heading}</h2>
                {section.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </article>
            ))}

            {currentPage === 'traditional-clothing' && (
              <>
                <article className="page-article">
                  <h2>{landingContent.sampleOutfits.introTitle}</h2>
                  {landingContent.sampleOutfits.introParagraphs.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </article>
                <article className="page-article">
                  <h2>{landingContent.sampleOutfits.catalogTitle}</h2>
                  <p>{landingContent.sampleOutfits.catalogBody}</p>
                </article>
                <div className="sample-outfit-thumbnail-grid">
                  {traditionalOutfitGuides.map((guide) => (
                    <button
                      key={guide.id}
                      className="sample-outfit-thumbnail"
                      onClick={() => openOutfitGuide(guide.id)}
                      type="button"
                    >
                      <div className="sample-outfit-thumbnail-image">
                        <img src={guide.image} alt={guide.outfitName} loading="lazy" />
                      </div>
                      <div className="sample-outfit-thumbnail-copy">
                        <span className="sample-outfit-country-pill">{guide.countryLabel}</span>
                        <strong>{guide.outfitName}</strong>
                        <p>{guide.summary}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}

            {currentPage === 'sample-friends' && (
              <>
                <article className="page-article">
                  <h2>{landingContent.sampleOutfits.breedTitle}</h2>
                  <p>{landingContent.sampleOutfits.breedBody}</p>
                </article>
                <div className="sample-friend-thumbnail-grid">
                  {petBreedGuideGroups.flatMap((group) =>
                    group.guides.map((guide) => (
                      <button
                        key={guide.id}
                        className="sample-breed-card sample-friend-card"
                        onClick={() => openBreedGuide(guide.id)}
                        type="button"
                      >
                        <div className="sample-breed-card-image">
                          <img src={guide.url} alt={guide.breedLabel} loading="lazy" />
                        </div>
                        <div className="sample-breed-card-copy">
                          <span className="sample-outfit-country-pill">{group.label}</span>
                          <strong>{guide.breedLabel}</strong>
                        </div>
                      </button>
                    )),
                  )}
                </div>
              </>
            )}

            {currentPage === 'pricing' && (
              <>
                <article className="page-article">
                  <h2>{pricingUiCopy.subscriptionTitle}</h2>
                  <p>{pricingUiCopy.subscriptionSubtitle}</p>
                  <p className="pricing-bonus-note">{pricingUiCopy.firstPurchaseBonus}</p>
                </article>
                <div className="credit-plan-grid">
                  {subscriptionProducts.map((product) => {
                    return (
                      <article key={`pricing-${product.id}`} className={`credit-plan-card pricing-tier-card ${product.badge ? 'is-featured' : ''}`}>
                        <div className="credit-plan-copy">
                          {product.badge ? (
                            <div className="credit-plan-badges">
                              <span className="credit-plan-badge accent">{product.badge}</span>
                            </div>
                          ) : null}
                          <strong>{product.label}</strong>
                          <p className="pricing-card-credits">{product.paidCredit.toLocaleString()} {t.credits}</p>
                          <div className="credit-plan-price-row">
                            {typeof product.comparePriceUsd === 'number' ? (
                              <span className="credit-plan-compare-price">${product.comparePriceUsd.toFixed(2)}/month</span>
                            ) : null}
                            <p className="credit-plan-sale-price">{formatCreditProductPrice(product)}</p>
                          </div>
                          <p>{pricingUiCopy.descriptionById[product.id]}</p>
                        </div>
                        <button
                          className="generate-btn auth-inline-btn"
                          onClick={() => { void handleStartCheckout(product.id); }}
                          disabled={isStartingCheckout === product.id}
                          type="button"
                        >
                          {isStartingCheckout === product.id ? t.paymentRedirecting : pricingUiCopy.subscribeCta}
                        </button>
                      </article>
                    );
                  })}
                </div>
                <article className="page-article">
                  <h2>{pricingUiCopy.extraCreditsTitle}</h2>
                  <p>{pricingUiCopy.extraCreditsSubtitle}</p>
                  <p className="pricing-inline-note">{pricingUiCopy.extraCreditsIntro}</p>
                </article>
                <div className="credit-plan-grid">
                  {extraCreditProducts.map((product) => (
                    <article key={`pricing-${product.id}`} className="credit-plan-card pricing-tier-card pricing-extra-card">
                      <div className="credit-plan-copy">
                        <strong>{product.label}</strong>
                        <p className="pricing-card-credits">{product.paidCredit.toLocaleString()} {t.credits}</p>
                        <p className="credit-plan-sale-price">{formatCreditProductPrice(product)}</p>
                        <p>{pricingUiCopy.descriptionById[product.id]}</p>
                      </div>
                      <button
                        className="outline-btn auth-inline-btn pricing-extra-cta"
                        onClick={() => { void handleStartCheckout(product.id); }}
                        disabled={isStartingCheckout === product.id}
                        type="button"
                      >
                        {isStartingCheckout === product.id ? t.paymentRedirecting : pricingUiCopy.buyCreditsCta}
                      </button>
                    </article>
                  ))}
                </div>
              </>
            )}

            {currentPage === 'board' && (
              <BoardPage
                pageTitle={contentLocale.pages.board.title}
                pageDescription={contentLocale.pages.board.description}
                notices={boardNotices}
                posts={bbsPosts}
                form={bbsForm}
                noticeForm={noticeForm}
                status={bbsStatus}
                noticeStatus={noticeStatus}
                submitting={bbsSubmitting}
                noticeSubmitting={noticeSubmitting}
                editingPostId={editingBbsPostId}
                isAdminUser={isAdminUser}
                copy={{ ...t, ...boardUiCopy }}
                onFormChange={setBbsForm}
                onNoticeFormChange={setNoticeForm}
                onSubmit={handleBbsSubmit}
                onNoticeSubmit={handleBoardNoticeSubmit}
                onResetEdit={resetBbsEditor}
                onEditStart={handleBbsEditStart}
                onDelete={(post) => { void handleBbsDelete(post); }}
                onDeleteNotice={(notice) => { void handleBoardNoticeDelete(notice); }}
                formatTimestampLabel={formatTimestampLabel}
              />
            )}

            {currentPage === 'site-management' && !currentUser && (
              <article className="page-article">
                <h2>{t.siteManagementTitle}</h2>
                <p>{t.authRequired}</p>
                <button className="generate-btn auth-inline-btn" onClick={() => openAuthModal('login')} type="button">
                  {t.login}
                </button>
              </article>
            )}
            {currentPage === 'site-management' && currentUser && !isAdminUser && (
              <article className="page-article">
                <h2>{t.siteManagementTitle}</h2>
                <p>{t.adminAccessDenied}</p>
                <button className="outline-btn auth-inline-btn" onClick={() => navigateToPage('home')} type="button">
                  {t.heroCta}
                </button>
              </article>
            )}
            {currentPage === 'site-management' && isAdminUser && (
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
                  <p>{t.totalCreditLabel}: {currentCredits}</p>
                  <p>{t.dailyCreditLabel}: {currentDailyCredit}</p>
                  <p>{t.paidCreditLabel}: {currentPaidCredit}</p>
                </article>
                <article className="page-article">
                  <h3>{t.siteCreditCostLabel}</h3>
                  <p>{GENERATION_COST}</p>
                </article>
              </div>
            )}

            {currentPage === 'payment-success' && (
              <PaymentStatusPage
                title={t.paymentSuccessTitle}
                description={paymentStatusMessage || t.paymentVerifying}
                sessionId={paymentSessionId}
                dailyCredit={currentDailyCredit}
                paidCredit={currentPaidCredit}
                copy={t}
                status={
                  paymentStatusMessage === t.paymentSuccessReady
                    ? 'success'
                    : paymentStatusMessage === t.paymentFailedMessage || paymentStatusMessage === t.paymentVerifyFailed
                      ? 'failed'
                      : 'pending'
                }
                onPrimary={() => navigateToPage('mypage')}
                onSecondary={() => navigateToPage('home')}
              />
            )}

            {currentPage === 'payment-failed' && (
              <PaymentStatusPage
                title={t.paymentFailedTitle}
                description={t.paymentFailedDescription}
                sessionId={null}
                dailyCredit={currentDailyCredit}
                paidCredit={currentPaidCredit}
                copy={t}
                status="failed"
                onPrimary={() => navigateToPage('mypage')}
                onSecondary={() => navigateToPage('home')}
              />
            )}

            {currentPage === 'contact' && (
              <>
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
              </>
            )}
            {currentPage === 'mypage' && (
              <MyPageSection
                currentUser={currentUser}
                userProfile={userProfile}
                currentDailyCredit={currentDailyCredit}
                currentPaidCredit={currentPaidCredit}
                currentCredits={currentCredits}
                locale={lang}
                historyItems={historyItems}
                preservedHistoryCount={preservedHistoryCount}
                historyPreserveLimit={PRESERVED_HISTORY_LIMIT}
                isFirebaseConfigured={isFirebaseConfigured}
                firebaseDisabledMessage={firebaseDisabledMessage}
                isStartingCheckout={isStartingCheckout}
                products={CREDIT_PRODUCTS}
                copy={{ ...t, loginComingSoon: loginComingSoonLabel, pricingUi: pricingUiCopy }}
                onLogin={() => openAuthModal('login')}
                onNavigateSiteManagement={openAdminModal}
                onNavigateTerms={() => navigateToPage('terms')}
                onStartCheckout={(productId) => { void handleStartCheckout(productId); }}
                formatTimestampLabel={formatTimestampLabel}
                onOpenHistoryItem={(item) => { void handleOpenHistoryItem(item); }}
                onToggleHistoryPreserve={(item) => { void handleToggleHistoryPreserve(item); }}
                onDownloadHistoryItem={(item) => { void handleDownloadHistoryItem(item); }}
                onDeleteHistoryItem={(item) => { void handleDeleteHistoryItem(item); }}
              />
            )}
            {currentPage === 'how-it-works' && (
              <HowItWorksVisualGuide
                copy={howItWorksVisualCopy}
                sampleDogSrc={guideFixedPet}
                sampleCatSrc={guideSampleCat}
                sampleClothSrc={guideSampleCloth}
                resultImageSrc={guideFixedResult}
              />
            )}
            {relatedEditorialCards.length > 0 && currentPage !== 'traditional-clothing' && (
              <section className="section editorial-section editorial-related-section">
                <div className="section-copy">
                  <h2>{editorialUiCopy.relatedTitle}</h2>
                  <p>{editorialUiCopy.relatedDescription}</p>
                </div>
                <div className="compact-card-grid">
                  {relatedEditorialCards.map((card) => (
                    <article key={`related-${card.page}`} className="compact-info-card">
                      <h2>{card.title}</h2>
                      <p>{card.description}</p>
                      <button className="text-link-btn" onClick={() => navigateToPage(card.page)} type="button">
                        {editorialUiCopy.readMore}
                      </button>
                    </article>
                  ))}
                </div>
              </section>
            )}
            {currentFaqItems.length > 0 && currentPage !== 'home' && (
              <FAQSection title={getFaqTitle(currentPage, currentPageCopy?.title)} items={currentFaqItems} />
            )}
          </div>
        </main>
      )}

      <footer className="site-footer">
        <p className="footer-copy">{t.footer}</p>
        <div className="footer-links footer-links-editorial">
          {FOOTER_EDITORIAL_PAGES.map((page) => (
            <button key={page} className="footer-link-btn" onClick={() => navigateToPage(page)} type="button">
              {contentLocale.nav[page]}
            </button>
          ))}
        </div>
        <div className="footer-links footer-links-utility">
          {FOOTER_UTILITY_PAGES.map((page) => (
            <button key={`utility-${page}`} className="footer-link-btn" onClick={() => navigateToPage(page)} type="button">
              {contentLocale.nav[page]}
            </button>
          ))}
        </div>
      </footer>

      {showCreditPlanModal && (
        <ShellModal
          title={t.chargeCredits}
          subtitle={t.chargeDescription}
          className="credit-plan-modal"
          onClose={() => setShowCreditPlanModal(false)}
        >
          <div className="pricing-section-stack">
            <section className="pricing-section-shell">
              <div className="pricing-section-header">
                <h3>{pricingUiCopy.subscriptionTitle}</h3>
                <p>{pricingUiCopy.firstPurchaseBonus}</p>
              </div>
              <div className="credit-plan-grid">
                {subscriptionProducts.map((product) => (
                  <article key={product.id} className={`credit-plan-card pricing-tier-card ${product.badge ? 'is-featured' : ''}`}>
                    <div className="credit-plan-copy">
                      {product.badge ? (
                        <div className="credit-plan-badges">
                          <span className="credit-plan-badge accent">{product.badge}</span>
                        </div>
                      ) : null}
                      <strong>{product.label}</strong>
                      <p className="pricing-card-credits">{product.paidCredit.toLocaleString()} {t.credits}</p>
                      <div className="credit-plan-price-row">
                        {typeof product.comparePriceUsd === 'number' ? (
                          <span className="credit-plan-compare-price">${product.comparePriceUsd.toFixed(2)}/month</span>
                        ) : null}
                        <p className="credit-plan-sale-price">{formatCreditProductPrice(product)}</p>
                      </div>
                      <p>{pricingUiCopy.descriptionById[product.id]}</p>
                    </div>
                    <button
                      className="generate-btn auth-inline-btn"
                      disabled={isStartingCheckout === product.id}
                      onClick={() => { void handleStartCheckout(product.id); }}
                      type="button"
                    >
                      {isStartingCheckout === product.id ? t.paymentRedirecting : pricingUiCopy.subscribeCta}
                    </button>
                  </article>
                ))}
              </div>
            </section>
            <section className="pricing-section-shell">
              <div className="pricing-section-header">
                <h3>{pricingUiCopy.extraCreditsTitle}</h3>
                <p>{pricingUiCopy.extraCreditsSubtitle}</p>
              </div>
              <div className="credit-plan-grid">
                {extraCreditProducts.map((product) => (
                  <article key={product.id} className="credit-plan-card pricing-tier-card pricing-extra-card">
                    <div className="credit-plan-copy">
                      <strong>{product.label}</strong>
                      <p className="pricing-card-credits">{product.paidCredit.toLocaleString()} {t.credits}</p>
                      <p className="credit-plan-sale-price">{formatCreditProductPrice(product)}</p>
                      <p>{pricingUiCopy.descriptionById[product.id]}</p>
                    </div>
                    <button
                      className="outline-btn auth-inline-btn pricing-extra-cta"
                      disabled={isStartingCheckout === product.id}
                      onClick={() => { void handleStartCheckout(product.id); }}
                      type="button"
                    >
                      {isStartingCheckout === product.id ? t.paymentRedirecting : pricingUiCopy.buyCreditsCta}
                    </button>
                  </article>
                ))}
              </div>
            </section>
          </div>
        </ShellModal>
      )}

      {showLogoutConfirmModal && (
        <ShellModal
          title={logoutModalCopy.title}
          className="confirm-modal-shell"
          onClose={() => setShowLogoutConfirmModal(false)}
        >
          <div className="confirm-modal-copy">
            <p>{logoutModalCopy.body}</p>
          </div>
          <div className="confirm-modal-actions">
            <button className="outline-btn auth-inline-btn" onClick={() => setShowLogoutConfirmModal(false)} type="button">
              {logoutModalCopy.cancel}
            </button>
            <button className="generate-btn auth-inline-btn" onClick={() => { void handleConfirmedLogout(); }} type="button">
              {logoutModalCopy.confirm}
            </button>
          </div>
        </ShellModal>
      )}

      {showResultPreviewModal && (
        <ShellModal
          title={t.resultTitle}
          className="result-preview-shell"
          onClose={closeResultPreviewModal}
        >
          {!resultPreviewModalLoading && resultPreviewModalSrc && (
            <div className="result-preview-toolbar">
              <button
                className="outline-btn result-preview-zoom-btn"
                disabled={resultPreviewZoom <= 0.6}
                onClick={() => setResultPreviewZoom((prev) => Math.max(0.6, Number((prev - 0.2).toFixed(2))))}
                type="button"
              >
                {t.resultPreviewZoomOut}
              </button>
              <span className="result-preview-zoom-label">{Math.round(resultPreviewZoom * 100)}%</span>
              <button
                className="outline-btn result-preview-zoom-btn"
                disabled={resultPreviewZoom >= 3}
                onClick={() => setResultPreviewZoom((prev) => Math.min(3, Number((prev + 0.2).toFixed(2))))}
                type="button"
              >
                {t.resultPreviewZoomIn}
              </button>
            </div>
          )}
          <div className="result-preview-modal-body">
            {resultPreviewModalLoading ? (
              <p>{t.resultPreviewLoading}</p>
            ) : resultPreviewModalSrc ? (
              <div className="result-preview-scroll">
                <div className="result-preview-image-stage">
                  <img
                    className="result-preview-modal-image"
                    src={resultPreviewModalSrc}
                    alt={t.resultPreviewAlt}
                    style={{ width: `${resultPreviewZoom * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              <p>{t.resultPreviewLoadFailed}</p>
            )}
          </div>
        </ShellModal>
      )}

      {showContentModal && (
        <ContentModal
          activeTab={activeContentTab}
          countryCards={countryShowcaseCards}
          locale={contentLocale}
          onClose={() => setShowContentModal(false)}
          onTabChange={setActiveContentTab}
        />
      )}

      {showTryOnModal && (
        <ShellModal
          title={landingContent.modal.title}
          subtitle={landingContent.modal.description}
          className="tryon-modal-shell"
          onClose={() => setShowTryOnModal(false)}
        >
          <TryOnStudio
            {...tryOnStudioProps}
            layout="modal"
            modalCopy={landingContent.modal}
          />
        </ShellModal>
      )}

      {selectedOutfitGuide && (
        <ShellModal
          title={selectedOutfitGuide.outfitName}
          subtitle={selectedOutfitGuide.summary}
          className="sample-outfit-detail-shell"
          onClose={closeOutfitGuide}
        >
          <div className="sample-outfit-detail-layout">
            <div className="sample-outfit-detail-hero">
              <div className="sample-outfit-detail-image">
                <img src={selectedOutfitGuide.image} alt={selectedOutfitGuide.outfitName} loading="lazy" />
              </div>
              <div className="sample-outfit-detail-copy">
                <span className="sample-outfit-country-pill">{selectedOutfitGuide.countryLabel}</span>
                <h2>{selectedOutfitGuide.outfitName}</h2>
                <p>{selectedOutfitGuide.summary}</p>
                <button
                  className="generate-btn"
                  onClick={() => { void handleStartGuideTryOn(selectedOutfitGuide.image); }}
                  type="button"
                >
                  {landingContent.sampleOutfits.startButton}
                </button>
              </div>
            </div>
            <div className="sample-outfit-detail-sections">
              <section>
                <h3>{landingContent.sampleOutfits.guideSections.overview}</h3>
                {selectedOutfitGuide.overview.map((paragraph) => (
                  <p key={`overview-${paragraph}`}>{paragraph}</p>
                ))}
              </section>
              <section>
                <h3>{landingContent.sampleOutfits.guideSections.history}</h3>
                {selectedOutfitGuide.history.map((paragraph) => (
                  <p key={`history-${paragraph}`}>{paragraph}</p>
                ))}
              </section>
              <section>
                <h3>{landingContent.sampleOutfits.guideSections.culture}</h3>
                {selectedOutfitGuide.culture.map((paragraph) => (
                  <p key={`culture-${paragraph}`}>{paragraph}</p>
                ))}
              </section>
              <section>
                <h3>{landingContent.sampleOutfits.guideSections.design}</h3>
                {selectedOutfitGuide.design.map((paragraph) => (
                  <p key={`design-${paragraph}`}>{paragraph}</p>
                ))}
              </section>
              <section>
                <h3>{landingContent.sampleOutfits.guideSections.modernUse}</h3>
                {selectedOutfitGuide.modernUse.map((paragraph) => (
                  <p key={`modern-${paragraph}`}>{paragraph}</p>
                ))}
              </section>
              <section>
                <h3>{landingContent.sampleOutfits.guideSections.fittingTips}</h3>
                {selectedOutfitGuide.fittingTips.map((paragraph) => (
                  <p key={`tips-${paragraph}`}>{paragraph}</p>
                ))}
              </section>
            </div>
          </div>
        </ShellModal>
      )}

      {selectedBreedGuide && (
        <ShellModal
          title={selectedBreedGuide.breedLabel}
          subtitle={selectedBreedGuide.summary}
          className="sample-breed-detail-shell"
          onClose={closeBreedGuide}
        >
          <div className="sample-breed-detail-layout">
            <div className="sample-breed-detail-hero">
              <div className="sample-breed-detail-image">
                <img src={selectedBreedGuide.url} alt={selectedBreedGuide.breedLabel} loading="lazy" />
              </div>
              <div className="sample-breed-detail-copy">
                <span className="sample-outfit-country-pill">{selectedBreedGuide.categoryLabel}</span>
                <h2>{selectedBreedGuide.breedLabel}</h2>
                <p>{selectedBreedGuide.summary}</p>
                <button
                  className="generate-btn"
                  onClick={() => { void handleStartBreedTryOn(selectedBreedGuide.url, selectedBreedGuide.category); }}
                  type="button"
                >
                  {landingContent.sampleOutfits.breedStartButton}
                </button>
              </div>
            </div>
            <div className="sample-breed-detail-sections">
              <section>
                <h3>{landingContent.sampleOutfits.breedSections.overview}</h3>
                {selectedBreedGuide.overview.map((paragraph) => (
                  <p key={`breed-overview-${paragraph}`}>{paragraph}</p>
                ))}
              </section>
              <section>
                <h3>{landingContent.sampleOutfits.breedSections.appearance}</h3>
                {selectedBreedGuide.appearance.map((paragraph) => (
                  <p key={`breed-appearance-${paragraph}`}>{paragraph}</p>
                ))}
              </section>
              <section>
                <h3>{landingContent.sampleOutfits.breedSections.styling}</h3>
                {selectedBreedGuide.styling.map((paragraph) => (
                  <p key={`breed-styling-${paragraph}`}>{paragraph}</p>
                ))}
              </section>
              <section>
                <h3>{landingContent.sampleOutfits.breedSections.photoTips}</h3>
                {selectedBreedGuide.photoTips.map((paragraph) => (
                  <p key={`breed-photo-${paragraph}`}>{paragraph}</p>
                ))}
              </section>
              <section>
                <h3>{landingContent.sampleOutfits.breedSections.fittingTips}</h3>
                {selectedBreedGuide.fittingTips.map((paragraph) => (
                  <p key={`breed-tips-${paragraph}`}>{paragraph}</p>
                ))}
              </section>
            </div>
          </div>
        </ShellModal>
      )}

      {showSampleModal && (
        <SampleModal 
          currentUrl={selectedSampleUrl ?? activePersonImage}
          lang={lang}
          onSelect={(url, category) => {
            void loadPersonSample(url, category);
          }}
          onClose={() => setShowSampleModal(false)}
        />
      )}

      {showClothSampleModal && (
        <ClothSampleModal
          currentUrl={selectedClothSampleUrl ?? activeClothImage}
          lang={lang}
          onSelect={(url) => {
            void loadClothSample(url);
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
