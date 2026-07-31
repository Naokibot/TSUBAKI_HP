import {
  adminAuthConfigured,
  challengeCookie,
  createLoginChallenge,
  deleteLoginChallenge,
  isAllowedAdminEmail,
  json,
  loginRequestRateLimited,
  normalizeEmail,
  sendLoginCode
} from '../../_shared/admin.js';

export async function onRequestPost({ request, env }) {
  if (!adminAuthConfigured(env)) {
    return json({ error: 'メール認証に必要なCloudflare設定が不足しています。' }, 503);
  }

  let body;
  try { body = await request.json(); } catch { return json({ error: '入力内容を確認してください。' }, 400); }
  const email = normalizeEmail(body.email);
  const ip = request.headers.get('CF-Connecting-IP') || '';
  const rate = await loginRequestRateLimited(env, ip, email);
  if (rate.configurationError) return json({ error: '認証用KVが設定されていません。' }, 503);
  if (rate.limited) return json({ error: '認証コードの送信回数が多すぎます。15分ほど待ってください。' }, 429);

  // 許可されていないメールにも同じ成功応答を返し、管理者一覧の推測を防ぎます。
  if (!isAllowedAdminEmail(email)) {
    return json({ ok: true, message: '登録済みの管理者メールであれば認証コードを送信しました。' });
  }

  const challenge = await createLoginChallenge(email, env);
  try {
    await sendLoginCode(email, challenge.code, env);
  } catch (error) {
    await deleteLoginChallenge(challenge.challengeId, env);
    console.error(error);
    return json({ error: '認証メールを送信できませんでした。メール送信設定を確認してください。' }, 502);
  }

  return json(
    { ok: true, message: '登録済みの管理者メールであれば認証コードを送信しました。' },
    200,
    { 'set-cookie': challengeCookie(request, challenge.challengeId) }
  );
}
