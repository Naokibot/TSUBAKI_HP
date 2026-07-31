# GitHub Pagesで問い合わせメールを送る設定

GitHub Pagesは静的サイトのため、サイト自身からGmailへ直接メールを送信できません。このサイトではFormspreeを中継し、フォーム内容を`tsubaki.tech.jp@gmail.com`へ通知します。

## Formspreeでフォームを作る

1. Formspreeへ登録する
2. 登録メールアドレスの確認を完了する
3. Dashboard左上の追加ボタンから`New Form`を選ぶ
4. フォーム名を`TSUBAKI Tech Contact`などにする
5. 通知先を`tsubaki.tech.jp@gmail.com`にする
6. 作成後のIntegration画面を開く
7. `Your form's endpoint`をコピーする

形式:

```text
https://formspree.io/f/英数字のフォームID
```

## サイトへ設定する

`content/site.json`を開きます。

変更前:

```json
"contactEndpoint": "https://formspree.io/f/YOUR_FORM_ID"
```

変更後の例:

```json
"contactEndpoint": "https://formspree.io/f/abcdwxyz"
```

GitHub上で直接編集する場合は、鉛筆アイコンを押し、変更後に`Commit changes`を押します。GitHub Actionsが自動でサイトを再公開します。

## 動作確認

公開サイトの問い合わせフォームで、テスト用の名前、返信可能なメール、本文を入力します。送信後に次を確認します。

- 画面に送信成功が表示される
- FormspreeのSubmissionsに記録される
- `tsubaki.tech.jp@gmail.com`へ通知が届く
- 受信メールへ返信すると、フォーム入力者のメールが返信先になる

## セキュリティ

FormspreeのフォームIDはブラウザから使用する公開情報です。Resend APIキーやGmailパスワードは不要で、ソースコードへ秘密情報を書かないでください。

サイト側では次の簡易対策も行っています。

- 見えないハニーポット入力
- 読み込み直後の高速送信拒否
- 同じブラウザから30秒以内の連続送信拒否
- HTML必須入力と文字数制限

## エラー対処

### フォームが準備中と表示される

Formspreeの実際のエンドポイントが設定されていません。`YOUR_FORM_ID`を置き換えます。

### 404またはForm not found

フォームIDの誤り、フォーム削除、別アカウントのフォームを参照している可能性があります。Integration画面からエンドポイントをコピーし直します。

### 送信成功だがメールが届かない

FormspreeのSubmissionsを確認します。記録があれば通知設定または迷惑メール判定の問題です。通知先アドレスを再確認し、Gmailの迷惑メール・プロモーションも確認します。

### 422または入力エラー

名前、メールアドレス、本文を入力し直します。メール形式が正しいか、本文が5文字以上か確認します。

### 429または送信回数制限

短時間の連続送信またはFormspree側の上限です。時間を置いて再送信します。
