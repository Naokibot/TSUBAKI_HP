# Hotaru Ascend ブログ投稿ガイド

ブログは長文を書きやすいように、1記事につき1つのMarkdownファイルで管理します。`content/posts.json`を直接編集する必要はありません。

## 最も簡単な投稿方法

リポジトリのフォルダで次を実行します。

```bash
npm run blog:new
```

次の4項目を順番に入力します。

1. 記事タイトル
2. 公開日
3. 一覧に表示する短い説明
4. URL名。空欄でも構いません

入力後、`content/blog/`に記事ファイルが作られます。

```text
content/blog/post-20260802.md
```

作成されたファイルを開き、`---`より下へ本文を書きます。長い文章をターミナルへ入力する必要はありません。

## 記事ファイルの基本形

```markdown
---
title: 記事タイトル
date: 2026-08-02
excerpt: ブログ一覧に表示する短い説明です。
---

ここから本文です。
```

ファイル名が記事URLになります。ファイル名には半角英小文字、数字、ハイフンだけを使用します。

```text
content/blog/minecraft-server-development.md
```

この場合、記事URLは次の形です。

```text
/blog/minecraft-server-development/
```

## 長文の書き方

段落と段落の間に1行空けます。

```markdown
最初の段落です。ここには長い文章を書けます。

次の段落です。1行空けると別の段落になります。
```

見出しは次のように書きます。

```markdown
## 開発を始めた理由
```

小見出しを使う場合も`##`を使って構いません。現在のブログ表示は、長文本文と見出しを読みやすく表示することを優先しています。

## 表示を確認する

```bash
npm run dev
```

ブラウザで次を開きます。

```text
http://localhost:4173
```

`npm run dev`と公開用ビルドでは、Markdownファイルから`content/posts.json`が自動生成されます。`content/posts.json`は手動で編集しないでください。

## 公開する

記事ファイルをGitHubへコミットし、`main`へプッシュします。

```bash
git add content/blog
git commit -m "add blog article"
git push origin main
```

GitHub Actionsが成功すると公開サイトへ反映されます。

## 手動で記事を作る方法

`content/blog/_template.md`をコピーし、ファイル名を変更しても投稿できます。

```text
content/blog/_template.md
        ↓ コピー
content/blog/new-article.md
```

先頭が`_`のファイルは公開されません。

## 日本語だけで投稿できるか

できます。記事本文は日本語のMarkdownファイル1つだけで投稿できます。サイトの8言語ページには同じ記事が表示され、記事ごとの翻訳入力は必須ではありません。
