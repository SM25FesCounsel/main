"""Sample event data for demonstrations."""

from __future__ import annotations

from typing import List

from festival_roi.models import FestivalEvent

__all__ = ["sample_events"]


def sample_events() -> List[FestivalEvent]:
    """Provide sample events for users without their own dataset."""
    return [
        FestivalEvent("Spring Lights", cost=45000, revenue=86000, attendance=5000),
        FestivalEvent("Coastal Sounds", cost=78000, revenue=120000, attendance=8500),
        FestivalEvent("Harvest Gala", cost=30000, revenue=41000, attendance=3600),
        FestivalEvent("Winter Village", cost=90000, revenue=99000, attendance=9200),
    ]

