// postbuild.ts — runs after `vite build`.
// Phase 3: stub (logs the emitted chunk manifest).
// Phase 4: generates sitemap.xml from prerender routes + ARTWORKS.
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const manifestPath = resolve('dist/.vite/manifest.json');
if (existsSync(manifestPath)) {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  const entries = Object.keys(manifest).filter((k) => manifest[k].isEntry);
  console.log(`[postbuild] manifest OK — ${entries.length} entry chunks:`);
  for (const e of entries) console.log(`  ${e} -> ${manifest[e].file}`);
} else {
  console.log('[postbuild] no manifest found (vite build may have skipped manifest).');
}
console.log('[postbuild] sitemap generation: TODO Phase 4');
