import type { Metadata } from 'next';
import Link from 'next/link';
import { Callout, InfoTable, LegalPage, Section } from '@/components/legal/LegalPage';
import { GRIEVANCE_OFFICER, SITE_NAME } from '@/lib/site';

export const metadata: Metadata = {
    title: 'Privacy Policy',
    description:
        'How DataMorphX protects your data: 100% in-browser processing with DuckDB-WASM, zero file uploads, and compliance with India DPDPA 2023, IT Rules 2021, EU GDPR and California CCPA/CPRA.',
    alternates: { canonical: '/privacy-policy' },
};

const TOC = [
    { id: 'summary', label: 'Summary' },
    { id: 'architecture', label: 'Zero-data-transfer architecture' },
    { id: 'what-we-collect', label: 'What we do (and don’t) collect' },
    { id: 'dpdpa', label: 'India: DPDPA 2023 & IT Rules' },
    { id: 'grievance', label: 'Grievance Officer' },
    { id: 'gdpr', label: 'EU & UK GDPR' },
    { id: 'ccpa', label: 'California: CCPA / CPRA' },
    { id: 'telemetry', label: 'Telemetry, cookies & analytics' },
    { id: 'third-parties', label: 'Third-party services' },
    { id: 'api', label: 'Optional server API' },
    { id: 'children', label: 'Children' },
    { id: 'changes', label: 'Changes to this policy' },
];

export default function PrivacyPolicyPage() {
    const g = GRIEVANCE_OFFICER;
    return (
        <LegalPage
            eyebrow="Legal"
            title="Privacy Policy"
            toc={TOC}
            intro={
                <>
                    {SITE_NAME} runs its data workbench entirely inside your web browser. Your files are not uploaded to us. This
                    policy describes exactly what that means technically, and how it maps onto India&apos;s Digital Personal Data
                    Protection Act 2023, the IT Rules 2021, the EU/UK GDPR and the California CCPA/CPRA.
                </>
            }
        >
            <Section id="summary" title="Summary">
                <Callout tone="success" title="The short version">
                    <ul className="list-disc space-y-1 pl-5">
                        <li>Files you open in the Workbench are read and processed in your browser&apos;s memory. They are never sent to our servers.</li>
                        <li>We do not use cookies, advertising trackers or analytics scripts.</li>
                        <li>We do not sell or share personal information, and we have nothing to sell.</li>
                        <li>The only personal data we receive is what you choose to send us (for example, an email to our Grievance Officer) and standard request logs kept by our hosting provider.</li>
                    </ul>
                </Callout>
            </Section>

            <Section id="architecture" title="1. Zero-data-transfer architecture">
                <p>
                    The {SITE_NAME} Workbench embeds <strong>DuckDB-WASM</strong>, an analytical database compiled to WebAssembly.
                    The database engine is downloaded once as static code and then runs locally on your device, inside a sandboxed
                    browser Web Worker.
                </p>
                <ul>
                    <li><strong>File access:</strong> when you drop a file, the browser hands it to the local engine through the standard File API. The bytes stay in your browser tab&apos;s memory (RAM).</li>
                    <li><strong>SQL queries, profiling, diffing and joins</strong> all run on that local engine.</li>
                    <li><strong>Exports</strong> (Parquet, CSV, JSON, Excel, SQL and so on) are written to the engine&apos;s in-memory virtual filesystem and handed straight to your browser&apos;s download manager.</li>
                    <li><strong>Shareable recipes:</strong> when you share a query, the SQL text is compressed into the URL <code>#fragment</code>. Browsers never send fragments to web servers, so the query is never seen by us or written to any server log. It contains only your SQL, never your data.</li>
                    <li>Closing or refreshing the tab discards everything. We keep no copy.</li>
                </ul>
                <p>
                    No customer dataset is transmitted to, stored on or inspected by {SITE_NAME} servers. You can check this yourself
                    in about 60 seconds using our <Link href="/security#offline-proof">offline proof test</Link>.
                </p>
            </Section>

            <Section id="what-we-collect" title="2. What we do (and don’t) collect">
                <InfoTable
                    rows={[
                        ['Files, datasets, query results', 'Never collected. Processed only on your device.'],
                        ['SQL queries', 'Never collected. Kept in your browser and, if you share a recipe, in the URL fragment.'],
                        ['Accounts / sign-up data', 'None. The Workbench needs no account.'],
                        ['Cookies & tracking identifiers', 'None set by DataMorphX.'],
                        ['Hosting request logs', 'IP address, user agent, requested URL and timestamp are processed by our hosting provider for security and abuse prevention, then deleted under the provider’s retention schedule. These logs never contain your file contents.'],
                        ['Correspondence', 'If you email us, we keep your email address and message for as long as we need them to handle your request and meet our legal obligations.'],
                        ['API keys (optional server API)', 'If you are issued an API key, we keep the key and the contact details linked to it.'],
                    ]}
                />
            </Section>

            <Section id="dpdpa" title="3. India: DPDPA 2023 & IT Rules 2021">
                <p>
                    Under the Digital Personal Data Protection Act, 2023 (&ldquo;DPDPA&rdquo;), a <strong>Data Fiduciary</strong> is the
                    person who decides the purpose and means of processing personal data.
                </p>
                <ul>
                    <li>
                        <strong>Workbench data:</strong> {SITE_NAME} does not process, store or profile any personal data contained in
                        files you open in the Workbench. That processing happens entirely on your own device and under your control, so we
                        are neither a Data Fiduciary nor a Data Processor for that data. If your files contain other people&apos;s
                        personal data, you remain responsible for having a lawful basis to process it.
                    </li>
                    <li>
                        <strong>Limited operational data:</strong> for the small amount of personal data we do receive (correspondence,
                        API key contact details and hosting logs), we act as a Data Fiduciary. We process it only for the purpose for which
                        it was provided, under Section 4 (consent or legitimate use) and Section 7 of the DPDPA.
                    </li>
                    <li>
                        <strong>Your rights as a Data Principal</strong> (Sections 11–14): you can ask for a summary of the personal data
                        we hold about you, ask us to correct or erase it, nominate another person to exercise your rights, and raise a
                        grievance. Email the Grievance Officer below.
                    </li>
                    <li>
                        <strong>Data security (Section 8(5)):</strong> we limit what we collect, encrypt all traffic in transit with
                        HTTPS/TLS, and remove the main risk entirely by never receiving your files.
                    </li>
                    <li>
                        If we do not resolve your grievance to your satisfaction, you may complain to the <strong>Data Protection Board of India</strong>.
                    </li>
                </ul>
            </Section>

            <Section id="grievance" title="4. Grievance Officer">
                <p>
                    As required by Section 13 of the DPDPA and Rule 3(2) of the Information Technology (Intermediary Guidelines and
                    Digital Media Ethics Code) Rules, 2021, you can contact our Grievance Officer with any complaint or request:
                </p>
                <InfoTable
                    rows={[
                        ['Name', g.name],
                        ['Designation', g.designation],
                        ['Email', <a key="e" href={`mailto:${g.email}`}>{g.email}</a>],
                        ['Postal address', g.address],
                        ['Acknowledgement', `Within ${g.acknowledgeWithin} of receipt`],
                        ['Resolution', `Within ${g.resolveWithin} of receipt`],
                    ]}
                />
                <p className="text-sm text-zinc-500">
                    To help us respond quickly, include your name, a contact email, and a clear description of the request or
                    complaint (with URLs where relevant).
                </p>
            </Section>

            <Section id="gdpr" title="5. EU GDPR (2016/679) & UK GDPR">
                <ul>
                    <li>
                        <strong>Article 25 (data protection by design and by default):</strong> the client-side execution model is a
                        technical safeguard, not just a policy promise. Because the data never leaves your device, we cannot access,
                        lose or disclose it.
                    </li>
                    <li>
                        <strong>Not a processor for your files (Article 28):</strong> no workbench data is ever sent to us, so{' '}
                        {SITE_NAME} does not act as a Data Processor for it and no Data Processing Agreement is needed to use the
                        Workbench. For the same reason, using the Workbench involves no international transfer of that data under
                        Chapter V.
                    </li>
                    <li>
                        <strong>Controller for limited data:</strong> for correspondence and hosting logs we are the controller. Our
                        lawful basis is legitimate interests (Article 6(1)(f)): running a secure service and answering your messages.
                    </li>
                    <li>
                        <strong>Your rights (Articles 15–22):</strong> access, rectification, erasure, restriction, portability and
                        objection. Contact the Grievance Officer to use them. You may also complain to your local supervisory authority
                        (in the UK, the ICO).
                    </li>
                </ul>
            </Section>

            <Section id="ccpa" title="6. California: CCPA / CPRA">
                <Callout tone="success" title="Do Not Sell or Share My Personal Information">
                    <p>
                        {SITE_NAME} does not sell or share personal information, as those terms are defined by the California Consumer
                        Privacy Act as amended by the CPRA. We do not collect, monetise or sell your files, their contents or metadata
                        about them, and we do not do cross-context behavioural advertising. You do not need to opt out because there is
                        nothing to opt out of.
                    </p>
                </Callout>
                <p>
                    California residents have the right to know, delete and correct personal information, and to limit the use of
                    sensitive personal information. We will not discriminate against you for exercising these rights. To submit a
                    request, email <a href={`mailto:${g.email}`}>{g.email}</a>.
                </p>
            </Section>

            <Section id="telemetry" title="7. Telemetry, cookies & analytics">
                <ul>
                    <li><strong>No cookies:</strong> {SITE_NAME} sets no cookies, first-party or third-party. You won&apos;t see a cookie banner because none is needed.</li>
                    <li><strong>No analytics or advertising scripts:</strong> we do not currently use Google Analytics, pixels, session replay or any similar tracking.</li>
                    <li><strong>No product telemetry:</strong> the Workbench does not report which files you open, which queries you run or which formats you export.</li>
                    <li>
                        If we ever add analytics, we will only use privacy-preserving, cookie-less, aggregate-only tools that collect no
                        personal identifiers. We will update this policy and the &ldquo;Last updated&rdquo; date before doing so.
                    </li>
                </ul>
            </Section>

            <Section id="third-parties" title="8. Third-party services">
                <p>To be fully transparent, these are the only third parties involved in delivering the site:</p>
                <InfoTable
                    rows={[
                        ['Hosting / CDN provider', 'Serves the website’s static files and processes standard request logs (see section 2). It never receives your file contents.'],
                        ['jsDelivr (cdn.jsdelivr.net)', 'Delivers the open-source Monaco code editor library when the Workbench loads. Like any web request, this exposes your IP address and user agent to jsDelivr. No file contents or queries are sent.'],
                    ]}
                />
                <p>The DuckDB-WASM engine and its workers are served from our own domain, not a third-party CDN.</p>
            </Section>

            <Section id="api" title="9. Optional server API & CLI">
                <p>
                    Separately from the Workbench, we offer an optional REST API (<code>/convert</code>) and an open-source command-line
                    tool for files too large for a browser. The <strong>CLI runs entirely on your own machine</strong>. If you choose to
                    use the <strong>server API</strong>, your file is sent to the API server for the length of a single request and
                    then permanently deleted. Nothing is retained. The full lifecycle is documented on the{' '}
                    <Link href="/security#api-isolation">Security page</Link>. The API is opt-in and the browser Workbench never calls it.
                </p>
            </Section>

            <Section id="children" title="10. Children">
                <p>
                    {SITE_NAME} is a professional data tool and is not directed at children. We do not knowingly process personal data
                    of children (anyone under 18 under the DPDPA) and we do not track, behaviourally monitor or target advertising at
                    them. If you believe a child has sent us personal data, contact the Grievance Officer and we will delete it.
                </p>
            </Section>

            <Section id="changes" title="11. Changes to this policy">
                <p>
                    If we change this policy we will update the &ldquo;Last updated&rdquo; date above. If a change materially affects how
                    we handle personal data, we will announce it prominently on the site before it takes effect. The full history of this
                    page is public in our open-source repository.
                </p>
            </Section>
        </LegalPage>
    );
}
