import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readJson = async (fileName) => JSON.parse(await readFile(path.join(projectRoot, fileName), 'utf8'));
const exists = async (fileName) => access(path.join(projectRoot, fileName)).then(() => true).catch(() => false);

const [languages, site, posts, members, packageJson] = await Promise.all([
  readJson('content/languages.json'),
  readJson('content/site.json'),
  readJson('content/posts.json'),
  readJson('content/members.json'),
  readJson('package.json')
]);

const languageCodes = Object.keys(languages);
assert.equal(languageCodes.length, 8, 'Eight languages are required.');
assert.equal(site.name, 'Hotaru Ascend', 'The public brand name must be Hotaru Ascend.');
assert.equal(site.footerTagline.ja, '私たちは挑戦します。新しい世界へ。', 'The Japanese footer message is incorrect.');
assert.ok(Array.isArray(posts), 'content/posts.json must be an array.');
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
assert.equal(await exists('content/blog/_template.md'), true, 'The blog template is missing.');
assert.equal(await exists('scripts/blog.mjs'), true, 'The blog helper is missing.');
assert.equal(await exists('public/refine-ui.css'), true, 'The restrained UI stylesheet is missing.');
assert.equal(await exists('public/refine-blog.css'), true, 'The long-form blog stylesheet is missing.');
assert.equal(packageJson.scripts?.['blog:new'], 'node scripts/blog.mjs new', 'npm run blog:new is not configured.');
assert.equal(packageJson.scripts?.['blog:sync'], 'node scripts/blog.mjs sync', 'npm run blog:sync is not configured.');

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

const postSlugs = new Set();
for (const [index, post] of posts.entries()) {
  assert.match(post.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, `posts[${index}].slug must be URL-safe.`);
  assert.equal(postSlugs.has(post.slug), false, `Duplicate post slug: ${post.slug}`);
  postSlugs.add(post.slug);
  assert.match(post.date, /^\d{4}-\d{2}-\d{2}$/, `posts[${index}].date must be YYYY-MM-DD.`);
  for (const field of ['title', 'excerpt', 'content']) {
    assert.equal(typeof post[field], 'string', `posts[${index}].${field} must be a string.`);
    assert.ok(post[field].trim(), `posts[${index}].${field} must not be empty.`);
  }
}

const referenceUiKeys = Object.keys(languages.ja.ui).sort();
for (const [languageCode, language] of Object.entries(languages)) {
  assert.deepEqual(Object.keys(language.ui).sort(), referenceUiKeys, `${languageCode} UI keys must match Japanese.`);
  assert.equal(Object.hasOwn(language.ui, 'capabilities'), false, `${languageCode}.ui.capabilities must be removed.`);
}

const appSource = await readFile(path.join(projectRoot, 'src/app.js'), 'utf8');
assert.ok(appSource.includes('../refine-ui.css'), 'The restrained UI stylesheet is not loaded.');
assert.ok(appSource.includes('../refine-blog.css'), 'The blog stylesheet is not loaded.');
const refineUi = await readFile(path.join(projectRoot, 'public/refine-ui.css'), 'utf8');
for (const className of ['.hero-grid', '.hero-shape', '.hero-ticker', '.stats-tape']) {
  assert.ok(refineUi.includes(className), `${className} must be neutralized by the refinement stylesheet.`);
}

const sourceFiles = [
  'content/site.json',
  'content/languages.json',
  'content/members.json',
  'scripts/build.mjs',
  'scripts/blog.mjs',
  'src/app.js',
  'README.md',
  'docs/EDITING_GUIDE_JA.md',
  'docs/BLOG_GUIDE_JA.md',
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
  '学生主体',
  '資格・受賞歴を追加できます',
  'クロスプラットフォーム学習・集中支援の研究',
  'スクリーン管理、学習可視化、利用者テスト',
  '技術と制作力',
  'skill-grid',
  'まだ見ぬ世界へ、創ろう。'
]) {
  assert.equal(combinedSource.toLowerCase().includes(forbidden.toLowerCase()), false, `Forbidden release text remains: ${forbidden}`);
}

console.log(`Release validation passed with ${members.length} member profile(s), ${posts.length} blog article(s), eight languages, a restrained UI, and a simplified long-form blog workflow.`);
