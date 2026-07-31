# TSUBAKI Tech Portfolio

TSUBAKI Techチームの作品、技術記事、スキル、実績を日本語・英語で紹介するポートフォリオサイトです。外部パッケージに依存しないNode.js製の静的サイトジェネレーターで、GitHub Pages、Cloudflare Pages、Netlifyなどへ公開できます。

## Features

- 日本語・英語対応
- プロフィール、スキル、実績
- 作品一覧と作品詳細ページ
- ブログ一覧と記事詳細ページ
- GitHub APIによる公開リポジトリ表示
- ダークモード、レスポンシブナビゲーション
- スクロールアニメーション
- SEO、OGP、JSON-LD、sitemap.xml、robots.txt
- Plausible / Google Analytics 4の任意設定
- Cloudflare Pages Functionsによるお問い合わせ送信
- 指定した2名だけのメール認証ログインとGitHub連携サイト編集
- Turnstile、ハニーポット、送信間隔、入力検証によるスパム対策
- GitHub ActionsによるGitHub Pages自動公開

## Requirements

- Node.js 20以上
- Git（リポジトリをcloneする場合）

外部npmパッケージを使っていないため、`npm install`は不要です。

## Local development

```bash
git clone https://github.com/Naokibot/TSUBAKI_HP.git
cd TSUBAKI_HP
npm run dev
```

ブラウザで `http://localhost:4173` を開きます。

```bash
npm run check             # JavaScript構文確認
npm run test:admin-auth   # 管理者メール認証テスト
npm run build             # dist/へ本番ファイル生成
npm run serve             # 生成済みdist/を確認
```

GitHub Pagesと同じサブパスで確認する場合:

```bash
SITE_BASE_URL=https://naokibot.github.io/TSUBAKI_HP/ SITE_BASE_PATH=/TSUBAKI_HP npm run build
npm run serve -- --base-path=/TSUBAKI_HP
```

Windows PowerShell:

```powershell
$env:SITE_BASE_URL="https://naokibot.github.io/TSUBAKI_HP/"
$env:SITE_BASE_PATH="/TSUBAKI_HP"
npm run build
npm run serve -- --base-path=/TSUBAKI_HP
```

`http://localhost:4173/TSUBAKI_HP/`を開いてください。

## Updating content

表示内容ごとの編集場所は [docs/EDITING_GUIDE_JA.md](docs/EDITING_GUIDE_JA.md) にまとめています。

HTMLを直接複製する必要はありません。次のJSONを更新してください。

```text
content/site.json          チーム情報、URL、メール、解析設定
content/skills.json        スキル
content/projects.json      作品と詳細ページ
content/posts.json         ブログ記事
content/achievements.json  資格・受賞・コンテスト実績
```

`npm run build`を実行すると、日本語・英語のトップページ、作品詳細、記事詳細が自動生成されます。

## Before production

`content/site.json`のプレースホルダーを実際の情報に変更してください。

- `email`
- `xUrl`
- `instagramUrl`
- `githubUser`
- `githubUrl`
- `baseUrl`
- `contactEndpoint`
- `plausibleDomain` または `gaMeasurementId`
- `turnstileSiteKey`

秘密鍵はJSONやブラウザ用JavaScriptへ書かず、ホスティングサービスのSecretsへ登録します。

## Deploy to GitHub Pages

1. Repository Settings → Pagesを開く
2. Sourceを **GitHub Actions** にする
3. `main`へpushする
4. Actionsの **Deploy portfolio to GitHub Pages** が成功するのを確認する
5. `https://naokibot.github.io/TSUBAKI_HP/`を開く

`.github/workflows/deploy-pages.yml`が自動でチェック、認証テスト、ビルド、公開します。GitHub Pagesではサーバー処理が使えないため、問い合わせフォームは外部フォームサービスへ接続するか、Cloudflare Pagesを利用してください。

## Deploy to Cloudflare Pages

問い合わせフォーム、メール認証管理画面、Turnstile、独自ドメインを含める場合の推奨構成です。

- Repository: `Naokibot/TSUBAKI_HP`
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: 空欄

`functions/api/contact.js`と`functions/api/admin/`がPages Functionsとして動作します。問い合わせ送信先は`tsubaki.tech.jp@gmail.com`です。

### Secrets

```text
RESEND_API_KEY
CONTACT_FROM_EMAIL
ADMIN_FROM_EMAIL（省略時はCONTACT_FROM_EMAILを使用）
TURNSTILE_SECRET
SESSION_SECRET
GITHUB_TOKEN
```

### Environment variables

```text
CONTACT_TO_EMAIL=tsubaki.tech.jp@gmail.com
GITHUB_REPOSITORY=Naokibot/TSUBAKI_HP
GITHUB_BRANCH=main
```

### Required KV binding

```text
ADMIN_AUTH_KV
```

管理者は次の2件だけにソースコード内で固定されています。

```text
tomatonabe0120@gmail.com
tsubaki.tech.jp@gmail.com
```

パスワードは使用せず、メールに届く6桁のワンタイムコードだけでログインします。`ADMIN_PASSWORD`と`ADMIN_EMAILS`は不要です。

問い合わせフォームは任意でKV binding `CONTACT_RATE_LIMIT`を追加できます。

詳しい公開手順は [docs/DEPLOYMENT_JA.md](docs/DEPLOYMENT_JA.md)、管理者設定は [docs/ADMIN_SETUP_JA.md](docs/ADMIN_SETUP_JA.md) を参照してください。

## License

MIT License
