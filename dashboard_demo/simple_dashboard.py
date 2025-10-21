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


def main() -> None:
    """Entrypoint for the dashboard demo."""
    rows = load_data()
    print(f"Loaded {len(rows)} records for the dashboard demo.")


if __name__ == "__main__":
    main()
