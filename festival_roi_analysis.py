"""Festival ROI analysis utilities and CLI."""

from __future__ import annotations

import argparse
import csv
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable, List, Optional


@dataclass
class FestivalEvent:
    name: str
    cost: float
    revenue: float
    attendance: int

    @property
    def roi(self) -> float:
        """Return ROI as (revenue - cost) / cost, guarded against division by zero."""
        if self.cost == 0:
            return 0.0
        return (self.revenue - self.cost) / self.cost

    @property
    def profit(self) -> float:
        return self.revenue - self.cost


def load_events(csv_path: Path) -> List[FestivalEvent]:
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


def summarize(events: Iterable[FestivalEvent]) -> dict:
    events = list(events)
    if not events:
        return {
            "events": 0,
            "avg_roi": 0.0,
            "avg_profit": 0.0,
            "total_profit": 0.0,
            "total_attendance": 0,
        }
    total_profit = sum(event.profit for event in events)
    total_attendance = sum(event.attendance for event in events)
    avg_profit = total_profit / len(events)
    avg_roi = sum(event.roi for event in events) / len(events)
    return {
        "events": len(events),
        "avg_roi": avg_roi,
        "avg_profit": avg_profit,
        "total_profit": total_profit,
        "total_attendance": total_attendance,
    }


def sample_events() -> List[FestivalEvent]:
    # Sample data helps users validate the workflow without providing their own dataset.
    return [
        FestivalEvent("Spring Lights", cost=45000, revenue=86000, attendance=5000),
        FestivalEvent("Coastal Sounds", cost=78000, revenue=120000, attendance=8500),
        FestivalEvent("Harvest Gala", cost=30000, revenue=41000, attendance=3600),
        FestivalEvent("Winter Village", cost=90000, revenue=99000, attendance=9200),
    ]


def parse_args(argv: Optional[List[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Analyze festival ROI results.")
    parser.add_argument(
        "--input",
        type=Path,
        help="CSV file with columns name,cost,revenue,attendance.",
    )
    parser.add_argument(
        "--top",
        type=int,
        default=3,
        help="Show top N events by ROI (default: 3).",
    )
    parser.add_argument(
        "--min-attendance",
        type=int,
        default=0,
        help="Ignore events with attendance below this threshold.",
    )
    return parser.parse_args(argv)


def format_currency(value: float) -> str:
    return f"${value:,.2f}"


def main(argv: Optional[List[str]] = None) -> None:
    args = parse_args(argv)
    events = sample_events()
    if args.input:
        events = load_events(args.input)
    if args.min_attendance > 0:
        events = [event for event in events if event.attendance >= args.min_attendance]
    summary = summarize(events)
    print("Festival ROI Summary")
    print("-------------------")
    print(f"Events analysed : {summary['events']}")
    print(f"Avg ROI         : {summary['avg_roi']:.2%}")
    print(f"Avg Profit      : {format_currency(summary['avg_profit'])}")
    print(f"Total Profit    : {format_currency(summary['total_profit'])}")
    print(f"Total Attendance: {summary['total_attendance']:,}")
    print()
    count = max(0, min(args.top, len(events)))
    if count:
        by_roi = sorted(events, key=lambda event: event.roi, reverse=True)[:count]
        print(f"Top {count} Events by ROI")
        for event in by_roi:
            print(
                f"- {event.name}: ROI {event.roi:.2%}, "
                f"Profit {format_currency(event.profit)}, "
                f"Attendance {event.attendance:,}"
            )


if __name__ == "__main__":
    main()
