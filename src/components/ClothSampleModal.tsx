import React, { useEffect, useState } from 'react';
import type { LanguageCode } from '../constants/languages';
import { clothSampleOptions } from '../data/clothSamples';

interface ClothSampleModalProps {
  currentUrl: string | null;
  lang: LanguageCode;
  onClose: () => void;
  onSelect: (url: string) => void;
}

const ClothSampleModal: React.FC<ClothSampleModalProps> = ({ currentUrl, lang, onClose, onSelect }) => {
  const [loadedUrls, setLoadedUrls] = useState<Record<string, boolean>>({});
  const [erroredUrls, setErroredUrls] = useState<Record<string, boolean>>({});

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
            <h3>{lang === 'ko' ? '샘플 의상 선택' : 'Choose Clothing Sample'}</h3>
            <p className="modal-subtitle">
              {lang === 'ko' ? '의상 샘플 선택 UI를 연결할 준비가 되어 있습니다.' : 'Clothing sample selection is ready to connect.'}
            </p>
          </div>
          <button className="close-btn" onClick={onClose} type="button">
            &times;
          </button>
        </div>

        <div className="sample-grid">
          {clothSampleOptions.map((sample) => (
            <button
              key={sample.id}
              className={`sample-card ${currentUrl === sample.image ? 'selected' : ''}`}
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
                loading="lazy"
                onError={() => setErroredUrls((prev) => ({ ...prev, [sample.image]: true }))}
                onLoad={() => setLoadedUrls((prev) => ({ ...prev, [sample.image]: true }))}
              />
              <div className="sample-card-label">{sample.label}</div>
              <div className="error-placeholder">{lang === 'ko' ? '이미지 오류' : 'Image error'}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ClothSampleModal;
