import React from 'react';

interface HowItWorksVisualGuideProps {
  copy: {
    eyebrow: string;
    title: string;
    description: string;
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
  };
  sampleFaceSrc: string;
  sampleClothSrc: string;
  resultImageSrc: string | null;
}

const HowItWorksVisualGuide: React.FC<HowItWorksVisualGuideProps> = ({
  copy,
  sampleFaceSrc,
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

      <div className="howto-visual-flow">
        <div className="howto-visual-stage">
          <div className="howto-visual-stage-header">
            <span className="howto-stage-badge">1</span>
            <strong>{copy.stepChooseFace}</strong>
          </div>
          <div className="howto-stage-image-card">
            <span className="howto-stage-chip">{copy.inputFaceLabel}</span>
            <img src={sampleFaceSrc} alt={copy.faceCaption} loading="lazy" />
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
    </article>
  </section>
);

export default HowItWorksVisualGuide;
