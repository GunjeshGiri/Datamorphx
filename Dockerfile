FROM python:3.11-slim

ENV PYTHONUNBUFFERED=1

WORKDIR /app
COPY pyproject_backup.toml /app/
RUN apt-get update && apt-get install -y gcc build-essential libpq-dev && rm -rf /var/lib/apt/lists/*
RUN pip install --upgrade pip
RUN pip install -e .

EXPOSE 8501 8000

CMD ["uvicorn", "app.fastapi_app:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
