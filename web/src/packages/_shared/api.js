/*
 * Shared helpers for WebOS apps: calls the privileged agent through the
 * authenticated OS.js server proxy at /api/webos/*.
 */

const request = (method, path, body) => {
  const options = {
    method,
    headers: body !== undefined ? {'Content-Type': 'application/json'} : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined
  };

  return fetch(`/api/webos/${path}`, options)
    .then(async res => {
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (e) {
        data = text;
      }
      if (!res.ok) {
        const detail = data && data.detail ? data.detail : res.statusText;
        throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
      }
      return data;
    });
};

const qs = params => {
  const clean = Object.entries(params || {})
    .filter(([, v]) => v !== undefined && v !== null && v !== '');
  return clean.length ? '?' + new URLSearchParams(clean).toString() : '';
};

export const api = {
  get: (path, params) => request('GET', path + qs(params)),
  post: (path, body) => request('POST', path, body || {}),
  put: (path, body) => request('PUT', path, body || {}),
  del: (path, params) => request('DELETE', path + qs(params))
};

export const terminalSocket = () => new WebSocket(
  `${location.protocol === 'https:' ? 'wss' : 'ws'}://${location.host}/ws/webos/terminal`
);

export const formatBytes = n => {
  if (n === null || n === undefined) {
    return '-';
  }
  const units = ['B', 'K', 'M', 'G', 'T', 'P'];
  let i = 0;
  let v = Number(n);
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v.toFixed(v >= 100 || i === 0 ? 0 : 1)}${units[i]}`;
};
