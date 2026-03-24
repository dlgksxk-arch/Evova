import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const projectRoot = process.cwd();
const distDir = path.join(projectRoot, 'dist');
const indexHtmlPath = path.join(distDir, 'index.html');
const editorialDataPath = path.join(projectRoot, 'src', 'data', 'editorialPages.json');
const seoLandingPagesPath = path.join(projectRoot, 'src', 'data', 'seoLandingPages.json');
const englishLocalePath = path.join(projectRoot, 'src', 'locales', 'en.json');
const supportEmail = 'dlgksxk@gmail.com';
const siteUrl = 'https://hamdeva.com';
const defaultOgImage = `${siteUrl}/sample/og/og-image.png`;
const withBrand = (title) => (title.includes('HAMDEVA') ? title : `${title} | HAMDEVA`);
const structuredDataBlockPattern = /<!-- HAMDEVA_STRUCTURED_DATA_START -->[\s\S]*?<!-- HAMDEVA_STRUCTURED_DATA_END -->/;

const snapshotRoutes = [
  { key: 'home', path: '/', priority: '1.0', changefreq: 'weekly' },
  { key: 'dog-hanbok', path: '/dog-hanbok', priority: '0.8', changefreq: 'weekly' },
  { key: 'cat-kimono', path: '/cat-kimono', priority: '0.8', changefreq: 'weekly' },
  { key: 'pet-qipao', path: '/pet-qipao', priority: '0.8', changefreq: 'weekly' },
  { key: 'pet-saree', path: '/pet-saree', priority: '0.8', changefreq: 'weekly' },
  { key: 'maltese-hanbok', path: '/maltese-hanbok', priority: '0.8', changefreq: 'weekly' },
  { key: 'shiba-kimono', path: '/shiba-kimono', priority: '0.8', changefreq: 'weekly' },
  { key: 'corgi-qipao', path: '/corgi-qipao', priority: '0.8', changefreq: 'weekly' },
  { key: 'persian-cat-saree', path: '/persian-cat-saree', priority: '0.8', changefreq: 'weekly' },
  { key: 'tuxedo-cat-hanbok', path: '/tuxedo-cat-hanbok', priority: '0.8', changefreq: 'weekly' },
  { key: 'poodle-wedding-dress', path: '/poodle-wedding-dress', priority: '0.8', changefreq: 'weekly' },
  { key: 'ragdoll-kimono', path: '/ragdoll-kimono', priority: '0.8', changefreq: 'weekly' },
  { key: 'about', path: '/about', priority: '0.8', changefreq: 'monthly' },
  { key: 'how-it-works', path: '/how-to-use', priority: '0.9', changefreq: 'monthly' },
  { key: 'traditional-clothing', path: '/sample-outfits', priority: '0.9', changefreq: 'weekly' },
  { key: 'sample-friends', path: '/sample-friends', priority: '0.8', changefreq: 'weekly' },
  { key: 'fashion-technology', path: '/fashion-technology', priority: '0.8', changefreq: 'monthly' },
  { key: 'pricing', path: '/pricing', priority: '0.8', changefreq: 'weekly' },
  { key: 'virtual-try-on-guide', path: '/virtual-try-on-guide', priority: '0.7', changefreq: 'monthly' },
  { key: 'outfit-photo-tips', path: '/outfit-photo-tips', priority: '0.7', changefreq: 'monthly' },
  { key: 'ai-fitting-faq', path: '/ai-fitting-faq', priority: '0.7', changefreq: 'monthly' },
  { key: 'privacy', path: '/privacy', priority: '0.5', changefreq: 'yearly' },
  { key: 'refund-policy', path: '/refund-policy', priority: '0.5', changefreq: 'yearly' },
  { key: 'terms', path: '/terms', priority: '0.5', changefreq: 'yearly' },
  { key: 'contact', path: '/contact', priority: '0.6', changefreq: 'yearly' },
];

const pageTypeByKey = {
  about: 'AboutPage',
  contact: 'ContactPage',
  'traditional-clothing': 'CollectionPage',
  'sample-friends': 'CollectionPage',
};

const articlePages = new Set([
  'dog-hanbok',
  'cat-kimono',
  'pet-qipao',
  'pet-saree',
  'maltese-hanbok',
  'shiba-kimono',
  'corgi-qipao',
  'persian-cat-saree',
  'tuxedo-cat-hanbok',
  'poodle-wedding-dress',
  'ragdoll-kimono',
  'traditional-clothing',
  'fashion-technology',
  'virtual-try-on-guide',
  'outfit-photo-tips',
  'ai-fitting-faq',
]);

const escapeHtml = (value) =>
  String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

const renderJsonLd = (item) =>
  `<script type="application/ld+json" data-hamdeva-jsonld="managed">${JSON.stringify(item)}</script>`;

const renderStructuredDataBlock = (items) => `<!-- HAMDEVA_STRUCTURED_DATA_START -->
    ${items.map((item) => renderJsonLd(item)).join('\n    ')}
    <!-- HAMDEVA_STRUCTURED_DATA_END -->`;

const renderFaqSchema = (items) => ({
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

const renderBreadcrumbSchema = (title, pageUrl) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: [
    {
      '@type': 'ListItem',
      position: 1,
      name: 'Home',
      item: `${siteUrl}/`,
    },
    {
      '@type': 'ListItem',
      position: 2,
      name: title,
      item: pageUrl,
    },
  ],
});

const renderOrganizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'HAMDEVA',
  url: siteUrl,
  description: 'HAMDEVA is an AI pet fitting platform for dogs and cats.',
  logo: defaultOgImage,
  contactPoint: [
    {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: supportEmail,
    },
  ],
});

const renderWebSiteSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'HAMDEVA',
  url: siteUrl,
  description: 'AI pet fitting platform for virtual try-on and outfit preview.',
});

const renderWebPageSchema = (page, pageUrl, pageType) => ({
  '@context': 'https://schema.org',
  '@type': pageType || 'WebPage',
  name: page.title,
  url: pageUrl,
  description: page.description,
  isPartOf: {
    '@type': 'WebSite',
    name: 'HAMDEVA',
    url: siteUrl,
  },
});

const renderArticleSchema = (page, pageUrl, articleType = 'Article') => ({
  '@context': 'https://schema.org',
  '@type': articleType,
  headline: page.title,
  description: page.description,
  mainEntityOfPage: pageUrl,
  url: pageUrl,
  image: [defaultOgImage],
  publisher: {
    '@type': 'Organization',
    name: 'HAMDEVA',
    url: siteUrl,
    logo: {
      '@type': 'ImageObject',
      url: defaultOgImage,
    },
  },
});

const renderHowToSchema = (page, pageUrl) => ({
  '@context': 'https://schema.org',
  '@type': 'HowTo',
  name: page.title,
  url: pageUrl,
  description: page.description,
  step: page.sections.slice(0, 3).map((section, index) => ({
    '@type': 'HowToStep',
    position: index + 1,
    name: section.heading,
    text: section.paragraphs.join(' '),
  })),
});

const replaceTag = (html, pattern, replacement) => (
  pattern.test(html) ? html.replace(pattern, replacement) : html
);

const buildHomeSnapshot = (locale) => ({
  title: locale.meta.homeTitle,
  displayTitle: 'HAMDEVA AI Pet Fitting',
  description: locale.meta.homeDescription,
  summary: locale.meta.homeDescription,
  sections: [
    {
      heading: locale.homeSeo.title,
      paragraphs: locale.homeSeo.introParagraphs,
    },
    {
      heading: locale.homeSeo.whyTitle,
      paragraphs: [locale.homeSeo.whyBody],
    },
    {
      heading: locale.homeSeo.exploreTitle,
      paragraphs: [locale.homeSeo.exploreBody],
    },
  ],
  faq: [],
  relatedPages: ['about', 'how-it-works', 'traditional-clothing', 'pricing', 'contact'],
});

const buildContactSnapshot = (locale) => ({
  title: locale.pages.contact.title,
  description: locale.pages.contact.description,
  summary: locale.pages.contact.description,
  sections: [
    {
      heading: locale.contact.supportTitle,
      paragraphs: [
        `${locale.contact.supportBody} ${supportEmail}.`,
        locale.contact.supportFootnote,
      ],
    },
    {
      heading: locale.contact.formTitle,
      paragraphs: [
        `Support email: ${supportEmail}`,
        'Please include your name, account email, and a short description of the issue so HAMDEVA can review the request faster.',
      ],
    },
  ],
  faq: [],
  relatedPages: ['about', 'pricing', 'privacy', 'terms'],
});

const buildSnapshotPage = (key, locale, editorialData, seoLandingPages) => {
  if (key === 'home') {
    return buildHomeSnapshot(locale);
  }

  if (key === 'contact') {
    return buildContactSnapshot(locale);
  }

  if (seoLandingPages[key]) {
    return seoLandingPages[key];
  }

  const editorialPage = editorialData.pages[key];
  if (editorialPage) {
    return {
      title: editorialPage.title,
      description: editorialPage.description,
      summary: editorialPage.summary,
      sections: editorialPage.sections,
      faq: editorialPage.faq,
      relatedPages: editorialPage.relatedPages.filter((pageKey) => pageKey !== 'countries'),
    };
  }

  const pageCopy = locale.pages[key];
  return {
    title: pageCopy.title,
    description: pageCopy.description,
    summary: pageCopy.description,
    sections: pageCopy.sections || [],
    faq: [],
    relatedPages: [],
  };
};

const renderRelatedPages = (page, allPages, routeLookup) => {
  if (!page.relatedPages || page.relatedPages.length === 0) {
    return '';
  }

  const items = page.relatedPages
    .map((pageKey) => {
      const relatedPage = allPages.get(pageKey);
      const relatedRoute = routeLookup.get(pageKey);
      if (!relatedPage || !relatedRoute) {
        return '';
      }

      return `
        <article class="compact-info-card">
          <h2>${escapeHtml(relatedPage.title)}</h2>
          <p>${escapeHtml(relatedPage.description)}</p>
          <a class="text-link-btn" href="${siteUrl}${relatedRoute.path}">Open page</a>
        </article>`;
    })
    .filter(Boolean)
    .join('\n');

  if (!items) {
    return '';
  }

  return `
      <section class="section editorial-section editorial-related-section">
        <div class="section-copy">
          <h2>Related Reading</h2>
          <p>Continue with public pages that explain the workflow, pricing, policies, and topic context around HAMDEVA.</p>
        </div>
        <div class="compact-card-grid">
          ${items}
        </div>
      </section>`;
};

const renderFaqSection = (page) => {
  if (!page.faq || page.faq.length === 0) {
    return '';
  }

  return `
      <section class="seo-faq" aria-labelledby="snapshot-faq-title">
        <div class="seo-faq-inner">
          <h2 id="snapshot-faq-title">${escapeHtml(page.title)} FAQ</h2>
          <div class="seo-faq-list">
            ${page.faq
              .map((item) => `
                <details class="seo-faq-item">
                  <summary class="seo-faq-question">${escapeHtml(item.question)}</summary>
                  <div class="seo-faq-answer">
                    <p>${escapeHtml(item.answer)}</p>
                  </div>
                </details>`)
              .join('\n')}
          </div>
        </div>
      </section>`;
};

const renderPageBody = (page, allPages, routeLookup) => {
  const introBody = page.summary && page.summary !== page.description
    ? `<p>${escapeHtml(page.summary)}</p>`
    : `<p>${escapeHtml(page.description)}</p>`;
  const displayTitle = page.displayTitle || page.title;
  const sections = page.sections
    .map((section) => `
      <article class="page-article">
        <h2>${escapeHtml(section.heading)}</h2>
        ${section.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('\n        ')}
      </article>`)
    .join('\n');

  return `
    <div id="root">
      <main class="section page-shell prerender-snapshot">
        <div class="section-inner page-layout">
          <article class="page-article">
            <h1>${escapeHtml(displayTitle)}</h1>
            ${introBody}
          </article>
          ${sections}
          ${renderRelatedPages(page, allPages, routeLookup)}
          ${renderFaqSection(page)}
        </div>
      </main>
    </div>`;
};

const renderStructuredData = (routeKey, page, pageUrl) => {
  const structuredData = [];

  structuredData.push(renderWebPageSchema(page, pageUrl, pageTypeByKey[routeKey]));
  if (routeKey !== 'home') {
    structuredData.push(renderBreadcrumbSchema(page.title, pageUrl));
  }

  if (routeKey === 'home') {
    structuredData.push(renderOrganizationSchema());
    structuredData.push(renderWebSiteSchema());
  }

  if (routeKey === 'how-it-works') {
    structuredData.push(renderHowToSchema(page, pageUrl));
  }

  if (articlePages.has(routeKey)) {
    structuredData.push(
      renderArticleSchema(
        page,
        pageUrl,
        routeKey === 'fashion-technology' ? 'TechArticle' : 'Article',
      ),
    );
  }

  if (page.faq && page.faq.length > 0) {
    structuredData.push(renderFaqSchema(page.faq));
  }

  return renderStructuredDataBlock(structuredData);
};

const renderSitemapXml = (routes, lastModified) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.map((route) => `  <url>
    <loc>${siteUrl}${route.path === '/' ? '/' : route.path}</loc>
    <lastmod>${lastModified}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`).join('\n')}
</urlset>
`;

const main = async () => {
  const [baseHtml, editorialDataRaw, seoLandingPagesRaw, englishLocaleRaw] = await Promise.all([
    readFile(indexHtmlPath, 'utf8'),
    readFile(editorialDataPath, 'utf8'),
    readFile(seoLandingPagesPath, 'utf8'),
    readFile(englishLocalePath, 'utf8'),
  ]);

  const editorialData = JSON.parse(editorialDataRaw);
  const seoLandingPages = JSON.parse(seoLandingPagesRaw);
  const locale = JSON.parse(englishLocaleRaw);
  const routeLookup = new Map(snapshotRoutes.map((route) => [route.key, route]));
  const pages = new Map(snapshotRoutes.map((route) => [route.key, buildSnapshotPage(route.key, locale, editorialData, seoLandingPages)]));
  const lastModified = new Date().toISOString().slice(0, 10);

  for (const route of snapshotRoutes) {
    const page = pages.get(route.key);
    if (!page) {
      continue;
    }

    const pageUrl = `${siteUrl}${route.path === '/' ? '/' : route.path}`;
    const documentTitle = route.key === 'home' ? withBrand(page.title) : withBrand(page.title);
    const structuredData = renderStructuredData(route.key, page, pageUrl);
    const pageBody = renderPageBody(page, pages, routeLookup);

    let html = baseHtml;
    html = replaceTag(html, /<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(documentTitle)}</title>`);
    html = replaceTag(html, /<meta\s+name="description"\s+content="[\s\S]*?"\s*\/?>/, `<meta name="description" content="${escapeHtml(page.description)}" />`);
    html = replaceTag(html, /<meta\s+name="robots"\s+content="[\s\S]*?"\s*\/?>/, '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />');
    html = replaceTag(html, /<meta\s+property="og:title"\s+content="[\s\S]*?"\s*\/?>/, `<meta property="og:title" content="${escapeHtml(documentTitle)}" />`);
    html = replaceTag(html, /<meta\s+property="og:description"\s+content="[\s\S]*?"\s*\/?>/, `<meta property="og:description" content="${escapeHtml(page.description)}" />`);
    html = replaceTag(html, /<meta\s+property="og:url"\s+content="[\s\S]*?"\s*\/?>/, `<meta property="og:url" content="${pageUrl}" />`);
    html = replaceTag(html, /<meta\s+property="og:image"\s+content="[\s\S]*?"\s*\/?>/, `<meta property="og:image" content="${defaultOgImage}" />`);
    html = replaceTag(html, /<meta\s+property="og:image:alt"\s+content="[\s\S]*?"\s*\/?>/, '<meta property="og:image:alt" content="HAMDEVA pet fitting preview" />');
    html = replaceTag(html, /<meta\s+name="twitter:title"\s+content="[\s\S]*?"\s*\/?>/, `<meta name="twitter:title" content="${escapeHtml(documentTitle)}" />`);
    html = replaceTag(html, /<meta\s+name="twitter:description"\s+content="[\s\S]*?"\s*\/?>/, `<meta name="twitter:description" content="${escapeHtml(page.description)}" />`);
    html = replaceTag(html, /<meta\s+name="twitter:image"\s+content="[\s\S]*?"\s*\/?>/, `<meta name="twitter:image" content="${defaultOgImage}" />`);
    html = replaceTag(html, /<meta\s+name="twitter:image:alt"\s+content="[\s\S]*?"\s*\/?>/, '<meta name="twitter:image:alt" content="HAMDEVA pet fitting preview" />');
    html = replaceTag(html, /<link\s+rel="canonical"\s+href="[\s\S]*?"\s*\/?>/, `<link rel="canonical" href="${pageUrl}" />`);
    html = html.replace(structuredDataBlockPattern, structuredData);
    html = html.replace('<div id="root"></div>', pageBody);

    if (route.path === '/') {
      await writeFile(indexHtmlPath, html, 'utf8');
      continue;
    }

    const outputDir = path.join(distDir, route.path.replace(/^\//, ''));
    await mkdir(outputDir, { recursive: true });
    await writeFile(path.join(outputDir, 'index.html'), html, 'utf8');
  }

  await writeFile(path.join(distDir, 'sitemap.xml'), renderSitemapXml(snapshotRoutes, lastModified), 'utf8');
};

await main();
