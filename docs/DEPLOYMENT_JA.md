# TSUBAKI Tech GitHub Pages公開手順

## 1. 公開方式

このサイトはGitHub Actionsで静的HTMLを生成し、GitHub Pagesへ公開します。

公開URL:

```text
https://naokibot.github.io/TSUBAKI_HP/
```

GitHub Pagesではサーバー側のJavaScriptやデータベースを実行できないため、管理者ログイン、メール認証、Cloudflare Functionsは使用しません。問い合わせはFormspreeへ直接送信します。

## 2. ローカル確認

### ZIPを使う場合

1. ZIPを右クリックして「すべて展開」する
2. 展開したフォルダを開く
3. `START_WINDOWS.bat`をダブルクリックする
4. `http://localhost:4173`を開く

### コマンドを使う場合

```bat
cd /d "プロジェクトフォルダの実際のパス"
npm run check
npm run dev
```

終了は `Ctrl + C` です。

### GitHub Pagesと同じURL構成で確認

Windows PowerShell:

```powershell
$env:SITE_BASE_URL="https://naokibot.github.io/TSUBAKI_HP/"
$env:SITE_BASE_PATH="/TSUBAKI_HP"
npm run build
npm run serve -- --base-path=/TSUBAKI_HP
```

ブラウザで次を開きます。

```text
http://localhost:4173/TSUBAKI_HP/
```

## 3. Formspreeを準備

1. Formspreeへ登録する
2. 登録メールアドレスを確認する
3. Dashboardで `New Form` を作成する
4. 通知先を `tsubaki.tech.jp@gmail.com` にする
5. Integration画面のエンドポイントをコピーする

例:

```text
https://formspree.io/f/abcdwxyz
```

`content/site.json`を開き、次を実際の値へ変更します。

```json
"contactEndpoint": "https://formspree.io/f/abcdwxyz"
```

`YOUR_FORM_ID`のままではフォームは送信されません。その場合も表示メールアドレスから直接連絡できます。

## 4. GitHub Pagesを有効化

1. GitHubで `Naokibot/TSUBAKI_HP` を開く
2. `Settings`を開く
3. 左メニューの`Pages`を開く
4. `Build and deployment`のSourceを`GitHub Actions`にする
5. `Actions`を開く
6. `Deploy portfolio to GitHub Pages`を選択する
7. `Run workflow`を押す
8. 緑色のチェックが付くことを確認する

公開後は次を開きます。

```text
https://naokibot.github.io/TSUBAKI_HP/
```

## 5. 更新を公開

GitHub上でJSONを編集してCommitするか、ローカルで次を実行します。

```bash
npm run check
npm run build
git add .
git commit -m "update portfolio"
git push origin main
```

`main`の更新を検知してGitHub Actionsが自動公開します。

## 6. 公開後の確認

- トップページが表示される
- ロゴがTSUBAKI Techになっている
- 日本語・英語切替が動く
- 作品詳細と記事詳細を開ける
- ダークモードが動く
- 問い合わせフォームから送信できる
- `tsubaki.tech.jp@gmail.com`へ通知が届く

## 7. よくあるエラー

### Pagesが404

- Settings → PagesのSourceが`GitHub Actions`か確認
- Actionsのデプロイが成功しているか確認
- URLの末尾まで正しく入力する

```text
https://naokibot.github.io/TSUBAKI_HP/
```

### CSSや画像が表示されない

`.github/workflows/deploy-pages.yml`の次の値を確認します。

```text
SITE_BASE_URL=https://naokibot.github.io/TSUBAKI_HP/
SITE_BASE_PATH=/TSUBAKI_HP
```

リポジトリ名を変えた場合は両方を新しい名前へ変更します。

### Actionsで`Missing script: build`

リポジトリ直下の`package.json`を使っているか確認します。GitHubへアップロードするときにフォルダが二重になっていないか確認してください。

### 問い合わせが「準備中」になる

`content/site.json`の`contactEndpoint`が次のままです。

```text
https://formspree.io/f/YOUR_FORM_ID
```

Formspreeで発行された実際のエンドポイントへ置き換えてCommitしてください。

### 問い合わせ送信に失敗する

- Formspreeのフォームが削除されていないか
- Form IDの入力ミスがないか
- Formspreeアカウントのメール確認が完了しているか
- 通知先が`tsubaki.tech.jp@gmail.com`か
- FormspreeのSubmission画面に記録があるか
- 迷惑メールフォルダへ入っていないか

### GitHubリポジトリ一覧が表示されない

GitHub APIの一時的な回数制限や通信失敗の可能性があります。サイト上部のGitHubリンクからリポジトリ自体は開けます。時間を置いて再読み込みしてください。

### 変更が反映されない

1. GitHubの`main`にCommitされているか確認
2. Actionsの最新実行を確認
3. ブラウザで`Ctrl + F5`を押す
4. 公開中のActions実行が最新Commitか確認
