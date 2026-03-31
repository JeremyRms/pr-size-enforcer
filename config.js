import fs from 'fs';
import yaml from 'js-yaml';
import { normalizeLanguageName } from './languages.js';

const defaultIgnoreConfig = JSON.parse(
    fs.readFileSync(new URL('./ignore-config.json', import.meta.url), 'utf8'),
);

const DEFAULT_THRESHOLD = Number.parseInt(process.env.LOC_THRESHOLD || '500', 10);

export const DEFAULT_CONFIG = Object.freeze({
    maxChangedLines: Number.isFinite(DEFAULT_THRESHOLD) ? DEFAULT_THRESHOLD : 500,
    checkName: process.env.CHECK_NAME || 'PR Size Enforcer',
    bypassLabels: ['pr-size:ignore', 'no-auto-close'],
    onlyLanguages: [],
    ignoreLanguages: [],
    ignore: {
        suffixes: [...defaultIgnoreConfig.ignored_suffixes],
        files: [...defaultIgnoreConfig.ignored_files],
        patterns: [...defaultIgnoreConfig.ignored_patterns],
    },
});

const CONFIG_PATHS = [
    '.github/pr-size-enforcer.yml',
    '.github/pr-size-enforcer.yaml',
];

function ensureArray(value) {
    if (Array.isArray(value)) {
        return value;
    }

    if (typeof value === 'string' && value.trim()) {
        return [value];
    }

    return [];
}

function uniqueStrings(values) {
    return [...new Set(
        values
            .filter((value) => typeof value === 'string')
            .map((value) => value.trim())
            .filter(Boolean),
    )];
}

function normalizeLanguages(values) {
    return uniqueStrings(values)
        .map((value) => normalizeLanguageName(value))
        .filter(Boolean);
}

function normalizeThreshold(value) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_CONFIG.maxChangedLines;
}

export function normalizeConfig(rawConfig = {}) {
    const ignoreConfig = rawConfig.ignore || {};
    const configuredOnlyLanguages = rawConfig.only_languages ?? rawConfig.languages;
    const configuredIgnoreLanguages = rawConfig.ignore_languages ?? ignoreConfig.languages;

    return {
        maxChangedLines: normalizeThreshold(
            rawConfig.max_changed_lines ?? rawConfig.max_loc,
        ),
        checkName: rawConfig.check_name || DEFAULT_CONFIG.checkName,
        bypassLabels: uniqueStrings([
            ...DEFAULT_CONFIG.bypassLabels,
            ...ensureArray(rawConfig.bypass_labels),
        ]),
        onlyLanguages: normalizeLanguages(ensureArray(configuredOnlyLanguages)),
        ignoreLanguages: normalizeLanguages(ensureArray(configuredIgnoreLanguages)),
        ignore: {
            suffixes: uniqueStrings([
                ...DEFAULT_CONFIG.ignore.suffixes,
                ...ensureArray(ignoreConfig.suffixes),
                ...ensureArray(rawConfig.ignored_suffixes),
            ]),
            files: uniqueStrings([
                ...DEFAULT_CONFIG.ignore.files,
                ...ensureArray(ignoreConfig.files),
                ...ensureArray(rawConfig.ignored_files),
            ]),
            patterns: uniqueStrings([
                ...DEFAULT_CONFIG.ignore.patterns,
                ...ensureArray(ignoreConfig.patterns),
                ...ensureArray(rawConfig.ignored_patterns),
            ]),
        },
    };
}

function decodeRepositoryFile(response) {
    if (!response?.data || Array.isArray(response.data) || !response.data.content) {
        return null;
    }

    return Buffer.from(response.data.content, 'base64').toString('utf8');
}

async function fetchRepoConfigContent(context, { owner, repo, ref }, index = 0) {
    const path = CONFIG_PATHS[index];

    if (!path) {
        return null;
    }

    try {
        const response = await context.octokit.repos.getContent({
            owner,
            repo,
            path,
            ref,
        });

        const content = decodeRepositoryFile(response);
        return content ? { content, path } : null;
    } catch (error) {
        if (error.status === 404) {
            return fetchRepoConfigContent(context, { owner, repo, ref }, index + 1);
        }

        throw error;
    }
}

export async function loadRepoConfig(context, repositoryRef) {
    const repoConfig = await fetchRepoConfigContent(context, repositoryRef);

    if (!repoConfig) {
        return DEFAULT_CONFIG;
    }

    try {
        const parsed = yaml.load(repoConfig.content) || {};
        return normalizeConfig(parsed);
    } catch (error) {
        context.log.warn(
            { error, path: repoConfig.path },
            'Failed to parse repository config; using defaults instead.',
        );
        return DEFAULT_CONFIG;
    }
}
