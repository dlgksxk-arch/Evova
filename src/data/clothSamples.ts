import { resolveSampleAssetUrl } from '../lib/assets';

export type ClothSampleCategory = 'female' | 'male' | 'future' | 'classic' | 'special';

export interface ClothSampleOption {
  id: string;
  label: string;
  image: string;
  category: ClothSampleCategory;
  country: string;
  countryLabelKo: string;
  countryLabelEn: string;
}

export type TraditionalOutfitCountry =
  | 'korea'
  | 'japan'
  | 'china'
  | 'india'
  | 'vietnam'
  | 'thailand'
  | 'indonesia'
  | 'spain';

export interface TraditionalOutfitGuide {
  id: TraditionalOutfitCountry;
  country: TraditionalOutfitCountry;
  countryLabel: string;
  outfitName: string;
  summary: string;
  image: string;
  overview: string[];
  history: string[];
  culture: string[];
  design: string[];
  modernUse: string[];
  fittingTips: string[];
}

export interface OutfitPromptHints {
  outfitName: string;
  mood: string;
  pose: string;
  background: string;
}

const SAMPLE_ASSET_BASE_PATH = '/sample/cloth';

type SampleSeed = {
  id: string;
  label: string;
  file: string;
  country: string;
  countryLabelKo: string;
  countryLabelEn: string;
};

const createSamples = (category: ClothSampleCategory, seeds: SampleSeed[]): ClothSampleOption[] =>
  seeds.map((seed) => ({
    id: seed.id,
    label: seed.label,
    image: resolveSampleAssetUrl(`${SAMPLE_ASSET_BASE_PATH}/${category}/${seed.file}`),
    category,
    country: seed.country,
    countryLabelKo: seed.countryLabelKo,
    countryLabelEn: seed.countryLabelEn,
  }));

const femaleSamples = createSamples('female', [
  { id: 'korea-trad-0', label: '한복 1', file: '2026-03-13-12-47-58-korea-trad-0.png', country: 'korea', countryLabelKo: '한국', countryLabelEn: 'Korea' },
  { id: 'korea-trad-1', label: '한복 2', file: '2026-03-13-12-48-44-korea-trad-1.png', country: 'korea', countryLabelKo: '한국', countryLabelEn: 'Korea' },
  { id: 'korea-trad-2', label: '한복 3', file: '2026-03-13-12-49-30-korea-trad-2.png', country: 'korea', countryLabelKo: '한국', countryLabelEn: 'Korea' },
  { id: 'korea-trad-3', label: '한복 4', file: '2026-03-13-12-50-14-korea-trad-3.png', country: 'korea', countryLabelKo: '한국', countryLabelEn: 'Korea' },
  { id: 'korea-trad-4', label: '한복 5', file: '2026-03-13-12-50-58-korea-trad-4.png', country: 'korea', countryLabelKo: '한국', countryLabelEn: 'Korea' },
  { id: 'japan-trad-0', label: '기모노 1', file: '2026-03-13-12-51-42-japan-trad-0.png', country: 'japan', countryLabelKo: '일본', countryLabelEn: 'Japan' },
  { id: 'japan-trad-1', label: '기모노 2', file: '2026-03-13-12-52-36-japan-trad-1.png', country: 'japan', countryLabelKo: '일본', countryLabelEn: 'Japan' },
  { id: 'japan-trad-2', label: '기모노 3', file: '2026-03-13-12-53-20-japan-trad-2.png', country: 'japan', countryLabelKo: '일본', countryLabelEn: 'Japan' },
  { id: 'japan-trad-3', label: '기모노 4', file: '2026-03-13-12-54-04-japan-trad-3.png', country: 'japan', countryLabelKo: '일본', countryLabelEn: 'Japan' },
  { id: 'japan-trad-4', label: '기모노 5', file: '2026-03-13-12-54-49-japan-trad-4.png', country: 'japan', countryLabelKo: '일본', countryLabelEn: 'Japan' },
  { id: 'china-trad-0', label: '치파오 1', file: '2026-03-13-12-55-32-china-trad-0.png', country: 'china', countryLabelKo: '중국', countryLabelEn: 'China' },
  { id: 'china-trad-1', label: '치파오 2', file: '2026-03-13-12-56-18-china-trad-1.png', country: 'china', countryLabelKo: '중국', countryLabelEn: 'China' },
  { id: 'china-trad-2', label: '치파오 3', file: '2026-03-13-12-57-02-china-trad-2.png', country: 'china', countryLabelKo: '중국', countryLabelEn: 'China' },
  { id: 'china-trad-extra-0', label: '치파오 4', file: '2026-03-13-13-30-16-china-trad-extra.png', country: 'china', countryLabelKo: '중국', countryLabelEn: 'China' },
  { id: 'china-trad-extra-1', label: '치파오 5', file: '2026-03-13-13-31-02-china-trad-extra.png', country: 'china', countryLabelKo: '중국', countryLabelEn: 'China' },
  { id: 'thailand-trad-0', label: '태국 전통의상 1', file: '2026-03-13-13-09-45-thailand-trad-0.png', country: 'thailand', countryLabelKo: '태국', countryLabelEn: 'Thailand' },
  { id: 'thailand-trad-1', label: '태국 전통의상 2', file: '2026-03-13-13-10-30-thailand-trad-1.png', country: 'thailand', countryLabelKo: '태국', countryLabelEn: 'Thailand' },
  { id: 'thailand-trad-2', label: '태국 전통의상 3', file: '2026-03-13-13-11-14-thailand-trad-2.png', country: 'thailand', countryLabelKo: '태국', countryLabelEn: 'Thailand' },
  { id: 'thailand-trad-extra-0', label: '태국 전통의상 4', file: '2026-03-13-13-20-04-thailand-trad-extra.png', country: 'thailand', countryLabelKo: '태국', countryLabelEn: 'Thailand' },
  { id: 'thailand-trad-extra-1', label: '태국 전통의상 5', file: '2026-03-13-13-20-47-thailand-trad-extra.png', country: 'thailand', countryLabelKo: '태국', countryLabelEn: 'Thailand' },
  { id: 'vietnam-trad-0', label: '아오자이 1', file: '2026-03-13-13-11-56-vietnam-trad-0.png', country: 'vietnam', countryLabelKo: '베트남', countryLabelEn: 'Vietnam' },
  { id: 'vietnam-trad-1', label: '아오자이 2', file: '2026-03-13-13-12-40-vietnam-trad-1.png', country: 'vietnam', countryLabelKo: '베트남', countryLabelEn: 'Vietnam' },
  { id: 'vietnam-trad-2', label: '아오자이 3', file: '2026-03-13-13-13-21-vietnam-trad-2.png', country: 'vietnam', countryLabelKo: '베트남', countryLabelEn: 'Vietnam' },
  { id: 'vietnam-trad-extra-0', label: '아오자이 4', file: '2026-03-13-13-21-31-vietnam-trad-extra.png', country: 'vietnam', countryLabelKo: '베트남', countryLabelEn: 'Vietnam' },
  { id: 'vietnam-trad-extra-1', label: '아오자이 5', file: '2026-03-13-13-22-15-vietnam-trad-extra.png', country: 'vietnam', countryLabelKo: '베트남', countryLabelEn: 'Vietnam' },
  { id: 'india-trad-0', label: '사리 1', file: '2026-03-13-13-14-07-india-trad-0.png', country: 'india', countryLabelKo: '인도', countryLabelEn: 'India' },
  { id: 'india-trad-1', label: '사리 2', file: '2026-03-13-13-14-53-india-trad-1.png', country: 'india', countryLabelKo: '인도', countryLabelEn: 'India' },
  { id: 'india-trad-2', label: '사리 3', file: '2026-03-13-13-15-38-india-trad-2.png', country: 'india', countryLabelKo: '인도', countryLabelEn: 'India' },
  { id: 'india-trad-extra-0', label: '사리 4', file: '2026-03-13-13-22-57-india-trad-extra.png', country: 'india', countryLabelKo: '인도', countryLabelEn: 'India' },
  { id: 'india-trad-extra-1', label: '사리 5', file: '2026-03-13-13-23-44-india-trad-extra.png', country: 'india', countryLabelKo: '인도', countryLabelEn: 'India' },
  { id: 'indonesia-trad-0', label: '인도네시아 전통의상 1', file: '2026-03-13-13-16-21-indonesia-trad-0.png', country: 'indonesia', countryLabelKo: '인도네시아', countryLabelEn: 'Indonesia' },
  { id: 'indonesia-trad-1', label: '인도네시아 전통의상 2', file: '2026-03-13-13-17-03-indonesia-trad-1.png', country: 'indonesia', countryLabelKo: '인도네시아', countryLabelEn: 'Indonesia' },
  { id: 'indonesia-trad-2', label: '인도네시아 전통의상 3', file: '2026-03-13-13-17-48-indonesia-trad-2.png', country: 'indonesia', countryLabelKo: '인도네시아', countryLabelEn: 'Indonesia' },
  { id: 'indonesia-trad-extra-0', label: '인도네시아 전통의상 4', file: '2026-03-13-13-24-28-indonesia-trad-extra.png', country: 'indonesia', countryLabelKo: '인도네시아', countryLabelEn: 'Indonesia' },
  { id: 'indonesia-trad-extra-1', label: '인도네시아 전통의상 5', file: '2026-03-13-13-25-18-indonesia-trad-extra.png', country: 'indonesia', countryLabelKo: '인도네시아', countryLabelEn: 'Indonesia' },
  { id: 'spain-trad-extra-0', label: '스페인 전통의상 1', file: '2026-03-13-13-26-02-spain-trad-extra.png', country: 'spain', countryLabelKo: '스페인', countryLabelEn: 'Spain' },
  { id: 'spain-trad-extra-1', label: '스페인 전통의상 2', file: '2026-03-13-13-26-46-spain-trad-extra.png', country: 'spain', countryLabelKo: '스페인', countryLabelEn: 'Spain' },
  { id: 'spain-trad-extra-2', label: '스페인 전통의상 3', file: '2026-03-13-13-27-29-spain-trad-extra.png', country: 'spain', countryLabelKo: '스페인', countryLabelEn: 'Spain' },
  { id: 'spain-trad-extra-3', label: '스페인 전통의상 4', file: '2026-03-13-13-28-14-spain-trad-extra.png', country: 'spain', countryLabelKo: '스페인', countryLabelEn: 'Spain' },
  { id: 'spain-trad-extra-4', label: '스페인 전통의상 5', file: '2026-03-13-13-28-57-spain-trad-extra.png', country: 'spain', countryLabelKo: '스페인', countryLabelEn: 'Spain' },
]);

const maleSamples = createSamples('male', [
  { id: 'korea-men-trad-0', label: '남성 한복 1', file: '2026-03-13-13-38-29-korea-men-trad-0.png', country: 'korea', countryLabelKo: '한국', countryLabelEn: 'Korea' },
  { id: 'korea-men-trad-1', label: '남성 한복 2', file: '2026-03-13-13-39-10-korea-men-trad-1.png', country: 'korea', countryLabelKo: '한국', countryLabelEn: 'Korea' },
  { id: 'japan-men-trad-0', label: '남성 기모노 1', file: '2026-03-13-13-39-49-japan-men-trad-0.png', country: 'japan', countryLabelKo: '일본', countryLabelEn: 'Japan' },
  { id: 'japan-men-trad-1', label: '남성 기모노 2', file: '2026-03-13-13-40-31-japan-men-trad-1.png', country: 'japan', countryLabelKo: '일본', countryLabelEn: 'Japan' },
  { id: 'china-men-trad-0', label: '남성 중국 전통의상 1', file: '2026-03-13-13-41-13-china-men-trad-0.png', country: 'china', countryLabelKo: '중국', countryLabelEn: 'China' },
  { id: 'china-men-trad-1', label: '남성 중국 전통의상 2', file: '2026-03-13-13-41-56-china-men-trad-1.png', country: 'china', countryLabelKo: '중국', countryLabelEn: 'China' },
  { id: 'thailand-men-trad-0', label: '남성 태국 전통의상 1', file: '2026-03-13-13-42-40-thailand-men-trad-0.png', country: 'thailand', countryLabelKo: '태국', countryLabelEn: 'Thailand' },
  { id: 'thailand-men-trad-1', label: '남성 태국 전통의상 2', file: '2026-03-13-13-43-24-thailand-men-trad-1.png', country: 'thailand', countryLabelKo: '태국', countryLabelEn: 'Thailand' },
  { id: 'vietnam-men-trad-0', label: '남성 베트남 전통의상 1', file: '2026-03-13-13-44-06-vietnam-men-trad-0.png', country: 'vietnam', countryLabelKo: '베트남', countryLabelEn: 'Vietnam' },
  { id: 'vietnam-men-trad-1', label: '남성 베트남 전통의상 2', file: '2026-03-13-13-44-49-vietnam-men-trad-1.png', country: 'vietnam', countryLabelKo: '베트남', countryLabelEn: 'Vietnam' },
  { id: 'india-men-trad-0', label: '남성 인도 전통의상 1', file: '2026-03-13-13-45-32-india-men-trad-0.png', country: 'india', countryLabelKo: '인도', countryLabelEn: 'India' },
  { id: 'india-men-trad-1', label: '남성 인도 전통의상 2', file: '2026-03-13-13-46-15-india-men-trad-1.png', country: 'india', countryLabelKo: '인도', countryLabelEn: 'India' },
  { id: 'indonesia-men-trad-0', label: '남성 인도네시아 전통의상 1', file: '2026-03-13-13-46-57-indonesia-men-trad-0.png', country: 'indonesia', countryLabelKo: '인도네시아', countryLabelEn: 'Indonesia' },
  { id: 'indonesia-men-trad-1', label: '남성 인도네시아 전통의상 2', file: '2026-03-13-13-47-39-indonesia-men-trad-1.png', country: 'indonesia', countryLabelKo: '인도네시아', countryLabelEn: 'Indonesia' },
  { id: 'spain-men-trad-0', label: '남성 스페인 전통의상 1', file: '2026-03-13-13-48-35-spain-men-trad-0.png', country: 'spain', countryLabelKo: '스페인', countryLabelEn: 'Spain' },
  { id: 'spain-men-trad-1', label: '남성 스페인 전통의상 2', file: '2026-03-13-13-49-17-spain-men-trad-1.png', country: 'spain', countryLabelKo: '스페인', countryLabelEn: 'Spain' },
]);

const futureSamples = createSamples('future', [
  { id: 'future-cybersuit-0', label: '미래 의상 1', file: '2026-03-13-14-07-37-cybersuit.png', country: 'cybersuit', countryLabelKo: '미래', countryLabelEn: 'Future' },
  { id: 'future-cybersuit-1', label: '미래 의상 2', file: '2026-03-13-14-08-22-cybersuit.png', country: 'cybersuit', countryLabelKo: '미래', countryLabelEn: 'Future' },
]);

const classicSamples = createSamples('classic', [
  { id: 'classic-uk70s-0', label: '70스타일 수트 1', file: '2026-03-13-14-09-05-uk70s.png', country: 'uk70s', countryLabelKo: '70스타일 수트', countryLabelEn: '70s Style Suit' },
  { id: 'classic-uk70s-1', label: '70스타일 수트 2', file: '2026-03-13-14-09-48-uk70s.png', country: 'uk70s', countryLabelKo: '70스타일 수트', countryLabelEn: '70s Style Suit' },
  { id: 'classic-uk80s-0', label: '80년대 스타일 수트 1', file: '2026-03-13-14-10-26-uk80s.png', country: 'uk80s', countryLabelKo: '80년대 스타일 수트', countryLabelEn: '80s Style Suit' },
  { id: 'classic-uk80s-1', label: '80년대 스타일 수트 2', file: '2026-03-13-14-11-17-uk80s.png', country: 'uk80s', countryLabelKo: '80년대 스타일 수트', countryLabelEn: '80s Style Suit' },
]);

const specialSamples = createSamples('special', [
  { id: 'special-birthday-0', label: '생일 룩 1', file: '01-birthday-golden-retriever.png', country: 'birthday', countryLabelKo: '생일', countryLabelEn: 'Birthday' },
  { id: 'special-halloween-0', label: '할로윈 룩 1', file: '02-halloween-black-cat.png', country: 'halloween', countryLabelKo: '할로윈', countryLabelEn: 'Halloween' },
  { id: 'special-christmas-0', label: '크리스마스 룩 1', file: '03-christmas-corgi.png', country: 'christmas', countryLabelKo: '크리스마스', countryLabelEn: 'Christmas' },
  { id: 'special-lunarnewyear-0', label: '설날 룩 1', file: '04-lunarnewyear-jindo.png', country: 'lunarnewyear', countryLabelKo: '설날', countryLabelEn: 'Lunar New Year' },
  { id: 'special-valentine-0', label: '발렌타인 룩 1', file: '05-valentine-pomeranian.png', country: 'valentine', countryLabelKo: '발렌타인', countryLabelEn: 'Valentine' },
  { id: 'special-wedding-0', label: '웨딩 룩 1', file: '06-wedding-siamese.png', country: 'wedding', countryLabelKo: '웨딩', countryLabelEn: 'Wedding' },
  { id: 'special-graduation-0', label: '졸업식 룩 1', file: '07-graduation-husky.png', country: 'graduation', countryLabelKo: '졸업식', countryLabelEn: 'Graduation' },
  { id: 'special-beach-0', label: '비치 룩 1', file: '08-beach-chihuahua.png', country: 'beach', countryLabelKo: '바캉스', countryLabelEn: 'Beach' },
  { id: 'special-sportsday-0', label: '운동회 룩 1', file: '09-sportsday-shiba.png', country: 'sportsday', countryLabelKo: '운동회', countryLabelEn: 'Sports Day' },
  { id: 'special-rainyday-0', label: '장마 룩 1', file: '10-rainyday-british-shorthair.png', country: 'rainyday', countryLabelKo: '비 오는 날', countryLabelEn: 'Rainy Day' },
  { id: 'special-snowfestival-0', label: '겨울 축제 룩 1', file: '11-snowfestival-samoyed.png', country: 'snowfestival', countryLabelKo: '겨울 축제', countryLabelEn: 'Snow Festival' },
  { id: 'special-fireworks-0', label: '불꽃놀이 룩 1', file: '12-fireworks-bengal.png', country: 'fireworks', countryLabelKo: '불꽃놀이', countryLabelEn: 'Fireworks' },
]);

export const clothSampleOptions: ClothSampleOption[] = [
  ...femaleSamples,
  ...maleSamples,
  ...futureSamples,
  ...classicSamples,
  ...specialSamples,
];

const TRADITIONAL_COUNTRY_ORDER: TraditionalOutfitCountry[] = [
  'korea',
  'japan',
  'china',
  'india',
  'vietnam',
  'thailand',
  'indonesia',
  'spain',
];

const extractTraditionalCountryFromImage = (imagePath: string): TraditionalOutfitCountry | null => {
  const filename = imagePath.split('/').pop()?.toLowerCase() ?? '';
  const matched = filename.match(/(korea|japan|china|india|vietnam|thailand|indonesia|spain)/i)?.[1]?.toLowerCase();
  if (
    matched === 'korea'
    || matched === 'japan'
    || matched === 'china'
    || matched === 'india'
    || matched === 'vietnam'
    || matched === 'thailand'
    || matched === 'indonesia'
    || matched === 'spain'
  ) {
    return matched;
  }
  return null;
};

const findTraditionalSampleImage = (country: TraditionalOutfitCountry): string =>
  clothSampleOptions.find((sample) =>
    (sample.category === 'female' || sample.category === 'male')
    && extractTraditionalCountryFromImage(sample.image) === country,
  )?.image ?? '';

const traditionalGuideCopy = {
  ko: {
    korea: {
      countryLabel: '한국',
      outfitName: '한복 (Hanbok)',
      summary: '저고리와 치마 또는 바지의 균형, 곡선적인 선, 단정한 의례미가 특징인 한국 전통 의상입니다.',
      overview: ['한복은 상의와 하의가 분리된 구조 안에서 여유로운 볼륨과 부드러운 선을 만드는 한국 전통 복식입니다. 색의 대비, 고름의 위치, 치맛폭의 흐름이 전체 분위기를 결정합니다.'],
      history: ['삼국시대부터 이어진 복식 전통을 바탕으로 발전했고, 조선시대에 오늘날 익숙한 실루엣이 정리되었습니다. 시대에 따라 길이, 색 조합, 장식 방식이 달라졌지만 단정한 균형감은 꾸준히 유지되었습니다.'],
      culture: ['명절, 혼례, 돌잔치, 궁중 행사 재현, 전통문화 체험처럼 예의를 갖추는 장면에서 널리 사용됩니다. 한복은 단순한 의복이 아니라 상황과 관계를 드러내는 상징적 복식으로 읽히기도 합니다.'],
      design: ['짧은 저고리와 풍성한 치마, 바지와 포의 조합, 고름과 소매선이 중요한 요소입니다. 직선보다 완만한 곡선이 강조되고, 움직임에 따라 실루엣이 유연하게 달라지는 점이 특징입니다.'],
      modernUse: ['생활 한복, 웨딩 촬영, 관광 체험, 브랜드 화보 등으로 넓게 재해석되고 있습니다. 전통 요소를 유지하면서도 색감과 소재, 길이를 현대적으로 바꾸는 사례가 많습니다.'],
      fittingTips: ['허리선과 치맛폭이 자연스럽게 보이는 정면 또는 살짝 사선 이미지를 고르면 좋습니다. 포즈는 과하게 크지 않고 단정하게 손을 모으거나 옆선을 살리는 방식이 한복 분위기와 잘 맞습니다.'],
    },
    japan: {
      countryLabel: '일본',
      outfitName: '기모노 (Kimono)',
      summary: '직선적인 재단, 겹침 구조, 띠 매듭과 계절감 있는 문양이 인상적인 일본 전통 의상입니다.',
      overview: ['기모노는 몸을 감싸는 직선형 패턴과 넓은 소매, 오비 매듭을 중심으로 완성되는 일본 전통 복식입니다. 차분하고 정돈된 인상이 강하며, 레이어의 균형이 전체 완성도를 좌우합니다.'],
      history: ['헤이안 시대 이후 복식 문화가 누적되며 발전했고, 에도 시대를 거치며 오늘날 대중적으로 알려진 기모노 형식이 정착되었습니다.'],
      culture: ['성년식, 졸업식, 결혼식, 다도 행사, 축제 등 격식과 계절감이 중요한 장면에서 착용됩니다.'],
      design: ['직선적인 옷자락, 겹쳐 여미는 구조, 넓은 소매, 오비와 오비 장식, 계절을 반영한 문양이 핵심 요소입니다.'],
      modernUse: ['전통 행사는 물론 촬영, 관광 체험, 무대 의상, 현대식 리폼 기모노 스타일로도 활용됩니다.'],
      fittingTips: ['몸을 세우고 어깨선을 안정적으로 유지하는 포즈가 잘 어울립니다. 배경은 다다미방, 목재 실내, 정원처럼 차분한 공간이 기모노의 질서를 살리기 좋습니다.'],
    },
    china: {
      countryLabel: '중국',
      outfitName: '치파오 (Qipao)',
      summary: '세로로 떨어지는 라인, 높은 칼라, 슬림한 윤곽과 절제된 격식미가 돋보이는 중국 의상입니다.',
      overview: ['치파오는 몸의 세로선을 따라 실루엣을 정리하는 의상으로, 목선과 어깨선, 옆트임의 길이가 전체 분위기를 크게 바꿉니다. 단정하면서도 우아한 인상이 강합니다.'],
      history: ['청대 만주계 복식과 근대 상하이 패션의 영향이 결합되며 현대적으로 알려진 치파오 스타일이 자리 잡았습니다.'],
      culture: ['공연, 전통문화 행사, 포멀한 촬영, 연회 스타일링 등 여성스러운 격식을 드러내고 싶은 장면에서 자주 사용됩니다.'],
      design: ['스탠드 칼라, 세로로 곧게 떨어지는 라인, 몸에 맞춘 핏, 자수나 패턴 배치가 중심 요소입니다.'],
      modernUse: ['행사복, 화보, 테마 촬영, 현대식 드레스와 결합된 퓨전 스타일로 확장되고 있습니다.'],
      fittingTips: ['몸의 축을 곧게 세운 포즈와 가벼운 시선 처리만으로도 분위기가 살아납니다. 배경은 고급 실내, 클래식 라운지, 차분한 동양식 장식 공간이 잘 어울립니다.'],
    },
    india: {
      countryLabel: '인도',
      outfitName: '사리 (Saree)',
      summary: '드레이프 방식, 직물의 흐름, 장식 보더와 색채 표현이 핵심인 인도 대표 전통 의상입니다.',
      overview: ['사리는 긴 직물을 몸에 감아 연출하는 방식 자체가 스타일을 결정하는 의상입니다. 같은 원단이라도 주름 배치와 팔라의 흐름에 따라 전혀 다른 인상을 만듭니다.'],
      history: ['고대부터 이어진 남아시아 복식 전통 안에서 지역별 직조 문화와 드레이프 방식이 다양하게 발전했습니다.'],
      culture: ['결혼식, 종교 행사, 축제, 가족 모임 등 화려함과 상징성이 중요한 자리에서 널리 착용됩니다.'],
      design: ['직물의 광택, 보더 장식, 팔라의 흐름, 블라우스와의 조합, 주름의 정돈 상태가 주요 포인트입니다.'],
      modernUse: ['전통 행사뿐 아니라 레드카펫, 패션 화보, 현대식 블라우스와 결합한 리스타일링에도 자주 활용됩니다.'],
      fittingTips: ['한 손으로 팔라를 정리하거나 천의 흐름을 자연스럽게 보여주는 포즈가 잘 맞습니다. 배경은 따뜻한 조명, 궁정풍 실내, 섬세한 아치 장식 공간이 자연스럽습니다.'],
    },
    vietnam: {
      countryLabel: '베트남',
      outfitName: '아오자이 (Ao dai)',
      summary: '길고 슬림한 튜닉과 바지의 조합으로 세련된 세로선과 우아한 움직임을 보여주는 베트남 의상입니다.',
      overview: ['아오자이는 몸을 따라 곧게 떨어지는 상의와 바지의 결합으로 정제된 인상을 주는 의상입니다. 움직일 때 옆선이 길게 흐르며 가볍고 우아한 분위기를 만듭니다.'],
      history: ['베트남 궁정 복식과 근대 복식 변화 속에서 현재의 슬림한 튜닉 구조로 정착되었습니다.'],
      culture: ['학교 행사, 결혼식, 축제, 공식 행사, 전통문화 촬영에서 널리 사용되는 상징적인 복식입니다.'],
      design: ['긴 상의, 높은 칼라, 몸을 따라 흐르는 절개선, 얇게 이어지는 옆선과 바지 실루엣이 중요합니다.'],
      modernUse: ['관광, 웨딩, 브랜드 캠페인, 도시형 전통 룩 등으로 넓게 활용되며 색감과 프린트가 현대적으로 변주됩니다.'],
      fittingTips: ['몸을 길게 보이게 하는 정면 혹은 반측면 포즈가 좋습니다. 배경은 햇빛이 드는 복도, 정원, 고요한 거리처럼 밝고 가벼운 분위기가 잘 맞습니다.'],
    },
    thailand: {
      countryLabel: '태국',
      outfitName: '추트 타이 (Chut Thai)',
      summary: '비단의 광택, 사선 또는 어깨 장식, 의례적인 우아함이 특징인 태국 전통 정장 계열 복식입니다.',
      overview: ['추트 타이는 태국의 공식적이고 의례적인 전통 복식군을 가리키는 이름으로, 여성복 기준 어깨 장식과 랩 스커트, 비단 소재의 흐름이 자주 강조됩니다.'],
      history: ['궁정 및 국가 의례에 쓰인 복식이 현대 국가 의상 체계로 정리되며 여러 형식의 추트 타이로 정착되었습니다.'],
      culture: ['국가 행사, 전통 공연, 결혼식, 문화 축제처럼 격식과 상징성이 중요한 장면에서 착용됩니다.'],
      design: ['사브라이 형태의 어깨 걸침, 금실 장식, 랩 스커트 구조, 비단의 결이 전체 인상을 만듭니다.'],
      modernUse: ['관광 화보, 문화 홍보, 웨딩 촬영, 국가 행사 재현 등에서 자주 사용되며 현대식 색채로도 해석됩니다.'],
      fittingTips: ['상체를 곧게 세우고 손의 위치를 정갈하게 정리한 포즈가 잘 어울립니다. 배경은 태국 전통 건축, 사원 외곽, 격식 있는 실내 공간이 자연스럽습니다.'],
    },
    indonesia: {
      countryLabel: '인도네시아',
      outfitName: '케바야 (Kebaya)',
      summary: '몸에 맞는 상의와 바틱 또는 사롱 계열 하의의 조합, 섬세한 장식과 단정한 여성미가 돋보이는 의상입니다.',
      overview: ['케바야는 몸선을 따라 정리되는 상의와 랩 스커트 또는 바틱 하의의 조합으로 구성되는 인도네시아 대표 전통 복식입니다. 섬세하고 정돈된 인상이 특징입니다.'],
      history: ['자바를 포함한 여러 지역의 복식 전통과 교류 속에서 발전했고, 지역마다 소재와 장식 스타일이 다르게 전승되었습니다.'],
      culture: ['공식 행사, 결혼식, 국가 기념 행사, 전통 무용과 의례 장면에서 널리 착용됩니다.'],
      design: ['레이스나 자수 상의, 몸에 맞춘 실루엣, 바틱 패턴, 랩 형태의 하의가 핵심 구성입니다.'],
      modernUse: ['현대 웨딩, 패션 행사, 문화 홍보 이미지, 포멀한 전통 룩으로 계속 활용됩니다.'],
      fittingTips: ['허리를 과하게 꺾지 않고 단정하게 서 있는 포즈가 좋습니다. 배경은 목재 가구가 있는 실내, 전통 문양이 있는 벽면, 따뜻한 정원이 잘 어울립니다.'],
    },
    spain: {
      countryLabel: '스페인',
      outfitName: '트라헤 데 플라멩카 (Traje de flamenca)',
      summary: '몸선을 따라 내려오다 러플로 확장되는 실루엣과 강한 리듬감이 특징인 스페인 안달루시아 계열 의상입니다.',
      overview: ['트라헤 데 플라멩카는 몸에 맞는 상체와 러플이 이어지는 스커트 구조로 강한 움직임과 존재감을 만드는 의상입니다. 흔히 플라멩코 드레스로도 불립니다.'],
      history: ['안달루시아 지역의 페리아와 플라멩코 문화 속에서 발전하며 오늘날 대표적인 스페인 문화 의상으로 자리 잡았습니다.'],
      culture: ['축제, 공연, 전통 춤, 화려한 지역 행사에서 자주 사용되며 강한 리듬감과 표현성이 강조됩니다.'],
      design: ['몸에 붙는 상체, 러플 장식, 도트 무늬, 강한 색 대비, 큰 움직임을 살리는 치맛단이 핵심입니다.'],
      modernUse: ['공연 의상, 축제 화보, 문화 이벤트, 강렬한 테마 촬영에 꾸준히 활용됩니다.'],
      fittingTips: ['허리와 어깨선을 살리고 손동작에 리듬을 주는 포즈가 어울립니다. 배경은 따뜻한 광장의 벽면, 무대 조명, 스페인풍 테라스처럼 생동감 있는 공간이 좋습니다.'],
    },
  },
  en: {
    korea: {
      countryLabel: 'Korea',
      outfitName: 'Hanbok',
      summary: 'Korea’s traditional dress is known for its curved lines, layered balance, and graceful ceremonial tone.',
      overview: ['Hanbok combines separate upper and lower garments into a silhouette that feels soft, balanced, and elegant. The bow placement, skirt volume, and color contrast shape the overall impression.'],
      history: ['It developed through long Korean clothing traditions and reached the silhouette most people recognize today during the Joseon period.'],
      culture: ['Hanbok is commonly worn for holidays, weddings, first-birthday celebrations, cultural experiences, and other occasions where formality matters.'],
      design: ['The short jacket, full skirt or trousers, curved sleeves, and ribbon details are central to the look. Movement is an important part of the visual effect.'],
      modernUse: ['It is now widely reinterpreted for lifestyle wear, wedding photography, tourism, and modern editorial styling.'],
      fittingTips: ['Choose a pose that keeps the torso poised and lets the ribbon or skirt volume read clearly. A calm ceremonial posture usually works best.'],
    },
    japan: {
      countryLabel: 'Japan',
      outfitName: 'Kimono',
      summary: 'Kimono stands out for its wrap construction, straight patterning, seasonal motifs, and composed layering.',
      overview: ['Kimono is built around straight-cut panels, wrapped front layers, and a defined obi. The result feels measured, balanced, and highly structured.'],
      history: ['Japanese dress traditions evolved over centuries, and the kimono form familiar today became broadly established through later historical refinement.'],
      culture: ['It appears in coming-of-age ceremonies, graduations, weddings, tea events, festivals, and formal cultural settings.'],
      design: ['Straight lines, overlapping fronts, wide sleeves, and obi styling are core visual features. Motifs often reinforce season or occasion.'],
      modernUse: ['Kimono is still used in formal events, tourism experiences, stage styling, and modern reinterpretations.'],
      fittingTips: ['A steady upright pose with restrained hand placement suits kimono well. Quiet interiors or traditional garden-like settings complement the mood.'],
    },
    china: {
      countryLabel: 'China',
      outfitName: 'Qipao',
      summary: 'Qipao is recognized for its vertical line, stand collar, slim silhouette, and controlled elegance.',
      overview: ['Qipao emphasizes the vertical flow of the body through a clean silhouette. Collar shape, shoulder line, and side slit proportions change the tone significantly.'],
      history: ['Its modern form became widely recognized through the interaction of Qing-era influences and twentieth-century urban fashion culture.'],
      culture: ['It is often used for formal gatherings, stage presentations, portrait sessions, and refined cultural styling.'],
      design: ['A stand collar, close-fitting line, smooth contour, and carefully placed pattern or embroidery define the look.'],
      modernUse: ['Modern qipao-inspired dresses remain common in events, fashion editorials, and formal styling.'],
      fittingTips: ['An upright pose with understated gesture works well. Refined lounge-like interiors or elegant East Asian-inspired spaces support the mood.'],
    },
    india: {
      countryLabel: 'India',
      outfitName: 'Saree',
      summary: 'The saree depends on drape, textile flow, border detail, and rich color expression.',
      overview: ['A saree is defined by how fabric is wrapped and arranged, so drape and movement are central to the final impression.'],
      history: ['It draws from long South Asian dress traditions with many regional textile and draping variations.'],
      culture: ['It is widely worn for weddings, festivals, religious events, and highly symbolic family occasions.'],
      design: ['Shine, border decoration, pleat control, and the flow of the pallu are some of the most visible style elements.'],
      modernUse: ['Sarees remain important in traditional events, red carpet styling, and contemporary editorial reinterpretations.'],
      fittingTips: ['A pose that lets the drape fall naturally is most effective. Warm ceremonial interiors or ornate architectural backgrounds fit the garment well.'],
    },
    vietnam: {
      countryLabel: 'Vietnam',
      outfitName: 'Ao dai',
      summary: 'Ao dai combines a long fitted tunic with trousers to create a refined, elongated silhouette.',
      overview: ['Ao dai is known for its slim vertical line, high collar, and flowing side panels that create elegant movement.'],
      history: ['It developed through Vietnamese court and modern dress history into the iconic silhouette recognized today.'],
      culture: ['It is used for school ceremonies, weddings, festivals, formal occasions, and cultural portraiture.'],
      design: ['Long fitted panels, a high collar, and a clean line over trousers are core to the style.'],
      modernUse: ['Ao dai remains common in wedding photography, tourism, brand campaigns, and modern cultural styling.'],
      fittingTips: ['A tall, composed pose works best. Bright corridors, gardens, or calm streets pair naturally with the garment.'],
    },
    thailand: {
      countryLabel: 'Thailand',
      outfitName: 'Chut Thai',
      summary: 'Chut Thai refers to Thai national formal dress known for silk texture, ceremonial grace, and draped shoulder styling.',
      overview: ['Chut Thai is a family of formal Thai traditional outfits, often defined by silk fabric, draped shoulder details, and elegant wrap construction.'],
      history: ['Court and ceremonial styles were later formalized into modern Thai national dress systems with multiple recognized forms.'],
      culture: ['It appears in official ceremonies, weddings, cultural festivals, and formal heritage presentations.'],
      design: ['Shoulder drapes, wrap skirts, gold accents, and silk sheen strongly influence the visual character.'],
      modernUse: ['It is often used in tourism campaigns, ceremonial photography, weddings, and cultural promotion.'],
      fittingTips: ['A poised upright pose with tidy hand placement suits the garment. Traditional architecture or refined ceremonial interiors work well as backgrounds.'],
    },
    indonesia: {
      countryLabel: 'Indonesia',
      outfitName: 'Kebaya',
      summary: 'Kebaya is known for its fitted blouse, delicate surface detail, and batik or wrapped lower garment pairing.',
      overview: ['Kebaya creates a refined formal look through a shaped upper garment paired with patterned wrapped lower pieces.'],
      history: ['It developed across Indonesian regional traditions, especially in Java, with local differences in fabric and detailing.'],
      culture: ['It is worn for official events, weddings, heritage ceremonies, and formal cultural occasions.'],
      design: ['Lace or embroidered tops, a fitted line, and batik-patterned lower pieces are key visual markers.'],
      modernUse: ['Kebaya continues to appear in weddings, state occasions, cultural campaigns, and editorial styling.'],
      fittingTips: ['Keep the posture graceful and restrained. Warm interiors, carved wood details, or traditional garden settings reinforce the mood.'],
    },
    spain: {
      countryLabel: 'Spain',
      outfitName: 'Traje de flamenca',
      summary: 'This Andalusian dress is known for a fitted upper body, dramatic ruffles, and strong rhythmic presence.',
      overview: ['Traje de flamenca, often called a flamenco dress, uses a close upper silhouette and cascading ruffles to create movement and visual drama.'],
      history: ['It grew from Andalusian fair and flamenco culture into one of Spain’s most recognizable cultural dress forms.'],
      culture: ['It is closely associated with fairs, dance, performance, festivals, and vivid cultural portraiture.'],
      design: ['Fitted bodice lines, ruffles, polka dots, and dynamic hems are the defining features.'],
      modernUse: ['It remains popular in performances, festive editorials, tourism imagery, and themed event styling.'],
      fittingTips: ['A confident pose with expressive arms works well. Warm plazas, stage-like lighting, or lively Spanish-inspired settings support the look.'],
    },
  },
} as const;

const traditionalPromptHints: Record<TraditionalOutfitCountry, OutfitPromptHints> = {
  korea: {
    outfitName: 'Hanbok',
    mood: 'graceful ceremonial Korean hanbok styling',
    pose: 'use a poised but more dramatic ceremonial pose with a longer body line, clearer sleeve spread, and elegant hand placement that shows the flowing hanbok silhouette',
    background: 'an elegant Korean palace courtyard or refined traditional interior with subtle cultural detail',
  },
  japan: {
    outfitName: 'Kimono',
    mood: 'calm and refined Japanese kimono styling',
    pose: 'use a composed but visually striking upright pose with a deliberate turn of the shoulders, clearer sleeve presentation, and controlled hand gesture',
    background: 'a quiet traditional Japanese room, garden path, or wood-and-paper interior',
  },
  china: {
    outfitName: 'Qipao',
    mood: 'elegant and polished qipao styling',
    pose: 'use a bold confident fashion pose with a sharper hip line, longer neck posture, and graceful arm placement that emphasizes the vertical silhouette',
    background: 'a refined lounge, classic East Asian interior, or elegant heritage-inspired setting',
  },
  india: {
    outfitName: 'Saree',
    mood: 'rich ceremonial saree styling with flowing textile movement',
    pose: 'use a more expressive graceful pose with stronger torso turn and flowing arm placement so the drape and pallu move naturally and read clearly',
    background: 'a warm festive architectural backdrop with refined ornamental detail',
  },
  vietnam: {
    outfitName: 'Ao dai',
    mood: 'clean and elegant ao dai styling',
    pose: 'use a tall elegant pose with a slightly longer stride, clear side-angle presentation, and confident posture that highlights the long vertical line and side panels',
    background: 'a bright corridor, garden walkway, or calm outdoor setting with soft natural light',
  },
  thailand: {
    outfitName: 'Chut Thai',
    mood: 'formal Thai ceremonial styling with silk elegance',
    pose: 'use an upright dignified ceremonial pose with stronger arm framing, lifted posture, and neatly arranged hands that feel more formal and expressive',
    background: 'a refined Thai traditional building, ceremonial hall, or temple-adjacent exterior',
  },
  indonesia: {
    outfitName: 'Kebaya',
    mood: 'refined and graceful kebaya styling',
    pose: 'use a refined formal pose with a more pronounced waistline angle, elegant shoulder turn, and graceful hand position that keeps the fitted blouse clear',
    background: 'a warm traditional interior, carved wood setting, or serene tropical heritage garden',
  },
  spain: {
    outfitName: 'Traje de flamenca',
    mood: 'bold rhythmic flamenco styling with confident presence',
    pose: 'use a bold high-energy flamenco pose with stronger arm extension, confident stance, and visible movement attitude without distorting the garment',
    background: 'a lively Spanish courtyard, warm stage-like setting, or textured plaza backdrop',
  },
};

const keywordCountryMap: Array<{ country: TraditionalOutfitCountry; keywords: string[] }> = [
  { country: 'korea', keywords: ['korea-trad', 'hanbok', '한복', 'korea'] },
  { country: 'japan', keywords: ['japan-trad', 'kimono', '기모노', 'japan'] },
  { country: 'china', keywords: ['china-trad', 'qipao', 'cheongsam', '치파오', 'china'] },
  { country: 'india', keywords: ['india-trad', 'saree', 'sari', '사리', 'india'] },
  { country: 'vietnam', keywords: ['vietnam-trad', 'ao dai', 'aodai', '아오자이', 'vietnam'] },
  { country: 'thailand', keywords: ['thailand-trad', 'chut thai', '추트 타이', '태국 전통의상', 'thailand'] },
  { country: 'indonesia', keywords: ['indonesia-trad', 'kebaya', '케바야', 'indonesia'] },
  { country: 'spain', keywords: ['spain-trad', 'traje de flamenca', 'flamenco', '플라멩코', 'spain'] },
];

const detectTraditionalCountryFromText = (value: string | null | undefined): TraditionalOutfitCountry | null => {
  const normalized = value?.toLowerCase().trim();
  if (!normalized) {
    return null;
  }
  const matched = keywordCountryMap.find(({ keywords }) => keywords.some((keyword) => normalized.includes(keyword)));
  return matched?.country ?? null;
};

export const getTraditionalOutfitGuides = (lang: string): TraditionalOutfitGuide[] => {
  const locale = lang === 'ko' ? 'ko' : 'en';

  return TRADITIONAL_COUNTRY_ORDER.map((country) => {
    const copy = traditionalGuideCopy[locale][country];
    return {
      id: country,
      country,
      countryLabel: copy.countryLabel,
      outfitName: copy.outfitName,
      summary: copy.summary,
      image: findTraditionalSampleImage(country),
      overview: copy.overview,
      history: copy.history,
      culture: copy.culture,
      design: copy.design,
      modernUse: copy.modernUse,
      fittingTips: copy.fittingTips,
    };
  }).filter((guide) => Boolean(guide.image));
};

export const getOutfitPromptHints = (options: {
  garmentLabel?: string | null;
  garmentImageUrl?: string | null;
}): OutfitPromptHints | null => {
  const byImage = options.garmentImageUrl ? extractTraditionalCountryFromImage(options.garmentImageUrl) : null;
  const byLabel = detectTraditionalCountryFromText(options.garmentLabel);
  const country = byImage ?? byLabel;
  return country ? traditionalPromptHints[country] : null;
};
