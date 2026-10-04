import * as YAML from 'yaml';
import * as xmljs from 'xml-js';

export function generateHTML(rows: any[], cols: any[]): string {
    if (!cols.length) return '';
    const headers = cols.map(c => `      <th>${c.field}</th>`).join('\n');
    const bodyRows = rows.map(r => {
        const tds = cols.map(c => `      <td>${r[c.field] !== null && r[c.field] !== undefined ? r[c.field] : ''}</td>`).join('\n');
        return `    <tr>\n${tds}\n    </tr>`;
    }).join('\n');
    
    return `<table>\n  <thead>\n    <tr>\n${headers}\n    </tr>\n  </thead>\n  <tbody>\n${bodyRows}\n  </tbody>\n</table>`;
}

export function generateYAML(rows: any[]): string {
    return YAML.stringify(rows);
}

export function generateXML(rows: any[]): string {
    // Convert array of objects to a structure xml-js likes
    const xmlObj = {
        _declaration: { _attributes: { version: "1.0", encoding: "utf-8" } },
        dataset: {
            row: rows.map(r => {
                const rowObj: any = {};
                for (const key in r) {
                    // Make key safe for XML
                    const safeKey = key.replace(/[^a-zA-Z0-9_]/g, '_');
                    rowObj[safeKey || 'column'] = { _text: r[key] !== null ? String(r[key]) : '' };
                }
                return rowObj;
            })
        }
    };
    return xmljs.js2xml(xmlObj, { compact: true, spaces: 4 });
}

export function generateLaTeX(rows: any[], cols: any[]): string {
    if (!cols.length) return '';
    const headers = cols.map(c => c.field).join(' & ');
    const format = cols.map(() => 'c').join(' | ');
    const bodyRows = rows.map(r => cols.map(c => {
        let val = r[c.field];
        if (val === null || val === undefined) return '';
        // basic latex escape
        return String(val).replace(/&/g, '\\&').replace(/%/g, '\\%').replace(/\$/g, '\\$').replace(/#/g, '\\#').replace(/_/g, '\\_').replace(/{/g, '\\{').replace(/}/g, '\\}');
    }).join(' & ') + ' \\\\').join('\n\\hline\n');

    return `\\begin{table}[h]\n\\centering\n\\begin{tabular}{| ${format} |}\n\\hline\n${headers} \\\\\n\\hline\n${bodyRows}\n\\hline\n\\end{tabular}\n\\end{table}`;
}

export function generateJira(rows: any[], cols: any[]): string {
    if (!cols.length) return '';
    const headers = '||' + cols.map(c => c.field).join('||') + '||';
    const bodyRows = rows.map(r => '|' + cols.map(c => r[c.field] !== null && r[c.field] !== undefined ? String(r[c.field]) : '').join('|') + '|').join('\n');
    return `${headers}\n${bodyRows}`;
}

export function generateMediaWiki(rows: any[], cols: any[]): string {
    if (!cols.length) return '';
    const headers = '! ' + cols.map(c => c.field).join(' !! ');
    const bodyRows = rows.map(r => '|-\n| ' + cols.map(c => r[c.field] !== null && r[c.field] !== undefined ? String(r[c.field]) : '').join(' || ')).join('\n');
    return `{| class="wikitable"\n${headers}\n${bodyRows}\n|}`;
}

export function generateAsciiDoc(rows: any[], cols: any[]): string {
    if (!cols.length) return '';
    const headers = '|===\n| ' + cols.map(c => c.field).join(' | ');
    const bodyRows = rows.map(r => '\n| ' + cols.map(c => r[c.field] !== null && r[c.field] !== undefined ? String(r[c.field]) : '').join(' | ')).join('\n');
    return `${headers}\n${bodyRows}\n|===`;
}

export function generateBBCode(rows: any[], cols: any[]): string {
    if (!cols.length) return '';
    const headers = '[tr]\n' + cols.map(c => `  [th]${c.field}[/th]`).join('\n') + '\n[/tr]';
    const bodyRows = rows.map(r => '[tr]\n' + cols.map(c => `  [td]${r[c.field] !== null && r[c.field] !== undefined ? String(r[c.field]) : ''}[/td]`).join('\n') + '\n[/tr]').join('\n');
    return `[table]\n${headers}\n${bodyRows}\n[/table]`;
}
