import React, { useEffect } from 'react';
import type { ContentLocale, ModalTab } from '../locales';

interface ContentModalProps {
  activeTab: ModalTab;
  locale: ContentLocale;
  onClose: () => void;
  onTabChange: (tab: ModalTab) => void;
}

const TAB_ORDER: ModalTab[] = ['overview', 'technology', 'cultural', 'future', 'countries'];

const ContentModal: React.FC<ContentModalProps> = ({ activeTab, locale, onClose, onTabChange }) => {
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
      <div className="modal-content content-modal" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h3>{locale.modal.title}</h3>
          </div>
          <button className="close-btn" onClick={onClose} type="button">
            &times;
          </button>
        </div>

        <div className="sample-category-tabs content-tabs">
          {TAB_ORDER.map((tab) => (
            <button
              key={tab}
              className={activeTab === tab ? 'active' : ''}
              onClick={() => onTabChange(tab)}
              type="button"
            >
              {locale.modal.tabs[tab]}
            </button>
          ))}
        </div>

        <div className="sample-modal-body content-modal-body">
          {activeTab === 'countries' ? (
            <div className="content-country-block">
              <p className="content-modal-intro">{locale.modal.countriesIntro}</p>
              <div className="country-card-grid">
                {locale.modal.countries.map((item) => (
                  <article key={`${item.country}-${item.clothing}`} className="country-card">
                    <span className="country-card-name">{item.country}</span>
                    <h4>{item.clothing}</h4>
                    <p>{item.description}</p>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <article className="page-article content-modal-article">
              <h2>{locale.modal[activeTab].title}</h2>
              {locale.modal[activeTab].paragraphs.map((paragraph: string) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </article>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContentModal;
