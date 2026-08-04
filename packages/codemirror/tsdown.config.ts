import { defineConfig } from 'tsdown';
import pkg from './package.json' with { type: 'json' };

export default defineConfig({
	entry: ['src/index.ts'],
	format: ['esm', 'cjs'],
	deps: {
		neverBundle: [...Object.keys(pkg.dependencies)],
	},
	dts: true,
});
