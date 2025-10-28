"""Utilities for ordering festival events."""

from __future__ import annotations

from festival_roi.models import FestivalEvent

__all__ = ["metric_value"]


def metric_value(event: FestivalEvent, metric: str) -> float:
    """Return a value suitable for ranking events."""
    if metric == "profit":
        return event.profit
    if metric == "attendance":
        return float(event.attendance)
    return event.roi

