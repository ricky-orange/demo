#!/usr/bin/env python3
"""Normalize ETF holding CSV files into data/snapshots.json.

Expected minimum columns, with flexible aliases:
date, etfCode, code, name, shares, weight
"""

from __future__ import annotations

import argparse
import csv
import json
from datetime import datetime
from pathlib import Path
from typing import Iterable


ALIASES = {
    "date": ["date", "Date", "DATE", "資料日", "日期", "持股日期", "揭露日期"],
    "etf": ["etfCode", "etf", "ETF", "ETF代號", "基金代號", "基金簡稱"],
    "code": ["code", "stockCode", "ticker", "證券代號", "股票代號", "代號"],
    "name": ["name", "stockName", "證券名稱", "股票名稱", "名稱"],
    "shares": ["shares", "share", "qty", "quantity", "持股數", "股數", "數量"],
    "weight": ["weight", "weightPct", "ratio", "權重", "權重%", "比重", "投資比例"],
}


def main() -> None:
    parser = argparse.ArgumentParser(description="Build data/snapshots.json from holding CSV files.")
    parser.add_argument("--input", "-i", required=True, help="CSV file or directory containing CSV files.")
    parser.add_argument("--output", "-o", default="data/snapshots.json", help="Output JSON path.")
    parser.add_argument("--source", "-s", default="local CSV import", help="Source label shown in the app.")
    args = parser.parse_args()

    snapshots: dict[str, dict[str, list[dict[str, object]]]] = {}
    imported_files = 0
    imported_rows = 0

    for path in iter_csv_paths(Path(args.input)):
        imported_files += 1
        for row in read_csv(path):
            date = value_from(row, ALIASES["date"])
            etf = value_from(row, ALIASES["etf"])
            code = value_from(row, ALIASES["code"])
            if not date or not etf or not code:
                continue

            holding = {
                "code": code,
                "name": value_from(row, ALIASES["name"]) or code,
                "shares": parse_number(value_from(row, ALIASES["shares"])),
                "weight": round(parse_number(value_from(row, ALIASES["weight"])), 4),
            }
            snapshots.setdefault(date, {}).setdefault(etf, []).append(holding)
            imported_rows += 1

    for by_etf in snapshots.values():
        for rows in by_etf.values():
            rows.sort(key=lambda item: (-float(item["weight"]), str(item["code"])))

    bundle = {
        "updatedAt": datetime.now().isoformat(timespec="seconds"),
        "source": args.source,
        "importedFiles": imported_files,
        "importedRows": imported_rows,
        "snapshots": dict(sorted(snapshots.items())),
    }

    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(bundle, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"Wrote {output} with {imported_rows} rows from {imported_files} files.")


def iter_csv_paths(path: Path) -> Iterable[Path]:
    if path.is_file():
        yield path
        return
    yield from sorted(item for item in path.glob("*.csv") if item.is_file())


def read_csv(path: Path) -> Iterable[dict[str, str]]:
    for encoding in ("utf-8-sig", "utf-8", "cp950", "big5"):
        try:
            with path.open("r", encoding=encoding, newline="") as handle:
                yield from csv.DictReader(handle)
            return
        except UnicodeDecodeError:
            continue
    raise UnicodeDecodeError("csv", b"", 0, 1, f"Unable to decode {path}")


def value_from(row: dict[str, str], aliases: list[str]) -> str:
    for alias in aliases:
        value = row.get(alias)
        if value is not None and str(value).strip():
            return str(value).strip()
    return ""


def parse_number(value: str) -> float:
    cleaned = str(value or "").replace("%", "").replace(",", "").replace("，", "").strip()
    if not cleaned:
        return 0.0
    try:
        return float(cleaned)
    except ValueError:
        return 0.0


if __name__ == "__main__":
    main()
