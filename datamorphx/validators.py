from __future__ import annotations
import hashlib
import pyarrow as pa
import pandas as pd
import pyarrow.compute as pc
from .converter import DataMorphX

def _hash_table(table: pa.Table, limit: int = 1000) -> str:
    """Hash the first `limit` rows of an Arrow table for equivalence checking."""
    # slice the table
    if table.num_rows > limit:
        table = table.slice(0, limit)
    
    # Convert to pandas to handle date vs timestamp and string vs large_string uniformity
    df = table.to_pandas()
    
    h = hashlib.sha256()
    for col_name in sorted(df.columns):
        h.update(col_name.encode('utf-8'))
        col = df[col_name]
        
        # try to parse strings to datetime to unify
        if col.dtype == 'object' or pd.api.types.is_string_dtype(col):
            try:
                parsed = pd.to_datetime(col, errors='ignore')
                if pd.api.types.is_datetime64_any_dtype(parsed):
                    col = parsed
            except Exception:
                pass
                
        # normalize dates to strings without time if time is 00:00:00
        if pd.api.types.is_datetime64_any_dtype(col):
            col = col.dt.strftime('%Y-%m-%d')
            
        # normalize floats
        if pd.api.types.is_float_dtype(col):
            col = col.round(5)
            
        # convert column to string and fill na
        col_str = col.astype(str).fillna("").tolist()
        for val in col_str:
            h.update(val.encode('utf-8', errors='replace'))
            
    return h.hexdigest()

def validate_equivalence(a: str, b: str) -> tuple[bool, str]:
    dm = DataMorphX()
    try:
        data_a = dm.read(a)
        data_b = dm.read(b)
        
        if isinstance(data_a, pa.RecordBatchReader):
            data_a = data_a.read_all()
        if isinstance(data_b, pa.RecordBatchReader):
            data_b = data_b.read_all()
    except Exception as e:
        return False, f"read_error:{e}"

    if data_a.num_rows != data_b.num_rows:
        return False, f"row_count_mismatch {data_a.num_rows} != {data_b.num_rows}"

    if data_a.column_names != data_b.column_names:
        return False, "columns_mismatch"

    hash_a = _hash_table(data_a)
    hash_b = _hash_table(data_b)

    if hash_a != hash_b:
        return False, "sample_content_mismatch"
        
    return True, "ok"
