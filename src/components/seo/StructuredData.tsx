import React from 'react';

type JsonLdValue = Record<string, unknown>;

interface StructuredDataProps {
  data?: JsonLdValue | JsonLdValue[] | null;
}

const StructuredData: React.FC<StructuredDataProps> = ({ data }) => {
  const items = Array.isArray(data) ? data.filter(Boolean) : data ? [data] : [];

  if (items.length === 0) {
    return null;
  }

  return (
    <>
      {items.map((item, index) => (
        <script
          key={`structured-data-${index}`}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </>
  );
};

export default StructuredData;
