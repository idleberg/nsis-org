import { defineConfig } from 'tsdown';
import pkg from './package.json' with { type: 'json' };

export default defineConfig((options) => {
	const isProduction = options.watch !== true;

	return {
		target: 'node20',
		clean: isProduction,
		dts: isProduction,
		entry: ['src/dent.ts'],
		deps: {
			neverBundle: [...Object.keys(pkg.dependencies)],
		},
		format: 'esm',
		minify: isProduction,
	};
});
