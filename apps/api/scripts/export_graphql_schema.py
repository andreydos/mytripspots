"""Write GraphQL SDL to schema.graphql for frontend codegen."""

import sys
from pathlib import Path

_API_ROOT = Path(__file__).resolve().parent.parent
if str(_API_ROOT) not in sys.path:
    sys.path.insert(0, str(_API_ROOT))

from strawberry.printer import print_schema  # noqa: E402

from app.graphql.schema import schema  # noqa: E402

OUT = Path(__file__).resolve().parent.parent / "schema.graphql"


def main() -> None:
    OUT.write_text(print_schema(schema), encoding="utf-8")
    print(f"Wrote {OUT}")


if __name__ == "__main__":
    main()
