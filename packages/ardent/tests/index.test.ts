import { createFormatter } from '@nsis/ardent';
import { describe, expect, it } from 'vitest';

describe('createFormatter', () => {
	it('formats with default options', () => {
		const { format } = createFormatter();

		expect(format('section "Test"\ndetailprint "hi"\nsectionend\n')).toBe(
			'Section "Test"\n\tDetailPrint "hi"\nSectionEnd\n',
		);
	});

	it('returns null from check when the input is already formatted', () => {
		const { check } = createFormatter({ endOfLine: 'lf' });

		expect(check('DetailPrint "hi"\n')).toBeNull();
		expect(check('detailprint "hi"\n')).toBe('DetailPrint "hi"\n');
	});

	it('throws on invalid options', () => {
		expect(() => createFormatter({ useTabs: false, indentSize: 0 })).toThrow('indent_size');
		expect(() => createFormatter({ indentSize: -1 })).toThrow();
		// @ts-expect-error testing an invalid value
		expect(() => createFormatter({ commentStyle: 'slash' })).toThrow('slash');
	});

	it('throws on input it cannot parse', () => {
		const { format } = createFormatter();

		expect(() => format('DetailPrint "unterminated\n')).toThrow();
	});
});
