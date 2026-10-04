"""DataMorphX REST API.

POST /convert   -> returns the converted file directly (metadata in the
                   ``X-DataMorphX-Meta`` response header as JSON).
GET  /formats   -> supported input/output formats.
GET  /health    -> liveness probe.

Every request works in its own private temp directory, which is deleted after
the response has been sent. Nothing is addressable by path from the outside.
"""
from __future__ import annotations

import json
import os
import re
import shutil
import tempfile

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.responses import FileResponse
from starlette.background import BackgroundTask

from datamorphx.converter import DataMorphX, READABLE, WRITABLE
from datamorphx.utils import content_matches_extension, ext_of

MAX_UPLOAD_MB = int(os.getenv("DATAMORPHX_MAX_UPLOAD_MB", "100"))
MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024
_CHUNK = 1024 * 1024

MEDIA_TYPES = {
    "csv": "text/csv",
    "json": "application/json",
    "xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "feather": "application/vnd.apache.arrow.file",
    "parquet": "application/vnd.apache.parquet",
}

app = FastAPI(title="DataMorphX API", version="1.1.0")


def _safe_stem(filename: str | None) -> str:
    """Filename stem safe for a Content-Disposition header."""
    stem = os.path.splitext(os.path.basename(filename or ""))[0]
    stem = re.sub(r"[^A-Za-z0-9._-]+", "_", stem).strip("._")
    return stem[:100] or "converted"


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/formats")
def formats() -> dict:
    return {"readable": sorted(READABLE), "writable": sorted(WRITABLE)}


@app.post("/convert")
async def convert_endpoint(
    output_format: str = Form(...),
    file: UploadFile = File(...),
    do_validate: bool = Form(True, alias="validate"),
):
    output_format = output_format.lower().strip()
    if output_format not in WRITABLE:
        raise HTTPException(422, f"output_format must be one of {sorted(WRITABLE)}")

    in_ext = ext_of(file.filename or "")
    if in_ext not in READABLE:
        raise HTTPException(415, f"Unsupported input format '{in_ext}'. Supported: {sorted(READABLE)}")

    workdir = tempfile.mkdtemp(prefix="datamorphx_")
    cleanup = BackgroundTask(shutil.rmtree, workdir, ignore_errors=True)
    try:
        in_path = os.path.join(workdir, f"input.{in_ext}")
        out_path = os.path.join(workdir, f"output.{output_format}")

        # Stream the upload to disk, enforcing the size limit as we go.
        size = 0
        with open(in_path, "wb") as fh:
            while chunk := await file.read(_CHUNK):
                size += len(chunk)
                if size > MAX_UPLOAD_BYTES:
                    raise HTTPException(413, f"File exceeds the {MAX_UPLOAD_MB} MB upload limit")
                fh.write(chunk)
        if size == 0:
            raise HTTPException(400, "Uploaded file is empty")

        if not content_matches_extension(in_path, in_ext):
            raise HTTPException(415, f"File content does not look like a valid .{in_ext} file")

        try:
            meta = await run_in_threadpool(DataMorphX().convert, in_path, out_path, do_validate)
        except Exception as e:  # conversion errors are client data problems
            raise HTTPException(400, f"Conversion failed: {e}")
    except BaseException:
        shutil.rmtree(workdir, ignore_errors=True)
        raise

    # Never leak server-side paths to clients.
    public_meta = {k: v for k, v in meta.items() if k not in ("input_path", "output_path")}
    return FileResponse(
        out_path,
        media_type=MEDIA_TYPES.get(output_format, "application/octet-stream"),
        filename=f"{_safe_stem(file.filename)}.{output_format}",
        headers={"X-DataMorphX-Meta": json.dumps(public_meta, default=str)},
        background=cleanup,  # delete the workdir after the response is sent
    )
