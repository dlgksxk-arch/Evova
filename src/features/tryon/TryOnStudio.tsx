import React, { useEffect, useState } from 'react';
import type { LanguageCode } from '../../constants/languages';
import type { ImageLoadState, SubjectType } from '../../types/hamdeva';
import ResultActionsPanel from './ResultActionsPanel';

const EmptyPreviewState: React.FC<{
  title: string;
  tips: string[];
  type: 'face' | 'cloth';
  badgeLabel: string;
  hint?: string;
}> = ({ title, tips, type, badgeLabel, hint }) => (
  <div className={`empty-preview empty-preview-${type}`}>
    <div className="empty-preview-badge">{badgeLabel}</div>
    <strong className="empty-preview-title">{title}</strong>
    <div className="empty-preview-tips">
      {tips.map((tip) => (
        <p key={tip} className="empty-preview-tip">
          {tip}
        </p>
      ))}
    </div>
    {hint ? <div className="empty-preview-hint">{hint}</div> : null}
  </div>
);

const extractImageSourceFromHtml = (html: string): string | null => {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1] ?? null;
};

const getDroppedImageSource = (dataTransfer: DataTransfer): File | string | null => {
  const imageFile = Array.from(dataTransfer.files).find((file) => file.type.startsWith('image/'));
  if (imageFile) {
    return imageFile;
  }

  const uriList = dataTransfer.getData('text/uri-list').trim();
  if (uriList) {
    const firstUrl = uriList.split('\n').find((line) => line && !line.startsWith('#'));
    if (firstUrl) {
      return firstUrl.trim();
    }
  }

  const html = dataTransfer.getData('text/html');
  if (html) {
    const imageSrc = extractImageSourceFromHtml(html);
    if (imageSrc) {
      return imageSrc;
    }
  }

  const plainText = dataTransfer.getData('text/plain').trim();
  if (/^(https?:|data:image\/)/i.test(plainText)) {
    return plainText;
  }

  return null;
};

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));
const GENERATION_TARGET_MS = 30000;
const RESULT_SETTLE_MS = 1800;
const DISPLAY_PROGRESS_TARGET_MS = Math.round(GENERATION_TARGET_MS / 0.95);
const RACE_PICK_LOCK_PERCENT = 50;
const OBSTACLE_JUMP_WINDOW = 0.04;
const OBSTACLE_CRASH_FREEZE_PROGRESS = 2000 / DISPLAY_PROGRESS_TARGET_MS;

type RunnerObstacleKey = 'hurdle' | 'mountain' | 'river' | 'desert' | 'mud';
type RunnerState = 'run' | 'jump' | 'tumble' | 'sink' | 'celebrate';
type RunnerObstacleOutcome = 'clean' | 'crash';

type RunnerObstacleProfile = Record<RunnerObstacleKey, {
  outcome: RunnerObstacleOutcome;
  penalty: number;
}>;

const RUNNER_OBSTACLES: Array<{
  key: RunnerObstacleKey;
  position: number;
  icon: string;
  accent: string;
}> = [
  { key: 'hurdle', position: 0.14, icon: '▥', accent: '#ff8b5f' },
  { key: 'mountain', position: 0.31, icon: '⛰', accent: '#8a7fff' },
  { key: 'river', position: 0.49, icon: '≈', accent: '#4ea7ff' },
  { key: 'desert', position: 0.64, icon: '🏜', accent: '#f7a941' },
  { key: 'mud', position: 0.79, icon: '🟫', accent: '#8b5a39' },
];

const WINNER_FINISH_PERCENT = 80;

const createRunnerObstacleProfile = (): RunnerObstacleProfile => ({
  hurdle: {
    outcome: Math.random() < 0.32 ? 'crash' : 'clean',
    penalty: 0.05,
  },
  mountain: {
    outcome: Math.random() < 0.24 ? 'crash' : 'clean',
    penalty: 0.05,
  },
  river: {
    outcome: Math.random() < 0.28 ? 'crash' : 'clean',
    penalty: 0.05,
  },
  desert: {
    outcome: Math.random() < 0.2 ? 'crash' : 'clean',
    penalty: 0.05,
  },
  mud: {
    outcome: Math.random() < 0.34 ? 'crash' : 'clean',
    penalty: 0.05,
  },
});

const getRunnerCrashCount = (profile: RunnerObstacleProfile): number => Object.values(profile)
  .filter((entry) => entry.outcome === 'crash')
  .length;

const getRunnerObstacleState = (
  baseProgress: number,
  profile: RunnerObstacleProfile,
  winner: 'dog' | 'cat',
  runner: 'dog' | 'cat',
): {
  progress: number;
  state: RunnerState;
  eventKey: RunnerObstacleKey | null;
} => {
  let resolvedProgress = baseProgress;
  let activeState: RunnerState = 'run';
  let activeKey: RunnerObstacleKey | null = null;
  let totalAdjustment = 0;

  RUNNER_OBSTACLES.forEach((obstacle, index) => {
    const profileEntry = profile[obstacle.key];
    if (!profileEntry) {
      return;
    }

    const leadBias = runner === winner
      ? 0.004 * index
      : -0.003 * index;
    const obstaclePosition = obstacle.position + leadBias;
    const activeStart = obstaclePosition - 0.028;
    const jumpEnd = obstaclePosition + 0.012;
    const crashFreezeEnd = jumpEnd + OBSTACLE_CRASH_FREEZE_PROGRESS;

    if (baseProgress < activeStart) {
      return;
    }

    if (baseProgress <= jumpEnd && activeKey === null) {
      const phase = clamp((baseProgress - activeStart) / Math.max(0.001, OBSTACLE_JUMP_WINDOW), 0, 1);
      activeKey = obstacle.key;
      activeState = 'jump';
      resolvedProgress = clamp((obstaclePosition - 0.016) + (phase * 0.036) - totalAdjustment, 0.02, 0.97);
      return;
    }

    if (profileEntry.outcome === 'crash' && baseProgress <= crashFreezeEnd && activeKey === null) {
      activeKey = obstacle.key;
      activeState = obstacle.key === 'river' || obstacle.key === 'mud' ? 'sink' : 'tumble';
      totalAdjustment += baseProgress - jumpEnd;
      resolvedProgress = clamp(obstaclePosition + 0.012 - totalAdjustment, 0.02, 0.97);
      return;
    }

    if (profileEntry.outcome === 'crash' && baseProgress > crashFreezeEnd) {
      totalAdjustment += profileEntry.penalty;
      return;
    }

    totalAdjustment -= profileEntry.penalty;
  });

  if (activeKey === null) {
    resolvedProgress = clamp(baseProgress - totalAdjustment, 0.02, 0.97);
  }
  return {
    progress: resolvedProgress,
    state: activeState,
    eventKey: activeKey,
  };
};

type TryOnModalCopy = {
  notice: string;
  personCardTitle: string;
  personCardBody: string;
  garmentCardTitle: string;
  garmentCardBody: string;
  actionCardTitle: string;
  actionCardBody: string;
  actionFootnote: string;
  resultTitle: string;
};

const getModalPreviewGuide = (lang: LanguageCode, type: 'face' | 'cloth') => {
  if (lang === 'ko') {
    return {
      title: type === 'face' ? '샘플 펫이나 사진을 넣어보세요' : '샘플 의상이나 이미지를 넣어보세요',
      tips: [
        '샘플 선택 또는 업로드로 넣으세요.',
        '다른 사이트 이미지도 드래그할 수 있어요.',
      ],
    };
  }

  return {
    title: type === 'face' ? 'Add a pet sample or photo' : 'Add a sample outfit or image',
    tips: [
      'Choose a sample or use the upload button.',
      'You can also drag an image from another site.',
    ],
  };
};

const getGenerationPanelCopy = (lang: LanguageCode) => {
  if (lang === 'ko') {
    return {
      idleTitle: '생성 결과가 여기에 표시됩니다',
      idleBody: '사진과 의상을 고른 뒤 생성하기를 누르면 같은 창에서 바로 결과를 볼 수 있어요.',
      title: '이미지 생성 중',
      stageGenerating: '반려동물과 의상을 분석하고 있어요',
      stageRendering: '간식 앞에서 결과 이미지를 마무리하고 있어요',
      elapsed: '진행률',
      helper: '허들, 산, 강, 사막, 진흙을 지나며 누가 먼저 도착할지 지켜보세요.',
      gameTitle: '누가 먼저 간식에 도착할까요?',
      gamePrompt: '50% 안에 강아지나 고양이를 골라 보세요.',
      gameLocked: '50%가 지나 선택이 마감되었어요.',
      guessDog: '강아지',
      guessCat: '고양이',
      resultCorrect: '정답이에요!',
      resultWrong: '이번엔 빗나갔어요.',
      resultNoGuess: '이번 라운드는 레이스가 끝난 뒤 결과를 공개합니다.',
      winnerDog: '강아지가 먼저 도착했어요.',
      winnerCat: '고양이가 먼저 도착했어요.',
      winnerCelebrate: '승리 포즈와 간식 세리머니 진행 중!',
    };
  }

  return {
    idleTitle: 'Your result will appear here',
    idleBody: 'Pick a pet photo and outfit, then generate to see the preview in this same frame.',
    title: 'Generating preview',
    stageGenerating: 'Analyzing your pet and outfit',
    stageRendering: 'Finishing the result beside the treat line',
    elapsed: 'Progress',
    helper: 'Watch them race through hurdles, mountains, river, desert, and mud.',
    gameTitle: 'Who reaches the treat first?',
    gamePrompt: 'Pick dog or cat before 50%.',
    gameLocked: 'Selection is locked after 50%.',
    guessDog: 'Dog',
    guessCat: 'Cat',
    resultCorrect: 'Nice guess!',
    resultWrong: 'Not this time.',
    resultNoGuess: 'No pick this round, revealing the winner after the race.',
    winnerDog: 'The dog reached the snack first.',
    winnerCat: 'The cat reached the snack first.',
    winnerCelebrate: 'Victory pose and snack celebration!',
  };
};

interface TryOnStudioProps {
  layout?: 'page' | 'modal';
  currentUser: unknown;
  isGenerating: boolean;
  activePersonImage: string | null;
  activeClothImage: string | null;
  personImage: string | null;
  clothImage: string | null;
  selectedSampleUrl: string | null;
  selectedClothSampleUrl: string | null;
  personPreviewState: ImageLoadState;
  clothPreviewState: ImageLoadState;
  resultPreviewState: ImageLoadState;
  personUploadMessage: string | null;
  clothUploadMessage: string | null;
  subjectType: SubjectType;
  detectedSubjectType: SubjectType | null;
  subjectDetectionStatus: 'idle' | 'detecting' | 'ready' | 'error';
  finalImageSrc: string | null;
  creditNotice: string | null;
  currentCredits: number;
  canAffordGeneration: boolean;
  generationCost: number;
  resultWatermarkApplied: boolean;
  shareResultLink: string | null;
  shareStatus: string | null;
  subjectUi: {
    title: string;
    auto: string;
    autoDetecting: string;
    autoDetected: string;
    autoFailed: string;
  };
  lang: LanguageCode;
  subjectTypes: readonly SubjectType[];
  emptyFaceTips: string[];
  emptyClothTips: string[];
  emptyPreviewCopy: {
    faceBadge: string;
    styleBadge: string;
  };
  sampleBadgeLabel: string;
  copy: Record<string, any>;
  personInputRef: React.RefObject<HTMLInputElement | null>;
  clothInputRef: React.RefObject<HTMLInputElement | null>;
  onOpenPersonSampleModal: () => void;
  onOpenClothSampleModal: () => void;
  onPersonFileChange: (file: File) => void;
  onClothFileChange: (file: File) => void;
  onPersonExternalDrop: (source: File | string) => Promise<void> | void;
  onClothExternalDrop: (source: File | string) => Promise<void> | void;
  onClearPerson: () => void;
  onClearCloth: () => void;
  onAutoDetectSubject: () => void;
  onSubjectTypeChange: (value: SubjectType) => void;
  onGenerate: () => void;
  onNavigateToMyPage: () => void;
  onDownloadResult: (src: string) => void;
  onShareLink: (link: string | null) => void;
  onCopyLink: (link: string | null) => void;
  onShareOnKakao: (link: string | null) => void;
  onShareOnLine: (link: string | null) => void;
  onShareOnX: (link: string | null) => void;
  onShareOnFacebook: (link: string | null) => void;
  onInstagramSave: (src: string | null) => void;
  onShareOnTikTok: (src: string | null) => void;
  onTryAnotherOutfit: () => void;
  onRandomOutfit: () => void;
  onOpenResultPreview: (src: string) => void;
  getSubjectTypeLabel: (lang: LanguageCode, subjectType: SubjectType) => string;
  modalCopy?: TryOnModalCopy;
}

const TryOnStudio: React.FC<TryOnStudioProps> = ({
  layout = 'page',
  currentUser,
  isGenerating,
  activePersonImage,
  activeClothImage,
  personImage,
  clothImage,
  selectedSampleUrl,
  selectedClothSampleUrl,
  personPreviewState,
  clothPreviewState,
  resultPreviewState,
  personUploadMessage,
  clothUploadMessage,
  finalImageSrc,
  creditNotice,
  currentCredits,
  canAffordGeneration,
  generationCost,
  resultWatermarkApplied,
  shareResultLink,
  shareStatus,
  lang,
  emptyFaceTips,
  emptyClothTips,
  emptyPreviewCopy,
  sampleBadgeLabel,
  copy,
  personInputRef,
  clothInputRef,
  onOpenPersonSampleModal,
  onOpenClothSampleModal,
  onPersonFileChange,
  onClothFileChange,
  onPersonExternalDrop,
  onClothExternalDrop,
  onClearPerson,
  onClearCloth,
  onGenerate,
  onNavigateToMyPage,
  onDownloadResult,
  onShareLink,
  onCopyLink,
  onShareOnKakao,
  onShareOnLine,
  onShareOnX,
  onShareOnFacebook,
  onInstagramSave,
  onShareOnTikTok,
  onTryAnotherOutfit,
  onRandomOutfit,
  onOpenResultPreview,
  modalCopy,
}) => {
  const [personDragActive, setPersonDragActive] = useState(false);
  const [clothDragActive, setClothDragActive] = useState(false);
  const [generationStartedAt, setGenerationStartedAt] = useState<number | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationElapsedMs, setGenerationElapsedMs] = useState(0);
  const [resultSettlingStartedAt, setResultSettlingStartedAt] = useState<number | null>(null);
  const [generationWinner, setGenerationWinner] = useState<'dog' | 'cat'>('dog');
  const [raceGuess, setRaceGuess] = useState<'dog' | 'cat' | null>(null);
  const [raceSwingSeed, setRaceSwingSeed] = useState(() => ({
    dogBias: 0,
    catBias: 0,
  }));
  const [runnerObstacleProfiles, setRunnerObstacleProfiles] = useState(() => ({
    dog: createRunnerObstacleProfile(),
    cat: createRunnerObstacleProfile(),
  }));
  const isModalLayout = layout === 'modal';
  const isReadyToGenerate = Boolean(activePersonImage && activeClothImage && canAffordGeneration);
  const modalFaceGuide = getModalPreviewGuide(lang, 'face');
  const modalClothGuide = getModalPreviewGuide(lang, 'cloth');
  const generationPanelCopy = getGenerationPanelCopy(lang);

  useEffect(() => {
    if (isGenerating) {
      setGenerationStartedAt((prev) => {
        if (prev !== null) {
          return prev;
        }

        setGenerationWinner(Math.random() < 0.5 ? 'dog' : 'cat');
        setResultSettlingStartedAt(null);
        setGenerationElapsedMs(0);
        setRaceGuess(null);
        setRaceSwingSeed({
          dogBias: (Math.random() - 0.5) * 0.01,
          catBias: (Math.random() - 0.5) * 0.01,
        });
        setRunnerObstacleProfiles({
          dog: createRunnerObstacleProfile(),
          cat: createRunnerObstacleProfile(),
        });
        return Date.now();
      });
      return;
    }

    setGenerationStartedAt(null);
    setGenerationElapsedMs(0);
    setResultSettlingStartedAt(null);
    setRaceGuess(null);
    setGenerationProgress(finalImageSrc && resultPreviewState === 'ready' ? 100 : 0);
  }, [finalImageSrc, isGenerating, resultPreviewState]);

  useEffect(() => {
    if (!isGenerating || !finalImageSrc || resultPreviewState !== 'loading' || resultSettlingStartedAt !== null) {
      return;
    }

    setResultSettlingStartedAt(Date.now());
  }, [finalImageSrc, isGenerating, resultPreviewState, resultSettlingStartedAt]);

  useEffect(() => {
    if (!isGenerating && !(finalImageSrc && resultPreviewState === 'loading')) {
      return undefined;
    }

    const tick = () => {
      const now = Date.now();
      const startedAt = generationStartedAt ?? now;
      const elapsed = now - startedAt;
      setGenerationElapsedMs(elapsed);

      if (finalImageSrc && resultPreviewState === 'loading') {
        const settlingStartedAt = resultSettlingStartedAt ?? now;
        const settleElapsed = now - settlingStartedAt;
        const currentProgress = clamp((elapsed / DISPLAY_PROGRESS_TARGET_MS) * 100, 1, 96);
        const settleProgress = Math.max(currentProgress, clamp(96 + ((settleElapsed / RESULT_SETTLE_MS) * 3), 96, 99));
        setGenerationProgress(settleProgress);
        return;
      }

      const nextProgress = clamp((elapsed / DISPLAY_PROGRESS_TARGET_MS) * 100, 1, 99);
      setGenerationProgress(nextProgress);
    };

    tick();
    const timer = window.setInterval(tick, 120);
    return () => window.clearInterval(timer);
  }, [finalImageSrc, generationStartedAt, isGenerating, resultSettlingStartedAt, resultPreviewState]);

  useEffect(() => {
    if (finalImageSrc && resultPreviewState === 'ready') {
      setGenerationProgress(100);
    }
  }, [finalImageSrc, resultPreviewState]);

  useEffect(() => {
    if (!finalImageSrc || resultPreviewState !== 'loading') {
      return undefined;
    }

    let cancelled = false;
    const preloadImage = new Image();

    preloadImage.onload = () => {
      if (!cancelled) {
        copy.setResultPreviewReady();
      }
    };

    preloadImage.onerror = () => {
      if (!cancelled) {
        copy.setResultPreviewError();
      }
    };

    preloadImage.src = finalImageSrc;

    if (preloadImage.complete && preloadImage.naturalWidth > 0) {
      copy.setResultPreviewReady();
    }

    return () => {
      cancelled = true;
      preloadImage.onload = null;
      preloadImage.onerror = null;
    };
  }, [copy, finalImageSrc, resultPreviewState]);

  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = async (event: React.DragEvent<HTMLDivElement>, target: 'person' | 'cloth') => {
    event.preventDefault();
    setPersonDragActive(false);
    setClothDragActive(false);

    if (isGenerating) {
      return;
    }

    const droppedSource = getDroppedImageSource(event.dataTransfer);
    if (!droppedSource) {
      return;
    }

    if (target === 'person') {
      await onPersonExternalDrop(droppedSource);
      return;
    }

    await onClothExternalDrop(droppedSource);
  };

  const accountStatusNode = (
    <>
      {(!isModalLayout || !currentUser) && (
        <div className="usage-bar">
          {currentUser ? copy.currentCredits(currentCredits) : copy.loginForFree}
        </div>
      )}
      {(!isModalLayout || !currentUser) && creditNotice && <div className="credit-notice-banner">{creditNotice}</div>}
      {!currentUser && (
        <div className="credit-cta-panel">
          <p>{copy.authSignupCreditsHint}</p>
          <p>{copy.dailyLoginCredits}</p>
          <p>{copy.subscriptionCreditBonus}</p>
          <div className="credit-cta-actions">
            <button className="generate-btn auth-inline-btn" onClick={() => copy.openAuthModal('signup')} type="button">
              {copy.signUpGetCredits}
            </button>
            <button className="outline-btn auth-inline-btn auth-disabled-btn" disabled onClick={() => copy.openAuthModal('login')} type="button">
              {copy.loginComingSoon ?? `${copy.login} (${copy.comingSoon})`}
            </button>
          </div>
        </div>
      )}
    </>
  );

  const isPreviewGenerating = isGenerating || (Boolean(finalImageSrc) && resultPreviewState === 'loading');
  const isPreviewReady = Boolean(finalImageSrc) && resultPreviewState === 'ready';
  const displayedGenerationProgress = isPreviewReady ? 100 : clamp(Math.round(generationProgress), 1, 99);
  const dogCrashCount = Math.min(5, getRunnerCrashCount(runnerObstacleProfiles.dog));
  const catCrashCount = Math.min(5, getRunnerCrashCount(runnerObstacleProfiles.cat));
  const crashDelayCount = Math.min(5, Math.max(dogCrashCount, catCrashCount));
  const raceFinishPercent = Math.min(85, 70 + (crashDelayCount * 3));
  const raceProgress = clamp(generationProgress / raceFinishPercent, 0, 1);
  const isGuessLocked = generationProgress >= RACE_PICK_LOCK_PERCENT;
  const isRaceFinished = generationProgress >= raceFinishPercent;
  const isResultRevealStage = isRaceFinished || isPreviewReady;
  const isSnackStage = isRaceFinished || isPreviewReady;
  const winnerEdgeBoost = clamp((raceProgress - 0.72) / 0.18, 0, 1) * 0.032;
  const dogLeadOffset = generationWinner === 'dog' ? winnerEdgeBoost : -winnerEdgeBoost * 0.8;
  const catLeadOffset = generationWinner === 'cat' ? winnerEdgeBoost : -winnerEdgeBoost * 0.8;
  const dogBaseProgress = clamp((raceProgress * 0.94) + raceSwingSeed.dogBias + dogLeadOffset, 0.02, 0.98);
  const catBaseProgress = clamp((raceProgress * 0.94) + raceSwingSeed.catBias + catLeadOffset, 0.02, 0.98);
  const dogTelemetry = getRunnerObstacleState(dogBaseProgress, runnerObstacleProfiles.dog, generationWinner, 'dog');
  const catTelemetry = getRunnerObstacleState(catBaseProgress, runnerObstacleProfiles.cat, generationWinner, 'cat');
  const isWinnerAtFinish = generationProgress >= Math.min(WINNER_FINISH_PERCENT, raceFinishPercent);
  const dogRunnerProgress = isPreviewReady
    ? (generationWinner === 'dog' ? 1 : 0.964)
    : isRaceFinished
      ? (generationWinner === 'dog' ? 1 : clamp(dogTelemetry.progress, 0.78, 0.93))
      : dogTelemetry.progress;
  const catRunnerProgress = isPreviewReady
    ? (generationWinner === 'cat' ? 1 : 0.964)
    : isRaceFinished
      ? (generationWinner === 'cat' ? 1 : clamp(catTelemetry.progress, 0.78, 0.93))
      : catTelemetry.progress;
  const dogRunnerState: RunnerState = (isPreviewReady || (isRaceFinished && generationWinner === 'dog'))
    ? 'celebrate'
    : dogTelemetry.state;
  const catRunnerState: RunnerState = (isPreviewReady || (isRaceFinished && generationWinner === 'cat'))
    ? 'celebrate'
    : catTelemetry.state;
  const raceStatusLabel = isRaceFinished ? generationPanelCopy.stageRendering : generationPanelCopy.stageGenerating;
  const snackLabel = generationWinner === 'dog' ? '🦴' : '🐟';
  const guessResultTone = raceGuess === null ? 'neutral' : raceGuess === generationWinner ? 'correct' : 'wrong';
  const guessResultHeadline = raceGuess === null
    ? generationPanelCopy.resultNoGuess
    : raceGuess === generationWinner
      ? generationPanelCopy.resultCorrect
      : generationPanelCopy.resultWrong;
  const guessResultBody = generationWinner === 'dog' ? generationPanelCopy.winnerDog : generationPanelCopy.winnerCat;
  const modalResultUtilityNode = isModalLayout && isPreviewReady && finalImageSrc ? (
    <>
      <div className="result-inline-actions">
        <button className="download-btn result-inline-action-btn" disabled={resultPreviewState !== 'ready'} onClick={() => onDownloadResult(finalImageSrc)} type="button">
          {copy.downloadImage}
        </button>
        <button className="outline-btn result-inline-action-btn" onClick={() => onCopyLink(shareResultLink)} type="button">
          {copy.copyLink}
        </button>
      </div>
      {shareStatus ? <p className="result-status-text result-status-text-inline">{shareStatus}</p> : null}
    </>
  ) : null;

  const previewPanelNode = (
    <div id="result-area" className={`result-preview-panel ${isModalLayout ? 'is-modal' : ''}`}>
      {isPreviewReady && finalImageSrc ? (
        <img
          src={finalImageSrc}
          alt="Result"
          className="result-preview-panel-image is-visible is-zoomable"
          onLoad={() => copy.setResultPreviewReady()}
          onError={() => copy.setResultPreviewError()}
          onClick={() => {
            onOpenResultPreview(finalImageSrc);
          }}
        />
      ) : isPreviewGenerating ? (
        <div className="result-preview-loading" aria-live="polite">
          <div className="generation-playground-head">
            <div>
              <strong>{generationPanelCopy.title}</strong>
              <p>{raceStatusLabel}</p>
            </div>
            <div className="generation-playground-meta">
              <span className="generation-playground-percent">{displayedGenerationProgress}%</span>
            </div>
          </div>
          <div className="generation-race-pick-panel">
            <div className="generation-race-pick-copy">
              <strong>{generationPanelCopy.gameTitle}</strong>
              <p>{isGuessLocked ? generationPanelCopy.gameLocked : generationPanelCopy.gamePrompt}</p>
            </div>
            <div className="generation-race-pick-actions">
              <button
                className={`generation-race-pick-btn ${raceGuess === 'dog' ? 'is-selected' : ''} ${!isGuessLocked && raceGuess !== 'dog' ? 'is-cta' : ''}`}
                disabled={isGuessLocked}
                onClick={() => setRaceGuess('dog')}
                type="button"
              >
                <span>🐶</span>
                <span>{generationPanelCopy.guessDog}</span>
              </button>
              <button
                className={`generation-race-pick-btn ${raceGuess === 'cat' ? 'is-selected' : ''} ${!isGuessLocked && raceGuess !== 'cat' ? 'is-cta' : ''}`}
                disabled={isGuessLocked}
                onClick={() => setRaceGuess('cat')}
                type="button"
              >
                <span>🐱</span>
                <span>{generationPanelCopy.guessCat}</span>
              </button>
            </div>
          </div>
          <div className={`generation-playground-stage ${isSnackStage ? 'is-snack-stage' : 'is-race-stage'} winner-${generationWinner}`} aria-hidden="true">
            <div className="generation-playground-track">
              <div className="generation-track-lane generation-track-lane-dog">
                <span className="generation-track-lane-label">DOG</span>
                <div className="generation-track-rail" />
                <div className="generation-track-obstacles">
                  {RUNNER_OBSTACLES.map((obstacle) => (
                    <span
                      key={`dog-${obstacle.key}`}
                      className={`generation-track-obstacle obstacle-${obstacle.key} ${dogTelemetry.eventKey === obstacle.key ? 'is-active' : ''}`}
                      style={{ ['--obstacle-progress' as string]: `${obstacle.position}`, ['--obstacle-accent' as string]: obstacle.accent }}
                    >
                      {obstacle.icon}
                    </span>
                  ))}
                </div>
              </div>
              <div className="generation-track-lane generation-track-lane-cat">
                <span className="generation-track-lane-label">CAT</span>
                <div className="generation-track-rail" />
                <div className="generation-track-obstacles">
                  {RUNNER_OBSTACLES.map((obstacle) => (
                    <span
                      key={`cat-${obstacle.key}`}
                      className={`generation-track-obstacle obstacle-${obstacle.key} ${catTelemetry.eventKey === obstacle.key ? 'is-active' : ''}`}
                      style={{ ['--obstacle-progress' as string]: `${obstacle.position}`, ['--obstacle-accent' as string]: obstacle.accent }}
                    >
                      {obstacle.icon}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="generation-playground-finish-zone">
              <span className="generation-playground-finish-flag">🏁</span>
              <span className="generation-playground-snack">{snackLabel}</span>
            </div>
            <div
              className={`generation-playground-runner generation-playground-dog state-${dogRunnerState} ${generationWinner === 'dog' && isSnackStage ? 'is-winner' : 'is-runner-up'}`}
              style={{ ['--runner-progress' as string]: `${dogRunnerProgress}` }}
            >
              <span className="generation-runner-visual">
                <span className="generation-runner-shadow" />
                <span className="generation-runner-tail" />
                <span className="generation-runner-body" />
                <span className="generation-runner-head">
                  <span className="generation-runner-ear ear-left" />
                  <span className="generation-runner-ear ear-right" />
                  <span className="generation-runner-eye eye-left" />
                  <span className="generation-runner-eye eye-right" />
                  <span className="generation-runner-cheek cheek-left" />
                  <span className="generation-runner-cheek cheek-right" />
                  <span className="generation-runner-muzzle" />
                  <span className="generation-runner-nose" />
                  <span className="generation-runner-whiskers whisker-left" />
                  <span className="generation-runner-whiskers whisker-right" />
                </span>
                <span className="generation-runner-legs">
                  <span />
                  <span />
                  <span />
                  <span />
                </span>
              </span>
            </div>
            <div
              className={`generation-playground-runner generation-playground-cat state-${catRunnerState} ${generationWinner === 'cat' && isSnackStage ? 'is-winner' : 'is-runner-up'}`}
              style={{ ['--runner-progress' as string]: `${catRunnerProgress}` }}
            >
              <span className="generation-runner-visual">
                <span className="generation-runner-shadow" />
                <span className="generation-runner-tail" />
                <span className="generation-runner-body" />
                <span className="generation-runner-head">
                  <span className="generation-runner-ear ear-left" />
                  <span className="generation-runner-ear ear-right" />
                  <span className="generation-runner-eye eye-left" />
                  <span className="generation-runner-eye eye-right" />
                  <span className="generation-runner-cheek cheek-left" />
                  <span className="generation-runner-cheek cheek-right" />
                  <span className="generation-runner-muzzle" />
                  <span className="generation-runner-nose" />
                  <span className="generation-runner-whiskers whisker-left" />
                  <span className="generation-runner-whiskers whisker-right" />
                </span>
                <span className="generation-runner-legs">
                  <span />
                  <span />
                  <span />
                  <span />
                </span>
              </span>
            </div>
            {isSnackStage ? (
              <>
                <span className="generation-playground-reaction generation-playground-reaction-dog is-visible" style={{ ['--runner-progress' as string]: `${dogRunnerProgress}` }}>{generationWinner === 'dog' ? '😋' : '🎉'}</span>
                <span className="generation-playground-reaction generation-playground-reaction-cat is-visible" style={{ ['--runner-progress' as string]: `${catRunnerProgress}` }}>{generationWinner === 'cat' ? '😋' : '🎉'}</span>
              </>
            ) : null}
            <span className="generation-playground-spark generation-playground-spark-one">✦</span>
            <span className="generation-playground-spark generation-playground-spark-two">✦</span>
          </div>
          {isResultRevealStage ? (
            <div className={`generation-winner-spotlight is-${guessResultTone}`}>
              <div className={`generation-winner-visual is-${generationWinner}`}>
                <span className="generation-winner-burst generation-winner-burst-one">✦</span>
                <span className="generation-winner-burst generation-winner-burst-two">✦</span>
                <span className="generation-winner-confetti generation-winner-confetti-one">•</span>
                <span className="generation-winner-confetti generation-winner-confetti-two">•</span>
                <span className={`generation-winner-animal is-${generationWinner}`}>
                  <span className="generation-winner-ear ear-left" />
                  <span className="generation-winner-ear ear-right" />
                  <span className="generation-winner-eye eye-left" />
                  <span className="generation-winner-eye eye-right" />
                  <span className="generation-winner-cheek cheek-left" />
                  <span className="generation-winner-cheek cheek-right" />
                  <span className="generation-winner-nose" />
                </span>
                <span className="generation-winner-hands">🙌</span>
              </div>
              <div className="generation-winner-copy">
                <strong>{guessResultHeadline}</strong>
                <p>{guessResultBody}</p>
                <small>{generationPanelCopy.winnerCelebrate}</small>
              </div>
            </div>
          ) : null}
          <p className="generation-playground-helper">{generationPanelCopy.helper}</p>
        </div>
      ) : (
        <div className="result-preview-placeholder">
          <div className="result-preview-placeholder-badge">{modalCopy?.resultTitle ?? copy.resultTitle}</div>
          <strong>{generationPanelCopy.idleTitle}</strong>
          <p>{generationPanelCopy.idleBody}</p>
        </div>
      )}
      {resultPreviewState === 'error' ? (
        <div className="img-error-msg result-preview-panel-error">{copy.resultDisplayError}</div>
      ) : null}
    </div>
  );

  const shareSidebarNode = isPreviewReady && finalImageSrc ? (
    <div className={`result-showcase-layout result-showcase-layout-actions ${isModalLayout ? 'is-modal' : ''}`}>
      <ResultActionsPanel
        imageSrc={finalImageSrc}
        link={shareResultLink}
        disableDownload={resultPreviewState !== 'ready'}
        shareStatus={shareStatus}
        copy={copy}
        layout="sidebar"
        showCopy={false}
        onDownload={onDownloadResult}
        onShareLink={onShareLink}
        onCopyLink={onCopyLink}
        onShareOnKakao={onShareOnKakao}
        onShareOnLine={onShareOnLine}
        onShareOnX={onShareOnX}
        onShareOnFacebook={onShareOnFacebook}
        onInstagramSave={onInstagramSave}
        onShareOnTikTok={onShareOnTikTok}
        onTryAnotherOutfit={onTryAnotherOutfit}
        onRandomOutfit={onRandomOutfit}
      />
    </div>
  ) : null;

  const resultFollowupNode = isPreviewReady && finalImageSrc ? (
    <>
      <div className={isModalLayout ? 'result-followup-shell' : 'page-article'}>
        <div className="result-action-grid single-row result-followup-actions">
          <button className="outline-btn result-action-btn" onClick={onTryAnotherOutfit} type="button">
            {copy.tryAnotherOutfit}
          </button>
          <button className="outline-btn result-action-btn" onClick={onRandomOutfit} type="button">
            {copy.randomOutfit}
          </button>
        </div>
      </div>
      {resultWatermarkApplied && (
        <div className={`credit-result-notice ${isModalLayout ? 'result-followup-shell' : 'page-article'}`}>
          <strong>{copy.freeResultNoticeTitle}</strong>
          <p>{copy.freeResultNoticeBody}</p>
        </div>
      )}
    </>
  ) : null;

  const inputColumnsNode = (
    <div className={`try-layout ${isModalLayout ? 'try-layout-modal' : ''}`}>
        <div className="try-column">
          <div className={isModalLayout ? 'modal-input-card-layout' : undefined}>
            <div className={isModalLayout ? 'modal-input-card-main' : undefined}>
              <div className="card-header">
                <span className="section-label">{copy.step1Label}</span>
                <h3 className="card-title">{isModalLayout ? modalCopy?.personCardTitle ?? copy.step1Title : copy.step1Title}</h3>
              </div>
              <div className={`try-actions ${isModalLayout ? 'try-actions-compact' : ''}`}>
                <button className="outline-btn primary" disabled={isGenerating} onClick={onOpenPersonSampleModal} type="button">
                  {copy.chooseSample}
                </button>
                <button className={`outline-btn ${isModalLayout ? 'primary' : ''}`} disabled={isGenerating} onClick={() => personInputRef.current?.click()} type="button">
                  {copy.uploadMyPhoto}
                </button>
                <input
                  id="p-up"
                  ref={personInputRef}
                  type="file"
                  hidden
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  onClick={(event) => { event.currentTarget.value = ''; }}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      onPersonFileChange(file);
                    }
                  }}
                />
              </div>
            </div>
            <div className={isModalLayout ? 'modal-input-card-preview' : undefined}>
              <div
                className={`preview-box ${activePersonImage ? 'has-image' : 'is-clickable'} ${personDragActive ? 'drag-active' : ''}`}
                onClick={() => {
                  if (!isGenerating && !activePersonImage) {
                    personInputRef.current?.click();
                  }
                }}
                onKeyDown={(event) => {
                  if (!isGenerating && !activePersonImage && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault();
                    personInputRef.current?.click();
                  }
                }}
                onDragEnter={(event) => {
                  handleDragOver(event);
                  setPersonDragActive(true);
                }}
                onDragLeave={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                    setPersonDragActive(false);
                  }
                }}
                onDragOver={handleDragOver}
                onDrop={(event) => { void handleDrop(event, 'person'); }}
                role={!activePersonImage ? 'button' : undefined}
                tabIndex={!activePersonImage ? 0 : -1}
              >
                {activePersonImage ? (
                  <>
                    {personPreviewState === 'loading' && (
                      <div className="preview-overlay">
                        <span className="spinner"></span>
                        <span>{personUploadMessage || copy.loadingImage}</span>
                      </div>
                    )}
                    {personPreviewState === 'error' && <div className="img-error-msg">{copy.imageLoadError}</div>}
                    <img
                      src={activePersonImage}
                      alt="Face"
                      onLoad={() => copy.setPersonPreviewReady()}
                      onError={() => copy.setPersonPreviewError()}
                      className={`${selectedSampleUrl ? 'sample-img' : personImage ? 'user-uploaded' : 'sample-img'} ${personPreviewState === 'ready' ? 'is-visible' : ''}`}
                    />
                  </>
                ) : (
                  <EmptyPreviewState
                    title={isModalLayout ? modalFaceGuide.title : copy.facePlaceholderTitle}
                    tips={isModalLayout ? modalFaceGuide.tips : emptyFaceTips.slice(0, 2)}
                    type="face"
                    badgeLabel={emptyPreviewCopy.faceBadge}
                    hint={
                      isModalLayout
                        ? [modalCopy?.personCardBody, copy.faceCopyrightNotice].filter(Boolean).join(' ')
                        : undefined
                    }
                  />
                )}
                {selectedSampleUrl && activePersonImage && <div className="sample-badge">{sampleBadgeLabel}</div>}
                {(personImage || selectedSampleUrl) && (
                  <button className="clear-img-btn" disabled={isGenerating} onClick={onClearPerson} type="button">&times;</button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="try-column">
          <div className={isModalLayout ? 'modal-input-card-layout' : undefined}>
            <div className={isModalLayout ? 'modal-input-card-main' : undefined}>
              <div className="card-header">
                <span className="section-label">{copy.step2Label}</span>
                <h3 className="card-title">{isModalLayout ? modalCopy?.garmentCardTitle ?? copy.step2Title : copy.step2Title}</h3>
              </div>
              <div className={`try-actions ${isModalLayout ? 'try-actions-compact' : ''}`}>
                <button className="outline-btn primary" disabled={isGenerating} onClick={onOpenClothSampleModal} type="button">
                  {copy.chooseClothingSample}
                </button>
                <button className={`outline-btn ${isModalLayout ? 'primary' : ''}`} disabled={isGenerating} onClick={() => clothInputRef.current?.click()} type="button">
                  {copy.uploadClothing}
                </button>
                <input
                  id="c-up"
                  ref={clothInputRef}
                  type="file"
                  hidden
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  onClick={(event) => { event.currentTarget.value = ''; }}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) {
                      onClothFileChange(file);
                    }
                  }}
                />
              </div>
            </div>
            <div className={isModalLayout ? 'modal-input-card-preview' : undefined}>
              <div
                className={`preview-box ${activeClothImage ? 'has-image' : 'is-clickable'} ${clothDragActive ? 'drag-active' : ''}`}
                onClick={() => {
                  if (!isGenerating && !activeClothImage) {
                    clothInputRef.current?.click();
                  }
                }}
                onKeyDown={(event) => {
                  if (!isGenerating && !activeClothImage && (event.key === 'Enter' || event.key === ' ')) {
                    event.preventDefault();
                    clothInputRef.current?.click();
                  }
                }}
                onDragEnter={(event) => {
                  handleDragOver(event);
                  setClothDragActive(true);
                }}
                onDragLeave={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
                    setClothDragActive(false);
                  }
                }}
                onDragOver={handleDragOver}
                onDrop={(event) => { void handleDrop(event, 'cloth'); }}
                role={!activeClothImage ? 'button' : undefined}
                tabIndex={!activeClothImage ? 0 : -1}
              >
                {activeClothImage ? (
                  <>
                    {clothPreviewState === 'loading' && (
                      <div className="preview-overlay">
                        <span className="spinner"></span>
                        <span>{clothUploadMessage || copy.loadingImage}</span>
                      </div>
                    )}
                    {clothPreviewState === 'error' ? (
                      <div className="img-error-msg">{copy.imageLoadError}</div>
                    ) : (
                      <img
                        src={activeClothImage}
                        alt="Cloth"
                        className={clothPreviewState === 'ready' ? 'is-visible' : ''}
                        onLoad={() => copy.setClothPreviewReady()}
                        onError={() => copy.setClothPreviewError()}
                      />
                    )}
                    {selectedClothSampleUrl && activeClothImage && <div className="sample-badge">{sampleBadgeLabel}</div>}
                    {(clothImage || selectedClothSampleUrl) && (
                      <button className="clear-img-btn" disabled={isGenerating} onClick={onClearCloth} type="button">&times;</button>
                    )}
                  </>
                ) : (
                  <EmptyPreviewState
                    title={isModalLayout ? modalClothGuide.title : copy.clothingPlaceholderTitle}
                    tips={isModalLayout ? modalClothGuide.tips : emptyClothTips.slice(0, 2)}
                    type="cloth"
                    badgeLabel={emptyPreviewCopy.styleBadge}
                    hint={
                      isModalLayout
                        ? [modalCopy?.garmentCardBody, copy.clothingSafetyNotice].filter(Boolean).join(' ')
                        : undefined
                    }
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
  );

  const actionSectionContentNode = (
    <>
        {isModalLayout ? (
          <div className="card-header modal-action-header">
            <span className="section-label">{copy.step3Label ?? 'Step 3'}</span>
            <h3 className="card-title">{modalCopy?.actionCardTitle}</h3>
            {modalCopy?.actionCardBody ? <p className="modal-card-description">{modalCopy.actionCardBody}</p> : null}
          </div>
        ) : null}
        {copy.realGenerationCta ? <p className="real-generation-label">{copy.realGenerationCta}</p> : null}
        {isModalLayout ? (
          <p className="credit-cost-text credit-cost-text-compact">
            {copy.generationCostDetailed(generationCost)} · {copy.currentCredits(currentCredits)}
          </p>
        ) : (
          <>
            <p className="credit-cost-text">{copy.generationCostDetailed(generationCost)}</p>
            <p className="credit-balance-text">{copy.currentCredits(currentCredits)}</p>
          </>
        )}
        <button
          className={`generate-btn ${isGenerating ? 'is-generating' : ''}`}
          onClick={onGenerate}
          disabled={isGenerating || !currentUser || !activePersonImage || !activeClothImage || !canAffordGeneration}
          type="button"
        >
          {isGenerating ? (
            <span className="generate-btn-running">
              <span className="pet-runner-track" aria-hidden="true">
                <span className="pet-runner pet-runner-dog">🐶</span>
                <span className="pet-runner pet-runner-cat">🐱</span>
                <span className="pet-runner-snack">{snackLabel}</span>
              </span>
              <span>{copy.generating}</span>
            </span>
          ) : copy.generate}
        </button>
        {!isModalLayout && currentUser ? <p className="credit-balance-text credit-balance-text-bottom">{copy.currentCredits(currentCredits)}</p> : null}
        {currentUser && !canAffordGeneration && (
          <>
            <p className="loading-subtext">{copy.notEnoughCredits}</p>
            <button className="outline-btn auth-inline-btn" onClick={onNavigateToMyPage} type="button">
              {copy.chargeCredits}
            </button>
          </>
        )}
        {isGenerating && !isModalLayout && (
          <>
            <p className="loading-subtext">{copy.loadingDetail}</p>
          </>
        )}
        <p className="generation-estimate-notice">{isModalLayout ? modalCopy?.actionFootnote ?? copy.generationEstimateNotice : copy.generationEstimateNotice}</p>
    </>
  );

  const studioMainNode = (
    <>
      {isModalLayout ? (
        <div className="try-modal-workspace">
          <div className="try-modal-left-column">
            {inputColumnsNode}
          </div>
          <div className="try-modal-right-column">
            <div className="action-section action-section-card try-modal-result-card">
              <div className="try-modal-result-layout">
                <div className="try-modal-result-main">
                  {actionSectionContentNode}
                  {resultFollowupNode}
                </div>
                <div className="try-modal-result-preview">
                  {previewPanelNode}
                  {modalResultUtilityNode}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {inputColumnsNode}
          <div className="action-section">{actionSectionContentNode}</div>
          {previewPanelNode}
          {shareSidebarNode || resultFollowupNode ? (
            <div className="results-section">
              {shareSidebarNode}
              {resultFollowupNode}
            </div>
          ) : null}
        </>
      )}
    </>
  );

  if (isModalLayout) {
    return (
      <section className="section try-section try-section-modal">
        <div className="section-inner try-modal-inner">
          {accountStatusNode}
          <div className="try-modal-layout">
            <div className="try-modal-main">{studioMainNode}</div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="try" className="section try-section">
      <div className="section-inner">
        {accountStatusNode}
        {studioMainNode}
      </div>
    </section>
  );
};

export default TryOnStudio;
