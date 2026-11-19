// GTA 6 trophy guide entrypoint (Node 22, standard library only).
//
// Copies app/ and screenshots/ from this repository into the output
// directory and writes /output/dossier.json with buildDossier from
// vendor/makefun-frontend.ts. Outside the grader, MAKEFUN_OUTPUT_DIR
// stands in for /output.
//
// Usage: MAKEFUN_OUTPUT_DIR=out node main.ts
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)));
const outDir = resolve(process.env.MAKEFUN_OUTPUT_DIR ?? '/output');

const dossierCaps = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 256 * 1024 },
  app_max_files: 993,
  app_max_bytes: 48 * 1024 * 1024,
  app_path_max_bytes: 1000
};

const appDir = join(repoRoot, 'app');
const shotsDir = join(repoRoot, 'screenshots');
if (!existsSync(appDir) || !statSync(appDir).isDirectory()) {
  throw new Error(`main.ts: app/ not found in ${repoRoot}`);
}
if (!existsSync(shotsDir) || !statSync(shotsDir).isDirectory()) {
  throw new Error(`main.ts: screenshots/ not found in ${repoRoot}`);
}
const shotFiles = readdirSync(shotsDir).filter((f) => !f.startsWith('.'));
if (shotFiles.length < 3 || shotFiles.length > 4) {
  throw new Error(`main.ts: screenshots/ must hold 3 or 4 images, found ${shotFiles.length}`);
}

// Never rmSync(outDir) itself: in the grader /output is a mounted
// volume, and rmdir on a mount point fails with EBUSY (exit code 1).
// Clearing only the contents below keeps the mount point intact.
rmSync(join(outDir, 'app'), { recursive: true, force: true });
rmSync(join(outDir, 'screenshots'), { recursive: true, force: true });
rmSync(join(outDir, 'dossier.json'), { force: true });
mkdirSync(outDir, { recursive: true });
cpSync(appDir, join(outDir, 'app'), { recursive: true });
cpSync(shotsDir, join(outDir, 'screenshots'), { recursive: true });

const dossier = buildDossier(outDir, dossierCaps);
writeFileSync(join(outDir, 'dossier.json'), dossier);
console.log(`wrote ${outDir}/dossier.json (${dossier.length} bytes)`);
console.log(`copied app/ and ${shotFiles.length} screenshots (${shotFiles.join(', ')})`);
