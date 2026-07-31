# Hotaru Ascend GitHub Pages公開手順

このサイトは静的HTMLとしてGitHub Pagesへ公開します。お問い合わせサービス、Secret、APIキー、データベース、サーバー設定は不要です。

## 1. 公開前のローカル確認

プロジェクト直下で次を実行します。

```bash
npm run check
npm run build:pages
```

ローカルで画面を確認する場合は次を実行します。

```bash
npm run dev
```

ブラウザで開きます。

```text
http://localhost:4173
```

## 2. GitHub Pagesの設定

GitHubで次を開きます。

```text
Naokibot/TSUBAKI_HP
→ Settings
→ Pages
```

`Build and deployment`の`Source`を次にします。

```text
GitHub Actions
```

## 3. 公開を実行

```text
Actions
→ Deploy portfolio to GitHub Pages
→ Run workflow
→ main
→ Run workflow
```

`main`へ変更をpushした場合も自動実行されます。

## 4. 公開URL

```text
https://naokibot.github.io/TSUBAKI_HP/
```

公開名は`Hotaru Ascend`ですが、GitHubリポジトリ名が`TSUBAKI_HP`のため、現在のURLには`TSUBAKI_HP`が残ります。

## 5. ワークフローの処理

```text
npm run check
npm run build
生成したdistをアップロード
GitHub Pagesへデプロイ
```

## 6. 公開後に確認すること

```text
トップページにHotaru Ascendと表示される
ロゴ、ファビコン、SNS共有画像がHotaru Ascendになっている
8言語へ切り替えられる
メンバーカードが表示される
メンバーごとの個別ページが開く
個別ページの言語切り替えで同じメンバーへ移動する
プロジェクト欄が準備中になっている
ブログ欄が準備中になっている
ダークモードが動く
スマートフォン表示が崩れない
404ページが表示される
```

## 7. メンバーを追加した後の確認

`content/members.json`へ追加した後、必ず次を実行します。

```bash
npm run check
npm run build:pages
```

次を確認してください。

```text
slugが他のメンバーと重複していない
iconで指定した画像がpublic/members/に存在する
name、role、summary、bioに8言語がある
トップページにカードが増えている
8言語分の個別プロフィールページが生成される
```

## 8. よくあるエラー

### Eight languages are required

`content/languages.json`またはメンバーの翻訳項目に不足があります。次の8キーをそろえます。

```text
ja, en, ru, zh-TW, ko, hi, fr, de
```

### Member icon is missing

`content/members.json`の`icon`と、`public/members/`内の実際のファイル名が一致していません。

例：

```json
"icon": "/members/member-name.png"
```

実ファイル：

```text
public/members/member-name.png
```

### Duplicate member slug

2人以上が同じ`slug`を使用しています。各メンバーに異なる半角英小文字・数字・ハイフンの値を設定してください。

### Pagesが404になる

- `Settings → Pages`のSourceが`GitHub Actions`か確認する
- Actionsの最新デプロイが成功しているか確認する
- URLにリポジトリ名`TSUBAKI_HP`が含まれているか確認する

### CSSや画像が表示されない

`package.json`の`build:pages`を確認します。

```text
SITE_BASE_URL=https://naokibot.github.io/TSUBAKI_HP/
SITE_BASE_PATH=/TSUBAKI_HP
```

リポジトリ名を変更した場合は、この2つと公開URLを新しい名前へ変更してください。

### Actionsで Missing script: build

リポジトリ直下に次があることを確認します。

```text
package.json
content/
scripts/
src/
public/
```

### 変更が反映されない

1. `main`へCommitされているか確認する
2. Actionsの最新実行を確認する
3. ブラウザで`Ctrl + F5`を押す
4. 公開中のCommit SHAが最新か確認する
