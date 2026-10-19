import { Formatter } from '../dist/ardent_wasm.js';

/** @type {import('./index.d.ts').createFormatter} */
export function createFormatter(options) {
	const formatter = new Formatter(options);

	return {
		format: (fileContents) => formatter.format(fileContents),
		check: (fileContents) => formatter.check(fileContents) ?? null,
	};
}
