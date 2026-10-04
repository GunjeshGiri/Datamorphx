from __future__ import annotations
import dataclasses
from typing import Iterator, Type, Dict, Any, Optional
import pyarrow as pa
import duckdb

class Format:
    """Base class for all DataMorphX formats."""
    name: str
    extensions: list[str]
    writable_extensions: Optional[list[str]] = None
    readable: bool = True
    writable: bool = True

    @classmethod
    def read_arrow(cls, path: str, options: dict[str, Any]) -> pa.RecordBatchReader | pa.Table:
        """Read a file into an Arrow RecordBatchReader or Table."""
        raise NotImplementedError

    @classmethod
    def write_arrow(cls, data: pa.RecordBatchReader | pa.Table, path: str, options: dict[str, Any]) -> None:
        """Write an Arrow RecordBatchReader or Table to a file."""
        raise NotImplementedError

    @classmethod
    def sniff(cls, head: bytes) -> bool:
        """Return True if the magic bytes indicate this format."""
        return False

_REGISTRY: dict[str, Type[Format]] = {}

def register_format(fmt: Type[Format]) -> Type[Format]:
    for ext in fmt.extensions:
        _REGISTRY[ext.lower()] = fmt
    _REGISTRY[fmt.name.lower()] = fmt
    return fmt

def get_format(name_or_ext: str) -> Type[Format]:
    name_or_ext = name_or_ext.lower().strip()
    if name_or_ext not in _REGISTRY:
        from .exceptions import UnsupportedFormatError
        raise UnsupportedFormatError(name_or_ext)
    return _REGISTRY[name_or_ext]

def sniff_format(path: str, sample_size: int = 8192) -> Optional[str]:
    """Detect file format using registered sniffers."""
    try:
        with open(path, "rb") as fh:
            head = fh.read(sample_size)
    except OSError:
        return None

    # Sort formats to prioritize binary over text sniffing if needed, 
    # but for now just iterate.
    for fmt_cls in set(_REGISTRY.values()):
        if fmt_cls.sniff(head):
            return fmt_cls.name
    return None
