const fs = require('fs');
const path = require('path');

const dir = '/home/user/evova/src/constants';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

const content = `export type Category = 'face' | 'clothes';
export type SubCategory = 'female' | 'male' | 'dog' | 'cat' | 'trad' | 'suit' | 'pet_cloth';

export interface SampleImage {
  id: string;
  fileName: string;
  displayName: string;
  country: string | null;
  category: Category;
  subCategory: SubCategory;
  description: string;
  recommendedThumbnailSize: string;
}

const generateSamples = (
  prefix: string,
  count: number,
  category: Category,
  subCategory: SubCategory,
  displayNamePrefix: string,
  country: string | null,
  descriptionStr: string
): SampleImage[] => {
  return Array.from({ length: count }).map((_, i) => {
    const num = (i + 1).toString().padStart(2, '0');
    return {
      id: \`\${prefix}_\${num}\`,
      fileName: \`\${prefix}_\${num}.jpg\`,
      displayName: \`\${displayNamePrefix} \${num}\`,
      country,
      category,
      subCategory,
      description: descriptionStr,
      recommendedThumbnailSize: '512x512',
    };
  });
};

export const faceSamples: SampleImage[] = [
  ...generateSamples('face_female', 12, 'face', 'female', '여성 모델', null, '정면 위주, 단순 배경의 여성 피팅용 샘플'),
  ...generateSamples('face_male', 12, 'face', 'male', '남성 모델', null, '정면 위주, 단순 배경의 남성 피팅용 샘플'),
  ...generateSamples('face_dog', 5, 'face', 'dog', '강아지 모델', null, '정면 구도의 강아지 피팅용 샘플'),
  ...generateSamples('face_cat', 5, 'face', 'cat', '고양이 모델', null, '정면 구도의 고양이 피팅용 샘플'),
];

export const clothesSamples: SampleImage[] = [
  ...generateSamples('cloth_trad_korea', 10, 'clothes', 'trad', '한복', 'Korea', '한국 전통 의상'),
  ...generateSamples('cloth_trad_japan', 10, 'clothes', 'trad', '기모노', 'Japan', '일본 전통 의상'),
  ...generateSamples('cloth_trad_china', 10, 'clothes', 'trad', '치파오', 'China', '중국 전통 의상'),
  ...generateSamples('cloth_trad_vietnam', 10, 'clothes', 'trad', '아오자이', 'Vietnam', '베트남 전통 의상'),
  ...generateSamples('cloth_trad_thailand', 10, 'clothes', 'trad', '쑤타이', 'Thailand', '태국 전통 의상'),
  ...generateSamples('cloth_trad_india', 10, 'clothes', 'trad', '사리', 'India', '인도 전통 의상'),
  ...generateSamples('cloth_suit_uk70s', 10, 'clothes', 'suit', '70s 영국 정장', 'UK', '1970년대 영국 스타일 클래식 슈트'),
  ...generateSamples('cloth_suit_us80s', 10, 'clothes', 'suit', '80s 미국 정장', 'USA', '1980년대 미국 스타일 파워 슈트'),
  ...generateSamples('cloth_pet_dog', 10, 'clothes', 'pet_cloth', '강아지 의상', null, '반려견 전용 의상 샘플'),
  ...generateSamples('cloth_pet_cat', 10, 'clothes', 'pet_cloth', '고양이 의상', null, '반려묘 전용 의상 샘플'),
];

export const allSamples: SampleImage[] = [...faceSamples, ...clothesSamples];
\`;

fs.writeFileSync(path.join(dir, 'samples.ts'), content);
console.log('Created src/constants/samples.ts');
