const fs = require('fs');
const path = require('path');

describe('Configuration Tests', () => {
  test('ignore-config.json should be valid JSON', () => {
    const configPath = path.join(__dirname, '..', 'ignore-config.json');
    const configContent = fs.readFileSync(configPath, 'utf8');

    expect(() => {
      JSON.parse(configContent);
    }).not.toThrow();
  });

  test('ignore-config.json should have required properties', () => {
    const configPath = path.join(__dirname, '..', 'ignore-config.json');
    const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

    expect(config).toHaveProperty('max_loc');
    expect(config).toHaveProperty('ignored_suffixes');
    expect(config).toHaveProperty('ignored_files');
    expect(config).toHaveProperty('ignored_patterns');

    expect(typeof config.max_loc).toBe('number');
    expect(Array.isArray(config.ignored_suffixes)).toBe(true);
    expect(Array.isArray(config.ignored_files)).toBe(true);
    expect(Array.isArray(config.ignored_patterns)).toBe(true);
  });

  test('package.json should have required scripts', () => {
    const packagePath = path.join(__dirname, '..', 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

    expect(packageJson.scripts).toHaveProperty('start');
    expect(packageJson.scripts).toHaveProperty('test');
    expect(packageJson.scripts).toHaveProperty('lint');
    expect(packageJson.dependencies).toHaveProperty('probot');
  });
});
