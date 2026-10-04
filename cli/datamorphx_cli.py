"""Backward-compatible shim. The CLI now lives in :mod:`datamorphx.cli`."""
import os
import sys

# Allow running as a plain script from the repo root: `python cli/datamorphx_cli.py ...`
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from datamorphx.cli import main  # noqa: E402

if __name__ == "__main__":
    sys.exit(main())
