# TSUBAKI Tech Portfolio

TSUBAKI Techの作品、技術記事、スキル、実績を日本語・英語で紹介するポートフォリオサイトです。Node.jsで静的HTMLを生成し、GitHub ActionsからGitHub Pagesへ公開します。

## 主な機能

- 日本語・英語対応
- 作品一覧と詳細ページ
- ブログ一覧と記事ページ
- スキル・実績・GitHubリポジトリ表示
- ダークモード、レスポンシブ表示
- SEO、OGP、JSON-LD、サイトマップ
- Formspreeを使った問い合わせメール送信
- GitHub Actionsによる自動公開

GitHub Pagesはサーバー処理を実行できないため、旧版の管理者ログイン、メール認証、Cloudflare Functionsは削除しました。サイトの編集はGitHub上のJSONファイル、またはローカルファイルを変更して行います。

## 必要環境

- Node.js 20以上
- Git（cloneやpushを行う場合）

外部npmパッケージは使用していないため、`npm install`は不要です。

## ローカル確認

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

## GitHub Pagesで公開

1. GitHubで `Naokibot/TSUBAKI_HP` を開く
2. Settings → Pagesを開く
3. Sourceを `GitHub Actions` にする
4. Actions → `Deploy portfolio to GitHub Pages` を実行する
5. `https://naokibot.github.io/TSUBAKI_HP/` を開く

`main`へpushすると自動で再公開されます。

## 問い合わせフォームを有効にする

Formspreeでフォームを作成し、表示されたエンドポイントを `content/site.json` の `contactEndpoint` に設定します。

```json
"contactEndpoint": "https://formspree.io/f/実際のフォームID"
```

通知先はFormspree側で `tsubaki.tech.jp@gmail.com` に設定してください。詳しい手順は [docs/GITHUB_PAGES_FORM_SETUP_JA.md](docs/GITHUB_PAGES_FORM_SETUP_JA.md) を参照してください。

## コンテンツの編集

```text
content/site.json          サイト名、紹介文、URL、メール、フォーム送信先
content/skills.json        スキル
content/projects.json      作品と詳細
content/posts.json         ブログ記事
content/achievements.json  実績・資格
```

詳しくは [docs/EDITING_GUIDE_JA.md](docs/EDITING_GUIDE_JA.md) を参照してください。

## License

MIT License
