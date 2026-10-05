import type { ReactNode } from 'react';
import { LEGAL_LAST_UPDATED } from '@/lib/site';

export interface TocItem {
    id: string;
    label: string;
}

/** Shared shell for Privacy, Terms and Security pages (server component). */
export function LegalPage({
    eyebrow,
    title,
    intro,
    toc,
    children,
}: {
    eyebrow: string;
    title: string;
    intro: ReactNode;
    toc: TocItem[];
    children: ReactNode;
}) {
    return (
        <main className="bg-zinc-950 text-zinc-300">
            <div className="mx-auto max-w-6xl px-6 py-16 lg:grid lg:grid-cols-[220px_1fr] lg:gap-12">
                <aside className="hidden lg:block">
                    <nav aria-label="On this page" className="sticky top-20">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">On this page</p>
                        <ul className="space-y-2 border-l border-zinc-800 text-sm">
                            {toc.map((item) => (
                                <li key={item.id}>
                                    <a href={`#${item.id}`} className="-ml-px block border-l border-transparent pl-4 text-zinc-400 transition-colors hover:border-zinc-400 hover:text-zinc-100">
                                        {item.label}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </nav>
                </aside>

                <article className="min-w-0">
                    <header className="mb-12 border-b border-zinc-800 pb-8">
                        <p className="mb-2 text-sm font-medium text-emerald-400">{eyebrow}</p>
                        <h1 className="mb-4 text-4xl font-bold tracking-tight text-zinc-50">{title}</h1>
                        <div className="text-lg leading-relaxed text-zinc-400">{intro}</div>
                        <p className="mt-6 text-xs text-zinc-500">Last updated: {LEGAL_LAST_UPDATED}</p>
                    </header>
                    <div className="space-y-14">{children}</div>
                </article>
            </div>
        </main>
    );
}

export function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
    return (
        <section id={id} className="scroll-mt-20">
            <h2 className="mb-5 text-2xl font-semibold tracking-tight text-zinc-100">{title}</h2>
            <div className="space-y-4 leading-relaxed [&_a]:text-emerald-400 [&_a]:underline-offset-4 hover:[&_a]:underline [&_code]:rounded [&_code]:bg-zinc-800 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em] [&_code]:text-zinc-200 [&_h3]:mt-8 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-zinc-200 [&_li]:pl-1 [&_ol]:list-decimal [&_ol]:space-y-2 [&_ol]:pl-6 [&_strong]:text-zinc-100 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-6">
                {children}
            </div>
        </section>
    );
}

const CALLOUT_STYLES = {
    info: 'border-sky-500/30 bg-sky-500/5',
    success: 'border-emerald-500/30 bg-emerald-500/5',
    warning: 'border-amber-500/30 bg-amber-500/5',
} as const;

export function Callout({ tone = 'info', title, children }: { tone?: keyof typeof CALLOUT_STYLES; title?: string; children: ReactNode }) {
    return (
        <div className={`rounded-lg border p-5 ${CALLOUT_STYLES[tone]}`}>
            {title && <p className="mb-2 font-semibold text-zinc-100">{title}</p>}
            <div className="space-y-2 text-sm leading-relaxed text-zinc-300">{children}</div>
        </div>
    );
}

/** Two-column definition table, used for contact blocks and data inventories. */
export function InfoTable({ rows }: { rows: [ReactNode, ReactNode][] }) {
    return (
        <div className="overflow-hidden rounded-lg border border-zinc-800">
            <table className="w-full text-left text-sm">
                <tbody className="divide-y divide-zinc-800">
                    {rows.map(([k, v], i) => (
                        <tr key={i} className="align-top">
                            <th scope="row" className="w-1/3 bg-zinc-900/60 px-4 py-3 font-medium text-zinc-400">{k}</th>
                            <td className="px-4 py-3 text-zinc-200">{v}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
