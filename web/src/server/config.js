/*
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Copyright (c) 2011-2020, Anders Evenrud <andersevenrud@gmail.com>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * @author  Anders Evenrud <andersevenrud@gmail.com>
 * @licence Simplified BSD License
 */

//
// This is the server configuration tree.
// Guide: https://manual.os-js.org/config/#server
// Complete config tree: https://github.com/os-js/osjs-server/blob/master/src/config.js
//

const path = require('path');
const root = path.resolve(__dirname, '../../');

// Load shared secrets (WEBOS_TOKEN) from the repo root .env
try {
  process.loadEnvFile(path.resolve(root, '../.env'));
} catch (e) {
  // .env is optional
}

const csv = name => (process.env[name] || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

module.exports = {
  root,
  port: Number(process.env.WEBOS_PORT || process.env.PORT || 8000),
  public: path.resolve(root, 'dist'),

  // With authMode=pam, login requires a real Linux account; requiredGroups
  // then gates on the user's actual unix groups and denyUsers on username.
  auth: {
    requiredGroups: csv('WEBOS_REQUIRED_GROUPS'),
    denyUsers: csv('WEBOS_DENY_USERS')
  },

  webos: {
    agent: process.env.WEBOS_AGENT_URL || 'http://127.0.0.1:8765',
    agentWs: process.env.WEBOS_AGENT_WS || 'ws://127.0.0.1:8765',
    token: process.env.WEBOS_TOKEN || 'changeme',
    authMode: process.env.WEBOS_AUTH || 'null'
  },

  // NOTE: mountpoints are merged with the defaults (osjs + home), so only
  // extra mountpoints belong here. vfs.root feeds the {vfs} segment used
  // by the built-in 'home' mount ({vfs}/{username}); point it at /home to
  // make home:/ land on each user's real Linux home directory.
  vfs: {
    root: process.env.WEBOS_VFS_ROOT || path.resolve(root, 'vfs'),
    mountpoints: [{
      name: 'host',
      attributes: {
        root: '/',
        watch: false
      }
    }]
  }
};
