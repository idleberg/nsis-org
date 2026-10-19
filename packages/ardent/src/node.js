import { readFileSync } from 'node:fs';
import { initSync } from '../dist/ardent_wasm.js';

// Node.js can read the module from disk, so it loads synchronously.
initSync({ module: readFileSync(new URL('../dist/ardent_wasm_bg.wasm', import.meta.url)) });

export { createFormatter } from './index.js';
