import type { FAQItem } from '../../data/faq';

export type BreadcrumbItem = {
  name: string;
  url: string;
};

export type OrganizationSchemaConfig = {
  name: string;
  url: string;
  description: string;
  logo?: string;
  contactEmail?: string;
  contactType?: string;
  sameAs?: string[];
};

export type WebSiteSchemaConfig = {
  name: string;
  url: string;
  description?: string;
  searchUrlTemplate?: string;
};

export type WebPageSchemaConfig = {
  title: string;
  url: string;
  description?: string;
  pageType?: string;
};

export type ArticleSchemaConfig = {
  headline: string;
  url: string;
  description?: string;
  image?: string;
  articleType?: 'Article' | 'TechArticle';
};

export type HowToSchemaConfig = {
  title: string;
  url: string;
  description?: string;
  steps: Array<{
    name: string;
    text: string;
  }>;
};

export const createFAQPageSchema = (items: FAQItem[]) => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: items.map((item) => ({
    '@type': 'Question',
    name: item.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: item.answer,
    },
  })),
});

export const createBreadcrumbSchema = (items: BreadcrumbItem[]) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: item.name,
    item: item.url,
  })),
});

export const createOrganizationSchema = (config: OrganizationSchemaConfig) => {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: config.name,
    url: config.url,
    description: config.description,
  };

  if (config.logo) {
    schema.logo = config.logo;
  }

  if (config.contactEmail) {
    schema.contactPoint = [
      {
        '@type': 'ContactPoint',
        contactType: config.contactType ?? 'customer support',
        email: config.contactEmail,
      },
    ];
  }

  if (config.sameAs && config.sameAs.length > 0) {
    schema.sameAs = config.sameAs;
  }

  return schema;
};

export const createWebSiteSchema = (config: WebSiteSchemaConfig) => {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: config.name,
    url: config.url,
  };

  if (config.description) {
    schema.description = config.description;
  }

  if (config.searchUrlTemplate) {
    schema.potentialAction = {
      '@type': 'SearchAction',
      target: config.searchUrlTemplate,
      'query-input': 'required name=search_term_string',
    };
  }

  return schema;
};

export const createWebPageSchema = (config: WebPageSchemaConfig) => ({
  '@context': 'https://schema.org',
  '@type': config.pageType ?? 'WebPage',
  name: config.title,
  url: config.url,
  description: config.description,
  isPartOf: {
    '@type': 'WebSite',
    name: 'HAMDEVA',
    url: 'https://hamdeva.com',
  },
});

export const createArticleSchema = (config: ArticleSchemaConfig) => {
  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': config.articleType ?? 'Article',
    headline: config.headline,
    mainEntityOfPage: config.url,
    url: config.url,
    publisher: {
      '@type': 'Organization',
      name: 'HAMDEVA',
      url: 'https://hamdeva.com',
      logo: {
        '@type': 'ImageObject',
        url: 'https://hamdeva.com/sample/og/og-image.png',
      },
    },
  };

  if (config.description) {
    schema.description = config.description;
  }

  if (config.image) {
    schema.image = [config.image];
  }

  return schema;
};

export const createHowToSchema = (config: HowToSchemaConfig) => ({
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: config.title,
  url: config.url,
  description: config.description,
  step: config.steps.map((step, index) => ({
    '@type': 'HowToStep',
    position: index + 1,
    name: step.name,
    text: step.text,
  })),
});
