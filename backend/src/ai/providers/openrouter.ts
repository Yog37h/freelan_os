/**
 * OpenRouter AI Provider — server-only.
 * Calls the OpenRouter chat completions API.
 * Optimized for logic/reasoning models.
 * NEVER import this from client code.
 */

const OPENROUTER_BASE = 'https://openrouter.ai/api/v1/chat/completions';

export interface OpenRouterMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export interface OpenRouterOptions {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    /** Number of retry attempts on empty/failed responses (default: 2) */
    retries?: number;
}

export interface OpenRouterResult {
    content: string;
    model: string;
    usage: { prompt_tokens: number; completion_tokens: number; total_tokens: number } | null;
}

/**
 * Extracts the actual content from a model response.
 * Reasoning models may:
 * - Put reasoning in `reasoning_content` or `reasoning_details` and answer in `content`
 * - Embed reasoning in `<think>` tags inside `content`
 * - Sometimes return empty `content` with all output in reasoning fields
 */
function extractContent(choice: any): string | null {
    const message = choice?.message;
    if (!message) return null;

    let content = message.content || '';

    // Strip <think>...</think> tags if present
    if (content.includes('<think>')) {
        content = content.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
    }

    if (content) return content;

    const reasoning = message.reasoning_content || '';
    if (reasoning) {
        const jsonMatch = reasoning.match(/```json\s*\n?([\s\S]*?)\n?```/);
        if (jsonMatch) return jsonMatch[1].trim();

        const trimmed = reasoning.trim();
        if (trimmed.startsWith('{') && trimmed.endsWith('}')) return trimmed;
    }

    const details = message.reasoning_details;
    if (Array.isArray(details) && details.length > 0) {
        const allText = details.map((step: any) => {
            if (typeof step === 'string') return step;
            return step?.thinking || step?.content || step?.text || '';
        }).join('\n');

        if (allText) {
            const fenceMatch = allText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
            if (fenceMatch) return fenceMatch[1].trim();

            const jsonStart = allText.indexOf('{');
            if (jsonStart !== -1) {
                let depth = 0;
                for (let i = jsonStart; i < allText.length; i++) {
                    if (allText[i] === '{') depth++;
                    else if (allText[i] === '}') depth--;
                    if (depth === 0) {
                        const candidate = allText.substring(jsonStart, i + 1);
                        try {
                            JSON.parse(candidate);
                            return candidate;
                        } catch {
                            continue;
                        }
                    }
                }
            }
        }
    }

    return null;
}

export async function callOpenRouter(
    messages: OpenRouterMessage[],
    options: OpenRouterOptions = {}
): Promise<OpenRouterResult> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY not configured');
    }

    const model = options.model || process.env.OPENROUTER_MODEL || 'arcee-ai/trinity-large-preview:free';
    const maxTokens = options.maxTokens ?? 16384;
    const maxRetries = options.retries ?? 2;

    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
            if (attempt > 0) {
                const delay = Math.min(3000 * Math.pow(2, attempt - 1), 10000);
                console.log(`[OpenRouter] Retry attempt ${attempt}/${maxRetries} after ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }

            const requestBody: Record<string, unknown> = {
                model,
                messages,
                temperature: options.temperature ?? 0.4,
                max_tokens: maxTokens,
                // Force JSON output
                response_format: { type: 'json_object' },
            };

            console.log(`[OpenRouter] Calling model: ${model} (attempt ${attempt + 1}/${maxRetries + 1})`);

            const response = await fetch(OPENROUTER_BASE, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    'HTTP-Referer': 'https://freelanceos.app',
                    'X-Title': 'FreelanceOS Timeline Generator',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errBody = await response.text();
                if ((response.status === 429 || response.status >= 500) && attempt < maxRetries) {
                    console.warn(`[OpenRouter] HTTP ${response.status}, will retry. Body: ${errBody.substring(0, 300)}`);
                    lastError = new Error(`OpenRouter API error (${response.status}): ${errBody}`);
                    continue;
                }
                throw new Error(`OpenRouter API error (${response.status}): ${errBody}`);
            }

            const json = await response.json();

            const choice = json.choices?.[0];
            console.log('[OpenRouter] Response received:', {
                model: json.model,
                hasContent: !!choice?.message?.content,
                contentLength: choice?.message?.content?.length || 0,
                hasReasoning: !!choice?.message?.reasoning_content,
                hasReasoningDetails: !!choice?.message?.reasoning_details,
                finishReason: choice?.finish_reason,
            });

            const content = extractContent(choice);

            if (!content) {
                if (attempt < maxRetries) {
                    console.warn(`[OpenRouter] Empty content on attempt ${attempt + 1}, retrying...`);
                    lastError = new Error('OpenRouter returned empty response');
                    continue;
                }
                throw new Error(
                    'AI model returned an empty response after multiple attempts. ' +
                    'The free model may be overloaded. Please try again in a moment.'
                );
            }

            return {
                content,
                model: json.model || model,
                usage: json.usage || null,
            };

        } catch (err) {
            lastError = err instanceof Error ? err : new Error(String(err));
            if (attempt < maxRetries) {
                console.warn(`[OpenRouter] Error on attempt ${attempt + 1}:`, lastError.message);
                continue;
            }
        }
    }

    throw lastError || new Error('OpenRouter call failed after all retries');
}
