/**
 * Input sanitisation utilities for AI prompt inputs.
 *
 * The goal is NOT to prevent all prompt injection (that's fundamentally hard),
 * but rather to:
 *   1. Strip characters that serve no legitimate purpose in PRD/context text.
 *   2. Truncate excessively long inputs so they don't blow up token budgets.
 *   3. Remove obvious injection patterns that try to override system prompts.
 */

/** Maximum allowed length for PRD content (characters). */
const MAX_PRD_LENGTH = 15_000;

/** Maximum allowed length for style/freelancer context (characters). */
const MAX_CONTEXT_LENGTH = 5_000;

/**
 * Patterns that look like prompt injection attempts.
 * We replace them with empty strings rather than rejecting the request,
 * so legitimate content that accidentally matches still works.
 */
const INJECTION_PATTERNS = [
  // Attempts to override the system prompt
  /ignore\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)/gi,
  /disregard\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)/gi,
  /forget\s+(all\s+)?(previous|above|prior)\s+(instructions?|prompts?|rules?)/gi,

  // Explicit system/assistant role injection
  /\[?\s*system\s*\]?\s*:/gi,
  /\[?\s*assistant\s*\]?\s*:/gi,

  // Markdown-style role blocks
  /^#{1,3}\s*(system|assistant)\s*(prompt|message|instruction)?/gim,

  // Attempts to close/reopen JSON structures to hijack output
  /```\s*(json|system|output)/gi,
];

/**
 * Strips invisible/control characters that serve no purpose in readable text.
 */
function stripControlChars(input: string): string {
  // Keep newlines, tabs, and normal printable chars. Remove zero-width chars, etc.
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F\u200B-\u200F\u2028-\u202F\uFEFF]/g, '');
}

/**
 * Sanitizes user-provided text before it is interpolated into an AI prompt.
 *
 * @param input   - The raw user input string.
 * @param maxLen  - Maximum allowed character length (truncated with notice).
 * @returns The sanitized string, safe for prompt interpolation.
 */
export function sanitizePromptInput(input: string, maxLen: number): string {
  if (!input) return '';

  let sanitized = input;

  // 1. Strip invisible/control characters
  sanitized = stripControlChars(sanitized);

  // 2. Remove known injection patterns
  for (const pattern of INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }

  // 3. Normalize excessive whitespace (keep single newlines, collapse runs)
  sanitized = sanitized
    .replace(/\r\n/g, '\n')          // Normalize line endings
    .replace(/\n{4,}/g, '\n\n\n')     // Cap consecutive newlines at 3
    .replace(/[ \t]{10,}/g, '  ')     // Cap long runs of spaces/tabs
    .trim();

  // 4. Truncate if too long
  if (sanitized.length > maxLen) {
    sanitized = sanitized.substring(0, maxLen) + '\n[Content truncated due to length]';
  }

  return sanitized;
}

/**
 * Sanitize PRD content specifically.
 */
export function sanitizePrdContent(input: string): string {
  return sanitizePromptInput(input, MAX_PRD_LENGTH);
}

/**
 * Sanitize style/freelancer context specifically.
 */
export function sanitizeContextInput(input: string): string {
  return sanitizePromptInput(input, MAX_CONTEXT_LENGTH);
}
