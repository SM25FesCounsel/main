"""Core package for festival ROI analysis utilities."""

from .analysis import summarize
from .cli import main as cli_main, parse_args
from .formatting import format_currency
from .io import load_events
from .models import FestivalEvent
from .ranking import metric_value
from .reporting import event_as_dict, export_report
from .sample_data import sample_events

main = cli_main

__all__ = [
    "FestivalEvent",
    "summarize",
    "load_events",
    "export_report",
    "event_as_dict",
    "sample_events",
    "format_currency",
    "metric_value",
    "parse_args",
    "main",
]
