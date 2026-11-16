/*
 * WebOS Agent bridge for OS.js server.
 *
 * Exposes the privileged Python agent (127.0.0.1:8765) to authenticated
 * OS.js sessions:
 *   HTTP  /api/webos/*        -> agent /api/*        (injects X-WebOS-Token)
 *   WS    /ws/webos/terminal  -> agent /ws/terminal  (injects auth message)
 *
 * The token never reaches the browser.
 */

const {ServiceProvider} = require('@osjs/common');
const proxy = require('express-http-proxy');
const WebSocket = require('ws');

class WebOSServiceProvider extends ServiceProvider {
  provides() {
    return ['webos/agent'];
  }

  async init() {
    const express = this.core.make('osjs/express');
    const {agent, agentWs, token, dbgate} = this.core.config('webos');

    this.core.singleton('webos/agent', () => ({agent, agentWs, token}));

    express.routeAuthenticated('use', '/api/webos', proxy(agent, {
      proxyReqPathResolver: req => '/api' + req.url,
      proxyReqOptDecorator: opts => {
        opts.headers['X-WebOS-Token'] = token;
        return opts;
      },
      limit: '50mb'
    }));

    // DbGate iframe: same-origin proxy behind the OS.js session so the
    // manager needs no second login (SKIP_ALL_AUTH on the container).
    // WEB_ROOT=/dbgate on the upstream keeps asset paths working.
    const wsBridge = (ws, req, upstreamBase) => {
      if (!req.session || !req.session.user) {
        ws.close(4401, 'unauthorized');
        return;
      }
      const upstream = new WebSocket(upstreamBase + req.url);
      upstream.on('message', (data, isBinary) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data, {binary: isBinary});
        }
      });
      upstream.on('close', (code, reason) => ws.close(code, reason));
      upstream.on('error', () => ws.close(1011, 'upstream unavailable'));
      ws.on('message', (data, isBinary) => {
        if (upstream.readyState === WebSocket.OPEN) {
          upstream.send(data, {binary: isBinary});
        }
      });
      ws.on('close', () => upstream.close());
      ws.on('error', () => upstream.close());
    };

    express.routeAuthenticated('use', '/dbgate', proxy(dbgate, {
      proxyReqPathResolver: req => '/dbgate' + req.url,
      limit: '50mb'
    }));
    express.websocket('/dbgate/socket.io/', (ws, req) =>
      wsBridge(ws, req, dbgate.replace(/^http/, 'ws')));

    express.websocket('/ws/webos/terminal', (ws, req) => {
      if (!req.session || !req.session.user) {
        ws.close(4401, 'unauthorized');
        return;
      }

      const upstream = new WebSocket(`${agentWs}/ws/terminal`);

      upstream.on('open', () => {
        upstream.send(JSON.stringify({
          type: 'auth',
          token,
          username: req.session.user.username
        }));
      });

      upstream.on('message', (data, isBinary) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data, {binary: isBinary});
        }
      });

      upstream.on('close', (code, reason) => ws.close(code, reason));
      upstream.on('error', () => ws.close(1011, 'agent unavailable'));

      ws.on('message', (data, isBinary) => {
        if (upstream.readyState === WebSocket.OPEN) {
          upstream.send(data, {binary: isBinary});
        }
      });

      ws.on('close', () => upstream.close());
      ws.on('error', () => upstream.close());
    });
  }
}

module.exports = WebOSServiceProvider;
