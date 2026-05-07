#!/usr/bin/env python3
"""Check which dates exist in a dashboard snapshots.json file."""

from __future__ import annotations

import argparse
import json
from datetime import date, datetime, timedelta
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate snapshot dates in data/snapshots.json.")
    parser.add_argument("--input", "-i", default="data/snapshots.json", help="Snapshot JSON path.")
    parser.add_argument("--from-date", required=True, help="Start date, YYYY-MM-DD.")
    parser.add_argument("--to-date", required=True, help="End date, YYYY-MM-DD.")
    args = parser.parse_args()

    path = Path(args.input)
    if not path.exists():
        print(f"Missing file: {path}")
        return 2

    data = json.loads(path.read_text(encoding="utf-8"))
    snapshots = data.get("snapshots") or {}
    existing = set(snapshots.keys())
    wanted = list(date_range(parse_date(args.from_date), parse_date(args.to_date)))
    missing = [day.isoformat() for day in wanted if day.isoformat() not in existing]

    print(f"Snapshot file: {path}")
    print(f"Updated at: {data.get('updatedAt', 'unknown')}")
    print(f"Available dates: {', '.join(sorted(existing)) or '(none)'}")
    print()

    for day in wanted:
        key = day.isoformat()
        by_etf = snapshots.get(key) or {}
        row_count = sum(len(rows) for rows in by_etf.values())
        status = "OK" if key in existing else "MISSING"
        print(f"{key}: {status} ({len(by_etf)} ETF, {row_count} holdings)")

    if missing:
        print()
        print("Missing requested dates:")
        for key in missing:
            print(f"- {key}")
        print()
        print("Note: ETFinfo public holding pages appear to expose the latest published")
        print("snapshot for each ETF. Dates not already archived locally usually cannot")
        print("be reconstructed as full daily holdings after the fact.")
        return 1

    return 0


def parse_date(value: str) -> date:
    return datetime.strptime(value, "%Y-%m-%d").date()


def date_range(start: date, end: date):
    current = start
    while current <= end:
        yield current
        current += timedelta(days=1)


if __name__ == "__main__":
    raise SystemExit(main())
