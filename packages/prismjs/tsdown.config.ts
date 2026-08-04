import { defineConfig } from 'tsdown';
import Macros from 'unplugin-macros/rolldown';

export default defineConfig((options) => {
	const isProduction = options.watch !== true;

	return {
		target: 'node20',
		clean: isProduction,
		dts: isProduction,
		entry: 'src/nsis.ts',
		format: ['cjs', 'esm'],
		minify: isProduction,
		plugins: [Macros()],
	};
});
