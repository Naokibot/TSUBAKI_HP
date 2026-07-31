import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = async (fileName) => JSON.parse(await readFile(path.join(projectRoot, fileName), 'utf8'));
const exists = async (fileName) => access(path.join(projectRoot, fileName)).then(() => true).catch(() => false);

const [languages, site, posts] = await Promise.all([
  readJson('content/languages.json'),
  readJson('content/site.json'),
  readJson('content/posts.json')
]);
const appSource = await readFile(path.join(projectRoot, 'src/app.js'), 'utf8');
const buildSource = await readFile(path.join(projectRoot, 'scripts/build.mjs'), 'utf8');
const siteSource = await readFile(path.join(projectRoot, 'content/site.json'), 'utf8');

assert.equal(Object.keys(languages).length, 8, 'Eight languages are required.');
assert.ok(Array.isArray(posts), 'content/posts.json must remain an array.');
assert.equal(posts.length, 0, 'The blog must be empty while it is marked as preparing.');
assert.equal(site.stats[0]?.value, '2', 'The primary project count must be 2.');
assert.equal(site.githubUrl, 'https://github.com/Naokibot', 'Only the GitHub social link should remain.');
assert.equal(Object.hasOwn(site, 'focusAreas'), false, 'The activity-area data must be removed.');
assert.equal(Object.hasOwn(site, 'contactEndpoint'), false, 'Contact settings must be removed.');
assert.equal(Object.hasOwn(site, 'xUrl'), false, 'X must not be configured.');
assert.equal(Object.hasOwn(site, 'instagramUrl'), false, 'Instagram must not be configured.');
assert.equal(await exists('content/projects.json'), false, 'Legacy manual projects must remain removed.');
assert.equal(await exists('content/achievements.json'), false, 'Legacy achievement data must remain removed.');

const combinedSource = `${appSource}\n${buildSource}\n${siteSource}`;
for (const forbidden of [
  'formspree',
  'contact-form',
  '/api/contact',
  'api.github.com/users',
  'hero-collage',
  '100%',
  '学生主体',
  '資格・受賞歴を追加できます',
  'クロスプラットフォーム学習・集中支援の研究',
  'スクリーン管理、学習可視化、利用者テスト'
]) {
  assert.equal(combinedSource.toLowerCase().includes(forbidden.toLowerCase()), false, `Forbidden release text remains: ${forbidden}`);
}

const referenceUiKeys = Object.keys(languages.ja.ui).sort();
for (const [languageCode, language] of Object.entries(languages)) {
  assert.deepEqual(Object.keys(language.ui).sort(), referenceUiKeys, `${languageCode} UI keys must match Japanese.`);
}

console.log('Release validation passed: preparing states, two core projects, no contact form, no extra social links, and no legacy display copy.');
