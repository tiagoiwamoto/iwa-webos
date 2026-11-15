/*
 * OS.js auth adapter that verifies credentials against real Linux users
 * via PAM, proxied through the privileged WebOS agent:
 *
 *   POST {agent}/api/auth/login {username, password}
 *     -> 200 {username, uid, name, groups, ...}
 *     -> 401
 *
 * The agent runs as root so it can check /etc/shadow through pam_unix.
 * Fails closed: any error or non-200 means "invalid login".
 */

module.exports = (core, options) => ({
  init: async () => true,
  destroy: async () => true,

  login: async (req, res) => {
    const {username, password} = req.body || {};
    if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
      return false;
    }

    const {agent, token} = core.config('webos');

    let response;
    try {
      response = await fetch(`${agent}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-WebOS-Token': token
        },
        body: JSON.stringify({username, password})
      });
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
      groups: user.groups || []
    };
  },

  logout: async (req, res) => true
});
