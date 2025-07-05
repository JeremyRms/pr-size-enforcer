const fs = require('fs');
const { Probot } = require('probot');
const micromatch = require('micromatch');
const yaml = require('js-yaml');
const path = require('path');

const config = JSON.parse(fs.readFileSync('./ignore-config.json', 'utf8'));

function loadConfigFromYAML(repoPath) {
    try {
        const yamlPath = path.join(repoPath, '.github', 'auto-close.yml');
        if (fs.existsSync(yamlPath)) {
            const yamlContent = fs.readFileSync(yamlPath, 'utf8');
            return yaml.load(yamlContent);
        }
    } catch (error) {
        console.error('Error loading YAML config:', error);
    }
    return null;
}

module.exports = (app) => {
    app.on(['pull_request.opened', 'pull_request.synchronize'], async (context) => {
        const pr = context.payload.pull_request;
        const repo = context.payload.repository;

        const repoConfig = loadConfigFromYAML(repo.full_name) || config;
        const maxLoc = parseInt(process.env.LOC_THRESHOLD || repoConfig.max_loc || '500');

        const files = await context.octokit.paginate(
            context.octokit.pulls.listFiles,
            {
                owner: repo.owner.login,
                repo: repo.name,
                pull_number: pr.number,
                per_page: 100,
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
            await context.octokit.issues.createComment({
                owner: repo.owner.login,
                repo: repo.name,
                issue_number: pr.number,
                body: `🚫 This PR exceeds the allowed size of ${maxLoc} LOC (actual: ${loc}). Please split it into smaller parts.`,
            });

            await context.octokit.pulls.update({
                owner: repo.owner.login,
                repo: repo.name,
                pull_number: pr.number,
                state: 'closed',
            });
        }
    });
}; 
