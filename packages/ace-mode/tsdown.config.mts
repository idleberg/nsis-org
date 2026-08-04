import { readFileSync } from 'node:fs';
import { defineConfig } from 'tsdown';
import Macros from 'unplugin-macros/rolldown';

/**
 * Ace loads modes as AMD modules registered under a well-known identifier, a
 * format no bundler emits. The highlight rules are bundled (to expand macros),
 * the mode itself is verbatim source, and both get wrapped here.
 */
function aceModules() {
	return {
		name: 'ace-modules',

		generateBundle(_options, bundle) {
			const [fileName, chunk] = Object.entries(bundle).find(([, output]) => output.type === 'chunk');
			delete bundle[fileName];

			const modeSource = readFileSync(new URL('src/nsis.js', import.meta.url), 'utf-8');

			const modules = [
				{ id: 'ace/mode/nsis_highlight_rules', source: chunk.code },
				{ id: 'ace/mode/nsis', source: modeSource },
			];

			for (const [name, prefix, requireFn] of [
				['mode-nsis.js', '', 'window.require'],
				['mode-nsis.noconflict.js', 'ace.', 'ace.require'],
			]) {
				const source = [
					modules.map(({ id, source }) => wrapModule(id, source, prefix)).join('\n'),
					wrapBootstrap('ace/mode/nsis', requireFn),
				].join('');

				this.emitFile({ type: 'asset', fileName: name, source });
			}
		},
	};
}

function wrapModule(moduleId, source, prefix) {
	const body = extractModuleBody(source);
	const dependencies = extractDependencies(source)
		.map((dependency) => `"${dependency}"`)
		.join(',');

	return `${prefix}define("${moduleId}",[${dependencies}], function(require, exports, module) {\n${body}\n});`;
}

function extractModuleBody(source) {
	const openIndex = source.indexOf('{');
	const closeIndex = source.lastIndexOf('}');

	return source.slice(openIndex + 1, closeIndex).replace(/\n$/, '');
}

function extractDependencies(source) {
	const dependencies = ['require', 'exports', 'module'];
	const requirePattern = /require\(['"]([^'"]+)['"]\)/g;

	for (const match of source.matchAll(requirePattern)) {
		const dependency = match[1];
		const resolved = dependency.startsWith('../')
			? `ace/${dependency.slice(3)}`
			: dependency.startsWith('./')
				? `ace/mode/${dependency.slice(2)}`
				: dependency;

		if (!dependencies.includes(resolved)) {
			dependencies.push(resolved);
		}
	}

	return dependencies;
}

function wrapBootstrap(moduleId, requireFn) {
	return [
		'                (function() {',
		`                    ${requireFn}(["${moduleId}"], function(m) {`,
		'                        if (typeof module == "object" && typeof exports == "object" && module) {',
		'                            module.exports = m;',
		'                        }',
		'                    });',
		'                })();\n',
	].join('\n');
}

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
