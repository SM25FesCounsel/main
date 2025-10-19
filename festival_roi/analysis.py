"""Core analytics helpers."""

from __future__ import annotations

from typing import Iterable, List, Dict

from festival_roi.models import FestivalEvent

__all__ = ["summarize"]


def summarize(events: Iterable[FestivalEvent]) -> Dict[str, float | int]:
    """Return aggregate metrics for a collection of festival events."""
    events = list(events)
    if not events:
        return {
            "events": 0,
            "avg_roi": 0.0,
            "avg_profit": 0.0,
            "total_profit": 0.0,
            "total_attendance": 0,
            "avg_cost_per_attendee": 0.0,
        }
    total_profit = sum(event.profit for event in events)
    total_attendance = sum(event.attendance for event in events)
    total_cost = sum(event.cost for event in events)
    avg_profit = total_profit / len(events)
    avg_roi = sum(event.roi for event in events) / len(events)
    avg_cost_per_attendee = (
        total_cost / total_attendance if total_attendance else 0.0
    )
    return {
        "events": len(events),
        "avg_roi": avg_roi,
        "avg_profit": avg_profit,
        "total_profit": total_profit,
        "total_attendance": total_attendance,
        "avg_cost_per_attendee": avg_cost_per_attendee,
    }

