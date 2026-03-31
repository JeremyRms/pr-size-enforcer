import fs from 'fs';
import { DEFAULT_CONFIG, normalizeConfig } from '../config.js';

describe('Configuration Tests', () => {
    test('ignore-config.json should be valid JSON', () => {
        const configFile = fs.readFileSync(
            new URL('../ignore-config.json', import.meta.url),
            'utf8',
        );
        expect(() => JSON.parse(configFile)).not.toThrow();
    });

    test('normalizeConfig should keep default ignore rules and merge repo overrides', () => {
        const config = normalizeConfig({
            max_changed_lines: 300,
            bypass_labels: ['ship-it'],
            ignored_files: ['generated.txt'],
            ignored_patterns: ['**/fixtures/**'],
        });

        expect(config.maxChangedLines).toBe(300);
        expect(config.bypassLabels).toEqual(
            expect.arrayContaining(['pr-size:ignore', 'no-auto-close', 'ship-it']),
        );
        expect(config.ignore.files).toEqual(
            expect.arrayContaining([...DEFAULT_CONFIG.ignore.files, 'generated.txt']),
        );
        expect(config.ignore.patterns).toEqual(
            expect.arrayContaining([...DEFAULT_CONFIG.ignore.patterns, '**/fixtures/**']),
        );
    });

    test('normalizeConfig should accept legacy field names and language filters', () => {
        const config = normalizeConfig({
            max_loc: 275,
            languages: ['js', 'ts'],
            ignore_languages: ['markdown'],
        });

        expect(config.maxChangedLines).toBe(275);
        expect(config.onlyLanguages).toEqual(['javascript', 'typescript']);
        expect(config.ignoreLanguages).toEqual(['markdown']);
    });
});
