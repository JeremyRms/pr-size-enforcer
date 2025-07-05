const fs = require('fs');
const path = require('path');
const micromatch = require('micromatch');

const configPath = path.join(__dirname, '..', 'ignore-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const testFiles = [
    { filename: 'src/file1.js', additions: 10, deletions: 5 },
    { filename: 'dist/file2.min.js', additions: 20, deletions: 10 },
    { filename: 'build/file3.lock', additions: 15, deletions: 5 },
    { filename: 'src/file4.snap', additions: 5, deletions: 5 },
];

const calculateLOC = (files) => {
    return files.reduce((sum, f) => {
        const ignored = config.ignored_suffixes.some((suffix) =>
            f.filename.endsWith(suffix)
        ) || config.ignored_patterns.some((pattern) =>
            micromatch.isMatch(f.filename, pattern)
        );
        return ignored ? sum : sum + f.additions + f.deletions;
    }, 0);
};

test('should ignore files based on glob patterns', () => {
    const loc = calculateLOC(testFiles);
    expect(loc).toBe(15); // Only the first file should be counted
}); 
