import json
import os

import pandas as pd
import pytest
from fastapi.testclient import TestClient

import app.fastapi_app as api

class AuthedTestClient(TestClient):
    def request(self, *args, **kwargs):
        headers = kwargs.get("headers") or {}
        headers["X-API-Key"] = "test-key-123"
        kwargs["headers"] = headers
        return super().request(*args, **kwargs)

client = AuthedTestClient(api.app)
CSV_BYTES = b"a,b\n1,x\n2,y\n3,z\n"


def test_health_and_formats():
    assert client.get("/health").json() == {"status": "ok"}
    f = client.get("/formats").json()
    assert "parquet" in f["readable"] and "parquet" in f["writable"]
    assert "xls" in f["readable"] and "xls" not in f["writable"]


def test_convert_returns_file_and_meta(tmp_path):
    r = client.post(
        "/convert",
        data={"output_format": "parquet"},
        files={"file": ("my data.csv", CSV_BYTES, "text/csv")},
    )
    assert r.status_code == 200, r.text
    assert 'filename="my_data.parquet"' in r.headers["content-disposition"]
    meta = json.loads(r.headers["x-datamorphx-meta"])
    assert meta["rows_in"] == 3 and meta["validated"] is True
    assert "input_path" not in meta and "output_path" not in meta  # no server paths leaked

    out = tmp_path / "o.parquet"
    out.write_bytes(r.content)
    assert pd.read_parquet(out)["a"].tolist() == [1, 2, 3]


def test_validate_form_field_can_disable_validation():
    r = client.post(
        "/convert",
        data={"output_format": "json", "validate": "false"},
        files={"file": ("a.csv", CSV_BYTES)},
    )
    assert r.status_code == 200
    assert "validated" not in json.loads(r.headers["x-datamorphx-meta"])


def test_workdir_is_cleaned_up(monkeypatch):
    created = []
    real_mkdtemp = api.tempfile.mkdtemp

    def tracking_mkdtemp(*a, **kw):
        d = real_mkdtemp(*a, **kw)
        created.append(d)
        return d

    monkeypatch.setattr(api.tempfile, "mkdtemp", tracking_mkdtemp)
    ok = client.post("/convert", data={"output_format": "json"}, files={"file": ("a.csv", CSV_BYTES)})
    bad = client.post("/convert", data={"output_format": "json"}, files={"file": ("a.parquet", CSV_BYTES)})
    assert ok.status_code == 200 and bad.status_code == 415
    assert len(created) == 2
    assert not any(os.path.exists(d) for d in created)


def test_download_endpoint_removed():
    # The old /download?path= endpoint allowed reading arbitrary server files.
    assert client.get("/download", params={"path": __file__}).status_code == 404


def test_rejects_unknown_output_format():
    r = client.post("/convert", data={"output_format": "exe"}, files={"file": ("a.csv", CSV_BYTES)})
    assert r.status_code == 422


def test_rejects_unknown_input_extension():
    r = client.post("/convert", data={"output_format": "csv"}, files={"file": ("a.txt", CSV_BYTES)})
    assert r.status_code == 415


def test_rejects_content_extension_mismatch():
    r = client.post("/convert", data={"output_format": "csv"}, files={"file": ("fake.parquet", CSV_BYTES)})
    assert r.status_code == 415


def test_rejects_empty_file():
    r = client.post("/convert", data={"output_format": "csv"}, files={"file": ("a.csv", b"")})
    assert r.status_code == 400


def test_rejects_oversized_upload(monkeypatch):
    monkeypatch.setattr(api, "MAX_UPLOAD_BYTES", 10)
    r = client.post("/convert", data={"output_format": "json"}, files={"file": ("a.csv", CSV_BYTES)})
    assert r.status_code == 413


def test_bad_data_returns_400():
    r = client.post("/convert", data={"output_format": "csv"}, files={"file": ("a.json", b"[not json")})
    assert r.status_code == 400
