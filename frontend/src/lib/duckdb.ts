import * as duckdb from '@duckdb/duckdb-wasm';
import * as arrow from 'apache-arrow';

const MANUAL_BUNDLES: duckdb.DuckDBBundles = {
    mvp: {
        mainModule: '/duckdb-wasm/duckdb-mvp.wasm',
        mainWorker: '/duckdb-wasm/duckdb-browser-mvp.worker.js',
    },
    eh: {
        mainModule: '/duckdb-wasm/duckdb-eh.wasm',
        mainWorker: '/duckdb-wasm/duckdb-browser-eh.worker.js',
    },
};

let dbPromise: Promise<duckdb.AsyncDuckDB> | null = null;
let globalConnPromise: Promise<duckdb.AsyncDuckDBConnection> | null = null;

export async function getDuckDB(): Promise<duckdb.AsyncDuckDB> {
    if (dbPromise) return dbPromise;

    dbPromise = (async () => {
        const bundle = await duckdb.selectBundle(MANUAL_BUNDLES);
        const worker = new Worker(bundle.mainWorker!);
        const logger = new duckdb.ConsoleLogger();
        const db = new duckdb.AsyncDuckDB(logger, worker);
        await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
        return db;
    })();

    return dbPromise;
}

export async function getDuckDBConnection(): Promise<duckdb.AsyncDuckDBConnection> {
    if (globalConnPromise) return globalConnPromise;
    globalConnPromise = (async () => {
        const db = await getDuckDB();
        return await db.connect();
    })();
    return globalConnPromise;
}

export async function queryDuckDB(sql: string): Promise<arrow.Table> {
    const conn = await getDuckDBConnection();
    return await conn.query(sql) as any;
}

export async function registerFile(file: File): Promise<string> {
    const db = await getDuckDB();
    const fileName = file.name;
    await db.registerFileHandle(fileName, file, duckdb.DuckDBDataProtocol.BROWSER_FILEREADER, true);
    return fileName;
}

export async function registerFileText(fileName: string, text: string): Promise<string> {
    const db = await getDuckDB();
    await db.registerFileText(fileName, text);
    return fileName;
}

export async function exportQuery(sql: string, format: string, options: string = ''): Promise<Uint8Array> {
    const db = await getDuckDB();
    const conn = await getDuckDBConnection();
    
    // Create a safe temp filename based on timestamp
    const outFileName = `export_${Date.now()}.${format}`;
    
    // Strip trailing semicolons from the query to prevent parser errors in COPY
    const cleanSql = sql.trim().replace(/;+$/, '');
    
    try {
        // Run the copy command
        await conn.query(`COPY (${cleanSql}) TO '${outFileName}' ${options}`);
        // Read the file out of the virtual filesystem
        const buffer = await db.copyFileToBuffer(outFileName);
        return buffer;
    } finally {
        // Clean up the virtual file
        await db.dropFile(outFileName);
    }
}
