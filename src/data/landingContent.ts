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
      subtitle: '내 반려동물에게 다양한 의상을 바로 입혀보세요.',
      body:
        '강아지나 고양이 사진과 의상 이미지를 올리면 AI가 귀엽고 자연스러운 펫 의상 미리보기를 생성합니다. 테마 의상, 기념일 룩, 특별한 날 스타일을 빠르게 비교해 보세요.',
      primaryButton: '펫 피팅 시작',
      secondaryButton: '샘플 의상 보기',
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
      title: '핵심 기능',
      items: [
        {
          title: '반려동물 사진 업로드',
          description: '강아지나 고양이의 얼굴과 몸 형태가 잘 보이는 사진일수록 결과가 더 안정적입니다.',
        },
        {
          title: '의상 이미지 업로드',
          description: '의상 윤곽과 장식이 잘 보이는 이미지를 넣으면 펫 의상 분위기가 더 깔끔하게 반영됩니다.',
        },
        {
          title: '펫 피팅 미리보기 생성',
          description: '반려동물 사진과 의상 이미지를 바탕으로 귀엽고 공유하기 좋은 결과 이미지를 만듭니다.',
        },
        {
          title: '결과 저장 및 공유',
          description: '완성된 결과는 저장하거나 공유해서 다음 의상 아이디어를 더 쉽게 고를 수 있습니다.',
        },
      ],
    },
    steps: {
      title: '펫 피팅 4단계',
      items: [
        { step: '01', title: '반려동물 사진 업로드', description: '강아지나 고양이의 얼굴과 몸이 잘 보이는 사진을 준비합니다.' },
        { step: '02', title: '의상 이미지 선택', description: '샘플 의상을 고르거나 직접 의상 이미지를 올립니다.' },
        { step: '03', title: '펫 룩 생성', description: '준비된 두 이미지를 바탕으로 AI가 반려동물 스타일 미리보기를 생성합니다.' },
        { step: '04', title: '결과 저장 및 공유', description: '생성 결과를 저장하고 다른 의상과 비교하거나 공유합니다.' },
      ],
    },
    examples: {
      title: '활용 예시',
      items: [
        { title: '명절 펫 의상 미리보기', description: '특별한 날 입힐 테마 의상이 우리 반려동물에게 어울리는지 먼저 볼 수 있습니다.' },
        { title: '전통/테마 코스튬 테스트', description: '귀여운 전통풍 의상이나 콘셉트룩을 빠르게 비교해 볼 수 있습니다.' },
        { title: '생일 룩 준비', description: '생일, 파티, 기념 촬영 전에 어떤 스타일이 더 잘 맞는지 확인할 수 있습니다.' },
        { title: 'SNS 공유용 이미지 제작', description: '반려동물의 귀여운 룩을 만들어 저장하고 공유용 시안으로 활용할 수 있습니다.' },
      ],
    },
    sampleInfo: {
      title: '반려동물에게 어울릴 샘플 의상을 먼저 살펴볼 수 있습니다.',
      body: '테마별 스타일과 의상 분위기를 본 뒤, 내 반려동물에게 어떤 룩이 잘 맞을지 정하고 바로 피팅을 시작해 보세요.',
      button: '샘플 의상 보기',
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
      title: '펫 피팅 시작',
      description: '반려동물 사진과 의상 이미지를 업로드하면 결과를 생성합니다.',
      notice: '강아지나 고양이의 얼굴이 잘 보이는 사진과 배경이 비교적 단순한 의상 이미지를 사용하면 더 자연스러운 결과를 얻을 수 있습니다.',
      personCardTitle: '반려동물 사진 업로드',
      personCardBody: '얼굴과 몸 형태가 잘 보이는 반려동물 사진을 준비하면 결과가 더 자연스럽습니다.',
      garmentCardTitle: '의상 이미지 업로드',
      garmentCardBody: '의상 전체 형태와 장식이 잘 보이는 이미지를 사용할수록 펫 스타일 미리보기가 더 안정적입니다.',
      actionCardTitle: '펫 룩 생성',
      actionCardBody: '로그인 상태와 크레딧을 확인한 뒤 반려동물 의상 결과 이미지를 생성합니다.',
      actionFootnote: '생성 시간은 이미지와 서버 상태에 따라 달라질 수 있습니다.',
      tipsTitle: '좋은 결과를 위한 팁',
      tips: ['강아지나 고양이 얼굴이 잘 보이게', '정면 또는 반정면 사진 사용', '의상 전체 형태가 잘 보이게', '배경이 단순할수록 유리'],
      progressTitle: '진행 상태',
      progressItems: ['업로드 전', '준비 완료', '생성 중', '완료'],
      usageTitle: '결과 활용 안내',
      usageItems: ['생성된 펫 룩은 저장해 둘 수 있습니다.', '서로 다른 펫 의상을 비교용 시안으로 확인할 수 있습니다.', '마음에 드는 스타일이 보이면 다른 의상과 바로 다시 비교할 수 있습니다.'],
      resultTitle: '펫 피팅 결과',
      retryButton: '다시 생성하기',
    },
    sampleOutfits: {
      title: '샘플 의상',
      description: '반려동물에게 어울릴 만한 샘플 품종과 의상 분위기를 함께 살펴보는 페이지입니다.',
      introTitle: '이 페이지에서는 펫 피팅에 참고할 샘플 품종과 샘플 의상을 함께 확인할 수 있습니다.',
      introParagraphs: [
        '왼쪽에서는 샘플 품종 이미지를 열어 얼굴 윤곽과 털 실루엣, 목 주변 장식이 어떻게 보일지 살펴볼 수 있습니다.',
        '오른쪽에서는 의상 카드별 분위기와 특징을 확인한 뒤 바로 펫 피팅으로 연결할 수 있습니다.',
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
      body: 'Upload a photo of your dog or cat and try different outfits instantly. Preview cute styles, themed costumes, and special occasion looks with AI.',
      primaryButton: 'Start Pet Fitting',
      secondaryButton: 'Browse Sample Outfits',
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
      title: 'Core Features',
      items: [
        { title: 'Upload Your Pet Photo', description: 'A clear dog or cat photo helps the system keep your pet’s look more consistent.' },
        { title: 'Add an Outfit Image', description: 'A readable outfit image gives the AI stronger costume and silhouette references.' },
        { title: 'Generate a Pet Fitting Preview', description: 'The system creates a pet outfit preview that is easy to compare and share.' },
        { title: 'Save and Share the Result', description: 'Generated results can be saved for later or shared as cute pet content.' },
      ],
    },
    steps: {
      title: 'Pet Fitting in Four Steps',
      items: [
        { step: '01', title: 'Upload Your Pet Photo', description: 'Use a clear photo of your dog or cat with the face and body easy to read.' },
        { step: '02', title: 'Choose an Outfit Image', description: 'Select a sample outfit or upload your own clothing image.' },
        { step: '03', title: 'Generate the Preview', description: 'HAMDEVA combines the two images into a cute pet fitting result.' },
        { step: '04', title: 'Save and Share', description: 'Review the result, save it, and share it or try another look.' },
      ],
    },
    examples: {
      title: 'Use Cases',
      items: [
        { title: 'Holiday Pet Outfits', description: 'Preview seasonal costumes and special-day looks before you choose one.' },
        { title: 'Traditional Pet Costumes', description: 'Try playful traditional-inspired looks on your dog or cat.' },
        { title: 'Birthday Looks', description: 'Test fun party outfits for birthdays, celebrations, and keepsake photos.' },
        { title: 'Cute Social Media Content', description: 'Create adorable pet outfit previews for posting and sharing.' },
      ],
    },
    sampleInfo: {
      title: 'Browse sample outfits before you start generating.',
      body: 'Look through outfit moods and costume directions first, then decide which look you want to try on your pet.',
      button: 'Open Sample Outfits',
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
      title: 'Start Pet Fitting',
      description: 'Upload a pet photo and an outfit image to generate your result.',
      notice: 'You will usually get a cleaner result when the dog or cat photo is clear and the outfit image has a simple background.',
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
      description: 'Browse sample breeds and outfit directions that can work as useful references for your dog or cat.',
      introTitle: 'This page brings sample breeds and sample outfits together.',
      introParagraphs: [
        'Use the sample breed column to review face framing, coat shape, and accessory balance before you start a fitting flow.',
        'Use the outfit cards to compare mood, costume structure, and visual direction before you generate.',
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
      subtitle: 'ペットの衣装をすぐに試せます。',
      body: '犬や猫の写真と衣装画像をアップロードすると、AI がかわいいペット衣装プレビューを生成します。イベント用、テーマ用、記念日用のスタイルをすばやく比べられます。',
      primaryButton: 'ペットフィッティングを始める',
      secondaryButton: 'サンプル衣装を見る',
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
      title: 'ペットに似合いそうな衣装アイデアを先に見られます。',
      body: 'かわいいコスチュームやテーマスタイルの雰囲気を見てから、試したいルックを選べます。',
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
      title: 'ペットフィッティングを始める',
      description: 'ペット写真と衣装画像をアップロードすると結果を生成できます。',
      notice: '犬や猫の顔が見やすい写真と、背景が比較的シンプルな衣装画像を使うと、より自然な結果になりやすくなります。',
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
      description: 'ペットに合うサンプル品種とサンプル衣装を一緒に見るためのページです。',
      introTitle: 'このページではサンプル品種とサンプル衣装をまとめて確認できます。',
      introParagraphs: [
        '左側ではサンプル品種の顔まわりや毛並みの見え方を確認できます。',
        '右側では衣装カードを開いて雰囲気と特徴を見ながら、試したい方向を決められます。',
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
      body: '上传狗狗或猫咪的照片和服装图片后，AI 会生成可爱的宠物穿搭预览。你可以先比较节日造型、主题服装和特别场合风格。',
      primaryButton: '开始宠物试衣',
      secondaryButton: '查看示例服装',
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
      title: '核心功能',
      items: [
        { title: '上传宠物照片', description: '狗狗或猫咪面部清晰可见的照片更有利于保留宠物形象。' },
        { title: '上传服装图片', description: '服装轮廓和细节越清楚，结果越稳定。' },
        { title: 'AI 宠物试衣生成', description: '系统根据宠物图和服装图生成便于比较的穿搭结果。' },
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
      title: '先看看示例服装，再决定想试哪种风格。',
      body: '先浏览不同服装氛围和造型方向，再决定哪一种更适合你的狗狗或猫咪。',
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
      title: '开始宠物试衣',
      description: '上传宠物照片和服装图片后即可生成结果。',
      notice: '如果使用清晰的狗狗或猫咪照片，以及背景较简单的服装图片，通常会得到更自然的结果。',
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
      description: '集中查看适合狗狗或猫咪参考的示例品种与示例服装。',
      introTitle: '这个页面把示例品种和示例服装放在一起展示。',
      introParagraphs: [
        '左侧可以先看示例品种的脸部比例、毛量和饰品适配感。',
        '右侧可以打开服装卡片，先看造型方向和细节，再决定是否进入生成。',
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
