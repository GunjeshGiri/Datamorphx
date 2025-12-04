from __future__ import annotations
import os
import pandas as pd
import orjson
from .utils import ext_of

def _read_for_validation(path: str) -> pd.DataFrame:
    ext = ext_of(path)
    if ext in ("csv",):
        return pd.read_csv(path)
    if ext in ("xlsx","xls"):
        return pd.read_excel(path)
    if ext == "json":
        with open(path, "rb") as f:
            d = orjson.loads(f.read())
        return pd.DataFrame(d)
    if ext in ("feather",):
        import pyarrow.feather as feather
        return feather.read_feather(path).to_pandas()
    if ext == "parquet":
        return pd.read_parquet(path)
    raise ValueError("Unsupported for validation")

def validate_equivalence(a: str, b: str) -> tuple[bool, str]:
    try:
        df_a = _read_for_validation(a)
        df_b = _read_for_validation(b)
    except Exception as e:
        return False, f"read_error:{e}"

    if len(df_a) != len(df_b):
        return False, f"row_count_mismatch {len(df_a)} != {len(df_b)}"


    if list(df_a.columns) != list(df_b.columns):
        return False, "columns_mismatch"


    N = min(1000, len(df_a))
    a_bytes = df_a.head(N).to_csv(index=False).encode("utf-8")
    b_bytes = df_b.head(N).to_csv(index=False).encode("utf-8")

    import hashlib
    if hashlib.sha256(a_bytes).hexdigest() != hashlib.sha256(b_bytes).hexdigest():
        return False, "sample_content_mismatch"
    return True, "ok"
