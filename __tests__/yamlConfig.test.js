const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const loadConfigFromYAML = (repoPath) => {
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
};

test('should load configuration from YAML file if it exists', () => {
    const mockRepoPath = path.join(__dirname, 'mock-repo');
    const config = loadConfigFromYAML(mockRepoPath);
    expect(config).toEqual({ max_loc: 300, ignored_suffixes: ['.test.js'], ignored_patterns: ['**/test/**'] });
}); 
