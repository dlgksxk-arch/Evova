import React from 'react';
import type { FAQItem } from '../../data/faq';

interface FAQSectionProps {
  title: string;
  items: FAQItem[];
}

const FAQSection: React.FC<FAQSectionProps> = ({ title, items }) => {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="seo-faq" aria-labelledby="seo-faq-title">
      <div className="seo-faq-inner">
        <h2 id="seo-faq-title">{title}</h2>
        <div className="seo-faq-list">
          {items.map((item) => (
            <details key={item.question} className="seo-faq-item">
              <summary className="seo-faq-question">{item.question}</summary>
              <div className="seo-faq-answer">
                <p>{item.answer}</p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQSection;
