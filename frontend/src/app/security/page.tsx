import type { Metadata } from 'next';
import Link from 'next/link';
import { Callout, InfoTable, LegalPage, Section } from '@/components/legal/LegalPage';
import { CopyableCode, OfflineProofChecklist } from '@/components/security/OfflineProof';
import { GITHUB_URL, SECURITY_CONTACT, SITE_NAME } from '@/lib/site';

export const metadata: Metadata = {
    title: 'Security & Trust Center',
    description:
        'Check for yourself that DataMorphX never uploads your data: a 60-second offline test, the architecture, the isolated server API lifecycle, and our vulnerability disclosure policy.',
    alternates: { canonical: '/security' },
};

const TOC = [
    { id: 'overview', label: 'Architecture at a glance' },
    { id: 'offline-proof', label: '60-second offline proof' },
    { id: 'advanced', label: 'Advanced: console monitor' },
    { id: 'api-isolation', label: 'Server API isolation' },
    { id: 'hardening', label: 'Platform hardening' },
    { id: 'disclosure', label: 'Vulnerability disclosure' },
];

const EGRESS_MONITOR = `// Paste into the DevTools Console on the Workbench tab, then use the app.
// Logs every network request the page makes from this moment on.
new PerformanceObserver((list) => {
  for (const e of list.getEntries()) {
    console.warn('[network]', e.initiatorType, e.name, e.transferSize + ' B');
  }
}).observe({ type: 'resource', buffered: false });
console.info('Egress monitor armed. Any request will be logged here.');`;

export default function SecurityPage() {
    return (
        <LegalPage
            eyebrow="Trust Center"
            title="Security & Data Isolation"
            toc={TOC}
            intro={
                <>
                    A guide for security teams, compliance officers and anyone else who&apos;d rather not take our word for it.{' '}
                    {SITE_NAME} is built so that your data <strong className="text-zinc-200">cannot</strong> reach our servers, and you
                    can check this yourself in about a minute.
                </>
            }
        >
            <Section id="overview" title="Architecture at a glance">
                <InfoTable
                    rows={[
                        ['Query engine', 'DuckDB-WASM (WebAssembly), running in a sandboxed browser Web Worker on your device'],
                        ['Where files live', 'In your browser tab’s memory (RAM), read through the standard File API'],
                        ['Exports', 'Written to an in-memory virtual filesystem, then saved by your browser’s download manager'],
                        ['Data sent to DataMorphX servers', <strong key="z" className="text-emerald-400">None (0 bytes)</strong>],
                        ['Engine delivery', 'WASM binaries and workers are self-hosted on our own origin, not loaded from a third-party CDN'],
                        ['Persistence', 'None. Closing or reloading the tab discards all data.'],
                        ['Source code', <a key="g" href={GITHUB_URL} target="_blank" rel="noopener noreferrer">Fully open source (MIT), so you can audit it</a>],
                    ]}
                />
            </Section>

            <Section id="offline-proof" title="The 60-second “offline proof” test">
                <p>
                    If an app can convert your file with the network cable unplugged, it isn&apos;t uploading that file anywhere. Here
                    is how to prove it:
                </p>
                <OfflineProofChecklist />
                <Callout tone="info" title="Why load the page first?">
                    <p>
                        Like any website, the Workbench has to download its <em>code</em> once (the app bundle, the DuckDB-WASM engine
                        and the open-source Monaco editor). That first load contains no user data. Once it&apos;s loaded, every
                        operation runs locally, which is why the test still passes after you disconnect.
                    </p>
                </Callout>
            </Section>

            <Section id="advanced" title="Advanced: live egress monitor">
                <p>
                    For a stricter audit you can stay online and log every network request the page makes. Paste the snippet below into
                    the DevTools Console on the Workbench tab, then drop files, run queries and export. Nothing will be logged, because
                    the Workbench makes no requests while processing data.
                </p>
                <CopyableCode code={EGRESS_MONITOR} label="DevTools Console · JavaScript" />
            </Section>

            <Section id="api-isolation" title="Optional server API: ephemeral isolation">
                <p>
                    The browser Workbench <strong>never</strong> calls our server. For automation and files larger than browser memory,
                    we offer an opt-in REST endpoint (<code>POST /convert</code>), which needs an API key, and an open-source CLI that runs
                    entirely on your own machine. If you choose to use the server API, every request follows this lifecycle:
                </p>
                <ol>
                    <li><strong>Gatekeeping:</strong> the request must carry a valid <code>X-API-Key</code> and is rate-limited per client IP (10 requests/minute).</li>
                    <li><strong>Validation:</strong> the input extension and output format are checked against an allow-list before any data is written.</li>
                    <li><strong>Private scratch space:</strong> a new, randomly named temporary directory is created for this request only (owner-only permissions on POSIX). Nothing is ever shared between requests.</li>
                    <li><strong>Bounded streaming:</strong> the upload is streamed in 1 MB chunks and rejected with <code>HTTP 413</code> as soon as it exceeds the size limit (50 MB by default). The file&apos;s content is also checked against its extension.</li>
                    <li><strong>Conversion:</strong> the file is converted inside that directory. Server file paths are stripped from all responses, and output filenames are sanitised.</li>
                    <li><strong>Destruction:</strong> once the response has been sent, the whole directory is <strong>recursively deleted</strong>. On any error (bad format, oversized file, conversion failure) it is deleted immediately instead.</li>
                </ol>
                <Callout tone="success" title="Zero persistence">
                    <p>
                        No database, object storage, cache or queue ever holds your file. File contents are never written to application
                        logs. The legacy <code>/download?path=</code> endpoint was removed, so no file on the server can be fetched by path.
                    </p>
                </Callout>
            </Section>

            <Section id="hardening" title="Platform hardening">
                <ul>
                    <li>All traffic is served over HTTPS/TLS.</li>
                    <li>Defensive HTTP headers: <code>X-Content-Type-Options: nosniff</code>, <code>Referrer-Policy: strict-origin-when-cross-origin</code>, clickjacking protection (<code>X-Frame-Options: DENY</code>), and a <code>Permissions-Policy</code> that turns off camera, microphone and geolocation.</li>
                    <li>No cookies, no sessions and no accounts, so there are no credentials to steal.</li>
                    <li>Shared query &ldquo;recipes&rdquo; live only in the URL <code>#fragment</code>, which browsers never send to servers.</li>
                    <li>The SQL exporter quotes all identifiers to prevent malformed or injectable DDL.</li>
                </ul>
                <p>
                    See our <Link href="/privacy-policy">Privacy Policy</Link> for the complete list of third parties involved in serving
                    the site.
                </p>
            </Section>

            <Section id="disclosure" title="Vulnerability disclosure policy">
                <p>We welcome reports from security researchers. If you believe you have found a vulnerability:</p>
                <InfoTable
                    rows={[
                        ['Contact', <a key="s" href={`mailto:${SECURITY_CONTACT.email}`}>{SECURITY_CONTACT.email}</a>],
                        ['Acknowledgement', `Within ${SECURITY_CONTACT.acknowledgeWithin}`],
                        ['Machine-readable', <a key="t" href="/.well-known/security.txt">/.well-known/security.txt</a>],
                    ]}
                />
                <h3>Please include</h3>
                <ul>
                    <li>A description of the issue and its potential impact.</li>
                    <li>Step-by-step reproduction instructions or a proof of concept.</li>
                    <li>Affected URLs, endpoints, versions or commits.</li>
                </ul>
                <h3>Our commitment</h3>
                <ul>
                    <li>We will acknowledge your report within {SECURITY_CONTACT.acknowledgeWithin} and keep you updated as we work on a fix.</li>
                    <li>We will credit you publicly once the issue is fixed, unless you prefer to stay anonymous.</li>
                    <li>
                        <strong>Safe harbour:</strong> we will not take legal action against good-faith research that follows this policy,
                        avoids privacy violations and service degradation, accesses no data beyond what is needed to demonstrate the issue,
                        and gives us reasonable time to fix it before public disclosure.
                    </li>
                </ul>
                <h3>Out of scope</h3>
                <ul>
                    <li>Denial-of-service or volumetric testing, social engineering and physical attacks.</li>
                    <li>Reports from automated scanners with no demonstrated impact.</li>
                    <li>Missing best-practice headers with no exploitable consequence.</li>
                </ul>
            </Section>
        </LegalPage>
    );
}
