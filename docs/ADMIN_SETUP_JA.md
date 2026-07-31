# TSUBAKI Tech 管理者ログイン設定

## 仕組み

サイト最下部の「管理者用ログイン」から `/admin/` を開きます。認証後、次のデータをブラウザで編集できます。

- サイト基本情報
- 作品一覧・作品詳細
- ブログ・技術記事
- スキル一覧
- 資格・コンテスト実績

保存内容はサーバー内に直接置かず、GitHubの `Naokibot/TSUBAKI_HP` へコミットします。Cloudflare PagesまたはGitHub Pagesの自動デプロイが完了すると本番サイトへ反映されます。

## 管理者

初期管理者メールアドレスは次です。

```text
tsubaki.tech.jp@gmail.com
```

複数の管理者を指定するときは、Cloudflare Pagesの `ADMIN_EMAILS` にカンマ区切りで設定します。

```text
tsubaki.tech.jp@gmail.com,second-admin@example.com
```

## 必須の秘密変数

Cloudflare Dashboardの対象Pagesプロジェクトで、Settings → Variables and Secretsを開き、ProductionとPreviewの両方へ次を登録します。

```text
ADMIN_EMAILS=tsubaki.tech.jp@gmail.com
ADMIN_PASSWORD=十分に長い管理者パスワード
SESSION_SECRET=ランダムな長い文字列
GITHUB_TOKEN=GitHubのFine-grained personal access token
GITHUB_REPOSITORY=Naokibot/TSUBAKI_HP
GITHUB_BRANCH=main
```

`ADMIN_PASSWORD`、`SESSION_SECRET`、`GITHUB_TOKEN`は必ずSecretとして登録してください。ソースコードやJSONへ書かないでください。

### SESSION_SECRETの作成例

PowerShell:

```powershell
-join ((48..57)+(65..90)+(97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

表示された文字列を `SESSION_SECRET` に設定します。

## GitHubトークンの権限

GitHubでFine-grained personal access tokenを作成します。

1. GitHub Settingsを開く
2. Developer settingsを開く
3. Personal access tokens → Fine-grained tokensを開く
4. Repository accessで `TSUBAKI_HP` のみ選択する
5. Repository permissionsで `Contents: Read and write` を許可する
6. 発行されたトークンをCloudflareの `GITHUB_TOKEN` Secretへ登録する

トークンは管理画面やブラウザへ送信されません。Cloudflare Pages FunctionからGitHub APIを呼ぶときだけ使用します。

## 任意のログイン試行制限

Cloudflare KVを作成し、binding名を次にすると、同一IPから15分間に5回を超えるログイン試行を拒否します。

```text
ADMIN_RATE_LIMIT
```

問い合わせフォーム用KVとは分けても、同じNamespaceを異なるbinding名で接続しても構いません。

## ローカルで管理画面を確認する

通常の `npm run dev` では画面デザインは確認できますが、Pages Functionsは動かないためログインできません。

Cloudflare Pages Functionsも含めて確認する場合:

```bat
cd /d "プロジェクトのフォルダ"
npm run dev:pages
```

初回はWranglerのダウンロード確認が表示される場合があります。秘密変数をローカルで使う場合は、プロジェクト直下に `.dev.vars` を作成します。

```text
ADMIN_EMAILS=tsubaki.tech.jp@gmail.com
ADMIN_PASSWORD=ローカル確認用パスワード
SESSION_SECRET=ローカル確認用の長いランダム文字列
GITHUB_TOKEN=GitHubトークン
GITHUB_REPOSITORY=Naokibot/TSUBAKI_HP
GITHUB_BRANCH=main
```

`.dev.vars`は `.gitignore` の対象にし、GitHubへ送信しないでください。

## セキュリティ仕様

- 管理者メールアドレスを許可リストで制限
- パスワードとトークンをCloudflare Secretsで管理
- HttpOnly、SameSite=Strictの署名付きセッションCookie
- 8時間でセッション失効
- CSRFトークン検証
- GitHubの更新前SHAを使った競合検知
- 編集可能ファイルを5種類のJSONに限定
- JSON形式をサーバー側でも検証
- 任意のIP単位ログイン回数制限

## GitHub Pagesのみで公開する場合

GitHub Pagesはサーバー処理を実行できないため、管理者ログイン機能と問い合わせAPIは動きません。管理画面を使用する場合はCloudflare Pagesでサイトを公開してください。
