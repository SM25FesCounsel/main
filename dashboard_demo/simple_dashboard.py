"""Simple terminal dashboard example script."""

SALES_DATA: list[dict[str, object]] = [
    {"month": "Jan", "channel": "Online", "revenue": 42000, "orders": 350},
    {"month": "Jan", "channel": "Retail", "revenue": 38500, "orders": 290},
    {"month": "Feb", "channel": "Online", "revenue": 46000, "orders": 375},
    {"month": "Feb", "channel": "Retail", "revenue": 40100, "orders": 305},
    {"month": "Mar", "channel": "Online", "revenue": 48800, "orders": 390},
    {"month": "Mar", "channel": "Retail", "revenue": 42200, "orders": 312},
]


def load_data() -> list[dict[str, object]]:
    """Return the sample sales data used across the dashboard demo."""
    return SALES_DATA.copy()


def calculate_kpis(rows: list[dict[str, object]]) -> dict[str, object]:
    """Compute headline metrics from the provided dataset."""
    revenue_by_channel: dict[str, float] = {}
    revenue_by_month: dict[str, float] = {}
    total_revenue = 0.0
    total_orders = 0

    for row in rows:
        revenue = float(row["revenue"])
        orders = int(row["orders"])
        channel = str(row["channel"])
        month = str(row["month"])

        total_revenue += revenue
        total_orders += orders
        revenue_by_channel[channel] = revenue_by_channel.get(channel, 0.0) + revenue
        revenue_by_month[month] = revenue_by_month.get(month, 0.0) + revenue

    average_order_value = total_revenue / total_orders if total_orders else 0.0
    top_channel = max(revenue_by_channel, key=revenue_by_channel.get) if revenue_by_channel else "N/A"
    top_month = max(revenue_by_month, key=revenue_by_month.get) if revenue_by_month else "N/A"

    return {
        "total_revenue": total_revenue,
        "total_orders": total_orders,
        "average_order_value": average_order_value,
        "top_channel": top_channel,
        "top_month": top_month,
    }


def format_currency(value: float) -> str:
    """Return a USD-style currency string."""
    return f"${value:,.0f}"


def format_number(value: int) -> str:
    """Return a human-friendly integer string with separators."""
    return f"{value:,}"


def render_kpi_section(kpis: dict[str, object]) -> str:
    """Build a human-readable representation of the summary metrics."""
    return "\n".join(
        [
            "=== KPI Overview ===",
            f"Total Revenue        : {format_currency(float(kpis['total_revenue']))}",
            f"Total Orders         : {format_number(int(kpis['total_orders']))}",
            f"Average Order Value  : {format_currency(float(kpis['average_order_value']))}",
            f"Top Channel          : {kpis['top_channel']}",
            f"Top Month            : {kpis['top_month']}",
        ]
    )


def aggregate_revenue(rows: list[dict[str, object]], key: str) -> list[tuple[str, float]]:
    """Aggregate revenue totals grouped by the provided column."""
    totals: dict[str, float] = {}
    order: list[str] = []

    for row in rows:
        label = str(row[key])
        value = float(row["revenue"])

        if label not in totals:
            totals[label] = 0.0
            order.append(label)

        totals[label] += value

    return [(label, totals[label]) for label in order]


def render_bar_chart(series: list[tuple[str, float]], title: str) -> str:
    """Render a simple ASCII bar chart from the provided series data."""
    if not series:
        return f"{title}\n(no data)"

    max_value = max(value for _, value in series)
    scale = 40 / max_value if max_value else 1

    lines = [title]
    for label, value in series:
        bar_length = max(1, int(value * scale)) if max_value else 0
        bar = "█" * bar_length
        lines.append(f"{label:>5} | {bar:<40} {format_currency(value)}")

    return "\n".join(lines)


def main() -> None:
    """Entrypoint for the dashboard demo."""
    rows = load_data()
    kpis = calculate_kpis(rows)
    print(f"Loaded {len(rows)} records for the dashboard demo.")
    print(render_kpi_section(kpis))
    print()
    monthly_revenue = aggregate_revenue(rows, "month")
    print(render_bar_chart(monthly_revenue, "Revenue by Month"))


if __name__ == "__main__":
    main()
