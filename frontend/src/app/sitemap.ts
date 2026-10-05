import { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';

const INPUT_FORMATS = ['csv', 'tsv', 'json', 'parquet', 'excel'];
const OUTPUT_FORMATS = ['parquet', 'csv', 'json', 'excel', 'html', 'yaml', 'xml', 'latex', 'sql', 'markdown'];

const STATIC_PAGES: { path: string; priority: number; changeFrequency: 'weekly' | 'monthly' | 'yearly' }[] = [
    { path: '', priority: 1, changeFrequency: 'weekly' },
    { path: '/security', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/privacy-policy', priority: 0.4, changeFrequency: 'yearly' },
    { path: '/terms-of-service', priority: 0.4, changeFrequency: 'yearly' },
];

export default function sitemap(): MetadataRoute.Sitemap {
    const now = new Date();
    const sitemap: MetadataRoute.Sitemap = STATIC_PAGES.map((p) => ({
        url: `${SITE_URL}${p.path}`,
        lastModified: now,
        changeFrequency: p.changeFrequency,
        priority: p.priority,
    }));

    for (const from of INPUT_FORMATS) {
        for (const to of OUTPUT_FORMATS) {
            if (from !== to) {
                sitemap.push({
                    url: `${SITE_URL}/convert/${from}-to-${to}`,
                    lastModified: now,
                    changeFrequency: 'monthly',
                    priority: 0.8,
                });
            }
        }
    }

    return sitemap;
}
