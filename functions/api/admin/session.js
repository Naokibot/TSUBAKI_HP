import { json, readSession } from '../../_shared/admin.js';

export async function onRequestGet({ request, env }) {
  const session = await readSession(request, env);
  if (!session) return json({ authenticated: false }, 401);
  return json({ authenticated: true, email: session.email, csrf: session.csrf });
}
