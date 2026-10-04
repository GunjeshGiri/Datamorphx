import streamlit as st
from datamorphx.converter import DataMorphX
import tempfile, os, shutil

st.set_page_config(page_title="DataMorphX", layout="centered")

st.title("DataMorphX — Convert CSV/Excel/JSON/Feather/Parquet")

uploaded = st.file_uploader("Upload a file", type=["csv","json","xlsx","xls","feather","parquet"])
out_format = st.selectbox("Output format", ["csv","json","xlsx","feather","parquet"])
validate = st.checkbox("Validate after conversion", value=True)

if uploaded and st.button("Convert"):
    workdir = tempfile.mkdtemp(prefix="datamorphx_ui_")
    in_ext = uploaded.name.rsplit(".", 1)[-1].lower()
    input_path = os.path.join(workdir, f"input.{in_ext}")
    with open(input_path, "wb") as fh:
        fh.write(uploaded.getbuffer())

    out_name = f"{os.path.splitext(uploaded.name)[0] or 'converted'}.{out_format}"
    out_path = os.path.join(workdir, f"output.{out_format}")
    dm = DataMorphX()
    try:
        meta = dm.convert(input_path, out_path, validate=validate)
        st.success("Conversion successful")
        st.json({k: v for k, v in meta.items() if k not in ("input_path", "output_path")})
        with open(out_path, "rb") as fh:
            st.download_button("Download converted file", fh.read(), file_name=out_name)
    except Exception as e:
        st.error(f"Conversion failed: {e}")
    finally:
        shutil.rmtree(workdir, ignore_errors=True)
