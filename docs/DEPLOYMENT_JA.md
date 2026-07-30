# TSUBAKI Tech Portfolio ローカル確認・公開手順

## 1. ローカルで確認する

### 必要なもの

- Node.js 20以上
- Git（GitHubから取得する場合）

### GitHubから取得する

```bash
git clone https://github.com/Naokibot/TSUBAKI_HP.git
cd TSUBAKI_HP
```

ZIPで取得した場合は、ZIPを展開してフォルダ内でターミナルを開いてください。

### 開発サーバーを起動する

このプロジェクトには外部パッケージ依存がないため、`npm install`は不要です。

```bash
npm run dev
```

ブラウザで次を開きます。

```text
http://localhost:4173
```

停止するときはターミナルで `Ctrl + C` を押します。

### 公開用ファイルを確認する

```bash
npm run build
npm run serve
```

`dist/`に生成された公開用サイトを `http://localhost:4173` で確認できます。

### GitHub Pagesと同じパスで確認する

macOS / Linux / Git Bash:

```bash
SITE_BASE_URL=https://naokibot.github.io/TSUBAKI_HP/ SITE_BASE_PATH=/TSUBAKI_HP npm run build
npm run serve -- --base-path=/TSUBAKI_HP
```

Windows PowerShell:

```powershell
$env:SITE_BASE_URL="https://naokibot.github.io/TSUBAKI_HP/"
$env:SITE_BASE_PATH="/TSUBAKI_HP"
npm run build
npm run serve -- --base-path=/TSUBAKI_HP
```

ブラウザでは `http://localhost:4173/TSUBAKI_HP/` を開きます。

## 2. 公開前に変更する

`content/site.json`の以下を実際の情報へ変更します。

- `email`
- `xUrl`
- `instagramUrl`
- `githubUser`
- `githubUrl`
- アクセス解析ID
- お問い合わせ送信先

公開してよいメールアドレスだけを設定してください。秘密鍵やAPIキーはJSONへ書かないでください。

## 3. GitHub Pagesで公開する

GitHub Pagesは、作品紹介サイトを無料で公開する方法として簡単です。HTTPSも自動で有効になります。

1. GitHubで `TSUBAKI_HP` を開く
2. `Settings` を開く
3. 左メニューの `Pages` を開く
4. `Build and deployment` のSourceを `GitHub Actions` にする
5. `main`へpushする
6. `Actions`の `Deploy portfolio to GitHub Pages` が成功するのを確認する
7. `https://naokibot.github.io/TSUBAKI_HP/` を開く

`.github/workflows/deploy-pages.yml`が、`main`更新時に自動でビルド・公開します。

### GitHub Pagesの注意点

GitHub Pagesではサーバー処理を実行できないため、同梱の `/api/contact` は動作しません。お問い合わせフォームを使う場合は、Formspreeなどの外部フォームURLを `contactEndpoint` に設定してください。

## 4. 推奨の本番公開: Cloudflare Pages

お問い合わせフォーム、Turnstile、独自ドメインまで使用するならCloudflare Pagesを推奨します。

1. Cloudflare Dashboardで `Workers & Pages` を開く
2. `Create` → `Pages` → `Connect to Git`
3. GitHubの `Naokibot/TSUBAKI_HP` を選ぶ
4. Build commandに `npm run build` を設定する
5. Build output directoryに `dist` を設定する
6. Root directoryは空欄にする
7. デプロイする

Cloudflare Pagesでは `functions/api/contact.js` が自動的にFunctionsとして認識されます。

### 問い合わせフォーム用環境変数

Cloudflare PagesのSettings → Variables and Secretsで設定します。

- `RESEND_API_KEY`
- `CONTACT_TO_EMAIL`
- `CONTACT_FROM_EMAIL`
- `TURNSTILE_SECRET`（推奨）

Turnstileの公開Site Keyは `content/site.json` の `turnstileSiteKey` に設定します。

### 独自ドメイン

Cloudflare PagesのCustom domainsからドメインを追加します。設定後、`content/site.json`の`baseUrl`を実際のHTTPS URLへ変更してください。CloudflareがSSL証明書を自動管理します。

## 5. 更新を公開する

コンテンツを編集したら次を実行します。

```bash
npm run check
npm run build
git add .
git commit -m "update portfolio content"
git push origin main
```

GitHub PagesまたはCloudflare Pagesが自動的に再公開します。
