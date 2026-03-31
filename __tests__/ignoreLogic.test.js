import { normalizeConfig } from '../config.js';
import { analyzePullRequestFiles } from '../pullRequestSize.js';

describe('Ignore Logic Tests', () => {
    test('should ignore files based on suffixes and glob patterns', () => {
        const config = normalizeConfig();
        const analysis = analyzePullRequestFiles(
            [
                { filename: 'src/file1.js', additions: 10, deletions: 5 },
                { filename: 'dist/file2.min.js', additions: 20, deletions: 10 },
                { filename: 'build/file3.lock', additions: 15, deletions: 5 },
                { filename: 'src/file4.snap', additions: 5, deletions: 5 },
            ],
            config,
        );

        expect(analysis.changedLines).toBe(15);
        expect(analysis.ignoredFiles).toHaveLength(3);
    });

    test('should count only configured languages when only_languages is set', () => {
        const config = normalizeConfig({
            only_languages: ['javascript', 'typescript'],
        });
        const analysis = analyzePullRequestFiles(
            [
                { filename: 'src/file1.js', additions: 10, deletions: 5 },
                { filename: 'docs/readme.md', additions: 20, deletions: 10 },
                { filename: 'pkg/main.go', additions: 15, deletions: 5 },
            ],
            config,
        );

        expect(analysis.changedLines).toBe(15);
        expect(analysis.ignoredFiles).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    filename: 'docs/readme.md',
                    reason: 'language not counted',
                }),
                expect.objectContaining({
                    filename: 'pkg/main.go',
                    reason: 'language not counted',
                }),
            ]),
        );
    });
});
