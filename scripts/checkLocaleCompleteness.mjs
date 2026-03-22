import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');
const localesDir = path.join(repoRoot, 'src', 'locales');
const languageConstantsPath = path.join(repoRoot, 'src', 'constants', 'languages.ts');

const args = new Set(process.argv.slice(2));

const readJson = async (filePath) => JSON.parse(await readFile(filePath, 'utf8'));

const extractLanguageCodes = (source, constantName) => {
  const match = source.match(new RegExp(`export const ${constantName} = \\[([\\s\\S]*?)\\] as const`));
  if (!match) {
    throw new Error(`Could not find ${constantName} in src/constants/languages.ts`);
  }

  return Array.from(match[1].matchAll(/'([^']+)'/g), ([, value]) => value);
};

const collectLeafPaths = (value, currentPath = '') => {
  if (Array.isArray(value) || value === null || typeof value !== 'object') {
    return currentPath ? [currentPath] : [];
  }

  return Object.entries(value).flatMap(([key, nestedValue]) => {
    const nextPath = currentPath ? `${currentPath}.${key}` : key;
    return collectLeafPaths(nestedValue, nextPath);
  });
};

const isPlainObject = (value) =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const mergeLocale = (base, override) => {
  if (override === undefined) {
    return base;
  }

  if (Array.isArray(base) || Array.isArray(override)) {
    return override ?? base;
  }

  if (isPlainObject(base) && isPlainObject(override)) {
    const merged = { ...base };

    for (const [key, nestedValue] of Object.entries(override)) {
      merged[key] = mergeLocale(base[key], nestedValue);
    }

    return merged;
  }

  return override ?? base;
};

const constantsSource = await readFile(languageConstantsPath, 'utf8');
const publicLanguageCodes = extractLanguageCodes(constantsSource, 'PUBLIC_LANGUAGE_CODES');
const appSupportedLanguageCodes = extractLanguageCodes(constantsSource, 'APP_SUPPORTED_LANGUAGE_CODES');

const localeFiles = (await readdir(localesDir))
  .filter((fileName) => fileName.endsWith('.json'))
  .map((fileName) => fileName.replace(/\.json$/, ''))
  .filter((code) => code !== 'en');

const targetCodes = args.has('--all')
  ? localeFiles
  : publicLanguageCodes.filter((code) => code !== 'en');

const missingTargets = targetCodes.filter((code) => !localeFiles.includes(code));
if (missingTargets.length > 0) {
  console.error(`Missing locale files for: ${missingTargets.join(', ')}`);
  process.exit(1);
}

const englishLocale = await readJson(path.join(localesDir, 'en.json'));
const englishLeafPaths = new Set(collectLeafPaths(englishLocale));

let hasError = false;

console.log(`Checking locales: ${targetCodes.join(', ')}`);
console.log(`Public locales: ${publicLanguageCodes.join(', ')}`);
console.log(`App-supported locales: ${appSupportedLanguageCodes.join(', ')}`);

for (const code of targetCodes) {
  const locale = await readJson(path.join(localesDir, `${code}.json`));
  const mergedLocale = mergeLocale(englishLocale, locale);
  const localeLeafPaths = new Set(collectLeafPaths(locale));
  const mergedLeafPaths = new Set(collectLeafPaths(mergedLocale));

  const missing = [...englishLeafPaths].filter((leafPath) => !localeLeafPaths.has(leafPath));
  const effectiveMissing = [...englishLeafPaths].filter((leafPath) => !mergedLeafPaths.has(leafPath));
  const extra = [...localeLeafPaths].filter((leafPath) => !englishLeafPaths.has(leafPath));

  console.log(`\n[${code}] untranslated=${missing.length} extra=${extra.length} runtimeMissing=${effectiveMissing.length}`);

  if (effectiveMissing.length > 0) {
    hasError = true;
    for (const leafPath of effectiveMissing.slice(0, 50)) {
      console.log(`  runtime-missing: ${leafPath}`);
    }
    if (effectiveMissing.length > 50) {
      console.log(`  ... ${effectiveMissing.length - 50} more runtime-missing keys`);
    }
  }

  if (missing.length > 0) {
    if (args.has('--strict')) {
      hasError = true;
    }
    for (const leafPath of missing.slice(0, 50)) {
      console.log(`  untranslated: ${leafPath}`);
    }
    if (missing.length > 50) {
      console.log(`  ... ${missing.length - 50} more untranslated keys`);
    }
  }

  if (extra.length > 0) {
    for (const leafPath of extra.slice(0, 20)) {
      console.log(`  extra: ${leafPath}`);
    }
    if (extra.length > 20) {
      console.log(`  ... ${extra.length - 20} more extra keys`);
    }
  }
}

if (hasError) {
  console.error(`\nLocale completeness check failed${args.has('--strict') ? ' in strict mode' : ''}.`);
  process.exit(1);
}

console.log('\nLocale completeness check passed.');
