"""HTTP routes for the ROI dashboard."""

from __future__ import annotations

from flask import Blueprint, current_app, render_template

from app.services import analyse_events, get_sample_events

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/")
def home() -> str:
    """Render the dashboard index page."""
    events = get_sample_events()
    analysis = analyse_events(
        events,
        rank_by="roi",
        top=3,
        bottom=3,
        roi_target=0.2,
    )
    currency_symbol = current_app.config["ROI_CURRENCY_SYMBOL"]
    return render_template(
        "dashboard.html",
        summary=analysis["summary"],
        top_events=analysis["top_events"],
        bottom_events=analysis["bottom_events"],
        roi_target=analysis["roi_target"],
        underperformers=analysis["underperformers"],
        currency=currency_symbol,
        chart=analysis["chart"],
    )
