import { NextRequest, NextResponse } from 'next/server';

interface ColumnSchema {
    name: string;
    type: string;
}

interface RequestBody {
    prompt: string;
    schema: ColumnSchema[];
    customApiKey?: string;
}

const CANDIDATE_MODELS = [
    'qwen/qwen3.8-27b',
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'openai/gpt-oss-20b'
];

export async function POST(req: NextRequest) {
    try {
        const body: RequestBody = await req.json();
        const { prompt, schema, customApiKey } = body;

        if (!prompt || typeof prompt !== 'string' || prompt.trim() === '') {
            return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
        }

        // Determine list of candidate API keys (dual-key failover support)
        const keys: string[] = [];
        if (customApiKey && customApiKey.trim() !== '') {
            keys.push(customApiKey.trim());
        }
        if (process.env.GROQ_API_KEY_1 && process.env.GROQ_API_KEY_1.trim() !== '') {
            keys.push(process.env.GROQ_API_KEY_1.trim());
        }
        if (process.env.GROQ_API_KEY_2 && process.env.GROQ_API_KEY_2.trim() !== '') {
            keys.push(process.env.GROQ_API_KEY_2.trim());
        }

        if (keys.length === 0) {
            return NextResponse.json({ 
                error: 'No Groq API key configured. Please set GROQ_API_KEY_1 in your environment or enter your free Groq key in the Copilot settings.' 
            }, { status: 400 });
        }

        const schemaFormatted = (schema && schema.length > 0)
            ? schema.map(c => `  - "${c.name}" (${c.type})`).join('\n')
            : '  (Schema unknown; assume general table "data")';

        const systemPrompt = `You are a high-performance DuckDB SQL code generator for DataMorphX, an in-browser WebAssembly data studio.
The user's dataset is loaded into client RAM as an in-memory table named 'data'.

Active Table: "data"
Columns:
${schemaFormatted}

STRICT GENERATION RULES:
1. Generate valid, executable DuckDB SQL querying from table "data".
2. Use the exact column names provided. Quote column names if they contain spaces or special characters.
3. Use modern DuckDB SQL idioms (e.g. ROUND(), TRY_CAST(), COUNT(*), SUM(), GROUP BY, ORDER BY).
4. Unless an explicit row limit is requested or a small aggregation is performed, include "LIMIT 100".
5. Return ONLY the raw SQL query.
6. Absolutely DO NOT include markdown code blocks (no \`\`\` or \`\`\`sql), no preamble, no explanations. Just the raw SQL string.`;

        let lastError: string | null = null;
        let lastStatusCode = 500;

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];

            for (const model of CANDIDATE_MODELS) {
                try {
                    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${key}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            model: model,
                            messages: [
                                { role: 'system', content: systemPrompt },
                                { role: 'user', content: prompt }
                            ],
                            temperature: 0.1,
                            max_tokens: 500
                        })
                    });

                    if (response.ok) {
                        const data = await response.json();
                        let generatedSql = data.choices?.[0]?.message?.content?.trim() || '';
                        
                        // Strip any markdown backticks if returned by the LLM
                        generatedSql = generatedSql
                            .replace(/^```(?:sql)?\s*/i, '')
                            .replace(/\s*```$/i, '')
                            .trim();

                        return NextResponse.json({
                            sql: generatedSql,
                            model: model,
                            keyIndex: i,
                            success: true
                        });
                    }

                    const errJson = await response.json().catch(() => ({}));
                    lastStatusCode = response.status;
                    lastError = errJson?.error?.message || response.statusText;

                    // If model doesn't exist for this tier, try next model immediately
                    if (errJson?.error?.code === 'model_not_found') {
                        continue;
                    }

                    // If rate limited (429) or unauthorized (401), break to next key
                    console.warn(`Groq key #${i + 1} with model ${model} failed (${response.status}): ${lastError}.`);
                    break;
                } catch (err: any) {
                    lastError = err.message || 'Network error connecting to Groq';
                    console.warn(`Groq key #${i + 1} with model ${model} threw error: ${lastError}.`);
                    break;
                }
            }
        }

        return NextResponse.json({ 
            error: `All Groq keys/models failed. Last error (${lastStatusCode}): ${lastError}` 
        }, { status: lastStatusCode });

    } catch (err: any) {
        return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
    }
}
