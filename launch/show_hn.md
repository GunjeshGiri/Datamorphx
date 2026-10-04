# Show HN: DataMorphX - A 100% in-browser data converter & profiler powered by DuckDB WASM

Hey HN,

I'm Gunjesh, and I've spent the last few weeks building DataMorphX: a blazing fast, free, and fully client-side tool to convert, profile, and query data files.

**The Problem:**
As a data engineer, I often need to quickly convert a 200MB CSV to Parquet, or inspect a weird JSON file. Existing online converters have strict size limits, force you to upload your sensitive corporate data to their servers, and are incredibly slow. Alternatively, firing up a Jupyter notebook or writing a Python script just for a quick conversion feels like overkill.

**The Solution:**
DataMorphX runs DuckDB compiled to WebAssembly directly inside your browser. 
When you drag and drop a file, it's processed entirely on your local CPU and RAM. **Zero bytes are ever uploaded.**

**Features:**
- **Instant Conversions:** Convert between CSV, TSV, JSON, Excel, Parquet, Markdown, and SQL. 
- **Monaco SQL Editor:** Write SQL directly against your dropped files to clean, filter, and cast data *before* you export it. (e.g. `SELECT * FROM 'data.csv' WHERE amount > 100`)
- **Data Profiler:** Instantly view min, max, null counts, and uniqueness across all your columns.
- **Data Diffing:** Drop two files and run an instant set difference to find exactly what changed between them.
- **Shareable Recipes:** The SQL transformations are encoded in the URL hash, so you can share a link with your team and they can apply your exact data pipeline to their own local files.
- **Python CLI / FastAPI Server:** If you have files larger than your browser's RAM, we provide an open-source Python CLI (`pipx install datamorphx`) and a self-hostable FastAPI server.

You can try it live here: [https://datamorphx.com](https://datamorphx.com)
The repo is fully open source: [https://github.com/GunjeshGiri/Datamorphx](https://github.com/GunjeshGiri/Datamorphx)

I'd love to hear your feedback, especially around the WASM performance and the UI/UX for the SQL editor. Happy to answer any questions!
