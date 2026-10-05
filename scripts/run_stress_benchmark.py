import time
import duckdb
from pathlib import Path
import pandas as pd

SANDBOX_DIR = Path("test_sandbox").resolve()
OUTPUT_DIR = SANDBOX_DIR / "outputs"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

test_files = [
    ("Dirty Multiline CSV", SANDBOX_DIR / "01_dirty_text_multiline.csv"),
    ("Nested JSON", SANDBOX_DIR / "02_nested_hierarchical.json"),
    ("200k Row Parquet", SANDBOX_DIR / "03_high_volume_200k.parquet"),
    ("Wide Sparse CSV", SANDBOX_DIR / "04_extreme_wide_sparse.csv"),
    ("Financial Ragged Excel", SANDBOX_DIR / "05_financial_ragged.xlsx"),
]

print("=" * 65)
print("  DATAMORPHX ENGINE STRESS BENCHMARK RUNNER")
print("=" * 65)

con = duckdb.connect(database=":memory:")

for test_name, file_path in test_files:
    if not file_path.exists():
        print(f"[!] Skipping {test_name}: File not found. Run generator first.")
        continue

    print(f"\n[+] Testing: {test_name} ({file_path.name})")
    start = time.perf_counter()

    try:
        # Step A: Ingest into in-memory DuckDB
        if file_path.suffix == ".csv":
            # Using forward slashes for DuckDB SQL path compatibility on Windows
            clean_path = str(file_path).replace("\\", "/")
            con.execute(f"CREATE OR REPLACE TABLE test_table AS SELECT * FROM read_csv_auto('{clean_path}', sample_size=-1);")
        elif file_path.suffix == ".json":
            clean_path = str(file_path).replace("\\", "/")
            con.execute(f"CREATE OR REPLACE TABLE test_table AS SELECT * FROM read_json_auto('{clean_path}');")
        elif file_path.suffix == ".parquet":
            clean_path = str(file_path).replace("\\", "/")
            con.execute(f"CREATE OR REPLACE TABLE test_table AS SELECT * FROM read_parquet('{clean_path}');")
        elif file_path.suffix == ".xlsx":
            df_xl = pd.read_excel(file_path, sheet_name=0)
            con.register("df_xl", df_xl)
            con.execute("CREATE OR REPLACE TABLE test_table AS SELECT * FROM df_xl;")

        row_count = con.execute("SELECT COUNT(*) FROM test_table;").fetchone()[0]
        col_count = len(con.execute("DESCRIBE test_table;").fetchall())
        ingest_time = (time.perf_counter() - start) * 1000

        print(f"    - Ingestion: SUCCESS | {row_count:,} rows | {col_count} columns | {ingest_time:.2f}ms")

        # Step B: Export to Parquet
        parquet_out = OUTPUT_DIR / f"{file_path.stem}.stress_output.parquet"
        clean_parquet_out = str(parquet_out).replace("\\", "/")
        con.execute(f"COPY test_table TO '{clean_parquet_out}' (FORMAT PARQUET, COMPRESSION ZSTD);")
        
        # Verify Parquet Magic Bytes
        with open(parquet_out, "rb") as f:
            header = f.read(4)
            assert header == b"PAR1", "Parquet header invalid!"

        print(f"    - Parquet Export: SUCCESS | File size: {parquet_out.stat().st_size / 1024:.2f} KB | Header: PAR1 Verified")

        # Step C: Export to JSON
        json_out = OUTPUT_DIR / f"{file_path.stem}.stress_output.json"
        clean_json_out = str(json_out).replace("\\", "/")
        con.execute(f"COPY test_table TO '{clean_json_out}' (FORMAT JSON, ARRAY true);")
        print(f"    - JSON Export: SUCCESS | File size: {json_out.stat().st_size / 1024:.2f} KB")

    except Exception as e:
        print(f"    [FAIL] Error occurred: {str(e)}")

print("\n" + "=" * 65)
print("Benchmark completed. All artifacts isolated in test_sandbox/outputs/")
print("=" * 65)
