import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { LanguageCode } from '../constants/languages';
import { FACE_SAMPLES, type FaceCategory } from '../data/faceSamples';

const FACE_CATEGORIES: FaceCategory[] = ['female', 'male', 'dog', 'cat'];

const findCategoryByUrl = (url: string | null): FaceCategory => {
  if (!url) {
    return 'female';
  }

  return FACE_CATEGORIES.find((category) => FACE_SAMPLES[category].includes(url)) ?? 'female';
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

  const samples = useMemo(() => FACE_SAMPLES[category], [category]);
  const labels = t('sampleModal.categories', { returnObjects: true }) as Record<FaceCategory, string>;
  const copy = t('sampleModal', { returnObjects: true }) as {
    title: string;
    subtitle: string;
    error: string;
    disclaimer: string;
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
            {samples.map((url, index) => (
              <button
                key={url}
                className={`sample-card ${currentUrl === url ? 'selected' : ''} ${erroredUrls[url] ? 'error' : ''}`}
                onClick={() => {
                  onSelect(url, category);
                  onClose();
                }}
                type="button"
              >
                {!loadedUrls[url] && !erroredUrls[url] && (
                  <div className="sample-card-overlay">
                    <span className="spinner sample-spinner"></span>
                  </div>
                )}
                <img
                  src={url}
                  alt={`${labels[category]} sample ${index + 1}`}
                  className={loadedUrls[url] ? 'is-visible' : ''}
                  loading="eager"
                  onError={() => {
                    console.error('[HAMDEVA] face sample thumbnail failed', url);
                    setErroredUrls((prev) => ({ ...prev, [url]: true }));
                  }}
                  onLoad={() => setLoadedUrls((prev) => ({ ...prev, [url]: true }))}
                />
                <div className="sample-hover-preview" aria-hidden="true">
                  <img
                    src={url}
                    alt=""
                    className={loadedUrls[url] ? 'is-visible' : ''}
                    loading="lazy"
                  />
                </div>
                <div className="error-placeholder">{copy.error}</div>
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
