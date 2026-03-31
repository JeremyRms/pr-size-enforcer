import path from 'path';

const EXTENSION_LANGUAGE_MAP = new Map([
    ['.c', 'c'],
    ['.cc', 'cpp'],
    ['.cpp', 'cpp'],
    ['.cs', 'csharp'],
    ['.css', 'css'],
    ['.go', 'go'],
    ['.h', 'c'],
    ['.hpp', 'cpp'],
    ['.html', 'html'],
    ['.java', 'java'],
    ['.js', 'javascript'],
    ['.json', 'json'],
    ['.jsx', 'javascript'],
    ['.kt', 'kotlin'],
    ['.kts', 'kotlin'],
    ['.md', 'markdown'],
    ['.php', 'php'],
    ['.py', 'python'],
    ['.rb', 'ruby'],
    ['.rs', 'rust'],
    ['.sass', 'sass'],
    ['.scss', 'scss'],
    ['.sh', 'shell'],
    ['.sql', 'sql'],
    ['.swift', 'swift'],
    ['.ts', 'typescript'],
    ['.tsx', 'typescript'],
    ['.xml', 'xml'],
    ['.yaml', 'yaml'],
    ['.yml', 'yaml'],
    ['.zsh', 'shell'],
]);

const FILENAME_LANGUAGE_MAP = new Map([
    ['dockerfile', 'docker'],
    ['gemfile', 'ruby'],
    ['makefile', 'make'],
]);

const LANGUAGE_ALIASES = new Map([
    ['c#', 'csharp'],
    ['golang', 'go'],
    ['js', 'javascript'],
    ['md', 'markdown'],
    ['py', 'python'],
    ['rb', 'ruby'],
    ['rs', 'rust'],
    ['sh', 'shell'],
    ['ts', 'typescript'],
    ['yml', 'yaml'],
]);

export function normalizeLanguageName(value) {
    if (typeof value !== 'string') {
        return null;
    }

    const normalized = value.trim().toLowerCase();

    if (!normalized) {
        return null;
    }

    return LANGUAGE_ALIASES.get(normalized) || normalized;
}

export function detectLanguage(filename) {
    const basename = path.basename(filename).toLowerCase();
    const directMatch = FILENAME_LANGUAGE_MAP.get(basename);

    if (directMatch) {
        return directMatch;
    }

    const extension = path.extname(filename).toLowerCase();
    return EXTENSION_LANGUAGE_MAP.get(extension) || 'unknown';
}
