import { defineConfig } from 'tsdown';
import pkg from './package.json' with { type: 'json' };

export default defineConfig((options) => {
	const isProduction = options.watch !== true;

	return {
		target: 'node20',
		clean: isProduction,
		deps: {
			neverBundle: [...Object.keys(pkg.dependencies)],
		},
		dts: isProduction,
		entry: ['src/index.ts'],
		format: 'esm',
		minify: isProduction,
		outDir: 'dist',
	};
});
