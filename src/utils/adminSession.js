import { requestJSON } from './request';

export function readAdminSession() {
  try {
    const session = JSON.parse(sessionStorage.getItem('reliv_admin_session') || 'null');
    return session?.token && session.expiresAt > Date.now() ? session : null;
  } catch { return null; }
}

export function saveAdminSession(session) {
  if (!/^[a-f0-9]{64}$/.test(session?.token || '') || !(session.expiresAt > Date.now())) {
    throw new Error('The admin server did not return a valid login session.');
  }
  sessionStorage.setItem('reliv_admin_session', JSON.stringify({ token: session.token, expiresAt: session.expiresAt }));
}

export function clearAdminSession() {
  try {
    sessionStorage.removeItem('reliv_admin_session');
    sessionStorage.removeItem('reliv_admin_authed');
  } catch { /* Sign-in will still be required by the backend. */ }
  window.dispatchEvent(new Event('reliv_admin_expired'));
}

export async function adminFetch(url, options = {}) {
  const session = readAdminSession();
  const result = await requestJSON(url, {
    ...options, returnResponse: true,
    headers: { ...options.headers, ...(session ? { Authorization: `Bearer ${session.token}` } : {}) },
  });
  if (result.status === 401 && result.data?.code === 'ADMIN_LOGIN_REQUIRED') clearAdminSession();
  return { ...result, json: async () => result.data };
}
