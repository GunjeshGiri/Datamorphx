'use client';

import { useState } from 'react';
import { Check, Copy, ExternalLink } from 'lucide-react';

interface Step {
    title: string;
    detail: React.ReactNode;
}

const STEPS: Step[] = [
    {
        title: 'Open the Workbench and wait for it to load',
        detail: (
            <>
                Open the <a href="/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-emerald-400 hover:underline">Workbench <ExternalLink className="h-3 w-3" /></a>{' '}
                in a new tab and wait for the SQL editor to appear. This one-time load downloads the application code and the
                DuckDB-WASM engine. No data is involved yet.
            </>
        ),
    },
    {
        title: 'Open DevTools → Network tab, then clear it',
        detail: (
            <>
                Press <Kbd>F12</Kbd> (Windows/Linux) or <Kbd>⌘</Kbd> <Kbd>⌥</Kbd> <Kbd>I</Kbd> (macOS) and choose the{' '}
                <strong>Network</strong> tab. Tick <strong>Preserve log</strong>, then click the 🚫 clear button so the list is empty.
            </>
        ),
    },
    {
        title: 'Disconnect from the internet',
        detail: (
            <>
                Turn on Airplane Mode, unplug Ethernet or disable Wi-Fi. (Alternatively, set the Network tab&apos;s throttling
                dropdown to <strong>Offline</strong>.)
            </>
        ),
    },
    {
        title: 'Drop a file, run SQL and export',
        detail: (
            <>
                Drag a CSV, Excel, JSON or Parquet file into the Workspace, run a query such as{' '}
                <code className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-xs text-zinc-200">SELECT * FROM data LIMIT 100</code>,
                open the Profiler, then download an export in any format.
            </>
        ),
    },
    {
        title: 'Check the Network tab: zero outbound requests',
        detail: (
            <>
                Everything worked with no internet connection, and the Network tab shows <strong>no requests</strong> carrying your
                file. Any <code className="rounded bg-zinc-800 px-1.5 py-0.5 font-mono text-xs text-zinc-200">blob:</code> entries are
                local in-memory download URLs created by your own browser, not network traffic.
            </>
        ),
    },
];

function Kbd({ children }: { children: React.ReactNode }) {
    return <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-0.5 font-mono text-xs text-zinc-200">{children}</kbd>;
}

export function OfflineProofChecklist() {
    const [done, setDone] = useState<boolean[]>(() => STEPS.map(() => false));
    const completed = done.filter(Boolean).length;
    const allDone = completed === STEPS.length;

    const toggle = (i: number) => setDone((prev) => prev.map((v, j) => (j === i ? !v : v)));

    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/40">
            <div className="flex items-center justify-between gap-4 border-b border-zinc-800 px-5 py-4">
                <div>
                    <p className="font-semibold text-zinc-100">The 60-second offline proof</p>
                    <p className="text-sm text-zinc-500">Tick each step as you go.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="h-2 w-28 overflow-hidden rounded-full bg-zinc-800" aria-hidden>
                        <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${(completed / STEPS.length) * 100}%` }} />
                    </div>
                    <span className="text-sm tabular-nums text-zinc-400">{completed}/{STEPS.length}</span>
                    {completed > 0 && (
                        <button onClick={() => setDone(STEPS.map(() => false))} className="text-xs text-zinc-500 hover:text-zinc-200">
                            Reset
                        </button>
                    )}
                </div>
            </div>

            <ol className="divide-y divide-zinc-800">
                {STEPS.map((step, i) => (
                    <li key={step.title} className="flex gap-4 px-5 py-4">
                        <button
                            type="button"
                            role="checkbox"
                            aria-checked={done[i]}
                            aria-label={`Mark step ${i + 1} as done`}
                            onClick={() => toggle(i)}
                            className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold transition-colors ${
                                done[i] ? 'border-emerald-500 bg-emerald-500 text-zinc-950' : 'border-zinc-600 text-zinc-400 hover:border-zinc-400'
                            }`}
                        >
                            {done[i] ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
                        </button>
                        <div className={done[i] ? 'opacity-60' : ''}>
                            <p className={`font-medium text-zinc-100 ${done[i] ? 'line-through decoration-zinc-500' : ''}`}>{step.title}</p>
                            <p className="mt-1 text-sm leading-relaxed text-zinc-400">{step.detail}</p>
                        </div>
                    </li>
                ))}
            </ol>

            {allDone && (
                <div className="border-t border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-300">
                    ✓ Verified: you converted a file with no network connection. Your data never left this device.
                </div>
            )}
        </div>
    );
}

export function CopyableCode({ code, label }: { code: string; label?: string }) {
    const [copied, setCopied] = useState(false);
    const copy = async () => {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };
    return (
        <div className="overflow-hidden rounded-lg border border-zinc-800 bg-zinc-900">
            <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
                <span className="text-xs text-zinc-500">{label ?? 'Console'}</span>
                <button onClick={copy} className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-100">
                    {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                </button>
            </div>
            <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-zinc-300"><code>{code}</code></pre>
        </div>
    );
}
