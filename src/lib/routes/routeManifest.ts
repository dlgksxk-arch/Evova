export type RouteType =
  | 'hub'
  | 'tool'
  | 'landing'
  | 'support'
  | 'legal'
  | 'helper'
  | 'legacy'
  | 'internal';

export type RobotsPolicy = 'index' | 'noindex';
export type XRobotsTagPolicy = 'none' | 'noindex';
export type ContentSource =
  | 'home-hub'
  | 'localized-page'
  | 'editorial-page'
  | 'seo-landing'
  | 'legal-page'
  | 'app-shell';

export type RouteKey =
  | 'home'
  | 'tryon'
  | 'admin'
  | 'dog-outfit-generator'
  | 'cat-outfit-generator'
  | 'pet-halloween-costume'
  | 'pet-hanbok'
  | 'dog-hoodie'
  | 'cat-formal-outfit'
  | 'dog-hanbok'
  | 'cat-kimono'
  | 'pet-qipao'
  | 'pet-saree'
  | 'maltese-hanbok'
  | 'shiba-kimono'
  | 'corgi-qipao'
  | 'persian-cat-saree'
  | 'tuxedo-cat-hanbok'
  | 'poodle-wedding-dress'
  | 'ragdoll-kimono'
  | 'sample-outfits'
  | 'sample-friends'
  | 'countries'
  | 'how-it-works'
  | 'fashion-technology'
  | 'pricing'
  | 'virtual-try-on-guide'
  | 'outfit-photo-tips'
  | 'ai-fitting-faq'
  | 'about'
  | 'privacy'
  | 'account-deletion'
  | 'refund-policy'
  | 'terms'
  | 'contact'
  | 'board'
  | 'site-management'
  | 'mypage'
  | 'history'
  | 'payment-success'
  | 'payment-failed';

export type FooterNavGroup = 'primary' | 'utility' | null;

export type RouteManifestEntry = {
  path: string;
  canonicalPath: string;
  indexable: boolean;
  sitemap: boolean;
  headerNav: boolean;
  footerNav: FooterNavGroup;
  snapshot: boolean;
  robotsPolicy: RobotsPolicy;
  xRobotsTagPolicy: XRobotsTagPolicy;
  contentSource: ContentSource;
  routeType: RouteType;
  hubSpotlight?: boolean;
};

export type LegacyRouteDefinition = {
  path: string;
  target: RouteKey;
  routeType: 'legacy';
};

export const ROUTE_MANIFEST = {
  home: {
    path: '/',
    canonicalPath: '/',
    indexable: true,
    sitemap: true,
    headerNav: true,
    footerNav: null,
    snapshot: true,
    robotsPolicy: 'index',
    xRobotsTagPolicy: 'none',
    contentSource: 'home-hub',
    routeType: 'hub',
  },
  tryon: {
    path: '/tryon',
    canonicalPath: '/tryon',
    indexable: true,
    sitemap: true,
    headerNav: true,
    footerNav: 'primary',
    snapshot: true,
    robotsPolicy: 'index',
    xRobotsTagPolicy: 'none',
    contentSource: 'localized-page',
    routeType: 'tool',
  },
  admin: {
    path: '/admin',
    canonicalPath: '/admin',
    indexable: false,
    sitemap: false,
    headerNav: false,
    footerNav: null,
    snapshot: false,
    robotsPolicy: 'noindex',
    xRobotsTagPolicy: 'noindex',
    contentSource: 'app-shell',
    routeType: 'internal',
  },
  'dog-outfit-generator': {
    path: '/dog-outfit-generator',
    canonicalPath: '/dog-outfit-generator',
    indexable: true,
    sitemap: true,
    headerNav: false,
    footerNav: 'primary',
    snapshot: true,
    robotsPolicy: 'index',
    xRobotsTagPolicy: 'none',
    contentSource: 'seo-landing',
    routeType: 'landing',
    hubSpotlight: true,
  },
  'cat-outfit-generator': {
    path: '/cat-outfit-generator',
    canonicalPath: '/cat-outfit-generator',
    indexable: true,
    sitemap: true,
    headerNav: false,
    footerNav: 'primary',
    snapshot: true,
    robotsPolicy: 'index',
    xRobotsTagPolicy: 'none',
    contentSource: 'seo-landing',
    routeType: 'landing',
    hubSpotlight: true,
  },
  'pet-halloween-costume': {
    path: '/pet-halloween-costume',
    canonicalPath: '/pet-halloween-costume',
    indexable: true,
    sitemap: true,
    headerNav: false,
    footerNav: 'primary',
    snapshot: true,
    robotsPolicy: 'index',
    xRobotsTagPolicy: 'none',
    contentSource: 'seo-landing',
    routeType: 'landing',
    hubSpotlight: true,
  },
  'pet-hanbok': {
    path: '/pet-hanbok',
    canonicalPath: '/pet-hanbok',
    indexable: true,
    sitemap: true,
    headerNav: false,
    footerNav: 'primary',
    snapshot: true,
    robotsPolicy: 'index',
    xRobotsTagPolicy: 'none',
    contentSource: 'seo-landing',
    routeType: 'landing',
    hubSpotlight: true,
  },
  'dog-hoodie': {
    path: '/dog-hoodie',
    canonicalPath: '/dog-hoodie',
    indexable: true,
    sitemap: true,
    headerNav: false,
    footerNav: 'primary',
    snapshot: true,
    robotsPolicy: 'index',
    xRobotsTagPolicy: 'none',
    contentSource: 'seo-landing',
    routeType: 'landing',
    hubSpotlight: true,
  },
  'cat-formal-outfit': {
    path: '/cat-formal-outfit',
    canonicalPath: '/cat-formal-outfit',
    indexable: true,
    sitemap: true,
    headerNav: false,
    footerNav: 'primary',
    snapshot: true,
    robotsPolicy: 'index',
    xRobotsTagPolicy: 'none',
    contentSource: 'seo-landing',
    routeType: 'landing',
    hubSpotlight: true,
  },
  'dog-hanbok': {
    path: '/dog-hanbok',
    canonicalPath: '/dog-hanbok',
    indexable: false,
    sitemap: false,
    headerNav: false,
    footerNav: null,
    snapshot: false,
    robotsPolicy: 'noindex',
    xRobotsTagPolicy: 'noindex',
    contentSource: 'editorial-page',
    routeType: 'helper',
  },
  'cat-kimono': {
    path: '/cat-kimono',
    canonicalPath: '/cat-kimono',
    indexable: false,
    sitemap: false,
    headerNav: false,
    footerNav: null,
    snapshot: false,
    robotsPolicy: 'noindex',
    xRobotsTagPolicy: 'noindex',
    contentSource: 'editorial-page',
    routeType: 'helper',
  },
  'pet-qipao': {
    path: '/pet-qipao',
    canonicalPath: '/pet-qipao',
    indexable: false,
    sitemap: false,
    headerNav: false,
    footerNav: null,
    snapshot: false,
    robotsPolicy: 'noindex',
    xRobotsTagPolicy: 'noindex',
    contentSource: 'editorial-page',
    routeType: 'helper',
  },
  'pet-saree': {
    path: '/pet-saree',
    canonicalPath: '/pet-saree',
    indexable: false,
    sitemap: false,
    headerNav: false,
    footerNav: null,
    snapshot: false,
    robotsPolicy: 'noindex',
    xRobotsTagPolicy: 'noindex',
    contentSource: 'editorial-page',
    routeType: 'helper',
  },
  'maltese-hanbok': {
    path: '/maltese-hanbok',
    canonicalPath: '/maltese-hanbok',
    indexable: false,
    sitemap: false,
    headerNav: false,
    footerNav: null,
    snapshot: false,
    robotsPolicy: 'noindex',
    xRobotsTagPolicy: 'noindex',
    contentSource: 'editorial-page',
    routeType: 'helper',
  },
  'shiba-kimono': {
    path: '/shiba-kimono',
    canonicalPath: '/shiba-kimono',
    indexable: false,
    sitemap: false,
    headerNav: false,
    footerNav: null,
    snapshot: false,
    robotsPolicy: 'noindex',
    xRobotsTagPolicy: 'noindex',
    contentSource: 'editorial-page',
    routeType: 'helper',
  },
  'corgi-qipao': {
    path: '/corgi-qipao',
    canonicalPath: '/corgi-qipao',
    indexable: false,
    sitemap: false,
    headerNav: false,
    footerNav: null,
    snapshot: false,
    robotsPolicy: 'noindex',
    xRobotsTagPolicy: 'noindex',
    contentSource: 'editorial-page',
    routeType: 'helper',
  },
  'persian-cat-saree': {
    path: '/persian-cat-saree',
    canonicalPath: '/persian-cat-saree',
    indexable: false,
    sitemap: false,
    headerNav: false,
    footerNav: null,
    snapshot: false,
    robotsPolicy: 'noindex',
    xRobotsTagPolicy: 'noindex',
    contentSource: 'editorial-page',
    routeType: 'helper',
  },
  'tuxedo-cat-hanbok': {
    path: '/tuxedo-cat-hanbok',
    canonicalPath: '/tuxedo-cat-hanbok',
    indexable: false,
    sitemap: false,
    headerNav: false,
    footerNav: null,
    snapshot: false,
    robotsPolicy: 'noindex',
    xRobotsTagPolicy: 'noindex',
    contentSource: 'editorial-page',
    routeType: 'helper',
  },
  'poodle-wedding-dress': {
    path: '/poodle-wedding-dress',
    canonicalPath: '/poodle-wedding-dress',
    indexable: false,
    sitemap: false,
    headerNav: false,
    footerNav: null,
    snapshot: false,
    robotsPolicy: 'noindex',
    xRobotsTagPolicy: 'noindex',
    contentSource: 'editorial-page',
    routeType: 'helper',
  },
  'ragdoll-kimono': {
    path: '/ragdoll-kimono',
    canonicalPath: '/ragdoll-kimono',
    indexable: false,
    sitemap: false,
    headerNav: false,
    footerNav: null,
    snapshot: false,
    robotsPolicy: 'noindex',
    xRobotsTagPolicy: 'noindex',
    contentSource: 'editorial-page',
    routeType: 'helper',
  },
  'sample-outfits': {
    path: '/sample-outfits',
    canonicalPath: '/sample-outfits',
    indexable: true,
    sitemap: true,
    headerNav: true,
    footerNav: 'primary',
    snapshot: true,
    robotsPolicy: 'index',
    xRobotsTagPolicy: 'none',
    contentSource: 'localized-page',
    routeType: 'hub',
  },
  'sample-friends': {
    path: '/sample-friends',
    canonicalPath: '/sample-friends',
    indexable: false,
    sitemap: false,
    headerNav: false,
    footerNav: null,
    snapshot: true,
    robotsPolicy: 'noindex',
    xRobotsTagPolicy: 'noindex',
    contentSource: 'editorial-page',
    routeType: 'helper',
  },
  countries: {
    path: '/countries',
    canonicalPath: '/countries',
    indexable: false,
    sitemap: false,
    headerNav: false,
    footerNav: null,
    snapshot: false,
    robotsPolicy: 'noindex',
    xRobotsTagPolicy: 'noindex',
    contentSource: 'editorial-page',
    routeType: 'legacy',
  },
  'how-it-works': {
    path: '/how-to-use',
    canonicalPath: '/how-to-use',
    indexable: true,
    sitemap: true,
    headerNav: true,
    footerNav: null,
    snapshot: true,
    robotsPolicy: 'index',
    xRobotsTagPolicy: 'none',
    contentSource: 'editorial-page',
    routeType: 'support',
  },
  'fashion-technology': {
    path: '/fashion-technology',
    canonicalPath: '/fashion-technology',
    indexable: false,
    sitemap: false,
    headerNav: false,
    footerNav: null,
    snapshot: true,
    robotsPolicy: 'noindex',
    xRobotsTagPolicy: 'noindex',
    contentSource: 'editorial-page',
    routeType: 'helper',
  },
  pricing: {
    path: '/pricing',
    canonicalPath: '/pricing',
    indexable: true,
    sitemap: true,
    headerNav: true,
    footerNav: 'primary',
    snapshot: true,
    robotsPolicy: 'index',
    xRobotsTagPolicy: 'none',
    contentSource: 'localized-page',
    routeType: 'support',
  },
  'virtual-try-on-guide': {
    path: '/virtual-try-on-guide',
    canonicalPath: '/virtual-try-on-guide',
    indexable: false,
    sitemap: false,
    headerNav: false,
    footerNav: null,
    snapshot: true,
    robotsPolicy: 'noindex',
    xRobotsTagPolicy: 'noindex',
    contentSource: 'editorial-page',
    routeType: 'helper',
  },
  'outfit-photo-tips': {
    path: '/outfit-photo-tips',
    canonicalPath: '/outfit-photo-tips',
    indexable: false,
    sitemap: false,
    headerNav: false,
    footerNav: null,
    snapshot: true,
    robotsPolicy: 'noindex',
    xRobotsTagPolicy: 'noindex',
    contentSource: 'editorial-page',
    routeType: 'helper',
  },
  'ai-fitting-faq': {
    path: '/ai-fitting-faq',
    canonicalPath: '/ai-fitting-faq',
    indexable: false,
    sitemap: false,
    headerNav: false,
    footerNav: null,
    snapshot: true,
    robotsPolicy: 'noindex',
    xRobotsTagPolicy: 'noindex',
    contentSource: 'editorial-page',
    routeType: 'helper',
  },
  about: {
    path: '/about',
    canonicalPath: '/about',
    indexable: true,
    sitemap: true,
    headerNav: false,
    footerNav: 'primary',
    snapshot: true,
    robotsPolicy: 'index',
    xRobotsTagPolicy: 'none',
    contentSource: 'editorial-page',
    routeType: 'support',
  },
  privacy: {
    path: '/privacy',
    canonicalPath: '/privacy',
    indexable: true,
    sitemap: true,
    headerNav: false,
    footerNav: 'utility',
    snapshot: true,
    robotsPolicy: 'index',
    xRobotsTagPolicy: 'none',
    contentSource: 'legal-page',
    routeType: 'legal',
  },
  'account-deletion': {
    path: '/account-deletion',
    canonicalPath: '/account-deletion',
    indexable: false,
    sitemap: false,
    headerNav: false,
    footerNav: null,
    snapshot: true,
    robotsPolicy: 'noindex',
    xRobotsTagPolicy: 'noindex',
    contentSource: 'localized-page',
    routeType: 'helper',
  },
  'refund-policy': {
    path: '/refund-policy',
    canonicalPath: '/refund-policy',
    indexable: true,
    sitemap: true,
    headerNav: false,
    footerNav: 'utility',
    snapshot: true,
    robotsPolicy: 'index',
    xRobotsTagPolicy: 'none',
    contentSource: 'legal-page',
    routeType: 'legal',
  },
  terms: {
    path: '/terms',
    canonicalPath: '/terms',
    indexable: true,
    sitemap: true,
    headerNav: false,
    footerNav: 'utility',
    snapshot: true,
    robotsPolicy: 'index',
    xRobotsTagPolicy: 'none',
    contentSource: 'legal-page',
    routeType: 'legal',
  },
  contact: {
    path: '/contact',
    canonicalPath: '/contact',
    indexable: true,
    sitemap: true,
    headerNav: true,
    footerNav: 'primary',
    snapshot: true,
    robotsPolicy: 'index',
    xRobotsTagPolicy: 'none',
    contentSource: 'localized-page',
    routeType: 'support',
  },
  board: {
    path: '/board',
    canonicalPath: '/board',
    indexable: false,
    sitemap: false,
    headerNav: false,
    footerNav: null,
    snapshot: false,
    robotsPolicy: 'noindex',
    xRobotsTagPolicy: 'noindex',
    contentSource: 'app-shell',
    routeType: 'internal',
  },
  'site-management': {
    path: '/site-management',
    canonicalPath: '/site-management',
    indexable: false,
    sitemap: false,
    headerNav: false,
    footerNav: null,
    snapshot: false,
    robotsPolicy: 'noindex',
    xRobotsTagPolicy: 'noindex',
    contentSource: 'app-shell',
    routeType: 'internal',
  },
  mypage: {
    path: '/mypage',
    canonicalPath: '/mypage',
    indexable: false,
    sitemap: false,
    headerNav: false,
    footerNav: null,
    snapshot: false,
    robotsPolicy: 'noindex',
    xRobotsTagPolicy: 'noindex',
    contentSource: 'app-shell',
    routeType: 'internal',
  },
  history: {
    path: '/history',
    canonicalPath: '/history',
    indexable: false,
    sitemap: false,
    headerNav: false,
    footerNav: null,
    snapshot: false,
    robotsPolicy: 'noindex',
    xRobotsTagPolicy: 'noindex',
    contentSource: 'app-shell',
    routeType: 'internal',
  },
  'payment-success': {
    path: '/payment-success',
    canonicalPath: '/payment-success',
    indexable: false,
    sitemap: false,
    headerNav: false,
    footerNav: null,
    snapshot: false,
    robotsPolicy: 'noindex',
    xRobotsTagPolicy: 'noindex',
    contentSource: 'app-shell',
    routeType: 'internal',
  },
  'payment-failed': {
    path: '/payment-failed',
    canonicalPath: '/payment-failed',
    indexable: false,
    sitemap: false,
    headerNav: false,
    footerNav: null,
    snapshot: false,
    robotsPolicy: 'noindex',
    xRobotsTagPolicy: 'noindex',
    contentSource: 'app-shell',
    routeType: 'internal',
  },
} as const satisfies Record<RouteKey, RouteManifestEntry>;

export const LEGACY_ROUTE_MANIFEST = [
  { path: '/how-it-works', target: 'how-it-works', routeType: 'legacy' },
  { path: '/traditional-clothing', target: 'sample-outfits', routeType: 'legacy' },
  { path: '/countries', target: 'sample-outfits', routeType: 'legacy' },
  { path: '/dog-hanbok', target: 'pet-hanbok', routeType: 'legacy' },
  { path: '/maltese-hanbok', target: 'pet-hanbok', routeType: 'legacy' },
  { path: '/tuxedo-cat-hanbok', target: 'pet-hanbok', routeType: 'legacy' },
  { path: '/cat-kimono', target: 'sample-outfits', routeType: 'legacy' },
  { path: '/shiba-kimono', target: 'sample-outfits', routeType: 'legacy' },
  { path: '/ragdoll-kimono', target: 'sample-outfits', routeType: 'legacy' },
  { path: '/pet-qipao', target: 'sample-outfits', routeType: 'legacy' },
  { path: '/corgi-qipao', target: 'sample-outfits', routeType: 'legacy' },
  { path: '/pet-saree', target: 'sample-outfits', routeType: 'legacy' },
  { path: '/persian-cat-saree', target: 'sample-outfits', routeType: 'legacy' },
  { path: '/poodle-wedding-dress', target: 'sample-outfits', routeType: 'legacy' },
] as const satisfies readonly LegacyRouteDefinition[];

export const ROUTE_KEYS = Object.keys(ROUTE_MANIFEST) as RouteKey[];
export const ROUTE_DEFINITIONS = ROUTE_KEYS.map((key) => ({ key, ...ROUTE_MANIFEST[key] }));
export const ROUTE_BY_KEY: Readonly<Record<RouteKey, RouteManifestEntry>> = ROUTE_MANIFEST;

export const PAGE_PATHS: Readonly<Record<RouteKey, string>> = ROUTE_KEYS.reduce(
  (accumulator, key) => {
    accumulator[key] = ROUTE_MANIFEST[key].path;
    return accumulator;
  },
  {} as Record<RouteKey, string>,
);

export const CANONICAL_PATHS: Readonly<Record<RouteKey, string>> = ROUTE_KEYS.reduce(
  (accumulator, key) => {
    accumulator[key] = ROUTE_MANIFEST[key].canonicalPath;
    return accumulator;
  },
  {} as Record<RouteKey, string>,
);

export const PATH_TO_ROUTE_KEY = ROUTE_KEYS.reduce(
  (accumulator, key) => {
    accumulator[ROUTE_MANIFEST[key].path] = key;
    return accumulator;
  },
  {} as Record<string, RouteKey>,
);

const filterRouteKeys = (predicate: (key: RouteKey, entry: RouteManifestEntry) => boolean): RouteKey[] =>
  ROUTE_KEYS.filter((key) => predicate(key, ROUTE_MANIFEST[key]));

export const SITE_ROUTE_KEYS = [...ROUTE_KEYS];
export const INDEXABLE_ROUTE_KEYS = filterRouteKeys((_, entry) => entry.indexable);
export const SNAPSHOT_ROUTE_KEYS = filterRouteKeys((_, entry) => entry.snapshot);
export const SITEMAP_ROUTE_KEYS = filterRouteKeys((_, entry) => entry.sitemap);
export const HEADER_NAV_ROUTE_KEYS = filterRouteKeys((_, entry) => entry.headerNav);
export const FOOTER_PRIMARY_ROUTE_KEYS = filterRouteKeys((_, entry) => entry.footerNav === 'primary');
export const FOOTER_UTILITY_ROUTE_KEYS = filterRouteKeys((_, entry) => entry.footerNav === 'utility');
export const NOINDEX_ROUTE_KEYS = filterRouteKeys((_, entry) => entry.robotsPolicy === 'noindex');
export const X_ROBOTS_NOINDEX_ROUTE_KEYS = filterRouteKeys((_, entry) => entry.xRobotsTagPolicy === 'noindex');
export const LANDING_ROUTE_KEYS = filterRouteKeys((_, entry) => entry.routeType === 'landing');
export const HUB_ROUTE_KEYS = filterRouteKeys((_, entry) => entry.routeType === 'hub');
export const HELPER_ROUTE_KEYS = filterRouteKeys((_, entry) => entry.routeType === 'helper');
export const SPA_FALLBACK_ROUTE_KEYS = filterRouteKeys((_, entry) => !entry.snapshot);
export const HUB_SPOTLIGHT_ROUTE_KEYS = filterRouteKeys((_, entry) => entry.hubSpotlight === true);

export const KNOWN_ROUTE_PATHS = new Set(ROUTE_KEYS.map((key) => ROUTE_MANIFEST[key].path));
export const SNAPSHOT_ROUTE_PATHS = new Set(SNAPSHOT_ROUTE_KEYS.map((key) => ROUTE_MANIFEST[key].path));
export const SPA_FALLBACK_ROUTE_PATHS = new Set(SPA_FALLBACK_ROUTE_KEYS.map((key) => ROUTE_MANIFEST[key].path));
export const NOINDEX_ROUTE_PATHS = new Set(NOINDEX_ROUTE_KEYS.map((key) => ROUTE_MANIFEST[key].path));
export const X_ROBOTS_NOINDEX_ROUTE_PATHS = new Set(X_ROBOTS_NOINDEX_ROUTE_KEYS.map((key) => ROUTE_MANIFEST[key].path));

export const LEGACY_ROUTE_REDIRECTS = new Map(
  LEGACY_ROUTE_MANIFEST.map((route) => [route.path, PAGE_PATHS[route.target]]),
);

export const getRouteDefinition = (key: RouteKey): RouteManifestEntry => ROUTE_MANIFEST[key];
