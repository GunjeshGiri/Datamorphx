from __future__ import annotations
import typing
import pyarrow as pa
import pyarrow.parquet as pq
import pyarrow.csv as pacsv
import pyarrow.json as pajson
import pyarrow.feather as feather
import orjson
import pandas as pd
from typing import Any

from .formats import Format, register_format

@register_format
class CSVFormat(Format):
    name = "csv"
    extensions = ["csv", "tsv", "txt"]

    @classmethod
    def read_arrow(cls, path: str, options: dict[str, Any]) -> pa.Table:
        return pacsv.read_csv(path)

    @classmethod
    def write_arrow(cls, data: pa.RecordBatchReader | pa.Table, path: str, options: dict[str, Any]) -> None:
        if isinstance(data, pa.Table):
            pacsv.write_csv(data, path)
        else:
            with pacsv.CSVWriter(path, data.schema) as writer:
                for batch in data:
                    writer.write_batch(batch)

    @classmethod
    def sniff(cls, head: bytes) -> bool:
        if b"\x00" in head:
            return False
        text = head.lstrip(b"\xef\xbb\xbf").lstrip()
        if not text:
            return False
        if text[:1] not in (b"[", b"{"):
            return True
        return False


@register_format
class JSONFormat(Format):
    name = "json"
    extensions = ["json"]

    @classmethod
    def read_arrow(cls, path: str, options: dict[str, Any]) -> pa.Table:
        # reading json array of objects
        with open(path, "rb") as fh:
            data = orjson.loads(fh.read())
        return pa.Table.from_pylist(data)

    @classmethod
    def write_arrow(cls, data: pa.RecordBatchReader | pa.Table, path: str, options: dict[str, Any]) -> None:
        if isinstance(data, pa.RecordBatchReader):
            data = data.read_all()
        # Convert to list of dicts
        b = orjson.dumps(data.to_pylist())
        with open(path, "wb") as fh:
            fh.write(b)

    @classmethod
    def sniff(cls, head: bytes) -> bool:
        if b"\x00" in head:
            return False
        text = head.lstrip(b"\xef\xbb\xbf").lstrip()
        if text[:1] in (b"[",):
            return True
        return False


@register_format
class JSONLFormat(Format):
    name = "jsonl"
    extensions = ["jsonl", "ndjson"]

    @classmethod
    def read_arrow(cls, path: str, options: dict[str, Any]) -> pa.Table:
        # read newline delimited json
        return pajson.read_json(path)

    @classmethod
    def write_arrow(cls, data: pa.RecordBatchReader | pa.Table, path: str, options: dict[str, Any]) -> None:
        if isinstance(data, pa.RecordBatchReader):
            data = data.read_all()
        # Convert to list of dicts, write ndjson
        records = data.to_pylist()
        with open(path, "wb") as fh:
            for r in records:
                fh.write(orjson.dumps(r))
                fh.write(b"\n")

    @classmethod
    def sniff(cls, head: bytes) -> bool:
        if b"\x00" in head:
            return False
        text = head.lstrip(b"\xef\xbb\xbf").lstrip()
        if text[:1] == b"{":
            # Might be JSON object or JSONL. If there is a newline and then another `{`, it's JSONL.
            if b"\n{" in text or b"\r\n{" in text:
                return True
        return False


@register_format
class ParquetFormat(Format):
    name = "parquet"
    extensions = ["parquet", "pq"]

    @classmethod
    def read_arrow(cls, path: str, options: dict[str, Any]) -> pa.Table:
        return pq.read_table(path)

    @classmethod
    def write_arrow(cls, data: pa.RecordBatchReader | pa.Table, path: str, options: dict[str, Any]) -> None:
        compression = options.get("compression", "snappy")
        if isinstance(data, pa.Table):
            pq.write_table(data, path, compression=compression)
        else:
            with pq.ParquetWriter(path, data.schema, compression=compression) as writer:
                for batch in data:
                    writer.write_batch(batch)

    @classmethod
    def sniff(cls, head: bytes) -> bool:
        return head.startswith(b"PAR1")


@register_format
class FeatherFormat(Format):
    name = "feather"
    extensions = ["feather", "arrow"]

    @classmethod
    def read_arrow(cls, path: str, options: dict[str, Any]) -> pa.Table:
        # PyArrow IPC API can read streams or files, feather v1/v2
        return feather.read_table(path)

    @classmethod
    def write_arrow(cls, data: pa.RecordBatchReader | pa.Table, path: str, options: dict[str, Any]) -> None:
        if isinstance(data, pa.RecordBatchReader):
            data = data.read_all()
        feather.write_feather(data, path)

    @classmethod
    def sniff(cls, head: bytes) -> bool:
        return head.startswith(b"ARROW1") or head.startswith(b"FEA1")


@register_format
class ExcelFormat(Format):
    name = "xlsx"
    extensions = ["xlsx", "xls"]
    writable_extensions = ["xlsx"]
    
    @classmethod
    def read_arrow(cls, path: str, options: dict[str, Any]) -> pa.Table:
        df = pd.read_excel(path, engine=options.get("engine"))
        return pa.Table.from_pandas(df, preserve_index=False)

    @classmethod
    def write_arrow(cls, data: pa.RecordBatchReader | pa.Table, path: str, options: dict[str, Any]) -> None:
        if path.lower().endswith(".xls"):
            from .exceptions import UnsupportedFormatError
            raise UnsupportedFormatError("Writing to .xls is not supported. Use .xlsx")
        if isinstance(data, pa.RecordBatchReader):
            data = data.read_all()
        df = data.to_pandas()
        df.to_excel(path, index=False, engine=options.get("engine", "openpyxl"))

    @classmethod
    def sniff(cls, head: bytes) -> bool:
        return head.startswith(b"PK\x03\x04") or head.startswith(b"\xD0\xCF\x11\xE0\xA1\xB1\x1A\xE1")
