#!/bin/bash
# Downloads the app archive on first boot and serves it via Apache —
# the classic Softaculous-style flow for apps without an official image.
set -e
cd /var/www/html
if [ ! -f .webos-installed ] && [ -n "$APP_URL" ]; then
  echo "[webos] downloading $APP_URL"
  curl -fsSL "$APP_URL" -o /tmp/app.pkg
  mkdir -p /tmp/app
  case "$APP_URL" in
    *.zip)      unzip -q /tmp/app.pkg -d /tmp/app ;;
    *.tar.gz|*.tgz)   tar xzf /tmp/app.pkg -C /tmp/app ;;
    *.tar.bz2)  tar xjf /tmp/app.pkg -C /tmp/app ;;
    *) echo "[webos] unknown archive type" && exit 1 ;;
  esac
  SRC=/tmp/app
  if [ -n "$APP_SUBDIR" ]; then
    SRC="/tmp/app/$APP_SUBDIR"
    [ -d "$SRC" ] || SRC=/tmp/app
  elif [ "$(find /tmp/app -mindepth 1 -maxdepth 1 | wc -l)" = "1" ]; then
    SRC="$(find /tmp/app -mindepth 1 -maxdepth 1)"
  fi
  cp -a "$SRC"/. /var/www/html/
  chown -R www-data:www-data /var/www/html
  rm -rf /tmp/app /tmp/app.pkg
  touch .webos-installed
fi
exec apache2-foreground
