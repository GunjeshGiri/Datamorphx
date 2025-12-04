import os
from datamorphx.converter import DataMorphX
import pandas as pd
import tempfile

def create_sample_csv(path):
    df = pd.DataFrame({"a":[1,2,3],"b":["x","y","z"]})
    df.to_csv(path, index=False)

def test_csv_to_parquet(tmp_path):
    in_path = tmp_path / "sample.csv"
    out_path = tmp_path / "sample.parquet"
    create_sample_csv(str(in_path))
    dm = DataMorphX()
    meta = dm.convert(str(in_path), str(out_path), validate=True)
    assert meta["rows_in"] == 3
    assert meta["validated"] == True
    assert os.path.exists(str(out_path))
