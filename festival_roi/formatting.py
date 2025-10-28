"""Output formatting helpers."""

from __future__ import annotations

__all__ = ["format_currency"]


def format_currency(value: float, symbol: str) -> str:
    """Format a numeric value as a currency string."""
    spacer = "" if len(symbol) == 1 else " "
    return f"{symbol}{spacer}{value:,.2f}"

