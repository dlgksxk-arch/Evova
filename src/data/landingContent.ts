import type { LanguageCode } from '../constants/languages';

type SupportedLandingLanguage = 'en' | 'ko' | 'ja' | 'zh';

export type LandingFeatureCard = {
  title: string;
  description: string;
};

export type LandingStep = {
  step: string;
  title: string;
  description: string;
};

export type LandingExample = {
  title: string;
  description: string;
};

export type LandingFaqItem = {
  question: string;
  answer: string;
};

export type SampleOutfitGuide = {
  id: string;
  name: string;
  image: string;
  overview: string[];
  history: string[];
  culture: string[];
  design: string[];
  modernUse: string[];
  fittingTips: string[];
};

export type LandingContent = {
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    body: string;
    primaryButton: string;
    secondaryButton: string;
  };
  intro: {
    title: string;
    paragraphs: string[];
  };
  features: {
    title: string;
    items: LandingFeatureCard[];
  };
  steps: {
    title: string;
    items: LandingStep[];
  };
  examples: {
    title: string;
    items: LandingExample[];
  };
  sampleInfo: {
    title: string;
    body: string;
    button: string;
  };
  faq: {
    title: string;
    items: LandingFaqItem[];
  };
  modal: {
    title: string;
    description: string;
    notice: string;
    personCardTitle: string;
    personCardBody: string;
    garmentCardTitle: string;
    garmentCardBody: string;
    actionCardTitle: string;
    actionCardBody: string;
    actionFootnote: string;
    tipsTitle: string;
    tips: string[];
    progressTitle: string;
    progressItems: string[];
    usageTitle: string;
    usageItems: string[];
    resultTitle: string;
    retryButton: string;
  };
  sampleOutfits: {
    title: string;
    description: string;
    introTitle: string;
    introParagraphs: string[];
    catalogTitle: string;
    catalogBody: string;
    startButton: string;
    outfitLabel: string;
    guideSections: {
      overview: string;
      history: string;
      culture: string;
      design: string;
      modernUse: string;
      fittingTips: string;
    };
    outfits: SampleOutfitGuide[];
  };
};

const sharedSampleImages = {
  hanbok: '/sample/cloth/female/2026-03-13-12-47-58-korea-trad-0.png',
  qipao: '/sample/cloth/female/2026-03-13-12-55-32-china-trad-0.png',
  kimono: '/sample/cloth/female/2026-03-13-12-51-42-japan-trad-0.png',
  saree: '/sample/cloth/female/2026-03-13-13-14-07-india-trad-0.png',
  dress: '/sample/cloth/female/2026-03-13-13-26-02-spain-trad-extra.png',
};

const landingContent: Record<SupportedLandingLanguage, LandingContent> = {
  ko: {
    hero: {
      eyebrow: 'AI Virtual Fitting Service',
      title: 'HAMDEVA',
      subtitle: '사진 한 장으로 다양한 의상을 가상 피팅해보세요.',
      body:
        '얼굴 사진과 의상 이미지를 업로드하면 AI가 자연스럽게 착용 이미지를 생성합니다. 전통 의상, 드레스, 테마 의상 등 여러 스타일을 미리 확인해볼 수 있습니다.',
      primaryButton: '가상피팅 시작',
      secondaryButton: '사용 방법 보기',
    },
    intro: {
      title: 'HAMDEVA는 의상 분위기를 미리 비교하고 결과를 빠르게 확인할 수 있는 AI 가상피팅 서비스입니다.',
      paragraphs: [
        '얼굴 사진과 의상 이미지를 바탕으로 착용 이미지를 생성해, 실제로 입어보기 전 분위기와 실루엣을 먼저 살펴볼 수 있습니다.',
        '온라인 쇼핑, 행사 의상 준비, 여행 촬영, 콘텐츠 시안 작업처럼 빠른 비교가 필요한 상황에서 유용합니다.',
        '자세한 사용 절차는 사용 방법 페이지에서, 의상 자체의 정보는 샘플 의상 정보 페이지에서 바로 이어서 확인할 수 있습니다.',
      ],
    },
    features: {
      title: '핵심 기능',
      items: [
        {
          title: '얼굴 사진 업로드',
          description: '정면에 가깝고 얼굴이 선명한 사진을 사용하면 인물 인상이 더 안정적으로 유지됩니다.',
        },
        {
          title: '의상 이미지 업로드',
          description: '의상 외곽선과 장식, 실루엣이 잘 보이는 이미지를 넣으면 결과의 디자인 충실도가 높아집니다.',
        },
        {
          title: 'AI 가상피팅 생성',
          description: '인물과 의상 이미지를 바탕으로 여러 각도를 고려한 결과 이미지를 생성합니다.',
        },
        {
          title: '결과 저장 및 활용',
          description: '완성된 결과는 저장하거나 비교용 시안으로 활용해 다음 선택을 더 빠르게 할 수 있습니다.',
        },
      ],
    },
    steps: {
      title: '사용 방법 4단계',
      items: [
        { step: '01', title: '얼굴 사진 업로드', description: '정면에 가깝고 얼굴 특징이 잘 보이는 사진을 준비합니다.' },
        { step: '02', title: '의상 이미지 선택', description: '샘플 의상을 고르거나 직접 의상 이미지를 올립니다.' },
        { step: '03', title: '가상피팅 생성', description: '준비된 두 이미지를 기준으로 AI가 결과를 생성합니다.' },
        { step: '04', title: '결과 확인 및 저장', description: '생성 결과를 보고 저장하거나 다음 스타일과 비교합니다.' },
      ],
    },
    examples: {
      title: '활용 예시',
      items: [
        { title: '한복 스타일 미리보기', description: '행사나 촬영 전에 실루엣과 색감이 어울리는지 빠르게 확인할 수 있습니다.' },
        { title: '드레스 / 정장 스타일 테스트', description: '포멀한 룩이 얼굴 인상과 분위기에 잘 맞는지 사전에 가늠할 수 있습니다.' },
        { title: '행사 의상 사전 확인', description: '가족 행사, 문화 체험, 여행 사진 촬영 전에 스타일 방향을 좁히는 데 도움이 됩니다.' },
        { title: 'SNS 콘텐츠 시안 제작', description: '콘셉트별 의상 후보를 비교해 썸네일이나 시안 이미지 방향을 빠르게 정할 수 있습니다.' },
      ],
    },
    sampleInfo: {
      title: '샘플 의상 정보에서 의상별 특징을 먼저 확인할 수 있습니다.',
      body: '한복, 기모노, 치파오, 사리 같은 의상의 특징과 활용 장면을 보고 원하는 분위기를 정한 뒤 가상피팅으로 이동해 보세요.',
      button: '샘플 의상 정보 보기',
    },
    faq: {
      title: '자주 묻는 질문',
      items: [
        { question: '어떤 사진이 잘 나오나요?', answer: '정면에 가깝고 얼굴이 선명하며 과한 필터가 없는 사진이 가장 안정적입니다.' },
        { question: '모바일에서도 가능한가요?', answer: '네. 모바일에서도 업로드와 생성 흐름을 그대로 이용할 수 있으며, 결과 저장도 가능합니다.' },
        { question: '생성 시간은 얼마나 걸리나요?', answer: '서버 상태와 이미지 크기에 따라 다르지만, 일반적으로 수십 초 안팎에서 결과를 받게 됩니다.' },
        { question: '결과 이미지는 저장할 수 있나요?', answer: '생성이 끝난 뒤 다운로드 버튼을 통해 결과 이미지를 저장할 수 있습니다.' },
        { question: '의상 배경은 단순해야 하나요?', answer: '가능하면 단순한 배경이 좋습니다. 의상 외곽과 디테일이 잘 보여야 AI가 더 안정적으로 읽습니다.' },
        { question: '정면 얼굴만 가능한가요?', answer: '정면에 가까운 사진이 가장 좋지만, 약간의 각도가 있는 사진도 사용할 수 있습니다. 다만 얼굴 가림과 왜곡은 적을수록 좋습니다.' },
      ],
    },
    modal: {
      title: '가상피팅 시작',
      description: '얼굴 사진과 의상 이미지를 업로드하면 결과를 생성합니다.',
      notice: '정면 얼굴 사진과 배경이 비교적 단순한 의상 이미지를 사용하면 더 자연스러운 결과를 얻을 수 있습니다.',
      personCardTitle: '얼굴 사진 업로드',
      personCardBody: '얼굴 특징이 잘 보이는 사진을 준비하면 인물 인상이 더 자연스럽게 유지됩니다.',
      garmentCardTitle: '의상 이미지 업로드',
      garmentCardBody: '의상 전체 형태와 장식이 잘 보이는 이미지를 사용할수록 결과가 더 안정적입니다.',
      actionCardTitle: '생성 실행',
      actionCardBody: '로그인 상태와 크레딧을 확인한 뒤 결과 이미지를 생성합니다.',
      actionFootnote: '생성 시간은 이미지와 서버 상태에 따라 달라질 수 있습니다.',
      tipsTitle: '좋은 결과를 위한 팁',
      tips: ['얼굴은 정면에 가깝게', '조명이 너무 어둡지 않게', '의상 전체 형태가 잘 보이게', '배경이 단순할수록 유리'],
      progressTitle: '진행 상태',
      progressItems: ['업로드 전', '준비 완료', '생성 중', '완료'],
      usageTitle: '결과 활용 안내',
      usageItems: ['생성된 결과는 저장해 둘 수 있습니다.', '서로 다른 의상을 비교용 시안으로 확인할 수 있습니다.', '마음에 드는 스타일이 보이면 다른 의상과 바로 다시 비교할 수 있습니다.'],
      resultTitle: '생성 결과',
      retryButton: '다시 생성하기',
    },
    sampleOutfits: {
      title: '샘플 의상 정보',
      description: '전통 의상과 대표 스타일의 특징, 활용 장면, 디자인 포인트를 정리한 정보 페이지입니다.',
      introTitle: '이 페이지는 의상 자체를 이해하기 위한 안내 페이지입니다.',
      introParagraphs: [
        '각 의상 카드에서는 이름, 역사, 문화적 사용 장면, 디자인 특징, 현대 활용을 중심으로 읽을 수 있습니다.',
        '서비스 소개나 생성 절차보다 의상 정보에 집중해 비교할 수 있도록 구성했습니다.',
      ],
      catalogTitle: '대표 의상 가이드',
      catalogBody: '아래 카드에서 원하는 의상의 배경과 특징을 확인한 뒤 상세 내용을 열어보세요.',
      startButton: '이 의상 분위기로 가상피팅 시작',
      outfitLabel: '샘플 의상',
      guideSections: {
        overview: '개요',
        history: '기원과 역사',
        culture: '의식 및 문화',
        design: '디자인 특징',
        modernUse: '현대 활용',
        fittingTips: '가상피팅 활용 포인트',
      },
      outfits: [
        {
          id: 'hanbok',
          name: '한복',
          image: sharedSampleImages.hanbok,
          overview: ['한복은 저고리와 치마 또는 바지의 조합으로 이루어지는 한국 전통 의상으로, 곡선적인 선과 넉넉한 여유분에서 오는 우아한 인상이 핵심입니다.'],
          history: ['삼국시대부터 이어진 복식 흐름 위에서 시대별 실루엣과 장식이 달라졌고, 조선시대에 오늘날 익숙한 형태가 정리되었습니다.'],
          culture: ['명절, 혼례, 돌잔치, 가족 행사, 전통문화 체험처럼 격식과 상징이 필요한 장면에서 자주 착용됩니다.'],
          design: ['짧은 저고리와 넓게 퍼지는 치마, 고름의 위치, 색상 대비가 대표적 특징입니다. 움직일 때 생기는 곡선이 전체 인상을 크게 좌우합니다.'],
          modernUse: ['최근에는 생활 한복, 촬영용 한복, 관광 체험용 한복 등으로 확장되어 현대적인 색감과 소재로 재해석되고 있습니다.'],
          fittingTips: ['치맛폭과 고름이 잘 보이는 정면 이미지가 좋고, 상하 비율이 명확한 의상 이미지를 사용하면 결과 비교가 쉽습니다.'],
        },
        {
          id: 'qipao',
          name: '치파오',
          image: sharedSampleImages.qipao,
          overview: ['치파오는 몸의 세로 라인을 강조하는 중국 스타일 의상으로, 단정한 실루엣과 깔끔한 목선이 강한 인상을 만듭니다.'],
          history: ['청대 만주 복식의 흐름과 근대 상하이 패션의 재해석이 합쳐지며 오늘날 널리 알려진 형태가 자리 잡았습니다.'],
          culture: ['격식 있는 모임, 공연, 촬영, 전통문화 행사 등에서 여성스러운 우아함을 드러내는 의상으로 자주 사용됩니다.'],
          design: ['높은 칼라, 몸에 붙는 직선적인 윤곽, 옆트임, 자수나 패턴의 위치가 전체 분위기를 좌우합니다.'],
          modernUse: ['현대 드레스 형태와 결합된 치파오 스타일도 많아져 행사복이나 화보 콘셉트 의상으로 폭넓게 활용됩니다.'],
          fittingTips: ['몸선이 잘 드러나는 의상이므로 정면 얼굴 사진과 함께 상반신 비율이 안정적인 이미지를 쓰면 결과가 더 자연스럽게 보입니다.'],
        },
        {
          id: 'kimono',
          name: '기모노',
          image: sharedSampleImages.kimono,
          overview: ['기모노는 감싸는 구조와 오비 매듭이 중심이 되는 일본 전통 의상으로, 레이어와 면 분할이 분명한 것이 특징입니다.'],
          history: ['헤이안 시대 이후 여러 형식이 발전했고, 에도시대에 생활과 예복 양식이 폭넓게 정리되며 다양한 종류가 자리 잡았습니다.'],
          culture: ['성인식, 졸업식, 혼례, 다도, 전통 행사 등에서 상황에 따라 다른 문양과 소재, 소매 길이를 선택합니다.'],
          design: ['직선 패턴을 접어 입는 구조, 넓은 소매, 허리 중심의 오비, 계절감을 반영한 색과 문양이 중요합니다.'],
          modernUse: ['현대에는 관광 체험과 전통 촬영뿐 아니라, 재킷이나 원피스와 조합한 하이브리드 스타일로도 많이 보입니다.'],
          fittingTips: ['허리 중심 장식과 소매 폭이 잘 보이는 의상 이미지를 사용하면 오비와 전체 균형이 결과에서 더 잘 살아납니다.'],
        },
        {
          id: 'saree',
          name: '사리',
          image: sharedSampleImages.saree,
          overview: ['사리는 긴 천을 몸에 감아 입는 인도 대표 의상으로, 드레이프 방식과 천의 흐름이 이미지의 핵심을 이룹니다.'],
          history: ['고대 인도 복식 전통에서 출발해 지역과 공동체마다 다른 착장 방식이 발전했고, 직물 문화와 함께 긴 역사를 이어왔습니다.'],
          culture: ['결혼식, 축제, 종교 행사, 공식 모임 등에서 지역별 직물과 장식 전통을 반영해 다양하게 착용됩니다.'],
          design: ['천의 주름 처리, 어깨 위로 넘어가는 팔루, 블라우스와의 조합, 직물 문양과 테두리 장식이 중요한 요소입니다.'],
          modernUse: ['현대에는 파티웨어와 디자이너 컬렉션에서도 널리 쓰이며, 색상과 소재에 따라 전통적이면서도 현대적인 분위기를 동시에 낼 수 있습니다.'],
          fittingTips: ['드레이프가 잘 보이는 전신 의상 이미지가 가장 좋고, 배경이 복잡하지 않아야 천의 흐름이 결과에서 무너지지 않습니다.'],
        },
        {
          id: 'dress',
          name: '드레스',
          image: sharedSampleImages.dress,
          overview: ['드레스는 행사와 촬영, 공연, 공식 자리에서 자주 쓰이는 대표적인 스타일 의상으로, 실루엣과 재질 표현이 비교 포인트입니다.'],
          history: ['서양 복식 문화 속에서 시대별로 다양한 길이와 허리선, 소매 구조가 발전하며 오늘날의 포멀 드레스 스타일이 형성되었습니다.'],
          culture: ['파티, 웨딩 게스트 룩, 무대 의상, 화보 촬영 등에서 상황에 따라 길이와 볼륨, 장식 수준을 조절합니다.'],
          design: ['허리선 위치, 스커트 퍼짐, 어깨 노출 정도, 광택감, 러플과 패턴 유무가 전체 분위기를 결정합니다.'],
          modernUse: ['행사복 외에도 브랜드 촬영, SNS 콘텐츠, 룩북 제작 등 시각적 완성도가 필요한 장면에 자주 활용됩니다.'],
          fittingTips: ['원하는 길이와 볼륨이 분명한 의상 이미지를 고르면 결과에서 드레스 성격이 더 뚜렷하게 유지됩니다.'],
        },
      ],
    },
  },
  en: {
    hero: {
      eyebrow: 'AI Virtual Fitting Service',
      title: 'HAMDEVA',
      subtitle: 'Try on a wide range of outfits from a single photo.',
      body: 'Upload a face photo and an outfit image, then let AI generate a natural-looking fitting preview. Explore traditional clothing, dresses, and themed looks before you commit to a style direction.',
      primaryButton: 'Start Virtual Fitting',
      secondaryButton: 'View How It Works',
    },
    intro: {
      title: 'HAMDEVA is an AI virtual fitting service for quick outfit comparison and visual preview.',
      paragraphs: [
        'It combines a portrait and an outfit image to generate a try-on style preview before purchase, rental, styling, or content production.',
        'The service is useful when users need to compare mood, silhouette, and overall impression without committing to a final choice too early.',
        'Detailed steps belong in the How It Works page, while garment background and cultural context belong in the Sample Outfit Information page.',
      ],
    },
    features: {
      title: 'Core Features',
      items: [
        { title: 'Upload a Face Photo', description: 'A clear portrait helps the system keep identity and facial impression more consistently.' },
        { title: 'Upload an Outfit Image', description: 'A readable outfit image gives the AI stronger silhouette and design references.' },
        { title: 'Generate an AI Fitting Preview', description: 'The system creates a fitting-style output that helps compare the chosen look before committing.' },
        { title: 'Save and Reuse the Result', description: 'Generated results can be saved and used for style comparison, planning, or content preparation.' },
      ],
    },
    steps: {
      title: 'How It Works in Four Steps',
      items: [
        { step: '01', title: 'Upload a Face Photo', description: 'Use a readable portrait with visible facial features and balanced lighting.' },
        { step: '02', title: 'Choose an Outfit Image', description: 'Select a sample outfit or upload your own clothing image.' },
        { step: '03', title: 'Generate the Preview', description: 'HAMDEVA combines the two images into a virtual fitting result.' },
        { step: '04', title: 'Review and Save the Result', description: 'Compare the result, save it, and decide whether to test another look.' },
      ],
    },
    examples: {
      title: 'Use Cases',
      items: [
        { title: 'Preview Hanbok Styling', description: 'Review silhouette and color balance before a cultural event or photo session.' },
        { title: 'Test Dresses and Formalwear', description: 'Check whether a more formal look matches the tone you want to present.' },
        { title: 'Plan Event Outfits Early', description: 'Narrow down outfit direction before travel, family events, or themed shoots.' },
        { title: 'Build Social Content Drafts', description: 'Compare visual directions quickly when preparing thumbnails or concept images.' },
      ],
    },
    sampleInfo: {
      title: 'The sample outfit page is where garment-specific background lives.',
      body: 'Review outfit names, history, use cases, and design features first, then decide which style you want to test.',
      button: 'Open Sample Outfit Info',
    },
    faq: {
      title: 'Frequently Asked Questions',
      items: [
        { question: 'What kind of photo works best?', answer: 'A clear near-front portrait with visible facial features and minimal distortion usually works best.' },
        { question: 'Can I use HAMDEVA on mobile?', answer: 'Yes. The flow is designed to work on mobile as well as desktop.' },
        { question: 'How long does generation take?', answer: 'It depends on server load and image size, but the result is typically generated within tens of seconds.' },
        { question: 'Can I save the result image?', answer: 'Yes. You can download the generated result once it has finished rendering.' },
        { question: 'Should the outfit background be simple?', answer: 'A simple background helps because the AI can read the garment outline more reliably.' },
        { question: 'Does the face have to be perfectly front-facing?', answer: 'Near-front images work best, but a slight angle can still work if the face remains clear and unobstructed.' },
      ],
    },
    modal: {
      title: 'Start Virtual Fitting',
      description: 'Upload a face photo and an outfit image to generate your result.',
      notice: 'You will usually get a more natural result when the portrait is clear and the outfit image has a relatively simple background.',
      personCardTitle: 'Upload Face Photo',
      personCardBody: 'Choose a readable portrait so the system can preserve identity more naturally.',
      garmentCardTitle: 'Upload Outfit Image',
      garmentCardBody: 'Use an outfit image with a visible silhouette and readable details.',
      actionCardTitle: 'Run Generation',
      actionCardBody: 'Check your login state and credits, then run the generation.',
      actionFootnote: 'Generation time may vary depending on your images and current server conditions.',
      tipsTitle: 'Tips for Better Results',
      tips: ['Keep the face close to front-facing', 'Avoid images that are too dark', 'Show the full outfit shape clearly', 'Simple backgrounds usually help'],
      progressTitle: 'Progress',
      progressItems: ['Before Upload', 'Ready', 'Generating', 'Completed'],
      usageTitle: 'What You Can Do With the Result',
      usageItems: ['Save the generated result for later review.', 'Compare different outfits before making a decision.', 'Run another variation when you want to test a different look.'],
      resultTitle: 'Generated Result',
      retryButton: 'Generate Again',
    },
    sampleOutfits: {
      title: 'Sample Outfit Information',
      description: 'Read outfit-specific background, history, design cues, and modern use cases in one place.',
      introTitle: 'This page is for garment information, not for platform explanation.',
      introParagraphs: [
        'Each outfit entry focuses on what the garment is, where it comes from, how it is used, and what visual features define it.',
        'Use this page when you want garment context first and fitting later.',
      ],
      catalogTitle: 'Representative Outfit Guides',
      catalogBody: 'Open a card to read the outfit details and then decide whether to try that style.',
      startButton: 'Start a fitting inspired by this outfit',
      outfitLabel: 'Sample Outfit',
      guideSections: {
        overview: 'Overview',
        history: 'Origin and History',
        culture: 'Ceremony and Culture',
        design: 'Design Features',
        modernUse: 'Modern Use',
        fittingTips: 'Virtual Fitting Tips',
      },
      outfits: [
        {
          id: 'hanbok',
          name: 'Hanbok',
          image: sharedSampleImages.hanbok,
          overview: ['Hanbok is a Korean traditional outfit built around elegant curve, layered balance, and a silhouette that feels formal without becoming rigid.'],
          history: ['Its form developed over centuries and became especially recognizable during the Joseon period, where the balance between jeogori and skirt or trousers became more standardized.'],
          culture: ['Hanbok is closely connected to holidays, weddings, first-birthday celebrations, family portraits, and cultural experience settings.'],
          design: ['The ribbon, cropped top proportion, broad skirt volume, and soft movement of fabric shape the visual identity of Hanbok.'],
          modernUse: ['Modern Hanbok appears in travel photography, rental experiences, editorials, and reinterpretations designed for easier everyday wear.'],
          fittingTips: ['Choose outfit images where the ribbon placement and overall upper-and-lower proportion are easy to read.'],
        },
        {
          id: 'qipao',
          name: 'Qipao',
          image: sharedSampleImages.qipao,
          overview: ['Qipao is known for a more vertical body line, a neat collar, and a refined sense of fitted elegance.'],
          history: ['Its widely recognized modern form emerged through the interaction between Qing-era dress traditions and twentieth-century urban fashion culture.'],
          culture: ['It is often associated with formal occasions, stage presentation, and visual elegance in both heritage and modern fashion contexts.'],
          design: ['Key features include the standing collar, side slit, narrow line, and detail placement that draws attention to the body’s vertical flow.'],
          modernUse: ['Qipao-inspired dresses continue to appear in events, editorials, and occasion wear with modern materials and adjusted silhouettes.'],
          fittingTips: ['Use a portrait with stable upper-body framing so the more fitted character of the garment reads cleanly in the result.'],
        },
        {
          id: 'kimono',
          name: 'Kimono',
          image: sharedSampleImages.kimono,
          overview: ['Kimono is a wrapped Japanese garment whose visual logic depends on structure, fold discipline, and obi-centered balance.'],
          history: ['Different kimono forms developed across historical periods, with distinctions shaped by status, occasion, season, and age.'],
          culture: ['Kimono remains important in ceremonies, graduations, coming-of-age events, tea culture, and cultural presentation.'],
          design: ['Straight-line construction, broad sleeves, layered wrapping, and obi arrangement are central to how kimono reads visually.'],
          modernUse: ['It is also reinterpreted in tourism, fashion styling, hybrid streetwear looks, and editorial presentation.'],
          fittingTips: ['Choose an outfit image where sleeve width and the obi area are clearly visible.'],
        },
        {
          id: 'saree',
          name: 'Saree',
          image: sharedSampleImages.saree,
          overview: ['Saree is a draped garment whose identity depends heavily on how fabric falls, wraps, and moves across the body.'],
          history: ['It has deep roots in South Asian dress traditions and has evolved through regional styling methods, textiles, and community practice.'],
          culture: ['Saree is worn in weddings, festivals, religious events, formal gatherings, and many regionally specific ceremonial settings.'],
          design: ['Pleats, border decoration, blouse pairing, and the movement of the pallu are among the most important visual signals.'],
          modernUse: ['It remains widely used in formalwear, cultural events, designer collections, and modern occasion styling.'],
          fittingTips: ['A full-length outfit image with a readable drape is much more useful than a cropped garment reference.'],
        },
        {
          id: 'dress',
          name: 'Dress',
          image: sharedSampleImages.dress,
          overview: ['Dress is a broad style category, but formal dresses are especially useful for previewing silhouette, movement, and occasion mood.'],
          history: ['Modern dress categories developed through Western tailoring traditions, evolving through changes in waistline, skirt volume, sleeves, and fabric treatment.'],
          culture: ['Dresses are commonly used for parties, guest styling, performances, formal photo shoots, and event presentation.'],
          design: ['Length, waist emphasis, volume, shoulder treatment, sheen, and surface ornament strongly affect how the look is perceived.'],
          modernUse: ['They are now used across personal events, branded content, social media styling, and visual concept planning.'],
          fittingTips: ['Pick a garment image where the intended length and volume are obvious, otherwise the result can become visually generic.'],
        },
      ],
    },
  },
  ja: {
    hero: {
      eyebrow: 'AIバーチャルフィッティングサービス',
      title: 'HAMDEVA',
      subtitle: '写真1枚でさまざまな衣装をバーチャル試着できます。',
      body: '顔写真と衣装画像をアップロードすると、AIが自然な着用イメージを生成します。伝統衣装、ドレス、テーマ衣装などを事前に比較できます。',
      primaryButton: 'バーチャル試着を始める',
      secondaryButton: '使い方を見る',
    },
    intro: {
      title: 'HAMDEVA は衣装の印象をすばやく比較するための AI バーチャルフィッティングサービスです。',
      paragraphs: [
        '顔写真と衣装画像から試着プレビューを生成し、購入前、撮影前、イベント準備前の比較に使えます。',
        'オンライン比較、旅行前の衣装検討、コンセプト確認など、早い段階で方向性を見たい場面に向いています。',
        '使い方の詳細は使い方ページへ、衣装自体の情報はサンプル衣装情報ページへ分けています。',
      ],
    },
    features: {
      title: '主な機能',
      items: [
        { title: '顔写真アップロード', description: '顔がはっきり見える写真ほど、人物の印象が安定して保たれます。' },
        { title: '衣装画像アップロード', description: '衣装の輪郭や装飾が見やすい画像ほど、結果の再現性が上がります。' },
        { title: 'AI試着生成', description: '人物画像と衣装画像をもとに、試着比較に使える結果を生成します。' },
        { title: '結果保存と活用', description: '生成結果を保存し、別の衣装との比較や企画用のラフとして活用できます。' },
      ],
    },
    steps: {
      title: '4ステップで利用',
      items: [
        { step: '01', title: '顔写真をアップロード', description: '正面に近く、顔の特徴が見える写真を用意します。' },
        { step: '02', title: '衣装画像を選択', description: 'サンプル衣装を選ぶか、自分の衣装画像をアップロードします。' },
        { step: '03', title: '試着を生成', description: '2枚の画像をもとにAIが結果を作成します。' },
        { step: '04', title: '結果を確認・保存', description: '生成結果を見て保存し、他のスタイルと比較します。' },
      ],
    },
    examples: {
      title: '活用例',
      items: [
        { title: '韓服スタイルの確認', description: '行事や撮影の前に色味やシルエットの印象を確認できます。' },
        { title: 'ドレスやフォーマルの比較', description: 'フォーマルな衣装が自分の雰囲気に合うかを事前に見られます。' },
        { title: 'イベント衣装の事前検討', description: '旅行や家族行事、文化体験の前に方向性を絞り込めます。' },
        { title: 'SNSコンテンツの下書き', description: '複数の衣装候補を比較して、見せ方の方向性を決めやすくなります。' },
      ],
    },
    sampleInfo: {
      title: 'サンプル衣装情報では衣装ごとの特徴を先に確認できます。',
      body: '韓服、着物、チャイナドレス、サリーなどの背景や特徴を見てから試したい雰囲気を選べます。',
      button: 'サンプル衣装情報を見る',
    },
    faq: {
      title: 'よくある質問',
      items: [
        { question: 'どんな写真が向いていますか？', answer: '顔がはっきり見え、過度なフィルターのない正面寄りの写真が最も安定します。' },
        { question: 'モバイルでも使えますか？', answer: 'はい。モバイルでもアップロードから生成まで同じ流れで使えます。' },
        { question: '生成にはどれくらい時間がかかりますか？', answer: '画像サイズやサーバー状況によりますが、通常は数十秒程度です。' },
        { question: '結果画像は保存できますか？', answer: 'はい。生成が完了するとダウンロードして保存できます。' },
        { question: '衣装画像の背景は単純な方がいいですか？', answer: 'はい。背景が単純な方が衣装の輪郭をAIが読み取りやすくなります。' },
        { question: '顔は完全な正面でないとだめですか？', answer: '正面に近い写真が最適ですが、少し角度があっても顔がはっきり見えれば使えます。' },
      ],
    },
    modal: {
      title: 'バーチャル試着を始める',
      description: '顔写真と衣装画像をアップロードすると結果を生成できます。',
      notice: '正面に近い顔写真と、背景が比較的単純な衣装画像を使うとより自然な結果を得やすくなります。',
      personCardTitle: '顔写真アップロード',
      personCardBody: '顔の特徴がはっきり見える写真を使うと人物の印象が安定します。',
      garmentCardTitle: '衣装画像アップロード',
      garmentCardBody: '衣装全体の形と装飾が見やすい画像ほど結果が安定します。',
      actionCardTitle: '生成実行',
      actionCardBody: 'ログイン状態とクレジットを確認したうえで結果を生成します。',
      actionFootnote: '生成時間は画像条件とサーバー状況により変わります。',
      tipsTitle: '良い結果のためのコツ',
      tips: ['顔は正面に近く', '暗すぎる写真は避ける', '衣装全体の形を見せる', '背景はシンプルな方が有利'],
      progressTitle: '進行状況',
      progressItems: ['アップロード前', '準備完了', '生成中', '完了'],
      usageTitle: '結果の活用',
      usageItems: ['生成結果は保存できます。', '別の衣装との比較に使えます。', '気になるスタイルがあればすぐに別案を試せます。'],
      resultTitle: '生成結果',
      retryButton: 'もう一度生成',
    },
    sampleOutfits: {
      title: 'サンプル衣装情報',
      description: '衣装ごとの背景、特徴、使われ方を読むための情報ページです。',
      introTitle: 'このページは衣装情報に集中して読むためのページです。',
      introParagraphs: [
        '各衣装カードでは、名称、歴史、文化的な使われ方、デザイン特徴、現代での見られ方を確認できます。',
        'サービス紹介や使い方の説明ではなく、衣装そのものの理解を優先しています。',
      ],
      catalogTitle: '代表衣装ガイド',
      catalogBody: 'カードを開いて衣装の詳細を確認し、気になるスタイルだけを試着に進めてください。',
      startButton: 'この雰囲気で試着を始める',
      outfitLabel: 'サンプル衣装',
      guideSections: {
        overview: '概要',
        history: '起源と歴史',
        culture: '儀式と文化',
        design: 'デザイン特徴',
        modernUse: '現代活用',
        fittingTips: '試着活用ポイント',
      },
      outfits: [
        {
          id: 'hanbok',
          name: '韓服',
          image: sharedSampleImages.hanbok,
          overview: ['韓服は曲線的なシルエットと上下のバランスが特徴の韓国伝統衣装です。'],
          history: ['長い服飾史の中で発展し、朝鮮時代に現在よく知られる形が定着しました。'],
          culture: ['祝日、婚礼、家族行事、文化体験などで広く着用されます。'],
          design: ['短い上衣と広がるスカート、リボン位置、柔らかな動きが印象を決めます。'],
          modernUse: ['現代では観光体験、撮影、モダン韓服など多様な形で使われています。'],
          fittingTips: ['リボンと上下比率が見やすい衣装画像を使うと結果比較がしやすくなります。'],
        },
        {
          id: 'qipao',
          name: 'チャイナドレス',
          image: sharedSampleImages.qipao,
          overview: ['体の縦ラインを見せる中国系スタイル衣装で、整った首元と洗練された雰囲気が特徴です。'],
          history: ['清代の服飾系譜と近代都市ファッションの再解釈を通じて現在の形が広まりました。'],
          culture: ['フォーマルな場、舞台、撮影などで上品さを伝える衣装として使われます。'],
          design: ['立ち襟、細いライン、スリット、装飾配置が大きなポイントです。'],
          modernUse: ['現代ではイベント用ドレスや撮影衣装として多く再解釈されています。'],
          fittingTips: ['上半身の比率が安定した人物写真を使うと、衣装の細いラインがより自然に見えます。'],
        },
        {
          id: 'kimono',
          name: '着物',
          image: sharedSampleImages.kimono,
          overview: ['着物は包む構造と帯のバランスが中心になる日本の伝統衣装です。'],
          history: ['時代ごとに多様な形式が発展し、場面や季節、年齢に応じた違いが形成されました。'],
          culture: ['成人式、卒業式、茶道、婚礼などで今も重要な役割を持っています。'],
          design: ['直線裁ち、広い袖、重なり、帯の位置が視覚的な骨格になります。'],
          modernUse: ['観光体験、ハイブリッドファッション、撮影スタイルにも広く使われています。'],
          fittingTips: ['袖幅と帯まわりが見やすい衣装画像を選ぶと、結果で構造が崩れにくくなります。'],
        },
        {
          id: 'saree',
          name: 'サリー',
          image: sharedSampleImages.saree,
          overview: ['サリーは布の流れと巻き方そのものがスタイルの中心になる代表的な衣装です。'],
          history: ['南アジアの長い服飾伝統の中で地域ごとに異なる着装法が発展しました。'],
          culture: ['結婚式、祭礼、宗教行事、公式な集まりで幅広く着用されます。'],
          design: ['プリーツ、縁飾り、ブラウスとの組み合わせ、肩に流れる布の処理が重要です。'],
          modernUse: ['現代でもフォーマル、デザイナーコレクション、文化イベントでよく用いられます。'],
          fittingTips: ['全身のドレープが見える衣装画像を使うことが、結果の自然さに直結します。'],
        },
        {
          id: 'dress',
          name: 'ドレス',
          image: sharedSampleImages.dress,
          overview: ['ドレスはシルエット、丈感、素材感の差が比較価値を生みやすい代表カテゴリです。'],
          history: ['西洋服飾の変化の中で、ウエスト位置やスカート量、肩や袖の処理が多様に発展しました。'],
          culture: ['パーティー、撮影、舞台、フォーマルイベントなどで広く使われます。'],
          design: ['丈、ボリューム、肩まわり、光沢、フリルや装飾の有無が印象を左右します。'],
          modernUse: ['個人イベントだけでなくブランド撮影やSNSコンテンツにも多く用いられます。'],
          fittingTips: ['丈感とボリュームがはっきり分かる衣装画像を使うと結果がより具体的になります。'],
        },
      ],
    },
  },
  zh: {
    hero: {
      eyebrow: 'AI 虚拟试衣服务',
      title: 'HAMDEVA',
      subtitle: '用一张照片快速体验多种服装风格。',
      body: '上传人像照片和服装图片后，AI 会生成自然的试穿预览。你可以先比较传统服饰、礼服和主题造型，再决定下一步。',
      primaryButton: '开始虚拟试衣',
      secondaryButton: '查看使用方法',
    },
    intro: {
      title: 'HAMDEVA 是一个用于快速比较服装印象的 AI 虚拟试衣服务。',
      paragraphs: [
        '它把人像照片与服装图片结合起来，先给出试穿预览，适合在购买、租赁、活动准备或拍摄前快速比较。',
        '当你只是想先判断氛围、轮廓和整体印象时，这种预览会比直接做最终决定更高效。',
        '使用步骤请看使用方法页面，服装背景信息请看示例服装信息页面。',
      ],
    },
    features: {
      title: '核心功能',
      items: [
        { title: '上传人像照片', description: '脸部清晰可见的照片更有利于保留人物印象。' },
        { title: '上传服装图片', description: '服装轮廓和细节越清楚，结果越稳定。' },
        { title: 'AI 虚拟试衣生成', description: '系统根据人物图和服装图生成便于比较的试穿结果。' },
        { title: '保存并继续比较', description: '生成完成后可保存结果，用于下一轮风格筛选。' },
      ],
    },
    steps: {
      title: '四步完成试衣',
      items: [
        { step: '01', title: '上传人像照片', description: '准备一张接近正面的清晰人像照片。' },
        { step: '02', title: '选择服装图片', description: '可选择示例服装，也可上传自己的服装图片。' },
        { step: '03', title: '生成试穿结果', description: 'AI 根据两张图片生成虚拟试穿结果。' },
        { step: '04', title: '查看并保存', description: '确认结果后保存，并与其他风格继续比较。' },
      ],
    },
    examples: {
      title: '使用场景',
      items: [
        { title: '韩服风格预览', description: '在活动或拍摄前先确认色彩和轮廓是否合适。' },
        { title: '礼服 / 正装测试', description: '提前判断正式风格是否符合想要传达的气质。' },
        { title: '活动服装预筛选', description: '在旅行、家庭活动、文化体验前先缩小选择范围。' },
        { title: '社交内容草图', description: '快速比较不同服装方向，用于封面或视觉方案准备。' },
      ],
    },
    sampleInfo: {
      title: '示例服装信息页面专门整理服装本身的背景与特点。',
      body: '先看韩服、和服、旗袍、纱丽等服装的名称、用途与设计特征，再决定想测试哪种风格。',
      button: '查看示例服装信息',
    },
    faq: {
      title: '常见问题',
      items: [
        { question: '什么样的照片效果更好？', answer: '接近正面、脸部清晰、不过度滤镜化的人像通常最稳定。' },
        { question: '手机上也能使用吗？', answer: '可以，移动端也支持上传、生成和保存。' },
        { question: '生成需要多久？', answer: '会受到服务器状态和图片大小影响，一般在几十秒左右。' },
        { question: '结果图片可以保存吗？', answer: '可以，生成完成后可以下载保存结果图片。' },
        { question: '服装图片背景越简单越好吗？', answer: '是的，背景越简单，AI 越容易识别服装轮廓和关键细节。' },
        { question: '一定要正面人像吗？', answer: '接近正面的照片最好，但只要脸部清晰、遮挡不多，轻微角度也可以使用。' },
      ],
    },
    modal: {
      title: '开始虚拟试衣',
      description: '上传人像照片和服装图片后即可生成结果。',
      notice: '如果使用接近正面的清晰人像和背景较简单的服装图片，通常会得到更自然的结果。',
      personCardTitle: '上传人像照片',
      personCardBody: '脸部特征清晰的人像更有利于保留人物印象。',
      garmentCardTitle: '上传服装图片',
      garmentCardBody: '服装整体形状和装饰越清楚，结果越稳定。',
      actionCardTitle: '执行生成',
      actionCardBody: '确认登录状态与积分后即可开始生成。',
      actionFootnote: '生成时间会根据图片条件和服务器状态有所变化。',
      tipsTitle: '获得更好结果的小提示',
      tips: ['脸部尽量接近正面', '避免过暗照片', '让服装整体轮廓清晰可见', '背景越简单越有利'],
      progressTitle: '进度状态',
      progressItems: ['上传前', '准备完成', '生成中', '已完成'],
      usageTitle: '结果可用于',
      usageItems: ['保存生成结果以便后续查看。', '比较不同服装方案。', '如果想换风格，可以立即再测另一套服装。'],
      resultTitle: '生成结果',
      retryButton: '重新生成',
    },
    sampleOutfits: {
      title: '示例服装信息',
      description: '集中查看服装背景、设计特征、使用场景与现代应用。',
      introTitle: '这个页面只负责服装信息，不重复介绍平台本身。',
      introParagraphs: [
        '每张服装卡片都会整理名称、历史、文化场景、设计要点和现代使用方式。',
        '如果你想先理解服装，再决定是否试穿，这个页面就是入口。',
      ],
      catalogTitle: '代表服装指南',
      catalogBody: '先打开卡片阅读服装细节，再决定是否进入试穿流程。',
      startButton: '以这种风格开始试衣',
      outfitLabel: '示例服装',
      guideSections: {
        overview: '概述',
        history: '起源与历史',
        culture: '礼仪与文化',
        design: '设计特点',
        modernUse: '现代应用',
        fittingTips: '虚拟试衣要点',
      },
      outfits: [
        {
          id: 'hanbok',
          name: '韩服',
          image: sharedSampleImages.hanbok,
          overview: ['韩服以柔和曲线和上下比例形成独特气质，是韩国代表性的传统服饰。'],
          history: ['其形制经历长期发展，并在朝鲜时代形成今天最常见的视觉印象。'],
          culture: ['节日、婚礼、周岁、家庭合影和文化体验等场景都经常穿着韩服。'],
          design: ['短上衣、宽裙摆、系带位置和整体流动感是韩服最重要的识别点。'],
          modernUse: ['现代韩服常见于旅游拍摄、体验租赁、时尚改良设计等场景。'],
          fittingTips: ['选择能清楚看到系带和上下比例的服装图，会更利于结果比较。'],
        },
        {
          id: 'qipao',
          name: '旗袍',
          image: sharedSampleImages.qipao,
          overview: ['旗袍强调纵向线条和利落轮廓，整体气质偏端庄优雅。'],
          history: ['现代旗袍的知名形态是在传统服饰脉络与近代都市时尚互相影响中形成的。'],
          culture: ['常见于正式活动、舞台、拍摄与具有典雅氛围的穿着场景。'],
          design: ['立领、贴身线条、开衩以及装饰位置是判断旗袍风格的关键。'],
          modernUse: ['今天的旗袍元素也常被融入礼服与活动服装中。'],
          fittingTips: ['使用上半身比例稳定的人像照片，更容易让修身线条表现自然。'],
        },
        {
          id: 'kimono',
          name: '和服',
          image: sharedSampleImages.kimono,
          overview: ['和服以包裹结构和腰带平衡为核心，视觉逻辑非常明确。'],
          history: ['不同历史时期发展出多样形式，并根据年龄、季节和场合产生区分。'],
          culture: ['成人式、毕业礼、茶道、婚礼等传统场景中仍然常见。'],
          design: ['直线剪裁、宽袖、重叠穿法与腰带区域构成和服的主要识别点。'],
          modernUse: ['如今也常见于旅游体验、时尚混搭与摄影造型。'],
          fittingTips: ['选择能看清袖宽和腰带区域的服装图，会让结果更稳定。'],
        },
        {
          id: 'saree',
          name: '纱丽',
          image: sharedSampleImages.saree,
          overview: ['纱丽是一种以布料披裹方式为核心的服装，垂坠感极其重要。'],
          history: ['它植根于南亚长期的服饰传统，并在不同地区发展出不同穿法。'],
          culture: ['婚礼、节庆、宗教活动和正式聚会中都能看到纱丽。'],
          design: ['褶裥、边饰、上衣搭配以及肩部布料的走势是视觉重点。'],
          modernUse: ['纱丽如今也广泛用于正式场合、设计师系列和文化活动。'],
          fittingTips: ['尽量使用能完整看见垂坠走势的全身服装图，而不是局部裁切图。'],
        },
        {
          id: 'dress',
          name: '礼服',
          image: sharedSampleImages.dress,
          overview: ['礼服类服装很适合做试衣预览，因为裙摆体量、长度和材质感都便于比较。'],
          history: ['现代礼服形态在西方服装发展中不断变化，腰线、裙型和肩部结构都有明显演进。'],
          culture: ['常见于宴会、活动、舞台、正式拍摄等需要完整造型感的场景。'],
          design: ['长度、蓬度、肩线、光泽和装饰元素会直接影响整体气质。'],
          modernUse: ['如今礼服也常用于品牌拍摄、社交内容和视觉概念制作。'],
          fittingTips: ['优先选择长度与体量很明确的服装图，否则结果容易变得笼统。'],
        },
      ],
    },
  },
};

export const getLandingContent = (lang: LanguageCode): LandingContent => {
  if (lang === 'ko' || lang === 'ja' || lang === 'zh') {
    return landingContent[lang];
  }

  return landingContent.en;
};
