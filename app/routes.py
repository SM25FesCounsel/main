"""HTTP routes for the ROI dashboard."""

from __future__ import annotations

from flask import Blueprint, render_template

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/")
def home() -> str:
    """Render the dashboard index page."""
    metrics = {
        "events": 4,
        "avg_roi": 0.27,
        "total_profit": 125000,
    }
    top_events = [
        {"name": "Spring Lights", "roi": 0.36, "profit": 21000},
        {"name": "Coastal Sounds", "roi": 0.29, "profit": 42000},
        {"name": "Harvest Gala", "roi": 0.12, "profit": 11000},
    ]
    return render_template("dashboard.html", metrics=metrics, top_events=top_events)
