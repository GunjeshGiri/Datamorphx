import Workbench from '@/components/Workbench';
import { Metadata } from 'next';

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
        title: `Convert ${fromName} to ${toName} Online Free - DataMorphX`,
        description: `Instantly convert ${fromName} files to ${toName} directly in your browser. 100% private, zero data upload, and blazing fast.`,
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
    
    return (
        <div className="flex flex-col h-full bg-neutral-950 overflow-auto">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <header className="bg-neutral-900 border-b border-neutral-800 p-8 flex flex-col items-center justify-center text-center shrink-0">
                <h1 className="text-3xl font-bold text-white mb-3">Convert {fromName} to {toName}</h1>
                <p className="text-neutral-400 max-w-2xl text-lg">
                    Use DataMorphX to instantly convert your {fromName} datasets into {toName}. 
                    Everything runs directly in your browser using DuckDB WASM, meaning your data 
                    <strong className="text-blue-400"> never leaves your computer</strong>. It's fast, free, and completely private.
                </p>
            </header>
            
            <div className="h-[800px] shrink-0 border-b border-neutral-800">
                <Workbench />
            </div>
            
            <section className="bg-neutral-950 py-16 px-6 shrink-0">
                <div className="max-w-3xl mx-auto text-neutral-300">
                    <h2 className="text-2xl font-bold text-white mb-6">How to convert {fromName} to {toName}</h2>
                    <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-xl mb-12">
                        <ol className="list-decimal list-inside space-y-4 text-lg">
                            <li>Drag and drop your <strong>{fromName}</strong> file into the workspace above.</li>
                            <li>(Optional) Use the built-in SQL editor to filter rows, clean up data, or rename columns.</li>
                            <li>Select <strong>{toName}</strong> from the export toolbar and click Download.</li>
                        </ol>
                    </div>
                    
                    <h3 className="text-xl font-bold text-white mb-4">Is it safe to convert sensitive {fromName} data?</h3>
                    <p className="mb-8 leading-relaxed text-neutral-400">
                        Yes! Unlike other online converters that force you to upload your data to their servers, 
                        DataMorphX runs an embedded database inside your browser. Your {fromName} file is processed 
                        locally on your CPU and RAM. Zero bytes are uploaded to the internet.
                    </p>
                </div>
            </section>
        </div>
    );
}
