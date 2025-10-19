"""Festival ROI analysis utilities and CLI."""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Iterable, List, Optional

from festival_roi.analysis import summarize
from festival_roi.models import FestivalEvent
from festival_roi.io import load_events
from festival_roi.reporting import export_report


def metric_value(event: FestivalEvent, metric: str) -> float:
    if metric == "profit":
        return event.profit
    if metric == "attendance":
        return float(event.attendance)
    return event.roi


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
        "--bottom",
        type=int,
        default=0,
        help="Show bottom N events using the same ranking metric.",
    )
    parser.add_argument(
        "--min-attendance",
        type=int,
        default=0,
        help="Ignore events with attendance below this threshold.",
    )
    parser.add_argument(
        "--summary-only",
        action="store_true",
        help="Only show aggregate metrics, omit the top events breakdown.",
    )
    parser.add_argument(
        "--export-json",
        type=Path,
        help="Export the summary and ranked events to this JSON file.",
    )
    parser.add_argument(
        "--rank-by",
        choices=("roi", "profit", "attendance"),
        default="roi",
        help="Metric used to rank the top events (default: roi).",
    )
    parser.add_argument(
        "--currency",
        default="$",
        help="Currency symbol or prefix used when printing monetary values.",
    )
    parser.add_argument(
        "--report-title",
        default="Festival ROI Summary",
        help="Custom title for the printed report header.",
    )
    parser.add_argument(
        "--roi-target",
        type=float,
        help="ROI threshold (0.25 for 25%%) used to flag underperforming events.",
    )
    return parser.parse_args(argv)


def format_currency(value: float, symbol: str) -> str:
    spacer = "" if len(symbol) == 1 else " "
    return f"{symbol}{spacer}{value:,.2f}"


def main(argv: Optional[List[str]] = None) -> None:
    args = parse_args(argv)
    currency = args.currency
    title = args.report_title
    events = sample_events()
    if args.input:
        events = load_events(args.input)
    if args.min_attendance > 0:
        events = [event for event in events if event.attendance >= args.min_attendance]
    summary = summarize(events)
    top_count = max(0, min(args.top, len(events)))
    ranked_desc: List[FestivalEvent] = []
    if events:
        ranked_desc = sorted(
            events, key=lambda event: metric_value(event, args.rank_by), reverse=True
        )
    top_events: List[FestivalEvent] = ranked_desc[:top_count]
    bottom_count = max(0, min(args.bottom, len(events)))
    bottom_events: List[FestivalEvent] = []
    if bottom_count:
        bottom_events = sorted(
            events, key=lambda event: metric_value(event, args.rank_by)
        )[:bottom_count]
    if args.summary_only:
        top_events = []
        bottom_events = []
    underperformers: List[FestivalEvent] = []
    if args.roi_target is not None:
        underperformers = [
            event for event in events if event.roi < args.roi_target
        ]
    if args.export_json:
        export_report(
            args.export_json,
            summary,
            top_events,
            args.rank_by,
            bottom_events,
            underperformers,
            args.roi_target,
            title,
        )
    print(title)
    print("-------------------")
    print(f"Events analysed : {summary['events']}")
    print(f"Avg ROI         : {summary['avg_roi']:.2%}")
    print(f"Avg Profit      : {format_currency(summary['avg_profit'], currency)}")
    print(f"Total Profit    : {format_currency(summary['total_profit'], currency)}")
    print(f"Total Attendance: {summary['total_attendance']:,}")
    print(
        f"Avg Cost/Guest  : {format_currency(summary['avg_cost_per_attendee'], currency)}"
    )
    print()
    if args.roi_target is not None:
        print(f"Events below ROI target ({args.roi_target:.2%})")
        if underperformers:
            for event in underperformers:
                print(
                    f"- {event.name}: ROI {event.roi:.2%}, "
                    f"Profit {format_currency(event.profit, currency)}"
                )
        else:
            print("- None")
        print()
    label = {"roi": "ROI", "profit": "Profit", "attendance": "Attendance"}[
        args.rank_by
    ]
    if top_events:
        print(f"Top {len(top_events)} Events by {label}")
        for event in top_events:
            print(
                f"- {event.name}: ROI {event.roi:.2%}, "
                f"Profit {format_currency(event.profit, currency)}, "
                f"Attendance {event.attendance:,}, "
                f"Cost/Guest {format_currency(event.cost_per_attendee, currency)}"
            )
        print()
    if bottom_events:
        print(f"Bottom {len(bottom_events)} Events by {label}")
        for event in bottom_events:
            print(
                f"- {event.name}: ROI {event.roi:.2%}, "
                f"Profit {format_currency(event.profit, currency)}, "
                f"Attendance {event.attendance:,}, "
                f"Cost/Guest {format_currency(event.cost_per_attendee, currency)}"
            )
        print()
    if args.summary_only:
        return
    if not top_events and not bottom_events:
        return


if __name__ == "__main__":
    main()
