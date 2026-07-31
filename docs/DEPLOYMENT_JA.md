# TSUBAKI Tech GitHub Pages公開手順

## 1. 公開方式

このサイトはGitHub Actionsで翻訳検証と静的HTML生成を行い、GitHub Pagesへ公開します。

```text
https://naokibot.github.io/TSUBAKI_HP/
```

GitHub Pagesではサーバー側処理を実行できないため、問い合わせはFormspreeへ直接送信します。

## 2. ローカル確認

ZIPを展開し、プロジェクト直下で次を実行します。

```bat
npm run validate
npm run check
npm run dev
```

ブラウザで開きます。

```text
http://localhost:4173
```

終了は `Ctrl + C` です。

GitHub Pages用パスを含む本番ビルドだけを確認する場合：

```bat
npm run build:pages
```

## 3. 問い合わせフォームを準備

1. Formspreeへ登録する
2. 登録メールアドレスを確認する
3. Dashboardでフォームを作成する
4. 通知先を `tsubaki.tech.jp@gmail.com` にする
5. Integration画面のエンドポイントをコピーする
6. `content/site.json`の`contactEndpoint`へ設定する

```json
"contactEndpoint": "https://formspree.io/f/実際のフォームID"
```

`YOUR_FORM_ID`のままでは送信されません。

## 4. GitHub Pagesを有効化

1. `Naokibot/TSUBAKI_HP`を開く
2. `Settings` → `Pages`を開く
3. Sourceを`GitHub Actions`にする
4. `Actions`を開く
5. `Deploy portfolio to GitHub Pages`を選ぶ
6. `Run workflow`を押す
7. 緑色のチェックを確認する

以後は`main`へpushすると自動で検証・ビルド・公開されます。

## 5. 公開後の確認

| 言語 | URL |
|---|---|
| 日本語 | `/TSUBAKI_HP/` |
| 英語 | `/TSUBAKI_HP/en/` |
| ロシア語 | `/TSUBAKI_HP/ru/` |
| 繁體中文（台湾向け） | `/TSUBAKI_HP/zh-tw/` |
| 韓国語 | `/TSUBAKI_HP/ko/` |
| ヒンディー語 | `/TSUBAKI_HP/hi/` |
| フランス語 | `/TSUBAKI_HP/fr/` |
| ドイツ語 | `/TSUBAKI_HP/de/` |

次も確認します。

- 言語メニューが同じプロジェクト・記事へ移動する
- CSS、ロゴ、作品画像が表示される
- ダークモードが動く
- 作品詳細と記事詳細が開く
- 問い合わせがFormspreeへ送信される
- `tsubaki.tech.jp@gmail.com`へ通知が届く

## 6. よくあるエラー

### Translation validation failed

翻訳対象のオブジェクトに8言語のいずれかが不足しています。エラーに表示されたJSONパスを確認し、次のキーをそろえます。

```text
ja, en, ru, zh-TW, ko, hi, fr, de
```

### Pagesが404になる

- `Settings` → `Pages`のSourceが`GitHub Actions`か確認
- Actionsの最新デプロイが成功しているか確認
- URLにリポジトリ名`TSUBAKI_HP`が含まれているか確認

### CSSや画像が表示されない

`.github/workflows/deploy-pages.yml`の値を確認します。

```text
SITE_BASE_URL=https://naokibot.github.io/TSUBAKI_HP/
SITE_BASE_PATH=/TSUBAKI_HP
```

リポジトリ名を変更した場合は、`package.json`の`build:pages`とワークフローの両方を変更します。

### Actionsで Missing script: build

GitHubへアップロードしたフォルダ階層を確認します。リポジトリ直下に次が必要です。

```text
package.json
content/
scripts/
src/
public/
```

### 問い合わせが「準備中」になる

`content/site.json`が次のままです。

```text
https://formspree.io/f/YOUR_FORM_ID
```

実際のFormspreeエンドポイントへ変更し、Commitします。

### 問い合わせ送信に失敗する

- Form IDの入力ミス
- Formspreeのメール確認が未完了
- フォームが削除済み
- 通知先が違う
- 30秒以内に連続送信した
- Formspree側の利用上限に達した

FormspreeのSubmissionsに記録があるか確認し、Gmailの迷惑メールも確認します。

### GitHub一覧が表示されない

GitHub APIの一時的な回数制限または通信失敗です。時間を置いて再読込します。サイト内のGitHubリンクからリポジトリへ直接移動できます。

### 変更が反映されない

1. `main`へCommitされているか確認
2. Actionsの最新実行を確認
3. ブラウザで`Ctrl + F5`
4. 公開中のCommit SHAが最新か確認
