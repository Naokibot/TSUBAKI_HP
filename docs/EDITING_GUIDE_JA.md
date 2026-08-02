# Hotaru Ascend ポートフォリオ編集ガイド

このサイトは文章やメンバー情報をJSONで管理し、`npm run build`で静的HTMLを生成します。UIは大きな英字見出し、番号付きセクション、濃紺・黄色・赤の高コントラスト構成です。

## 主な編集場所

| 変更したい内容 | ファイル |
|---|---|
| チーム名、紹介文、数字、フッター文言 | `content/site.json` |
| メニューや準備中文言の翻訳 | `content/languages.json` |
| 所属者の名前、役割、紹介文、得意分野 | `content/members.json` |
| 所属者のアイコン | `public/members/` |
| ブログ記事 | `content/posts.json` |
| ページ構成 | `scripts/build.mjs` |
| ダークモードやメニュー動作 | `src/app.js` |
| 色、余白、メンバーカード、スマートフォン表示 | `src/styles.css` |
| ロゴ | `public/logo.svg` |
| ブラウザアイコン | `public/favicon.svg` |
| SNS共有画像 | `public/og-image.svg` |

## UIを変更する場所

現在のトップページは、濃紺の大きなファーストビュー、黄色・赤のアクセント、大型英字見出し、番号付きセクション、太い枠線とずらした影で構成されています。

主な変更場所は次のとおりです。

```text
src/styles.css       配色、形、影、文字サイズ、レスポンシブ表示
scripts/build.mjs    セクションの順番、見出し、装飾用HTML
```

## 所属者を追加する方法

編集するファイルは次の1つです。

```text
content/members.json
```

このファイルは配列になっています。既存メンバーの`}`の後ろへ`,`を付け、新しいメンバーのデータを追加してください。

```json
{
  "slug": "member-name",
  "icon": "/members/member-name.svg",
  "name": {
    "ja": "日本語の表示名",
    "en": "English Name",
    "ru": "English Name",
    "zh-TW": "English Name",
    "ko": "English Name",
    "hi": "English Name",
    "fr": "English Name",
    "de": "English Name"
  },
  "role": {
    "ja": "担当・役割",
    "en": "Role",
    "ru": "Role",
    "zh-TW": "Role",
    "ko": "Role",
    "hi": "Role",
    "fr": "Role",
    "de": "Role"
  },
  "summary": {
    "ja": "トップページのカードに表示する短い紹介文",
    "en": "Short introduction for the home page card",
    "ru": "Short introduction",
    "zh-TW": "Short introduction",
    "ko": "Short introduction",
    "hi": "Short introduction",
    "fr": "Short introduction",
    "de": "Short introduction"
  },
  "bio": {
    "ja": "個別プロフィールページに表示する詳しい自己紹介文",
    "en": "Long introduction for the individual profile page",
    "ru": "Long introduction",
    "zh-TW": "Long introduction",
    "ko": "Long introduction",
    "hi": "Long introduction",
    "fr": "Long introduction",
    "de": "Long introduction"
  },
  "skills": ["Programming", "UI / UX"],
  "github": "https://github.com/example"
}
```

### 各項目の意味

| 項目 | 内容 |
|---|---|
| `slug` | 個別ページのURL。半角英小文字・数字・ハイフンを使用します |
| `icon` | アイコン画像の場所 |
| `name` | メンバー名 |
| `role` | 担当や役割 |
| `summary` | トップページのカードに表示する短い紹介 |
| `bio` | 個別プロフィールページの詳しい紹介 |
| `skills` | 個別プロフィールに表示する得意分野。必要な数だけ追加できます |
| `github` | 個人GitHub。不要なら空文字`""`にできます |

### アイコンを追加する場所

画像を次へ入れます。

```text
public/members/
```

例：

```text
public/members/member-name.png
```

`content/members.json`では次のように指定します。

```json
"icon": "/members/member-name.png"
```

SVG、PNG、JPG、WebPを使用できます。正方形画像を推奨します。

### 自動生成されるページ

1人追加すると、トップページのカードに加えて、8言語分の個別プロフィールページが生成されます。

```text
/members/member-name/
/en/members/member-name/
/ru/members/member-name/
/zh-tw/members/member-name/
/ko/members/member-name/
/hi/members/member-name/
/fr/members/member-name/
/de/members/member-name/
```

## チーム名を変更する場所

現在の公開名は`Hotaru Ascend`です。変更する場合は次を確認します。

```text
content/site.json          サイト名と本文
public/logo.svg            ロゴ
public/favicon.svg         ブラウザアイコン
public/og-image.svg        SNS共有画像
package.json               プロジェクト名
README.md                  英語説明
LICENSE                    著作権表示
scripts/serve.mjs          ローカル起動表示
START_WINDOWS.bat          Windows起動表示
```

GitHubリポジトリ名は現在`TSUBAKI_HP`のままです。リポジトリ名を変更するとGitHub PagesのURLも変わるため、GitHubのSettingsから別途変更し、`package.json`と`.github/workflows/deploy-pages.yml`の公開パスも更新してください。

## ブログを公開するとき

現在の`content/posts.json`は空配列です。

```json
[]
```

記事を追加すると、トップページのブログ欄と8言語の記事詳細ページが生成されます。記事を追加するまでは「準備中」と表示されます。

## プロジェクト欄

現在は「準備中」の固定表示です。公開する内容が決まったら、`scripts/build.mjs`の`projectSection()`を編集してください。

## 公開前確認

```bash
npm run check
npm run build:pages
```
