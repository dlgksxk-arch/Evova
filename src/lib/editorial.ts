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
        homeTitle: '필요한 정보만 빠르게 보고 바로 생성으로 이동하세요.',
        homeDescription: '사용 방법, 의상 아이디어, 입력 팁처럼 실제로 도움이 되는 보조 페이지를 정리했습니다.',
        relatedTitle: '함께 보면 좋은 페이지',
        relatedDescription: '현재 페이지와 연결되는 다음 단계 페이지입니다.',
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
        homeTitle: 'Use the supporting pages only when they help you get to a better preview faster.',
        homeDescription: 'Browse practical pages for workflow, outfit ideas, and cleaner inputs.',
        relatedTitle: 'Related Pages',
        relatedDescription: 'Use these pages for the next step in the workflow.',
        readMore: 'Open page',
      };
  }
};
