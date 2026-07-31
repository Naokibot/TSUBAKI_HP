# TSUBAKI Tech ポートフォリオ編集ガイド

このサイトは文章をJSONで管理し、`npm run build`で静的HTMLを生成します。

## 主な編集場所

| 変更したい内容 | ファイル |
|---|---|
| チーム名、紹介文、数字、フッター文言 | `content/site.json` |
| メニューや準備中文言の翻訳 | `content/languages.json` |
| ブログ記事 | `content/posts.json` |
| スキル | `content/skills.json` |
| ページ構成 | `scripts/build.mjs` |
| ダークモードやメニュー動作 | `src/app.js` |
| 色、余白、スマートフォン表示 | `src/styles.css` |

## ブログを公開するとき

現在の`content/posts.json`は空配列です。

```json
[]
```

記事を追加すると、トップページのブログ欄と8言語の記事詳細ページがビルド時に生成されます。記事を追加するまでは「準備中」と表示されます。

## プロジェクト欄

現在は「準備中」の固定表示です。公開する内容が決まったら、`scripts/build.mjs`の`projectSection()`を編集してください。

## 公開前確認

```bash
npm run check
npm run build:pages
```
