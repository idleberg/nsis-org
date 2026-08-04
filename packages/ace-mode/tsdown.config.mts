import { defineConfig } from 'tsdown';
import Macros from 'unplugin-macros/rolldown';
import { aceModules } from './build/ace-modules.mts';

export default defineConfig({
	entry: 'src/nsis_highlight_rules.js',
	// AMD modules are neither, but ESM output appends an `export {}` marker
	format: 'cjs',
	clean: true,
	dts: false,
	minify: false,
	treeshake: false,
	plugins: [Macros(), aceModules()],
});
