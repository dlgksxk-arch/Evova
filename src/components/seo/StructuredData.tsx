import React, { useEffect } from 'react';

type JsonLdValue = Record<string, unknown>;
const JSON_LD_SELECTOR = 'script[type="application/ld+json"][data-hamdeva-jsonld="managed"]';
const ANY_JSON_LD_SELECTOR = 'script[type="application/ld+json"]';

interface StructuredDataProps {
  data?: JsonLdValue | JsonLdValue[] | null;
}

const StructuredData: React.FC<StructuredDataProps> = ({ data }) => {
  const items = Array.isArray(data) ? data.filter(Boolean) : data ? [data] : [];

  useEffect(() => {
    const removeManagedScripts = () => {
      document.querySelectorAll(JSON_LD_SELECTOR).forEach((node) => node.remove());
    };

    const nextPayloads = items.map((item) => JSON.stringify(item));
    const existingPayloads = Array.from(document.querySelectorAll<HTMLScriptElement>(ANY_JSON_LD_SELECTOR))
      .map((node) => node.textContent?.trim() ?? '')
      .filter(Boolean);

    const hasSameStructuredData = nextPayloads.length > 0
      && existingPayloads.length >= nextPayloads.length
      && nextPayloads.every((payload) => existingPayloads.includes(payload));

    if (hasSameStructuredData) {
      return undefined;
    }

    removeManagedScripts();

    if (items.length === 0) {
      return removeManagedScripts;
    }

    const scripts = items.map((item) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-hamdeva-jsonld', 'managed');
      script.textContent = JSON.stringify(item);
      document.head.appendChild(script);
      return script;
    });

    return () => {
      scripts.forEach((script) => script.remove());
    };
  }, [items]);

  return null;
};

export default StructuredData;
