import { jest } from '@jest/globals';
import { loadRepoConfig } from '../config.js';

function createContextForConfig({ content, invalid = false }) {
    return {
        log: {
            warn: jest.fn(),
        },
        octokit: {
            repos: {
                getContent: jest.fn().mockImplementation(async ({ path }) => {
                    if (path !== '.github/pr-size-enforcer.yml') {
                        const error = new Error('Not Found');
                        error.status = 404;
                        throw error;
                    }

                    return {
                        data: {
                            content: Buffer.from(invalid ? 'foo: [bar' : content).toString('base64'),
                        },
                    };
                }),
            },
        },
    };
}

describe('Repository YAML Configuration Tests', () => {
    test('should load configuration from the repository YAML file', async () => {
        const context = createContextForConfig({
            content: [
                'max_changed_lines: 300',
                'only_languages:',
                '  - js',
                'ignored_patterns:',
                '  - "**/generated/**"',
            ].join('\n'),
        });

        const config = await loadRepoConfig(context, {
            owner: 'owner',
            repo: 'test-repo',
            ref: 'abc123',
        });

        expect(config.maxChangedLines).toBe(300);
        expect(config.onlyLanguages).toEqual(['javascript']);
        expect(config.ignore.patterns).toContain('**/generated/**');
    });

    test('should fall back to defaults when the repository YAML is invalid', async () => {
        const context = createContextForConfig({
            content: 'ignored_files: []',
            invalid: true,
        });

        const config = await loadRepoConfig(context, {
            owner: 'owner',
            repo: 'test-repo',
            ref: 'abc123',
        });

        expect(config.maxChangedLines).toBe(500);
        expect(context.log.warn).toHaveBeenCalled();
    });
});
