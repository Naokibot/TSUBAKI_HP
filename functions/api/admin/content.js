import { json, requireAdmin } from '../../_shared/admin.js';

const FILES = {
  site: 'content/site.json',
  projects: 'content/projects.json',
  posts: 'content/posts.json',
  skills: 'content/skills.json',
  achievements: 'content/achievements.json'
};
const encoder = new TextEncoder();
const decoder = new TextDecoder();

function githubConfig(env) {
  return {
    token: env.GITHUB_TOKEN || '',
    repository: env.GITHUB_REPOSITORY || 'Naokibot/TSUBAKI_HP',
    branch: env.GITHUB_BRANCH || 'main'
  };
}

function githubHeaders(token) {
  return {
    accept: 'application/vnd.github+json',
    authorization: `Bearer ${token}`,
    'content-type': 'application/json',
    'x-github-api-version': '2022-11-28',
    'user-agent': 'TSUBAKI-Tech-Portfolio-Admin'
  };
}

function decodeBase64Utf8(value) {
  const binary = atob(String(value).replace(/\s+/g, ''));
  return decoder.decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
}

function encodeBase64Utf8(value) {
  const bytes = encoder.encode(value);
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function validateJson(key, value) {
  const parsed = JSON.parse(value);
  if (key === 'site' && (!parsed || Array.isArray(parsed) || typeof parsed !== 'object')) throw new Error('サイト設定はJSONオブジェクトにしてください。');
  if (key !== 'site' && !Array.isArray(parsed)) throw new Error('このデータはJSON配列にしてください。');
  return JSON.stringify(parsed, null, 2) + '\n';
}

export async function onRequestGet({ request, env }) {
  const auth = await requireAdmin(request, env);
  if (auth.response) return auth.response;
  const key = new URL(request.url).searchParams.get('key') || 'site';
  const path = FILES[key];
  if (!path) return json({ error: '編集対象が正しくありません。' }, 400);

  const config = githubConfig(env);
  if (!config.token) return json({ error: 'GITHUB_TOKENが設定されていません。' }, 503);
  const endpoint = `https://api.github.com/repos/${config.repository}/contents/${path}?ref=${encodeURIComponent(config.branch)}`;
  const response = await fetch(endpoint, { headers: githubHeaders(config.token) });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) return json({ error: result.message || 'GitHubからデータを取得できませんでした。' }, response.status);
  return json({ key, path, sha: result.sha, content: decodeBase64Utf8(result.content) });
}

export async function onRequestPut({ request, env }) {
  const auth = await requireAdmin(request, env, { csrf: true });
  if (auth.response) return auth.response;
  let body;
  try { body = await request.json(); } catch { return json({ error: '保存内容を確認してください。' }, 400); }

  const key = String(body.key || '');
  const path = FILES[key];
  if (!path || !body.sha || typeof body.content !== 'string') return json({ error: '保存内容が不足しています。' }, 400);

  let formatted;
  try { formatted = validateJson(key, body.content); } catch (error) { return json({ error: error.message || 'JSONの形式が正しくありません。' }, 400); }

  const config = githubConfig(env);
  if (!config.token) return json({ error: 'GITHUB_TOKENが設定されていません。' }, 503);
  const endpoint = `https://api.github.com/repos/${config.repository}/contents/${path}`;
  const response = await fetch(endpoint, {
    method: 'PUT',
    headers: githubHeaders(config.token),
    body: JSON.stringify({
      message: `[admin] update ${path}`,
      content: encodeBase64Utf8(formatted),
      sha: body.sha,
      branch: config.branch,
      committer: { name: 'TSUBAKI Tech Admin', email: auth.session.email }
    })
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) {
    const conflict = response.status === 409 || response.status === 422;
    return json({ error: conflict ? 'ほかの更新と競合しました。再読み込みしてから保存してください。' : (result.message || 'GitHubへ保存できませんでした。') }, response.status);
  }
  return json({ ok: true, sha: result.content?.sha, commit: result.commit?.html_url, content: formatted });
}
