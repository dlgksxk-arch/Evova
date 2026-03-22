import type { LanguageCode } from '../../constants/languages';
import type { ContentLocale, SitePage } from '../../locales';

export const SEO_BASE_URL = 'https://hamdeva.com';
export const SEO_SITE_NAME = 'HAMDEVA';
export const SEO_DEFAULT_OG_IMAGE_URL = `${SEO_BASE_URL}/og-image.jpg`;
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

const getCanonicalUrl = (page: SitePage): string => `${SEO_BASE_URL}${PAGE_PATHS[page]}`;

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
                title: currentPageCopy?.title ? withBrand(currentPageCopy.title) : SEO_SITE_NAME,
                description: currentPageCopy?.description || `${SEO_SITE_NAME} content page`,
              };

  const url = sharedResultRouteId && sharedPageUrl
    ? sharedPageUrl
    : getCanonicalUrl(currentPage);
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
