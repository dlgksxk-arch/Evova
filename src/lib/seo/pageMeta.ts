import type { LanguageCode } from '../../constants/languages';
import type { ContentLocale, SitePage } from '../../locales';

export const SEO_BASE_URL = 'https://hamdeva.com';
export const SEO_SITE_NAME = 'HAMDEVA';
export const SEO_DEFAULT_OG_IMAGE_URL = `${SEO_BASE_URL}/sample/og-image.png`;
export const SEO_DEFAULT_OG_IMAGE_ALT = 'HAMDEVA pet fitting preview';
export const SEO_INDEX_ROBOTS = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
export const SEO_NOINDEX_ROBOTS = 'noindex, nofollow, noarchive, nosnippet';

export const PAGE_PATHS: Record<SitePage, string> = {
  home: '/',
  tryon: '/tryon',
  admin: '/admin',
  'dog-outfit-generator': '/dog-outfit-generator',
  'cat-outfit-generator': '/cat-outfit-generator',
  'pet-halloween-costume': '/pet-halloween-costume',
  'pet-hanbok': '/pet-hanbok',
  'dog-hoodie': '/dog-hoodie',
  'cat-formal-outfit': '/cat-formal-outfit',
  'dog-hanbok': '/dog-hanbok',
  'cat-kimono': '/cat-kimono',
  'pet-qipao': '/pet-qipao',
  'pet-saree': '/pet-saree',
  'maltese-hanbok': '/maltese-hanbok',
  'shiba-kimono': '/shiba-kimono',
  'corgi-qipao': '/corgi-qipao',
  'persian-cat-saree': '/persian-cat-saree',
  'tuxedo-cat-hanbok': '/tuxedo-cat-hanbok',
  'poodle-wedding-dress': '/poodle-wedding-dress',
  'ragdoll-kimono': '/ragdoll-kimono',
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
  'account-deletion': '/account-deletion',
  'refund-policy': '/refund-policy',
  terms: '/terms',
  contact: '/contact',
  board: '/board',
  'site-management': '/site-management',
  mypage: '/mypage',
  history: '/history',
  'payment-success': '/payment-success',
  'payment-failed': '/payment-failed',
};

export const INDEXABLE_PAGES = new Set<SitePage>([
  'home',
  'tryon',
  'dog-outfit-generator',
  'cat-outfit-generator',
  'pet-halloween-costume',
  'pet-hanbok',
  'dog-hoodie',
  'cat-formal-outfit',
  'about',
  'how-it-works',
  'traditional-clothing',
  'pricing',
  'privacy',
  'refund-policy',
  'terms',
  'contact',
]);

export const LEGACY_PAGE_PATHS: Partial<Record<string, SitePage>> = {
  '/how-it-works': 'how-it-works',
  '/traditional-clothing': 'traditional-clothing',
  '/countries': 'traditional-clothing',
};

const PAGE_META_FALLBACKS: Partial<Record<SitePage, { title: string; description: string }>> = {
  tryon: {
    title: 'AI Pet Outfit Generator',
    description: 'Upload your dog or cat photo, add an outfit image, and generate a pet outfit preview with HAMDEVA.',
  },
  'dog-outfit-generator': {
    title: 'Dog Outfit Generator',
    description: 'Generate dog outfit previews with your own pet photo, a clothing image, and quick ideas for better dog clothes try on results.',
  },
  'cat-outfit-generator': {
    title: 'Cat Outfit Generator',
    description: 'Create cat outfit previews with your cat photo and an outfit image to compare cute, formal, and themed looks before you choose one.',
  },
  'pet-halloween-costume': {
    title: 'Pet Halloween Costume Preview',
    description: 'Preview pet Halloween costume ideas on dogs and cats before you buy, plan, or post your final costume look.',
  },
  'pet-hanbok': {
    title: 'Pet Hanbok Preview',
    description: 'Compare pet hanbok outfit ideas and preview Korean-inspired looks for dogs and cats with clearer outfit references.',
  },
  'dog-hoodie': {
    title: 'Dog Hoodie Preview',
    description: 'See how a dog hoodie look reads on your pet before you buy, style, or share a casual dog outfit idea.',
  },
  'cat-formal-outfit': {
    title: 'Cat Formal Outfit Preview',
    description: 'Compare cat formal outfit ideas for studio photos, events, and polished costume looks before generating your final preview.',
  },
  'dog-hanbok': {
    title: 'Dog Hanbok Preview Guide',
    description: 'See how a dog hanbok preview works on HAMDEVA before you generate your own AI pet fitting result with a Korean traditional outfit reference.',
  },
  'cat-kimono': {
    title: 'Cat Kimono Preview Guide',
    description: 'Explore how a cat kimono preview works on HAMDEVA and compare kimono-inspired pet outfit references before generating your result.',
  },
  'pet-qipao': {
    title: 'Pet Qipao Preview Guide',
    description: 'Learn how to compare pet qipao references on HAMDEVA and generate a cleaner AI pet fitting preview with a Chinese traditional outfit style.',
  },
  'pet-saree': {
    title: 'Pet Saree Preview Guide',
    description: 'Use this HAMDEVA guide to compare pet saree references and understand how saree-inspired drape and styling read inside an AI outfit preview.',
  },
  'maltese-hanbok': {
    title: 'Maltese Hanbok Preview Guide',
    description: 'Compare Maltese hanbok outfit ideas on HAMDEVA and see how small white-dog photos pair with Korean traditional outfit references before generation.',
  },
  'shiba-kimono': {
    title: 'Shiba Kimono Preview Guide',
    description: 'Use HAMDEVA to compare Shiba kimono styling and see how fox-like dog features pair with kimono-inspired outfit references before generation.',
  },
  'corgi-qipao': {
    title: 'Corgi Qipao Preview Guide',
    description: 'See how a Corgi qipao preview works on HAMDEVA and compare Chinese-style outfit references on a short-legged dog silhouette before generating.',
  },
  'persian-cat-saree': {
    title: 'Persian Cat Saree Preview Guide',
    description: 'Compare Persian cat saree styling on HAMDEVA and see how fluffy long-hair cat photos work with saree-inspired outfit references before generation.',
  },
  'tuxedo-cat-hanbok': {
    title: 'Tuxedo Cat Hanbok Preview Guide',
    description: 'Preview tuxedo cat hanbok styling on HAMDEVA and compare Korean traditional outfit references on high-contrast black-and-white cat photos.',
  },
  'poodle-wedding-dress': {
    title: 'Poodle Wedding Dress Preview Guide',
    description: 'Compare poodle wedding dress ideas on HAMDEVA and preview elegant bridal-style pet outfit references before choosing a final look.',
  },
  'ragdoll-kimono': {
    title: 'Ragdoll Kimono Preview Guide',
    description: 'Preview ragdoll kimono outfit ideas on HAMDEVA and compare Japanese-style pet outfit references on long-hair blue-eyed cat photos.',
  },
  about: {
    title: 'About HAMDEVA',
    description: 'Learn how HAMDEVA helps pet owners with AI pet fitting, dog clothes try on, pet outfit generator, and pet outfit preview.',
  },
  'how-it-works': {
    title: 'How to Use HAMDEVA',
    description: 'See how to upload pet photos, choose outfit images, and get better AI pet fitting, dog clothes try on, and pet outfit preview results with HAMDEVA.',
  },
  'traditional-clothing': {
    title: 'Pet Outfit Ideas',
    description: 'Browse pet outfit ideas, costume references, and stronger starting points before you open the HAMDEVA try-on tool.',
  },
  'sample-friends': {
    title: 'Pet Sample Friends',
    description: 'Preview HAMDEVA sample dogs and cats to understand how pet fitting inputs and saved examples are structured.',
  },
  'fashion-technology': {
    title: 'AI Pet Fitting Technology',
    description: 'Discover the technology behind HAMDEVA’s AI pet fitting, pet photo processing, and outfit preview generation workflow.',
  },
  pricing: {
    title: 'Pricing',
    description: 'View HAMDEVA pricing, credits, and subscription details for AI pet fitting, dog clothes try on, and pet outfit generator usage.',
  },
  'virtual-try-on-guide': {
    title: 'Pet Virtual Try-On Guide',
    description: 'Learn the basics of pet virtual try-on, how outfit previews work, and how to get cleaner AI fitting results with HAMDEVA.',
  },
  'outfit-photo-tips': {
    title: 'Pet Photo Tips for Better Outfit Previews',
    description: 'Get simple tips for taking better dog and cat photos to improve AI pet outfit preview quality on HAMDEVA.',
  },
  'ai-fitting-faq': {
    title: 'AI Pet Fitting FAQ',
    description: 'Read common questions about pet virtual fitting, supported photos, outfit previews, accuracy, and usage on HAMDEVA.',
  },
  privacy: {
    title: 'Privacy Policy',
    description: 'Read the HAMDEVA privacy policy for AI pet fitting, uploaded pet photos, personal data, and service usage information.',
  },
  'account-deletion': {
    title: 'Account Deletion',
    description: 'Learn how to request HAMDEVA account deletion, what data is deleted, and what limited records may be retained temporarily.',
  },
  'refund-policy': {
    title: 'Refund Policy',
    description: 'Review the HAMDEVA refund policy for pet virtual fitting credits, payments, and related purchase terms.',
  },
  terms: {
    title: 'Terms of Service',
    description: 'Review the HAMDEVA terms of service for AI pet fitting usage, payments, user responsibilities, and service conditions.',
  },
  contact: {
    title: 'Contact HAMDEVA',
    description: 'Contact HAMDEVA for help with AI pet fitting, outfit preview issues, account questions, and service inquiries.',
  },
  history: {
    title: 'History',
    description: 'Review your saved HAMDEVA generation history, archived results, and previous outfit previews.',
  },
};

type PageCopy = {
  title?: string;
  description?: string;
} | null;

type BuildSeoMetaParams = {
  contentLocale: ContentLocale;
  currentPage: SitePage;
  currentPageCopy: PageCopy;
  isPreviewHost: boolean;
  keywords: string;
  lang: LanguageCode;
  pageImageUrl?: string | null;
  paymentStatusMessage?: string | null;
  sharedPageUrl?: string | null;
  sharedResultRouteId?: string | null;
  labels: {
    adminSubtitle: string;
    adminTitle: string;
    paymentFailedDescription: string;
    paymentFailedTitle: string;
    paymentSuccessTitle: string;
    paymentVerifying: string;
    sharedResultDescription: string;
    sharedResultTitle: string;
  };
};

export type SeoMeta = {
  title: string;
  description: string;
  url: string;
  robots: string;
  keywords: string;
  ogImage: string;
  ogImageAlt: string;
  ogLocale: string;
};

const OG_LOCALE_BY_LANG: Partial<Record<LanguageCode, string>> = {
  en: 'en_US',
  ko: 'ko_KR',
  ja: 'ja_JP',
  zh: 'zh_CN',
};

const withBrand = (title: string): string =>
  title.includes(SEO_SITE_NAME) ? title : `${title} | ${SEO_SITE_NAME}`;

export const getCanonicalPageUrl = (page: SitePage): string => `${SEO_BASE_URL}${PAGE_PATHS[page]}`;

export const buildSeoMeta = ({
  contentLocale,
  currentPage,
  currentPageCopy,
  isPreviewHost,
  keywords,
  lang,
  pageImageUrl,
  paymentStatusMessage,
  sharedPageUrl,
  sharedResultRouteId,
  labels,
}: BuildSeoMetaParams): SeoMeta => {
  const pageFallbackMeta = PAGE_META_FALLBACKS[currentPage];
  const pageMeta = sharedResultRouteId
    ? {
        title: `${labels.sharedResultTitle} | ${SEO_SITE_NAME}`,
        description: labels.sharedResultDescription,
      }
    : currentPage === 'admin'
      ? {
          title: `${labels.adminTitle} | ${SEO_SITE_NAME}`,
          description: labels.adminSubtitle,
        }
      : currentPage === 'payment-success'
        ? {
            title: `${labels.paymentSuccessTitle} | ${SEO_SITE_NAME}`,
            description: paymentStatusMessage || labels.paymentVerifying,
          }
        : currentPage === 'payment-failed'
          ? {
              title: `${labels.paymentFailedTitle} | ${SEO_SITE_NAME}`,
              description: labels.paymentFailedDescription,
            }
          : currentPage === 'home'
            ? {
                title: withBrand(contentLocale.meta.homeTitle),
                description: contentLocale.meta.homeDescription,
              }
            : {
                title: withBrand(currentPageCopy?.title ?? pageFallbackMeta?.title ?? SEO_SITE_NAME),
                description: currentPageCopy?.description ?? pageFallbackMeta?.description ?? `${SEO_SITE_NAME} content page`,
              };

  const url = sharedResultRouteId && sharedPageUrl
    ? sharedPageUrl
    : getCanonicalPageUrl(currentPage);
  const isIndexablePage = !sharedResultRouteId && INDEXABLE_PAGES.has(currentPage);

  return {
    title: pageMeta.title,
    description: pageMeta.description,
    url,
    robots: isPreviewHost || !isIndexablePage ? SEO_NOINDEX_ROBOTS : SEO_INDEX_ROBOTS,
    keywords,
    ogImage: pageImageUrl || SEO_DEFAULT_OG_IMAGE_URL,
    ogImageAlt: SEO_DEFAULT_OG_IMAGE_ALT,
    ogLocale: OG_LOCALE_BY_LANG[lang] ?? OG_LOCALE_BY_LANG.en ?? 'en_US',
  };
};

const upsertHeadTag = (
  selector: string,
  tagName: 'meta' | 'link',
  attributes: Record<string, string>,
) => {
  let tag = document.head.querySelector(selector) as HTMLMetaElement | HTMLLinkElement | null;
  if (!tag) {
    tag = document.createElement(tagName) as HTMLMetaElement | HTMLLinkElement;
    document.head.appendChild(tag);
  }

  Object.entries(attributes).forEach(([key, value]) => {
    tag?.setAttribute(key, value);
  });
};

export const syncDocumentHead = (meta: SeoMeta) => {
  document.title = meta.title;

  upsertHeadTag('meta[name="description"]', 'meta', {
    name: 'description',
    content: meta.description,
  });
  upsertHeadTag('meta[name="keywords"]', 'meta', {
    name: 'keywords',
    content: meta.keywords,
  });
  upsertHeadTag('meta[name="robots"]', 'meta', {
    name: 'robots',
    content: meta.robots,
  });
  upsertHeadTag('link[rel="canonical"]', 'link', {
    rel: 'canonical',
    href: meta.url,
  });
  upsertHeadTag('meta[property="og:site_name"]', 'meta', {
    property: 'og:site_name',
    content: SEO_SITE_NAME,
  });
  upsertHeadTag('meta[property="og:title"]', 'meta', {
    property: 'og:title',
    content: meta.title,
  });
  upsertHeadTag('meta[property="og:description"]', 'meta', {
    property: 'og:description',
    content: meta.description,
  });
  upsertHeadTag('meta[property="og:type"]', 'meta', {
    property: 'og:type',
    content: 'website',
  });
  upsertHeadTag('meta[property="og:url"]', 'meta', {
    property: 'og:url',
    content: meta.url,
  });
  upsertHeadTag('meta[property="og:image"]', 'meta', {
    property: 'og:image',
    content: meta.ogImage,
  });
  upsertHeadTag('meta[property="og:image:alt"]', 'meta', {
    property: 'og:image:alt',
    content: meta.ogImageAlt,
  });
  upsertHeadTag('meta[property="og:locale"]', 'meta', {
    property: 'og:locale',
    content: meta.ogLocale,
  });
  upsertHeadTag('meta[name="twitter:card"]', 'meta', {
    name: 'twitter:card',
    content: 'summary_large_image',
  });
  upsertHeadTag('meta[name="twitter:title"]', 'meta', {
    name: 'twitter:title',
    content: meta.title,
  });
  upsertHeadTag('meta[name="twitter:description"]', 'meta', {
    name: 'twitter:description',
    content: meta.description,
  });
  upsertHeadTag('meta[name="twitter:image"]', 'meta', {
    name: 'twitter:image',
    content: meta.ogImage,
  });
  upsertHeadTag('meta[name="twitter:image:alt"]', 'meta', {
    name: 'twitter:image:alt',
    content: meta.ogImageAlt,
  });
};
