export type Gender = 'female' | 'male' | 'dog' | 'cat';

export interface ModelSample {
  id: string;
  gender: Gender;
  image: string;
  label?: string;
}

export const modelSamples: ModelSample[] = [
  ...Array.from({ length: 12 }).map((_, i) => ({
    id: `female-${i + 1}`,
    gender: 'female' as Gender,
    image: `/sample/models/female/${i + 1}.jpg`,
    label: `여성 ${i + 1}`,
  })),
  ...Array.from({ length: 12 }).map((_, i) => ({
    id: `male-${i + 1}`,
    gender: 'male' as Gender,
    image: `/sample/models/male/${i + 1}.jpg`,
    label: `남성 ${i + 1}`,
  })),
  ...Array.from({ length: 5 }).map((_, i) => ({
    id: `dog-${i + 1}`,
    gender: 'dog' as Gender,
    image: `/sample/models/dog/${i + 1}.jpg`,
    label: `강아지 ${i + 1}`,
  })),
  ...Array.from({ length: 5 }).map((_, i) => ({
    id: `cat-${i + 1}`,
    gender: 'cat' as Gender,
    image: `/sample/models/cat/${i + 1}.jpg`,
    label: `고양이 ${i + 1}`,
  })),
];

export type Country = 'korea' | 'japan' | 'china' | 'vietnam' | 'thailand' | 'india' | 'uk70s' | 'us80s' | 'dog' | 'cat';

export interface ClothSample {
  id: string;
  category: string;
  country: Country;
  label: string;
  image: string;
}

export const countries: { id: Country; label: string }[] = [
  { id: 'korea', label: '한국' },
  { id: 'japan', label: '일본' },
  { id: 'china', label: '중국' },
  { id: 'vietnam', label: '베트남' },
  { id: 'thailand', label: '태국' },
  { id: 'india', label: '인도' },
  { id: 'uk70s', label: '70년대 영국 정장' },
  { id: 'us80s', label: '80년대 미국 정장' },
  { id: 'dog', label: '강아지 의상' },
  { id: 'cat', label: '고양이 의상' },
];

export const clothSamples: ClothSample[] = countries.flatMap(c =>
  Array.from({ length: 10 }).map((_, i) => {
    let category = 'traditional';
    if (c.id === 'uk70s' || c.id === 'us80s') category = 'suit';
    if (c.id === 'dog' || c.id === 'cat') category = 'pet';

    return {
      id: `${c.id}-${category}-${i + 1}`,
      category,
      country: c.id,
      label: `${c.label} ${i + 1}`,
      image: `/sample/clothes/${category}/${c.id}/${i + 1}.jpg`,
    };
  })
);
