import type { LanguageCode } from '../constants/languages';
import en from './en.json';
import hi from './hi.json';
import ko from './ko.json';
import zh from './zh.json';

export type ContentLocale = typeof en;
export type ModalTab = keyof ContentLocale['modal']['tabs'];
export type SitePage =
  | 'home'
  | 'traditional-clothing'
  | 'countries'
  | 'how-it-works'
  | 'fashion-technology'
  | 'about'
  | 'privacy'
  | 'terms'
  | 'contact';

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
];

const locales: Record<string, ContentLocale> = {
  en,
  hi,
  ko,
  zh,
};

export const getContentLocale = (lang: LanguageCode): ContentLocale =>
  locales[lang] ?? en;
