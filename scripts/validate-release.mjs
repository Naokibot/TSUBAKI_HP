import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = async (fileName) => JSON.parse(await readFile(path.join(projectRoot, fileName), 'utf8'));
const exists = async (fileName) => access(path.join(projectRoot, fileName)).then(() => true).catch(() => false);

const [languages, site, posts, members] = await Promise.all([
  readJson('content/languages.json'),
  readJson('content/site.json'),
  readJson('content/posts.json'),
  readJson('content/members.json')
]);

const languageCodes = Object.keys(languages);
assert.equal(languageCodes.length, 8, 'Eight languages are required.');
assert.equal(site.name, 'Hotaru Ascend', 'The public brand name must be Hotaru Ascend.');
assert.ok(Array.isArray(posts), 'content/posts.json must remain an array.');
assert.equal(posts.length, 0, 'The blog must be empty while it is marked as preparing.');
assert.ok(Array.isArray(members), 'content/members.json must be an array.');
assert.ok(members.length >= 1, 'At least one member profile is required.');
assert.equal(site.stats[0]?.value, '2', 'The primary project count must be 2.');
assert.equal(site.githubUrl, 'https://github.com/Naokibot', 'Only the GitHub social link should remain.');
assert.equal(Object.hasOwn(site, 'focusAreas'), false, 'The activity-area data must be removed.');
assert.equal(Object.hasOwn(site, 'contactEndpoint'), false, 'Contact settings must be removed.');
assert.equal(Object.hasOwn(site, 'xUrl'), false, 'X must not be configured.');
assert.equal(Object.hasOwn(site, 'instagramUrl'), false, 'Instagram must not be configured.');
assert.equal(await exists('content/projects.json'), false, 'Legacy manual projects must remain removed.');
assert.equal(await exists('content/achievements.json'), false, 'Legacy achievement data must remain removed.');
assert.equal(await exists('content/skills.json'), false, 'The removed capabilities data must not remain.');

function validateLocalized(value, label) {
  assert.ok(value && typeof value === 'object' && !Array.isArray(value), `${label} must be localized.`);
  for (const languageCode of languageCodes) {
    assert.equal(typeof value[languageCode], 'string', `${label}.${languageCode} must be a string.`);
    assert.ok(value[languageCode].trim(), `${label}.${languageCode} must not be empty.`);
  }
}

const memberSlugs = new Set();
for (const [index, member] of members.entries()) {
  assert.match(member.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, `members[${index}].slug must be URL-safe.`);
  assert.equal(memberSlugs.has(member.slug), false, `Duplicate member slug: ${member.slug}`);
  memberSlugs.add(member.slug);
  assert.ok(member.icon?.startsWith('/members/'), `members[${index}].icon must use /members/.`);
  assert.equal(await exists(`public${member.icon}`), true, `Member icon is missing: public${member.icon}`);
  validateLocalized(member.name, `members[${index}].name`);
  validateLocalized(member.role, `members[${index}].role`);
  validateLocalized(member.summary, `members[${index}].summary`);
  validateLocalized(member.bio, `members[${index}].bio`);
  assert.ok(Array.isArray(member.skills), `members[${index}].skills must be an array.`);
}

const referenceUiKeys = Object.keys(languages.ja.ui).sort();
for (const [languageCode, language] of Object.entries(languages)) {
  assert.deepEqual(Object.keys(language.ui).sort(), referenceUiKeys, `${languageCode} UI keys must match Japanese.`);
  assert.equal(Object.hasOwn(language.ui, 'capabilities'), false, `${languageCode}.ui.capabilities must be removed.`);
}

const sourceFiles = [
  'content/site.json',
  'content/languages.json',
  'content/members.json',
  'scripts/build.mjs',
  'src/app.js',
  'README.md',
  'docs/EDITING_GUIDE_JA.md',
  'docs/DEPLOYMENT_JA.md',
  'public/logo.svg',
  'public/favicon.svg',
  'public/og-image.svg',
  'LICENSE',
  'package.json',
  'START_WINDOWS.bat'
];
const combinedSource = (await Promise.all(
  sourceFiles.map((fileName) => readFile(path.join(projectRoot, fileName), 'utf8'))
)).join('\n');

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
  'スクリーン管理、学習可視化、利用者テスト',
  '技術と制作力',
  'skill-grid'
]) {
  assert.equal(combinedSource.toLowerCase().includes(forbidden.toLowerCase()), false, `Forbidden release text remains: ${forbidden}`);
}

console.log(`Release validation passed for Hotaru Ascend with ${members.length} member profile(s), eight languages, contest-inspired UI, preparing project/blog sections, no capabilities section, and no contact form.`);
