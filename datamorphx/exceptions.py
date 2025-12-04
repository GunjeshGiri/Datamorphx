class UnsupportedFormatError(Exception):
    def __init__(self, ext):
        super().__init__(f"Unsupported format: {ext}")
