import { expect, test } from 'vitest';
import { createFormatter, type DentOptions } from './dent.ts';

// Casts let the tests pass values the types forbid, as untyped JavaScript callers can.
const invalid = (options: Record<string, unknown>) => () => createFormatter(options as DentOptions);

test('Wrong option types throw a TypeError', () => {
	expect(invalid({ commentStyle: 1 })).toThrow(TypeError);
	expect(invalid({ endOfLine: true })).toThrow(TypeError);
	expect(invalid({ indentSize: '4' })).toThrow(TypeError);
	expect(invalid({ printWidth: null })).toThrow(TypeError);
	expect(invalid({ singleQuote: 'yes' })).toThrow(TypeError);
	expect(invalid({ trimEmptyLines: 0 })).toThrow(TypeError);
	expect(invalid({ useTabs: 'false' })).toThrow(TypeError);
});

test('Out-of-range option values throw a RangeError', () => {
	expect(invalid({ commentStyle: 'slash' })).toThrow(RangeError);
	expect(invalid({ endOfLine: 'cr' })).toThrow(RangeError);
	expect(invalid({ indentSize: -1 })).toThrow(RangeError);
	expect(invalid({ indentSize: 2.5 })).toThrow(RangeError);
	expect(invalid({ printWidth: Number.NaN })).toThrow(RangeError);
	expect(invalid({ printWidth: Number.POSITIVE_INFINITY })).toThrow(RangeError);
	expect(invalid({ useTabs: false, indentSize: 0 })).toThrow(RangeError);
});

test('Valid, undefined and unknown options are accepted', () => {
	expect(invalid({ indentSize: 0, printWidth: 0 })).not.toThrow();
	expect(invalid({ commentStyle: undefined, endOfLine: undefined, printWidth: undefined })).not.toThrow();
	expect(invalid({ unknownOption: 42 })).not.toThrow();
});

test('An undefined indentSize falls back to the default with spaces', () => {
	expect(invalid({ useTabs: false, indentSize: undefined })).not.toThrow();
});
