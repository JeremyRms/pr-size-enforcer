import path from 'path';
import micromatch from 'micromatch';
import { detectLanguage } from './languages.js';

function matchesIgnoredFile(filename, ignoredFiles) {
    const basename = path.basename(filename);
    return ignoredFiles.some((entry) => entry === filename || entry === basename);
}

function getIgnoredReason(file, config) {
    if (matchesIgnoredFile(file.filename, config.ignore.files)) {
        return 'ignored file';
    }

    if (config.ignore.suffixes.some((suffix) => file.filename.endsWith(suffix))) {
        return 'ignored suffix';
    }

    if (micromatch.some(file.filename, config.ignore.patterns)) {
        return 'ignored pattern';
    }

    const language = detectLanguage(file.filename);

    if (config.ignoreLanguages.includes(language)) {
        return 'ignored language';
    }

    if (config.onlyLanguages.length > 0 && !config.onlyLanguages.includes(language)) {
        return 'language not counted';
    }

    return null;
}

export function analyzePullRequestFiles(files, config) {
    return files.reduce((analysis, file) => {
        const changedLines = file.additions + file.deletions;
        const language = detectLanguage(file.filename);
        const ignoredReason = getIgnoredReason(file, config);

        if (ignoredReason) {
            return {
                ...analysis,
                ignoredFiles: [
                    ...analysis.ignoredFiles,
                    {
                        filename: file.filename,
                        reason: ignoredReason,
                        language,
                        changedLines,
                    },
                ],
            };
        }

        return {
            ...analysis,
            changedLines: analysis.changedLines + changedLines,
            countedFiles: [
                ...analysis.countedFiles,
                {
                    filename: file.filename,
                    language,
                    changedLines,
                },
            ],
            languageBreakdown: {
                ...analysis.languageBreakdown,
                [language]: (analysis.languageBreakdown[language] || 0) + changedLines,
            },
        };
    }, {
        changedLines: 0,
        countedFiles: [],
        ignoredFiles: [],
        languageBreakdown: {},
    });
}

export function hasBypassLabel(labels, bypassLabels) {
    return labels.some((label) => bypassLabels.includes(label));
}

function formatLanguageBreakdown(languageBreakdown) {
    const entries = Object.entries(languageBreakdown)
        .sort((left, right) => right[1] - left[1]);

    if (entries.length === 0) {
        return 'No files were counted.';
    }

    return entries
        .map(([language, changedLines]) => `- \`${language}\`: ${changedLines} changed lines`)
        .join('\n');
}

function formatIgnoredFiles(ignoredFiles) {
    if (ignoredFiles.length === 0) {
        return 'No files were ignored.';
    }

    return ignoredFiles
        .slice(0, 10)
        .map(({ filename, reason }) => `- \`${filename}\` (${reason})`)
        .join('\n');
}

export function buildCheckOutput({ analysis, bypassed, config }) {
    const countedFileCount = analysis.countedFiles.length;
    const ignoredFileCount = analysis.ignoredFiles.length;
    const withinLimit = analysis.changedLines <= config.maxChangedLines;

    let title = `PR size is within limit (${analysis.changedLines}/${config.maxChangedLines})`;
    let summary = `Counted ${analysis.changedLines} changed lines across ${countedFileCount} files. ${ignoredFileCount} files were ignored.`;

    if (bypassed) {
        title = `PR size check bypassed (${analysis.changedLines}/${config.maxChangedLines})`;
        summary = `A bypass label is present, so this PR passes even though ${analysis.changedLines} changed lines were counted. ${ignoredFileCount} files were ignored.`;
    } else if (!withinLimit) {
        title = `PR size exceeds limit (${analysis.changedLines}/${config.maxChangedLines})`;
        summary = `This PR counted ${analysis.changedLines} changed lines, which is above the configured limit of ${config.maxChangedLines}.`;
    }

    const rules = [];

    if (config.onlyLanguages.length > 0) {
        rules.push(`Only these languages are counted: ${config.onlyLanguages.join(', ')}.`);
    }

    if (config.ignoreLanguages.length > 0) {
        rules.push(`Ignored languages: ${config.ignoreLanguages.join(', ')}.`);
    }

    return {
        title,
        summary,
        text: [
            '### Result',
            `- Threshold: ${config.maxChangedLines} changed lines`,
            `- Counted lines: ${analysis.changedLines}`,
            `- Counted files: ${countedFileCount}`,
            `- Ignored files: ${ignoredFileCount}`,
            '',
            ...rules,
            rules.length > 0 ? '' : null,
            '### Language Breakdown',
            formatLanguageBreakdown(analysis.languageBreakdown),
            '',
            '### Ignored Files',
            formatIgnoredFiles(analysis.ignoredFiles),
        ]
            .filter(Boolean)
            .join('\n'),
    };
}

export function evaluatePullRequest({ config, files, labels }) {
    const analysis = analyzePullRequestFiles(files, config);
    const bypassed = hasBypassLabel(labels, config.bypassLabels);
    const conclusion =
        bypassed || analysis.changedLines <= config.maxChangedLines
            ? 'success'
            : 'failure';

    return {
        analysis,
        bypassed,
        conclusion,
        output: buildCheckOutput({ analysis, bypassed, config }),
    };
}
