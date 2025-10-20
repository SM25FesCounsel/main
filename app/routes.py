"""HTTP routes for the ROI dashboard."""

from __future__ import annotations

from flask import Blueprint, current_app, flash, render_template, request

from app.services import (
    analyse_events,
    get_sample_events,
    load_uploaded_events,
)

dashboard_bp = Blueprint("dashboard", __name__)


@dashboard_bp.route("/", methods=["GET", "POST"])
def home() -> str:
    """Render the dashboard index page."""
    events = get_sample_events()
    dataset_label = "Sample dataset"
    min_attendance = 0
    if request.method == "POST":
        min_attendance = int(request.form.get("min_attendance", 0) or 0)
        upload = request.files.get("dataset")
        if upload and upload.filename:
            try:
                events = load_uploaded_events(upload)
                dataset_label = upload.filename
                flash(f"Loaded {len(events)} events from {upload.filename}", "success")
            except ValueError as exc:
                flash(str(exc), "danger")
                events = get_sample_events()
                dataset_label = "Sample dataset"
        else:
            flash("Using bundled sample dataset", "info")
    analysis = analyse_events(
        events,
        rank_by="roi",
        top=3,
        bottom=3,
        roi_target=0.2,
        min_attendance=min_attendance,
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
        dataset_label=dataset_label,
        min_attendance=min_attendance,
    )
