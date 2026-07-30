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
npm run check
npm run build
npm run serve
```

## Updating content

表示内容ごとの編集場所は [docs/EDITING_GUIDE_JA.md](docs/EDITING_GUIDE_JA.md) にまとめています。

主なデータファイル:

```text
content/site.json          チーム情報、URL、メール、解析設定
content/skills.json        スキル
content/projects.json      作品と詳細ページ
content/posts.json         ブログ記事
content/achievements.json  資格・受賞・コンテスト実績
```

`npm run build`を実行すると、日本語・英語のトップページ、作品詳細、記事詳細が自動生成されます。

## Deploy

GitHub PagesとCloudflare Pagesの公開手順は [docs/DEPLOYMENT_JA.md](docs/DEPLOYMENT_JA.md) を参照してください。

## License

MIT License
