import type { Metadata } from 'next';
import Link from 'next/link';
import { Callout, LegalPage, Section } from '@/components/legal/LegalPage';
import { GITHUB_URL, GOVERNING_JURISDICTION, GRIEVANCE_OFFICER, SITE_NAME } from '@/lib/site';

export const metadata: Metadata = {
    title: 'Terms of Service',
    description:
        'Terms of Service for DataMorphX, the in-browser data converter and SQL workbench. Covers acceptable use under Section 79 of the IT Act, warranties, limitation of liability and governing law (New Delhi, India).',
    alternates: { canonical: '/terms-of-service' },
};

const TOC = [
    { id: 'acceptance', label: 'Acceptance' },
    { id: 'service', label: 'The service' },
    { id: 'acceptable-use', label: 'Acceptable use (IT Act s.79)' },
    { id: 'license', label: 'Software license' },
    { id: 'warranty', label: '“As-is” disclaimer' },
    { id: 'liability', label: 'Limitation of liability' },
    { id: 'indemnity', label: 'Indemnity' },
    { id: 'api', label: 'API keys & fair use' },
    { id: 'termination', label: 'Suspension & termination' },
    { id: 'law', label: 'Governing law & jurisdiction' },
    { id: 'misc', label: 'General' },
];

export default function TermsOfServicePage() {
    return (
        <LegalPage
            eyebrow="Legal"
            title="Terms of Service"
            toc={TOC}
            intro={<>These terms govern your use of the {SITE_NAME} website, browser Workbench, REST API and command-line tools (together, the &ldquo;Service&rdquo;). Please read them carefully.</>}
        >
            <Section id="acceptance" title="1. Acceptance">
                <p>
                    By using the Service you agree to these Terms and to our <Link href="/privacy-policy">Privacy Policy</Link>. If you
                    use the Service on behalf of an organisation, you confirm you have authority to bind that organisation. If you do not
                    agree, do not use the Service.
                </p>
            </Section>

            <Section id="service" title="2. The service">
                <p>
                    The Workbench is a tool that runs on <strong>your</strong> device. {SITE_NAME} supplies the software, and every file
                    transformation is carried out locally in your browser, under your direction. We do not see, host, store, select or
                    change the data you process. You alone decide which data to process and how.
                </p>
            </Section>

            <Section id="acceptable-use" title="3. Acceptable use & intermediary due diligence">
                <p>
                    {SITE_NAME} acts as an intermediary within the meaning of Section 2(1)(w) of the Information Technology Act, 2000 and
                    follows the due-diligence requirements of the IT (Intermediary Guidelines and Digital Media Ethics Code) Rules,
                    2021 in order to keep the safe-harbour protection of <strong>Section 79</strong>. In line with Rule 3(1)(b), you
                    agree <strong>not</strong> to use the Service to host, display, upload, modify, publish, transmit, store, update,
                    share, parse, process or manipulate any information that:
                </p>
                <ol>
                    <li>belongs to another person and you have no right to;</li>
                    <li>contains personal data that was obtained, or is processed, without the consent or lawful basis required by law, including non-consensual intimate imagery or leaked or breached personal datasets;</li>
                    <li>is used to <strong>re-identify or de-anonymise</strong> individuals from anonymised or pseudonymised datasets, or to profile, stalk or harass any person;</li>
                    <li>is obscene, pornographic, paedophilic, invasive of privacy, or harmful to children;</li>
                    <li>infringes any patent, trademark, copyright or other proprietary right;</li>
                    <li>contains <strong>malware</strong>, viruses or any code designed to interrupt, damage or limit the functioning of any computer resource;</li>
                    <li>threatens the unity, integrity, defence, security or sovereignty of India, friendly relations with foreign states, or public order, or includes material restricted or classified by any government;</li>
                    <li>is deceptive, fraudulent or patently false, or is used for money laundering or financial fraud;</li>
                    <li>otherwise violates any law in force in India or in your jurisdiction.</li>
                </ol>
                <p>You also agree not to attack, overload, probe or reverse-engineer our hosted infrastructure, or get around rate limits or access controls.</p>
                <p>
                    To report a violation, contact our Grievance Officer at{' '}
                    <a href={`mailto:${GRIEVANCE_OFFICER.email}`}>{GRIEVANCE_OFFICER.email}</a>. We will act on valid notices and court or
                    government orders within the time limits set by the IT Rules.
                </p>
            </Section>

            <Section id="license" title="4. Software license">
                <p>
                    The {SITE_NAME} source code is open source under the MIT License, available in our{' '}
                    <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">GitHub repository</a>. Your use of the source code is
                    governed by that license. These Terms additionally govern your use of the hosted Service (the website and API). The
                    {' '}{SITE_NAME} name and logo are not licensed under the MIT License.
                </p>
                <p>You keep all rights to your data. We claim no ownership or license over any file you process.</p>
            </Section>

            <Section id="warranty" title="5. “As-is” disclaimer of warranties">
                <Callout tone="warning" title="Always verify your output">
                    <p>
                        Data conversion involves type inference, encoding detection, rounding and format-specific limits. Before using
                        any converted output in production, regulatory filings, financial reporting or other critical work,{' '}
                        <strong>check schemas, row counts, numeric precision, dates and financial figures</strong> against your source.
                    </p>
                </Callout>
                <p className="uppercase text-sm tracking-wide text-zinc-400">
                    To the maximum extent permitted by law, the Service is provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo;,
                    without warranties of any kind, whether express, implied or statutory, including warranties of merchantability,
                    fitness for a particular purpose, accuracy, completeness, non-infringement, or uninterrupted or error-free operation.
                    We do not warrant that any transformation, conversion, type cast or export will be correct or lossless.
                </p>
            </Section>

            <Section id="liability" title="6. Limitation of liability">
                <p className="uppercase text-sm tracking-wide text-zinc-400">
                    To the maximum extent permitted by law, {SITE_NAME}, its contributors and maintainers will not be liable for any
                    indirect, incidental, special, consequential, exemplary or punitive damages, or for any loss of data, profits,
                    revenue, goodwill or business opportunity, arising out of or relating to the Service, whether in contract, tort
                    (including negligence) or otherwise, even if advised that such damages were possible.
                </p>
                <p className="uppercase text-sm tracking-wide text-zinc-400">
                    Our total aggregate liability for all claims relating to the Service is limited to the greater of (a) the amount
                    you paid us for the Service in the twelve (12) months before the claim, or (b) INR 5,000 (five thousand Indian rupees).
                </p>
                <p>
                    Because files are processed on your device, you are responsible for keeping your own backups of source data. Nothing
                    in these Terms excludes liability that cannot be excluded under applicable law, including liability for fraud or
                    for death or personal injury caused by negligence.
                </p>
            </Section>

            <Section id="indemnity" title="7. Indemnity">
                <p>
                    You agree to indemnify and hold harmless {SITE_NAME} and its maintainers against any claims, losses and expenses
                    (including reasonable legal fees) arising from your breach of these Terms, your violation of any law, or the data
                    you choose to process with the Service.
                </p>
            </Section>

            <Section id="api" title="8. API keys & fair use">
                <ul>
                    <li>API keys are personal to you. Keep them confidential, and do not share or resell them.</li>
                    <li>The API applies rate limits and file-size limits. Do not try to get around them.</li>
                    <li>We may revoke a key that is used abusively or in breach of these Terms.</li>
                </ul>
            </Section>

            <Section id="termination" title="9. Suspension & termination">
                <p>
                    We may suspend or end access to the hosted Service (for example, by revoking an API key or blocking abusive
                    traffic) if you breach these Terms or if the law requires it. You can stop using the Service at any time. Sections 4
                    to 7 and 10 continue to apply after termination.
                </p>
            </Section>

            <Section id="law" title="10. Governing law & jurisdiction">
                <p>
                    These Terms are governed by the laws of the Republic of India, without regard to its conflict-of-laws rules. Subject
                    to any mandatory consumer-protection rights you have where you live, the courts at{' '}
                    <strong>{GOVERNING_JURISDICTION}</strong> have exclusive jurisdiction over any dispute arising out of or relating to
                    these Terms or the Service.
                </p>
            </Section>

            <Section id="misc" title="11. General">
                <ul>
                    <li><strong>Changes:</strong> we may update these Terms and will revise the &ldquo;Last updated&rdquo; date. If you keep using the Service after a change takes effect, you accept the updated Terms.</li>
                    <li><strong>Severability:</strong> if any provision is found unenforceable, the rest of these Terms still applies.</li>
                    <li><strong>No waiver:</strong> if we do not enforce a provision, that is not a waiver of it.</li>
                    <li><strong>Entire agreement:</strong> these Terms and the Privacy Policy are the entire agreement between you and us about the hosted Service.</li>
                    <li><strong>Contact:</strong> <a href={`mailto:${GRIEVANCE_OFFICER.email}`}>{GRIEVANCE_OFFICER.email}</a></li>
                </ul>
            </Section>
        </LegalPage>
    );
}
