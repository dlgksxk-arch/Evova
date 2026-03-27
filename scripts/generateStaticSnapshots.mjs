import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { getRouteDefinition, SNAPSHOT_ROUTE_KEYS } from '../src/lib/routes/routeManifest.ts';

const projectRoot = process.cwd();
const distDir = path.join(projectRoot, 'dist');
const indexHtmlPath = path.join(distDir, 'index.html');
const editorialDataPath = path.join(projectRoot, 'src', 'data', 'editorialPages.json');
const seoLandingPagesPath = path.join(projectRoot, 'src', 'data', 'seoLandingPages.json');
const englishLocalePath = path.join(projectRoot, 'src', 'locales', 'en.json');
const supportEmail = 'support@hamdeva.com';
const siteUrl = 'https://hamdeva.com';
const defaultOgImage = `${siteUrl}/sample/og-image.png`;
const structuredDataBlockPattern = /<!-- HAMDEVA_STRUCTURED_DATA_START -->[\s\S]*?<!-- HAMDEVA_STRUCTURED_DATA_END -->/;
const INDEX_ROBOTS = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';
const NOINDEX_ROBOTS = 'noindex, nofollow, noarchive, nosnippet';

const SNAPSHOT_ROUTE_SEO = {
  home: { priority: '1.0', changefreq: 'weekly' },
  tryon: { priority: '0.95', changefreq: 'weekly' },
  'dog-outfit-generator': { priority: '0.9', changefreq: 'weekly' },
  'cat-outfit-generator': { priority: '0.9', changefreq: 'weekly' },
  'pet-halloween-costume': { priority: '0.8', changefreq: 'weekly' },
  'pet-hanbok': { priority: '0.8', changefreq: 'weekly' },
  'dog-hoodie': { priority: '0.8', changefreq: 'weekly' },
  'cat-formal-outfit': { priority: '0.8', changefreq: 'weekly' },
  about: { priority: '0.7', changefreq: 'monthly' },
  'how-it-works': { priority: '0.8', changefreq: 'monthly' },
  'sample-outfits': { priority: '0.85', changefreq: 'weekly' },
  pricing: { priority: '0.7', changefreq: 'weekly' },
  privacy: { priority: '0.4', changefreq: 'yearly' },
  'refund-policy': { priority: '0.4', changefreq: 'yearly' },
  terms: { priority: '0.4', changefreq: 'yearly' },
  contact: { priority: '0.6', changefreq: 'yearly' },
  'virtual-try-on-guide': { priority: '0.1', changefreq: 'monthly' },
  'fashion-technology': { priority: '0.1', changefreq: 'monthly' },
  'sample-friends': { priority: '0.1', changefreq: 'monthly' },
  'outfit-photo-tips': { priority: '0.1', changefreq: 'monthly' },
  'ai-fitting-faq': { priority: '0.1', changefreq: 'monthly' },
  'account-deletion': { priority: '0.1', changefreq: 'yearly' },
};

const snapshotRoutes = SNAPSHOT_ROUTE_KEYS.map((key) => {
  const route = getRouteDefinition(key);
  const seo = SNAPSHOT_ROUTE_SEO[key];
  if (!seo) {
    throw new Error(`Missing snapshot SEO metadata for route "${key}"`);
  }

  return {
    key,
    path: route.path,
    priority: seo.priority,
    changefreq: seo.changefreq,
    indexable: route.indexable,
    sitemap: route.sitemap,
  };
});

const pageTypeByKey = {
  about: 'AboutPage',
  contact: 'ContactPage',
  'sample-outfits': 'CollectionPage',
};

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
  description: 'HAMDEVA is an AI pet outfit preview tool for dogs and cats.',
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
  description: 'AI pet outfit try-on and outfit preview tool for dogs and cats.',
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

const resolveGaMeasurementId = async () => {
  const envValue = process.env.VITE_GA_MEASUREMENT_ID?.trim();
  return envValue || '';
};

const renderGaBootstrap = (measurementId) => {
  const safeMeasurementId = /^[A-Z0-9-]+$/i.test(measurementId) ? measurementId : '';

  return `    <script>
      window.__HAMDEVA_GA_MEASUREMENT_ID__ = ${JSON.stringify(safeMeasurementId)};
      window.dataLayer = window.dataLayer || [];
      window.gtag = window.gtag || function gtag() {
        window.dataLayer.push(arguments);
      };
      (function initializeHamdevaGa() {
        var measurementId = window.__HAMDEVA_GA_MEASUREMENT_ID__;
        if (!measurementId) {
          return;
        }

        var script = document.createElement('script');
        script.async = true;
        script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(measurementId);
        document.head.appendChild(script);

        window.gtag('js', new Date());
        window.gtag('config', measurementId, { send_page_view: false });
      })();
    </script>`;
};

const replaceTag = (html, pattern, replacement) => (
  pattern.test(html) ? html.replace(pattern, replacement) : html
);

const buildHomeSnapshot = (locale) => ({
  title: locale.meta.homeTitle,
  displayTitle: 'Preview Pet Outfits Before You Buy',
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
  relatedPages: ['tryon', 'sample-outfits', 'dog-outfit-generator', 'cat-outfit-generator', 'pricing'],
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
  relatedPages: ['tryon', 'pricing', 'privacy', 'terms'],
});

const buildTryOnSnapshot = (locale, landingContent) => ({
  title: locale.pages.tryon.title,
  description: locale.pages.tryon.description,
  summary: locale.pages.tryon.description,
  sections: [
    ...locale.pages.tryon.sections,
    ...landingContent.steps.items.map((item) => ({
      heading: `${item.step} ${item.title}`,
      paragraphs: [item.description],
    })),
  ],
  faq: [],
  relatedPages: ['sample-outfits', 'dog-outfit-generator', 'cat-outfit-generator', 'pricing'],
});

const buildSampleOutfitsSnapshot = () => ({
  title: 'Outfit Ideas',
  description: 'Browse pet outfit ideas and costume references before you open the try-on tool.',
  summary: 'Use this page to compare broader directions such as everyday outfits, hoodies, formal looks, holiday costumes, hanbok, and funny themed looks before generation.',
  sections: [
    {
      heading: 'Start with the outfit category, not the final image',
      paragraphs: [
        'Use this hub when you know the mood you want, but do not have the final outfit image yet.',
        'The fastest route is to choose a category first, then move into the try-on tool or a focused landing page.',
      ],
    },
    {
      heading: 'Categories to compare first',
      paragraphs: [
        'Start with everyday, hoodie, formal, holiday, hanbok or traditional, and funny or theme directions.',
        'Traditional looks still matter here, but only as one subcategory inside a broader outfit ideas hub.',
      ],
    },
    {
      heading: 'Use it as a bridge into the tool',
      paragraphs: [
        'Once you find a direction that feels right, move to the try-on page with a stronger outfit image.',
        'That is the practical role of this page: narrowing the idea quickly before generation.',
      ],
    },
  ],
  faq: [],
  relatedPages: ['tryon', 'dog-outfit-generator', 'cat-outfit-generator', 'pet-halloween-costume', 'pet-hanbok'],
});

const buildSnapshotPage = (key, locale, editorialData, seoLandingPages) => {
  if (key === 'home') {
    return buildHomeSnapshot(locale);
  }

  if (key === 'contact') {
    return buildContactSnapshot(locale);
  }

  if (key === 'tryon') {
    return buildTryOnSnapshot(locale, {
      steps: {
        items: [
          { step: '01', title: 'Upload your pet photo', description: 'Choose a clear dog or cat photo with a visible face.' },
          { step: '02', title: 'Add an outfit image', description: 'Use a sample outfit or your own clothing image.' },
          { step: '03', title: 'Generate and compare', description: 'Create the preview, then decide which look is worth keeping.' },
        ],
      },
    });
  }

  if (key === 'sample-outfits') {
    return buildSampleOutfitsSnapshot();
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
          <h2>Related Pages</h2>
          <p>Use these pages when you want a faster route into try-on, pricing, or stronger outfit ideas.</p>
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

  if (page.faq && page.faq.length > 0) {
    structuredData.push(renderFaqSchema(page.faq));
  }

  return renderStructuredDataBlock(structuredData);
};

const renderSitemapXml = (routes, lastModified) => `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes.filter((route) => route.sitemap !== false).map((route) => `  <url>
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
  const gaMeasurementId = await resolveGaMeasurementId();
  const gaBootstrap = renderGaBootstrap(gaMeasurementId);
  const routeLookup = new Map(snapshotRoutes.map((route) => [route.key, route]));
  const pages = new Map(snapshotRoutes.map((route) => [route.key, buildSnapshotPage(route.key, locale, editorialData, seoLandingPages)]));
  const lastModified = new Date().toISOString().slice(0, 10);

  for (const route of snapshotRoutes) {
    const page = pages.get(route.key);
    if (!page) {
      continue;
    }

    const pageUrl = `${siteUrl}${route.path === '/' ? '/' : route.path}`;
    const documentTitle = page.title.includes('HAMDEVA') ? page.title : `${page.title} | HAMDEVA`;
    const structuredData = renderStructuredData(route.key, page, pageUrl);
    const pageBody = renderPageBody(page, pages, routeLookup);
    const robotsContent = route.indexable === false ? NOINDEX_ROBOTS : INDEX_ROBOTS;

    let html = baseHtml;
    html = replaceTag(html, /<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(documentTitle)}</title>`);
    html = replaceTag(html, /<meta\s+name="description"\s+content="[\s\S]*?"\s*\/?>/, `<meta name="description" content="${escapeHtml(page.description)}" />`);
    html = replaceTag(html, /<meta\s+name="robots"\s+content="[\s\S]*?"\s*\/?>/, `<meta name="robots" content="${robotsContent}" />`);
    html = replaceTag(html, /<meta\s+property="og:title"\s+content="[\s\S]*?"\s*\/?>/, `<meta property="og:title" content="${escapeHtml(documentTitle)}" />`);
    html = replaceTag(html, /<meta\s+property="og:description"\s+content="[\s\S]*?"\s*\/?>/, `<meta property="og:description" content="${escapeHtml(page.description)}" />`);
    html = replaceTag(html, /<meta\s+property="og:url"\s+content="[\s\S]*?"\s*\/?>/, `<meta property="og:url" content="${pageUrl}" />`);
    html = replaceTag(html, /<meta\s+property="og:image"\s+content="[\s\S]*?"\s*\/?>/, `<meta property="og:image" content="${defaultOgImage}" />`);
    html = replaceTag(html, /<meta\s+property="og:image:alt"\s+content="[\s\S]*?"\s*\/?>/, '<meta property="og:image:alt" content="HAMDEVA pet outfit preview" />');
    html = replaceTag(html, /<meta\s+name="twitter:title"\s+content="[\s\S]*?"\s*\/?>/, `<meta name="twitter:title" content="${escapeHtml(documentTitle)}" />`);
    html = replaceTag(html, /<meta\s+name="twitter:description"\s+content="[\s\S]*?"\s*\/?>/, `<meta name="twitter:description" content="${escapeHtml(page.description)}" />`);
    html = replaceTag(html, /<meta\s+name="twitter:image"\s+content="[\s\S]*?"\s*\/?>/, `<meta name="twitter:image" content="${defaultOgImage}" />`);
    html = replaceTag(html, /<meta\s+name="twitter:image:alt"\s+content="[\s\S]*?"\s*\/?>/, '<meta name="twitter:image:alt" content="HAMDEVA pet outfit preview" />');
    html = replaceTag(html, /<link\s+rel="canonical"\s+href="[\s\S]*?"\s*\/?>/, `<link rel="canonical" href="${pageUrl}" />`);
    html = html.replace('<!-- HAMDEVA_GA_BOOTSTRAP -->', gaBootstrap);
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
