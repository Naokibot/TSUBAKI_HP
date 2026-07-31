# TSUBAKI Tech 管理者メール認証設定

## 認証方式

管理画面はパスワードを使用しません。登録済みメールアドレスを入力すると、6桁のワンタイム認証コードがメールで届きます。コードを正しく入力した場合だけ管理画面へ入れます。

許可される管理者は次の2件だけです。

```text
tomatonabe0120@gmail.com
tsubaki.tech.jp@gmail.com
```

この2件は `functions/_shared/admin.js` 内の固定許可リストで判定します。`ADMIN_EMAILS`などの環境変数を変更しても、第三者を管理者へ追加できません。

## 管理画面で編集できる内容

サイト最下部の「管理者用ログイン」から `/admin/` を開きます。認証後、次のデータを編集できます。

- サイト基本情報
- 作品一覧・作品詳細
- ブログ・技術記事
- スキル一覧
- 資格・コンテスト実績

保存内容はGitHubの `Naokibot/TSUBAKI_HP` へコミットされ、Cloudflare PagesまたはGitHub Pagesの自動デプロイ後に公開サイトへ反映されます。

## Cloudflare Pagesで必須の設定

Cloudflare Dashboardの対象Pagesプロジェクトで、Settings → Variables and Secretsを開き、ProductionとPreviewへ設定します。

### Secret

```text
SESSION_SECRET=ランダムな長い文字列
GITHUB_TOKEN=GitHubのFine-grained personal access token
RESEND_API_KEY=ResendのAPIキー
ADMIN_FROM_EMAIL=Resendで認証済みの送信元メール
```

`ADMIN_FROM_EMAIL`を設定しない場合は`CONTACT_FROM_EMAIL`を使用します。

### 通常の環境変数

```text
GITHUB_REPOSITORY=Naokibot/TSUBAKI_HP
GITHUB_BRANCH=main
CONTACT_TO_EMAIL=tsubaki.tech.jp@gmail.com
```

`ADMIN_PASSWORD`と`ADMIN_EMAILS`は不要です。残っている場合は削除してください。

## ADMIN_AUTH_KVの作成

認証コードを10分間だけ保存し、使用済みコードを無効化し、送信回数を制限するためCloudflare KVが必須です。

1. Cloudflare DashboardでStorage & Databases → KVを開く
2. `TSUBAKI_ADMIN_AUTH`などの名前でNamespaceを作る
3. PagesプロジェクトのSettings → Bindingsを開く
4. KV namespace bindingを追加する
5. Variable nameを次にする

```text
ADMIN_AUTH_KV
```

認証コードは10分で自動削除されます。Cloudflare KVの`expirationTtl`を使用しています。

## SESSION_SECRETの作成例

PowerShell:

```powershell
-join ((48..57)+(65..90)+(97..122) | Get-Random -Count 64 | ForEach-Object {[char]$_})
```

表示された文字列を`SESSION_SECRET`へSecretとして登録します。

## Resendの設定

認証コードの送信にはResendを使用します。

```text
RESEND_API_KEY
ADMIN_FROM_EMAIL
```

`ADMIN_FROM_EMAIL`はResendで認証したドメインのアドレスにしてください。例:

```text
TSUBAKI Tech <login@example.com>
```

問い合わせフォームと同じ送信元を使う場合は、`CONTACT_FROM_EMAIL`だけでも動作します。

## GitHubトークンの権限

GitHubでFine-grained personal access tokenを作成します。

1. GitHub Settingsを開く
2. Developer settingsを開く
3. Personal access tokens → Fine-grained tokensを開く
4. Repository accessで`TSUBAKI_HP`だけを選択する
5. Repository permissionsで`Contents: Read and write`を許可する
6. 発行されたトークンをCloudflareの`GITHUB_TOKEN` Secretへ登録する

トークンはブラウザへ送信されず、Cloudflare Pages FunctionからGitHub APIを呼ぶときだけ使用されます。

## ローカル確認

通常の`npm run dev`では画面デザインを確認できますが、Pages Functionsが動かないためメール認証はできません。

Cloudflare Pages Functionsを含めて確認する場合:

```bat
cd /d "プロジェクトのフォルダ"
npm run dev:pages
```

プロジェクト直下に`.dev.vars`を作成します。

```text
SESSION_SECRET=ローカル確認用の長いランダム文字列
GITHUB_TOKEN=GitHubトークン
GITHUB_REPOSITORY=Naokibot/TSUBAKI_HP
GITHUB_BRANCH=main
RESEND_API_KEY=ResendのAPIキー
ADMIN_FROM_EMAIL=認証済み送信元メール
```

WranglerのローカルKV bindingも`ADMIN_AUTH_KV`という名前で設定してください。`.dev.vars`はGitHubへ送信しないでください。

## セキュリティ仕様

- 管理者メールを2件に固定
- パスワード認証を完全に廃止
- 6桁ワンタイムコード
- 認証コードは10分で失効
- 認証コードを5回間違えると無効化
- IP単位・メール単位の送信回数制限
- 認証コードは平文ではなくHMAC値としてKVへ保存
- 成功後に認証コードを削除
- HttpOnly、SameSite=Strictの署名付きセッションCookie
- セッションは8時間で失効
- CSRFトークン検証
- GitHubの更新前SHAを使った競合検知
- 編集可能ファイルを5種類のJSONへ限定
- JSON形式をサーバー側でも検証

## GitHub Pagesだけで公開する場合

GitHub Pagesはサーバー処理を実行できないため、メール認証、管理画面保存、問い合わせAPIは動きません。管理者機能を使う場合はCloudflare Pagesで公開してください。
