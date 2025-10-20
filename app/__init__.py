"""Application factory for the ROI dashboard."""

from __future__ import annotations

from flask import Flask

from festival_roi.formatting import format_currency as core_format_currency


def create_app() -> Flask:
    """Create and configure the Flask application instance."""
    app = Flask(__name__)
    app.config.from_mapping(
        SECRET_KEY="dev",  # replace for production deployments
        ROI_CURRENCY_SYMBOL="$",
    )

    def currency_filter(value: float, symbol: str | None = None) -> str:
        """Format numeric values as currency for templates."""
        currency_symbol = symbol or app.config["ROI_CURRENCY_SYMBOL"]
        return core_format_currency(value, currency_symbol)

    app.jinja_env.filters["currency"] = currency_filter

    # Deferred import so extensions can access the app instance.
    from .routes import dashboard_bp

    app.register_blueprint(dashboard_bp)

    return app
