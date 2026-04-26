#!/usr/bin/env tsx
/**
 * Rewrites the `app` / `App` / `@app/*` placeholder identifiers across the
 * template (both `platform/` and the sibling `mobile/` directory) to a real
 * project slug. Run this once when starting a new project from the template.
 *
 *   tsx platform/bin/rename.ts <slug>
 *
 *   <slug> must match /^[a-z][a-z0-9-]{1,30}$/
 *
 * Refuses to run if any node_modules directory exists, to avoid stale lockfiles
 * and broken symlinks. Idempotent: running with the same slug twice is a no-op.
 */
import {
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { join, relative, resolve } from 'node:path';

const SLUG_RE = /^[a-z][a-z0-9-]{1,30}$/;

const SKIP_DIRS = new Set([
  'node_modules',
  '.git',
  '.sst',
  '.next',
  '.expo',
  '.turbo',
  'dist',
  'build',
  'coverage',
  'ios',
  'android',
]);

const SKIP_FILES = new Set([
  'pnpm-lock.yaml',
  'package-lock.json',
  'yarn.lock',
  'bun.lock',
]);

const SKIP_EXT = new Set([
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.ico',
  '.webp',
  '.svg',
  '.woff',
  '.woff2',
  '.ttf',
  '.otf',
  '.pdf',
  '.zip',
  '.tar',
  '.gz',
  '.mp4',
  '.mp3',
  '.tsbuildinfo',
]);

function toPascal(slug: string): string {
  return slug
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join('');
}

function toUpperSnake(slug: string): string {
  return slug.replace(/-/g, '_').toUpperCase();
}

function isBinary(buf: Buffer): boolean {
  const len = Math.min(1024, buf.length);
  for (let i = 0; i < len; i++) {
    if (buf[i] === 0) return true;
  }
  return false;
}

interface Rule {
  pattern: string | RegExp;
  replacement: string;
}

function buildRules(slug: string): Rule[] {
  const Pascal = toPascal(slug);
  const UpperSnake = toUpperSnake(slug);

  // Order matters: longer/more-specific patterns first so they don't get
  // partially eaten by shorter ones.
  return [
    { pattern: '@app/', replacement: `@${slug}/` },
    { pattern: 'app-platform', replacement: `${slug}-platform` },
    { pattern: 'app-mobile', replacement: `${slug}-mobile` },
    { pattern: 'appUserPool', replacement: `${slug}UserPool` },
    { pattern: 'appTable', replacement: `${slug}Table` },
    { pattern: 'appAuth', replacement: `${slug}Auth` },
    {
      pattern: 'appPlaceholderSecret',
      replacement: `${slug}PlaceholderSecret`,
    },
    { pattern: 'createAppTable', replacement: `create${Pascal}Table` },
    { pattern: 'createAppAuth', replacement: `create${Pascal}Auth` },
    { pattern: 'createAppApis', replacement: `create${Pascal}Apis` },
    { pattern: 'createAppWeb', replacement: `create${Pascal}Web` },
    { pattern: 'createAppTheme', replacement: `create${Pascal}Theme` },
    {
      pattern: 'CreateAppApisParams',
      replacement: `Create${Pascal}ApisParams`,
    },
    { pattern: 'CreateAppWebParams', replacement: `Create${Pascal}WebParams` },
    { pattern: 'AppApis', replacement: `${Pascal}Apis` },
    { pattern: 'AppAuth', replacement: `${Pascal}Auth` },
    { pattern: 'AppTable', replacement: `${Pascal}Table` },
    { pattern: 'AppWeb', replacement: `${Pascal}Web` },
    { pattern: 'AppButton', replacement: `${Pascal}Button` },
    { pattern: 'AppCard', replacement: `${Pascal}Card` },
    // Bare-word "App" (display strings, page titles, mobile config name).
    { pattern: /\bApp\b/g, replacement: Pascal },
    { pattern: /\bAPP_/g, replacement: `${UpperSnake}_` },
    { pattern: /(['"])app\1/g, replacement: `$1${slug}$1` },
  ];
}

function applyRule(
  input: string,
  rule: Rule,
): { output: string; count: number } {
  if (typeof rule.pattern === 'string') {
    if (!input.includes(rule.pattern)) return { output: input, count: 0 };
    const count = input.split(rule.pattern).length - 1;
    return { output: input.replaceAll(rule.pattern, rule.replacement), count };
  }
  const matches = input.match(rule.pattern);
  if (!matches) return { output: input, count: 0 };
  return {
    output: input.replace(rule.pattern, rule.replacement),
    count: matches.length,
  };
}

interface Stats {
  filesScanned: number;
  filesChanged: number;
  replacements: number;
}

function processFile(path: string, rules: Rule[], stats: Stats): void {
  const buf = readFileSync(path);
  if (isBinary(buf)) return;
  stats.filesScanned++;
  const before = buf.toString('utf8');
  let after = before;
  let total = 0;
  for (const rule of rules) {
    const { output, count } = applyRule(after, rule);
    after = output;
    total += count;
  }
  if (after !== before) {
    writeFileSync(path, after, 'utf8');
    stats.filesChanged++;
    stats.replacements += total;
  }
}

function walk(dir: string, rules: Rule[], stats: Stats): void {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name) || SKIP_FILES.has(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      walk(full, rules, stats);
      continue;
    }
    if (st.isFile()) {
      const dot = name.lastIndexOf('.');
      if (dot >= 0 && SKIP_EXT.has(name.slice(dot))) continue;
      processFile(full, rules, stats);
    }
  }
}

function findNodeModules(root: string, hits: string[] = []): string[] {
  for (const name of readdirSync(root)) {
    if (
      name === '.git' ||
      name === '.sst' ||
      name === '.next' ||
      name === '.expo'
    )
      continue;
    const full = join(root, name);
    let st: ReturnType<typeof statSync>;
    try {
      st = statSync(full);
    } catch {
      continue;
    }
    if (!st.isDirectory()) continue;
    if (name === 'node_modules') {
      hits.push(full);
      continue;
    }
    findNodeModules(full, hits);
  }
  return hits;
}

function main(): void {
  const slug = process.argv[2];
  if (!slug) {
    console.error('Usage: tsx platform/bin/rename.ts <slug>');
    console.error('  <slug> must match /^[a-z][a-z0-9-]{1,30}$/');
    process.exit(1);
  }
  if (!SLUG_RE.test(slug)) {
    console.error(`Invalid slug: ${slug}`);
    console.error('Must match /^[a-z][a-z0-9-]{1,30}$/');
    process.exit(1);
  }

  // Template root is the parent of platform/ — the script lives at
  // platform/bin/rename.ts, so go up two directories.
  const here = resolve(import.meta.dirname);
  const templateRoot = resolve(here, '..', '..');

  const installed = findNodeModules(templateRoot);
  if (installed.length > 0) {
    console.error('Refusing to run: node_modules exists.');
    console.error('Rename must run before installing dependencies.');
    for (const p of installed)
      console.error(`  - ${relative(templateRoot, p)}`);
    process.exit(1);
  }

  const rules = buildRules(slug);
  const stats: Stats = { filesScanned: 0, filesChanged: 0, replacements: 0 };

  for (const sub of ['platform', 'mobile']) {
    const subPath = join(templateRoot, sub);
    try {
      if (!statSync(subPath).isDirectory()) continue;
    } catch {
      continue;
    }
    walk(subPath, rules, stats);
  }

  // Also rewrite the root README, .gitignore, and SETUP.md if present.
  for (const name of ['README.md', 'SETUP.md', '.gitignore']) {
    const p = join(templateRoot, name);
    try {
      statSync(p);
    } catch {
      continue;
    }
    processFile(p, rules, stats);
  }

  // Drop stale lockfiles so pnpm regenerates them with the new package names.
  for (const sub of ['platform', 'mobile']) {
    const lock = join(templateRoot, sub, 'pnpm-lock.yaml');
    try {
      statSync(lock);
      rmSync(lock);
    } catch {
      // not present — fine
    }
  }

  console.log(`Renamed to '${slug}'.`);
  console.log(`  Files scanned:  ${stats.filesScanned}`);
  console.log(`  Files changed:  ${stats.filesChanged}`);
  console.log(`  Replacements:   ${stats.replacements}`);
  console.log('');
  console.log('Next steps:');
  console.log('  cd platform && pnpm install && pnpm sst dev');
  console.log('  cd mobile   && pnpm install && pnpm start');
}

main();
