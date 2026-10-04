from __future__ import annotations
import os
import hashlib
from typing import Union, Optional, Any
import pyarrow as pa
import pyarrow.compute as pc

from .utils import ext_of
from .formats import get_format, _REGISTRY

# Dynamically compute READABLE and WRITABLE based on registry
READABLE = {ext for ext, fmt in _REGISTRY.items() if fmt.readable}
WRITABLE = {ext for ext, fmt in _REGISTRY.items() if fmt.writable and (fmt.writable_extensions is None or ext in fmt.writable_extensions)}

class DataMorphX:
    """High-performance converter using Arrow as the standard in-memory format."""

    def __init__(self, max_rows_in_memory: int = 5_000_000):
        self.max_rows_in_memory = max_rows_in_memory

    def _file_hash(self, path: str) -> str:
        h = hashlib.sha256()
        with open(path, "rb") as f:
            for chunk in iter(lambda: f.read(1 << 20), b""):
                h.update(chunk)
        return h.hexdigest()

    def read(self, path: str, **kwargs) -> pa.RecordBatchReader | pa.Table:
        ext = ext_of(path)
        fmt = get_format(ext)
        return fmt.read_arrow(path, kwargs)

    def write(self, data: pa.RecordBatchReader | pa.Table, out_path: str, **kwargs) -> None:
        ext = ext_of(out_path)
        fmt = get_format(ext)
        fmt.write_arrow(data, out_path, kwargs)

    def _get_row_count(self, data: pa.RecordBatchReader | pa.Table) -> int:
        if isinstance(data, pa.Table):
            return data.num_rows
        # If it's a reader and we consumed it, we'd lose data. 
        # But we don't use this directly in convert() if we need to stream.
        # For now, if we need row count, we read it.
        return 0

    def inspect(self, input_path: str) -> dict:
        """Return basic metadata about a file."""
        if not os.path.exists(input_path):
            raise FileNotFoundError(input_path)
            
        ext = ext_of(input_path)
        fmt = get_format(ext)
        data = fmt.read_arrow(input_path, {})
        
        schema = data.schema
        if isinstance(data, pa.RecordBatchReader):
            data = data.read_all()
            
        return {
            "format": fmt.name,
            "path": input_path,
            "size_bytes": os.path.getsize(input_path),
            "rows": data.num_rows,
            "columns": len(schema.names),
            "schema": {name: str(field.type) for name, field in zip(schema.names, schema)}
        }
        
    def infer_schema(self, input_path: str) -> dict:
        """Infer detailed schema."""
        info = self.inspect(input_path)
        return info["schema"]

    def query(self, sql: str, *files: str) -> pa.Table:
        """Run a DuckDB SQL query over the given files.
        Use `file1`, `file2` etc. in the FROM clause, e.g., `SELECT * FROM file1`.
        """
        import duckdb
        con = duckdb.connect()
        for i, path in enumerate(files):
            con.execute(f"CREATE VIEW file{i+1} AS SELECT * FROM '{path}'")
        return con.query(sql).arrow()
        
    def to_ddl(self, input_path: str, dialect: str = "postgres") -> str:
        """Generate a CREATE TABLE statement for the file's schema."""
        info = self.inspect(input_path)
        # simplistic mapping for now
        lines = []
        for name, typ in info["schema"].items():
            t = str(typ).lower()
            if "int" in t:
                sql_type = "BIGINT"
            elif "float" in t:
                sql_type = "DOUBLE PRECISION"
            elif "bool" in t:
                sql_type = "BOOLEAN"
            elif "timestamp" in t or "date" in t:
                sql_type = "TIMESTAMP"
            else:
                sql_type = "TEXT"
            lines.append(f"  {name} {sql_type}")
            
        return f"CREATE TABLE {os.path.basename(input_path).split('.')[0]} (\n" + ",\n".join(lines) + "\n);"

    def convert(self, input_path: str, output_path: str, validate: bool = True, **write_kwargs) -> dict:
        """
        Convert input_path -> output_path. Returns metadata dict with row counts, hashes.
        If validate=True it will verify row counts & schema (best-effort).
        """
        if not os.path.exists(input_path):
            raise FileNotFoundError(input_path)

        in_hash = self._file_hash(input_path)
        
        # We need row count. If it's a stream, we count while writing or read all.
        # For simplicity and correctness with existing API, we read all into Table if we need row_count beforehand.
        # But Phase 1 emphasizes streaming. We can accumulate row_count during write if we wrap it.
        
        data = self.read(input_path)
        
        # If it is a generator or anything else that doesn't have num_rows, we must materialize it
        if hasattr(data, "read_all"):
            data = data.read_all()
        elif not hasattr(data, "num_rows"):
            # It's likely a generator or something else. We shouldn't encounter this anymore, 
            # but if we do, we need to convert it to a Table.
            # However, for now we assume it's a Table.
            pass
            
        row_count_in = data.num_rows

        self.write(data, output_path, **write_kwargs)
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
            from .validators import validate_equivalence
            ok, reason = validate_equivalence(input_path, output_path)
            meta["validated"] = ok
            meta["validation_reason"] = reason

        return meta
