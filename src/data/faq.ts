export type FAQItem = {
  question: string;
  answer: string;
};

export const homeFaqs: FAQItem[] = [
  {
    question: 'What is HAMDEVA AI virtual fitting?',
    answer:
      'HAMDEVA is an AI virtual fitting service that combines a face photo or sample image with a clothing reference to generate a styled result image. It is designed for online style exploration, traditional outfit discovery, and digital fashion previews.',
  },
  {
    question: 'Do I need to upload my own face photo to use HAMDEVA?',
    answer:
      'No. HAMDEVA supports both direct photo upload and sample image selection. If you want to test the experience quickly, you can start with sample faces and sample outfits before trying your own image.',
  },
  {
    question: 'Can I try traditional outfits and modern styles on the same site?',
    answer:
      'Yes. HAMDEVA includes traditional outfit references, sample clothing collections, and multiple style categories. The service is intended to help users compare different visual directions in one place.',
  },
  {
    question: 'Is the generated image a perfect real-world fitting result?',
    answer:
      'No. The generated image is a visual preview created by AI, not a physical measurement-based fitting system. It is useful for style exploration and concept review, but it does not replace real tailoring or in-person fitting.',
  },
  {
    question: 'Do I need an account to generate images?',
    answer:
      'HAMDEVA\'s generation flow is tied to signed-in user state and credit usage in the current implementation. The site also shows available credits and account-related usage information after login.',
  },
  {
    question: 'Can I save or download generated images?',
    answer:
      'Yes. HAMDEVA provides result handling actions such as downloading generated images and sharing links when available. Saved output should still be reviewed carefully because AI-generated results are previews, not exact product guarantees.',
  },
];

export const aboutFaqs: FAQItem[] = [
  {
    question: 'What kind of platform is HAMDEVA?',
    answer:
      'HAMDEVA is a digital fashion platform focused on AI virtual fitting, outfit exploration, and educational presentation of clothing styles. It combines interactive generation with informational content rather than acting as a simple image tool alone.',
  },
  {
    question: 'Why does HAMDEVA include both content and interactive try-on?',
    answer:
      'The service is designed to help users understand styles before and during the fitting experience. Informational content gives context, while the AI try-on feature makes that knowledge more practical and visual.',
  },
  {
    question: 'Does HAMDEVA claim to replace real garments or real fitting?',
    answer:
      'No. HAMDEVA is intended as a digital preview and exploration experience. It helps users compare looks and understand styling direction, but it does not replace physical craftsmanship, material feel, or exact body fitting.',
  },
];

export const howToUseFaqs: FAQItem[] = [
  {
    question: 'What kind of face image works best for HAMDEVA?',
    answer:
      'A clear, front-facing or near front-facing image usually works best. Good lighting, visible facial features, and a clean subject image help the AI preserve identity more consistently in the final result.',
  },
  {
    question: 'What kind of outfit image should I use?',
    answer:
      'Choose an outfit image with a clear silhouette and visible details. Clothing references that are heavily cropped, blocked, or visually cluttered may reduce the clarity of the generated result.',
  },
  {
    question: 'Can I use HAMDEVA on mobile devices?',
    answer:
      'Yes. The HAMDEVA frontend is designed to work on both desktop and mobile layouts. You should still use clear images and a stable connection when uploading or generating results.',
  },
  {
    question: 'Why should I review the result image instead of trusting it blindly?',
    answer:
      'AI generation is helpful for visual planning, but it can still interpret details rather than reproduce them exactly. Users should review the generated image as a guide for style direction, not as a guaranteed real-world outcome.',
  },
];

export const sampleOutfitsFaqs: FAQItem[] = [
  {
    question: 'What are sample outfits on HAMDEVA?',
    answer:
      'Sample outfits are curated clothing reference images provided inside the service so users can test virtual fitting quickly. They allow visitors to explore style categories without needing to upload their own outfit image first.',
  },
  {
    question: 'Can sample outfits help me compare traditional and modern looks?',
    answer:
      'Yes. HAMDEVA sample collections are useful for comparing different visual categories such as traditional outfits, classic looks, and more modern fashion directions. This makes the page helpful for browsing as well as generation.',
  },
  {
    question: 'Are sample outfit results the same as buying or wearing the real garment?',
    answer:
      'No. Sample outfit results are AI-generated visual previews based on reference images. They are useful for comparison and inspiration, but they are not a guarantee of fabric behavior, exact fit, or final real-world appearance.',
  },
  {
    question: 'Do sample outfits work with both uploaded faces and sample faces?',
    answer:
      'Yes. In the current HAMDEVA flow, sample outfits can be paired with uploaded face images or with sample face images. This makes the sample collection useful for quick testing and visual experimentation.',
  },
];
