import { MetadataRoute } from 'next';

const INPUT_FORMATS = ['csv', 'tsv', 'json', 'parquet', 'excel'];
const OUTPUT_FORMATS = ['parquet', 'csv', 'json', 'excel', 'html', 'yaml', 'xml', 'latex', 'sql', 'markdown'];

export default function sitemap(): MetadataRoute.Sitemap {
    const baseUrl = 'https://datamorphx.com';
    const sitemap: MetadataRoute.Sitemap = [
        {
            url: baseUrl,
            lastModified: new Date(),
            changeFrequency: 'weekly',
            priority: 1,
        }
    ];

    for (const from of INPUT_FORMATS) {
        for (const to of OUTPUT_FORMATS) {
            if (from !== to) {
                sitemap.push({
                    url: `${baseUrl}/convert/${from}-to-${to}`,
                    lastModified: new Date(),
                    changeFrequency: 'monthly',
                    priority: 0.8,
                });
            }
        }
    }

    return sitemap;
}
