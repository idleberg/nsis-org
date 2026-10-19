import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const packageRoot = fileURLToPath(new URL('..', import.meta.url));

// One build serves both entries: the web target can also be instantiated synchronously in Node.js.
execFileSync('wasm-pack', ['build', '--release', '--no-pack', '--target', 'web', '--out-dir', 'dist'], {
	cwd: packageRoot,
	stdio: 'inherit',
});

// wasm-pack ignores everything in its output directory, which would keep it out of the npm tarball.
rmSync(new URL('../dist/.gitignore', import.meta.url));
