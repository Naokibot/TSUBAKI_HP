import { cp, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const site = JSON.parse(await readFile(path.join(root, 'content', 'site.json'), 'utf8'));
const basePathRaw = process.env.SITE_BASE_PATH ?? site.basePath ?? '';
const basePath = basePathRaw && basePathRaw !== '/' ? `/${basePathRaw.replace(/^\/+|\/+$/g, '')}` : '';
const u = (value = '/') => `${basePath}${value.startsWith('/') ? value : `/${value}`}`.replace(/\/{2,}/g, '/');
const esc = (value = '') => String(value).replace(/[&<>\"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[char]));

await mkdir(path.join(dist, 'assets'), { recursive: true });
await cp(path.join(root, 'src', 'admin.js'), path.join(dist, 'assets', 'admin.js'));
await cp(path.join(root, 'src', 'admin.css'), path.join(dist, 'assets', 'admin.css'));

async function htmlFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map(async (entry) => {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) return htmlFiles(target);
    return entry.isFile() && entry.name.endsWith('.html') ? [target] : [];
  }));
  return nested.flat();
}

for (const filename of await htmlFiles(dist)) {
  let html = await readFile(filename, 'utf8');
  if (!html.includes('/assets/admin.css')) {
    html = html.replace('</head>', `<link rel="stylesheet" href="${u('/assets/admin.css')}"></head>`);
  }
  if (filename !== path.join(dist, '404.html') && !html.includes('admin-login-link')) {
    const english = /<html[^>]+lang="en"/.test(html);
    const label = english ? 'Administrator login' : '管理者用ログイン';
    html = html.replace('</footer>', `<div class="footer-admin"><a class="admin-login-link" href="${u('/admin/')}">${label}</a></div></footer>`);
  }
  await writeFile(filename, html);
}

const adminHtml = `<!doctype html><html lang="ja"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>管理者用サイト編集 — ${esc(site.name)}</title><meta name="description" content="${esc(site.name)}管理者専用のサイト編集画面"><link rel="icon" href="${u('/favicon.svg')}" type="image/svg+xml"><link rel="stylesheet" href="${u('/assets/styles.css')}"><link rel="stylesheet" href="${u('/assets/admin.css')}"></head><body data-admin-api-base="${u('/api/admin')}"><main class="admin-page"><div class="admin-shell"><div class="admin-top"><img src="${u('/logo.svg')}" alt="${esc(site.name)}"><a class="back" href="${u('/')}">← サイトへ戻る</a></div><div class="admin-heading"><div class="eyebrow">ADMINISTRATION</div><h1>管理者用サイト編集</h1><p>登録済みの管理者メールに届く6桁の認証コードだけでログインします。</p></div><section id="admin-login-view" class="admin-panel"><h2>メール認証</h2><p>管理者として登録されたメールアドレスへ、10分間有効な認証コードを送信します。</p><form id="admin-email-form" class="admin-login-form"><label>管理者メールアドレス<input id="admin-email" name="email" type="email" autocomplete="email" required></label><button class="button primary" type="submit">認証コードを送信</button></form><form id="admin-code-form" class="admin-code-form" hidden><p><strong id="pending-admin-email"></strong> に届いた6桁のコードを入力してください。</p><label>認証コード<input id="admin-code" class="admin-code-input" name="code" type="text" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" minlength="6" maxlength="6" required></label><button class="button primary" type="submit">確認してログイン</button><div class="admin-code-actions"><button id="admin-resend-code" class="button" type="button">コードを再送</button><button id="admin-change-email" class="button" type="button">メールアドレスを変更</button></div></form><p class="admin-login-hint">許可されていないメールアドレスには認証コードは送信されず、管理画面にも入れません。</p><p id="admin-login-status" class="admin-login-status" role="status"></p></section><section id="admin-editor-view" class="admin-panel" hidden><div class="admin-toolbar"><div><span class="tag">ログイン中</span> <strong id="current-admin"></strong></div><button id="admin-logout" class="button" type="button">ログアウト</button></div><label>編集するデータ<select id="admin-content-select"><option value="site">サイト基本情報</option><option value="projects">作品一覧</option><option value="posts">ブログ・技術記事</option><option value="skills">スキル一覧</option><option value="achievements">実績・資格</option></select></label><label>JSONデータ<textarea id="admin-content-editor" class="code-editor" spellcheck="false"></textarea></label><div class="admin-actions"><button id="admin-reload" class="button" type="button">最新内容を再読込</button><button id="admin-save" class="button primary" type="button">GitHubへ保存</button></div><p id="admin-editor-status" role="status"></p><p class="admin-note">保存するとGitHubにコミットされ、自動ビルド後にサイトへ反映されます。</p></section></div></main><script type="module" src="${u('/assets/admin.js')}"></script></body></html>`;
await mkdir(path.join(dist, 'admin'), { recursive: true });
await writeFile(path.join(dist, 'admin', 'index.html'), adminHtml);
console.log('Added administrator email verification page and footer link.');
