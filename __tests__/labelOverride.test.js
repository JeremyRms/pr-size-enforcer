const fs = require('fs');
const path = require('path');
const micromatch = require('micromatch');

const configPath = path.join(__dirname, '..', 'ignore-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

const testPR = {
    number: 1,
    labels: [{ name: 'no-auto-close' }],
    additions: 600,
    deletions: 100,
};

const calculateLOC = (pr) => {
    const loc = pr.additions + pr.deletions;
    const labels = pr.labels.map(label => label.name);
    const hasNoAutoCloseLabel = labels.includes('no-auto-close');

    if (hasNoAutoCloseLabel) {
        return 'skip';
    }

    return loc;
};

test('should skip size check if no-auto-close label is present', () => {
    const result = calculateLOC(testPR);
    expect(result).toBe('skip');
}); 
