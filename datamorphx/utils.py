import os
from typing import Optional
from .formats import sniff_format

def ext_of(path: str) -> str:
    return os.path.splitext(path)[1].lstrip(".").lower()

def safe_remove(path: str) -> None:
    try:
        os.remove(path)
    except Exception:
        pass

def content_matches_extension(path: str, ext: str) -> bool:
    """True if the file's content is plausible for the declared extension."""
    detected = sniff_format(path)
    if detected is None:
        return False
    if ext == "csv":
        return detected in ("csv", "json")
    # if it's xls or xlsx, sniffing currently doesn't differentiate inside PK zip
    if ext in ("xls", "xlsx"):
        return detected == "xlsx" or detected == "xls"
    # if feather, it maps to feather
    return detected == ext
