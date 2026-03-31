import fs from 'fs';
import { jest } from '@jest/globals';
import { handlePullRequest } from '../index.js';

const payloadOpened = JSON.parse(
    fs.readFileSync(
        new URL('./fixtures/pull_request.opened.json', import.meta.url),
        'utf8',
    ),
);

const payloadBypassed = JSON.parse(
    fs.readFileSync(
        new URL('./fixtures/pull_request_no_auto_close.json', import.meta.url),
        'utf8',
    ),
);

function createContext({ payload, files, repoConfigContent }) {
    return {
        payload,
        log: {
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
        },
        octokit: {
            paginate: jest.fn().mockResolvedValue(files),
            pulls: {
                listFiles: jest.fn(),
            },
            repos: {
                getContent: jest.fn().mockImplementation(async ({ path }) => {
                    if (!repoConfigContent || path !== '.github/pr-size-enforcer.yml') {
                        const error = new Error('Not Found');
                        error.status = 404;
                        throw error;
                    }

                    return {
                        data: {
                            content: Buffer.from(repoConfigContent).toString('base64'),
                        },
                    };
                }),
            },
            checks: {
                create: jest.fn().mockResolvedValue({}),
            },
        },
    };
}

describe('handlePullRequest', () => {
    test('creates a successful check when the PR is within the default limit', async () => {
        const context = createContext({
            payload: payloadOpened,
            files: [
                { filename: 'src/file1.js', additions: 100, deletions: 50 },
                { filename: 'src/file2.js', additions: 80, deletions: 20 },
            ],
        });

        await handlePullRequest(context);

        expect(context.octokit.paginate).toHaveBeenCalledWith(
            context.octokit.pulls.listFiles,
            expect.objectContaining({ pull_number: 1, per_page: 100 }),
        );
        expect(context.octokit.checks.create).toHaveBeenCalledWith(
            expect.objectContaining({
                owner: 'owner',
                repo: 'test-repo',
                head_sha: 'abc123',
                conclusion: 'success',
            }),
        );
    });

    test('creates a failing check when counted lines exceed the configured limit', async () => {
        const context = createContext({
            payload: payloadOpened,
            repoConfigContent: [
                'max_changed_lines: 200',
                'only_languages:',
                '  - javascript',
            ].join('\n'),
            files: [
                { filename: 'src/file1.js', additions: 150, deletions: 100 },
                { filename: 'docs/readme.md', additions: 200, deletions: 50 },
            ],
        });

        await handlePullRequest(context);

        expect(context.octokit.checks.create).toHaveBeenCalledWith(
            expect.objectContaining({
                conclusion: 'failure',
                output: expect.objectContaining({
                    title: 'PR size exceeds limit (250/200)',
                }),
            }),
        );
    });

    test('creates a successful check when a bypass label is present', async () => {
        const context = createContext({
            payload: payloadBypassed,
            files: [
                { filename: 'src/file1.js', additions: 400, deletions: 300 },
            ],
        });

        await handlePullRequest(context);

        expect(context.octokit.checks.create).toHaveBeenCalledWith(
            expect.objectContaining({
                conclusion: 'success',
                output: expect.objectContaining({
                    title: 'PR size check bypassed (700/500)',
                }),
            }),
        );
    });
});
