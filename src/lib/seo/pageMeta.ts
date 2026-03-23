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

export const INDEXABLE_PAGES = new Set<SitePage>([
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
  'contact',
]);

export const LEGACY_PAGE_PATHS: Partial<Record<string, SitePage>> = {
  '/how-it-works': 'how-it-works',
  '/traditional-clothing': 'traditional-clothing',
  '/countries': 'traditional-clothing',
  '/tryon': 'home',
};

const PAGE_META_FALLBACKS: Partial<Record<SitePage, { title: string; description: string }>> = {
  about: {
    title: 'About HAMDEVA (함데바)',
    description: 'Learn how HAMDEVA (함데바) helps pet owners with dog outfit preview, cat outfit preview, AI pet fitting, and virtual pet fitting.',
  },
  'how-it-works': {
    title: 'How to Use HAMDEVA',
    description: 'See how to upload pet photos, choose outfit images, and get better dog outfit preview, cat clothes try on, and AI pet fitting results with HAMDEVA.',
  },
  'traditional-clothing': {
    title: 'Pet Outfit Samples',
    description: 'Browse sample pet outfit styles, traditional clothing references, and visual ideas before you create a HAMDEVA fitting preview.',
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
    description: 'View HAMDEVA pricing, credits, and subscription details for dog outfit preview, cat outfit preview, and AI pet fitting generation.',
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
