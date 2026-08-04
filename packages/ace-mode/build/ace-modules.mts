import { readFileSync } from 'node:fs';
import type { Rolldown, TsdownPlugin } from 'tsdown';

/**
 * Ace loads modes as AMD modules registered under a well-known identifier, a
 * format no bundler emits. The highlight rules are bundled (to expand macros),
 * the mode itself is verbatim source, and both get wrapped here.
 */
export function aceModules(): TsdownPlugin {
	return {
		name: 'ace-modules',

		generateBundle(_options, bundle) {
			const entry = Object.entries(bundle).find(
				(entry): entry is [string, Rolldown.OutputChunk] => entry[1].type === 'chunk',
			);

			if (!entry) {
				throw new Error('Expected the bundle to contain a chunk');
			}

			const [fileName, chunk] = entry;
			delete bundle[fileName];

			const modeSource = readFileSync(new URL('../src/nsis.js', import.meta.url), 'utf-8');

			const modules = [
				{ id: 'ace/mode/nsis_highlight_rules', source: chunk.code },
				{ id: 'ace/mode/nsis', source: modeSource },
			];

			for (const [name, prefix, requireFn] of [
				['mode-nsis.js', '', 'window.require'],
				['mode-nsis.noconflict.js', 'ace.', 'ace.require'],
			] as const) {
				const source = [
					modules.map(({ id, source }) => wrapModule(id, source, prefix)).join('\n'),
					wrapBootstrap('ace/mode/nsis', requireFn),
				].join('');

				this.emitFile({ type: 'asset', fileName: name, source });
			}
		},
	};
}

function wrapModule(moduleId: string, source: string, prefix: string): string {
	const body = extractModuleBody(source);
	const dependencies = extractDependencies(source)
		.map((dependency) => `"${dependency}"`)
		.join(',');

	return `${prefix}define("${moduleId}",[${dependencies}], function(require, exports, module) {\n${body}\n});`;
}

function extractModuleBody(source: string): string {
	const openIndex = source.indexOf('{');
	const closeIndex = source.lastIndexOf('}');

	return source.slice(openIndex + 1, closeIndex).replace(/\n$/, '');
}

function extractDependencies(source: string): string[] {
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

function wrapBootstrap(moduleId: string, requireFn: string): string {
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
