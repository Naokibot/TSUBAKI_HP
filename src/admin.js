const body = document.body;
const apiBase = body.dataset.adminApiBase || '/api/admin';
const loginView = document.querySelector('#admin-login-view');
const editorView = document.querySelector('#admin-editor-view');
const emailForm = document.querySelector('#admin-email-form');
const codeForm = document.querySelector('#admin-code-form');
const emailInput = document.querySelector('#admin-email');
const codeInput = document.querySelector('#admin-code');
const pendingEmail = document.querySelector('#pending-admin-email');
const loginStatus = document.querySelector('#admin-login-status');
const resendButton = document.querySelector('#admin-resend-code');
const changeEmailButton = document.querySelector('#admin-change-email');
const editorStatus = document.querySelector('#admin-editor-status');
const contentSelect = document.querySelector('#admin-content-select');
const contentEditor = document.querySelector('#admin-content-editor');
const currentAdmin = document.querySelector('#current-admin');
const saveButton = document.querySelector('#admin-save');
const reloadButton = document.querySelector('#admin-reload');
const logoutButton = document.querySelector('#admin-logout');
let csrf = '';
let currentSha = '';
let loginEmail = '';

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
  emailForm.hidden = false;
  codeForm.hidden = true;
  loginStatus.textContent = message;
}

function showCodeStep(email, message = '') {
  loginEmail = email.trim().toLowerCase();
  pendingEmail.textContent = loginEmail;
  emailForm.hidden = true;
  codeForm.hidden = false;
  loginStatus.textContent = message;
  codeInput.value = '';
  codeInput.focus();
}

function showEditor(email) {
  loginView.hidden = true;
  editorView.hidden = false;
  currentAdmin.textContent = email;
}

async function requestCode(email) {
  const result = await api('login', {
    method: 'POST',
    body: JSON.stringify({ email })
  });
  showCodeStep(email, result.message || '認証コードを送信しました。');
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

emailForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const submit = emailForm.querySelector('button[type="submit"]');
  submit.disabled = true;
  loginStatus.textContent = '認証コードを送信しています…';
  try {
    await requestCode(emailInput.value);
  } catch (error) {
    loginStatus.textContent = `${error.message} Cloudflare Pagesのメール認証設定も確認してください。`;
  } finally {
    submit.disabled = false;
  }
});

codeForm?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const submit = codeForm.querySelector('button[type="submit"]');
  submit.disabled = true;
  loginStatus.textContent = '認証コードを確認しています…';
  try {
    const result = await api('verify', {
      method: 'POST',
      body: JSON.stringify({ email: loginEmail, code: codeInput.value })
    });
    csrf = result.csrf;
    codeForm.reset();
    showEditor(result.email);
    await loadContent();
  } catch (error) {
    loginStatus.textContent = error.message;
    codeInput.select();
  } finally {
    submit.disabled = false;
  }
});

resendButton?.addEventListener('click', async () => {
  resendButton.disabled = true;
  loginStatus.textContent = '新しい認証コードを送信しています…';
  try {
    await requestCode(loginEmail);
  } catch (error) {
    loginStatus.textContent = error.message;
  } finally {
    resendButton.disabled = false;
  }
});

changeEmailButton?.addEventListener('click', () => {
  loginEmail = '';
  showLogin();
  emailInput.focus();
});

codeInput?.addEventListener('input', () => {
  codeInput.value = codeInput.value.replace(/\D/g, '').slice(0, 6);
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
  loginEmail = '';
  showLogin('ログアウトしました。');
});

restoreSession();
