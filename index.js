const micromatch = require('micromatch');
const { ProbotOctokit } = require('probot');
const octokit = new ProbotOctokit();

const maxLoc = parseInt(process.env.LOC_THRESHOLD, 10);
if (isNaN(maxLoc)) {
    console.error('Error: LOC_THRESHOLD is not set or is not a valid number. LOC_THRESHOLD:', process.env.LOC_THRESHOLD);
} else {
    console.log('maxLoc', maxLoc);
}

// Use octokit's request hooks to log the actual URLs being called
octokit.hook.before('request', async (options) => {
    console.log(`Request URL: ${options.method} ${options.url}`);
});

/**
 * @param {import('probot').Probot} app
 */
module.exports = (app) => {
    app.onAny(async (context) => {
        context.log.info({ event: context.name, action: context.payload.action });
    });

    app.onError(async (error) => {
        app.log.error(error);
    });

    app.on(['pull_request.opened', 'pull_request.synchronize'], async (context) => {
        const { owner, name } = context.payload.repository;
        const pr = context.payload.pull_request;

        console.log(`Fetching files for PR #${pr.number} from repo ${owner.login}/${name}`);

        const files = await context.octokit.paginate(
            context.octokit.pulls.listFiles,
            {
                owner: owner.login,
                repo: name,
                pull_number: pr.number,
                per_page: 10,
            }
        );

        const loc = files.reduce((sum, f) => {
            const ignored = repoConfig.ignored_suffixes.some((suffix) =>
                f.filename.endsWith(suffix)
            ) || repoConfig.ignored_patterns.some((pattern) =>
                micromatch.isMatch(f.filename, pattern)
            );
            return ignored ? sum : sum + f.additions + f.deletions;
        }, 0);

        const labels = pr.labels.map(label => label.name);
        const hasNoAutoCloseLabel = labels.includes('no-auto-close');

        if (hasNoAutoCloseLabel) {
            console.log(`PR #${pr.number} has 'no-auto-close' label. Skipping size check.`);
            return;
        }

        if (loc > maxLoc) {
            console.log(`Posting comment to PR #${pr.number} in repo ${owner.login}/${name}`);
            await context.octokit.issues.createComment({
                owner: owner.login,
                repo: name,
                issue_number: pr.number,
                body: `🚫 This PR exceeds the allowed size of ${maxLoc} LOC (actual: ${loc}). Please split it into smaller parts.`,
            });

            console.log(`Closing PR #${pr.number} in repo ${owner.login}/${name}`);
            await context.octokit.pulls.update({
                owner: owner.login,
                repo: name,
                pull_number: pr.number,
                state: 'closed',
            });
        }
    });
}; 
