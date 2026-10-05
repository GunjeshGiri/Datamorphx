import Workbench from '@/components/Workbench';
import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Zap, Terminal, Sparkles, CheckCircle2, Lock } from 'lucide-react';

const INPUT_FORMATS = ['csv', 'tsv', 'json', 'parquet', 'excel'];
const OUTPUT_FORMATS = ['parquet', 'csv', 'json', 'excel', 'html', 'yaml', 'xml', 'latex', 'sql', 'markdown'];

export function generateStaticParams() {
    const params = [];
    for (const from of INPUT_FORMATS) {
        for (const to of OUTPUT_FORMATS) {
            if (from !== to) {
                params.push({ slug: `${from}-to-${to}` });
            }
        }
    }
    return params;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const [from, to] = slug.split('-to-');
    const fromName = from.toUpperCase();
    const toName = to.toUpperCase();
    return {
        title: { absolute: `Convert ${fromName} to ${toName} Online Free - DataMorphX` },
        description: `Instantly convert ${fromName} files to ${toName} directly in your browser. 100% private, zero data upload, and blazing fast via DuckDB-WASM.`,
        alternates: { canonical: `/convert/${slug}` },
    };
}

export default async function ConvertPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const [from, to] = slug.split('-to-');
    const fromName = from.toUpperCase();
    const toName = to.toUpperCase();
    
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'SoftwareApplication',
        'name': `DataMorphX ${fromName} to ${toName} Converter`,
        'operatingSystem': 'Web',
        'applicationCategory': 'UtilitiesApplication',
        'description': `Convert ${fromName} to ${toName} directly in your browser without uploading data.`,
        'offers': {
            '@type': 'Offer',
            'price': '0',
            'priceCurrency': 'USD'
        }
    };
    
    const popularPairs = [
        'csv-to-parquet',
        'excel-to-parquet',
        'json-to-csv',
        'csv-to-sql',
        'parquet-to-csv',
        'json-to-parquet',
        'csv-to-json'
    ].filter(p => p !== slug);

    return (
        <div className="flex flex-col h-full bg-zinc-950 text-zinc-100 overflow-auto font-sans">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            
            {/* Header Hero */}
            <header className="bg-gradient-to-b from-zinc-900/90 via-zinc-950 to-zinc-950 border-b border-zinc-800/80 px-6 py-10 flex flex-col items-center justify-center text-center shrink-0">
                {/* Format Direction Pill */}
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-800 bg-zinc-900/80 mb-4 text-xs font-mono">
                    <span className="font-bold text-indigo-400">{fromName}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="font-bold text-emerald-400">{toName}</span>
                    <span className="ml-1 text-zinc-500">• In-Browser WASM</span>
                </div>

                <h1 className="text-3xl md:text-4xl font-extrabold text-zinc-100 mb-3 tracking-tight">
                    Convert <span className="text-indigo-400">{fromName}</span> to <span className="text-emerald-400">{toName}</span>
                </h1>
                
                <p className="text-zinc-400 max-w-2xl text-sm md:text-base leading-relaxed mb-5">
                    Fast, zero-upload data transformation powered by DuckDB-WASM. Your {fromName} file is processed entirely within your computer&apos;s local memory.
                </p>

                {/* Trust Badges */}
                <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-zinc-400">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800">
                        <Lock className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Zero Server Uploads</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800">
                        <Zap className="w-3.5 h-3.5 text-amber-400" />
                        <span>Sub-Second DuckDB Engine</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-800">
                        <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                        <span>SQL Filtering &amp; Clean-Up</span>
                    </div>
                </div>
            </header>
            
            {/* Interactive Workbench Container */}
            <div className="h-[750px] shrink-0 border-b border-zinc-800/80">
                <Workbench />
            </div>
            
            {/* SEO & Guide Section */}
            <section className="bg-zinc-950 py-16 px-6 shrink-0">
                <div className="max-w-4xl mx-auto space-y-12">
                    {/* How It Works Steps */}
                    <div>
                        <h2 className="text-2xl font-bold text-zinc-100 mb-6 text-center">
                            How to Convert {fromName} to {toName} in 3 Simple Steps
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-5 rounded-xl border border-zinc-800/80 bg-zinc-900/40 relative">
                                <span className="text-2xl font-black text-zinc-700 block mb-2 font-mono">01</span>
                                <h3 className="font-semibold text-zinc-200 text-sm mb-1">Drop Your File</h3>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                    Drag and drop your <strong>.{from}</strong> dataset directly into the workspace above or click to select from disk.
                                </p>
                            </div>

                            <div className="p-5 rounded-xl border border-zinc-800/80 bg-zinc-900/40 relative">
                                <span className="text-2xl font-black text-zinc-700 block mb-2 font-mono">02</span>
                                <h3 className="font-semibold text-zinc-200 text-sm mb-1">Optional SQL Transform</h3>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                    Filter rows, dedupe, trim whitespace, auto-cast currencies, or calculate aggregates using DuckDB SQL.
                                </p>
                            </div>

                            <div className="p-5 rounded-xl border border-zinc-800/80 bg-zinc-900/40 relative">
                                <span className="text-2xl font-black text-zinc-700 block mb-2 font-mono">03</span>
                                <h3 className="font-semibold text-zinc-200 text-sm mb-1">Instant Export</h3>
                                <p className="text-xs text-zinc-400 leading-relaxed">
                                    Select <strong>{toName}</strong> in the export hub and click Download. Converted purely on your local CPU.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Privacy & Technical Disclosure */}
                    <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30 flex flex-col md:flex-row gap-6 items-start">
                        <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-base font-bold text-zinc-100 mb-2">
                                100% Client-Side Privacy: Why DataMorphX is Different
                            </h3>
                            <p className="text-xs text-zinc-400 leading-relaxed mb-3">
                                Traditional online converters upload your raw files to remote cloud servers where they can be cached, logged, or intercepted. 
                                DataMorphX compiles the analytical database <strong>DuckDB into WebAssembly (WASM)</strong>, executing entirely in your browser&apos;s sandboxed Web Worker.
                            </p>
                            <p className="text-xs text-zinc-400 leading-relaxed">
                                Whether you are converting sensitive financial spreadsheets, confidential HIPAA/GDPR customer records, or internal logs, zero bytes ever cross the internet. 
                                Disconnect your Wi-Fi and verify the conversion works 100% offline.
                            </p>
                        </div>
                    </div>

                    {/* CLI Alternative */}
                    <div className="p-6 rounded-2xl border border-zinc-800 bg-zinc-900/30">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Terminal className="w-4 h-4 text-indigo-400" />
                                <h3 className="text-sm font-bold text-zinc-200">Prefer the Command Line?</h3>
                            </div>
                            <span className="text-[11px] font-mono text-zinc-500">pipx install datamorphx</span>
                        </div>
                        <pre className="p-3 rounded-xl bg-zinc-950 font-mono text-xs text-emerald-400 border border-zinc-800/80 overflow-x-auto">
                            dmx convert input.{from} output.{to === 'excel' ? 'xlsx' : to}
                        </pre>
                    </div>

                    {/* Other Popular Conversion Pairs */}
                    <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 mb-3">
                            Popular Converters
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {popularPairs.slice(0, 6).map(pair => {
                                const [pFrom, pTo] = pair.split('-to-');
                                return (
                                    <Link 
                                        key={pair}
                                        href={`/convert/${pair}`}
                                        className="text-xs px-3 py-1.5 rounded-lg border border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors font-mono"
                                    >
                                        {pFrom.toUpperCase()} → {pTo.toUpperCase()}
                                    </Link>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
