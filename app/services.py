"""Service helpers that bridge the core ROI library with the web app."""

from __future__ import annotations

from typing import Iterable, List, Optional

from festival_roi.analysis import summarize
from festival_roi.models import FestivalEvent
from festival_roi.ranking import metric_value
from festival_roi.reporting import event_as_dict
from festival_roi.sample_data import sample_events


def get_sample_events() -> List[FestivalEvent]:
    """Return the demo dataset used when no file is provided."""
    return sample_events()


def analyse_events(
    events: Iterable[FestivalEvent],
    *,
    rank_by: str = "roi",
    top: int = 3,
    bottom: int = 0,
    roi_target: Optional[float] = None,
) -> dict:
    """Compute metrics and breakdowns for the dashboard."""
    events = list(events)
    summary = summarize(events)

    ranked_desc: List[FestivalEvent] = []
    if events:
        ranked_desc = sorted(
            events, key=lambda event: metric_value(event, rank_by), reverse=True
        )

    top_events = ranked_desc[: max(0, min(top, len(ranked_desc)))]
    bottom_events: List[FestivalEvent] = []
    if bottom > 0:
        bottom_events = sorted(
            events, key=lambda event: metric_value(event, rank_by)
        )[: max(0, min(bottom, len(events)))]

    roi_threshold = roi_target if roi_target is not None else None
    underperformers: List[FestivalEvent] = []
    if roi_threshold is not None:
        underperformers = [
            event for event in events if event.roi < roi_threshold
        ]

    chart_payload = _build_chart_payload(events)

    return {
        "summary": summary,
        "top_events": top_events,
        "bottom_events": bottom_events,
        "underperformers": underperformers,
        "chart": chart_payload,
        "roi_target": roi_threshold,
    }


def serialize_events(events: Iterable[FestivalEvent]) -> List[dict]:
    """Convert event dataclasses into dictionaries for JSON responses."""
    return [event_as_dict(event) for event in events]


def _build_chart_payload(events: Iterable[FestivalEvent]) -> dict:
    events = list(events)
    labels = [event.name for event in events]
    roi_values = [round(event.roi * 100, 2) for event in events]
    profit_values = [event.profit for event in events]
    attendance_values = [event.attendance for event in events]
    return {
        "labels": labels,
        "roi": roi_values,
        "profit": profit_values,
        "attendance": attendance_values,
    }
