import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const blogDirectory = path.join(projectRoot, 'content', 'blog');
const postsPath = path.join(projectRoot, 'content', 'posts.json');

function today() {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date());
}

function slugify(value) {
  const slug = value.normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  return slug || `post-${today().replaceAll('-', '')}`;
}

function parseArticle(source, fileName) {
  const match = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---\s*\r?\n?([\s\S]*)$/);
  if (!match) throw new Error(`${fileName}: 先頭の設定欄がありません。`);

  const meta = {};
  for (const line of match[1].split(/\r?\n/)) {
    const separator = line.indexOf(':');
    if (separator < 1) continue;
    meta[line.slice(0, separator).trim()] = line.slice(separator + 1).trim();
  }

  const slug = path.basename(fileName, '.md');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(`${fileName}: ファイル名は半角英小文字・数字・ハイフンにしてください。`);
  }
  if (!meta.title) throw new Error(`${fileName}: title がありません。`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.date ?? '')) {
    throw new Error(`${fileName}: date は YYYY-MM-DD 形式にしてください。`);
  }

  const body = match[2].trim();
  if (!body) throw new Error(`${fileName}: 本文がありません。`);

  const excerpt = meta.excerpt || body
    .replace(/^#+\s+/gm, '')
    .replace(/\s+/g, ' ')
    .slice(0, 150);

  return { slug, title: meta.title, date: meta.date, excerpt, content: body };
}

async function syncPosts() {
  await mkdir(blogDirectory, { recursive: true });
  const files = (await readdir(blogDirectory))
    .filter((name) => name.endsWith('.md') && !name.startsWith('_'));
  const posts = [];
  for (const fileName of files) {
    const source = await readFile(path.join(blogDirectory, fileName), 'utf8');
    posts.push(parseArticle(source, fileName));
  }
  posts.sort((a, b) => b.date.localeCompare(a.date));
  await writeFile(postsPath, JSON.stringify(posts, null, 2) + '\n', 'utf8');
  console.log(`ブログ記事 ${posts.length} 件を同期しました。`);
}

async function createPost() {
  const terminal = createInterface({ input, output });
  try {
    console.log('\nHotaru Ascend ブログ記事作成\n');
    const title = (await terminal.question('記事タイトル: ')).trim();
    if (!title) throw new Error('記事タイトルは必須です。');
    const dateInput = (await terminal.question(`公開日 [${today()}]: `)).trim();
    const date = dateInput || today();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) throw new Error('公開日は YYYY-MM-DD 形式です。');
    const excerpt = (await terminal.question('一覧に表示する短い説明: ')).trim();
    const slugInput = (await terminal.question('URL名（空欄なら自動）: ')).trim();

    await mkdir(blogDirectory, { recursive: true });
    const baseSlug = slugify(slugInput || title);
    let slug = baseSlug;
    let number = 2;
    let filePath = path.join(blogDirectory, `${slug}.md`);
    while (await access(filePath).then(() => true).catch(() => false)) {
      slug = `${baseSlug}-${number++}`;
      filePath = path.join(blogDirectory, `${slug}.md`);
    }

    const template = `---\ntitle: ${title}\ndate: ${date}\nexcerpt: ${excerpt || title}\n---\n\nここから本文を書いてください。\n\n## 見出し\n\n長文は段落ごとに1行空けます。\n`;
    await writeFile(filePath, template, 'utf8');
    console.log(`\n${path.relative(projectRoot, filePath)} を作成しました。`);
    console.log('本文を書いた後、npm run dev で確認できます。');
  } finally {
    terminal.close();
  }
}

const command = process.argv[2] || 'sync';
if (command === 'new') {
  await createPost();
} else if (command === 'sync') {
  await syncPosts();
} else {
  throw new Error('使用できるコマンドは new または sync です。');
}
