# Festival ROI Toolkit

Utilities for evaluating the return on investment of festival events.

## CLI

Run the bundled script to analyse a CSV file:

```bash
python festival_roi_analysis.py --input path/to/events.csv --top 5
```

Add `--summary-only` to suppress the rankings output or `--export-json report.json` to
write a structured report.

## Python usage

The `festival_roi` package exposes the building blocks used by the CLI so you can use
them programmatically:

```python
from pathlib import Path
from festival_roi import load_events, summarize

events = load_events(Path("events.csv"))
summary = summarize(events)
print(summary["total_profit"])
```

Module highlights:
- `festival_roi.models` stores the `FestivalEvent` dataclass.
- `festival_roi.analysis` computes summary metrics.
- `festival_roi.reporting` serialises reports to JSON.
- `festival_roi.cli` houses the argument parser and CLI entry point.
