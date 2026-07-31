# TSUBAKI Tech ポートフォリオ編集ガイド

このサイトは、基本的に `content` フォルダのJSONを書き換えて更新します。HTMLを直接編集する必要はありません。変更後は `npm run build` を実行してください。

## よく変更する表示と編集ファイル

| 変更したい表示 | 編集するファイル | 主な項目・場所 |
|---|---|---|
| チーム名 | `content/site.json` | `name` |
| トップのキャッチコピー | `content/site.json` | `tagline.ja`、`tagline.en` |
| 最新告知帯 | `content/site.json` | `announcement.date`、`announcement.title`、`announcement.link` |
| ミッションの大見出し・本文 | `content/site.json` | `mission.title`、`mission.body` |
| 3つの活動領域 | `content/site.json` | `focusAreas` |
| 実績の数値表示 | `content/site.json` | `stats` |
| 問い合わせ前のCTA | `content/site.json` | `cta.title`、`cta.body` |
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
| トップのメイン画像 | `public/profile.svg` | ヒーロー内の大きな画像として使用 |
| SNS共有用OGP画像 | `public/og-image.svg` と `public/og-image.png.base64.*` | SVGを編集後、PNGも同じデザインに更新する |
| ByteQuestの作品画像 | `public/projects/bytequest.svg` | トップのプロジェクト紹介と詳細ページで使用 |
| ScreenLessの作品画像 | `public/projects/screenless.svg` | トップのプロジェクト紹介と詳細ページで使用 |
| SolidProofの作品画像 | `public/projects/solidproof.svg` | トップのプロジェクト紹介と詳細ページで使用 |

## デザインを変更する場所

| 変更したいデザイン | 編集するファイル | 検索する文字 |
|---|---|---|
| 色、背景色、文字色 | `src/styles.css` | `:root`、`--accent`、`--bg`、`--ink`、`--night` |
| ロゴの表示サイズ | `src/styles.css` | `.brand`、`.footer-brand` |
| トップの文字サイズ・画像構成 | `src/styles.css` | `.hero-copy h1`、`.hero-collage` |
| 最新告知帯 | `src/styles.css` | `.announcement` |
| 活動領域の3カード | `src/styles.css` | `.focus-grid`、`.focus-card` |
| プロジェクト紹介の並び・見た目 | `src/styles.css` | `.project-feature`、`.project-visual` |
| 実績の数値表示 | `src/styles.css` | `.stats-grid`、`.stat` |
| ニュース一覧 | `src/styles.css` | `.news-list`、`.news-item` |
| スマートフォン表示 | `src/styles.css` | `@media` |
| スクロールアニメーション・進捗表示 | `src/styles.css` と `src/app.js` | `.reveal`、`.scroll-progress`、`IntersectionObserver` |
| ページ上部へ戻るボタン | `src/styles.css` と `src/app.js` | `.back-to-top` |
| ダークモード | `src/styles.css` と `src/app.js` | `[data-theme="dark"]`、`theme` |

## ナビゲーションやページ構造

ナビゲーション、フッター、SEO、作品詳細ページ、記事詳細ページのHTMLは `scripts/build.mjs` が自動生成しています。

通常の文章変更では `scripts/build.mjs` を編集せず、JSONを変更してください。メニュー項目やセクションそのものを増減するときだけ、以下を編集します。

- ヘッダー：`header()`
- フッター：`footer()`
- トップページ：`home()`
- プロジェクト表示：`projectFeature()`
- ニュース表示：`newsItem()`
- 作品詳細：`projectPage()`
- 記事詳細：`postPage()`
- SEOメタデータ：`head()`

## 問い合わせフォーム

| 変更したい内容 | 編集場所 |
|---|---|
| 表示メールアドレス | `content/site.json` の `email` |
| Formspree送信先 | `content/site.json` の `contactEndpoint` |
| 問い合わせ前の見出しと説明 | `content/site.json` の `cta` |
| フォーム項目 | `scripts/build.mjs` 内の `contact-form` |
| 送信処理とエラー表示 | `src/app.js` |

通知先メールアドレスはFormspreeのDashboard側で設定します。管理者ログイン機能はGitHub Pages版では使用しません。サイトの編集はGitHubまたはローカルのJSONファイルから行います。

## アクセス解析

- Google Analytics 4：`content/site.json` の `gaMeasurementId`
- Plausible：`content/site.json` の `plausibleDomain`

空文字のままなら解析コードは出力されません。

## 変更後の確認

```bat
cd /d "プロジェクトフォルダの実際のパス"
npm run check
npm run build
npm run dev
```

ブラウザで `http://localhost:4173` を開きます。

GitHub Pagesと同じパスを確認する場合は次を実行します。

```bat
npm run build:pages
npm run serve -- --base-path=/TSUBAKI_HP
```

ブラウザで `http://localhost:4173/TSUBAKI_HP/` を開きます。

## GitHubへ反映する場合

```bat
git add .
git commit -m "update portfolio content"
git push origin main
```

GitHub Pagesが`main`へのpush後に自動で再公開します。
