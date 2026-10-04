# Title: I built a free, 100% in-browser DuckDB-WASM tool to instantly convert, query, and profile CSVs/Parquet without uploading your data.

Hey r/dataengineering,

I got tired of having to spin up a Jupyter notebook just to figure out why a 150MB CSV was failing a pipeline, or why a Parquet file had weird encodings. The online converters are sketchy, have 10MB limits, and I definitely can't upload client data to them anyway.

So I built **DataMorphX**. It's basically a lightweight data engineering workbench that runs entirely in your browser using **DuckDB-WASM**. 

Because it runs in the browser, your data never leaves your machine.

**What it does:**
1. **Drop & Convert:** Drop a CSV, JSON, Parquet, or Excel file and instantly export it to 10+ formats (including Parquet, SQL inserts, Markdown tables).
2. **SQL Transforms:** There's a Monaco editor built-in. You can write SQL to clean, filter, and cast your data *before* hitting export. 
3. **Data Profiler:** It automatically runs a `SUMMARIZE` query to give you min/max, null counts, and cardinality for every column.
4. **Data Diff:** Drop two files with the same schema and it runs a two-way `EXCEPT` join to show you exactly which rows were added or deleted.
5. **URL Recipes:** The SQL is saved in the URL hash, so you can Slack a link to an analyst, they click it, drop their file, and your SQL runs on their data.

It's completely free, open-source, and has no signups. There's also a CLI (`pipx install datamorphx`) if you prefer the terminal or have files > 1GB.

Check it out: [https://datamorphx.com](https://datamorphx.com)
Repo: [https://github.com/GunjeshGiri/Datamorphx](https://github.com/GunjeshGiri/Datamorphx)

Let me know what you think! Does this fit into your ad-hoc debugging workflows?
