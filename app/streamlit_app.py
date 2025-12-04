import streamlit as st
from datamorphx.converter import DataMorphX
import tempfile, os

st.set_page_config(page_title="DataMorphX", layout="centered")

st.title("DataMorphX — Convert CSV/Excel/JSON/Feather/Parquet")

uploaded = st.file_uploader("Upload a file", type=["csv","json","xlsx","xls","feather","parquet"])
out_format = st.selectbox("Output format", ["csv","json","xlsx","feather","parquet"])
validate = st.checkbox("Validate after conversion", value=True)

if uploaded and st.button("Convert"):
    with tempfile.NamedTemporaryFile(delete=False, suffix="."+uploaded.name.split(".")[-1]) as tmp:
        tmp.write(uploaded.getbuffer())
        tmp.flush()
        input_path = tmp.name

    out_name = f"converted.{out_format}"
    out_path = os.path.join(tempfile.gettempdir(), out_name)
    dm = DataMorphX()
    try:
        meta = dm.convert(input_path, out_path, validate=validate)
        st.success("Conversion successful")
        st.json(meta)
        with open(out_path, "rb") as fh:
            st.download_button("Download converted file", fh.read(), file_name=out_name)
    except Exception as e:
        st.error(f"Conversion failed: {e}")
    finally:
        try:
            os.remove(input_path)
            os.remove(out_path)
        except Exception:
            pass
