export type FAQItem = {
  question: string;
  answer: string;
};

export const homeFaqs: FAQItem[] = [
  {
    question: 'Do I need my own face photo?',
    answer:
      'No. You can start with sample faces and sample outfits if you want to test the flow first.',
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
      'Check silhouette, garment length, trim placement, layering balance, and whether the output still matches the original clothing reference.',
    },
];

export const aboutFaqs: FAQItem[] = [
  {
    question: 'Why was HAMDEVA built?',
    answer:
      'It was built to reduce uncertainty before purchase, rental, travel styling, or visual planning by giving users a fast outfit preview.',
  },
  {
    question: 'Why does the site include informational pages?',
    answer:
      'They explain brand intent and page structure, while the try-on flow stays focused on execution.',
  },
  {
    question: 'Does HAMDEVA replace real fitting?',
    answer:
      'No. It is a visual planning tool for early comparison, not a replacement for real measurements, tailoring, or fabric handling.',
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
    question: 'What common input mistakes lower quality?',
    answer:
      'Blurry portraits, cropped garments, cluttered backgrounds, and hidden clothing details are the most common reasons a result looks weaker than expected.',
  },
  {
    question: 'Why does HAMDEVA generate a 1x4 result sheet instead of one single image?',
    answer:
      'A multi-view sheet makes the result more useful for comparison. Many garments reveal important information in the side line, sleeve profile, waist balance, skirt volume, or back drape. One combined sheet lets users review those traits faster than isolated front-only images.',
  },
  {
    question: 'Should I use HAMDEVA before buying or renting clothing?',
    answer:
      'It can be a practical early-stage screening tool. HAMDEVA helps narrow down style direction, compare outfit mood, and decide whether a garment is worth deeper consideration. It should still be combined with real product information, measurements, and material checks before a final purchase decision.',
  },
];

export const sampleOutfitsFaqs: FAQItem[] = [
  {
    question: 'What are sample outfits on HAMDEVA?',
    answer:
      'Sample outfits are curated clothing reference images provided inside the service so users can test virtual fitting quickly. They allow visitors to explore style categories without needing to upload their own outfit image first.',
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
  {
    question: 'What kinds of comparisons can I make on the sample outfit pages?',
    answer:
      'Visitors can compare country-specific dress traditions, decorative density, sleeve and skirt volume, color harmony, and the difference between traditional, classic, and more conceptual looks. That makes the sample pages valuable as browsing content as well as a starting point for generation.',
  },
];
