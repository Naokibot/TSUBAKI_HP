# TSUBAKI Tech ポートフォリオ編集ガイド

このサイトは、基本的に `content` フォルダのJSONを書き換えて更新します。HTMLを直接編集する必要はありません。変更後は `npm run build` を実行してください。

## よく変更する表示と編集ファイル

| 変更したい表示 | 編集するファイル | 主な項目・場所 |
|---|---|---|
| チーム名 | `content/site.json` | `name` |
| トップの大見出し | `content/site.json` | `tagline.ja`、`tagline.en` |
| トップの紹介文 | `content/site.json` | `description.ja`、`description.en` |
| 「私たちについて」の本文 | `content/site.json` | `about.ja`、`about.en` |
| メールアドレス | `content/site.json` | `email` |
| GitHubアカウント・リンク | `content/site.json` | `githubUser`、`githubUrl` |
| X・Instagramリンク | `content/site.json` | `xUrl`、`instagramUrl` |
| 公開URL | `content/site.json` | `baseUrl` |
| 著作権の年 | `content/site.json` | `copyrightYear` |
| スキル名・説明・割合 | `content/skills.json` | 各項目の `name`、`description`、`level` |
| 作品一覧・作品詳細 | `content/projects.json` | 作品ごとの `title`、`summary`、`challenge`、`solution`、`highlights`、`technologies`、`github` |
| ブログ・技術記事 | `content/posts.json` | 記事ごとの `title`、`excerpt`、`content`、`tags`、`date` |
| 資格・コンテスト実績 | `content/achievements.json` | 各項目の `year`、`type`、`title`、`detail` |

## 画像とロゴ

| 変更したい画像 | 編集するファイル | 補足 |
|---|---|---|
| ヘッダー・フッターのロゴ | `public/logo.svg` | 花の図形は `<g transform="translate(36 36)">` 内、文字は最後の `<text>` |
| ブラウザのアイコン | `public/favicon.svg` | 小さなタブ用アイコン |
| トップ右側のプロフィール画像 | `public/profile.svg` | 下部の文字は最後の `<text>` |
| SNS共有用OGP画像 | `public/og-image.svg` と `public/og-image.png.base64.*` | SVGを編集後、PNGも同じデザインに更新する |
| ByteQuestの作品画像 | `public/projects/bytequest.svg` | 作品カードと詳細ページで使用 |
| ScreenLessの作品画像 | `public/projects/screenless.svg` | 作品カードと詳細ページで使用 |
| SolidProofの作品画像 | `public/projects/solidproof.svg` | 作品カードと詳細ページで使用 |

## デザインを変更する場所

| 変更したいデザイン | 編集するファイル | 検索する文字 |
|---|---|---|
| 色、背景色、文字色 | `src/styles.css` | `:root`、`--accent`、`--bg`、`--text` |
| ロゴの表示サイズ | `src/styles.css` | `.brand`、`.footer-logo` |
| トップの文字サイズ | `src/styles.css` | `.hero h1` |
| 作品カードの列数・見た目 | `src/styles.css` | `.project-grid`、`.card` |
| スマートフォン表示 | `src/styles.css` | `@media` |
| スクロールアニメーション | `src/styles.css` と `src/app.js` | `.reveal`、`IntersectionObserver` |
| ダークモード | `src/styles.css` と `src/app.js` | `[data-theme="dark"]`、`theme` |

## ナビゲーションやページ構造

ナビゲーション、フッター、SEO、作品詳細ページ、記事詳細ページのHTMLは `scripts/build.mjs` が自動生成しています。

通常の文章変更では `scripts/build.mjs` を編集せず、JSONを変更してください。メニュー項目やセクションそのものを増減するときだけ、以下を編集します。

- ヘッダー：`header()`
- フッター：`footer()`
- トップページ：`home()`
- 作品詳細：`projectPage()`
- 記事詳細：`postPage()`
- SEOメタデータ：`head()`

## 問い合わせフォーム

| 変更したい内容 | 編集場所 |
|---|---|
| フォームに表示するメール | `content/site.json` の `email` |
| APIの送信処理 | `functions/api/contact.js` |
| メール件名 | `functions/api/contact.js` の `subject` |
| 送信先 | Cloudflare Pagesの環境変数 `CONTACT_TO_EMAIL` |
| 送信元 | 環境変数 `CONTACT_FROM_EMAIL` |
| Turnstile公開キー | `content/site.json` の `turnstileSiteKey` |
| Turnstile秘密鍵 | 環境変数 `TURNSTILE_SECRET` |

## アクセス解析

- Google Analytics 4：`content/site.json` の `gaMeasurementId`
- Plausible：`content/site.json` の `plausibleDomain`

空文字のままなら解析コードは出力されません。

## 変更後の確認

```bat
cd /d "C:\Users\sagak\Downloads\TSUBAKI_HP_Source\TSUBAKI_Portfolio"
npm run check
npm run build
npm run dev
```

ブラウザで `http://localhost:4173` を開きます。

## GitHubへ反映する場合

```bat
git add .
git commit -m "update portfolio content"
git push origin main
```

GitHub PagesまたはCloudflare Pagesと接続していれば、`main`へのpush後に自動で再公開されます。
