export type FaceCategory = 'dog' | 'cat';

export interface FaceSampleOption {
  url: string;
  breedLabel: string;
  category: FaceCategory;
}

export interface PetBreedGuide {
  id: string;
  url: string;
  breedLabel: string;
  category: FaceCategory;
  categoryLabel: string;
  summary: string;
  overview: string[];
  appearance: string[];
  styling: string[];
  photoTips: string[];
  fittingTips: string[];
}

const buildSampleUrl = (category: FaceCategory, filename: string) =>
  `/sample/${category}/${encodeURIComponent(filename)}`;

const createFaceSamples = (category: FaceCategory, filenames: string[]): FaceSampleOption[] =>
  filenames.map((filename) => ({
    url: buildSampleUrl(category, filename),
    breedLabel: filename.replace(/^\d+\s+/, '').replace(/\.[^.]+$/, ''),
    category,
  }));

export const dogSamples = createFaceSamples('dog', [
  '1 Korean Jindo.png',
  '2 Corgi.png',
  '3 Dachshund.png',
  '4 French Bulldog.png',
  '5 Golden Retriever.png',
  '6 Husky.png',
  '7 Labrador Retriever.png',
  '8 Pomeranian.png',
  '9 Poodle.png',
  '10 Shiba Inu.png',
  '11 Chihuahua.png',
]);

export const catSamples = createFaceSamples('cat', [
  '1 Korean Jindo.png',
  '2 Corgi.png',
  '3 Dachshund.png',
  '4 French Bulldog.png',
  '5 Golden Retriever.png',
  '6 Husky.png',
  '7 Labrador Retriever.png',
  '8 Pomeranian.png',
  '9 Poodle.png',
  '10 Shiba Inu.png',
  '11 Chihuahua.png',
]);

export const FACE_SAMPLE_OPTIONS: Record<FaceCategory, FaceSampleOption[]> = {
  dog: dogSamples,
  cat: catSamples,
};

export const FACE_SAMPLES: Record<FaceCategory, string[]> = {
  dog: dogSamples.map((sample) => sample.url),
  cat: catSamples.map((sample) => sample.url),
};

export const getFaceSampleBreed = (url: string | null): string | null => {
  if (!url) {
    return null;
  }

  for (const samples of Object.values(FACE_SAMPLE_OPTIONS)) {
    const matched = samples.find((sample) => sample.url === url);
    if (matched) {
      return matched.breedLabel;
    }
  }

  return null;
};

const normalizeGuideLang = (lang: string): 'ko' | 'en' | 'ja' | 'zh' => {
  if (lang.startsWith('ja')) {
    return 'ja';
  }
  if (lang.startsWith('zh')) {
    return 'zh';
  }
  if (lang.startsWith('en')) {
    return 'en';
  }
  return 'ko';
};

const buildGuideId = (sample: FaceSampleOption) =>
  `${sample.category}-${sample.breedLabel.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')}`;

export const getPetBreedGuides = (lang: string): PetBreedGuide[] => {
  const locale = normalizeGuideLang(lang);

  return Object.values(FACE_SAMPLE_OPTIONS).flatMap((samples) =>
    samples.map((sample) => {
      if (locale === 'en') {
        const categoryLabel = sample.category === 'dog' ? 'Dog Sample' : 'Cat Sample';
        return {
          id: buildGuideId(sample),
          url: sample.url,
          breedLabel: sample.breedLabel,
          category: sample.category,
          categoryLabel,
          summary: `${sample.breedLabel} is organized as a ${categoryLabel.toLowerCase()} reference that helps you compare face framing, fur volume, and costume balance before you generate.`,
          overview: [
            `This ${sample.breedLabel} sample works as a quick reference when you want a stable starting image with a readable face shape, ear line, and front-facing impression.`,
          ],
          appearance: [
            `Check the silhouette around the eyes, muzzle area, ear outline, and neck line first. Those details strongly affect how hats, collars, ribbons, and layered accessories sit in the final preview.`,
          ],
          styling: [
            `This sample is useful when you want to compare how bright colors, themed costumes, capes, or neck accessories interact with a clear pet face and coat outline.`,
          ],
          photoTips: [
            `Near-front images with balanced light and limited background clutter are the easiest references to reuse. Clear eye placement and a readable nose line usually lead to cleaner fitting results.`,
          ],
          fittingTips: [
            `Start with this sample when you want to test outfit mood first, then compare it with your own pet photo to see how fur texture, face ratio, and costume scale change the result.`,
          ],
        };
      }

      if (locale === 'ja') {
        const categoryLabel = sample.category === 'dog' ? '犬サンプル' : '猫サンプル';
        return {
          id: buildGuideId(sample),
          url: sample.url,
          breedLabel: sample.breedLabel,
          category: sample.category,
          categoryLabel,
          summary: `${sample.breedLabel} は、顔の輪郭や毛のボリューム、衣装バランスを見比べるための ${categoryLabel} として使える参照画像です。`,
          overview: [
            `このサンプルは、顔の形、耳のライン、正面の印象が読み取りやすく、ペットフィッティングの基準画像として使いやすい構成です。`,
          ],
          appearance: [
            `目まわりのコントラスト、鼻先の位置、耳の角度、首まわりの輪郭を先に確認すると、アクセサリーやフードの見え方を比べやすくなります。`,
          ],
          styling: [
            `明るい色、テーマ衣装、ケープ、首まわり装飾が顔の印象とどう重なるかを確認したいときに使いやすいサンプルです。`,
          ],
          photoTips: [
            `正面または半正面で、背景が散らかりすぎていない画像ほど再利用しやすくなります。目と鼻の位置がはっきり見えることが大切です。`,
          ],
          fittingTips: [
            `まずこのサンプルで衣装の雰囲気を確認し、そのあと自分のペット写真と比べると、毛並みや顔比率による差が読み取りやすくなります。`,
          ],
        };
      }

      if (locale === 'zh') {
        const categoryLabel = sample.category === 'dog' ? '狗狗示例' : '猫咪示例';
        return {
          id: buildGuideId(sample),
          url: sample.url,
          breedLabel: sample.breedLabel,
          category: sample.category,
          categoryLabel,
          summary: `${sample.breedLabel} 被整理为一个${categoryLabel}参考，用来先比较脸部轮廓、毛量和服装比例。`,
          overview: [
            `这个示例图适合作为起点，因为脸部形状、耳朵线条和正面印象都比较容易读取。`,
          ],
          appearance: [
            `先看眼周对比、鼻口位置、耳朵角度和颈部轮廓，这些细节会直接影响帽子、领结和披肩类服装的呈现。`,
          ],
          styling: [
            `如果你想比较亮色服装、主题造型、披风或颈部装饰与宠物脸部的搭配效果，这类示例会比较直观。`,
          ],
          photoTips: [
            `接近正面、光线均衡、背景不过于复杂的照片最适合反复使用。眼睛和鼻线越清楚，结果通常越稳定。`,
          ],
          fittingTips: [
            `可以先用这个示例测试服装氛围，再与自己的宠物照片比较毛发质感、脸型比例和服装尺度的差异。`,
          ],
        };
      }

      const categoryLabel = sample.category === 'dog' ? '강아지 샘플' : '고양이 샘플';
      return {
        id: buildGuideId(sample),
        url: sample.url,
        breedLabel: sample.breedLabel,
        category: sample.category,
        categoryLabel,
        summary: `${sample.breedLabel} 이름으로 정리된 ${categoryLabel} 기준 이미지입니다. 얼굴 윤곽, 털 볼륨, 의상 비율을 비교하며 시작 샘플을 고를 때 참고하기 좋습니다.`,
        overview: [
          `이 샘플은 정면 인상과 귀 라인, 얼굴 비율을 빠르게 읽기 쉬운 편이라 펫 피팅을 시작할 때 기준 이미지로 쓰기 좋습니다.`,
        ],
        appearance: [
          `눈 주변 대비, 코 위치, 귀 각도, 목선, 털 실루엣을 먼저 보면 모자, 리본, 케이프, 후드처럼 얼굴 주변 장식이 결과에서 어떻게 겹치는지 가늠하기 쉽습니다.`,
        ],
        styling: [
          `밝은 색 의상, 테마 코스튬, 목 주변 장식처럼 얼굴 주변 포인트가 많은 스타일을 시험할 때 이 샘플이 비교 기준으로 잘 작동합니다.`,
        ],
        photoTips: [
          `정면 또는 반정면에 가깝고 조명이 고른 사진일수록 다시 쓰기 좋습니다. 눈과 코 위치가 또렷하게 보이면 결과가 더 안정적으로 나옵니다.`,
        ],
        fittingTips: [
          `먼저 이 샘플로 의상 분위기를 본 뒤, 내 반려동물 사진과 비교해 털 결, 얼굴 폭, 의상 크기 차이가 어떻게 보이는지 확인해 보세요.`,
        ],
      };
    }),
  );
};
