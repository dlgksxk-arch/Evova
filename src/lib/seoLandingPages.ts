import baseSeoLandingPages from '../data/seoLandingPages.json';
import type { LanguageCode } from '../constants/languages';
import type { SitePage } from '../locales';

type SeoLandingPageKey =
  | 'dog-outfit-generator'
  | 'cat-outfit-generator'
  | 'pet-halloween-costume'
  | 'pet-hanbok'
  | 'dog-hoodie'
  | 'cat-formal-outfit';

type SeoLandingSection = {
  heading: string;
  paragraphs: string[];
};

type SeoLandingFaqItem = {
  question: string;
  answer: string;
};

export type SeoLandingPageContent = {
  title: string;
  description: string;
  summary: string;
  sections: SeoLandingSection[];
  faq: SeoLandingFaqItem[];
  relatedPages: SitePage[];
};

type SeoLandingPageTranslation = Partial<Omit<SeoLandingPageContent, 'sections' | 'faq' | 'relatedPages'>> & {
  sections?: SeoLandingSection[];
  faq?: SeoLandingFaqItem[];
  relatedPages?: SitePage[];
};

const SEO_LANDING_PAGE_BASE = baseSeoLandingPages as Record<SeoLandingPageKey, SeoLandingPageContent>;

const SEO_LANDING_PAGE_TRANSLATIONS: Partial<Record<LanguageCode, Partial<Record<SeoLandingPageKey, SeoLandingPageTranslation>>>> = {
  ko: {
    'dog-outfit-generator': {
      title: '강아지 의상 생성기',
      description: '강아지 사진과 의상 이미지를 넣고 캐주얼룩, 코스튬, 포멀룩을 빠르게 비교해 보세요.',
      summary: '강아지 옷입혀보기 의도가 가장 강한 방문자를 위한 랜딩입니다. 어떤 사진과 어떤 의상 이미지가 더 잘 먹는지 바로 이해할 수 있게 구성했습니다.',
    },
    'cat-outfit-generator': {
      title: '고양이 의상 생성기',
      description: '고양이 사진과 의상 이미지로 귀여운 룩, 테마 룩, 포멀 룩을 빠르게 미리보기 해보세요.',
      summary: '고양이 옷입혀보기나 고양이 코스튬 아이디어를 바로 테스트하고 싶은 사용자를 위한 페이지입니다.',
    },
    'pet-halloween-costume': {
      title: '반려동물 할로윈 코스튬 미리보기',
      description: '강아지와 고양이 할로윈 코스튬 아이디어를 생성 전에 먼저 비교해 보세요.',
      summary: '할로윈 시즌 검색 유입을 받으면서도 바로 생성으로 이어질 수 있게 만든 계절성 랜딩입니다.',
    },
    'pet-hanbok': {
      title: '반려동물 한복 미리보기',
      description: '강아지와 고양이 한복 스타일을 비교하고, 한복 이미지로 반려동물 의상 미리보기를 만들어 보세요.',
      summary: '한복은 유지하되 사이트 전체 주제가 아니라 강한 보조 카테고리 랜딩으로 위치를 조정했습니다.',
    },
    'dog-hoodie': {
      title: '강아지 후드티 미리보기',
      description: '강아지 후드티, 맨투맨, 데일리룩 의상 이미지를 올려 캐주얼 스타일을 비교해 보세요.',
      summary: '실사용 검색어에 가까운 데일리 강아지 의상 랜딩입니다.',
    },
    'cat-formal-outfit': {
      title: '고양이 포멀 의상 미리보기',
      description: '고양이 턱시도, 드레스, 스튜디오 촬영용 포멀 의상 아이디어를 생성 전에 비교해 보세요.',
      summary: '행사, 프로필 사진, 스튜디오 촬영처럼 더 정돈된 룩을 찾는 검색 의도를 위한 랜딩입니다.',
    },
  },
};

export const isSeoLandingPage = (page: SitePage): page is SeoLandingPageKey => page in SEO_LANDING_PAGE_BASE;

export const getSeoLandingPage = (page: SitePage, lang: LanguageCode): SeoLandingPageContent | null => {
  if (!isSeoLandingPage(page)) {
    return null;
  }

  const basePage = SEO_LANDING_PAGE_BASE[page];
  const translation = SEO_LANDING_PAGE_TRANSLATIONS[lang]?.[page];
  if (!translation) {
    return basePage;
  }

  return {
    ...basePage,
    ...translation,
    sections: translation.sections ?? basePage.sections,
    faq: translation.faq ?? basePage.faq,
    relatedPages: translation.relatedPages ?? basePage.relatedPages,
  };
};

export const getSeoLandingPageEntries = (lang: LanguageCode): Array<[SeoLandingPageKey, SeoLandingPageContent]> =>
  (Object.keys(SEO_LANDING_PAGE_BASE) as SeoLandingPageKey[]).map((page) => [page, getSeoLandingPage(page, lang)!]);
