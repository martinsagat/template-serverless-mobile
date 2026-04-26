/**
 * Stage-aware helpers. The `STAGE` env var is injected by infra/api.ts on every
 * Lambda invocation (`{ STAGE: $app.stage }`); empty/missing means local dev.
 */

const DEV_STAGES = new Set(['dev', 'development', '']);

function stage(): string {
  return (process.env.STAGE ?? '').toLowerCase().trim();
}

/** True when running locally (`pnpm sst dev`) or in a stage explicitly named dev. */
export function isDevelopment(): boolean {
  return DEV_STAGES.has(stage());
}

export function isUat(): boolean {
  return stage() === 'uat';
}

export function isProduction(): boolean {
  return stage() === 'production';
}

/**
 * API docs (`/docs`, `/openapi.json`) are exposed only in dev/uat — production
 * keeps the schema private. Override per-project if your customers consume it.
 */
export function isDocsEnabled(): boolean {
  return isDevelopment() || isUat();
}
