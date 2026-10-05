'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, Sparkles, Terminal, FileCode2, ArrowUpRight } from 'lucide-react';
import { GITHUB_URL, SITE_NAME } from '@/lib/site';
import { GitHubIcon } from './GitHubIcon';

export const NAVBAR_HEIGHT_CLASS = 'h-14';

export default function Navbar() {
    const pathname = usePathname();

    return (
        <header className={`sticky top-0 z-40 ${NAVBAR_HEIGHT_CLASS} shrink-0 border-b border-zinc-800/80 bg-zinc-950/90 backdrop-blur-md supports-[backdrop-filter]:bg-zinc-950/75`}>
            <nav className="flex h-full items-center justify-between gap-4 px-4 sm:px-6 max-w-7xl mx-auto">
                {/* Logo & Brand */}
                <div className="flex items-center gap-6">
                    <Link href="/" className="group flex items-center gap-2.5">
                        <div className="relative flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 via-indigo-500 to-violet-600 p-0.5 shadow-md shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow">
                            <div className="flex h-full w-full items-center justify-center rounded-[7px] bg-zinc-950 transition-colors group-hover:bg-zinc-900">
                                <Sparkles className="h-4 w-4 text-blue-400 group-hover:rotate-12 transition-transform" />
                            </div>
                        </div>
                        <div className="flex flex-col">
                            <span className="bg-gradient-to-r from-zinc-100 via-blue-200 to-indigo-300 bg-clip-text text-base font-bold tracking-tight text-transparent">
                                {SITE_NAME}
                            </span>
                            <span className="text-[10px] font-medium text-zinc-500 -mt-1 tracking-wider uppercase">
                                Browser Data Lab
                            </span>
                        </div>
                    </Link>

                    {/* Nav Links */}
                    <div className="hidden md:flex items-center gap-1 text-xs font-medium">
                        <Link 
                            href="/" 
                            className={`px-3 py-1.5 rounded-md transition-colors ${
                                pathname === '/' 
                                    ? 'text-zinc-100 bg-zinc-900 border border-zinc-800' 
                                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                            }`}
                        >
                            Workbench
                        </Link>
                        <Link 
                            href="/convert/csv-to-parquet" 
                            className={`px-3 py-1.5 rounded-md transition-colors ${
                                pathname?.startsWith('/convert') 
                                    ? 'text-zinc-100 bg-zinc-900 border border-zinc-800' 
                                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                            }`}
                        >
                            All Converters
                        </Link>
                        <Link 
                            href="/security" 
                            className={`px-3 py-1.5 rounded-md transition-colors ${
                                pathname === '/security' 
                                    ? 'text-zinc-100 bg-zinc-900 border border-zinc-800' 
                                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/50'
                            }`}
                        >
                            Security &amp; Audit
                        </Link>
                    </div>
                </div>

                {/* Right Badges & Actions */}
                <div className="flex items-center gap-2.5 sm:gap-4">
                    {/* Zero-Upload Trust Badge */}
                    <Link
                        href="/security"
                        title="100% In-Browser Sandbox: DuckDB-WASM runs in your browser RAM. 0 bytes uploaded to servers."
                        className="group inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400 transition-all hover:border-emerald-400/60 hover:bg-emerald-500/15 hover:text-emerald-300 shadow-sm shadow-emerald-950"
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" aria-hidden />
                        <span className="hidden sm:inline">Zero-Upload Sandbox</span>
                        <span className="sm:hidden">Private</span>
                    </Link>

                    {/* CLI Link */}
                    <Link
                        href="/security#api-isolation"
                        className="hidden lg:inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors rounded-md hover:bg-zinc-900 border border-transparent hover:border-zinc-800"
                        title="CLI: pipx install datamorphx"
                    >
                        <Terminal className="h-3.5 w-3.5 text-indigo-400" />
                        <span>CLI</span>
                    </Link>

                    {/* GitHub Repo */}
                    <a
                        href={GITHUB_URL}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="DataMorphX on GitHub"
                        className="flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-zinc-300 hover:text-zinc-100 bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 rounded-md transition-all shadow-sm"
                    >
                        <GitHubIcon className="h-3.5 w-3.5" />
                        <span className="hidden sm:inline">GitHub</span>
                        <ArrowUpRight className="h-3 w-3 text-zinc-500" />
                    </a>
                </div>
            </nav>
        </header>
    );
}
