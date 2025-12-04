
import os
import tempfile
from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from datamorphx.converter import DataMorphX

app = FastAPI(title="DataMorphX API", version="0.1")

@app.post("/convert")
async def convert_endpoint(
    output_format: str = Form(..., regex="^(csv|json|xlsx|feather|parquet)$"),
    file: UploadFile = File(...),
    validate: bool = Form(True),
):
    suffix = "." + file.filename.split(".")[-1]
    with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp_in:
        body = await file.read()
        tmp_in.write(body)
        tmp_in.flush()
        in_path = tmp_in.name

    out_suffix = "." + output_format
    out_path = os.path.join(tempfile.gettempdir(), f"datamorphx_out_{os.getpid()}{out_suffix}")

    dm = DataMorphX()
    try:
        meta = dm.convert(in_path, out_path, validate=validate)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    return JSONResponse(content=meta)

@app.get("/download")
def download_file(path: str):
    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(path, filename=os.path.basename(path), media_type="application/octet-stream")
