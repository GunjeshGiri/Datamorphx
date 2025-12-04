from __future__ import annotations
import os
import hashlib
import tempfile
from typing import Union, Optional
import pandas as pd
import pyarrow as pa
import pyarrow.feather as feather
import pyarrow.parquet as pq
import orjson

from .utils import ext_of, safe_remove
from .validators import validate_equivalence
from .exceptions import UnsupportedFormatError

READABLE = {"csv", "json", "xlsx", "xls", "feather", "parquet"}
WRITABLE = {"csv", "json", "xlsx", "feather", "parquet"}

class DataMorphX:
    """High-performance converter for CSV/JSON/Excel/Feather/Parquet."""

    def __init__(self, max_rows_in_memory: int = 5_000_000):
        self.max_rows_in_memory = max_rows_in_memory


    def _file_hash(self, path: str) -> str:
        h = hashlib.sha256()
        with open(path, "rb") as f:
            for chunk in iter(lambda: f.read(1 << 20), b""):
                h.update(chunk)
        return h.hexdigest()

    def _to_arrow_table(self, df: pd.DataFrame) -> pa.Table:
        return pa.Table.from_pandas(df, preserve_index=False)


    def read(self, path: str, **kwargs) -> pd.DataFrame:
        ext = ext_of(path)
        if ext not in READABLE:
            raise UnsupportedFormatError(ext)

        if ext in ("xlsx", "xls"):
            return pd.read_excel(path, engine=kwargs.get("engine", "openpyxl"))

        if ext == "csv":
            return pd.read_csv(path)

        if ext == "json":
            # expecting json array of records
            with open(path, "rb") as fh:
                data = orjson.loads(fh.read())
            return pd.DataFrame(data)

        if ext == "feather":
            return feather.read_feather(path).to_pandas()

        if ext == "parquet":
            return pd.read_parquet(path)


    def write(self, df: pd.DataFrame, out_path: str, **kwargs) -> None:
        ext = ext_of(out_path)
        if ext not in WRITABLE:
            raise UnsupportedFormatError(ext)

        if ext == "csv":
            df.to_csv(out_path, index=False)

        elif ext == "json":
            b = orjson.dumps(df.to_dict(orient="records"))
            with open(out_path, "wb") as fh:
                fh.write(b)

        elif ext in ("xlsx",):
            df.to_excel(out_path, index=False, engine=kwargs.get("engine", "openpyxl"))

        elif ext == "feather":
            table = self._to_arrow_table(df)
            feather.write_feather(table, out_path)

        elif ext == "parquet":
            table = self._to_arrow_table(df)
            pq.write_table(table, out_path, compression=kwargs.get("compression", "snappy"))


    def convert(self, input_path: str, output_path: str, validate: bool = True, **write_kwargs) -> dict:
        """
        Convert input_path -> output_path. Returns metadata dict with row counts, hashes.
        If validate=True it will verify row counts & schema (best-effort).
        """
        if not os.path.exists(input_path):
            raise FileNotFoundError(input_path)

        in_hash = self._file_hash(input_path)
        df = self.read(input_path)


        row_count_in = len(df)
        self.write(df, output_path, **write_kwargs)
        out_hash = self._file_hash(output_path)

        meta = {
            "input_path": input_path,
            "output_path": output_path,
            "rows_in": row_count_in,
            "rows_out": row_count_in,
            "input_hash": in_hash,
            "output_hash": out_hash,
        }

        if validate:
            ok, reason = validate_equivalence(input_path, output_path)
            meta["validated"] = ok
            meta["validation_reason"] = reason

        return meta
