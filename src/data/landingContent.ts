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
    breedTitle: string;
    breedBody: string;
    catalogTitle: string;
    catalogBody: string;
    startButton: string;
    breedStartButton: string;
    outfitLabel: string;
    breedSections: {
      overview: string;
      appearance: string;
      styling: string;
      photoTips: string;
      fittingTips: string;
    };
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
      eyebrow: 'AI Pet Fitting Service',
      title: 'HAMDEVA',
      subtitle: '',
      body:
        '강아지나 고양이 사진과 의상 이미지로 귀여운 펫 피팅 미리보기를 바로 만들 수 있어요.',
      primaryButton: '펫 피팅 시작',
      secondaryButton: '사용 방법',
    },
    intro: {
      title: 'HAMDEVA는 반려동물 사진으로 다양한 의상 분위기를 빠르게 비교해볼 수 있는 AI 서비스입니다.',
      paragraphs: [
        '강아지나 고양이 사진을 올리고 의상 이미지를 더하면, 실제로 구매하거나 촬영하기 전에 어울리는 느낌을 먼저 볼 수 있습니다.',
        '귀여운 일상룩, 시즌 코스튬, 생일 의상, 기념 촬영용 스타일처럼 반려동물에게 어떤 분위기가 잘 맞는지 빠르게 확인할 수 있습니다.',
        '사용 방법에서는 펫 사진 준비법을, 샘플 의상 정보에서는 반려동물에게 어울릴 만한 스타일 아이디어를 이어서 볼 수 있습니다.',
      ],
    },
    features: {
      title: '이런 점이 좋아요',
      items: [
        {
          title: '반려동물 사진 업로드',
          description: '강아지나 고양이 사진 한 장으로 바로 시작할 수 있어요.',
        },
        {
          title: '의상 이미지 업로드',
          description: '원하는 옷 이미지를 넣으면 분위기를 빠르게 바꿔볼 수 있어요.',
        },
        {
          title: '펫 피팅 미리보기 생성',
          description: 'AI가 귀엽고 보기 쉬운 결과 이미지를 바로 만들어줘요.',
        },
        {
          title: '결과 저장 및 공유',
          description: '마음에 드는 결과는 저장하고 바로 공유할 수 있어요.',
        },
      ],
    },
    steps: {
      title: '3단계로 끝나요',
      items: [
        { step: '01', title: '반려동물 사진 업로드', description: '강아지나 고양이 사진을 넣어요.' },
        { step: '02', title: '의상 이미지 추가', description: '입혀보고 싶은 의상을 고르거나 올려요.' },
        { step: '03', title: '생성하고 저장', description: '결과를 보고 저장하거나 다시 비교해요.' },
      ],
    },
    examples: {
      title: '이럴 때 좋아요',
      items: [
        { title: 'SNS용 귀여운 이미지', description: '바로 저장해서 가볍게 공유하기 좋아요.' },
        { title: '프로필 사진 아이디어', description: '반려동물 프로필용 스타일을 빠르게 비교해요.' },
        { title: '명절·기념일 코스튬', description: '특별한 날 룩을 먼저 확인해볼 수 있어요.' },
        { title: '재미있는 의상 아이디어', description: '새로운 분위기를 가볍게 테스트하기 좋아요.' },
      ],
    },
    sampleInfo: {
      title: '지금 바로 펫 피팅을 시작해보세요',
      body: '귀여운 반려동물 룩을 바로 만들고, 더 많은 스타일은 샘플 의상 페이지에서 이어서 볼 수 있어요.',
      button: '샘플 의상 둘러보기',
    },
    faq: {
      title: '자주 묻는 질문',
      items: [
        { question: '어떤 사진이 잘 나오나요?', answer: '정면에 가깝고 얼굴이 선명하며 과한 필터가 없는 사진이 가장 안정적입니다.' },
        { question: '모바일에서도 가능한가요?', answer: '네. 모바일에서도 업로드와 생성 흐름을 그대로 이용할 수 있으며, 결과 저장도 가능합니다.' },
        { question: '생성 시간은 얼마나 걸리나요?', answer: '서버 상태와 이미지 크기에 따라 다르지만, 일반적으로 수십 초 안팎에서 결과를 받게 됩니다.' },
        { question: '결과 이미지는 저장할 수 있나요?', answer: '생성이 끝난 뒤 다운로드 버튼을 통해 결과 이미지를 저장할 수 있습니다.' },
        { question: '의상 배경은 단순해야 하나요?', answer: '가능하면 단순한 배경이 좋습니다. 의상 외곽과 디테일이 잘 보여야 AI가 더 안정적으로 읽습니다.' },
        { question: '정면 사진만 가능한가요?', answer: '정면에 가까운 사진이 가장 좋지만, 약간의 각도가 있는 사진도 사용할 수 있습니다. 다만 얼굴 가림과 왜곡은 적을수록 좋습니다.' },
      ],
    },
    modal: {
      title: 'AI 펫 의상 생성',
      description: '반려동물 사진과 의상 이미지로 펫 피팅 미리보기를 몇 초 안에 만들 수 있어요.',
      notice: '',
      personCardTitle: '반려동물 사진 업로드',
      personCardBody: '',
      garmentCardTitle: '의상 이미지 업로드',
      garmentCardBody: '',
      actionCardTitle: '생성하기',
      actionCardBody: '',
      actionFootnote: '생성 시간은 이미지와 서버 상태에 따라 달라질 수 있습니다.',
      resultTitle: '펫 피팅 결과',
      retryButton: '다시 생성하기',
    },
    sampleOutfits: {
      title: '샘플 의상',
      description: '반려동물에게 어울릴 만한 의상 분위기와 스타일 정보를 살펴보는 페이지입니다.',
      introTitle: '이 페이지에서는 펫 피팅에 참고할 샘플 의상만 정리해서 확인할 수 있습니다.',
      introParagraphs: [
        '각 카드에서는 의상 이름과 분위기, 시각적 특징을 먼저 읽은 뒤 펫 피팅으로 바로 연결할 수 있습니다.',
        '전통풍 스타일, 행사 룩, 기념 촬영용 코스튬처럼 의상 자체의 분위기 비교에 집중하도록 구성했습니다.',
      ],
      breedTitle: '샘플 품종',
      breedBody: '샘플 품종 이미지는 펫 피팅을 시작하기 전에 얼굴 비율과 털 볼륨, 장식 배치를 미리 비교해 보는 기준점으로 활용할 수 있습니다.',
      catalogTitle: '샘플 의상',
      catalogBody: '아래 카드에서 원하는 의상 분위기를 살펴본 뒤 상세 내용을 열어보세요.',
      startButton: '이 스타일로 펫 피팅 시작',
      breedStartButton: '이 품종 샘플로 시작',
      outfitLabel: '샘플 의상',
      breedSections: {
        overview: '개요',
        appearance: '외형 포인트',
        styling: '스타일링 포인트',
        photoTips: '사진 선택 팁',
        fittingTips: '가상피팅 활용 포인트',
      },
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
      eyebrow: 'AI Pet Fitting Service',
      title: 'HAMDEVA',
      subtitle: 'Dress your pet in seconds',
      body: 'Upload a photo of your dog or cat and instantly try different outfits with AI. HAMDEVA helps you create cute pet outfit previews for fun, sharing, and style inspiration.',
      primaryButton: 'Start Pet Fitting',
      secondaryButton: 'How to Use',
    },
    intro: {
      title: 'HAMDEVA helps you preview cute outfits on your dog or cat before you pick a final look.',
      paragraphs: [
        'Use a pet photo and an outfit image to create a playful fitting preview before you shop, plan a costume, or prepare a themed photo.',
        'It works well for dogs and cats when you want to compare mood, cuteness, and overall styling direction quickly.',
        'Check How It Works for the simple flow and Sample Outfits for more style inspiration.',
      ],
    },
    features: {
      title: 'What you can do',
      items: [
        { title: 'Upload your pet photo', description: 'Start with one clear dog or cat photo.' },
        { title: 'Add an outfit image', description: 'Try a costume or style image in seconds.' },
        { title: 'Generate the preview', description: 'See a cute result without extra editing.' },
        { title: 'Save and share', description: 'Keep your favorite look and share it fast.' },
      ],
    },
    steps: {
      title: 'How it works',
      items: [
        { step: '01', title: 'Upload your pet photo', description: 'Choose a clear dog or cat photo.' },
        { step: '02', title: 'Add an outfit image', description: 'Use a sample outfit or your own image.' },
        { step: '03', title: 'Generate and download', description: 'Create the preview, then save or share it.' },
      ],
    },
    examples: {
      title: 'Perfect for',
      items: [
        { title: 'Cute social posts', description: 'Make fast, shareable pet outfit images.' },
        { title: 'Pet profile images', description: 'Test a playful look for your pet profile.' },
        { title: 'Holiday costumes', description: 'Preview seasonal and special-day outfits.' },
        { title: 'Fun outfit ideas', description: 'Try different looks before choosing one.' },
      ],
    },
    sampleInfo: {
      title: 'Try it now',
      body: 'Create your pet outfit in seconds, or browse sample outfits when you want more ideas.',
      button: 'Explore Sample Outfits',
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
      title: 'AI Pet Outfit Generator',
      description: 'Upload your pet photo and outfit image to generate an AI pet fitting preview in seconds.',
      notice: 'Use a clear dog or cat photo and a simple outfit image to get a cleaner pet fitting preview.',
      personCardTitle: 'Upload Pet Photo',
      personCardBody: 'Choose a clear dog or cat photo so the system can preserve your pet’s look more naturally.',
      garmentCardTitle: 'Upload Outfit Image',
      garmentCardBody: 'Use an outfit image with a visible silhouette and readable details.',
      actionCardTitle: 'Generate Pet Preview',
      actionCardBody: 'Check your login state and credits, then generate the pet fitting preview.',
      actionFootnote: 'Generation time may vary depending on your images and current server conditions.',
      tipsTitle: 'Tips for Better Results',
      tips: ['Use a clear front-facing dog or cat photo', 'Avoid images that are too dark', 'Show the full outfit shape clearly', 'Simple backgrounds usually help'],
      progressTitle: 'Progress',
      progressItems: ['Before Upload', 'Ready', 'Generating', 'Completed'],
      usageTitle: 'What You Can Do With the Result',
      usageItems: ['Save the generated pet look for later review.', 'Compare different outfits before making a choice.', 'Run another variation when you want to test a different look.'],
      resultTitle: 'Pet Fitting Result',
      retryButton: 'Generate Again',
    },
    sampleOutfits: {
      title: 'Sample Outfits',
      description: 'Browse outfit directions and style references that can work well for your dog or cat.',
      introTitle: 'This page focuses on sample outfits only.',
      introParagraphs: [
        'Each card is meant to help you review outfit mood, costume structure, and styling direction before you generate.',
        'Use this page when you want to compare outfit references first and keep the focus on garment information.',
      ],
      breedTitle: 'Sample Breeds',
      breedBody: 'Sample breed images help you compare face ratio, fur shape, and styling balance before you switch to your own pet photo.',
      catalogTitle: 'Sample Outfits',
      catalogBody: 'Open a card to read the outfit details and decide whether to try that look on your pet.',
      startButton: 'Start pet fitting with this style',
      breedStartButton: 'Start with this breed sample',
      outfitLabel: 'Sample Outfit',
      breedSections: {
        overview: 'Overview',
        appearance: 'Appearance Points',
        styling: 'Styling Notes',
        photoTips: 'Photo Tips',
        fittingTips: 'Virtual Fitting Tips',
      },
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
      eyebrow: 'AI ペットフィッティングサービス',
      title: 'HAMDEVA',
      subtitle: 'ペットの衣装を数秒で試せます。',
      body: '犬や猫の写真と衣装画像を使って、AI ですぐにかわいいペット衣装プレビューを作れます。',
      primaryButton: 'ペットフィッティングを始める',
      secondaryButton: '使い方を見る',
    },
    intro: {
      title: 'HAMDEVA は愛犬や愛猫の衣装イメージをすばやく試せる AI サービスです。',
      paragraphs: [
        '犬や猫の写真と衣装画像を組み合わせて、購入前や撮影前にかわいい見た目を先に確認できます。',
        '季節イベント、誕生日、記念撮影、SNS 投稿用のコスチューム比較に向いています。',
        '使い方は使い方ページで、衣装の雰囲気探しはサンプル衣装ページで確認できます。',
      ],
    },
    features: {
      title: 'できること',
      items: [
        { title: 'ペット写真をアップロード', description: '犬や猫の写真 1 枚ですぐ始められます。' },
        { title: '衣装画像を追加', description: '試したい衣装の雰囲気をすぐに変えられます。' },
        { title: 'プレビュー生成', description: 'かわいい結果をすぐに確認できます。' },
        { title: '保存して共有', description: '気に入った結果を保存して見せられます。' },
      ],
    },
    steps: {
      title: '3ステップで完了',
      items: [
        { step: '01', title: 'ペット写真をアップロード', description: '犬や猫の写真を選びます。' },
        { step: '02', title: '衣装画像を追加', description: 'サンプル衣装または自分の画像を使います。' },
        { step: '03', title: '生成して保存', description: '結果を作って保存または共有します。' },
      ],
    },
    examples: {
      title: 'こんな時に便利',
      items: [
        { title: 'SNS 投稿', description: 'かわいいペット画像をすぐ作れます。' },
        { title: 'プロフィール画像', description: 'ペットの新しい雰囲気を試せます。' },
        { title: 'イベント衣装', description: '特別な日のコスチューム確認に便利です。' },
        { title: '楽しい着せ替え案', description: '気軽にいろいろな衣装を試せます。' },
      ],
    },
    sampleInfo: {
      title: '今すぐ試してみましょう',
      body: 'ペット衣装プレビューをすぐ作るか、サンプル衣装で先にアイデアを探せます。',
      button: 'サンプル衣装を見る',
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
      title: 'AI ペット衣装ジェネレーター',
      description: 'ペット写真と衣装画像をアップロードすると、AI ペットフィッティングプレビューをすぐ生成できます。',
      notice: '犬や猫の写真と衣装画像を選ぶだけで、すぐにペットフィッティングを始められます。',
      personCardTitle: 'ペット写真アップロード',
      personCardBody: '顔と体の形が見やすいペット写真を使うと、見た目が安定しやすくなります。',
      garmentCardTitle: '衣装画像アップロード',
      garmentCardBody: '衣装全体の形と装飾が見やすい画像ほど結果が安定します。',
      actionCardTitle: 'ペットルック生成',
      actionCardBody: 'ログイン状態とクレジットを確認したうえで、ペット衣装プレビューを生成します。',
      actionFootnote: '生成時間は画像条件とサーバー状況により変わります。',
      tipsTitle: '良い結果のためのコツ',
      tips: ['犬や猫の顔が見やすい写真を使う', '暗すぎる写真は避ける', '衣装全体の形を見せる', '背景はシンプルな方が有利'],
      progressTitle: '進行状況',
      progressItems: ['アップロード前', '準備完了', '生成中', '完了'],
      usageTitle: '結果の活用',
      usageItems: ['生成結果は保存できます。', '別のペット衣装との比較に使えます。', '気になるスタイルがあればすぐに別案を試せます。'],
      resultTitle: 'ペットフィッティング結果',
      retryButton: 'もう一度生成',
    },
    sampleOutfits: {
      title: 'サンプル衣装',
      description: 'ペットに合う衣装の雰囲気とスタイル情報を見るためのページです。',
      introTitle: 'このページではサンプル衣装だけをまとめて確認できます。',
      introParagraphs: [
        '各カードでは衣装名や雰囲気、見た目の特徴を確認してから試したいルックを選べます。',
        '伝統風スタイルやイベント用ルックなど、衣装そのものの比較に集中できるようにしています。',
      ],
      breedTitle: 'サンプル品種',
      breedBody: 'サンプル品種画像は、顔の比率や毛のボリューム、首まわり装飾の見え方を先に比べるための基準として使えます。',
      catalogTitle: 'サンプル衣装',
      catalogBody: 'カードを開いて衣装の詳細を確認し、気になるルックだけを試してください。',
      startButton: 'このスタイルでペット試着を始める',
      breedStartButton: 'この品種サンプルで始める',
      outfitLabel: 'サンプル衣装',
      breedSections: {
        overview: '概要',
        appearance: '見た目のポイント',
        styling: 'スタイリングポイント',
        photoTips: '写真選びのコツ',
        fittingTips: '試着活用ポイント',
      },
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
      eyebrow: 'AI 宠物试衣服务',
      title: 'HAMDEVA',
      subtitle: '几秒内给你的宠物换上不同造型',
      body: '上传狗狗或猫咪照片，再加一张服装图片，就能立刻生成可爱的宠物穿搭预览。',
      primaryButton: '开始宠物试衣',
      secondaryButton: '查看使用方法',
    },
    intro: {
      title: 'HAMDEVA 是一个让你快速预览宠物穿搭效果的 AI 服务。',
      paragraphs: [
        '把狗狗或猫咪的照片与服装图片结合起来，就能在购买、拍摄或活动准备前先看宠物造型效果。',
        '它适合用来比较可爱度、节日感、主题风格和整体氛围，而不必一开始就做最终决定。',
        '具体操作请看使用方法页面，更多风格灵感请看示例服装页面。',
      ],
    },
    features: {
      title: '你可以这样用',
      items: [
        { title: '上传宠物照片', description: '一张狗狗或猫咪照片就能开始。' },
        { title: '添加服装图片', description: '快速更换你想试的服装风格。' },
        { title: '生成预览', description: '马上看到可爱的试衣结果。' },
        { title: '保存并分享', description: '把喜欢的结果保存下来再分享。' },
      ],
    },
    steps: {
      title: '三步完成',
      items: [
        { step: '01', title: '上传宠物照片', description: '选择一张清晰的狗狗或猫咪照片。' },
        { step: '02', title: '添加服装图片', description: '使用示例服装或自己的图片。' },
        { step: '03', title: '生成并保存', description: '生成结果后即可保存或分享。' },
      ],
    },
    examples: {
      title: '适合这些场景',
      items: [
        { title: '社交分享图片', description: '快速生成可爱的宠物穿搭图。' },
        { title: '宠物头像灵感', description: '先试试不同风格再决定。' },
        { title: '节日服装', description: '提前看节日或纪念日造型。' },
        { title: '有趣的穿搭点子', description: '轻松测试各种服装方向。' },
      ],
    },
    sampleInfo: {
      title: '现在就试试看',
      body: '先直接生成宠物穿搭预览，或者到示例服装页找更多灵感。',
      button: '查看示例服装',
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
      title: 'AI 宠物穿搭生成器',
      description: '上传宠物照片和服装图片，几秒内生成 AI 宠物试穿预览。',
      notice: '选好狗狗或猫咪照片和服装图片后，就可以立即开始宠物试穿。',
      personCardTitle: '上传宠物照片',
      personCardBody: '脸部和身体轮廓清楚的宠物照片更有利于保留外观特征。',
      garmentCardTitle: '上传服装图片',
      garmentCardBody: '服装整体形状和装饰越清楚，结果越稳定。',
      actionCardTitle: '生成宠物预览',
      actionCardBody: '确认登录状态与积分后即可生成宠物穿搭预览。',
      actionFootnote: '生成时间会根据图片条件和服务器状态有所变化。',
      tipsTitle: '获得更好结果的小提示',
      tips: ['使用清晰的狗狗或猫咪正面照片', '避免过暗照片', '让服装整体轮廓清晰可见', '背景越简单越有利'],
      progressTitle: '进度状态',
      progressItems: ['上传前', '准备完成', '生成中', '已完成'],
      usageTitle: '结果可用于',
      usageItems: ['保存生成结果以便后续查看。', '比较不同宠物服装方案。', '如果想换风格，可以立即再测另一套服装。'],
      resultTitle: '宠物试衣结果',
      retryButton: '重新生成',
    },
    sampleOutfits: {
      title: '示例服装',
      description: '集中查看适合狗狗或猫咪参考的服装方向与风格信息。',
      introTitle: '这个页面只整理示例服装内容。',
      introParagraphs: [
        '每张卡片都会先介绍服装氛围、造型重点和视觉方向，再决定是否进入生成。',
        '这里重点放在服装本身，方便你先比较不同服装参考。',
      ],
      breedTitle: '示例品种',
      breedBody: '示例品种图片适合先比较脸部比例、毛发轮廓和颈部装饰的摆放效果。',
      catalogTitle: '示例服装',
      catalogBody: '先打开卡片看服装细节，再决定是否进入宠物试衣流程。',
      startButton: '用这种风格开始宠物试衣',
      breedStartButton: '用这个品种示例开始',
      outfitLabel: '示例服装',
      breedSections: {
        overview: '概述',
        appearance: '外观重点',
        styling: '造型重点',
        photoTips: '选图提示',
        fittingTips: '虚拟试衣要点',
      },
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
