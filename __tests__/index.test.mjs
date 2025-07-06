const { Probot, ProbotOctokit } = require('probot');
const nock = require('nock');
process.env.LOC_THRESHOLD = '500'; // needs to be set before the app is loaded
const myProbotApp = require('../index');

nock.disableNetConnect();

let probot;

// Mock repoConfig for tests
const repoConfig = {
    ignored_suffixes: ['.md', '.txt'],
    ignored_patterns: ['docs/*', 'test/*']
};

beforeEach(() => {
    probot = new Probot({
        appId: 123,
        privateKey: 'test',
        secret: 'testsecret',
        Octokit: ProbotOctokit.defaults({
            retry: { enabled: false },
            throttle: { enabled: false },
        }),
    });
    probot.load(myProbotApp);

    // Set the default repoConfig for each test
    global.repoConfig = repoConfig;

    // Set the LOC_THRESHOLD environment variable for the test
    process.env.LOC_THRESHOLD = '500';
});

afterEach(() => {
    // Clean up the environment variables
    delete process.env.LOC_THRESHOLD;

    // Clean up the global variables
    delete global.repoConfig;
});

describe('My Probot app', () => {
    test('responds to pull_request.opened event - LOC does not exceed maxLoc', async () => {
        const payload = require('./fixtures/pull_request.opened.json');

        const listFilesMock = nock('https://api.github.com')
            .get('/repos/owner/test-repo/pulls/1/files?per_page=10')
            .reply(200, [
                { filename: 'file1.js', additions: 100, deletions: 0 },
                { filename: 'file2.js', additions: 100, deletions: 0 }
            ]);

        const commentMock = nock('https://api.github.com')
            .post('/repos/owner/test-repo/issues/1/comments')
            .reply(200);

        const closePullRequestMock = nock('https://api.github.com')
            .patch('/repos/owner/test-repo/pulls/1', { state: 'closed' })
            .reply(200, {});

        await probot.receive({ name: 'pull_request', payload });

        expect(listFilesMock.isDone()).toBe(true);
        expect(commentMock.isDone()).toBe(false); // No comment should be posted
        expect(closePullRequestMock.isDone()).toBe(false); // No pull request should be closed
    });

    test('responds to pull_request.synchronize event - LOC does not exceed maxLoc', async () => {
        const payload = require('./fixtures/pull_request.synchronize.json');

        const listFilesMock = nock('https://api.github.com')
            .get('/repos/owner/test-repo/pulls/1/files?per_page=10')
            .reply(200, [
                { filename: 'file1.js', additions: 100, deletions: 0 },
                { filename: 'file2.js', additions: 100, deletions: 0 }
            ]);

        const commentMock = nock('https://api.github.com')
            .post('/repos/owner/test-repo/issues/1/comments')
            .reply(200);

        const closePullRequestMock = nock('https://api.github.com')
            .patch('/repos/owner/test-repo/pulls/1', { state: 'closed' })
            .reply(200, {});

        await probot.receive({ name: 'pull_request', payload });

        expect(listFilesMock.isDone()).toBe(true);
        expect(commentMock.isDone()).toBe(false); // No comment should be posted
        expect(closePullRequestMock.isDone()).toBe(false); // No pull request should be closed
    });

    test('does not post comment if no-auto-close label is present', async () => {
        const payload = require('./fixtures/pull_request.opened.json');
        payload.pull_request.labels.push({ name: 'no-auto-close' }); // no-auto-close label is present!

        const listFilesMock = nock('https://api.github.com')
            .get('/repos/owner/test-repo/pulls/1/files?per_page=10')
            .reply(200, [
                { filename: 'file1.js', additions: 300, deletions: 0 },
                { filename: 'file2.js', additions: 0, deletions: 300 }
            ]);

        const commentMock = nock('https://api.github.com')
            .post('/repos/owner/test-repo/issues/1/comments')
            .reply(200);

        const closePullRequestMock = nock('https://api.github.com')
            .patch('/repos/owner/test-repo/pulls/1', { state: 'closed' })
            .reply(200, {});

        await probot.receive({ name: 'pull_request', payload });

        expect(listFilesMock.isDone()).toBe(true);
        expect(commentMock.isDone()).toBe(false); // No comment should be posted
        expect(closePullRequestMock.isDone()).toBe(false); // No pull request should be closed
    });

    test('responds to pull_request.opened event - LOC exceeds maxLoc', async () => {
        const payload = require('./fixtures/pull_request.opened.json');

        const listFilesMock = nock('https://api.github.com')
            .get('/repos/owner/test-repo/pulls/1/files?per_page=10')
            .reply(200, [
                { filename: 'file1.js', additions: 300, deletions: 0 },
                { filename: 'file2.js', additions: 0, deletions: 300 }
            ]);

        const commentMock = nock('https://api.github.com')
            .post('/repos/owner/test-repo/issues/1/comments')
            .reply(200);

        const closePullRequestMock = nock('https://api.github.com')
            .patch('/repos/owner/test-repo/pulls/1', { state: 'closed' })
            .reply(200, {});

        await probot.receive({ name: 'pull_request', payload });

        expect(listFilesMock.isDone()).toBe(true);
        expect(commentMock.isDone()).toBe(true); // Comment should be posted
        expect(closePullRequestMock.isDone()).toBe(true); // Pull request should be closed
    });
}); 
