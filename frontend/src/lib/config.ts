/**
 * Centralised API configuration.
 *
 * Single source of truth for the backend API base URL.
 * All modules should import from here instead of reading
 * `import.meta.env.VITE_API_URL` directly.
 */

export const API_BASE_URL: string =
  import.meta.env.VITE_API_URL || 'http://localhost:3000';
