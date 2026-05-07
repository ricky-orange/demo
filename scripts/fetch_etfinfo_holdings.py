#!/usr/bin/env python3
"""Fetch real Taiwan active ETF holdings from ETF資訊網 public pages.

The output is data/snapshots.json, which the dashboard reads first.
ETF資訊網 states that its holdings pages are整理自公開來源; this script records
the exact source URL and warnings so the UI can disclose provenance.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
from datetime import datetime
from pathlib import Path
from typing import Any
from urllib.error import URLError
from urllib.request import Request, urlopen


BASE_URL = "https://www.etfinfo.tw"
ACTIVE_URL = f"{BASE_URL}/active"
PALETTE = ["#18bfff", "#36e29b", "#ffbf3c", "#9c7cff", "#30d6c9", "#ff8a2a", "#eba0ad"]


def main() -> None:
    parser = argparse.ArgumentParser(description="Fetch active ETF holdings into data/snapshots.json.")
    parser.add_argument("--output", "-o", default="data/snapshots.json", help="Output JSON path.")
    parser.add_argument("--limit", "-n", type=int, default=10, help="Keep top N active ETFs by AUM. Use 0 for all.")
    parser.add_argument("--codes", help="Comma-separated ETF codes to fetch instead of auto top-N.")
    parser.add_argument("--sleep", type=float, default=0.4, help="Seconds to wait between ETF page requests.")
    parser.add_argument("--keep-unselected", action="store_true", help="Keep old snapshots for ETFs outside the selected list.")
    args = parser.parse_args()

    warnings: list[str] = []
    existing = read_json(Path(args.output))
    existing_snapshots = existing.get("snapshots", {}) if isinstance(existing, dict) else {}

    try:
        active_payload = fetch_nuxt_payload(ACTIVE_URL)
        active_summary = active_payload["data"]["active-summary-weekly-0"]
        active_etfs = active_summary["etfs"]
    except Exception as exc:
        active_etfs = []
        warnings.append(f"無法讀取主動式 ETF 清單：{exc}")

    if args.codes:
        requested_codes = [code.strip().upper() for code in args.codes.split(",") if code.strip()]
    else:
        requested_codes = [item["code"] for item in active_etfs if item.get("code")]

    fetched: list[dict[str, Any]] = []
    for index, code in enumerate(requested_codes):
        if index and args.sleep > 0:
            time.sleep(args.sleep)
        try:
            fetched.append(fetch_etf_detail(code))
        except Exception as exc:
            warnings.append(f"{code} 抓取失敗：{exc}")

    if args.codes:
        selected = fetched
    else:
        selected = sorted(fetched, key=lambda item: item.get("aum") or 0, reverse=True)
        if args.limit > 0:
            selected = selected[: args.limit]

    expected_count = len(requested_codes) if args.codes else min(args.limit, len(requested_codes)) if args.limit > 0 else len(requested_codes)
    if expected_count and len(selected) < expected_count:
        warnings.append(
            f"Only fetched {len(selected)} of {expected_count} expected ETF(s); keeping the existing snapshot file."
        )
        print(f"Fetch incomplete: {len(selected)} of {expected_count} ETF(s). Existing file was not overwritten.")
        if warnings:
            print("Warnings:")
            for warning in warnings:
                print(f"- {warning}")
        sys.exit(1)

    selected_codes = {item["code"] for item in selected}
    snapshots = merge_snapshots(existing_snapshots, selected, keep_unselected=args.keep_unselected, selected_codes=selected_codes)
    etfs = [
        {
            "code": item["code"],
            "name": item["name"],
            "short": item["name"],
            "aum": item.get("aum") or 0,
            "color": PALETTE[index % len(PALETTE)],
            "sourceUrl": item["sourceUrl"],
            "snapshotDate": item["snapshotDate"],
        }
        for index, item in enumerate(selected)
    ]

    if not selected:
        warnings.append("沒有成功取得任何 ETF 持股；前端會回退成 demo 資料。")

    bundle = {
        "updatedAt": datetime.now().isoformat(timespec="seconds"),
        "source": "ETF資訊網（整理自公開來源）",
        "sourceUrl": ACTIVE_URL,
        "isRealData": True,
        "fetchWarnings": warnings,
        "selectedRule": "指定代號" if args.codes else f"依最新 AUM 取前 {args.limit} 檔",
        "etfs": etfs,
        "snapshots": snapshots,
    }

    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(bundle, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {output} with {len(selected)} ETF(s), {count_holdings(snapshots)} holding rows.")
    if warnings:
        print("Warnings:")
        for warning in warnings:
            print(f"- {warning}")


def fetch_etf_detail(code: str) -> dict[str, Any]:
    url = f"{BASE_URL}/etf/{code}/holdings"
    payload = fetch_nuxt_payload(url)
    detail = payload["data"][f"etf-detail-base-{code}"]
    info = detail.get("info") or {}
    market = detail.get("latestMarket") or {}
    holdings_block = detail.get("holdings") or {}
    rows = []

    for row in holdings_block.get("holdings") or []:
        stock_code = str(row.get("code") or "").strip()
        if not stock_code:
            continue
        rows.append(
            {
                "code": stock_code,
                "name": row.get("name") or stock_code,
                "shares": parse_number(row.get("shares")),
                "weight": round(parse_number(row.get("weight")), 4),
            }
        )

    rows.sort(key=lambda item: (-item["weight"], item["code"]))
    snapshot_date = holdings_block.get("snapshotDate") or market.get("date")
    if not snapshot_date:
        raise ValueError("找不到持股快照日期")
    if not rows:
        raise ValueError("找不到持股明細")

    return {
        "code": code,
        "name": info.get("name") or code,
        "fullName": info.get("fullName") or "",
        "issuer": info.get("issuer") or "",
        "aum": parse_number(market.get("aum")),
        "marketDate": market.get("date") or "",
        "snapshotDate": snapshot_date,
        "sourceUrl": url,
        "holdings": rows,
    }


def fetch_nuxt_payload(url: str) -> dict[str, Any]:
    html = fetch_text(url)
    match = re.search(
        r'<script type="application/json" data-nuxt-data="nuxt-app" data-ssr="true" id="__NUXT_DATA__">(.*?)</script>',
        html,
        re.S,
    )
    if not match:
        raise ValueError("找不到 Nuxt 資料區塊")
    raw = json.loads(match.group(1))
    return resolve_nuxt(raw)


def resolve_nuxt(raw: list[Any]) -> Any:
    sys.setrecursionlimit(max(20000, len(raw) * 3))

    def resolve_ref(index: int, seen: set[int] | None = None) -> Any:
        if seen is None:
            seen = set()
        if index in seen:
            return None
        value = raw[index]
        if isinstance(value, (dict, list)):
            return resolve_value(value, seen | {index})
        return value

    def resolve_value(value: Any, seen: set[int] | None = None) -> Any:
        if seen is None:
            seen = set()
        if isinstance(value, int):
            return resolve_ref(value, seen)
        if isinstance(value, list):
            if value and isinstance(value[0], str) and value[0] in {"Reactive", "ShallowReactive", "Ref"} and len(value) > 1:
                return resolve_ref(value[1], seen)
            return [resolve_ref(item, seen) if isinstance(item, int) else resolve_value(item, seen) for item in value]
        if isinstance(value, dict):
            return {
                key: resolve_ref(item, seen) if isinstance(item, int) else resolve_value(item, seen)
                for key, item in value.items()
            }
        return value

    return resolve_ref(0)


def merge_snapshots(
    existing_snapshots: dict[str, Any],
    selected: list[dict[str, Any]],
    *,
    keep_unselected: bool,
    selected_codes: set[str],
) -> dict[str, dict[str, list[dict[str, Any]]]]:
    merged: dict[str, dict[str, list[dict[str, Any]]]] = {}

    for date, by_etf in existing_snapshots.items():
        if not isinstance(by_etf, dict):
            continue
        for code, rows in by_etf.items():
            if keep_unselected or code in selected_codes:
                merged.setdefault(date, {})[code] = rows

    for item in selected:
        merged.setdefault(item["snapshotDate"], {})[item["code"]] = item["holdings"]

    return {date: merged[date] for date in sorted(merged)}


def fetch_text(url: str) -> str:
    request = Request(url, headers={"User-Agent": "Mozilla/5.0 Codex ETF monitor"})
    try:
        with urlopen(request, timeout=30) as response:
            return response.read().decode("utf-8")
    except URLError as exc:
        raise RuntimeError(str(exc)) from exc


def parse_number(value: Any) -> float:
    if value is None:
        return 0.0
    if isinstance(value, (int, float)):
        return float(value)
    cleaned = str(value).replace("%", "").replace(",", "").replace("，", "").strip()
    if not cleaned:
        return 0.0
    try:
        return float(cleaned)
    except ValueError:
        return 0.0


def read_json(path: Path) -> dict[str, Any]:
    if not path.exists():
        return {}
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}


def count_holdings(snapshots: dict[str, dict[str, list[dict[str, Any]]]]) -> int:
    return sum(len(rows) for by_etf in snapshots.values() for rows in by_etf.values())


if __name__ == "__main__":
    main()
