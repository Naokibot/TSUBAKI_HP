import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const contentDirectory = path.join(projectRoot, 'content');

async function readJson(fileName) {
  return JSON.parse(await readFile(path.join(contentDirectory, fileName), 'utf8'));
}

const [languages, site, skills, projects, posts, achievements] = await Promise.all([
  readJson('languages.json'),
  readJson('site.json'),
  readJson('skills.json'),
  readJson('projects.json'),
  readJson('posts.json'),
  readJson('achievements.json')
]);

const languageCodes = Object.keys(languages);
const errors = [];

function report(condition, message) {
  if (!condition) errors.push(message);
}

function isLocalizedObject(value) {
  return value
    && typeof value === 'object'
    && !Array.isArray(value)
    && Object.prototype.hasOwnProperty.call(value, 'ja')
    && Object.prototype.hasOwnProperty.call(value, 'en');
}

function visit(value, location = 'content') {
  if (isLocalizedObject(value)) {
    for (const languageCode of languageCodes) {
      const translation = value[languageCode];
      report(translation !== undefined, `${location} is missing “${languageCode}”.`);
      report(
        Array.isArray(translation) ? translation.length > 0 : String(translation ?? '').trim().length > 0,
        `${location}.${languageCode} is empty.`
      );
    }
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => visit(item, `${location}[${index}]`));
    return;
  }

  if (value && typeof value === 'object') {
    for (const [key, child] of Object.entries(value)) {
      visit(child, `${location}.${key}`);
    }
  }
}

// Pass 1: structural completeness across every localized field.
visit(site, 'site');
visit(skills, 'skills');
visit(projects, 'projects');
visit(posts, 'posts');
visit(achievements, 'achievements');

// Pass 2: language metadata and UI dictionaries must remain aligned.
const referenceUiKeys = Object.keys(languages.ja.ui).sort();
const paths = new Set();
const htmlLanguages = new Set();

for (const languageCode of languageCodes) {
  const language = languages[languageCode];
  const uiKeys = Object.keys(language.ui || {}).sort();

  report(JSON.stringify(uiKeys) === JSON.stringify(referenceUiKeys), `${languageCode}.ui does not match the Japanese UI key set.`);
  report(!paths.has(language.path), `Duplicate language path: “${language.path}”.`);
  report(!htmlLanguages.has(language.htmlLang), `Duplicate htmlLang: “${language.htmlLang}”.`);
  report(String(language.label || '').trim(), `${languageCode}.label is empty.`);
  report(String(language.shortLabel || '').trim(), `${languageCode}.shortLabel is empty.`);

  paths.add(language.path);
  htmlLanguages.add(language.htmlLang);
}

report(languages.ja.path === '', 'Japanese must remain the root language with an empty path.');
report(languageCodes.length === 8, `Expected 8 languages, found ${languageCodes.length}.`);

// Pass 3: publishing hygiene and editorial consistency.
const serializedContent = JSON.stringify({ site, skills, projects, posts, achievements });
report(!/\b(TODO|TBD|TRANSLATE_ME)\b/.test(serializedContent), 'Unfinished translation marker found.');
report(!serializedContent.includes('gemeinsam genutzter'), 'A non-Russian phrase remains in the Russian ByteQuest highlights.');

for (const post of posts) {
  const japaneseHeadingCount = (post.content.ja.match(/^#{1,2} /gm) || []).length;
  for (const languageCode of languageCodes) {
    const headingCount = (post.content[languageCode].match(/^#{1,2} /gm) || []).length;
    report(
      headingCount === japaneseHeadingCount,
      `posts.${post.slug}.content.${languageCode} has ${headingCount} headings; expected ${japaneseHeadingCount}.`
    );
  }
}

if (errors.length) {
  console.error('\nTranslation validation failed:\n');
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Translation validation passed for ${languageCodes.length} languages.`);
console.log('Pass 1: localized field completeness');
console.log('Pass 2: locale metadata and UI key parity');
console.log('Pass 3: publishing hygiene and article structure');
