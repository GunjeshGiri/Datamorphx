'use client';

import React, { useState, useEffect, useRef } from 'react';
import { getDuckDB, queryDuckDB, registerFile, registerFileText, exportQuery } from '@/lib/duckdb';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule, themeAlpine, colorSchemeDark } from 'ag-grid-community';
import Editor from '@monaco-editor/react';
import * as XLSX from 'xlsx';
import { 
    UploadCloud, Play, Download, Loader2, Copy, Code2, Check, 
    Sparkles, Trash2, Database, Table, BarChart3, GitCompare, 
    Wand2, FileCode, Search, Terminal, Zap, ShieldCheck, 
    ChevronDown, RefreshCw, Layers, CheckCircle2, FileSpreadsheet,
    PanelLeftClose, PanelLeftOpen, Network, Share2, Filter, X,
    ChevronRight, ArrowRight, HelpCircle, Info, Bot, Key
} from 'lucide-react';
import * as LZString from 'lz-string';

import {
    generateHTML,
    generateYAML,
    generateXML,
    generateLaTeX
} from '@/lib/exporters';
import { SAMPLE_DATASETS, SampleDataset } from '@/lib/sampleDatasets';

// Register AG-Grid community modules
ModuleRegistry.registerModules([AllCommunityModule]);

interface SchemaField {
    name: string;
    type: string;
    nullable?: boolean;
}

const formatArrowType = (typeObj: any): string => {
    if (!typeObj) return 'VARCHAR';
    const str = String(typeObj).toUpperCase();
    if (str.includes('INT')) return 'INT64';
    if (str.includes('FLOAT') || str.includes('DOUBLE')) return 'FLOAT64';
    if (str.includes('UTF8') || str.includes('STRING')) return 'VARCHAR';
    if (str.includes('TIMESTAMP') || str.includes('DATE')) return 'TIMESTAMP';
    if (str.includes('BOOL')) return 'BOOLEAN';
    if (str.includes('DECIMAL')) return 'DECIMAL';
    return str.split('<')[0];
};

export default function Workbench() {
    const [files, setFiles] = useState<string[]>([]);
    const latestFile = files.length > 0 ? files[files.length - 1] : null;
    const [sql, setSql] = useState<string>('SELECT * FROM data LIMIT 100;');
    const [rowData, setRowData] = useState<any[]>([]);
    const [colDefs, setColDefs] = useState<any[]>([]);
    const [schemaFields, setSchemaFields] = useState<SchemaField[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [execTimeMs, setExecTimeMs] = useState<number | null>(null);
    const [isDragging, setIsDragging] = useState<boolean>(false);
    const [filterText, setFilterText] = useState<string>('');
    
    // UI Layout state (Stitch Design System)
    const [isSchemaSidebarOpen, setIsSchemaSidebarOpen] = useState<boolean>(true);
    const [mobileTab, setMobileTab] = useState<'table' | 'sql' | 'schema' | 'export'>('table');
    const [copiedUrl, setCopiedUrl] = useState<boolean>(false);
    const [showGuide, setShowGuide] = useState<boolean>(false);

    // AI SQL Copilot state (Powered by Groq LLaMA 3.3)
    const [aiPrompt, setAiPrompt] = useState<string>('');
    const [aiLoading, setAiLoading] = useState<boolean>(false);
    const [aiSuccessMsg, setAiSuccessMsg] = useState<string | null>(null);
    const [customGroqKey, setCustomGroqKey] = useState<string>('');
    const [showKeyModal, setShowKeyModal] = useState<boolean>(false);

    // Profiler state (Streamlined view)
    const [activeTab, setActiveTab] = useState<'data' | 'profiler'>('data');
    const [profilerData, setProfilerData] = useState<any[]>([]);
    const [profilerColDefs, setProfilerColDefs] = useState<any[]>([]);
    
    // Export state
    const [exportFormat, setExportFormat] = useState<string>('parquet');
    const [showCode, setShowCode] = useState<boolean>(false);
    const [copiedFormat, setCopiedFormat] = useState<boolean>(false);
    const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

    // Initialize DuckDB WebAssembly on mount and auto-load demo sample
    useEffect(() => {
        // Load saved custom Groq key if present
        if (typeof window !== 'undefined') {
            const savedKey = localStorage.getItem('datamorphx_groq_key');
            if (savedKey) setCustomGroqKey(savedKey);
        }

        getDuckDB().then(async () => {
            setLoading(false);
            // If no URL hash query was specified, auto-load first demo sample dataset
            if (typeof window !== 'undefined' && !window.location.hash.startsWith('#sql=')) {
                await loadSample(SAMPLE_DATASETS[0]);
            }
        }).catch(err => {
            console.error(err);
            setError('Failed to initialize local DuckDB WebAssembly engine.');
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

    // Keyboard shortcut: Cmd/Ctrl + Enter to execute SQL
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                runQuery();
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [sql]);

    const handleFileDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (!file) return;
        await loadFile(file);
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        await loadFile(file);
    };

    const isTableLoadedRef = useRef<boolean>(false);

    const loadSample = async (sample: SampleDataset) => {
        setLoading(true);
        setError(null);
        try {
            await registerFileText(sample.filename, sample.csvContent);
            
            // Register as view "data"
            const viewSql = `CREATE OR REPLACE VIEW data AS SELECT * FROM read_csv_auto('${sample.filename}')`;
            await queryDuckDB(viewSql);
            isTableLoadedRef.current = true;

            setFiles(prev => prev.includes(sample.filename) ? prev : [...prev, sample.filename]);
            setSql(sample.defaultSql);
            await runQuery(sample.defaultSql, true);
        } catch (err: any) {
            setError(err.message || 'Failed to load sample dataset');
        } finally {
            setLoading(false);
        }
    };

    const loadFile = async (file: File) => {
        setLoading(true);
        setError(null);
        try {
            let name = file.name;
            const ext = name.toLowerCase().split('.').pop();
            
            if (ext === 'xlsx' || ext === 'xls') {
                const buffer = await file.arrayBuffer();
                const workbook = XLSX.read(buffer, { type: 'array' });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const csvData = XLSX.utils.sheet_to_csv(sheet);
                name = name + '.csv';
                await registerFileText(name, csvData);
            } else {
                name = await registerFile(file);
            }
            
            let viewSql = `CREATE OR REPLACE VIEW data AS SELECT * FROM read_csv_auto('${name}')`;
            if (name.toLowerCase().endsWith('.parquet')) {
                viewSql = `CREATE OR REPLACE VIEW data AS SELECT * FROM read_parquet('${name}')`;
            } else if (name.toLowerCase().endsWith('.json') || name.toLowerCase().endsWith('.jsonl')) {
                viewSql = `CREATE OR REPLACE VIEW data AS SELECT * FROM read_json_auto('${name}')`;
            }
            
            await queryDuckDB(viewSql);
            isTableLoadedRef.current = true;
            setFiles(prev => prev.includes(name) ? prev : [...prev, name]);
            
            const initialSql = 'SELECT * FROM data LIMIT 100;';
            setSql(initialSql);
            await runQuery(initialSql, true);
        } catch (err: any) {
            setError(err.message || 'Failed to load file');
        } finally {
            setLoading(false);
        }
    };

    const runQuery = async (queryToRun: string = sql, skipAutoLoad: boolean = false) => {
        setLoading(true);
        setError(null);

        // If no table is loaded yet and query targets 'data', auto-load the default sample dataset first!
        if (!skipAutoLoad && !isTableLoadedRef.current && files.length === 0 && (queryToRun.includes('data') || queryToRun === 'SELECT * FROM data LIMIT 100;')) {
            await loadSample(SAMPLE_DATASETS[0]);
            return;
        }

        const startTime = performance.now();
        
        if (typeof window !== 'undefined' && queryToRun !== 'SELECT * FROM data LIMIT 100;') {
            const compressed = LZString.compressToEncodedURIComponent(queryToRun);
            window.history.replaceState(null, '', `#sql=${compressed}`);
        }
        
        try {
            const table = await queryDuckDB(queryToRun);
            const duration = Math.round(performance.now() - startTime);
            setExecTimeMs(duration);

            const rows = table.toArray().map(row => row.toJSON());
            setRowData(rows);
            isTableLoadedRef.current = true;
            
            if (table.schema.fields.length > 0) {
                setSchemaFields(table.schema.fields.map(f => ({
                    name: f.name,
                    type: formatArrowType(f.type),
                    nullable: f.nullable
                })));
                setColDefs(table.schema.fields.map(f => ({ 
                    field: f.name,
                    headerName: f.name,
                    sortable: true,
                    filter: true,
                    resizable: true,
                })));
            }

            // Run Profiler summary
            try {
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
                console.error("Profiler summary failed:", profErr);
            }

        } catch (err: any) {
            const msg = err.message || 'Query execution error';
            if (msg.includes('Table with name data does not exist') || msg.includes('does not exist')) {
                setError('Table "data" not loaded yet. Click any sample above (e.g. NYC Taxi) or drop a file to query.');
            } else {
                setError(msg);
            }
        } finally {
            setLoading(false);
        }
    };

    const queryColumn = (colName: string) => {
        const newQuery = `SELECT "${colName}", COUNT(*) AS count\nFROM data\nGROUP BY 1\nORDER BY count DESC\nLIMIT 25;`;
        setSql(newQuery);
        runQuery(newQuery);
        setMobileTab('table');
    };

    const copySqlUrl = async () => {
        if (typeof window === 'undefined') return;
        const compressed = LZString.compressToEncodedURIComponent(sql);
        const url = `${window.location.origin}${window.location.pathname}#sql=${compressed}`;
        await navigator.clipboard.writeText(url);
        setCopiedUrl(true);
        setTimeout(() => setCopiedUrl(false), 2000);
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
        const safeTableName = `"${tableName.replace(/"/g, '""')}"`;
        const safeHeaders = headers.map(h => `"${h.replace(/"/g, '""')}"`);
        
        const ddl = `CREATE TABLE ${safeTableName} (\n  ${safeHeaders.map(h => `${h} TEXT`).join(',\n  ')}\n);`;
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

    const handleGenerateSql = async (overridePrompt?: string) => {
        const queryPrompt = (overridePrompt || aiPrompt).trim();
        if (!queryPrompt) return;

        setAiLoading(true);
        setError(null);
        setAiSuccessMsg(null);

        try {
            const res = await fetch('/api/ai/sql', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt: queryPrompt,
                    schema: schemaFields.map(f => ({ name: f.name, type: f.type })),
                    customApiKey: customGroqKey || undefined
                })
            });

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.error || 'Failed to generate SQL');
            }

            if (data.sql) {
                setSql(data.sql);
                setAiSuccessMsg(`✨ Generated with Groq LLaMA 3.3`);
                setTimeout(() => setAiSuccessMsg(null), 3500);
                // Execute generated query immediately
                await runQuery(data.sql);
            }
        } catch (err: any) {
            setError(`AI Copilot Error: ${err.message}`);
        } finally {
            setAiLoading(false);
        }
    };

    const saveCustomGroqKey = (key: string) => {
        setCustomGroqKey(key);
        if (typeof window !== 'undefined') {
            if (key.trim()) {
                localStorage.setItem('datamorphx_groq_key', key.trim());
            } else {
                localStorage.removeItem('datamorphx_groq_key');
            }
        }
        setShowKeyModal(false);
    };

    const applySmartCast = () => {
        if (!colDefs.length) {
            setError("Run a query first to detect columns.");
            return;
        }
        
        let changedCount = 0;
        const selects = colDefs.map(c => {
            const sample = rowData[0]?.[c.field];
            if (typeof sample === 'string' && /^[\$€£]?\s*-?\d{1,3}(,\d{3})*(\.\d+)?\s*$/.test(sample)) {
                changedCount++;
                return `TRY_CAST(REPLACE(REPLACE(${c.field}, '$', ''), ',', '') AS DOUBLE) AS ${c.field}`;
            }
            return c.field;
        });

        if (changedCount === 0) {
            setError("No currency or comma-formatted numbers detected to cast.");
            return;
        }

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
            const conditions = colDefs.map(c => `${c.field} IS NOT NULL AND ${c.field} != ''`).join(' AND\n  ');
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
            }

            const originalBaseName = latestFile ? latestFile.replace(/\.[^/.]+$/, "") : "export";
            let ext = exportFormat;
            if (exportFormat === 'ndjson') ext = 'jsonl';
            if (exportFormat === 'markdown') ext = 'md';
            if (exportFormat === 'excel') ext = 'xlsx';
            if (exportFormat === 'yaml') ext = 'yml';
            if (exportFormat === 'latex') ext = 'tex';
            const outputFilename = `${originalBaseName}.${ext}`;

            if (textOutput !== null) {
                if (action === 'copy') {
                    await navigator.clipboard.writeText(textOutput);
                    setCopiedFormat(true);
                    setTimeout(() => setCopiedFormat(false), 2000);
                } else {
                    const blob = new Blob([textOutput], { type: 'text/plain' });
                    downloadBlob(blob, outputFilename);
                }
            } else if (buffer !== null) {
                const blob = new Blob([buffer as any], { type: 'application/octet-stream' });
                if (action === 'copy') {
                    if (['csv', 'json', 'ndjson'].includes(exportFormat)) {
                        await navigator.clipboard.writeText(await blob.text());
                        setCopiedFormat(true);
                        setTimeout(() => setCopiedFormat(false), 2000);
                    } else {
                        setError(`Copy not supported for binary format ${exportFormat.toUpperCase()}. Use Download.`);
                    }
                } else {
                    downloadBlob(blob, outputFilename);
                }
            }
        } catch (e: any) {
            setError(e.message || 'Export error');
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

    const copyCodeSnippet = (key: string, snippet: string) => {
        navigator.clipboard.writeText(snippet);
        setCopiedSnippet(key);
        setTimeout(() => setCopiedSnippet(null), 2000);
    };

    const memoryMb = (JSON.stringify(rowData).length / 1024 / 1024).toFixed(2);

    return (
        <div className="flex flex-col h-full bg-[#09090b] text-[#f4f4f5] font-sans select-none overflow-hidden">
            {/* Top Error Alert */}
            {error && (
                <div className="bg-rose-950/90 border-b border-rose-800 text-rose-200 px-4 py-2 text-xs flex items-center justify-between animate-fadeIn z-50 shrink-0">
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-rose-400">Error:</span>
                        <span>{error}</span>
                    </div>
                    <button 
                        onClick={() => setError(null)} 
                        className="text-rose-400 hover:text-white font-medium underline text-xs"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* ============================================================
                1. TOP INGESTION & DEMO SAMPLE STRIP (STITCH RESPONSIVE SECTION)
                ============================================================ */}
            <section className="p-2.5 sm:p-3 border-b border-white/10 bg-[#0c0c0e] shrink-0">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-stretch md:items-center gap-2.5 sm:gap-3">
                    {/* Interactive Dropzone Area */}
                    <div 
                        className={`flex-1 border border-dashed rounded-lg px-3 py-2 flex items-center justify-between cursor-pointer group transition-all duration-200 min-h-[44px] ${
                            isDragging 
                                ? 'border-[#00f5d4] bg-[#00f5d4]/10 shadow-lg shadow-[#00f5d4]/10 scale-[1.005]' 
                                : 'border-white/10 hover:border-[#00f5d4]/50 bg-[#121215] hover:bg-white/5'
                        }`}
                        onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={handleFileDrop}
                        onClick={() => document.getElementById('workbench-file-input')?.click()}
                    >
                        <input 
                            id="workbench-file-input" 
                            type="file" 
                            className="hidden" 
                            onChange={handleFileSelect} 
                            accept=".csv,.tsv,.json,.jsonl,.parquet,.xlsx,.xls"
                        />
                        <div className="flex items-center gap-2.5 overflow-hidden">
                            <div className="w-8 h-8 rounded-md bg-[#18181b] border border-white/10 group-hover:border-[#00f5d4]/40 flex items-center justify-center text-[#00f5d4] shrink-0 transition-colors">
                                <UploadCloud className="w-4 h-4" />
                            </div>
                            <div className="text-left truncate">
                                <div className="flex items-center gap-2">
                                    <p className="text-xs font-semibold text-zinc-100 group-hover:text-white truncate">
                                        Drop .parquet, .csv, or .json
                                    </p>
                                    <span className="hidden sm:inline text-[9px] font-mono text-[#00f5d4] bg-[#00f5d4]/10 border border-[#00f5d4]/20 px-1.5 py-0.2 rounded">
                                        Zero-Copy Memory
                                    </span>
                                </div>
                                <p className="text-[10px] sm:text-[11px] text-zinc-400 font-mono truncate">
                                    Native DuckDB-WASM inference • 0 bytes uploaded
                                </p>
                            </div>
                        </div>
                        <span className="text-xs font-medium text-[#00f5d4] bg-[#00f5d4]/10 border border-[#00f5d4]/30 px-2.5 py-1 rounded-md shrink-0 group-hover:bg-[#00f5d4]/20 transition-all">
                            Browse
                        </span>
                    </div>

                    {/* Touch-Friendly Horizontal Demo Dataset Pills */}
                    <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar whitespace-nowrap py-0.5 shrink-0 touch-pan-x">
                        <button
                            onClick={() => setShowGuide(true)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#00f5d4]/10 hover:bg-[#00f5d4]/20 border border-[#00f5d4]/40 text-xs font-mono text-[#00f5d4] font-medium transition-all shrink-0 min-h-[40px] md:min-h-0 cursor-pointer shadow-sm"
                            title="Interactive guide: how to query & export data"
                        >
                            <HelpCircle className="w-3.5 h-3.5" />
                            <span>How to Use</span>
                        </button>
                        <span className="text-[10px] font-mono uppercase text-zinc-500 font-medium shrink-0 hidden xs:inline">
                            Samples:
                        </span>
                        {SAMPLE_DATASETS.map((sample) => (
                            <button
                                key={sample.id}
                                onClick={() => loadSample(sample)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141417] hover:bg-[#1b1b20] active:scale-95 border border-white/10 hover:border-[#00f5d4]/50 text-xs font-mono text-zinc-300 hover:text-white transition-all shrink-0 min-h-[40px] md:min-h-0 cursor-pointer shadow-sm"
                                title={sample.description}
                            >
                                <span className="text-xs">{sample.id === 'taxi' ? '⚡' : sample.id === 'financial' ? '📊' : sample.id === 'ecommerce' ? '🛒' : sample.id === 'customers' ? '👥' : '🌐'}</span>
                                <span className="font-medium">{sample.name}</span>
                                <span className="text-[10px] font-mono text-zinc-500 group-hover:text-zinc-400">
                                    {sample.badge.split('&')[0].trim()}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* ============================================================
                2. MOBILE SEGMENTED VIEW SWITCHER (< lg SCREEN SIZES)
                ============================================================ */}
            <div className="lg:hidden sticky top-0 z-30 px-3 py-2 bg-[#09090b]/95 backdrop-blur border-b border-white/10 shrink-0">
                <div className="grid grid-cols-4 bg-[#121215] p-1 rounded-xl border border-white/10 text-xs font-mono">
                    <button 
                        onClick={() => setMobileTab('table')}
                        className={`min-h-[40px] flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-semibold transition-all ${
                            mobileTab === 'table'
                                ? 'bg-[#18181b] text-[#00f5d4] border border-white/10 shadow-sm'
                                : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                    >
                        <Table className="w-3.5 h-3.5 text-[#00f5d4]" />
                        <span className="text-[11px]">Table</span>
                        {rowData.length > 0 && (
                            <span className="text-[9px] px-1 rounded bg-[#00f5d4]/10 text-[#00f5d4] hidden sm:inline">
                                {rowData.length}
                            </span>
                        )}
                    </button>

                    <button 
                        onClick={() => setMobileTab('sql')}
                        className={`min-h-[40px] flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-semibold transition-all ${
                            mobileTab === 'sql'
                                ? 'bg-[#18181b] text-[#00f5d4] border border-white/10 shadow-sm'
                                : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                    >
                        <Terminal className="w-3.5 h-3.5" />
                        <span className="text-[11px]">SQL</span>
                    </button>

                    <button 
                        onClick={() => setMobileTab('schema')}
                        className={`min-h-[40px] flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-semibold transition-all ${
                            mobileTab === 'schema'
                                ? 'bg-[#18181b] text-[#00f5d4] border border-white/10 shadow-sm'
                                : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                    >
                        <Network className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Schema</span>
                        {schemaFields.length > 0 && (
                            <span className="text-[9px] px-1 rounded bg-zinc-800 text-zinc-400 hidden sm:inline">
                                {schemaFields.length}
                            </span>
                        )}
                    </button>

                    <button 
                        onClick={() => setMobileTab('export')}
                        className={`min-h-[40px] flex items-center justify-center gap-1.5 py-1.5 rounded-lg font-semibold transition-all ${
                            mobileTab === 'export'
                                ? 'bg-[#18181b] text-[#00f5d4] border border-white/10 shadow-sm'
                                : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                    >
                        <Download className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Export</span>
                    </button>
                </div>
            </div>

            {/* ============================================================
                3. MOBILE ACTIVE VIEW CONTAINER (< lg SCREEN SIZES)
                ============================================================ */}
            <div className="lg:hidden flex-1 overflow-y-auto pb-16 flex flex-col">
                {mobileTab === 'table' && (
                    <div className="flex-1 flex flex-col">
                        {/* Mobile Telemetry & Filter Bar */}
                        <div className="px-3 py-2 flex items-center justify-between text-xs border-b border-white/10 bg-[#09090b]">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-300">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                                    <strong className="text-white font-semibold">{rowData.length}</strong> rows
                                </span>
                                <span className="text-zinc-700">•</span>
                                <span className="text-[11px] font-mono text-zinc-400">{colDefs.length} cols</span>
                                {execTimeMs !== null && (
                                    <>
                                        <span className="text-zinc-700">•</span>
                                        <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                                            ⚡ {execTimeMs}ms
                                        </span>
                                    </>
                                )}
                            </div>

                            <div className="flex items-center gap-1.5">
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        placeholder="Quick filter..."
                                        value={filterText}
                                        onChange={(e) => setFilterText(e.target.value)}
                                        className="bg-[#121215] border border-white/10 text-zinc-200 text-xs px-2.5 py-1 rounded outline-none focus:border-[#00f5d4] w-28 sm:w-36 font-mono"
                                    />
                                    {filterText && (
                                        <button 
                                            onClick={() => setFilterText('')}
                                            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Mobile Data Table / AG-Grid */}
                        <div className="flex-1 min-h-[350px] bg-[#09090b] p-2">
                            {rowData.length > 0 ? (
                                <div className="h-full w-full rounded overflow-hidden border border-white/10 shadow-lg">
                                    <AgGridReact
                                        rowData={rowData}
                                        columnDefs={colDefs}
                                        quickFilterText={filterText}
                                        theme={themeAlpine.withPart(colorSchemeDark)}
                                        defaultColDef={{ sortable: true, filter: true, resizable: true }}
                                    />
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/10 rounded-xl bg-[#121215]/50 my-6">
                                    <Sparkles className="w-8 h-8 text-[#00f5d4] mb-2" />
                                    <p className="text-sm font-semibold text-zinc-200 mb-1">No Dataset Loaded</p>
                                    <p className="text-xs text-zinc-400 mb-4">Tap any sample pill above or browse a file to start.</p>
                                    <button 
                                        onClick={() => loadSample(SAMPLE_DATASETS[0])}
                                        className="px-3 py-1.5 bg-[#00f5d4] text-[#09090b] font-semibold text-xs rounded-md shadow-sm"
                                    >
                                        Load Demo Dataset
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Quick SQL Peek Card (Below Grid) */}
                        <div className="p-3 bg-[#0d0d10] border-t border-white/10">
                            <div className="rounded-xl bg-[#121215] border border-white/10 p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                        <span className="text-[11px] font-mono font-medium text-zinc-300">query.sql</span>
                                    </div>
                                    <button 
                                        onClick={() => setMobileTab('sql')}
                                        className="text-[10px] text-[#00f5d4] hover:underline font-mono flex items-center gap-0.5"
                                    >
                                        Edit Query →
                                    </button>
                                </div>
                                <div className="bg-[#09090b] rounded-lg p-2.5 border border-white/10 font-mono text-[11px] text-zinc-300 overflow-x-auto leading-relaxed">
                                    <pre className="text-zinc-300 whitespace-pre-wrap">{sql}</pre>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {mobileTab === 'sql' && (
                    <div className="p-3 flex flex-col gap-3 flex-1">
                        <div className="rounded-xl bg-[#121215] border border-white/10 p-3 shadow-sm flex flex-col">
                            <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                                    <span className="text-xs font-mono font-medium text-zinc-300">query.sql</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <button 
                                        onClick={() => setShowGuide(true)}
                                        className="bg-[#18181b] hover:bg-zinc-800 text-[#00f5d4] text-xs px-2 py-1 rounded border border-white/10 flex items-center gap-1 font-mono"
                                        title="How to Use"
                                    >
                                        <HelpCircle className="w-3 h-3 text-[#00f5d4]" />
                                        <span>Guide</span>
                                    </button>
                                    <select 
                                        className="bg-[#18181b] text-zinc-300 text-xs px-2 py-1 rounded border border-white/10 outline-none"
                                        onChange={(e) => { if(e.target.value) { applyCleanup(e.target.value); e.target.value=''; } }}
                                        defaultValue=""
                                    >
                                        <option value="" disabled>🧹 Clean-up...</option>
                                        <option value="dedupe">Dedupe (DISTINCT)</option>
                                        <option value="trim">Trim Whitespace</option>
                                        <option value="drop_empty">Drop Empty</option>
                                        <option value="snake_case">Snake_case</option>
                                    </select>
                                    <button 
                                        onClick={applySmartCast}
                                        className="bg-[#18181b] text-zinc-300 text-xs px-2 py-1 rounded border border-white/10 flex items-center gap-1"
                                        title="Auto-Cast currency/commas to DOUBLE"
                                    >
                                        <Wand2 className="w-3 h-3 text-amber-400" />
                                        <span>Cast</span>
                                    </button>
                                </div>
                            </div>

                            {/* Mobile AI Copilot Bar */}
                            <div className="flex flex-col gap-1.5 p-2 bg-[#09090b] rounded-lg border border-white/10 mb-2">
                                <div className="flex items-center gap-1.5">
                                    <div className="relative flex-1">
                                        <Bot className="w-3.5 h-3.5 text-[#00f5d4] absolute left-2 top-1/2 -translate-y-1/2" />
                                        <input
                                            type="text"
                                            value={aiPrompt}
                                            onChange={(e) => setAiPrompt(e.target.value)}
                                            onKeyDown={(e) => { if (e.key === 'Enter') handleGenerateSql(); }}
                                            placeholder="Ask AI Copilot to write DuckDB SQL..."
                                            className="w-full bg-[#18181b] text-xs font-mono text-zinc-200 pl-7 pr-2 py-1 rounded border border-white/10 focus:border-[#00f5d4] outline-none"
                                        />
                                    </div>
                                    <button
                                        onClick={() => handleGenerateSql()}
                                        disabled={aiLoading}
                                        className="px-2.5 py-1 bg-[#00f5d4]/15 border border-[#00f5d4]/40 text-[#00f5d4] text-xs font-mono rounded flex items-center gap-1 shrink-0"
                                    >
                                        {aiLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                                        <span>Ask</span>
                                    </button>
                                    <button
                                        onClick={() => setShowKeyModal(true)}
                                        className={`p-1 rounded border text-xs shrink-0 ${
                                            customGroqKey ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400' : 'bg-[#18181b] border-white/10 text-zinc-400'
                                        }`}
                                        title="Groq API Key Settings"
                                    >
                                        <Key className="w-3 h-3" />
                                    </button>
                                </div>
                                {aiSuccessMsg && (
                                    <span className="text-emerald-400 text-[10px] font-mono px-1">
                                        {aiSuccessMsg}
                                    </span>
                                )}
                            </div>

                            <div className="h-64 rounded-lg overflow-hidden border border-white/10 bg-[#09090b]">
                                <Editor
                                    height="100%"
                                    defaultLanguage="sql"
                                    theme="vs-dark"
                                    value={sql}
                                    onChange={(v) => setSql(v || '')}
                                    options={{ 
                                        minimap: { enabled: false }, 
                                        fontSize: 12, 
                                        fontFamily: 'var(--font-geist-mono), JetBrains Mono, monospace',
                                        lineNumbers: 'on',
                                        scrollBeyondLastLine: false,
                                        wordWrap: 'on',
                                        padding: { top: 8, bottom: 8 }
                                    }}
                                />
                            </div>

                            <div className="mt-3 flex items-center justify-between gap-2">
                                <button 
                                    onClick={() => setSql('SELECT * FROM data LIMIT 100;')}
                                    className="p-2 rounded bg-[#18181b] hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-white/10 text-xs font-mono flex items-center gap-1"
                                >
                                    <RefreshCw className="w-3 h-3" /> Reset
                                </button>
                                <button 
                                    onClick={() => { runQuery(); setMobileTab('table'); }}
                                    disabled={loading}
                                    className="flex-1 py-2 px-4 bg-[#00f5d4] hover:bg-[#26fedc] text-[#09090b] font-semibold font-mono rounded text-xs flex items-center justify-center gap-1.5 shadow-[0_0_12px_rgba(0,245,212,0.3)] active:scale-95 transition-transform"
                                >
                                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-[#09090b]" />}
                                    <span>Run Query &amp; View Table</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {mobileTab === 'schema' && (
                    <div className="p-3 flex flex-col gap-3 flex-1">
                        <div className="bg-[#121215] border border-white/10 rounded-xl p-3 shadow-sm">
                            <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10 font-mono">
                                <div className="flex items-center gap-1.5">
                                    <Network className="w-3.5 h-3.5 text-[#00f5d4]" />
                                    <span className="text-xs font-semibold text-zinc-200">Schema Inspector</span>
                                </div>
                                <span className="text-[10px] text-zinc-400 bg-zinc-900 border border-white/10 px-2 py-0.5 rounded">
                                    {schemaFields.length} columns
                                </span>
                            </div>

                            {schemaFields.length > 0 ? (
                                <div className="space-y-1.5 font-mono text-xs">
                                    {schemaFields.map(f => (
                                        <div 
                                            key={f.name}
                                            className="p-2 rounded bg-zinc-900/80 border border-white/5 flex items-center justify-between group hover:border-[#00f5d4]/40 transition-colors"
                                        >
                                            <div className="flex items-center gap-2 truncate">
                                                <span className="font-semibold text-zinc-200 group-hover:text-[#00f5d4] truncate">
                                                    {f.name}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-400 font-mono border border-white/5">
                                                    {f.type}
                                                </span>
                                                <button 
                                                    onClick={() => queryColumn(f.name)}
                                                    className="px-2 py-0.5 rounded bg-[#00f5d4]/10 hover:bg-[#00f5d4]/20 text-[#00f5d4] text-[10px] font-semibold border border-[#00f5d4]/30"
                                                    title={`Count distribution of ${f.name}`}
                                                >
                                                    Query
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-zinc-500 text-xs font-mono">
                                    No columns detected. Load a dataset to inspect schema.
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {mobileTab === 'export' && (
                    <div className="p-3 flex flex-col gap-3 flex-1">
                        <div className="bg-[#121215] border border-white/10 rounded-xl p-3 shadow-sm">
                            <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10 font-mono">
                                <div className="flex items-center gap-2">
                                    <Download className="w-4 h-4 text-[#00f5d4]" />
                                    <span className="text-xs font-semibold text-zinc-100">Export Dataset</span>
                                </div>
                                <span className="text-[10px] font-mono text-[#00f5d4] bg-[#00f5d4]/10 px-2 py-0.5 rounded border border-[#00f5d4]/30">
                                    {rowData.length} Rows
                                </span>
                            </div>

                            <p className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-2">
                                Choose Output Format
                            </p>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 font-mono text-xs">
                                {['parquet', 'csv', 'excel', 'json', 'ndjson', 'sql', 'markdown', 'html'].map(fmt => (
                                    <button 
                                        key={fmt}
                                        onClick={() => setExportFormat(fmt)}
                                        className={`min-h-[44px] flex flex-col items-center justify-center p-2 rounded-xl border active:scale-95 transition-transform ${
                                            exportFormat === fmt
                                                ? 'bg-[#00f5d4]/15 border-[#00f5d4] text-[#00f5d4] font-bold shadow-sm'
                                                : 'bg-zinc-900 border-white/10 text-zinc-300 hover:text-white'
                                        }`}
                                    >
                                        <span className="text-xs">.{fmt}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="flex items-center gap-2 pt-2 border-t border-white/10">
                                <button 
                                    onClick={() => handleExport('download')}
                                    disabled={loading || rowData.length === 0}
                                    className="flex-1 min-h-[42px] bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-md disabled:opacity-50"
                                >
                                    <Download className="w-3.5 h-3.5" />
                                    <span>Download .{exportFormat}</span>
                                </button>
                                {!['parquet', 'excel'].includes(exportFormat) && (
                                    <button 
                                        onClick={() => handleExport('copy')}
                                        disabled={loading || rowData.length === 0}
                                        className="min-h-[42px] px-3 bg-[#18181b] hover:bg-zinc-800 text-zinc-200 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 border border-white/10 transition-all disabled:opacity-50"
                                    >
                                        {copiedFormat ? <Check className="w-3.5 h-3.5 text-[#00f5d4]" /> : <Copy className="w-3.5 h-3.5" />}
                                        <span>{copiedFormat ? 'Copied' : 'Copy'}</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ============================================================
                4. MOBILE FLOATING STICKY ACTION BAR (< lg SCREEN SIZES)
                ============================================================ */}
            <aside className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#09090b]/95 backdrop-blur-md border-t border-white/10 px-4 py-2.5 flex items-center gap-2.5 shadow-xl">
                <button 
                    onClick={copySqlUrl}
                    className="flex-1 min-h-[44px] px-3 rounded-xl bg-[#121215] hover:bg-zinc-850 border border-white/10 text-zinc-300 font-medium text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-sm font-mono"
                >
                    {copiedUrl ? (
                        <>
                            <Check className="w-3.5 h-3.5 text-[#00f5d4]" />
                            <span className="text-[#00f5d4]">URL Copied!</span>
                        </>
                    ) : (
                        <>
                            <Share2 className="w-3.5 h-3.5 text-zinc-400" />
                            <span className="truncate">Share SQL URL</span>
                        </>
                    )}
                </button>
                <button 
                    onClick={() => setMobileTab('export')}
                    className="flex-[1.2] min-h-[44px] px-4 rounded-xl bg-[#00f5d4] hover:bg-[#26fedc] text-[#09090b] font-semibold text-xs flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(0,245,212,0.3)] active:scale-95 transition-all font-mono"
                >
                    <Download className="w-4 h-4" />
                    <span>Export Data</span>
                </button>
            </aside>

            {/* ============================================================
                5. DESKTOP SPLIT STUDIO WORKSPACE (>= lg SCREEN SIZES)
                ============================================================ */}
            <div className="hidden lg:flex flex-1 overflow-hidden">
                {/* Left Column Part A: Collapsible Schema Explorer & Tables Tree */}
                {isSchemaSidebarOpen ? (
                    <aside className="w-60 xl:w-64 flex flex-col border-r border-white/10 bg-[#121215] shrink-0">
                        {/* Schema Header */}
                        <div className="p-3 border-b border-white/10 bg-[#09090b] flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Network className="w-3.5 h-3.5 text-[#00f5d4]" />
                                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                                    Schema Explorer
                                </span>
                            </div>
                            <button 
                                onClick={() => setIsSchemaSidebarOpen(false)}
                                className="p-1 rounded hover:bg-white/5 text-zinc-500 hover:text-zinc-200 transition-colors"
                                title="Collapse Schema Sidebar"
                            >
                                <PanelLeftClose className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Registered Tables */}
                        <div className="p-3 border-b border-white/10 bg-[#0c0c0e]">
                            <div className="flex items-center justify-between text-[10px] text-zinc-500 font-mono uppercase mb-2">
                                <span>Active Tables ({files.length})</span>
                                {files.length > 0 && (
                                    <button 
                                        onClick={() => { setFiles([]); setRowData([]); setColDefs([]); setSchemaFields([]); }}
                                        className="text-zinc-500 hover:text-rose-400 flex items-center gap-1 transition-colors"
                                    >
                                        <Trash2 className="w-2.5 h-2.5" /> Clear
                                    </button>
                                )}
                            </div>
                            {files.length > 0 ? (
                                <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                                    {files.map(f => (
                                        <div 
                                            key={f}
                                            className="flex items-center justify-between text-xs px-2 py-1 rounded bg-[#18181b] border border-white/5 text-zinc-300"
                                        >
                                            <div className="flex items-center gap-1.5 truncate">
                                                <Table className="w-3 h-3 text-[#00f5d4] shrink-0" />
                                                <span className="font-mono text-xs truncate" title={f}>{f}</span>
                                            </div>
                                            <span className="text-[10px] font-mono px-1 rounded bg-zinc-900 text-zinc-400">
                                                view: data
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-[11px] text-zinc-500 italic">No files loaded yet</p>
                            )}
                        </div>

                        {/* Columns Tree List */}
                        <div className="flex-1 p-3 overflow-y-auto flex flex-col font-mono text-xs">
                            <div className="flex items-center justify-between text-[10px] text-zinc-500 uppercase tracking-wider mb-2">
                                <span>Detected Columns</span>
                                <span className="text-[#00f5d4]">{schemaFields.length}</span>
                            </div>

                            {schemaFields.length > 0 ? (
                                <div className="space-y-1 pr-1">
                                    {schemaFields.map(f => (
                                        <div 
                                            key={f.name}
                                            onClick={() => queryColumn(f.name)}
                                            className="p-1.5 rounded bg-zinc-900/60 hover:bg-[#18181b] border border-white/5 hover:border-[#00f5d4]/40 flex items-center justify-between cursor-pointer group transition-all"
                                            title={`Click to analyze ${f.name}`}
                                        >
                                            <span className="text-zinc-300 group-hover:text-[#00f5d4] truncate pr-1">
                                                {f.name}
                                            </span>
                                            <span className="text-[10px] text-zinc-500 group-hover:text-zinc-400 font-mono px-1 rounded bg-zinc-950 border border-white/5 shrink-0">
                                                {f.type}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex-1 flex flex-col items-center justify-center text-center text-zinc-600 text-xs">
                                    <Network className="w-6 h-6 mb-1 opacity-50" />
                                    <span>Columns will appear after running query</span>
                                </div>
                            )}
                        </div>

                        {/* DuckDB Status Bar */}
                        <div className="p-2.5 border-t border-white/10 bg-[#09090b] flex items-center justify-between text-[11px] font-mono text-zinc-400">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]"></span>
                                <span>DuckDB WASM</span>
                            </div>
                            <span className="text-zinc-500">v0.10.2</span>
                        </div>
                    </aside>
                ) : (
                    <div className="w-8 border-r border-white/10 bg-[#121215] flex flex-col items-center py-3 shrink-0">
                        <button 
                            onClick={() => setIsSchemaSidebarOpen(true)}
                            className="p-1.5 rounded hover:bg-white/5 text-zinc-400 hover:text-white transition-colors"
                            title="Expand Schema Explorer"
                        >
                            <PanelLeftOpen className="w-4 h-4 text-[#00f5d4]" />
                        </button>
                    </div>
                )}

                {/* Left Column Part B: Monaco SQL Query Studio */}
                <div className="w-[420px] xl:w-[460px] flex flex-col border-r border-white/10 bg-[#121215] shrink-0">
                    {/* Editor Tab Bar & Utility Toolbar */}
                    <div className="px-3 py-1.5 border-b border-white/10 bg-[#09090b] flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                            <div className="px-2.5 py-1 rounded text-xs font-mono font-medium bg-[#121215] text-[#00f5d4] border border-white/10 flex items-center gap-1.5">
                                <FileCode className="w-3 h-3" />
                                <span>query.sql</span>
                            </div>
                        </div>

                        {/* Code Cleanup, Guide & Auto-Cast Tools */}
                        <div className="flex items-center gap-1">
                            <button 
                                onClick={() => setShowGuide(true)}
                                className="bg-[#18181b] hover:bg-zinc-800 text-[#00f5d4] font-medium py-1 px-2 rounded flex items-center gap-1 border border-white/10 transition-colors text-xs cursor-pointer"
                                title="How to use DataMorphX"
                            >
                                <HelpCircle className="w-3 h-3 text-[#00f5d4]" />
                                <span>Guide</span>
                            </button>

                            <select 
                                className="bg-[#18181b] hover:bg-zinc-800 text-zinc-300 font-medium py-1 px-2 rounded outline-none text-xs border border-white/10 transition-colors cursor-pointer"
                                onChange={(e) => { if(e.target.value) { applyCleanup(e.target.value); e.target.value=''; } }}
                                defaultValue=""
                                title="Quick SQL Transforms"
                            >
                                <option value="" disabled>🧹 Clean-up...</option>
                                <option value="dedupe">Dedupe (DISTINCT)</option>
                                <option value="trim">Trim Whitespace</option>
                                <option value="drop_empty">Drop Empty Rows</option>
                                <option value="snake_case">Snake_Case Columns</option>
                            </select>

                            <button 
                                onClick={applySmartCast} 
                                className="bg-[#18181b] hover:bg-zinc-800 text-zinc-300 font-medium py-1 px-2 rounded flex items-center gap-1 border border-white/10 transition-colors text-xs cursor-pointer" 
                                title="Auto-Cast currency and formatted comma numbers to DOUBLE"
                            >
                                <Wand2 className="w-3 h-3 text-amber-400" />
                                <span>Auto-Cast</span>
                            </button>
                        </div>
                    </div>

                    {/* AI SQL Copilot Bar (Groq LLaMA 3.3) */}
                    <div className="p-2.5 bg-[#121215] border-b border-white/10 flex flex-col gap-2">
                        <div className="flex items-center gap-1.5">
                            <div className="relative flex-1">
                                <Bot className="w-3.5 h-3.5 text-[#00f5d4] absolute left-2.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    value={aiPrompt}
                                    onChange={(e) => setAiPrompt(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') handleGenerateSql(); }}
                                    placeholder="Ask AI Copilot to write DuckDB SQL (e.g. Find top 10 rows)..."
                                    className="w-full bg-[#09090b] text-xs font-mono text-zinc-200 pl-8 pr-2 py-1.5 rounded border border-white/10 focus:border-[#00f5d4] outline-none placeholder:text-zinc-500"
                                />
                            </div>
                            <button
                                onClick={() => handleGenerateSql()}
                                disabled={aiLoading}
                                className="px-3 py-1.5 bg-[#00f5d4]/15 hover:bg-[#00f5d4]/25 border border-[#00f5d4]/40 text-[#00f5d4] text-xs font-mono font-medium rounded flex items-center gap-1.5 disabled:opacity-50 transition-colors cursor-pointer shrink-0"
                                title="Generate SQL query using Groq AI"
                            >
                                {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                                <span>Generate</span>
                            </button>
                            <button
                                onClick={() => setShowKeyModal(true)}
                                className={`p-1.5 rounded border text-xs transition-colors cursor-pointer shrink-0 ${
                                    customGroqKey ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-400' : 'bg-[#18181b] border-white/10 text-zinc-400 hover:text-white'
                                }`}
                                title="Groq API Key Settings"
                            >
                                <Key className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Quick suggestions & status */}
                        <div className="flex items-center justify-between gap-2 overflow-x-auto text-[11px] font-mono">
                            <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-zinc-500 text-[10px]">Try:</span>
                                {[
                                    'Top 10 rows',
                                    'Count by category',
                                    'Filter missing values',
                                    'Summary metrics'
                                ].map(prompt => (
                                    <button
                                        key={prompt}
                                        onClick={() => { setAiPrompt(prompt); handleGenerateSql(prompt); }}
                                        disabled={aiLoading}
                                        className="px-1.5 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-[#00f5d4] border border-white/5 transition-colors cursor-pointer"
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                            {aiSuccessMsg && (
                                <span className="text-emerald-400 text-[10px] shrink-0 font-medium">
                                    {aiSuccessMsg}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* Monaco Editor Container */}
                    <div className="flex-1 relative bg-[#09090b]">
                        <Editor
                            height="100%"
                            defaultLanguage="sql"
                            theme="vs-dark"
                            value={sql}
                            onChange={(v) => setSql(v || '')}
                            options={{ 
                                minimap: { enabled: false }, 
                                fontSize: 13, 
                                fontFamily: 'var(--font-geist-mono), JetBrains Mono, monospace',
                                lineNumbers: 'on',
                                scrollBeyondLastLine: false,
                                wordWrap: 'on',
                                padding: { top: 10, bottom: 10 }
                            }}
                        />
                    </div>

                    {/* Primary Action Bar: Google Stitch Styled Run Button */}
                    <div className="p-2.5 border-t border-white/10 bg-[#09090b] flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setSql('SELECT * FROM data LIMIT 100;')}
                                className="p-1.5 rounded hover:bg-white/5 text-zinc-400 hover:text-zinc-200 transition-colors"
                                title="Reset query"
                            >
                                <RefreshCw className="w-3.5 h-3.5" />
                            </button>
                            <button 
                                onClick={copySqlUrl}
                                className="p-1.5 rounded hover:bg-white/5 text-zinc-400 hover:text-[#00f5d4] transition-colors flex items-center gap-1 text-[11px] font-mono"
                                title="Share query as compressed URL"
                            >
                                {copiedUrl ? <Check className="w-3.5 h-3.5 text-[#00f5d4]" /> : <Share2 className="w-3.5 h-3.5" />}
                                <span>{copiedUrl ? 'Copied' : 'Share'}</span>
                            </button>
                            <span className="hidden xl:inline text-[10px] font-mono text-zinc-500 border-l border-white/10 pl-2">
                                {files.length > 0 ? (
                                    <span>Target: <strong className="text-[#00f5d4]">data</strong></span>
                                ) : (
                                    <span className="text-amber-400/80">Click Run to load demo</span>
                                )}
                            </span>
                        </div>

                        <button 
                            onClick={() => runQuery()} 
                            disabled={loading}
                            className="bg-[#00f5d4] hover:bg-[#26fedc] text-[#09090b] font-semibold py-1.5 px-3.5 rounded flex items-center gap-2 transition-all shadow-[0_0_12px_rgba(0,245,212,0.3)] disabled:opacity-50 text-xs cursor-pointer"
                            title="Run SQL Query (Ctrl+Enter / Cmd+Enter)"
                        >
                            {loading ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#09090b]" />
                            ) : (
                                <Play className="w-3.5 h-3.5 fill-[#09090b] text-[#09090b]" />
                            )}
                            <span>Run Query</span>
                            <span className="bg-black/20 text-[#09090b] text-[10px] font-mono px-1 py-0.2 rounded font-bold">
                                ⌘↵
                            </span>
                        </button>
                    </div>
                </div>

                {/* ============================================================
                    RIGHT COLUMN: Results Grid, Telemetry, TableConvert Hub
                    ============================================================ */}
                <div className="flex-1 flex flex-col bg-[#09090b] overflow-hidden">
                    {/* View Switcher Tabs & Real-Time Telemetry */}
                    <div className="bg-[#121215] border-b border-white/10 px-4 py-2 flex flex-wrap items-center justify-between gap-3">
                        {/* Tab Buttons */}
                        <div className="flex items-center gap-1 bg-[#09090b] p-0.5 rounded border border-white/10">
                            <button 
                                onClick={() => setActiveTab('data')} 
                                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${
                                    activeTab === 'data' 
                                        ? 'bg-[#18181b] text-[#00f5d4] shadow-sm' 
                                        : 'text-zinc-400 hover:text-zinc-200'
                                }`}
                            >
                                <Table className="w-3.5 h-3.5 text-[#00f5d4]" />
                                <span>Data Grid</span>
                                {rowData.length > 0 && (
                                    <span className="ml-0.5 text-[10px] font-mono opacity-80">
                                        ({rowData.length})
                                    </span>
                                )}
                            </button>

                            <button 
                                onClick={() => setActiveTab('profiler')} 
                                className={`flex items-center gap-1.5 px-3 py-1 rounded text-xs font-semibold transition-all ${
                                    activeTab === 'profiler' 
                                        ? 'bg-[#18181b] text-purple-400 shadow-sm' 
                                        : 'text-zinc-400 hover:text-zinc-200'
                                }`}
                            >
                                <BarChart3 className="w-3.5 h-3.5 text-purple-400" />
                                <span>Profiler</span>
                            </button>
                        </div>

                        {/* Stitch Latency & Telemetry Micro-Badges */}
                        <div className="flex items-center gap-2.5 text-xs text-zinc-400 font-mono">
                            {execTimeMs !== null && (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 border border-white/10 text-emerald-400 text-[11px]">
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#10b981]"></span>
                                    <span>⚡ {execTimeMs}ms</span>
                                </div>
                            )}
                            {rowData.length > 0 && (
                                <>
                                    <span className="hidden sm:inline border-l border-white/10 pl-2.5 text-[11px]">
                                        <strong className="text-zinc-200">{colDefs.length}</strong> cols
                                    </span>
                                    <span className="hidden md:inline border-l border-white/10 pl-2.5 text-[11px]">
                                        ~{memoryMb} MB
                                    </span>
                                </>
                            )}
                            <div className="border-l border-white/10 pl-2.5 hidden lg:flex items-center gap-1.5 text-[11px] text-zinc-400">
                                <ShieldCheck className="w-3.5 h-3.5 text-[#00f5d4]" />
                                <span>Zero-Upload</span>
                            </div>
                        </div>
                    </div>

                    {/* TABLECONVERT EXPORT HUB TOOLBAR */}
                    <div className="bg-[#0c0c0e] border-b border-white/10 px-4 py-2 flex flex-wrap items-center justify-between gap-2">
                        {/* Format Selection Strip */}
                        <div className="flex items-center gap-1 overflow-x-auto py-0.5">
                            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 mr-1 hidden sm:inline font-mono">
                                Target:
                            </span>
                            {['Parquet', 'CSV', 'Excel', 'JSON', 'NDJSON', 'SQL', 'Markdown'].map(fmt => {
                                const f = fmt.toLowerCase();
                                const isSelected = exportFormat === f;
                                return (
                                    <button 
                                        key={fmt}
                                        onClick={() => { setExportFormat(f); setShowCode(false); }}
                                        className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                                            isSelected && !showCode 
                                                ? 'bg-[#00f5d4] text-[#09090b] shadow-[0_0_8px_rgba(0,245,212,0.25)]' 
                                                : 'bg-[#18181b] text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
                                        }`}
                                    >
                                        {fmt}
                                    </button>
                                );
                            })}
                            
                            {/* More Formats Dropdown */}
                            <select 
                                value={['parquet', 'csv', 'excel', 'json', 'ndjson', 'sql', 'markdown'].includes(exportFormat) ? '' : exportFormat} 
                                onChange={(e) => { if(e.target.value) { setExportFormat(e.target.value); setShowCode(false); } }}
                                className={`px-2 py-1 rounded text-xs font-semibold outline-none transition-all appearance-none cursor-pointer border border-white/10 ${
                                    !['parquet', 'csv', 'excel', 'json', 'ndjson', 'sql', 'markdown'].includes(exportFormat) && !showCode 
                                        ? 'bg-[#00f5d4] text-[#09090b]' 
                                        : 'bg-[#18181b] text-zinc-400 hover:text-zinc-200'
                                }`}
                            >
                                <option value="" disabled>More Formats...</option>
                                <option value="html">HTML Table</option>
                                <option value="yaml">YAML Document</option>
                                <option value="xml">XML Document</option>
                                <option value="latex">LaTeX Table</option>
                            </select>
                        </div>

                        {/* Export Action Controls */}
                        <div className="flex items-center gap-2">
                            {/* Quick Table Filter */}
                            <div className="relative hidden xl:block">
                                <input 
                                    type="text" 
                                    placeholder="Filter rows..."
                                    value={filterText}
                                    onChange={(e) => setFilterText(e.target.value)}
                                    className="bg-[#18181b] border border-white/10 text-zinc-200 text-xs px-2.5 py-1 rounded outline-none focus:border-[#00f5d4] w-28 font-mono"
                                />
                                {filterText && (
                                    <button 
                                        onClick={() => setFilterText('')}
                                        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"
                                    >
                                        <X className="w-3 h-3" />
                                    </button>
                                )}
                            </div>

                            {/* Download Action */}
                            <button 
                                onClick={() => handleExport('download')}
                                disabled={loading || rowData.length === 0}
                                className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(16,185,129,0.25)] disabled:opacity-40 cursor-pointer"
                                title={`Download as .${exportFormat}`}
                            >
                                <Download className="w-3.5 h-3.5" />
                                <span>Download</span>
                            </button>

                            {/* Copy Action */}
                            {!['parquet', 'excel'].includes(exportFormat) && (
                                <button 
                                    onClick={() => handleExport('copy')}
                                    disabled={loading || rowData.length === 0}
                                    className="bg-[#18181b] hover:bg-zinc-800 text-zinc-200 px-3 py-1 rounded text-xs font-semibold flex items-center gap-1.5 border border-white/10 transition-all disabled:opacity-40 cursor-pointer"
                                    title="Copy to clipboard"
                                >
                                    {copiedFormat ? (
                                        <>
                                            <Check className="w-3.5 h-3.5 text-[#00f5d4]" />
                                            <span className="text-[#00f5d4]">Copied!</span>
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-3.5 h-3.5" />
                                            <span>Copy</span>
                                        </>
                                    )}
                                </button>
                            )}

                            {/* Code Snippets Toggle */}
                            <button 
                                onClick={() => setShowCode(!showCode)} 
                                className={`text-xs px-2.5 py-1 border rounded transition-all flex items-center gap-1.5 font-medium cursor-pointer ${
                                    showCode 
                                        ? 'bg-[#18181b] border-[#00f5d4] text-[#00f5d4]' 
                                        : 'border-white/10 text-zinc-300 hover:bg-[#18181b]'
                                }`}
                                title="CLI & Python commands"
                            >
                                <Code2 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Code</span>
                            </button>
                        </div>
                    </div>

                    {/* Code Snippets Panel */}
                    {showCode && (
                        <div className="bg-[#121215] border-b border-white/10 p-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs animate-in slide-in-from-top-2">
                            <div className="rounded border border-white/10 bg-[#09090b] p-2.5 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-semibold text-zinc-200 flex items-center gap-1.5 text-xs">
                                        <Layers className="w-3 h-3 text-[#00f5d4]" />
                                        DataMorphX CLI
                                    </span>
                                    <button 
                                        onClick={() => copyCodeSnippet('cli', `dmx convert ${latestFile || 'input.csv'} output.${exportFormat === 'markdown' || exportFormat === 'sql' ? 'txt' : exportFormat} --sql "${sql}"`)}
                                        className="text-zinc-400 hover:text-white flex items-center gap-1 text-[11px]"
                                    >
                                        {copiedSnippet === 'cli' ? <Check className="w-3 h-3 text-[#00f5d4]" /> : <Copy className="w-3 h-3" />}
                                        <span>{copiedSnippet === 'cli' ? 'Copied' : 'Copy'}</span>
                                    </button>
                                </div>
                                <pre className="p-2 rounded bg-[#18181b] font-mono text-[11px] text-[#00f5d4] overflow-x-auto border border-white/5">
                                    dmx convert {latestFile || 'input.csv'} output.{exportFormat === 'markdown' || exportFormat === 'sql' ? 'txt' : exportFormat} --sql &quot;{sql}&quot;
                                </pre>
                            </div>

                            <div className="rounded border border-white/10 bg-[#09090b] p-2.5 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="font-semibold text-zinc-200 flex items-center gap-1.5 text-xs">
                                        <FileCode className="w-3 h-3 text-purple-400" />
                                        Python (DataMorphX Core)
                                    </span>
                                    <button 
                                        onClick={() => copyCodeSnippet('py', `from datamorphx import DataMorphX\ndm = DataMorphX()\nres = dm.query("""${sql}""", '${latestFile || 'input.csv'}')\ndm.write(res, 'output.${exportFormat === 'markdown' || exportFormat === 'sql' ? 'txt' : exportFormat}')`)}
                                        className="text-zinc-400 hover:text-white flex items-center gap-1 text-[11px]"
                                    >
                                        {copiedSnippet === 'py' ? <Check className="w-3 h-3 text-[#00f5d4]" /> : <Copy className="w-3 h-3" />}
                                        <span>{copiedSnippet === 'py' ? 'Copied' : 'Copy'}</span>
                                    </button>
                                </div>
                                <pre className="p-2 rounded bg-[#18181b] font-mono text-[11px] text-purple-300 overflow-x-auto border border-white/5">
{`from datamorphx import DataMorphX
dm = DataMorphX()
res = dm.query("""${sql}""", '${latestFile || 'input.csv'}')
dm.write(res, 'output.${exportFormat === 'markdown' || exportFormat === 'sql' ? 'txt' : exportFormat}')`}
                                </pre>
                            </div>
                        </div>
                    )}

                    {/* MAIN CONTENT VIEWPORT */}
                    <div className="flex-1 p-2.5 relative overflow-hidden bg-[#09090b]">
                        {activeTab === 'data' ? (
                            rowData.length > 0 ? (
                                <div className="h-full w-full rounded overflow-hidden border border-white/10 shadow-2xl">
                                    <AgGridReact
                                        rowData={rowData}
                                        columnDefs={colDefs}
                                        quickFilterText={filterText}
                                        theme={themeAlpine.withPart(colorSchemeDark)}
                                        defaultColDef={{ sortable: true, filter: true, resizable: true }}
                                    />
                                </div>
                            ) : (
                                /* Interactive Welcoming Empty State */
                                <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-white/10 rounded bg-[#121215]/50 max-w-xl mx-auto my-auto">
                                    <div className="h-12 w-12 rounded bg-[#00f5d4]/10 border border-[#00f5d4]/20 flex items-center justify-center mb-3 text-[#00f5d4]">
                                        <Sparkles className="w-6 h-6" />
                                    </div>
                                    <h3 className="text-base font-bold text-zinc-100 mb-1">
                                        DataMorphX Studio Ready
                                    </h3>
                                    <p className="text-xs text-zinc-400 max-w-sm mb-5 leading-relaxed">
                                        Drop your CSV, Excel, Parquet or JSON file into the header dropzone, or test instantly with a pre-configured sample dataset:
                                    </p>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 w-full">
                                        {SAMPLE_DATASETS.slice(0, 3).map(sample => (
                                            <button
                                                key={sample.id}
                                                onClick={() => loadSample(sample)}
                                                className="group text-left p-3 rounded border border-white/10 bg-[#18181b] hover:bg-zinc-800 hover:border-[#00f5d4]/40 transition-all flex flex-col justify-between cursor-pointer"
                                            >
                                                <div>
                                                    <span className="text-xs font-semibold text-zinc-200 group-hover:text-[#00f5d4] block mb-0.5">
                                                        {sample.name}
                                                    </span>
                                                    <span className="text-[10px] text-zinc-500 line-clamp-2 leading-tight">
                                                        {sample.description}
                                                    </span>
                                                </div>
                                                <div className="mt-2.5 flex items-center justify-between text-[10px] text-[#00f5d4] font-medium">
                                                    <span>Load →</span>
                                                    <span className="font-mono text-zinc-500">{sample.badge}</span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>

                                    <div className="mt-6 flex items-center gap-1.5 text-xs text-zinc-500">
                                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                        <span>Client-Side RAM • Zero Network Egress</span>
                                    </div>
                                </div>
                            )
                        ) : (
                            /* Profiler Summary Tab */
                            profilerData.length > 0 ? (
                                <div className="h-full w-full rounded overflow-hidden border border-white/10 shadow-2xl">
                                    <AgGridReact
                                        rowData={profilerData}
                                        columnDefs={profilerColDefs}
                                        theme={themeAlpine.withPart(colorSchemeDark)}
                                        defaultColDef={{ sortable: true, filter: true, resizable: true }}
                                    />
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center h-full text-zinc-500 text-xs">
                                    <BarChart3 className="w-8 h-8 mb-2 text-zinc-600" />
                                    <span>Run a query to generate data profiling metrics (cardinality, min, max, null counts).</span>
                                </div>
                            )
                        )}
                    </div>
                </div>
            </div>

            {/* ============================================================
                INTERACTIVE "HOW TO USE" MODAL DIALOG
                ============================================================ */}
            {showGuide && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#121215] border border-white/10 rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
                        <button 
                            onClick={() => setShowGuide(false)}
                            className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-[#00f5d4]/10 border border-[#00f5d4]/20 flex items-center justify-center text-[#00f5d4]">
                                <Sparkles className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-white">How to Use DataMorphX</h3>
                                <p className="text-xs text-zinc-400 font-mono">Zero-Upload In-Browser Data Studio</p>
                            </div>
                        </div>

                        <div className="space-y-3 text-xs text-zinc-300">
                            <div className="p-3 rounded-xl bg-[#18181b] border border-white/5 flex gap-3">
                                <span className="w-6 h-6 rounded-full bg-[#00f5d4]/10 text-[#00f5d4] flex items-center justify-center font-bold text-xs shrink-0">1</span>
                                <div>
                                    <strong className="text-white block mb-0.5">Load or Pick Data</strong>
                                    <span>Drop any CSV, Excel (.xlsx), Parquet, or JSON file into the top area, or click one of the demo samples (⚡ NYC Taxi, 📊 Financials, 🛒 Orders). It registers automatically in browser RAM as SQL view <code className="text-[#00f5d4] bg-black/40 px-1 py-0.5 rounded font-mono">data</code>.</span>
                                </div>
                            </div>

                            <div className="p-3 rounded-xl bg-[#18181b] border border-white/5 flex gap-3">
                                <span className="w-6 h-6 rounded-full bg-[#00f5d4]/10 text-[#00f5d4] flex items-center justify-center font-bold text-xs shrink-0">2</span>
                                <div>
                                    <strong className="text-white block mb-0.5">Run SQL in Browser Memory</strong>
                                    <span>Query <code className="text-[#00f5d4] bg-black/40 px-1 py-0.5 rounded font-mono">FROM data</code> in the Monaco editor. Press <kbd className="px-1.5 py-0.5 rounded bg-zinc-800 border border-white/10 font-mono text-[10px]">Ctrl+Enter</kbd> or click <strong>Run Query</strong>. Queries execute directly in DuckDB-WASM in 2-10 milliseconds.</span>
                                </div>
                            </div>

                            <div className="p-3 rounded-xl bg-[#18181b] border border-white/5 flex gap-3">
                                <span className="w-6 h-6 rounded-full bg-[#00f5d4]/10 text-[#00f5d4] flex items-center justify-center font-bold text-xs shrink-0">3</span>
                                <div>
                                    <strong className="text-white block mb-0.5">Inspect &amp; Export Formats</strong>
                                    <span>Browse rows in the Data Grid, check summary stats in the <strong>Profiler</strong> tab, or export directly to Parquet, CSV, Excel, JSON, Markdown, LaTeX, and more using the TableConvert format strip.</span>
                                </div>
                            </div>

                            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-[11px] flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span><strong>100% Private:</strong> Zero data egress. User datasets never leave your browser RAM.</span>
                            </div>
                        </div>

                        <div className="mt-5 flex items-center justify-between">
                            <button 
                                onClick={() => { setShowGuide(false); loadSample(SAMPLE_DATASETS[0]); }}
                                className="text-xs text-[#00f5d4] hover:underline font-mono"
                            >
                                ⚡ Load Taxi Demo Dataset
                            </button>
                            <button 
                                onClick={() => setShowGuide(false)}
                                className="px-4 py-2 bg-[#00f5d4] hover:bg-[#26fedc] text-[#09090b] font-semibold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                            >
                                Got It!
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ============================================================
                GROQ AI API KEY MODAL DIALOG
                ============================================================ */}
            {showKeyModal && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-[#121215] border border-white/10 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl relative animate-in fade-in zoom-in-95">
                        <button 
                            onClick={() => setShowKeyModal(false)}
                            className="absolute top-4 right-4 text-zinc-400 hover:text-white p-1 rounded-lg hover:bg-white/5 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 rounded-xl bg-[#00f5d4]/10 border border-[#00f5d4]/20 flex items-center justify-center text-[#00f5d4]">
                                <Bot className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-white">Groq AI Copilot Setup</h3>
                                <p className="text-xs text-zinc-400 font-mono">Powered by LLaMA 3.3 (70B Versatile)</p>
                            </div>
                        </div>

                        <div className="space-y-3 text-xs text-zinc-300">
                            <p className="leading-relaxed">
                                DataMorphX connects to Groq&apos;s ultra-fast free-tier LLaMA 3.3 engine with dual-key server failover. You can also provide your own personal key below (stored safely in your browser&apos;s local storage).
                            </p>

                            <div className="p-3 rounded-xl bg-[#18181b] border border-white/5">
                                <label className="block text-[11px] font-mono text-zinc-400 mb-1.5">
                                    Custom Groq API Key (Optional)
                                </label>
                                <input
                                    type="password"
                                    placeholder="gsk_..."
                                    defaultValue={customGroqKey}
                                    id="customGroqKeyInput"
                                    className="w-full bg-[#09090b] text-xs font-mono text-zinc-200 px-3 py-2 rounded-lg border border-white/10 focus:border-[#00f5d4] outline-none"
                                />
                                <div className="flex items-center justify-between mt-2 text-[10px] text-zinc-500 font-mono">
                                    <a 
                                        href="https://console.groq.com/keys" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-[#00f5d4] hover:underline"
                                    >
                                        Get free key at console.groq.com →
                                    </a>
                                    <span>Free: 14,400 req/day</span>
                                </div>
                            </div>

                            <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 text-[11px] flex items-center gap-2">
                                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                                <span><strong>100% Privacy Protected:</strong> Only table column names and types are sent to Groq. Your dataset rows and files NEVER leave browser memory.</span>
                            </div>
                        </div>

                        <div className="mt-5 flex items-center justify-between gap-2">
                            <button
                                onClick={() => saveCustomGroqKey('')}
                                className="px-3 py-2 text-zinc-400 hover:text-white text-xs font-mono hover:bg-white/5 rounded-xl transition-colors"
                            >
                                Clear Key (Use Server Keys)
                            </button>
                            <button
                                onClick={() => {
                                    const input = document.getElementById('customGroqKeyInput') as HTMLInputElement;
                                    saveCustomGroqKey(input ? input.value : '');
                                }}
                                className="px-4 py-2 bg-[#00f5d4] hover:bg-[#26fedc] text-[#09090b] font-semibold text-xs rounded-xl shadow-md transition-all cursor-pointer"
                            >
                                Save Key
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
