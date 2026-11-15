/*
 * Builds the OS.js client bundle plus all local packages in src/packages/*.
 *
 * Webpack 4 uses md4 internally which is unavailable on OpenSSL 3 / modern
 * Node, so we alias it to sha256 before webpack loads.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const origCreateHash = crypto.createHash;
crypto.createHash = alg =>
  origCreateHash.call(crypto, alg === 'md4' ? 'sha256' : alg);

const webpack = require('webpack');

const root = path.resolve(__dirname, '..');
const packagesRoot = path.join(root, 'src/packages');
const only = process.argv.includes('--packages')
  ? 'packages'
  : process.argv.includes('--client') ? 'client' : 'all';

const configs = [];

if (only !== 'client') {
  fs.readdirSync(packagesRoot)
    .filter(d => !d.startsWith('_'))
    .map(d => path.join(packagesRoot, d))
    .filter(d => fs.existsSync(path.join(d, 'webpack.config.js')))
    .forEach(d => configs.push(require(path.join(d, 'webpack.config.js'))));
}

if (only !== 'packages') {
  configs.push(require(path.join(root, 'webpack.config.js')));
}

webpack(configs, (err, stats) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(stats.toString({colors: true, chunks: false, modules: false}));
  if (stats.hasErrors()) {
    process.exit(1);
  }

  // Brand: replace visible 'OS.js' strings (locales, dialogs) inside every
  // emitted bundle — never 'osjs' (service identifiers must stay intact).
  fs.readdirSync(path.join(root, 'dist'))
    .filter(f => f.endsWith('.js'))
    .forEach(f => {
      const file = path.join(root, 'dist', f);
      const src = fs.readFileSync(file, 'utf8');
      fs.writeFileSync(file, src.replace(/OS\.js/g, 'IwaWebOs'));
    });
  process.exit(0);
});
