import os

def ext_of(path: str) -> str:
    return os.path.splitext(path)[1].lstrip(".").lower()

def safe_remove(path: str) -> None:
    try:
        os.remove(path)
    except Exception:
        pass
