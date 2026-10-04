'use client';
import React, { useState, useEffect } from 'react';
import { getDuckDB, queryDuckDB, registerFile, exportQuery } from '@/lib/duckdb';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, themeAlpine, colorSchemeDark } from 'ag-grid-community';
import Editor from '@monaco-editor/react';
import * as XLSX from 'xlsx';
import { UploadCloud, Play, Download, Loader2, Copy, Code2 } from 'lucide-react';
import * as arrow from 'apache-arrow';

// Register ag-grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

import {
    generateHTML,
    generateYAML,
    generateXML,
    generateLaTeX,
    generateJira,
    generateMediaWiki,
    generateAsciiDoc,
    generateBBCode
} from '@/lib/exporters';
import * as LZString from 'lz-string';

export default function Workbench() {
    const [files, setFiles] = useState<string[]>([]);
    const latestFile = files.length > 0 ? files[files.length - 1] : null;
    const [sql, setSql] = useState<string>('SELECT * FROM data LIMIT 100;');
    const [rowData, setRowData] = useState<any[]>([]);
    const [colDefs, setColDefs] = useState<any[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    
    // Profiler & Diff state
    const [activeTab, setActiveTab] = useState<'data' | 'profiler' | 'diff'>('data');
    const [profilerData, setProfilerData] = useState<any[]>([]);
    const [profilerColDefs, setProfilerColDefs] = useState<any[]>([]);
    
    // Diff Tool State
    const [diffTable1, setDiffTable1] = useState<string>('');
    const [diffTable2, setDiffTable2] = useState<string>('');
    const [diffData, setDiffData] = useState<any[]>([]);
    const [diffColDefs, setDiffColDefs] = useState<any[]>([]);
    
    // Export state
    const [exportFormat, setExportFormat] = useState<string>('parquet');
    const [showCode, setShowCode] = useState<boolean>(false);

    // Initialize DuckDB on mount
    useEffect(() => {
        getDuckDB().then(() => setLoading(false)).catch(err => {
            setError('Failed to initialize local DuckDB engine.');
            setLoading(false);
        });
    }, []);

    // Sync SQL with URL Hash on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const hash = window.location.hash;
            if (hash.startsWith('#sql=')) {
                try {
                    const decoded = LZString.decompressFromEncodedURIComponent(hash.substring(5));
                    if (decoded) setSql(decoded);
                } catch (e) {
                    console.error("Failed to parse SQL from URL", e);
                }
            }
        }
    }, []);

    const handleFileDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        const file = e.dataTransfer.files[0];
        if (!file) return;
        await loadFile(file);
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await loadFile(file);
    };

    const loadFile = async (file: File) => {
        setLoading(true);
        setError(null);
        try {
            let name = file.name;
            const ext = name.toLowerCase().split('.').pop();
            
            if (ext === 'xlsx' || ext === 'xls') {
                // Parse Excel to CSV purely in browser
                const buffer = await file.arrayBuffer();
                const workbook = XLSX.read(buffer, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const csvData = XLSX.utils.sheet_to_csv(sheet);
                name = name + '.csv';
                await import('@/lib/duckdb').then(m => m.registerFileText(name, csvData));
            } else {
                name = await registerFile(file);
            }
            
            // Create a view named "data" for convenience
            let viewSql = `CREATE OR REPLACE VIEW data AS SELECT * FROM read_csv_auto('${name}')`;
            if (name.toLowerCase().endsWith('.parquet')) {
                viewSql = `CREATE OR REPLACE VIEW data AS SELECT * FROM read_parquet('${name}')`;
            } else if (name.toLowerCase().endsWith('.json') || name.toLowerCase().endsWith('.jsonl')) {
                viewSql = `CREATE OR REPLACE VIEW data AS SELECT * FROM read_json_auto('${name}')`;
            }
            
            await queryDuckDB(viewSql);
            
            setFiles(prev => prev.includes(name) ? prev : [...prev, name]);
            
            // Run the default query to show data
            await runQuery('SELECT * FROM data LIMIT 100;');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const runQuery = async (queryToRun: string = sql) => {
        setLoading(true);
        setError(null);
        
        // Update URL so recipes can be shared
        if (typeof window !== 'undefined' && queryToRun !== 'SELECT * FROM data LIMIT 100;') {
            const compressed = LZString.compressToEncodedURIComponent(queryToRun);
            window.history.replaceState(null, '', `#sql=${compressed}`);
        }
        
        try {
            const table = await queryDuckDB(queryToRun);
            // Convert Arrow table to array of objects for AG Grid
            const rows = table.toArray().map(row => row.toJSON());
            setRowData(rows);
            
            if (table.schema.fields.length > 0) {
                setColDefs(table.schema.fields.map(f => ({ 
                    field: f.name,
                    headerName: f.name,
                    sortable: true,
                    filter: true,
                    resizable: true,
                })));
            }

            // Run Profiler silently
            try {
                // If it has a semicolon, try to get just the first query
                const cleanQuery = queryToRun.trim().replace(/;+$/, '');
                const profilerTable = await queryDuckDB(`SUMMARIZE (${cleanQuery})`);
                const profRows = profilerTable.toArray().map(r => r.toJSON());
                setProfilerData(profRows);
                if (profilerTable.schema.fields.length > 0) {
                    setProfilerColDefs(profilerTable.schema.fields.map(f => ({
                        field: f.name,
                        headerName: f.name.replace(/_/g, ' ').toUpperCase(),
                        sortable: true,
                        filter: true,
                        resizable: true,
                    })));
                }
            } catch (profErr) {
                console.error("Profiler failed:", profErr);
            }

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const generateMarkdown = (rows: any[], cols: any[]) => {
        if (!cols.length) return '';
        const headers = cols.map(c => c.field);
        const headerRow = '| ' + headers.join(' | ') + ' |';
        const sepRow = '| ' + headers.map(() => '---').join(' | ') + ' |';
        const dataRows = rows.map(r => '| ' + headers.map(h => r[h] !== null ? String(r[h]).replace(/\|/g, '\\|') : '').join(' | ') + ' |');
        return [headerRow, sepRow, ...dataRows].join('\n');
    };

    const generateSQLInsert = (rows: any[], cols: any[], tableName: string) => {
        if (!cols.length || !rows.length) return '';
        const headers = cols.map(c => c.field);
        
        // Sanitize table name (quote it to handle spaces)
        const safeTableName = `"${tableName.replace(/"/g, '""')}"`;
        const safeHeaders = headers.map(h => `"${h.replace(/"/g, '""')}"`);
        
        const ddl = `CREATE TABLE ${safeTableName} (\n  ${safeHeaders.map(h => `${h} TEXT`).join(',\n  ')}\n);`;
        
        // Filter out completely empty rows
        const validRows = rows.filter(r => headers.some(h => r[h] !== null && r[h] !== undefined && r[h] !== ''));
        
        const inserts = validRows.map(r => {
            const vals = headers.map(h => {
                const v = r[h];
                if (v === null || v === undefined || v === '') return 'NULL';
                if (typeof v === 'number') return v;
                return `'${String(v).replace(/'/g, "''")}'`;
            });
            return `INSERT INTO ${safeTableName} (${safeHeaders.join(', ')}) VALUES (${vals.join(', ')});`;
        });
        
        return ddl + '\n\n' + inserts.join('\n');
    };

    const runDiff = async () => {
        if (!diffTable1 || !diffTable2) {
            setError("Please select both files to compare.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            // Generate read functions based on extensions
            const getReadFunc = (f: string) => {
                if (f.endsWith('.parquet')) return `read_parquet('${f}')`;
                if (f.endsWith('.json') || f.endsWith('.jsonl')) return `read_json_auto('${f}')`;
                return `read_csv_auto('${f}')`;
            };
            
            const actualQuery = `
                SELECT '${diffTable1} Only' as diff_source, * FROM (SELECT * FROM ${getReadFunc(diffTable1)} EXCEPT SELECT * FROM ${getReadFunc(diffTable2)})
                UNION ALL
                SELECT '${diffTable2} Only' as diff_source, * FROM (SELECT * FROM ${getReadFunc(diffTable2)} EXCEPT SELECT * FROM ${getReadFunc(diffTable1)})
            `;

            const table = await queryDuckDB(actualQuery);
            const rows = table.toArray().map(r => r.toJSON());
            setDiffData(rows);
            
            if (table.schema.fields.length > 0) {
                setDiffColDefs(table.schema.fields.map(f => ({
                    field: f.name,
                    headerName: f.name,
                    sortable: true,
                    filter: true,
                    resizable: true,
                    pinned: f.name === 'diff_source' ? 'left' : null,
                    cellStyle: (params: any) => {
                        if (f.name === 'diff_source') {
                            return { fontWeight: 'bold', backgroundColor: params.value.includes(diffTable1) ? '#4a1515' : '#154a1d' };
                        }
                        return null;
                    }
                })));
            }
        } catch (err: any) {
            setError("Diff failed: " + err.message + ". Make sure both files have the exact same columns/schema.");
        } finally {
            setLoading(false);
        }
    };

    const applySmartCast = () => {
        if (!colDefs.length) {
            setError("Run a query first to detect columns.");
            return;
        }
        
        const selects = colDefs.map(c => {
            const sample = rowData[0]?.[c.field];
            if (typeof sample === 'string' && /^[\$€£]?\s*-?\d{1,3}(,\d{3})*(\.\d+)?\s*$/.test(sample)) {
                return `TRY_CAST(REPLACE(REPLACE(${c.field}, '$', ''), ',', '') AS DOUBLE) AS ${c.field}`;
            }
            return c.field;
        });
        setSql(`SELECT\n  ${selects.join(',\n  ')}\nFROM data\nLIMIT 100;`);
    };

    const applyCleanup = (op: string) => {
        if (!colDefs.length) {
            setError("Run a query first to detect columns.");
            return;
        }

        let newSql = sql;
        if (op === 'dedupe') {
            newSql = newSql.replace(/SELECT\s+/i, 'SELECT DISTINCT\n  ');
        } else if (op === 'trim') {
            const selects = colDefs.map(c => {
                const sample = rowData[0]?.[c.field];
                if (typeof sample === 'string') return `TRIM(${c.field}) AS ${c.field}`;
                return c.field;
            });
            newSql = `SELECT\n  ${selects.join(',\n  ')}\nFROM data\nLIMIT 100;`;
        } else if (op === 'drop_empty') {
            const conditions = colDefs.map(c => `${c.field} IS NOT NULL AND ${c.field} != ''`).join(' OR\n  ');
            newSql = `SELECT * FROM data\nWHERE\n  ${conditions}\nLIMIT 100;`;
        } else if (op === 'snake_case') {
            const selects = colDefs.map(c => {
                const snake = c.field.replace(/\W+/g, '_').toLowerCase();
                return `${c.field} AS ${snake}`;
            });
            newSql = `SELECT\n  ${selects.join(',\n  ')}\nFROM data\nLIMIT 100;`;
        }
        setSql(newSql);
    };

    const handleExport = async (action: 'download' | 'copy') => {
        setLoading(true);
        setError(null);
        try {
            let buffer: Uint8Array | null = null;
            let textOutput: string | null = null;

            if (exportFormat === 'parquet') {
                buffer = await exportQuery(sql, 'parquet', '(FORMAT PARQUET)');
            } else if (exportFormat === 'arrow') {
                setError("Arrow export requires client-side Apache Arrow IPC writing. Downloading Parquet instead.");
                buffer = await exportQuery(sql, 'parquet', '(FORMAT PARQUET)');
            } else if (exportFormat === 'csv') {
                buffer = await exportQuery(sql, 'csv', "(HEADER, DELIMITER ',')");
            } else if (exportFormat === 'json') {
                buffer = await exportQuery(sql, 'json', "(FORMAT JSON, ARRAY true)");
            } else if (exportFormat === 'ndjson') {
                buffer = await exportQuery(sql, 'json', "(FORMAT JSON)");
            } else if (exportFormat === 'excel') {
                const worksheet = XLSX.utils.json_to_sheet(rowData);
                const workbook = XLSX.utils.book_new();
                XLSX.utils.book_append_sheet(workbook, worksheet, "Data");
                buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
            } else if (exportFormat === 'markdown') {
                textOutput = generateMarkdown(rowData, colDefs);
            } else if (exportFormat === 'sql') {
                textOutput = generateSQLInsert(rowData, colDefs, latestFile ? latestFile.split('.')[0] : 'table');
            } else if (exportFormat === 'html') {
                textOutput = generateHTML(rowData, colDefs);
            } else if (exportFormat === 'yaml') {
                textOutput = generateYAML(rowData);
            } else if (exportFormat === 'xml') {
                textOutput = generateXML(rowData);
            } else if (exportFormat === 'latex') {
                textOutput = generateLaTeX(rowData, colDefs);
            } else if (exportFormat === 'jira') {
                textOutput = generateJira(rowData, colDefs);
            } else if (exportFormat === 'mediawiki') {
                textOutput = generateMediaWiki(rowData, colDefs);
            } else if (exportFormat === 'asciidoc') {
                textOutput = generateAsciiDoc(rowData, colDefs);
            } else if (exportFormat === 'bbcode') {
                textOutput = generateBBCode(rowData, colDefs);
            }

            const originalBaseName = latestFile ? latestFile.replace(/\.[^/.]+$/, "") : "export";
            let ext = exportFormat;
            if (exportFormat === 'ndjson') ext = 'jsonl';
            if (exportFormat === 'markdown') ext = 'md';
            if (exportFormat === 'excel') ext = 'xlsx';
            if (exportFormat === 'yaml') ext = 'yml';
            if (['latex', 'jira', 'mediawiki', 'asciidoc', 'bbcode'].includes(exportFormat)) ext = 'txt';
            const outputFilename = `${originalBaseName}.${ext}`;

            if (textOutput !== null) {
                if (action === 'copy') {
                    await navigator.clipboard.writeText(textOutput);
                } else {
                    const blob = new Blob([textOutput], { type: 'text/plain' });
                    downloadBlob(blob, outputFilename);
                }
            } else if (buffer !== null) {
                const blob = new Blob([buffer as any], { type: 'application/octet-stream' });
                if (action === 'copy') {
                    if (['csv', 'json', 'ndjson'].includes(exportFormat)) {
                        await navigator.clipboard.writeText(await blob.text());
                    } else {
                        setError(`Copy not supported for binary format ${exportFormat}.`);
                    }
                } else {
                    downloadBlob(blob, outputFilename);
                }
            }
        } catch (e: any) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    const downloadBlob = (blob: Blob, name: string) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex flex-col h-screen bg-neutral-950 text-white">
            {/* Header */}
            <header className="border-b border-neutral-800 p-4 flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">DataMorphX Workbench</h1>
                </div>
                {loading && <Loader2 className="animate-spin text-blue-400" />}
            </header>

            {/* Main Workspace */}
            <div className="flex flex-1 overflow-hidden">
                {/* Left Panel: SQL & Upload */}
                <div className="w-1/3 flex flex-col border-r border-neutral-800">
                    <div className="p-4 border-b border-neutral-800 bg-neutral-900/30">
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-semibold text-neutral-300">Workspace</span>
                            {files.length > 0 && <button onClick={() => setFiles([])} className="text-xs text-neutral-500 hover:text-white">Clear All</button>}
                        </div>
                        {files.length > 0 ? (
                            <div className="flex flex-col gap-1 mb-3 max-h-24 overflow-y-auto">
                                {files.map(f => (
                                    <div key={f} className="text-xs text-blue-300 bg-blue-900/20 px-2 py-1 rounded truncate border border-blue-800/30">
                                        {f}
                                    </div>
                                ))}
                            </div>
                        ) : null}
                        <div 
                            className="flex items-center justify-center border-2 border-dashed border-neutral-700 rounded-lg p-3 hover:border-blue-500 transition-colors bg-neutral-900/50 cursor-pointer"
                            onDragOver={e => e.preventDefault()}
                            onDrop={handleFileDrop}
                            onClick={() => document.getElementById('file-upload')?.click()}
                        >
                            <input id="file-upload" type="file" className="hidden" onChange={handleFileSelect} />
                            <UploadCloud className="w-5 h-5 text-neutral-500 mr-2" />
                            <span className="text-neutral-400 text-sm">Drop a file (CSV, Excel, Parquet, JSON)</span>
                        </div>
                    </div>
                    
                    <div className="flex flex-col h-full">
                        <div className="flex-1 relative">
                                <Editor
                                    height="100%"
                                    defaultLanguage="sql"
                                    theme="vs-dark"
                                    value={sql}
                                    onChange={(v) => setSql(v || '')}
                                    options={{ minimap: { enabled: false }, fontSize: 14, fontFamily: 'JetBrains Mono, monospace', padding: { top: 16 } }}
                                />
                            </div>
                            <div className="p-4 border-t border-neutral-800 flex gap-2">
                                <select 
                                    className="bg-neutral-800 text-neutral-300 font-medium py-2 px-2 rounded outline-none text-sm appearance-none cursor-pointer hover:bg-neutral-700 transition-colors"
                                    onChange={(e) => { if(e.target.value) { applyCleanup(e.target.value); e.target.value=''; } }}
                                    defaultValue=""
                                >
                                    <option value="" disabled>🧹 Clean-up...</option>
                                    <option value="dedupe">Dedupe (Distinct)</option>
                                    <option value="trim">Trim Whitespace</option>
                                    <option value="drop_empty">Drop Empty Rows</option>
                                    <option value="snake_case">Snake_Case Columns</option>
                                </select>
                                <button onClick={() => applySmartCast()} className="bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium py-2 px-3 rounded flex items-center justify-center transition-colors text-sm" title="Auto-Cast strings with commas/currency to numbers">
                                    ✨ Auto-Cast
                                </button>
                                <button onClick={() => runQuery()} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded flex items-center justify-center gap-2 transition-colors">
                                    <Play className="w-4 h-4" /> Run SQL
                                </button>
                            </div>
                        </div>
                </div>

                {/* Right Panel: Results Grid & Export */}
                <div className="flex-1 flex flex-col bg-neutral-900 relative">
                    {/* Info Bar */}
                    <div className="bg-neutral-800 text-xs px-4 py-2 flex items-center gap-4 text-neutral-300 border-b border-neutral-700 shadow-sm z-10 pt-3">
                        <div className="flex gap-4 border-r border-neutral-700 pr-4">
                            <button onClick={() => setActiveTab('data')} className={`font-medium ${activeTab === 'data' ? 'text-blue-400 border-b-2 border-blue-500' : 'text-neutral-400 hover:text-white'} pb-2 -mb-2 uppercase tracking-wider`}>Data View</button>
                            <button onClick={() => setActiveTab('profiler')} className={`font-medium ${activeTab === 'profiler' ? 'text-purple-400 border-b-2 border-purple-500' : 'text-neutral-400 hover:text-white'} pb-2 -mb-2 uppercase tracking-wider`}>Data Profiler</button>
                            <button onClick={() => setActiveTab('diff')} className={`font-medium ${activeTab === 'diff' ? 'text-green-400 border-b-2 border-green-500' : 'text-neutral-400 hover:text-white'} pb-2 -mb-2 uppercase tracking-wider`}>Data Diff</button>
                        </div>
                        {activeTab === 'diff' ? (
                            <>
                                <span><strong className="text-white">{diffData.length}</strong> Differences Found</span>
                            </>
                        ) : (
                            <>
                                <span><strong className="text-white">{rowData.length}</strong> Rows</span>
                                <span><strong className="text-white">{colDefs.length}</strong> Columns</span>
                                <span>Est. Memory: <strong className="text-white">~{(JSON.stringify(rowData).length / 1024 / 1024).toFixed(2)} MB</strong></span>
                            </>
                        )}
                        <span className="ml-auto text-green-400 flex items-center gap-1">🔒 100% In-Browser (Zero Upload)</span>
                    </div>

                    {/* Export Toolbar */}
                    <div className="bg-neutral-900 border-b border-neutral-800 p-2 flex items-center gap-2 overflow-x-auto">
                        {['Parquet', 'CSV', 'JSON', 'NDJSON', 'Excel', 'Markdown', 'SQL'].map(fmt => (
                            <button 
                                key={fmt}
                                onClick={() => { setExportFormat(fmt.toLowerCase()); setShowCode(false); }}
                                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${exportFormat === fmt.toLowerCase() && !showCode ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'}`}
                            >
                                {fmt}
                            </button>
                        ))}
                        <select 
                            value={['parquet', 'csv', 'json', 'ndjson', 'excel', 'markdown', 'sql'].includes(exportFormat) ? '' : exportFormat} 
                            onChange={(e) => { if(e.target.value) { setExportFormat(e.target.value); setShowCode(false); } }}
                            className={`px-3 py-1.5 rounded text-sm font-medium outline-none transition-colors appearance-none cursor-pointer ${!['parquet', 'csv', 'json', 'ndjson', 'excel', 'markdown', 'sql'].includes(exportFormat) && !showCode ? 'bg-blue-600 text-white' : 'bg-neutral-800 text-neutral-400 hover:bg-neutral-700 hover:text-white'}`}
                        >
                            <option value="" disabled>More Formats...</option>
                            <option value="html">HTML Table</option>
                            <option value="yaml">YAML</option>
                            <option value="xml">XML</option>
                            <option value="latex">LaTeX</option>
                            <option value="jira">Jira</option>
                            <option value="mediawiki">MediaWiki</option>
                            <option value="asciidoc">AsciiDoc</option>
                            <option value="bbcode">BBCode</option>
                        </select>
                        <div className="flex-1"></div>
                        <button 
                            onClick={() => setShowCode(!showCode)} 
                            className={`text-sm px-3 py-1.5 border border-neutral-700 rounded transition-colors flex items-center gap-2 ${showCode ? 'bg-indigo-600 text-white' : 'text-neutral-300 hover:bg-neutral-800'}`}
                        >
                            <Code2 className="w-4 h-4" /> Copy as Code
                        </button>
                    </div>

                    {/* Action Bar (Download/Copy) based on active format */}
                    {!showCode && exportFormat && (
                        <div className="bg-neutral-800/50 p-2 px-4 flex items-center gap-3 border-b border-neutral-800">
                           <span className="text-sm text-neutral-400">Export as <strong>{exportFormat.toUpperCase()}</strong>:</span>
                           <button onClick={() => handleExport('download')} className="bg-neutral-700 hover:bg-neutral-600 text-white px-3 py-1 rounded text-sm flex items-center gap-2 transition-colors"><Download className="w-4 h-4"/> Download File</button>
                           {!['parquet', 'excel'].includes(exportFormat) && (
                               <button onClick={() => handleExport('copy')} className="bg-neutral-700 hover:bg-neutral-600 text-white px-3 py-1 rounded text-sm flex items-center gap-2 transition-colors"><Copy className="w-4 h-4"/> Copy to Clipboard</button>
                           )}
                        </div>
                    )}

                    {/* Code Drawer / Panel */}
                    {showCode && (
                        <div className="bg-neutral-800 border-b border-neutral-700 p-6 flex flex-col gap-4 text-sm max-h-[50%] overflow-auto shadow-inner">
                            <div>
                                <h3 className="font-semibold text-neutral-200 mb-2 flex items-center justify-between">
                                    DataMorphX CLI
                                    <button onClick={() => navigator.clipboard.writeText(`dmx convert ${latestFile || 'input.csv'} output.${exportFormat === 'markdown' || exportFormat === 'sql' ? 'txt' : exportFormat} --sql "${sql}"`)} className="text-neutral-400 hover:text-white"><Copy className="w-4 h-4"/></button>
                                </h3>
                                <pre className="bg-neutral-950 p-3 rounded text-green-400 overflow-x-auto border border-neutral-800">
                                    dmx convert {latestFile || 'input.csv'} output.{exportFormat === 'markdown' || exportFormat === 'sql' ? 'txt' : exportFormat} --sql "{sql}"
                                </pre>
                            </div>
                            <div>
                                <h3 className="font-semibold text-neutral-200 mb-2 flex items-center justify-between">
                                    Python (DataMorphX Core)
                                    <button onClick={() => navigator.clipboard.writeText(`from datamorphx import DataMorphX\ndm = DataMorphX()\nres = dm.query("""${sql}""", '${latestFile || 'input.csv'}')\ndm.write(res, 'output.${exportFormat === 'markdown' || exportFormat === 'sql' ? 'txt' : exportFormat}')`)} className="text-neutral-400 hover:text-white"><Copy className="w-4 h-4"/></button>
                                </h3>
                                <pre className="bg-neutral-950 p-3 rounded text-blue-400 overflow-x-auto border border-neutral-800">
{`from datamorphx import DataMorphX
dm = DataMorphX()
res = dm.query("""${sql}""", '${latestFile || 'input.csv'}')
dm.write(res, 'output.${exportFormat === 'markdown' || exportFormat === 'sql' ? 'txt' : exportFormat}')`}
                                </pre>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="bg-red-900/50 border border-red-500/50 text-red-200 p-4 m-4 rounded absolute top-0 z-50 left-0 right-0 shadow-lg">
                            {error}
                            <button className="float-right underline" onClick={() => setError(null)}>Dismiss</button>
                        </div>
                    )}
                    
                    {/* Grid */}
                    <div className="flex-1 p-4 h-full relative">
                        {activeTab === 'data' ? (
                            rowData.length > 0 ? (
                                 <AgGridReact
                                    rowData={rowData}
                                    columnDefs={colDefs}
                                    theme={themeAlpine.withPart(colorSchemeDark)}
                                    defaultColDef={{ sortable: true, filter: true, resizable: true }}
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-neutral-500">
                                    {latestFile ? "Run a query to see results" : "Upload data to begin"}
                                </div>
                            )
                        ) : activeTab === 'profiler' ? (
                            profilerData.length > 0 ? (
                                 <AgGridReact
                                    rowData={profilerData}
                                    columnDefs={profilerColDefs}
                                    theme={themeAlpine.withPart(colorSchemeDark)}
                                    defaultColDef={{ sortable: true, filter: true, resizable: true }}
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full text-neutral-500">
                                    No profile data available. Run a query first.
                                </div>
                            )
                        ) : (
                            <div className="flex flex-col h-full">
                                <div className="flex gap-4 items-center bg-neutral-800 p-4 rounded-lg mb-4 border border-neutral-700 shadow-sm">
                                    <div className="flex flex-col gap-1 flex-1">
                                        <label className="text-xs text-neutral-400 font-medium">Original File (A)</label>
                                        <select 
                                            value={diffTable1} 
                                            onChange={(e) => setDiffTable1(e.target.value)}
                                            className="bg-neutral-900 border border-neutral-700 text-white rounded p-2 text-sm"
                                        >
                                            <option value="">Select file...</option>
                                            {files.map(f => <option key={f} value={f}>{f}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-1 flex-1">
                                        <label className="text-xs text-neutral-400 font-medium">Modified File (B)</label>
                                        <select 
                                            value={diffTable2} 
                                            onChange={(e) => setDiffTable2(e.target.value)}
                                            className="bg-neutral-900 border border-neutral-700 text-white rounded p-2 text-sm"
                                        >
                                            <option value="">Select file...</option>
                                            {files.map(f => <option key={f} value={f}>{f}</option>)}
                                        </select>
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <label className="text-xs text-transparent select-none">Action</label>
                                        <button onClick={runDiff} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded text-sm font-medium transition-colors">Compare</button>
                                    </div>
                                </div>
                                <div className="flex-1 relative">
                                    {diffData.length > 0 ? (
                                        <AgGridReact
                                            rowData={diffData}
                                            columnDefs={diffColDefs}
                                            theme={themeAlpine.withPart(colorSchemeDark)}
                                            defaultColDef={{ sortable: true, filter: true, resizable: true }}
                                        />
                                    ) : (
                                        <div className="flex items-center justify-center h-full text-neutral-500 bg-neutral-900/50 rounded border border-neutral-800 border-dashed">
                                            Select two files with identical schema to find additions and deletions.
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
