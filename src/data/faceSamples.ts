export type FaceCategory = 'female' | 'male' | 'dog' | 'cat';

export const femaleSamples = [
  '/sample/face/female/(1).png',
  '/sample/face/female/(2).png',
  '/sample/face/female/(3).png',
  '/sample/face/female/(4).png',
  '/sample/face/female/(5).png',
  '/sample/face/female/(6).png',
  '/sample/face/female/(7).png',
  '/sample/face/female/(8).png',
  '/sample/face/female/(9).png',
  '/sample/face/female/(10).png',
  '/sample/face/female/(11).png',
  '/sample/face/female/(12).png',
  '/sample/face/female/(13).png',
  '/sample/face/female/(14).png',
  '/sample/face/female/(15).png',
  '/sample/face/female/(16).png',
  '/sample/face/female/(17).png',
  '/sample/face/female/(18).png',
  '/sample/face/female/(19).png',
  '/sample/face/female/(20).png',
];

export const maleSamples = [
  '/sample/face/male/(1).png',
  '/sample/face/male/(2).png',
  '/sample/face/male/(3).png',
  '/sample/face/male/(4).png',
  '/sample/face/male/(5).png',
  '/sample/face/male/(6).png',
  '/sample/face/male/(7).png',
  '/sample/face/male/(8).png',
  '/sample/face/male/(9).png',
  '/sample/face/male/(10).png',
  '/sample/face/male/(11).png',
  '/sample/face/male/(12).png',
  '/sample/face/male/(13).png',
  '/sample/face/male/(14).png',
  '/sample/face/male/(15).png',
  '/sample/face/male/(16).png',
  '/sample/face/male/(17).png',
  '/sample/face/male/(18).png',
  '/sample/face/male/(19).png',
  '/sample/face/male/(20).png',
];

export const dogSamples = [
  '/sample/face/dog/(1).png',
  '/sample/face/dog/(2).png',
  '/sample/face/dog/(3).png',
  '/sample/face/dog/(4).png',
  '/sample/face/dog/(5).png',
];

export const catSamples = [
  '/sample/face/cat/(1).png',
  '/sample/face/cat/(2).png',
  '/sample/face/cat/(3).png',
  '/sample/face/cat/(4).png',
  '/sample/face/cat/(5).png',
];

export const FACE_SAMPLES: Record<FaceCategory, string[]> = {
  female: femaleSamples,
  male: maleSamples,
  dog: dogSamples,
  cat: catSamples,
};
