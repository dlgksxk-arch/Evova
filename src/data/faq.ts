export type FAQItem = {
  question: string;
  answer: string;
};

export const homeFaqs: FAQItem[] = [
  {
    question: 'Do I need my own pet photo?',
    answer:
      'No. You can start with sample images first if you want to test the flow before uploading your dog or cat.',
  },
  {
    question: 'Do I need an account to generate images?',
    answer:
      'Yes. Generation is tied to signed-in user state and credit usage in the current flow.',
  },
  {
    question: 'Can I save the generated image?',
    answer:
      'Yes. Finished results can be downloaded, and share links are available when supported.',
  },
  {
    question: 'What should I compare in the result?',
    answer:
      'Check whether the pet pose, outfit shape, color balance, and overall mood still match the clothing reference you selected.',
    },
];

export const aboutFaqs: FAQItem[] = [
  {
    question: 'Why was HAMDEVA built?',
    answer:
      'It was built to make it easier to preview cute pet outfits before shopping, planning a costume, or preparing a themed photo.',
  },
  {
    question: 'Why does the site include informational pages?',
    answer:
      'They explain brand intent and page structure, while the try-on flow stays focused on execution.',
  },
  {
    question: 'Does HAMDEVA replace real fitting?',
    answer:
      'No. It is a visual preview tool for early comparison, not a replacement for how a real pet outfit fits in person.',
    },
];

export const howToUseFaqs: FAQItem[] = [
  {
    question: 'What kind of pet photo works best for HAMDEVA?',
    answer:
      'A clear dog or cat photo that is front-facing or near front-facing usually works best. Good lighting and a visible face help the AI preserve your pet’s look more consistently.',
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
    question: 'What common input mistakes lower quality?',
    answer:
      'Blurry pet photos, heavily cropped outfit images, cluttered backgrounds, and hidden clothing details are the most common reasons a result looks weaker than expected.',
  },
  {
    question: 'Why does HAMDEVA generate a 1x4 result sheet instead of one single image?',
    answer:
      'A multi-view sheet makes the result more useful for comparison. Many garments reveal important information in the side line, sleeve profile, waist balance, skirt volume, or back drape. One combined sheet lets users review those traits faster than isolated front-only images.',
  },
  {
    question: 'Should I use HAMDEVA before buying or renting clothing?',
    answer:
      'Yes. It can be a practical early-stage tool for narrowing down a pet outfit direction before you buy or prepare the real costume.',
  },
];

export const sampleOutfitsFaqs: FAQItem[] = [
  {
    question: 'What are sample outfits on HAMDEVA?',
    answer:
      'Sample outfits are clothing reference images that help users test pet fitting quickly. They let you explore different costume moods without preparing your own outfit image first.',
  },
  {
    question: 'Are sample outfit results the same as buying or wearing the real garment?',
    answer:
      'No. They are AI-generated previews for inspiration and comparison, not a guarantee of exact fit or final real-world appearance.',
  },
  {
    question: 'Do sample outfits work with both uploaded pet photos and sample images?',
    answer:
      'Yes. In the current HAMDEVA flow, sample outfits can be paired with uploaded pet photos or with sample images for quick testing.',
  },
  {
    question: 'What kinds of comparisons can I make on the sample outfit pages?',
    answer:
      'You can compare cute costume moods, decorative detail, silhouette, color balance, and how different outfit ideas might look on your pet before generating.',
  },
];
