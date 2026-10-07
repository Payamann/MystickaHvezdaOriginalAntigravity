import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// Reviewed batches only; each owns an explicit page group and is idempotent.
const root = fileURLToPath(new URL('../', import.meta.url));
const batches = [
  'migrate-atlas-pages.mjs',
  'migrate-atlas-blog.mjs',
  'migrate-atlas-content.mjs',
  'migrate-atlas-tools.mjs',
  'migrate-atlas-astro.mjs',
  'migrate-atlas-angels.mjs',
  'migrate-atlas-remaining.mjs',
  'apply-atlas-art.mjs',
  'apply-atlas-blog-art.mjs',
  'render-static-hubs.mjs',
  'fill-image-dimensions.mjs',
];
for (const batch of batches) {
  const result = spawnSync(process.execPath, [fileURLToPath(new URL(batch, import.meta.url))], {
    cwd: root, stdio: 'inherit', shell: false,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
