"""Input helpers for reading festival event datasets."""

from __future__ import annotations

import csv
from pathlib import Path
from typing import List

from festival_roi.models import FestivalEvent

__all__ = ["load_events"]


def load_events(csv_path: Path) -> List[FestivalEvent]:
    """Load festival events from a CSV file."""
    rows: List[FestivalEvent] = []
    with csv_path.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        required = {"name", "cost", "revenue", "attendance"}
        missing = required - set(reader.fieldnames or [])
        if missing:
            pretty = ", ".join(sorted(missing))
            raise ValueError(f"CSV missing required columns: {pretty}")
        for raw in reader:
            try:
                rows.append(
                    FestivalEvent(
                        name=raw["name"],
                        cost=float(raw["cost"]),
                        revenue=float(raw["revenue"]),
                        attendance=int(raw["attendance"]),
                    )
                )
            except (TypeError, ValueError) as exc:
                raise ValueError(f"Invalid row {raw}") from exc
    return rows

