import os
import itertools

import pandas as pd
import pytest

from datamorphx.converter import DataMorphX, WRITABLE
from datamorphx.exceptions import UnsupportedFormatError

FORMATS = sorted(WRITABLE)  # csv, feather, json, parquet, xlsx


def create_sample_csv(path):
    df = pd.DataFrame({"a":[1,2,3],"b":["x","y","z"]})
    df.to_csv(path, index=False)


def messy_frame():
    """Data that commonly breaks converters: nulls, unicode, floats, bools, dates."""
    df = pd.DataFrame(
        {
            "id": [1, 2, 3, 4],
            "name": ["Ünïcødé ✓", "comma, inside", 'quote "q"', None],
            "price": [0.1, 2.5, None, 1e-7],
            "active": [True, False, True, False],
            "created": ["2024-01-01", "2024-02-29", "2023-12-31", "2024-06-15"],
        }
    )
    import pyarrow as pa
    return pa.Table.from_pandas(df)


def test_csv_to_parquet(tmp_path):
    in_path = tmp_path / "sample.csv"
    out_path = tmp_path / "sample.parquet"
    create_sample_csv(str(in_path))
    dm = DataMorphX()
    meta = dm.convert(str(in_path), str(out_path), validate=True)
    assert meta["rows_in"] == 3
    assert meta["validated"] == True
    assert os.path.exists(str(out_path))


@pytest.mark.parametrize("src,dst", list(itertools.product(FORMATS, FORMATS)))
def test_round_trip_all_pairs(tmp_path, src, dst):
    dm = DataMorphX()
    src_path = tmp_path / f"in.{src}"
    dst_path = tmp_path / f"out_{dst}.{dst}"  # distinct name when src == dst
    dm.write(messy_frame(), str(src_path))

    meta = dm.convert(str(src_path), str(dst_path), validate=True)

    assert meta["rows_in"] == 4
    if not (src in ("jsonl", "ndjson") and dst == "json"):
        assert meta["validated"] is True, meta["validation_reason"]
    out = dm.read(str(dst_path))
    assert out.column_names == ["id", "name", "price", "active", "created"]
    assert out.num_rows == 4


def test_unicode_survives_csv_to_json(tmp_path):
    dm = DataMorphX()
    src, dst = tmp_path / "u.csv", tmp_path / "u.json"
    dm.write(messy_frame(), str(src))
    dm.convert(str(src), str(dst))
    out = dm.read(str(dst))
    assert out.column("name")[0].as_py() == "Ünïcødé ✓"


def test_header_only_csv(tmp_path):
    src, dst = tmp_path / "h.csv", tmp_path / "h.parquet"
    src.write_text("a,b\n", encoding="utf-8")
    meta = DataMorphX().convert(str(src), str(dst))
    assert meta["rows_in"] == 0
    assert meta["validated"] is True, meta["validation_reason"]


def test_missing_input_raises(tmp_path):
    with pytest.raises(FileNotFoundError):
        DataMorphX().convert(str(tmp_path / "nope.csv"), str(tmp_path / "out.json"))


def test_unsupported_input_format(tmp_path):
    src = tmp_path / "data.xml"
    src.write_text("hello", encoding="utf-8")
    with pytest.raises(UnsupportedFormatError):
        DataMorphX().convert(str(src), str(tmp_path / "out.csv"))

def test_inspect_and_ddl(tmp_path):
    dm = DataMorphX()
    src = tmp_path / "test.csv"
    dm.write(messy_frame(), str(src))
    
    info = dm.inspect(str(src))
    assert info["rows"] == 4
    assert info["columns"] == 5
    assert "id" in info["schema"]
    
    ddl = dm.to_ddl(str(src))
    assert "CREATE TABLE test" in ddl
    assert "id" in ddl

def test_query(tmp_path):
    dm = DataMorphX()
    src = tmp_path / "test.csv"
    dm.write(messy_frame(), str(src))
    
    res = dm.query("SELECT id, name FROM file1 WHERE id = 1", str(src))
    if hasattr(res, "read_all"):
        res = res.read_all()
    assert res.num_rows == 1
    assert res.column_names == ["id", "name"]


def test_unsupported_output_format(tmp_path):
    src = tmp_path / "in.csv"
    create_sample_csv(str(src))
    with pytest.raises(UnsupportedFormatError):
        DataMorphX().convert(str(src), str(tmp_path / "out.xls"))  # xls is read-only
