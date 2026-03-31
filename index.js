import { loadRepoConfig } from './config.js';
import { evaluatePullRequest } from './pullRequestSize.js';

export const PULL_REQUEST_EVENTS = [
    'pull_request.opened',
    'pull_request.reopened',
    'pull_request.ready_for_review',
    'pull_request.synchronize',
    'pull_request.labeled',
    'pull_request.unlabeled',
];

export async function handlePullRequest(context) {
    const owner = context.payload.repository.owner.login;
    const repo = context.payload.repository.name;
    const pullRequest = context.payload.pull_request;
    const headSha = pullRequest.head?.sha;

    if (!headSha) {
        context.log.warn(
            { pullRequestNumber: pullRequest.number },
            'Skipping PR size check because the head SHA is missing.',
        );
        return;
    }

    const config = await loadRepoConfig(context, { owner, repo, ref: headSha });

    const files = await context.octokit.paginate(
        context.octokit.pulls.listFiles,
        {
            owner,
            repo,
            pull_number: pullRequest.number,
            per_page: 100,
        },
    );

    const labels = (pullRequest.labels || []).map(({ name }) => name);
    const evaluation = evaluatePullRequest({ config, files, labels });

    await context.octokit.checks.create({
        owner,
        repo,
        name: config.checkName,
        head_sha: headSha,
        status: 'completed',
        conclusion: evaluation.conclusion,
        output: evaluation.output,
    });

    context.log.info(
        {
            pullRequestNumber: pullRequest.number,
            changedLines: evaluation.analysis.changedLines,
            maxChangedLines: config.maxChangedLines,
            conclusion: evaluation.conclusion,
        },
        'Completed PR size check.',
    );
}

/**
 * @param {import('probot').Probot} app
 */
export default (app) => {
    app.onAny(async (context) => {
        context.log.info({ event: context.name, action: context.payload.action });
    });

    app.onError(async (error) => {
        app.log.error(error);
    });

    app.on(PULL_REQUEST_EVENTS, handlePullRequest);
};
