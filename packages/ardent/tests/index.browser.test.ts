import { createFormatter } from '@nsis/ardent';
import { expect, it } from 'vitest';

// The browser resolves the default export condition, which fetches the module asynchronously.
it('formats in the browser', () => {
	const { format } = createFormatter({ endOfLine: 'lf' });

	expect(format('detailprint "hi"\n')).toBe('DetailPrint "hi"\n');
});
