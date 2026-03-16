import type { LanguageCode } from '../constants/languages';
import en from './en.json';
import hi from './hi.json';
import ja from './ja.json';
import ko from './ko.json';
import zh from './zh.json';

export type ContentLocale = typeof en;
export type ModalTab = keyof ContentLocale['modal']['tabs'];
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends Array<unknown>
    ? T[K]
    : T[K] extends object
      ? DeepPartial<T[K]>
      : T[K];
};
export type SitePage =
  | 'home'
  | 'traditional-clothing'
  | 'countries'
  | 'how-it-works'
  | 'fashion-technology'
  | 'about'
  | 'privacy'
  | 'terms'
  | 'contact'
  | 'board'
  | 'site-management'
  | 'mypage';

export const SITE_PAGES: SitePage[] = [
  'home',
  'traditional-clothing',
  'countries',
  'how-it-works',
  'fashion-technology',
  'about',
  'privacy',
  'terms',
  'contact',
  'board',
  'site-management',
  'mypage',
];

export const NAV_PAGES: SitePage[] = [
  'home',
  'about',
  'how-it-works',
  'traditional-clothing',
  'board',
  'privacy',
  'terms',
  'contact',
];

const locales: Partial<Record<LanguageCode, DeepPartial<ContentLocale>>> = {
  en,
  hi,
  ja,
  ko,
  zh,
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const mergeLocale = <T,>(base: T, override?: DeepPartial<T>): T => {
  if (override === undefined) {
    return base;
  }

  if (Array.isArray(base) || Array.isArray(override)) {
    return (override ?? base) as T;
  }

  if (isPlainObject(base) && isPlainObject(override)) {
    const merged: Record<string, unknown> = { ...base };

    for (const key of Object.keys(override)) {
      const typedKey = key as keyof T;
      merged[key] = mergeLocale(base[typedKey], override[typedKey]);
    }

    return merged as T;
  }

  return (override ?? base) as T;
};

export const getContentLocale = (lang: LanguageCode): ContentLocale =>
  mergeLocale(en, locales[lang]);
