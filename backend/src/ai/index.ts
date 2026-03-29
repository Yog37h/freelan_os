/**
 * AI Timeline Generator — main entry point.
 * Composes the provider + prompts + validation.
 * Handles various model response formats (reasoning text mixed with JSON).
 */

import { callOpenRouter } from './providers/openrouter';
import { buildSystemPrompt, buildUserPrompt, TimelinePromptInput } from './prompts';
import { aiTimelineOutputSchema, type AITimelineOutput } from '../validators/timeline';

export interface GenerateTimelineResult {
    success: true;
    data: AITimelineOutput;
    model: string;
}

export interface GenerateTimelineError {
    success: false;
    error: string;
}

/**
 * Attempts to extract a JSON object from raw text that may contain
 * reasoning text, markdown fences, or other non-JSON content.
 */
function extractJsonFromResponse(raw: string): string {
    let content = raw.trim();

    // 1. Strip markdown code fences: ```json ... ``` or ``` ... ```
    const fenceMatch = content.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (fenceMatch) {
        content = fenceMatch[1].trim();
    }

    // 2. If content starts with '{', it's likely clean JSON
    if (content.startsWith('{')) {
        return content;
    }

    // 3. Find the first '{' and last '}' — extract the JSON object
    const firstBrace = content.indexOf('{');
    const lastBrace = content.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
        content = content.substring(firstBrace, lastBrace + 1);
    }

    return content;
}

export async function generateTimeline(
    input: TimelinePromptInput
): Promise<GenerateTimelineResult | GenerateTimelineError> {
    try {
        const systemPrompt = buildSystemPrompt();
        const userPrompt = buildUserPrompt(input);

        const result = await callOpenRouter([
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
        ], {
            // Let provider use its default max_tokens (16384) for reasoning models
            temperature: 0.4,
        });

        // Extract JSON from potentially mixed reasoning+JSON response
        const rawContent = extractJsonFromResponse(result.content);

        let parsed: unknown;
        try {
            parsed = JSON.parse(rawContent);
        } catch (parseErr) {
            console.error('[AI] Failed to parse JSON from response:', {
                rawLength: result.content.length,
                extractedLength: rawContent.length,
                first300: rawContent.substring(0, 300),
                last200: rawContent.substring(rawContent.length - 200),
            });
            return { success: false, error: 'AI returned invalid JSON. Please try again.' };
        }

        // Validate against Zod schema
        const validated = aiTimelineOutputSchema.safeParse(parsed);
        if (!validated.success) {
            console.error('[AI] Output validation failed:', validated.error.format());
            return { success: false, error: 'AI returned an invalid structure. Please try again.' };
        }

        return {
            success: true,
            data: validated.data,
            model: result.model,
        };
    } catch (err) {
        console.error('[AI] Timeline generation error:', err);
        const message = err instanceof Error ? err.message : 'Unknown AI error';
        return {
            success: false,
            error: message,
        };
    }
}
