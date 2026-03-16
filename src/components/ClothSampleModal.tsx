import React, { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { LanguageCode } from '../constants/languages';
import { clothSampleOptions, type ClothSampleCategory } from '../data/clothSamples';

interface ClothSampleModalProps {
  currentUrl: string | null;
  lang: LanguageCode;
  onClose: () => void;
  onSelect: (url: string) => void;
}

const CLOTH_SAMPLE_CATEGORIES: ClothSampleCategory[] = ['female', 'male', 'animal', 'fashin', 'future', 'classic'];

const findCategoryByUrl = (url: string | null): ClothSampleCategory => {
  if (!url) {
    return 'female';
  }

  return clothSampleOptions.find((sample) => sample.image === url)?.category ?? 'female';
};

const ClothSampleModal: React.FC<ClothSampleModalProps> = ({ currentUrl, lang, onClose, onSelect }) => {
  const { t } = useTranslation();
  const [loadedUrls, setLoadedUrls] = useState<Record<string, boolean>>({});
  const [erroredUrls, setErroredUrls] = useState<Record<string, boolean>>({});
  const [category, setCategory] = useState<ClothSampleCategory>(() => findCategoryByUrl(currentUrl));
  const copy = t('clothSampleModal', { returnObjects: true }) as {
    title: string;
    subtitle: string;
    error: string;
    disclaimer: string;
    categories: Record<ClothSampleCategory, string>;
  };
  const categoryLabels = copy.categories;
  const categorySamples = useMemo(
    () => clothSampleOptions.filter((sample) => sample.category === category),
    [category],
  );
  const groupedSamples = categorySamples.reduce<Record<string, typeof categorySamples>>((acc, sample) => {
    if (!acc[sample.country]) {
      acc[sample.country] = [];
    }
    acc[sample.country].push(sample);
    return acc;
  }, {});

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
            {CLOTH_SAMPLE_CATEGORIES.map((tab) => (
              <button
                key={tab}
                className={category === tab ? 'active' : ''}
                onClick={() => setCategory(tab)}
                type="button"
              >
                {categoryLabels[tab]}
              </button>
            ))}
          </div>

          {Object.values(groupedSamples).map((samples) => (
            <div key={samples[0].country} className="cloth-country-group">
              <div className="cloth-country-title">
                {lang === 'ko' ? samples[0].countryLabelKo : samples[0].countryLabelEn}
              </div>
              <div className="sample-grid">
                {samples.map((sample) => (
                  <button
                    key={sample.id}
                    className={`sample-card ${currentUrl === sample.image ? 'selected' : ''} ${erroredUrls[sample.image] ? 'error' : ''}`}
                    onClick={() => {
                      onSelect(sample.image);
                      onClose();
                    }}
                    type="button"
                  >
                    {!loadedUrls[sample.image] && !erroredUrls[sample.image] && (
                      <div className="sample-card-overlay">
                        <span className="spinner sample-spinner"></span>
                      </div>
                    )}
                    <img
                      src={sample.image}
                      alt={sample.label}
                      className={loadedUrls[sample.image] ? 'is-visible' : ''}
                      loading="eager"
                      onError={() => {
                        console.error('[HAMDEVA] cloth sample thumbnail failed', sample.image);
                        setErroredUrls((prev) => ({ ...prev, [sample.image]: true }));
                      }}
                      onLoad={() => setLoadedUrls((prev) => ({ ...prev, [sample.image]: true }))}
                    />
                    <div className="error-placeholder">{copy.error}</div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="modal-disclaimer">{copy.disclaimer}</p>
      </div>
    </div>
  );
};

export default ClothSampleModal;
