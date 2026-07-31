const body = document.body;
const apiBase = body.dataset.adminApiBase || '/api/admin';
const loginView = document.querySelector('#admin-login-view');
const editorView = document.querySelector('#admin-editor-view');
const loginForm = document.querySelector('#admin-login-form');
const loginStatus = document.querySelector('#admin-login-status');
const editorStatus = document.querySelector('#admin-editor-status');
const contentSelect = document.querySelector('#admin-content-select');
const contentEditor = document.querySelector('#admin-content-editor');
const currentAdmin = document.querySelector('#current-admin');
const saveButton = document.querySelector('#admin-save');
const reloadButton = document.querySelector('#admin-reload');
const logoutButton = document.querySelector('#admin-logout');
let csrf = '';
let currentSha = '';

async function api(path, options = {}) {
  const response = await fetch(`${apiBase}/${path}`, {
    credentials: 'same-origin',
    ...options,
    headers: {
      ...(options.body ? { 'content-type': 'application/json' } : {}),
      ...(options.method && options.method !== 'GET' && csrf ? { 'x-csrf-token': csrf } : {}),
      ...(options.headers || {})
    }
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);
  return result;
}

function showLogin(message = '') {
  loginView.hidden = false;
  editorView.hidden = true;
  loginStatus.textContent = message;
}

function showEditor(email) {
  loginView.hidden = true;
  editorView.hidden = false;
  currentAdmin.textContent = email;
}

async function loadContent() {
  editorStatus.textContent = '読み込み中…';
  saveButton.disabled = true;
  try {
    const result = await api(`content?key=${encodeURIComponent(contentSelect.value)}`);
    currentSha = result.sha;
    contentEditor.value = result.content;
    editorStatus.textContent = `${result.path} を読み込みました。`;
  } catch (error) {
    editorStatus.textContent = error.message;
    if (/ログイン/.test(error.message)) showLogin('セッションの有効期限が切れました。');
  } finally {
    saveButton.disabled = false;
  }
}

async function restoreSession() {
  try {
    const session = await api('session');
    csrf = session.csrf;
    showEditor(session.email);
    await loadContent();
  } catch {
    showLogin();
  }
}

loginForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const submit = loginForm.querySelector('button[type="submit"]');
  submit.disabled = true;
  loginStatus.textContent = 'ログイン中…';
  try {
    const form = new FormData(loginForm);
    const result = await api('login', { method: 'POST', body: JSON.stringify(Object.fromEntries(form)) });
    csrf = result.csrf;
    loginForm.reset();
    showEditor(result.email);
    await loadContent();
  } catch (error) {
    loginStatus.textContent = `${error.message} Cloudflare Pagesでの秘密変数設定も確認してください。`;
  } finally {
    submit.disabled = false;
  }
});

contentSelect?.addEventListener('change', loadContent);
reloadButton?.addEventListener('click', loadContent);

saveButton?.addEventListener('click', async () => {
  editorStatus.textContent = 'JSONを確認しています…';
  try { JSON.parse(contentEditor.value); } catch (error) {
    editorStatus.textContent = `JSONエラー: ${error.message}`;
    return;
  }
  saveButton.disabled = true;
  editorStatus.textContent = 'GitHubへ保存中…';
  try {
    const result = await api('content', {
      method: 'PUT',
      body: JSON.stringify({ key: contentSelect.value, sha: currentSha, content: contentEditor.value })
    });
    currentSha = result.sha;
    contentEditor.value = result.content;
    editorStatus.innerHTML = result.commit
      ? `保存しました。<a href="${result.commit}" target="_blank" rel="noopener">GitHubのコミットを確認</a>　自動再公開を待ってください。`
      : '保存しました。自動再公開を待ってください。';
  } catch (error) {
    editorStatus.textContent = error.message;
  } finally {
    saveButton.disabled = false;
  }
});

logoutButton?.addEventListener('click', async () => {
  try { await api('logout', { method: 'POST', body: '{}' }); } catch { /* cookie is still cleared when possible */ }
  csrf = '';
  currentSha = '';
  showLogin('ログアウトしました。');
});

restoreSession();
