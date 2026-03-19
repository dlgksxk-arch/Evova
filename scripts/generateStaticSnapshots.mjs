import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const projectRoot = process.cwd();
const distDir = path.join(projectRoot, 'dist');
const indexHtmlPath = path.join(distDir, 'index.html');
const editorialDataPath = path.join(projectRoot, 'src', 'data', 'editorialPages.json');

const routeMap = {
  about: '/about',
  'how-it-works': '/how-to-use',
  'traditional-clothing': '/sample-outfits',
  countries: '/countries',
  'fashion-technology': '/fashion-technology',
  'virtual-try-on-guide': '/virtual-try-on-guide',
  'outfit-photo-tips': '/outfit-photo-tips',
  'ai-fitting-faq': '/ai-fitting-faq',
};

const escapeHtml = (value) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

const renderStructuredData = (pageKey, page, pageUrl) => {
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://hamdeva.com/',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: page.title,
        item: pageUrl,
      },
    ],
  };

  const webPage = {
    '@context': 'https://schema.org',
    '@type': pageKey === 'about' ? 'AboutPage' : 'WebPage',
    name: page.title,
    url: pageUrl,
    description: page.description,
    isPartOf: {
      '@type': 'WebSite',
      name: 'HAMDEVA',
      url: 'https://hamdeva.com',
    },
  };

  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: page.faq.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return [webPage, breadcrumb, faq]
    .map((item) => `<script type="application/ld+json">${JSON.stringify(item)}</script>`)
    .join('\n    ');
};

const renderPageHtml = (pageKey, page, pageUrl, relatedPages, allPages) => {
  const sections = page.sections
    .map(
      (section) => `
        <article class="page-article">
          <h2>${escapeHtml(section.heading)}</h2>
          ${section.paragraphs.map((paragraph) => `<p>${escapeHtml(paragraph)}</p>`).join('\n          ')}
        </article>`,
    )
    .join('\n');

  const related = relatedPages.length > 0
    ? `
      <section class="section editorial-section editorial-related-section">
        <div class="section-copy">
          <h2>Related Reading</h2>
          <p>Continue with pages that explain the workflow, image preparation, and broader fashion context.</p>
        </div>
        <div class="compact-card-grid">
          ${relatedPages
            .map((relatedPageKey) => {
              const relatedPage = allPages[relatedPageKey];
              const relatedUrl = `https://hamdeva.com${routeMap[relatedPageKey]}`;
              return `
              <article class="compact-info-card">
                <h2>${escapeHtml(relatedPage.title)}</h2>
                <p>${escapeHtml(relatedPage.summary)}</p>
                <a class="text-link-btn" href="${relatedUrl}">Open page</a>
              </article>`;
            })
            .join('\n')}
        </div>
      </section>`
    : '';

  const faq = page.faq.length > 0
    ? `
      <section class="seo-faq" aria-labelledby="snapshot-faq-title">
        <div class="seo-faq-inner">
          <h2 id="snapshot-faq-title">${escapeHtml(page.title)} FAQ</h2>
          <div class="seo-faq-list">
            ${page.faq
              .map(
                (item) => `
                <details class="seo-faq-item">
                  <summary class="seo-faq-question">${escapeHtml(item.question)}</summary>
                  <div class="seo-faq-answer">
                    <p>${escapeHtml(item.answer)}</p>
                  </div>
                </details>`,
              )
              .join('\n')}
          </div>
        </div>
      </section>`
    : '';

  return `
    <div id="root">
      <main class="section page-shell prerender-snapshot">
        <div class="section-inner page-layout">
          <article class="page-article">
            <h1>${escapeHtml(page.title)}</h1>
            <p>${escapeHtml(page.summary)}</p>
          </article>
          ${sections}
          ${related}
          ${faq}
        </div>
      </main>
    </div>`;
};

const replaceTag = (html, pattern, replacement) => {
  if (!pattern.test(html)) {
    return html;
  }
  return html.replace(pattern, replacement);
};

const main = async () => {
  const [baseHtml, editorialDataRaw] = await Promise.all([
    readFile(indexHtmlPath, 'utf8'),
    readFile(editorialDataPath, 'utf8'),
  ]);

  const editorialData = JSON.parse(editorialDataRaw);
  const pages = editorialData.pages;

  for (const [pageKey, page] of Object.entries(pages)) {
    const routePath = routeMap[pageKey];
    const pageUrl = `https://hamdeva.com${routePath}`;
    const structuredData = renderStructuredData(pageKey, page, pageUrl);
    const pageBody = renderPageHtml(pageKey, page, pageUrl, page.relatedPages, pages);

    let html = baseHtml;
    html = replaceTag(html, /<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(page.title)} | HAMDEVA</title>`);
    html = replaceTag(html, /<meta\s+name="description"\s+content="[\s\S]*?"\s*\/?>/, `<meta name="description" content="${escapeHtml(page.description)}" />`);
    html = replaceTag(html, /<meta\s+property="og:title"\s+content="[\s\S]*?"\s*\/?>/, `<meta property="og:title" content="${escapeHtml(page.title)} | HAMDEVA" />`);
    html = replaceTag(html, /<meta\s+property="og:description"\s+content="[\s\S]*?"\s*\/?>/, `<meta property="og:description" content="${escapeHtml(page.description)}" />`);
    html = replaceTag(html, /<meta\s+property="og:url"\s+content="[\s\S]*?"\s*\/?>/, `<meta property="og:url" content="${pageUrl}" />`);
    html = replaceTag(html, /<link\s+rel="canonical"\s+href="[\s\S]*?"\s*\/?>/, `<link rel="canonical" href="${pageUrl}" />`);
    html = replaceTag(html, /<meta\s+name="robots"\s+content="[\s\S]*?"\s*\/?>/, '<meta name="robots" content="index, follow" />');
    html = html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/, structuredData);
    html = html.replace('<div id="root"></div>', pageBody);

    const outputDir = path.join(distDir, routePath.replace(/^\//, ''));
    await mkdir(outputDir, { recursive: true });
    await writeFile(path.join(outputDir, 'index.html'), html, 'utf8');
  }
};

await main();
