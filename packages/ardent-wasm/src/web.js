import init from '../dist/ardent_wasm.js';

// Fetches the module next to the bindings, a URL that bundlers resolve without configuration.
await init();

export { createFormatter } from './index.js';
