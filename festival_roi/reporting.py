"""Reporting utilities for festival ROI analysis."""

from __future__ import annotations

import json
from pathlib import Path
from typing import Iterable, Optional

from festival_roi.models import FestivalEvent

__all__ = ["event_as_dict", "export_report"]


def event_as_dict(event: FestivalEvent) -> dict:
    """Return a serializable representation of an event."""
    return {
        "name": event.name,
        "cost": event.cost,
        "revenue": event.revenue,
        "attendance": event.attendance,
        "roi": event.roi,
        "profit": event.profit,
        "cost_per_attendee": event.cost_per_attendee,
    }


def export_report(
    path: Path,
    summary: dict,
    top_events: Iterable[FestivalEvent],
    metric: str,
    bottom_events: Iterable[FestivalEvent],
    underperformers: Iterable[FestivalEvent],
    roi_target: Optional[float],
    title: str,
) -> None:
    """Persist the analysis results as a JSON document."""
    payload = {
        "title": title,
        "summary": summary,
        "ranking_metric": metric,
        "top_events": [event_as_dict(event) for event in top_events],
        "bottom_events": [event_as_dict(event) for event in bottom_events],
        "roi_target": roi_target,
        "underperforming_events": [
            event_as_dict(event) for event in underperformers
        ],
    }
    if path.parent and not path.parent.exists():
        path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")

