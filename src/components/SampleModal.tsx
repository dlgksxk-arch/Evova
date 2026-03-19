import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { LanguageCode } from '../constants/languages';
import { FACE_SAMPLE_OPTIONS, FACE_SAMPLES, type FaceCategory } from '../data/faceSamples';

const FACE_CATEGORIES: FaceCategory[] = ['dog', 'cat'];

const findCategoryByUrl = (url: string | null): FaceCategory => {
  if (!url) {
    return 'dog';
  }

  return FACE_CATEGORIES.find((category) => FACE_SAMPLES[category].includes(url)) ?? 'dog';
};

interface SampleModalProps {
  currentUrl: string | null;
  lang: LanguageCode;
  onClose: () => void;
  onSelect: (url: string, category: FaceCategory) => void;
}

const SampleModal: React.FC<SampleModalProps> = ({ currentUrl, lang: _lang, onClose, onSelect }) => {
  const { t } = useTranslation();
  const [category, setCategory] = useState<FaceCategory>(() => findCategoryByUrl(currentUrl));
  const [loadedUrls, setLoadedUrls] = useState<Record<string, boolean>>({});
  const [erroredUrls, setErroredUrls] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setCategory(findCategoryByUrl(currentUrl));
  }, [currentUrl]);

  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const samples = useMemo(() => FACE_SAMPLE_OPTIONS[category], [category]);
  const labels = t('sampleModal.categories', { returnObjects: true }) as Record<FaceCategory, string>;
  const copy = t('sampleModal', { returnObjects: true }) as {
    title: string;
    subtitle: string;
    error: string;
    disclaimer: string;
  };
  const updateHoverPreviewPosition = (event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const nextX = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 100;
    const clampedX = Math.min(82, Math.max(18, nextX));
    event.currentTarget.style.setProperty('--sample-hover-x', `${clampedX}%`);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content sample-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>{copy.title}</h3>
            <p className="modal-subtitle">{copy.subtitle}</p>
          </div>
          <button className="close-btn" onClick={onClose} type="button">
            &times;
          </button>
        </div>

        <div className="sample-modal-body">
          <div className="sample-category-tabs">
            {FACE_CATEGORIES.map((tab) => (
              <button
                key={tab}
                className={category === tab ? 'active' : ''}
                onClick={() => setCategory(tab)}
                type="button"
              >
                {labels[tab]}
              </button>
            ))}
          </div>

          <div className="sample-grid">
            {samples.map((sample, index) => (
              <button
                key={sample.url}
                className={`sample-card ${currentUrl === sample.url ? 'selected' : ''} ${erroredUrls[sample.url] ? 'error' : ''}`}
                onMouseEnter={updateHoverPreviewPosition}
                onMouseMove={updateHoverPreviewPosition}
                onMouseLeave={(event) => event.currentTarget.style.setProperty('--sample-hover-x', '50%')}
                onClick={() => {
                  onSelect(sample.url, category);
                  onClose();
                }}
                type="button"
              >
                <div className="sample-card-thumb">
                  {!loadedUrls[sample.url] && !erroredUrls[sample.url] && (
                    <div className="sample-card-overlay">
                      <span className="spinner sample-spinner"></span>
                    </div>
                  )}
                  <img
                    src={sample.url}
                    alt={`${labels[category]} ${sample.breedLabel}`}
                    className={loadedUrls[sample.url] ? 'is-visible' : ''}
                    loading="eager"
                    onError={() => {
                      console.error('[HAMDEVA] face sample thumbnail failed', sample.url);
                      setErroredUrls((prev) => ({ ...prev, [sample.url]: true }));
                    }}
                    onLoad={() => setLoadedUrls((prev) => ({ ...prev, [sample.url]: true }))}
                  />
                  <div className="error-placeholder">{copy.error}</div>
                </div>
                <div className="sample-card-meta">
                  <strong>{sample.breedLabel}</strong>
                  <span>{labels[category]}</span>
                </div>
                <div className="sample-hover-preview" aria-hidden="true">
                  <img
                    src={sample.url}
                    alt=""
                    className={loadedUrls[sample.url] ? 'is-visible' : ''}
                    loading="lazy"
                  />
                </div>
              </button>
            ))}
          </div>
        </div>
        <p className="modal-disclaimer">{copy.disclaimer}</p>
      </div>
    </div>
  );
};

export default SampleModal;
