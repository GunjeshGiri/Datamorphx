import os
import json
import random
import datetime
from pathlib import Path
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq

SANDBOX_DIR = Path("test_sandbox").resolve()
SANDBOX_DIR.mkdir(parents=True, exist_ok=True)

print(f"[*] Generating edge-case test suite in: {SANDBOX_DIR}")

# 1. Dirty Multiline & Escaped CSV
csv_content = (
    'id,client_name,notes,amount,transaction_date,flag\n'
    '1,"Client Alpha","Normal text",1500.50,2026-01-15,true\n'
    '2,"Beta, Inc.","Text with \"\"quotes\"\" and\nembedded newlines\nacross 3 lines",24000.00,2026-02-01,false\n'
    '3,"Green ₹ Solutions","Unicode & currency symbols: £100, €250, ¥5000",99999.99,2026-03-10,true\n'
    '4,"Emoji 🚀 Corp","Supports 📊 and ⚡ properly",-450.00,2026-04-12,false\n'
    '5,"Nulls & Spaces","   Trailing spaces   ",NULL,2026-05-20,true\n'
    '6,"Special Characters","Tab\tdelimiter; inside, commas & semicolons;",123.45,2026-06-01,false\n'
)
with open(SANDBOX_DIR / "01_dirty_text_multiline.csv", "w", encoding="utf-8") as f:
    f.write(csv_content)

# 2. Nested Hierarchical JSON
nested_json = [
    {
        "event_id": f"EVT_{i:04d}",
        "user": {
            "uid": f"USR_{i % 10}",
            "meta": {"is_vip": i % 3 == 0, "tags": ["admin", "dev"] if i % 2 == 0 else ["viewer"]}
        },
        "metrics": {"score": round(random.random() * 100, 2), "latencies": [12, 18, 45]},
        "status": "COMPLETED" if i % 2 == 0 else None
    }
    for i in range(1, 101)
]
with open(SANDBOX_DIR / "02_nested_hierarchical.json", "w", encoding="utf-8") as f:
    json.dump(nested_json, f, indent=2)

# 3. High Volume Performance (200,000 Rows Parquet)
print("[*] Generating 200,000 rows Parquet file...")
n_rows = 200_000
df_perf = pd.DataFrame({
    "id": range(1, n_rows + 1),
    "user_id": [f"user_{random.randint(100, 999)}" for _ in range(n_rows)],
    "amount": [round(random.uniform(5.0, 5000.0), 2) for _ in range(n_rows)],
    "timestamp": [datetime.datetime(2026, 1, 1) + datetime.timedelta(seconds=i*30) for i in range(n_rows)],
    "is_settled": [random.choice([True, False, None]) for _ in range(n_rows)],
    "category": [random.choice(["Finance", "Logistics", "Marketing", "SaaS"]) for _ in range(n_rows)]
})
table = pa.Table.from_pandas(df_perf)
pq.write_table(table, SANDBOX_DIR / "03_high_volume_200k.parquet", compression="snappy")

# 4. Extreme Wide & Sparse CSV (120 Columns)
print("[*] Generating 120-column sparse CSV...")
n_cols = 120
sparse_rows = 200
sparse_data = {"record_id": [f"REC_{i}" for i in range(sparse_rows)]}
for c in range(1, n_cols):
    col_name = f"attribute_col_{c:03d}"
    sparse_data[col_name] = [
        random.choice([None, None, None, f"val_{c}_{r}", "$1,500.00" if c % 5 == 0 else "N/A"])
        for r in range(sparse_rows)
    ]
pd.DataFrame(sparse_data).to_csv(SANDBOX_DIR / "04_extreme_wide_sparse.csv", index=False)

# 5. Financial Multi-Tab Excel Workbook
print("[*] Generating Multi-Tab Excel with raw formatting...")
with pd.ExcelWriter(SANDBOX_DIR / "05_financial_ragged.xlsx", engine="openpyxl") as writer:
    df_raw = pd.DataFrame({
        "Unquoted Header With Spaces": ["Gross Revenue", "Operating Expenses", "Net Margin"],
        "Q1 2026 (£'K)": ["1,500", "850", "650"],
        "Q2 2026 (£'K)": ["2,100", "1,100", "1,000"],
        "Variance %": ["+40.0%", "+29.4%", "+53.8%"]
    })
    df_raw.to_excel(writer, sheet_name="Income Statement", index=False)
    pd.DataFrame({"Legend": ["Draft", "Audited"], "Code": [0, 1]}).to_excel(writer, sheet_name="Config", index=False)

print("[SUCCESS] All 5 stress files created successfully inside ./test_sandbox/")
