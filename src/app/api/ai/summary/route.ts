import { NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const VALID_TYPES = new Set([
    'attendance', 'students', 'teachers', 'fees', 'classes',
    'enrollments', 'exams', 'library', 'departments', 'timetable',
    'subjects', 'dashboard',
]);
const MAX_DATA_CHARS = 20_000;

const SYSTEM = `You are an AI assistant for a school management system.
Analyze the provided data and give clear, actionable insights in 3-5 bullet points.
Be concise, specific, and focus on what matters to school administrators.
Use plain language — no markdown headers, no bold text. Just bullet points starting with "•".`;

function buildPrompt(type: string, data: unknown): string {
    const json = JSON.stringify(data, null, 2);
    const prompts: Record<string, string> = {
        attendance: `Analyze this attendance data and highlight: overall rate, who is absent/late, any concerns worth flagging:\n${json}`,
        students:   `Analyze this student data and highlight: enrollment totals, status distribution, gender balance, and any notable patterns:\n${json}`,
        teachers:   `Analyze this teacher data and highlight: total staff, qualification levels, specializations, and staffing gaps:\n${json}`,
        fees:       `Analyze this fee payment data and highlight: revenue collected, outstanding amounts, payment patterns, and financial health:\n${json}`,
        classes:    `Analyze this class data and highlight: capacity utilization, grade distribution, and any overcrowded or under-enrolled classes:\n${json}`,
        enrollments:`Analyze this enrollment data and highlight: active vs dropped students, class distribution, and enrollment trends:\n${json}`,
        exams:      `Analyze this exam schedule and highlight: upcoming exams, exam type distribution, and scheduling observations:\n${json}`,
        library:    `Analyze this library inventory and highlight: total books, availability rates, low-stock categories, and collection health:\n${json}`,
        departments:`Analyze this department data and highlight: number of departments, leadership coverage, and organizational observations:\n${json}`,
        timetable:  `Analyze this timetable data and highlight: busiest days, time distribution of classes, and scheduling patterns:\n${json}`,
        subjects:   `Analyze this subject data and highlight: total subjects offered, credit hour distribution, and curriculum observations:\n${json}`,
        dashboard:  `Analyze these school-wide statistics and provide an executive summary of overall school health and key areas of attention:\n${json}`,
    };
    return prompts[type] ?? `Analyze this school management data and provide key insights:\n${json}`;
}

export async function POST(req: NextRequest) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
        return new Response(
            JSON.stringify({ error: 'ANTHROPIC_API_KEY is not configured. Add it to .env.local.' }),
            { status: 503, headers: { 'Content-Type': 'application/json' } }
        );
    }

    let body: { type?: unknown; data?: unknown };
    try { body = await req.json(); } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const { type, data } = body;

    if (typeof type !== 'string' || !VALID_TYPES.has(type)) {
        return new Response(
            JSON.stringify({ error: `Invalid type. Must be one of: ${[...VALID_TYPES].join(', ')}` }),
            { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    const serialized = JSON.stringify(data ?? {});
    if (serialized.length > MAX_DATA_CHARS) {
        return new Response(
            JSON.stringify({ error: 'Data payload too large. Maximum 20,000 characters.' }),
            { status: 413, headers: { 'Content-Type': 'application/json' } }
        );
    }

    const stream = new ReadableStream({
        async start(controller) {
            try {
                const response = await client.messages.stream({
                    model: 'claude-haiku-4-5-20251001',
                    max_tokens: 512,
                    system: SYSTEM,
                    messages: [{ role: 'user', content: buildPrompt(type, data) }],
                });
                for await (const chunk of response) {
                    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
                        controller.enqueue(new TextEncoder().encode(chunk.delta.text));
                    }
                }
            } catch (err: unknown) {
                const msg = err instanceof Error ? err.message : 'AI summary failed';
                controller.enqueue(new TextEncoder().encode(`\n[Error: ${msg}]`));
            } finally {
                controller.close();
            }
        },
    });

    return new Response(stream, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8', 'X-Content-Type-Options': 'nosniff' },
    });
}
