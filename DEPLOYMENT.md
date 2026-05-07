# Public Deployment

This app has two deployment modes.

## Static Hosting

This is the recommended public mode when you only need previous-day data.

Run this on your local computer each day:

```bat
update_static_data.bat
```

Or build a clean upload folder:

```bat
build_static_site.bat
```

Upload these files to the static host:

```text
index.html
styles.css
app.js
data/snapshots.json
```

On public domains, the page automatically uses static mode. It reads `data/snapshots.json` and does not call `/api/refresh`.

Good targets:

- GitHub Pages
- Cloudflare Pages
- Netlify
- Vercel static hosting

## Python Server Hosting

Use this only if you want visitors to trigger server-side refreshes. The app needs a Python server because `/api/refresh` runs the scraper and updates `data/snapshots.json`.

## Recommended Server Shape

Use any host that can run a long-lived Python web process:

- VPS or cloud VM
- PaaS service that supports Python web apps
- Docker-capable NAS or server
- Windows server with Python plus a reverse proxy

Do not deploy only `index.html` to a static host if you want live refresh. Static hosting can show the dashboard, but it cannot run Python.

## Run On A Server

```bash
python scripts/server.py
```

For public access, bind to all interfaces:

```bash
HOST=0.0.0.0 PORT=8765 python scripts/server.py
```

On Windows PowerShell:

```powershell
$env:HOST="0.0.0.0"
$env:PORT="8765"
python scripts/server.py
```

Then point your firewall or reverse proxy to port `8765`.

## Docker

Build:

```bash
docker build -t etf-dashboard .
```

Run:

```bash
docker run -p 8765:8765 -e HOST=0.0.0.0 -e PORT=8765 etf-dashboard
```

## Refresh Behavior

The web page calls `/api/refresh` when opened. On public hosting, the server throttles refreshes with:

```bash
REFRESH_MIN_SECONDS=1800
```

Default is 30 minutes. This prevents every visitor from triggering a full scrape.

Manual force refresh:

`/api/refresh?force=1`

## IIS

IIS can serve static files, but this app also needs Python for `/api/refresh`.

Practical IIS setup:

1. Run `python scripts/server.py` as a background service on `127.0.0.1:8765`.
2. Configure IIS as a reverse proxy to that local server.
3. Do not point IIS only at the folder as static files, because the refresh API will not exist.

For most cases, a small VPS, Docker, or Python-capable PaaS is simpler than IIS.
