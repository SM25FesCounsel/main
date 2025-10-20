"""Application factory for the ROI dashboard."""

from __future__ import annotations

from flask import Flask


def create_app() -> Flask:
    """Create and configure the Flask application instance."""
    app = Flask(__name__)
    app.config.from_mapping(
        SECRET_KEY="dev",  # replace for production deployments
    )

    def currency_filter(value: float) -> str:
        """Format numeric values as currency for templates."""
        return f"${value:,.2f}"

    app.jinja_env.filters["currency"] = currency_filter

    # Deferred import so extensions can access the app instance.
    from .routes import dashboard_bp

    app.register_blueprint(dashboard_bp)

    return app
