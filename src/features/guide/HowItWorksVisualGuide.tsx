import React from 'react';

interface HowItWorksVisualGuideProps {
  copy: {
    eyebrow: string;
    title: string;
    description: string;
    summaryCards: Array<{
      title: string;
      body: string;
    }>;
    sampleShowcaseTitle: string;
    sampleShowcaseDescription: string;
    dogSampleLabel: string;
    catSampleLabel: string;
    outfitSampleLabel: string;
    inputFaceLabel: string;
    inputClothLabel: string;
    resultLabel: string;
    stepChooseFace: string;
    stepChooseCloth: string;
    stepGenerate: string;
    faceCaption: string;
    clothCaption: string;
    resultCaption: string;
    emptyResultTitle: string;
    emptyResultDescription: string;
    dragGuideTitle: string;
    dragGuideDescription: string;
    dragBrowserLabel: string;
    dragDropzoneLabel: string;
    dragDropzoneHint: string;
    dragGuideSteps: string[];
    checklistTitle: string;
    checklistItems: string[];
    resultTipsTitle: string;
    resultTips: string[];
  };
  sampleDogSrc: string;
  sampleCatSrc: string;
  sampleClothSrc: string;
  resultImageSrc: string | null;
}

const HowItWorksVisualGuide: React.FC<HowItWorksVisualGuideProps> = ({
  copy,
  sampleDogSrc,
  sampleCatSrc,
  sampleClothSrc,
  resultImageSrc,
}) => (
  <section className="howto-visual-section">
    <article className="page-article howto-visual-card">
      <div className="howto-visual-header">
        <span className="howto-visual-eyebrow">{copy.eyebrow}</span>
        <h2>{copy.title}</h2>
        <p>{copy.description}</p>
      </div>

      <div className="howto-summary-grid">
        {copy.summaryCards.map((card) => (
          <article key={card.title} className="howto-summary-card">
            <strong>{card.title}</strong>
            <p>{card.body}</p>
          </article>
        ))}
      </div>

      <div className="howto-sample-showcase">
        <div className="howto-section-copy">
          <h3>{copy.sampleShowcaseTitle}</h3>
          <p>{copy.sampleShowcaseDescription}</p>
        </div>
        <div className="howto-sample-grid">
          <article className="howto-sample-card">
            <div className="howto-sample-thumb">
              <img src={sampleDogSrc} alt={copy.dogSampleLabel} loading="lazy" />
            </div>
            <strong>{copy.dogSampleLabel}</strong>
          </article>
          <article className="howto-sample-card">
            <div className="howto-sample-thumb">
              <img src={sampleCatSrc} alt={copy.catSampleLabel} loading="lazy" />
            </div>
            <strong>{copy.catSampleLabel}</strong>
          </article>
          <article className="howto-sample-card">
            <div className="howto-sample-thumb">
              <img src={sampleClothSrc} alt={copy.outfitSampleLabel} loading="lazy" />
            </div>
            <strong>{copy.outfitSampleLabel}</strong>
          </article>
        </div>
      </div>

      <div className="howto-visual-flow">
        <div className="howto-visual-stage">
          <div className="howto-visual-stage-header">
            <span className="howto-stage-badge">1</span>
            <strong>{copy.stepChooseFace}</strong>
          </div>
          <div className="howto-stage-image-card">
            <span className="howto-stage-chip">{copy.inputFaceLabel}</span>
            <img src={sampleDogSrc} alt={copy.faceCaption} loading="lazy" />
          </div>
          <p>{copy.faceCaption}</p>
        </div>

        <div className="howto-flow-arrow" aria-hidden="true">+</div>

        <div className="howto-visual-stage">
          <div className="howto-visual-stage-header">
            <span className="howto-stage-badge">2</span>
            <strong>{copy.stepChooseCloth}</strong>
          </div>
          <div className="howto-stage-image-card is-outfit">
            <span className="howto-stage-chip">{copy.inputClothLabel}</span>
            <img src={sampleClothSrc} alt={copy.clothCaption} loading="lazy" />
          </div>
          <p>{copy.clothCaption}</p>
        </div>

        <div className="howto-flow-arrow" aria-hidden="true">→</div>

        <div className="howto-visual-stage howto-result-stage">
          <div className="howto-visual-stage-header">
            <span className="howto-stage-badge">3</span>
            <strong>{copy.stepGenerate}</strong>
          </div>
          <div className="howto-stage-image-card is-result">
            <span className="howto-stage-chip">{copy.resultLabel}</span>
            {resultImageSrc ? (
              <img src={resultImageSrc} alt={copy.resultCaption} loading="lazy" />
            ) : (
              <div className="howto-empty-result">
                <strong>{copy.emptyResultTitle}</strong>
                <p>{copy.emptyResultDescription}</p>
              </div>
            )}
          </div>
          <p>{copy.resultCaption}</p>
        </div>
      </div>

      <div className="howto-guide-grid">
        <article className="howto-guide-card">
          <div className="howto-section-copy">
            <h3>{copy.dragGuideTitle}</h3>
            <p>{copy.dragGuideDescription}</p>
          </div>
          <div className="howto-drag-demo">
            <div className="howto-browser-mock">
              <span className="howto-browser-chip">{copy.dragBrowserLabel}</span>
              <div className="howto-browser-image">
                <img src={sampleClothSrc} alt={copy.outfitSampleLabel} loading="lazy" />
              </div>
            </div>
            <div className="howto-drag-arrow" aria-hidden="true">→</div>
            <div className="howto-dropzone-mock">
              <span className="howto-stage-chip howto-stage-chip-static">{copy.dragDropzoneLabel}</span>
              <strong>{copy.dragDropzoneHint}</strong>
            </div>
          </div>
          <ol className="howto-guide-list">
            {copy.dragGuideSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </article>

        <article className="howto-guide-card">
          <div className="howto-section-copy">
            <h3>{copy.checklistTitle}</h3>
          </div>
          <ul className="howto-bullet-list">
            {copy.checklistItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>

        <article className="howto-guide-card">
          <div className="howto-section-copy">
            <h3>{copy.resultTipsTitle}</h3>
          </div>
          <ul className="howto-bullet-list">
            {copy.resultTips.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </article>
      </div>
    </article>
  </section>
);

export default HowItWorksVisualGuide;
