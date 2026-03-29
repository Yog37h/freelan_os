// ✅ VERIFIED: Centralized static placeholder links for deliverable sharing and client-call notices without Google runtime dependencies. Manual test: omit the env vars and confirm both helpers fall back to FRONTEND_URL; then set the env vars and confirm the returned URLs change.
import { env } from "./env";

function normalizeUrl(value: string | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed && /^https?:\/\//i.test(trimmed) ? trimmed : fallback;
}

export function getDeliverableSharePlaceholderUrl() {
  return normalizeUrl(
    process.env.DELIVERABLE_SHARE_PLACEHOLDER_URL,
    env.FRONTEND_URL,
  );
}

export function getClientCallPlaceholderUrl() {
  return normalizeUrl(
    process.env.CLIENT_CALL_PLACEHOLDER_URL,
    env.FRONTEND_URL,
  );
}
