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
Convert **any → any** among CSV, JSON, Excel, Feather, Parquet.

### ⚡ High-Performance Engine  
Uses PyArrow columnar engine + orjson for blazing-fast conversion.

### 🔍 Validation Layer  
Ensures:
- Row/column consistency  
- Sample data hash match  
- Type inference consistency  

### 🧰 Multiple Interfaces  
- **API** → FastAPI  
- **UI** →Streamlit  
- **CLI** → `datamorphx input output`  
- **Python Package** → `pip install -e .`

### 🐳 Docker & Compose Ready  
Full local stack with API + UI.

---

# 📂 Project Structure
datamorphx/

=>├── src/

│   └── datamorphx/

│       ├── __init__.py

│       ├── converter.py

│       ├── utils.py

│       ├── validators.py

│       └── exceptions.py


=>├── app/

│   ├── fastapi_app.py

│   └── streamlit_app.py

=>├── cli/

│   └── datamorphx_cli.py

├── tests/

│   ├── test_converter.py

│   └── sample_data/

│ _______    └── sample.csv
├── docker/

│   ├── Dockerfile        

│   ├── docker-compose.yml

│   └── entrypoint.sh

│
├── .github/

│   └── workflows/

│ ________  └── tests.yml 

├── pyproject_backup.toml

├── setup.cfg    

├── setup.py    

├── requirements.txt

├── LICENSE

├── README.md

└── run_all_tests.bat


---
