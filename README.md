# 🚀 DataMorphX

[![Python](https://img.shields.io/badge/Python-3.11+-blue)]()
[![License: MIT](https://img.shields.io/badge/License-MIT-green)]()
[![Build](https://img.shields.io/badge/build-passing-brightgreen)]()
[![Tests](https://img.shields.io/badge/tests-pytest-success)]()
[![Docker](https://img.shields.io/badge/Docker-ready-2496ED?logo=docker&logoColor=white)]()

**DataMorphX** is a **high-performance, multi-format data conversion system** supporting:

- CSV  
- JSON  
- Excel (`.xlsx`)  
- Feather  
- Parquet  
- (Extensible to Avro, ORC, Arrow IPC)

Built with **PyArrow**, **pandas**, **orjson**, and deployable as:

✔ Python Package  
✔ CLI Tool  
✔ Streamlit Web UI  
✔ FastAPI Service  
✔ Docker Image  
✔ Docker Compose Stack  
✔ Automated Test Suite  

Designed for **speed**, **accuracy**, and **real-world deployment**.

---

# 📌 Features

### 🔁 Multi-format Conversion  
Convert **any → any** among CSV, JSON, Excel, Feather, Parquet (`.xls` is read-only).

### ⚡ High-Performance Engine  
Uses PyArrow columnar engine + orjson for blazing-fast conversion.

### 🔍 Validation Layer  
After conversion, the output is read back and checked for:
- Row count match  
- Column names and order match  
- Content hash match on a sample (first 1,000 rows)  

### 🧰 Multiple Interfaces  
- **API** → FastAPI  
- **UI** → Streamlit  
- **CLI** → `datamorphx input output`  
- **Python Package** → `pip install -e .`

### 🐳 Docker & Compose Ready  
Full local stack with API + UI.

---

# ⚙️ Installation

```bash
pip install -e .              # core library + CLI only
pip install -e ".[api]"       # + FastAPI service
pip install -e ".[ui]"        # + Streamlit UI
pip install -e ".[api,ui,dev]"  # everything, incl. tests  (same as: pip install -r requirements.txt)
```

# ▶️ Usage

**CLI**
```bash
datamorphx data.csv data.parquet            # prints a JSON report
datamorphx data.parquet data.xlsx --no-validate
```
Exit codes: `0` success · `1` validation failed · `2` bad input (missing file / unsupported format).

**Python**
```python
from datamorphx.converter import DataMorphX
meta = DataMorphX().convert("data.csv", "data.parquet", validate=True)
```

**API**
```bash
uvicorn app.fastapi_app:app --port 8000
curl -H "X-API-Key: $DATAMORPHX_API_KEY" -F "file=@data.csv" -F "output_format=parquet" http://localhost:8000/convert -o data.parquet -D -
```
| Endpoint | Description |
| :--- | :--- |
| `POST /convert` | Form fields `file`, `output_format`, optional `validate` (default `true`). Returns the converted file; the conversion report is in the `X-DataMorphX-Meta` response header (JSON). |
| `GET /formats` | Supported input / output formats |
| `GET /health` | Liveness check |

Requests must send an `X-API-Key` header matching one of the comma-separated keys in `DATAMORPHX_API_KEYS` (the API rejects everything if none are set). Uploads are limited to `DATAMORPHX_MAX_UPLOAD_MB` (default `50`) and are checked by content, not just extension. Each request uses a private temp directory that is deleted after the response.

**UI**
```bash
streamlit run app/streamlit_app.py
```

**Docker**
```bash
docker compose up --build    # API on :8000, UI on :8501
```

**Tests**
```bash
pytest -q
```

---

# 📂 Project Structure
```
Datamorphx/
├── datamorphx/              # core library
│   ├── __init__.py
│   ├── converter.py         # DataMorphX: read / write / convert
│   ├── validators.py        # post-conversion equivalence checks
│   ├── utils.py             # extension + content sniffing helpers
│   ├── exceptions.py
│   └── cli.py               # `datamorphx` command
├── app/
│   ├── fastapi_app.py       # REST API
│   └── streamlit_app.py     # web UI
├── cli/
│   └── datamorphx_cli.py    # legacy shim -> datamorphx.cli
├── tests/
│   ├── test_converter.py
│   ├── test_api.py
│   ├── test_cli_and_utils.py
│   └── sample_data/sample.csv
├── .github/workflows/ci.yml
├── Dockerfile
├── docker-compose.yml
├── pyproject.toml           # packaging + dependencies (single source of truth)
├── requirements.txt         # dev convenience: -e .[api,ui,dev]
├── run_all_tests.bat
├── LICENSE
└── README.md
```

---
