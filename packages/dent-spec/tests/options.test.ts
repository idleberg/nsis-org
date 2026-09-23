import * as v from 'valibot';
import { describe, expect, it } from 'vitest';
import { DEFAULT_OPTIONS } from '../src/index.ts';
import { OptionsSchema } from '../src/schemas.ts';

describe('DEFAULT_OPTIONS', () => {
	/**
	 * `src/index.ts` restates the defaults as a literal to keep Valibot out of the published
	 * entry point. This is the guard that makes that safe: the literal and the schema it
	 * mirrors cannot drift apart without failing here.
	 */
	it('matches the defaults declared by OptionsSchema', () => {
		expect(DEFAULT_OPTIONS).toEqual(v.getDefaults(OptionsSchema));
	});

	it('is itself a valid options set', () => {
		expect(() => v.parse(OptionsSchema, DEFAULT_OPTIONS)).not.toThrow();
	});
});
