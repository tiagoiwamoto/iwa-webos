/*
 * OS.js auth adapter that verifies credentials against real Linux users
 * via PAM, proxied through the privileged WebOS agent:
 *
 *   POST {agent}/api/auth/login   {username, password} -> 200 {user, session}
 *   POST {agent}/api/auth/session {token}              -> 200 {user, session}
 *   POST {agent}/api/auth/logout  {token}              -> 200
 *   -> 401 on failure
 *
 * The agent runs as root so it can check /etc/shadow through pam_unix.
 * The 'token' path replays a session token issued at login — the browser
 * stores only the token in the auth cookie, never the password.
 * Fails closed: any error or non-200 means "invalid login".
 */

const post = (core, path, body) => {
  const {agent, token} = core.config('webos');
  return fetch(`${agent}/api/auth${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-WebOS-Token': token
    },
    body: JSON.stringify(body)
  });
};

const cookieToken = (req) => {
  const match = /webos-session=([^;]+)/.exec((req.headers || {}).cookie || '');
  if (!match) {
    return null;
  }
  try {
    return JSON.parse(decodeURIComponent(match[1])).token || null;
  } catch (e) {
    return null;
  }
};

module.exports = (core, options) => ({
  init: async () => true,
  destroy: async () => true,

  login: async (req, res) => {
    const {username, password, token} = req.body || {};

    let response;
    try {
      if (token) {
        response = await post(core, '/session', {token});
      } else if (typeof username === 'string' && typeof password === 'string' &&
                 username && password) {
        response = await post(core, '/login', {username, password});
      } else {
        return false;
      }
    } catch (e) {
      core.logger.warn('webos agent unreachable for auth:', e.message);
      return false;
    }

    if (!response.ok) {
      return false;
    }

    const user = await response.json();
    return {
      id: user.uid,
      username: user.username,
      name: user.name || user.username,
      groups: user.groups || [],
      session: user.session
    };
  },

  logout: async (req, res) => {
    const token = cookieToken(req);
    if (token) {
      try {
        await post(core, '/logout', {token});
      } catch (e) {
        core.logger.warn('webos agent unreachable for logout:', e.message);
      }
    }
    return true;
  }
});
