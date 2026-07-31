# TSUBAKI Tech ポートフォリオ編集ガイド

このサイトは、文章・作品・実績などを `content` フォルダのJSONで管理し、`npm run build` でHTMLを自動生成します。通常の更新ではHTMLを直接編集する必要はありません。

## まず覚える4か所

```text
文章・リンク・数字を変える  content/*.json
色・余白・文字サイズを変える src/styles.css
クリック後の動きを変える    src/app.js
ページ構成そのものを変える  scripts/build.mjs
画像を変える               public/
```

## よくある変更と編集場所

| 変更したいこと | ファイル | 書き換える場所 |
|---|---|---|
| チーム名 | `content/site.json` | `name` |
| トップのキャッチコピー | `content/site.json` | `tagline` |
| トップの紹介文 | `content/site.json` | `description` |
| 私たちについて | `content/site.json` | `about` |
| 赤い最新告知帯 | `content/site.json` | `announcement` |
| ミッション | `content/site.json` | `mission` |
| BUILD・VISUALIZE・TEST | `content/site.json` | `focusAreas` |
| 大きな実績数字 | `content/site.json` | `stats` |
| 問い合わせ前の見出し | `content/site.json` | `cta` |
| メールアドレス | `content/site.json` | `email` |
| GitHub・X・Instagram | `content/site.json` | `githubUrl`、`xUrl`、`instagramUrl` |
| Formspree送信先 | `content/site.json` | `contactEndpoint` |
| メニューやフォームの翻訳 | `content/languages.json` | 各言語の `ui` |
| プロジェクト | `content/projects.json` | 各プロジェクト |
| ニュース・技術記事 | `content/posts.json` | 各記事 |
| スキル | `content/skills.json` | 各スキル |
| 実績・資格 | `content/achievements.json` | 各実績 |
| 色・レイアウト | `src/styles.css` | `:root`、各クラス、`@media` |
| アニメーションや送信処理 | `src/app.js` | 機能別の関数 |
| ページの並び・SEO | `scripts/build.mjs` | ページ生成関数 |

## 8言語とURL

| 言語 | URL |
|---|---|
| 日本語 | `/` |
| 英語 | `/en/` |
| ロシア語 | `/ru/` |
| 繁體中文（台湾向け） | `/zh-tw/` |
| 韓国語 | `/ko/` |
| ヒンディー語 | `/hi/` |
| フランス語 | `/fr/` |
| ドイツ語 | `/de/` |

依頼にあった「台湾語版」は、一般的なWebサイトの地域対応として**繁體中文（台湾向け表現）**で実装しています。台湾語（台語・閩南語）を別言語として追加する場合は、別の言語コードと翻訳一式が必要です。

「ヒンドゥー語」は言語名としては通常「ヒンディー語」と呼ばれるため、`hi`で実装しています。

## 多言語文章の形式

翻訳対象は次の形で記述します。

```json
{
  "ja": "日本語",
  "en": "English",
  "ru": "Русский",
  "zh-TW": "繁體中文",
  "ko": "한국어",
  "hi": "हिन्दी",
  "fr": "Français",
  "de": "Deutsch"
}
```

1言語だけ変更するときも、ほかの言語キーを削除しないでください。翻訳が不足すると `npm run validate` が失敗します。

## トップページを変える

`content/site.json`を編集します。

### キャッチコピー

```json
"tagline": {
  "ja": "つくることで、学びを変える。",
  "en": "Changing how we learn by building."
}
```

実ファイルには8言語あります。意味がずれないよう全言語を更新します。

### 最新告知帯

```json
"announcement": {
  "date": "2026.07",
  "title": {
    "ja": "告知文"
  },
  "link": "#projects"
}
```

外部ページへ移動する場合は、`link`に完全なURLを入れます。

### 実績の数字

```json
"stats": [
  {
    "value": "8",
    "label": {
      "ja": "対応言語"
    }
  }
]
```

`value`は全言語共通、`label`は8言語分必要です。

## プロジェクトを追加する

`content/projects.json`の配列へ新しいオブジェクトを追加します。

| 項目 | 用途 |
|---|---|
| `slug` | URLに使う英数字。重複不可 |
| `title` | プロジェクト名 |
| `subtitle` | 短い説明 |
| `summary` | 一覧で表示する説明 |
| `challenge` | 解決する課題 |
| `solution` | 解決方法 |
| `highlights` | 特徴の箇条書き |
| `technologies` | 使用技術。言語共通 |
| `status` | 開発状況 |
| `year` | 年 |
| `cover` | `public`から見た画像パス |
| `github` | GitHub URL |
| `demo` | デモURL。ない場合は空文字 |

画像を `public/projects/new-project.svg` に置いた場合：

```json
"cover": "/projects/new-project.svg"
```

## 記事を追加する

`content/posts.json`へ追加します。

```json
{
  "slug": "new-article",
  "date": "2026-07-31",
  "title": { "ja": "記事タイトル" },
  "excerpt": { "ja": "一覧用の短い説明" },
  "tags": ["Web", "Education"],
  "content": {
    "ja": "# 大見出し\n\n本文\n\n## 小見出し\n\n本文"
  }
}
```

実際には `title`、`excerpt`、`content`へ8言語すべてを追加します。記事本文で使える記法は次のとおりです。

```text
# 大見出し
## 小見出し
`コード`
空行で段落を分ける
```

各言語の記事で見出し数が異なると、翻訳検証が失敗します。

## 言語設定を変更する

`content/languages.json`を編集します。

```json
"fr": {
  "path": "fr",
  "htmlLang": "fr",
  "locale": "fr-FR",
  "ogLocale": "fr_FR",
  "label": "Français",
  "shortLabel": "FR",
  "ui": {}
}
```

| 項目 | 意味 |
|---|---|
| `path` | URLフォルダ |
| `htmlLang` | HTMLの言語タグ |
| `locale` | 地域ロケール |
| `ogLocale` | Open Graph用ロケール |
| `label` | 言語メニューの名前 |
| `shortLabel` | ヘッダーの短縮表示 |
| `ui` | メニュー、ボタン、フォーム、エラー文 |

新しい言語を追加した場合、`site.json`、`projects.json`、`posts.json`、`skills.json`、`achievements.json`の全翻訳項目にも同じキーが必要です。

## 色を変更する

`src/styles.css`の先頭にある`:root`を編集します。

```css
:root {
  --bg: #fcfaf7;
  --surface: #ffffff;
  --ink: #171717;
  --muted: #6f6b67;
  --accent: #d91f4e;
  --line: #d8d2cb;
}
```

| 変数 | 主な用途 |
|---|---|
| `--bg` | ページ背景 |
| `--surface` | カード・メニュー背景 |
| `--ink` | 主な文字色 |
| `--muted` | 補助文章 |
| `--accent` | 赤い強調色 |
| `--line` | 枠線 |

ダークモードは `:root[data-theme="dark"]` を編集します。

## ロゴ・画像を変更する

| 対象 | ファイル |
|---|---|
| ヘッダーとフッターのロゴ | `public/logo.svg` |
| ブラウザアイコン | `public/favicon.svg` |
| トップのメイン画像 | `public/profile.svg` |
| SNS共有画像 | `public/og-image.svg` |
| ByteQuest | `public/projects/bytequest.svg` |
| ScreenLess | `public/projects/screenless.svg` |
| SolidProof | `public/projects/solidproof.svg` |

同じファイル名で置き換えればJSONを変更せず反映できます。

## ページ構成を変更する

`scripts/build.mjs`は役割ごとに関数を分けています。

| 関数 | 生成する部分 |
|---|---|
| `documentHead()` | SEO、OGP、canonical、hreflang |
| `languageMenu()` | 言語メニュー |
| `headerMarkup()` | ヘッダー |
| `footerMarkup()` | フッター |
| `homePage()` | トップページ |
| `projectPage()` | プロジェクト詳細 |
| `postPage()` | 記事詳細 |
| `markdownToHtml()` | 記事本文変換 |

文章だけを変更する場合は、このファイルを編集しません。

## ブラウザ上の動きを変更する

`src/app.js`は機能ごとに整理されています。

| 機能 | 関数・場所 |
|---|---|
| ダークモード | ファイル上部のテーマ処理 |
| スマホメニュー | `closeNavigation()`周辺 |
| スクロール進捗 | `updateScrollInterface()` |
| 表示アニメーション | `revealObserver` |
| 現在位置表示 | `sectionObserver` |
| GitHub一覧 | `loadPublicRepositories()` |
| Formspree送信 | `contactForm`のsubmit処理 |

## 問い合わせフォームを有効にする

Formspreeでフォームを作り、`content/site.json`を変更します。

```json
"contactEndpoint": "https://formspree.io/f/実際のフォームID"
```

Formspree側の通知先は `tsubaki.tech.jp@gmail.com` に設定します。

## 変更後の検査

```bat
npm run validate
npm run check
npm run build:pages
npm run dev
```

`npm run validate`は3段階で確認します。

1. 全翻訳項目に8言語があるか
2. UIキー、URL、言語メタデータが一致しているか
3. 未完成表記や記事見出し構造に問題がないか

ブラウザでは次を確認します。

```text
/        /en/     /ru/     /zh-tw/
/ko/     /hi/     /fr/     /de/
```

## GitHubへ反映する

```bat
git add .
git commit -m "update portfolio content"
git push origin main
```

`main`へpushするとGitHub Actionsが検査・ビルド・GitHub Pages公開を自動実行します。
