#!/usr/bin/env python3
"""Local dashboard server with an API that refreshes real ETF holdings."""

from __future__ import annotations

import json
import os
import subprocess
import sys
import threading
import time
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse


ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "snapshots.json"
FETCH_SCRIPT = ROOT / "scripts" / "fetch_etfinfo_holdings.py"
REFRESH_MIN_SECONDS = int(os.environ.get("REFRESH_MIN_SECONDS", "1800"))
REFRESH_LOCK = threading.Lock()


class DashboardHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def do_GET(self) -> None:
        path = urlparse(self.path).path
        if path == "/api/refresh":
            self.handle_refresh()
            return
        if path == "/api/status":
            self.handle_status()
            return
        super().do_GET()

    def handle_refresh(self) -> None:
        query = parse_qs(urlparse(self.path).query)
        force = query.get("force", ["0"])[0] == "1"
        current = read_bundle()

        if current and not force:
            age = bundle_age_seconds(current)
            if age is not None and age < REFRESH_MIN_SECONDS:
                current.setdefault("fetchWarnings", [])
                current["refreshStdout"] = f"Skipped refresh; last update was {int(age)} seconds ago."
                self.write_json({"ok": True, "cached": True, "bundle": current})
                return

        if not REFRESH_LOCK.acquire(blocking=False):
            self.write_json(
                {
                    "ok": True,
                    "cached": True,
                    "message": "Refresh already in progress; returning current snapshot.",
                    "bundle": current,
                }
            )
            return

        try:
            result = subprocess.run(
                [
                    sys.executable,
                    str(FETCH_SCRIPT),
                    "--output",
                    str(DATA_PATH),
                    "--limit",
                    "10",
                    "--sleep",
                    "0.2",
                ],
                cwd=str(ROOT),
                capture_output=True,
                text=True,
                timeout=180,
            )

            if result.returncode != 0:
                self.write_json(
                    {
                        "ok": False,
                        "error": "抓取腳本執行失敗",
                        "stdout": result.stdout,
                        "stderr": result.stderr,
                        "bundle": read_bundle(),
                    },
                    status=500,
                )
                return

            bundle = read_bundle()
            bundle.setdefault("fetchWarnings", [])
            bundle["refreshStdout"] = result.stdout.strip()
            self.write_json({"ok": True, "cached": False, "bundle": bundle})
        finally:
            REFRESH_LOCK.release()

    def handle_status(self) -> None:
        bundle = read_bundle()
        self.write_json({"ok": bool(bundle), "bundle": bundle})

    def write_json(self, payload: dict, status: int = 200) -> None:
        body = json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def read_bundle() -> dict:
    if not DATA_PATH.exists():
        return {}
    try:
        return json.loads(DATA_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}


def bundle_age_seconds(bundle: dict) -> float | None:
    updated_at = bundle.get("updatedAt")
    if not updated_at:
        return None
    try:
        parsed = time.strptime(updated_at[:19], "%Y-%m-%dT%H:%M:%S")
        return time.time() - time.mktime(parsed)
    except ValueError:
        return None


def main() -> None:
    host = os.environ.get("HOST", "127.0.0.1")
    port = int(os.environ.get("PORT", sys.argv[1] if len(sys.argv) > 1 else 8765))
    if len(sys.argv) > 2:
        host = sys.argv[2]
    server = ThreadingHTTPServer((host, port), DashboardHandler)
    print(f"ETF dashboard server: http://{host}:{port}/index.html")
    print("Opening the page will refresh real holdings through /api/refresh.")
    print(f"Refresh throttle: {REFRESH_MIN_SECONDS} seconds. Use /api/refresh?force=1 to bypass.")
    server.serve_forever()


if __name__ == "__main__":
    main()
