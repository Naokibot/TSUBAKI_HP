import { clearSessionCookie, json, requireAdmin } from '../../_shared/admin.js';

export async function onRequestPost({ request, env }) {
  const auth = await requireAdmin(request, env, { csrf: true });
  if (auth.response) return auth.response;
  return json({ ok: true }, 200, { 'set-cookie': clearSessionCookie(request) });
}
