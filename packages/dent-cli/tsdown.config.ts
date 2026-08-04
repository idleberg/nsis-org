import { defineConfig } from 'tsdown';
import pkg from './package.json' with { type: 'json' };

export default defineConfig((options) => {
	const isProduction = options.watch !== true;

	return {
		target: 'node20',
		clean: isProduction,
		dts: isProduction,
		entry: {
			cli: 'src/main.ts',
		},
		deps: {
			neverBundle: [
				...Object.keys(pkg.dependencies),

				// ensure we always read the current version from the manifest
				'../package.json',
			],
		},
		format: 'esm',
		minify: isProduction,
		outDir: 'bin',
	};
});
