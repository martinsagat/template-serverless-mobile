#!/usr/bin/env tsx
/**
 * Sync apps/web/admin/.env.local from .sst/outputs.json so the local Next dev
 * server picks up the IDs SST provisioned for you.
 *
 * Run after `pnpm sst dev` or `pnpm sst deploy`:
 *
 *   pnpm sync-env
 *   pnpm sync-env -- --dry-run
 *
 * Add another web app's mapping below if/when you create one.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = process.cwd();
const OUTPUTS_PATH = join(ROOT, '.sst', 'outputs.json');
const DRY_RUN = process.argv.includes('--dry-run');

interface Outputs {
  region?: string;
  userPoolId?: string;
  adminClientId?: string;
  consumerClientId?: string;
  mobileClientId?: string;
  cognitoOAuthDomain?: string;
  adminApiUrl?: string;
  consumerApiUrl?: string;
  adminUrl?: string;
  landingUrl?: string;
  // SST sometimes wraps URLs in `{ url: string }`.
  adminApi?: string | { url: string };
  consumerApi?: string | { url: string };
}

type Mapping = Array<[outputKey: keyof Outputs, envKey: string]>;

const ADMIN_MAPPING: Mapping = [
  ['region', 'NEXT_PUBLIC_AWS_REGION'],
  ['userPoolId', 'NEXT_PUBLIC_USER_POOL_ID'],
  ['adminClientId', 'NEXT_PUBLIC_ADMIN_CLIENT_ID'],
  ['adminApiUrl', 'NEXT_PUBLIC_ADMIN_API_URL'],
  ['cognitoOAuthDomain', 'NEXT_PUBLIC_COGNITO_OAUTH_DOMAIN'],
];

function loadOutputs(): Outputs {
  if (!existsSync(OUTPUTS_PATH)) {
    console.error(
      `Missing ${OUTPUTS_PATH}. Run \`pnpm sst dev\` or \`pnpm sst deploy\` first.`,
    );
    process.exit(1);
  }
  const raw = readFileSync(OUTPUTS_PATH, 'utf-8');
  try {
    return JSON.parse(raw) as Outputs;
  } catch {
    console.error(`Invalid JSON in ${OUTPUTS_PATH}`);
    process.exit(1);
  }
}

function unwrap(value: unknown): string | undefined {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && 'url' in value) {
    const url = (value as { url: unknown }).url;
    if (typeof url === 'string') return url;
  }
  return undefined;
}

function parseEnvFile(content: string): {
  managed: Map<string, string>;
  passthrough: string[];
} {
  const managed = new Map<string, string>();
  const passthrough: string[] = [];
  for (const line of content.split('\n')) {
    const match = line.match(/^([^#=\s]+)=(.*)$/);
    if (match) {
      const [, key, value] = match;
      managed.set(key.trim(), value.trim());
    } else {
      passthrough.push(line);
    }
  }
  return { managed, passthrough };
}

function buildEnvContent(
  passthrough: string[],
  existing: Map<string, string>,
  mapping: Mapping,
  outputs: Outputs,
): string {
  const managedKeys = new Set(mapping.map(([, envKey]) => envKey));
  const out = new Map(existing);
  let updates = 0;

  for (const [outputKey, envKey] of mapping) {
    const value = unwrap(outputs[outputKey]);
    if (value !== undefined && out.get(envKey) !== value) {
      out.set(envKey, value);
      updates++;
    }
  }

  const lines: string[] = [];
  for (const line of passthrough) lines.push(line);
  // Preserve unmanaged keys as-is in original order, then append managed.
  for (const [k, v] of out) {
    if (!managedKeys.has(k)) lines.push(`${k}=${v}`);
  }
  for (const [, envKey] of mapping) {
    const v = out.get(envKey);
    if (v !== undefined) lines.push(`${envKey}=${v}`);
  }

  if (lines[lines.length - 1] !== '') lines.push('');
  void updates;
  return lines.join('\n');
}

function syncOne(
  label: string,
  relativePath: string,
  mapping: Mapping,
  outputs: Outputs,
): void {
  const targetPath = join(ROOT, relativePath);
  const existingContent = existsSync(targetPath)
    ? readFileSync(targetPath, 'utf-8')
    : '';
  const { managed, passthrough } = parseEnvFile(existingContent);
  const next = buildEnvContent(passthrough, managed, mapping, outputs);

  const before = existingContent;
  if (next === before) {
    console.log(`  [skip] ${label}: already up to date`);
    return;
  }

  if (DRY_RUN) {
    console.log(`  [dry-run] ${label}: would write ${relativePath}`);
    return;
  }

  writeFileSync(targetPath, next, 'utf-8');
  console.log(`  [write] ${label}: ${relativePath}`);
}

function main(): void {
  const outputs = loadOutputs();
  console.log(
    `Syncing env from ${OUTPUTS_PATH}${DRY_RUN ? ' (dry run)' : ''}\n`,
  );
  syncOne('admin', 'apps/web/admin/.env.local', ADMIN_MAPPING, outputs);
  console.log('\nDone.');
}

main();
