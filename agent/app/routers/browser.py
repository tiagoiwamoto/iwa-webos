"""Minimal web-fetch proxy so the browser app can render sites that send
X-Frame-Options/CSP frame-ancestors (served same-origin, headers dropped).

GET /api/browser/browse?url=... -> sanitized HTML with <base> + link
click interception (postMessage back to the app for in-proxy navigation).
"""

import re

import requests
from fastapi import APIRouter, HTTPException
from fastapi.responses import Response

router = APIRouter(prefix="/browser", tags=["browser"])

_UA = {"User-Agent": "Mozilla/5.0 (X11; Linux) MaltaOS Navigator/1.0"}

_HOOK = """<script>
document.addEventListener('click', function(e) {
  var a = e.target.closest ? e.target.closest('a[href]') : null;
  if (a && /^https?:/.test(a.href)) {
    e.preventDefault();
    parent.postMessage({webosNav: a.href}, '*');
  }
}, true);
</script>"""


@router.get("/browse")
def browse(url: str):
    if not re.match(r"^https?://", url or ""):
        raise HTTPException(400, "url must start with http:// or https://")
    try:
        r = requests.get(url, headers=_UA, timeout=20)
    except requests.RequestException as e:
        raise HTTPException(502, f"fetch failed: {e}")
    ctype = (r.headers.get("content-type") or "").split(";")[0].strip()
    if ctype != "text/html":
        # binary / css / etc — relay as-is
        return Response(content=r.content, media_type=ctype or "application/octet-stream")
    base = str(r.url).replace('"', "%22")
    inject = f'<base href="{base}">' + _HOOK
    html = r.text
    if re.search(r"<head[^>]*>", html, re.I):
        html = re.sub(r"(<head[^>]*>)", lambda m: m.group(1) + inject, html, count=1, flags=re.I)
    else:
        html = inject + html
    return Response(content=html, media_type="text/html")
