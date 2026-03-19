import editorialPagesData from '../data/editorialPages.json';
import type { LanguageCode } from '../constants/languages';

export const EDITORIAL_PAGE_KEYS = [
  'about',
  'how-it-works',
  'traditional-clothing',
  'countries',
  'fashion-technology',
  'virtual-try-on-guide',
  'outfit-photo-tips',
  'ai-fitting-faq',
] as const;

export type EditorialPageKey = (typeof EDITORIAL_PAGE_KEYS)[number];

export type EditorialSection = {
  heading: string;
  paragraphs: string[];
};

export type EditorialFaqItem = {
  question: string;
  answer: string;
};

export type EditorialPageContent = {
  title: string;
  description: string;
  summary: string;
  sections: EditorialSection[];
  faq: EditorialFaqItem[];
  relatedPages: EditorialPageKey[];
};

type EditorialPagesJson = {
  featuredOrder: EditorialPageKey[];
  pages: Record<EditorialPageKey, EditorialPageContent>;
};

const editorialData = editorialPagesData as EditorialPagesJson;

export const FEATURED_EDITORIAL_PAGES = editorialData.featuredOrder;

export const getEditorialPage = (page: string): EditorialPageContent | null => {
  if (!EDITORIAL_PAGE_KEYS.includes(page as EditorialPageKey)) {
    return null;
  }

  return editorialData.pages[page as EditorialPageKey];
};

export const getEditorialPageTitle = (page: EditorialPageKey): string =>
  editorialData.pages[page].title;

export const getEditorialPageSummary = (page: EditorialPageKey): string =>
  editorialData.pages[page].summary;

export const getEditorialRelatedPages = (page: EditorialPageKey): EditorialPageKey[] =>
  editorialData.pages[page].relatedPages;

export const resolveEditorialLanguage = (lang: LanguageCode): 'en' | 'ko' | 'ja' | 'zh' =>
  lang === 'ko' || lang === 'ja' || lang === 'zh' ? lang : 'en';

export const getEditorialUiCopy = (lang: LanguageCode) => {
  switch (resolveEditorialLanguage(lang)) {
    case 'ko':
      return {
        homeTitle: '읽을거리와 가이드를 먼저 보고, 필요한 순간에만 피팅을 시작하세요.',
        homeDescription: '가상 피팅 사용법, 전통 의상 비교, 입력 사진 팁, AI 피팅 FAQ를 한곳에서 읽을 수 있습니다.',
        relatedTitle: '관련 읽을거리',
        relatedDescription: '현재 페이지와 함께 보면 도움이 되는 편집형 페이지입니다.',
        readMore: '페이지 보기',
      };
    case 'ja':
      return {
        homeTitle: 'まずは記事とガイドを読み、必要なときにだけ試着ツールへ進めます。',
        homeDescription: '使い方、伝統衣装比較、入力写真のコツ、AI フィッティング FAQ をまとめて読めます。',
        relatedTitle: '関連ページ',
        relatedDescription: 'このページとあわせて読むと理解しやすい編集ページです。',
        readMore: 'ページを見る',
      };
    case 'zh':
      return {
        homeTitle: '先阅读指南和专题内容，再在需要时进入试穿工具。',
        homeDescription: '你可以在同一处阅读使用方法、传统服饰比较、输入照片技巧和 AI 试穿 FAQ。',
        relatedTitle: '相关阅读',
        relatedDescription: '这些编辑型页面与当前主题相关，适合继续阅读。',
        readMore: '查看页面',
      };
    default:
      return {
        homeTitle: 'Read the guides first, then use the fitting tool when you actually have a stronger reference.',
        homeDescription: 'Explore how-to guides, traditional outfit comparisons, input-photo tips, and AI fitting FAQs in one editorial hub.',
        relatedTitle: 'Related Reading',
        relatedDescription: 'These editorial pages strengthen the topic you are already viewing.',
        readMore: 'Open page',
      };
  }
};
