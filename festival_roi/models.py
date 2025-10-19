"""Data models for festival ROI analysis."""

from __future__ import annotations

from dataclasses import dataclass

__all__ = ["FestivalEvent"]


@dataclass
class FestivalEvent:
    """Represents a single festival event and derived financial metrics."""

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

    @property
    def cost_per_attendee(self) -> float:
        if self.attendance == 0:
            return 0.0
        return self.cost / self.attendance

