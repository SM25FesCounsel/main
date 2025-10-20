"""HTTP routes for the ROI dashboard."""

from __future__ import annotations

from flask import Blueprint, render_template

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/")
def home() -> str:
    """Render the dashboard index page."""
    return render_template("dashboard.html")
