import json

import pandas as pd
import pytest

from datamorphx.cli import main
from datamorphx.utils import content_matches_extension, sniff_format


# ---------- CLI ----------

def test_cli_success(tmp_path, capsys):
    src, dst = tmp_path / "in.csv", tmp_path / "out.json"
    src.write_text("a,b\n1,x\n", encoding="utf-8")
    assert main([str(src), str(dst)]) == 0
    out = json.loads(capsys.readouterr().out)
    assert out["rows_in"] == 1 and out["validated"] is True
    assert dst.exists()


def test_cli_missing_file_exit_code(tmp_path, capsys):
    assert main([str(tmp_path / "nope.csv"), str(tmp_path / "o.json")]) == 2
    assert "error:" in capsys.readouterr().err


def test_cli_unsupported_format_exit_code(tmp_path):
    src = tmp_path / "in.csv"
    src.write_text("a\n1\n", encoding="utf-8")
    assert main([str(src), str(tmp_path / "o.xml")]) == 2


# ---------- Sniffing ----------

@pytest.fixture
def frame():
    return pd.DataFrame({"a": [1, 2], "b": ["x", "y"]})


@pytest.mark.parametrize(
    "ext,writer",
    [
        ("parquet", lambda df, p: df.to_parquet(p)),
        ("feather", lambda df, p: df.to_feather(p)),
        ("xlsx", lambda df, p: df.to_excel(p, index=False)),
        ("csv", lambda df, p: df.to_csv(p, index=False)),
        ("json", lambda df, p: df.to_json(p, orient="records")),
    ],
)
def test_sniff_detects_real_format(tmp_path, frame, ext, writer):
    p = tmp_path / f"f.{ext}"
    writer(frame, p)
    assert sniff_format(str(p)) == ext
    assert content_matches_extension(str(p), ext)


def test_sniff_handles_bom_json(tmp_path):
    p = tmp_path / "bom.json"
    p.write_bytes(b"\xef\xbb\xbf  [{\"a\": 1}]")
    assert sniff_format(str(p)) == "json"


def test_sniff_rejects_unknown_binary(tmp_path):
    p = tmp_path / "x.csv"
    p.write_bytes(b"\x7fELF\x00\x01\x02")
    assert sniff_format(str(p)) is None
    assert not content_matches_extension(str(p), "csv")


def test_csv_named_parquet_is_rejected(tmp_path):
    p = tmp_path / "fake.parquet"
    p.write_text("a,b\n1,2\n", encoding="utf-8")
    assert not content_matches_extension(str(p), "parquet")
