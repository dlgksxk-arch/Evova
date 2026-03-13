export type ClothSampleCategory = 'female' | 'male' | 'animal' | 'future' | 'classic';

export interface ClothSampleOption {
  id: string;
  label: string;
  image: string;
  category: ClothSampleCategory;
  country: string;
  countryLabelKo: string;
  countryLabelEn: string;
}

export const clothSampleOptions: ClothSampleOption[] = [
  { id: 'korea-trad-0', label: '한복 1', image: '/sample/cloth/female/2026-03-13-12-47-58-korea-trad-0.png', category: 'female', country: 'korea', countryLabelKo: '한국', countryLabelEn: 'Korea' },
  { id: 'korea-trad-1', label: '한복 2', image: '/sample/cloth/female/2026-03-13-12-48-44-korea-trad-1.png', category: 'female', country: 'korea', countryLabelKo: '한국', countryLabelEn: 'Korea' },
  { id: 'korea-trad-2', label: '한복 3', image: '/sample/cloth/female/2026-03-13-12-49-30-korea-trad-2.png', category: 'female', country: 'korea', countryLabelKo: '한국', countryLabelEn: 'Korea' },
  { id: 'korea-trad-3', label: '한복 4', image: '/sample/cloth/female/2026-03-13-12-50-14-korea-trad-3.png', category: 'female', country: 'korea', countryLabelKo: '한국', countryLabelEn: 'Korea' },
  { id: 'korea-trad-4', label: '한복 5', image: '/sample/cloth/female/2026-03-13-12-50-58-korea-trad-4.png', category: 'female', country: 'korea', countryLabelKo: '한국', countryLabelEn: 'Korea' },
  { id: 'japan-trad-0', label: '기모노 1', image: '/sample/cloth/female/2026-03-13-12-51-42-japan-trad-0.png', category: 'female', country: 'japan', countryLabelKo: '일본', countryLabelEn: 'Japan' },
  { id: 'japan-trad-1', label: '기모노 2', image: '/sample/cloth/female/2026-03-13-12-52-36-japan-trad-1.png', category: 'female', country: 'japan', countryLabelKo: '일본', countryLabelEn: 'Japan' },
  { id: 'japan-trad-2', label: '기모노 3', image: '/sample/cloth/female/2026-03-13-12-53-20-japan-trad-2.png', category: 'female', country: 'japan', countryLabelKo: '일본', countryLabelEn: 'Japan' },
  { id: 'japan-trad-3', label: '기모노 4', image: '/sample/cloth/female/2026-03-13-12-54-04-japan-trad-3.png', category: 'female', country: 'japan', countryLabelKo: '일본', countryLabelEn: 'Japan' },
  { id: 'japan-trad-4', label: '기모노 5', image: '/sample/cloth/female/2026-03-13-12-54-49-japan-trad-4.png', category: 'female', country: 'japan', countryLabelKo: '일본', countryLabelEn: 'Japan' },
  { id: 'china-trad-0', label: '치파오 1', image: '/sample/cloth/female/2026-03-13-12-55-32-china-trad-0.png', category: 'female', country: 'china', countryLabelKo: '중국', countryLabelEn: 'China' },
  { id: 'china-trad-1', label: '치파오 2', image: '/sample/cloth/female/2026-03-13-12-56-18-china-trad-1.png', category: 'female', country: 'china', countryLabelKo: '중국', countryLabelEn: 'China' },
  { id: 'china-trad-2', label: '치파오 3', image: '/sample/cloth/female/2026-03-13-12-57-02-china-trad-2.png', category: 'female', country: 'china', countryLabelKo: '중국', countryLabelEn: 'China' },
  { id: 'china-trad-extra-0', label: '치파오 4', image: '/sample/cloth/female/2026-03-13-13-30-16-china-trad-extra.png', category: 'female', country: 'china', countryLabelKo: '중국', countryLabelEn: 'China' },
  { id: 'china-trad-extra-1', label: '치파오 5', image: '/sample/cloth/female/2026-03-13-13-31-02-china-trad-extra.png', category: 'female', country: 'china', countryLabelKo: '중국', countryLabelEn: 'China' },
  { id: 'thailand-trad-0', label: '태국 전통의상 1', image: '/sample/cloth/female/2026-03-13-13-09-45-thailand-trad-0.png', category: 'female', country: 'thailand', countryLabelKo: '태국', countryLabelEn: 'Thailand' },
  { id: 'thailand-trad-1', label: '태국 전통의상 2', image: '/sample/cloth/female/2026-03-13-13-10-30-thailand-trad-1.png', category: 'female', country: 'thailand', countryLabelKo: '태국', countryLabelEn: 'Thailand' },
  { id: 'thailand-trad-2', label: '태국 전통의상 3', image: '/sample/cloth/female/2026-03-13-13-11-14-thailand-trad-2.png', category: 'female', country: 'thailand', countryLabelKo: '태국', countryLabelEn: 'Thailand' },
  { id: 'thailand-trad-extra-0', label: '태국 전통의상 4', image: '/sample/cloth/female/2026-03-13-13-20-04-thailand-trad-extra.png', category: 'female', country: 'thailand', countryLabelKo: '태국', countryLabelEn: 'Thailand' },
  { id: 'thailand-trad-extra-1', label: '태국 전통의상 5', image: '/sample/cloth/female/2026-03-13-13-20-47-thailand-trad-extra.png', category: 'female', country: 'thailand', countryLabelKo: '태국', countryLabelEn: 'Thailand' },
  { id: 'vietnam-trad-0', label: '아오자이 1', image: '/sample/cloth/female/2026-03-13-13-11-56-vietnam-trad-0.png', category: 'female', country: 'vietnam', countryLabelKo: '베트남', countryLabelEn: 'Vietnam' },
  { id: 'vietnam-trad-1', label: '아오자이 2', image: '/sample/cloth/female/2026-03-13-13-12-40-vietnam-trad-1.png', category: 'female', country: 'vietnam', countryLabelKo: '베트남', countryLabelEn: 'Vietnam' },
  { id: 'vietnam-trad-2', label: '아오자이 3', image: '/sample/cloth/female/2026-03-13-13-13-21-vietnam-trad-2.png', category: 'female', country: 'vietnam', countryLabelKo: '베트남', countryLabelEn: 'Vietnam' },
  { id: 'vietnam-trad-extra-0', label: '아오자이 4', image: '/sample/cloth/female/2026-03-13-13-21-31-vietnam-trad-extra.png', category: 'female', country: 'vietnam', countryLabelKo: '베트남', countryLabelEn: 'Vietnam' },
  { id: 'vietnam-trad-extra-1', label: '아오자이 5', image: '/sample/cloth/female/2026-03-13-13-22-15-vietnam-trad-extra.png', category: 'female', country: 'vietnam', countryLabelKo: '베트남', countryLabelEn: 'Vietnam' },
  { id: 'india-trad-0', label: '사리 1', image: '/sample/cloth/female/2026-03-13-13-14-07-india-trad-0.png', category: 'female', country: 'india', countryLabelKo: '인도', countryLabelEn: 'India' },
  { id: 'india-trad-1', label: '사리 2', image: '/sample/cloth/female/2026-03-13-13-14-53-india-trad-1.png', category: 'female', country: 'india', countryLabelKo: '인도', countryLabelEn: 'India' },
  { id: 'india-trad-2', label: '사리 3', image: '/sample/cloth/female/2026-03-13-13-15-38-india-trad-2.png', category: 'female', country: 'india', countryLabelKo: '인도', countryLabelEn: 'India' },
  { id: 'india-trad-extra-0', label: '사리 4', image: '/sample/cloth/female/2026-03-13-13-22-57-india-trad-extra.png', category: 'female', country: 'india', countryLabelKo: '인도', countryLabelEn: 'India' },
  { id: 'india-trad-extra-1', label: '사리 5', image: '/sample/cloth/female/2026-03-13-13-23-44-india-trad-extra.png', category: 'female', country: 'india', countryLabelKo: '인도', countryLabelEn: 'India' },
  { id: 'indonesia-trad-0', label: '인도네시아 전통의상 1', image: '/sample/cloth/female/2026-03-13-13-16-21-indonesia-trad-0.png', category: 'female', country: 'indonesia', countryLabelKo: '인도네시아', countryLabelEn: 'Indonesia' },
  { id: 'indonesia-trad-1', label: '인도네시아 전통의상 2', image: '/sample/cloth/female/2026-03-13-13-17-03-indonesia-trad-1.png', category: 'female', country: 'indonesia', countryLabelKo: '인도네시아', countryLabelEn: 'Indonesia' },
  { id: 'indonesia-trad-2', label: '인도네시아 전통의상 3', image: '/sample/cloth/female/2026-03-13-13-17-48-indonesia-trad-2.png', category: 'female', country: 'indonesia', countryLabelKo: '인도네시아', countryLabelEn: 'Indonesia' },
  { id: 'indonesia-trad-extra-0', label: '인도네시아 전통의상 4', image: '/sample/cloth/female/2026-03-13-13-24-28-indonesia-trad-extra.png', category: 'female', country: 'indonesia', countryLabelKo: '인도네시아', countryLabelEn: 'Indonesia' },
  { id: 'indonesia-trad-extra-1', label: '인도네시아 전통의상 5', image: '/sample/cloth/female/2026-03-13-13-25-18-indonesia-trad-extra.png', category: 'female', country: 'indonesia', countryLabelKo: '인도네시아', countryLabelEn: 'Indonesia' },
  { id: 'spain-trad-extra-0', label: '스페인 전통의상 1', image: '/sample/cloth/female/2026-03-13-13-26-02-spain-trad-extra.png', category: 'female', country: 'spain', countryLabelKo: '스페인', countryLabelEn: 'Spain' },
  { id: 'spain-trad-extra-1', label: '스페인 전통의상 2', image: '/sample/cloth/female/2026-03-13-13-26-46-spain-trad-extra.png', category: 'female', country: 'spain', countryLabelKo: '스페인', countryLabelEn: 'Spain' },
  { id: 'spain-trad-extra-2', label: '스페인 전통의상 3', image: '/sample/cloth/female/2026-03-13-13-27-29-spain-trad-extra.png', category: 'female', country: 'spain', countryLabelKo: '스페인', countryLabelEn: 'Spain' },
  { id: 'spain-trad-extra-3', label: '스페인 전통의상 4', image: '/sample/cloth/female/2026-03-13-13-28-14-spain-trad-extra.png', category: 'female', country: 'spain', countryLabelKo: '스페인', countryLabelEn: 'Spain' },
  { id: 'spain-trad-extra-4', label: '스페인 전통의상 5', image: '/sample/cloth/female/2026-03-13-13-28-57-spain-trad-extra.png', category: 'female', country: 'spain', countryLabelKo: '스페인', countryLabelEn: 'Spain' },

  { id: 'korea-men-trad-0', label: '남성 한복 1', image: '/sample/cloth/male/2026-03-13-13-38-29-korea-men-trad-0.png', category: 'male', country: 'korea', countryLabelKo: '한국', countryLabelEn: 'Korea' },
  { id: 'korea-men-trad-1', label: '남성 한복 2', image: '/sample/cloth/male/2026-03-13-13-39-10-korea-men-trad-1.png', category: 'male', country: 'korea', countryLabelKo: '한국', countryLabelEn: 'Korea' },
  { id: 'japan-men-trad-0', label: '남성 기모노 1', image: '/sample/cloth/male/2026-03-13-13-39-49-japan-men-trad-0.png', category: 'male', country: 'japan', countryLabelKo: '일본', countryLabelEn: 'Japan' },
  { id: 'japan-men-trad-1', label: '남성 기모노 2', image: '/sample/cloth/male/2026-03-13-13-40-31-japan-men-trad-1.png', category: 'male', country: 'japan', countryLabelKo: '일본', countryLabelEn: 'Japan' },
  { id: 'china-men-trad-0', label: '남성 중국 전통의상 1', image: '/sample/cloth/male/2026-03-13-13-41-13-china-men-trad-0.png', category: 'male', country: 'china', countryLabelKo: '중국', countryLabelEn: 'China' },
  { id: 'china-men-trad-1', label: '남성 중국 전통의상 2', image: '/sample/cloth/male/2026-03-13-13-41-56-china-men-trad-1.png', category: 'male', country: 'china', countryLabelKo: '중국', countryLabelEn: 'China' },
  { id: 'thailand-men-trad-0', label: '남성 태국 전통의상 1', image: '/sample/cloth/male/2026-03-13-13-42-40-thailand-men-trad-0.png', category: 'male', country: 'thailand', countryLabelKo: '태국', countryLabelEn: 'Thailand' },
  { id: 'thailand-men-trad-1', label: '남성 태국 전통의상 2', image: '/sample/cloth/male/2026-03-13-13-43-24-thailand-men-trad-1.png', category: 'male', country: 'thailand', countryLabelKo: '태국', countryLabelEn: 'Thailand' },
  { id: 'vietnam-men-trad-0', label: '남성 베트남 전통의상 1', image: '/sample/cloth/male/2026-03-13-13-44-06-vietnam-men-trad-0.png', category: 'male', country: 'vietnam', countryLabelKo: '베트남', countryLabelEn: 'Vietnam' },
  { id: 'vietnam-men-trad-1', label: '남성 베트남 전통의상 2', image: '/sample/cloth/male/2026-03-13-13-44-49-vietnam-men-trad-1.png', category: 'male', country: 'vietnam', countryLabelKo: '베트남', countryLabelEn: 'Vietnam' },
  { id: 'india-men-trad-0', label: '남성 인도 전통의상 1', image: '/sample/cloth/male/2026-03-13-13-45-32-india-men-trad-0.png', category: 'male', country: 'india', countryLabelKo: '인도', countryLabelEn: 'India' },
  { id: 'india-men-trad-1', label: '남성 인도 전통의상 2', image: '/sample/cloth/male/2026-03-13-13-46-15-india-men-trad-1.png', category: 'male', country: 'india', countryLabelKo: '인도', countryLabelEn: 'India' },
  { id: 'indonesia-men-trad-0', label: '남성 인도네시아 전통의상 1', image: '/sample/cloth/male/2026-03-13-13-46-57-indonesia-men-trad-0.png', category: 'male', country: 'indonesia', countryLabelKo: '인도네시아', countryLabelEn: 'Indonesia' },
  { id: 'indonesia-men-trad-1', label: '남성 인도네시아 전통의상 2', image: '/sample/cloth/male/2026-03-13-13-47-39-indonesia-men-trad-1.png', category: 'male', country: 'indonesia', countryLabelKo: '인도네시아', countryLabelEn: 'Indonesia' },
  { id: 'spain-men-trad-0', label: '남성 스페인 전통의상 1', image: '/sample/cloth/male/2026-03-13-13-48-35-spain-men-trad-0.png', category: 'male', country: 'spain', countryLabelKo: '스페인', countryLabelEn: 'Spain' },
  { id: 'spain-men-trad-1', label: '남성 스페인 전통의상 2', image: '/sample/cloth/male/2026-03-13-13-49-17-spain-men-trad-1.png', category: 'male', country: 'spain', countryLabelKo: '스페인', countryLabelEn: 'Spain' },

  { id: 'dog-animal-0', label: '강아지 의상 1', image: '/sample/cloth/animal/2026-03-13-14-02-24-dog-animal-0.png', category: 'animal', country: 'dog', countryLabelKo: '강아지', countryLabelEn: 'Dog' },
  { id: 'dog-animal-1', label: '강아지 의상 2', image: '/sample/cloth/animal/2026-03-13-14-03-05-dog-animal-1.png', category: 'animal', country: 'dog', countryLabelKo: '강아지', countryLabelEn: 'Dog' },
  { id: 'cat-animal-0', label: '고양이 의상 1', image: '/sample/cloth/animal/2026-03-13-14-03-22-cat-animal-0.png', category: 'animal', country: 'cat', countryLabelKo: '고양이', countryLabelEn: 'Cat' },
  { id: 'cat-animal-1', label: '고양이 의상 2', image: '/sample/cloth/animal/2026-03-13-14-03-41-cat-animal-1.png', category: 'animal', country: 'cat', countryLabelKo: '고양이', countryLabelEn: 'Cat' },
  { id: 'rabbit-animal-0', label: '토끼 의상 1', image: '/sample/cloth/animal/2026-03-13-14-04-21-rabbit-animal-0.png', category: 'animal', country: 'rabbit', countryLabelKo: '토끼', countryLabelEn: 'Rabbit' },
  { id: 'rabbit-animal-1', label: '토끼 의상 2', image: '/sample/cloth/animal/2026-03-13-14-05-00-rabbit-animal-1.png', category: 'animal', country: 'rabbit', countryLabelKo: '토끼', countryLabelEn: 'Rabbit' },
  { id: 'horse-animal-0', label: '말 의상 1', image: '/sample/cloth/animal/2026-03-13-14-05-18-horse-animal-0.png', category: 'animal', country: 'horse', countryLabelKo: '말', countryLabelEn: 'Horse' },
  { id: 'horse-animal-1', label: '말 의상 2', image: '/sample/cloth/animal/2026-03-13-14-05-55-horse-animal-1.png', category: 'animal', country: 'horse', countryLabelKo: '말', countryLabelEn: 'Horse' },
  { id: 'elephant-animal-0', label: '코끼리 의상 1', image: '/sample/cloth/animal/2026-03-13-14-06-33-elephant-animal-0.png', category: 'animal', country: 'elephant', countryLabelKo: '코끼리', countryLabelEn: 'Elephant' },
  { id: 'elephant-animal-1', label: '코끼리 의상 2', image: '/sample/cloth/animal/2026-03-13-14-07-15-elephant-animal-1.png', category: 'animal', country: 'elephant', countryLabelKo: '코끼리', countryLabelEn: 'Elephant' },

  { id: 'future-cybersuit-0', label: '미래 의상 1', image: '/sample/cloth/future/2026-03-13-14-07-37-cybersuit.png', category: 'future', country: 'cybersuit', countryLabelKo: '미래', countryLabelEn: 'Future' },
  { id: 'future-cybersuit-1', label: '미래 의상 2', image: '/sample/cloth/future/2026-03-13-14-08-22-cybersuit.png', category: 'future', country: 'cybersuit', countryLabelKo: '미래', countryLabelEn: 'Future' },

  { id: 'classic-uk70s-0', label: '클래식 70년대 1', image: '/sample/cloth/classic/2026-03-13-14-09-05-uk70s.png', category: 'classic', country: 'uk70s', countryLabelKo: '영국 70년대', countryLabelEn: 'UK 70s' },
  { id: 'classic-uk70s-1', label: '클래식 70년대 2', image: '/sample/cloth/classic/2026-03-13-14-09-48-uk70s.png', category: 'classic', country: 'uk70s', countryLabelKo: '영국 70년대', countryLabelEn: 'UK 70s' },
  { id: 'classic-uk80s-0', label: '클래식 80년대 1', image: '/sample/cloth/classic/2026-03-13-14-10-26-uk80s.png', category: 'classic', country: 'uk80s', countryLabelKo: '영국 80년대', countryLabelEn: 'UK 80s' },
  { id: 'classic-uk80s-1', label: '클래식 80년대 2', image: '/sample/cloth/classic/2026-03-13-14-11-17-uk80s.png', category: 'classic', country: 'uk80s', countryLabelKo: '영국 80년대', countryLabelEn: 'UK 80s' },
];
