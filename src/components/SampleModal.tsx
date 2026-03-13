import React, { useEffect, useMemo, useState } from 'react';
import type { LanguageCode } from '../constants/languages';
import { FACE_SAMPLES, type FaceCategory } from '../data/faceSamples';

const FACE_CATEGORY_LABELS: Record<'ko' | 'default', Record<FaceCategory, string>> = {
  ko: { female: '여성', male: '남성', dog: '강아지', cat: '고양이' },
  default: { female: 'Women', male: 'Men', dog: 'Dog', cat: 'Cat' },
};

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

const SampleModal: React.FC<SampleModalProps> = ({ currentUrl, lang, onClose, onSelect }) => {
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
  const labels = lang === 'ko' ? FACE_CATEGORY_LABELS.ko : FACE_CATEGORY_LABELS.default;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content sample-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>{lang === 'ko' ? '샘플 선택' : 'Choose Sample'}</h3>
            <p className="modal-subtitle">
              {lang === 'ko' ? '미리보기에 사용할 샘플 이미지를 선택하세요.' : 'Select a sample image for the preview.'}
            </p>
          </div>
          <button className="close-btn" onClick={onClose} type="button">
            &times;
          </button>
        </div>

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
              className={`sample-card ${currentUrl === url ? 'selected' : ''}`}
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
                loading="lazy"
                onError={() => setErroredUrls((prev) => ({ ...prev, [url]: true }))}
                onLoad={() => setLoadedUrls((prev) => ({ ...prev, [url]: true }))}
              />
              <div className="error-placeholder">{lang === 'ko' ? '이미지 오류' : 'Image error'}</div>
            </button>
          ))}
        </div>
        <p className="modal-disclaimer">모든 이미지는 AI로 생성되었습니다.</p>
      </div>
    </div>
  );
};

export default SampleModal;
