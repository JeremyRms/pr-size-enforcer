import { DEFAULT_CONFIG } from '../config.js';
import { hasBypassLabel } from '../pullRequestSize.js';

describe('Bypass Label Tests', () => {
    test('should skip enforcement when a configured bypass label is present', () => {
        expect(
            hasBypassLabel(['needs-review', 'pr-size:ignore'], DEFAULT_CONFIG.bypassLabels),
        ).toBe(true);
    });

    test('should not skip enforcement when no bypass label is present', () => {
        expect(
            hasBypassLabel(['needs-review', 'backend'], DEFAULT_CONFIG.bypassLabels),
        ).toBe(false);
    });
});
