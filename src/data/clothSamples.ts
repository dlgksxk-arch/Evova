export type ClothSampleCategory = 'female' | 'male' | 'animal' | 'future' | 'classic' | 'fashin';

export interface ClothSampleOption {
  id: string;
  label: string;
  image: string;
  category: ClothSampleCategory;
  country: string;
  countryLabelKo: string;
  countryLabelEn: string;
}

const SAMPLE_ASSET_ORIGIN = 'https://hamdeva.web.app';

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
    image: `${SAMPLE_ASSET_ORIGIN}/sample/cloth/${category}/${seed.file}`,
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

const animalSamples = createSamples('animal', [
  { id: 'dog-costume-1', label: '강아지 의상 1', file: 'dog_costume_1_retriever.png', country: 'dog', countryLabelKo: '강아지', countryLabelEn: 'Dog' },
  { id: 'dog-costume-2', label: '강아지 의상 2', file: 'dog_costume_4_shiba.png', country: 'dog', countryLabelKo: '강아지', countryLabelEn: 'Dog' },
  { id: 'dog-isolated-1', label: '강아지 의상 3', file: 'isolated_dog_1_retriever.png', country: 'dog', countryLabelKo: '강아지', countryLabelEn: 'Dog' },
  { id: 'dog-isolated-2', label: '강아지 의상 4', file: 'isolated_dog_4_dalmatian.png', country: 'dog', countryLabelKo: '강아지', countryLabelEn: 'Dog' },
  { id: 'dog-isolated-3', label: '강아지 의상 5', file: 'isolated_dog_5_pug.png', country: 'dog', countryLabelKo: '강아지', countryLabelEn: 'Dog' },
  { id: 'cat-costume-1', label: '고양이 의상 1', file: 'cat_costume_4_tabby.png', country: 'cat', countryLabelKo: '고양이', countryLabelEn: 'Cat' },
  { id: 'cat-isolated-1', label: '고양이 의상 2', file: 'isolated_cat_1_fluffy.png', country: 'cat', countryLabelKo: '고양이', countryLabelEn: 'Cat' },
  { id: 'cat-isolated-2', label: '고양이 의상 3', file: 'isolated_cat_2_orange.png', country: 'cat', countryLabelKo: '고양이', countryLabelEn: 'Cat' },
  { id: 'cat-isolated-3', label: '고양이 의상 4', file: 'isolated_cat_4_calico.png', country: 'cat', countryLabelKo: '고양이', countryLabelEn: 'Cat' },
  { id: 'cat-isolated-4', label: '고양이 의상 5', file: 'isolated_cat_5_pink.png', country: 'cat', countryLabelKo: '고양이', countryLabelEn: 'Cat' },
]);

const futureSamples = createSamples('future', [
  { id: 'future-cybersuit-0', label: '미래 의상 1', file: '2026-03-13-14-07-37-cybersuit.png', country: 'cybersuit', countryLabelKo: '미래', countryLabelEn: 'Future' },
  { id: 'future-cybersuit-1', label: '미래 의상 2', file: '2026-03-13-14-08-22-cybersuit.png', country: 'cybersuit', countryLabelKo: '미래', countryLabelEn: 'Future' },
]);

const classicSamples = createSamples('classic', [
  { id: 'classic-uk70s-0', label: '클래식 70년대 1', file: '2026-03-13-14-09-05-uk70s.png', country: 'uk70s', countryLabelKo: '영국 70년대', countryLabelEn: 'UK 70s' },
  { id: 'classic-uk70s-1', label: '클래식 70년대 2', file: '2026-03-13-14-09-48-uk70s.png', country: 'uk70s', countryLabelKo: '영국 70년대', countryLabelEn: 'UK 70s' },
  { id: 'classic-uk80s-0', label: '클래식 80년대 1', file: '2026-03-13-14-10-26-uk80s.png', country: 'uk80s', countryLabelKo: '영국 80년대', countryLabelEn: 'UK 80s' },
  { id: 'classic-uk80s-1', label: '클래식 80년대 2', file: '2026-03-13-14-11-17-uk80s.png', country: 'uk80s', countryLabelKo: '영국 80년대', countryLabelEn: 'UK 80s' },
]);

const fashinSamples = createSamples('fashin', [
  { id: 'fashin-korea-idol', label: '코리아 아이돌 룩 1', file: '2026-03-13-15-53-03-korea-idol.png', country: 'korea', countryLabelKo: '한국 아이돌', countryLabelEn: 'Korea Idol' },
  { id: 'fashin-usa-idol', label: '미국 아이돌 룩 1', file: '2026-03-13-15-53-23-usa-idol.png', country: 'usa', countryLabelKo: '미국 아이돌', countryLabelEn: 'USA Idol' },
  { id: 'fashin-japan-idol', label: '일본 아이돌 룩 1', file: '2026-03-13-15-53-47-japan-idol.png', country: 'japan', countryLabelKo: '일본 아이돌', countryLabelEn: 'Japan Idol' },
  { id: 'fashin-china-idol', label: '중국 아이돌 룩 1', file: '2026-03-13-15-54-13-china-idol.png', country: 'china', countryLabelKo: '중국 아이돌', countryLabelEn: 'China Idol' },
  { id: 'fashin-taiwan-idol', label: '대만 아이돌 룩 1', file: '2026-03-13-15-54-36-taiwan-idol.png', country: 'taiwan', countryLabelKo: '대만 아이돌', countryLabelEn: 'Taiwan Idol' },
  { id: 'fashin-spain-idol', label: '스페인 아이돌 룩 1', file: '2026-03-13-15-55-10-spain-idol.png', country: 'spain', countryLabelKo: '스페인 아이돌', countryLabelEn: 'Spain Idol' },
  { id: 'fashin-france-idol', label: '프랑스 아이돌 룩 1', file: '2026-03-13-15-55-33-france-idol.png', country: 'france', countryLabelKo: '프랑스 아이돌', countryLabelEn: 'France Idol' },
  { id: 'fashin-germany-idol', label: '독일 아이돌 룩 1', file: '2026-03-13-15-55-58-germany-idol.png', country: 'germany', countryLabelKo: '독일 아이돌', countryLabelEn: 'Germany Idol' },
  { id: 'fashin-italy-idol', label: '이탈리아 아이돌 룩 1', file: '2026-03-13-15-56-32-italy-idol.png', country: 'italy', countryLabelKo: '이탈리아 아이돌', countryLabelEn: 'Italy Idol' },
  { id: 'fashin-portugal-idol', label: '포르투갈 아이돌 룩 1', file: '2026-03-13-15-56-51-portugal-idol.png', country: 'portugal', countryLabelKo: '포르투갈 아이돌', countryLabelEn: 'Portugal Idol' },
  { id: 'fashin-russia-idol', label: '러시아 아이돌 룩 1', file: '2026-03-13-15-57-13-russia-idol.png', country: 'russia', countryLabelKo: '러시아 아이돌', countryLabelEn: 'Russia Idol' },
  { id: 'fashin-turkey-idol', label: '터키 아이돌 룩 1', file: '2026-03-13-15-57-49-turkey-idol.png', country: 'turkey', countryLabelKo: '터키 아이돌', countryLabelEn: 'Turkey Idol' },
  { id: 'fashin-arab-idol', label: '아랍 아이돌 룩 1', file: '2026-03-13-15-58-13-arab-idol.png', country: 'arab', countryLabelKo: '아랍 아이돌', countryLabelEn: 'Arab Idol' },
  { id: 'fashin-thailand-idol', label: '태국 아이돌 룩 1', file: '2026-03-13-15-58-32-thailand-idol.png', country: 'thailand', countryLabelKo: '태국 아이돌', countryLabelEn: 'Thailand Idol' },
  { id: 'fashin-vietnam-idol', label: '베트남 아이돌 룩 1', file: '2026-03-13-15-58-53-vietnam-idol.png', country: 'vietnam', countryLabelKo: '베트남 아이돌', countryLabelEn: 'Vietnam Idol' },
  { id: 'fashin-indonesia-idol', label: '인도네시아 아이돌 룩 1', file: '2026-03-13-15-59-15-indonesia-idol.png', country: 'indonesia', countryLabelKo: '인도네시아 아이돌', countryLabelEn: 'Indonesia Idol' },
  { id: 'fashin-india-idol', label: '인도 아이돌 룩 1', file: '2026-03-13-15-59-41-india-idol.png', country: 'india', countryLabelKo: '인도 아이돌', countryLabelEn: 'India Idol' },
  { id: 'fashin-netherlands-idol', label: '네덜란드 아이돌 룩 1', file: '2026-03-13-16-00-04-netherlands-idol.png', country: 'netherlands', countryLabelKo: '네덜란드 아이돌', countryLabelEn: 'Netherlands Idol' },
  { id: 'fashin-poland-idol', label: '폴란드 아이돌 룩 1', file: '2026-03-13-16-00-54-poland-idol.png', country: 'poland', countryLabelKo: '폴란드 아이돌', countryLabelEn: 'Poland Idol' },
  { id: 'fashin-sweden-idol', label: '스웨덴 아이돌 룩 1', file: '2026-03-13-16-01-15-sweden-idol.png', country: 'sweden', countryLabelKo: '스웨덴 아이돌', countryLabelEn: 'Sweden Idol' },
]);

export const clothSampleOptions: ClothSampleOption[] = [
  ...femaleSamples,
  ...maleSamples,
  ...animalSamples,
  ...futureSamples,
  ...classicSamples,
  ...fashinSamples,
];
