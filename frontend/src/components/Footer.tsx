import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';
import { GITHUB_URL, SITE_NAME } from '@/lib/site';
import { GitHubIcon } from './GitHubIcon';

const LINKS = [
    { href: '/privacy-policy', label: 'Privacy Policy' },
    { href: '/terms-of-service', label: 'Terms of Service' },
    { href: '/security', label: 'Security' },
];

export default function Footer() {
    return (
        <footer className="shrink-0 border-t border-zinc-800 bg-zinc-950 text-sm text-zinc-500">
            <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-8 md:flex-row md:items-center md:justify-between">
                <div className="space-y-2">
                    <p className="font-semibold text-zinc-300">{SITE_NAME}</p>
                    <p className="flex items-center gap-1.5 text-xs text-zinc-500">
                        <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" aria-hidden />
                        Compliant with DPDPA 2023 &amp; GDPR • 100% In-Browser Execution
                    </p>
                </div>

                <nav aria-label="Legal" className="flex flex-wrap items-center gap-x-6 gap-y-3">
                    {LINKS.map((l) => (
                        <Link key={l.href} href={l.href} className="transition-colors hover:text-zinc-200">
                            {l.label}
                        </Link>
                    ))}
                    <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 transition-colors hover:text-zinc-200">
                        <GitHubIcon className="h-4 w-4" />
                        GitHub
                    </a>
                </nav>
            </div>
            <div className="border-t border-zinc-900 py-4 text-center text-xs text-zinc-600">
                © {new Date().getFullYear()} {SITE_NAME}. Open source under the MIT License.
            </div>
        </footer>
    );
}
