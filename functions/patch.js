const fs = require('fs');

let app_tsx = fs.readFileSync('/home/user/evova/src/App.tsx', 'utf8');

const new_upload_check = `  const MAX_IMAGE_SIZE_MB = 10;
  const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;
  const handleImageUpload = (file: File, type: 'person' | 'cloth') => {
    if (file.size > MAX_IMAGE_SIZE_BYTES) { alert(\`이미지는 최대 \${MAX_IMAGE_SIZE_MB}MB까지 업로드할 수 있습니다.\`); return; }`;

app_tsx = app_tsx.replace(
    /  const handleImageUpload = \(file: File, type: 'person' \| 'cloth'\) => \{\n    if \(file\.size > 2 \* 1024 \* 1024\) \{ alert\('이미지 크기는 2MB 이하여야 합니다\.'\); return; \}/,
    new_upload_check
);

const old_lang_options_regex = /const langOptions: \{ value: Lang; label: string; flag: string \}\[\] = \[[\s\S]*?\];/;
const new_lang_options = `const langOptions: { value: Lang; label: string; flag: string }[] = [
  { value: 'en', label: 'English', flag: '🇺🇸' },
  { value: 'es', label: 'Español', flag: '🇪🇸' },
  { value: 'zh', label: '中文', flag: '🇨🇳' },
  { value: 'ja', label: '日本語', flag: '🇯🇵' },
  { value: 'ko', label: '한국어', flag: '🇰🇷' },
  { value: 'hi', label: 'हिन्दी', flag: '🇮🇳' },
  { value: 'fr', label: 'Français', flag: '🇫🇷' },
  { value: 'ar', label: 'العربية', flag: '🇸🇦' },
  { value: 'bn', label: 'বাংলা', flag: '🇧🇩' },
  { value: 'ru', label: 'Русский', flag: '🇷🇺' },
  { value: 'pt', label: 'Português', flag: '🇵🇹' },
  { value: 'ur', label: 'اردو', flag: '🇵🇰' },
  { value: 'id', label: 'Bahasa Indonesia', flag: '🇮🇩' },
  { value: 'de', label: 'Deutsch', flag: '🇩🇪' },
  { value: 'mr', label: 'मराठी', flag: '🇮🇳' },
  { value: 'te', label: 'తెలుగు', flag: '🇮🇳' },
  { value: 'tr', label: 'Türkçe', flag: '🇹🇷' },
  { value: 'ta', label: 'தமிழ்', flag: '🇮🇳' },
  { value: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { value: 'it', label: 'Italiano', flag: '🇮🇹' },
];`;

app_tsx = app_tsx.replace(old_lang_options_regex, new_lang_options);

fs.writeFileSync('/home/user/evova/src/App.tsx', app_tsx);
console.log("Updated App.tsx");

let app_css = fs.readFileSync('/home/user/evova/src/App.css', 'utf8');

const css_patch = `
.lang-dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 5px;
  background: var(--card-bg);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  box-shadow: 0 4px 12px var(--shadow-color);
  min-width: 140px;
  max-height: 350px; /* Limit height to show ~10 items */
  overflow-y: auto;
  z-index: 1000;
  display: flex;
  flex-direction: column;
}
`;

app_css = app_css.replace(/\.lang-dropdown-menu\s*\{[\s\S]*?\n\}/, css_patch.trim());
fs.writeFileSync('/home/user/evova/src/App.css', app_css);
console.log("Updated App.css");
