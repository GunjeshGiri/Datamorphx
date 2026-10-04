"""Command-line interface: ``datamorphx INPUT OUTPUT [--no-validate]``."""
from __future__ import annotations

import argparse
import json
import sys

from .converter import DataMorphX, READABLE, WRITABLE
from .exceptions import UnsupportedFormatError


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(
        prog="datamorphx",
        description=(
            "Convert data files between formats. "
            f"Readable: {', '.join(sorted(READABLE))}. "
            f"Writable: {', '.join(sorted(WRITABLE))}."
        ),
    )
    parser.add_argument("input", help="Input file path")
    parser.add_argument("output", help="Output file path (format is taken from the extension)")
    parser.add_argument("--no-validate", dest="validate", action="store_false", help="Disable validation")
    args = parser.parse_args(argv)

    try:
        res = DataMorphX().convert(args.input, args.output, validate=args.validate)
    except (FileNotFoundError, UnsupportedFormatError, ValueError) as e:
        print(f"error: {e}", file=sys.stderr)
        return 2

    print(json.dumps(res, indent=2, default=str))
    if args.validate and not res.get("validated", True):
        print(f"warning: validation failed ({res.get('validation_reason')})", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
