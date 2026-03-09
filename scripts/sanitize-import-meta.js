const fs = require('fs').promises;
const path = require('path');

const DEFAULT_DIRS = [
    path.join(__dirname, '..', 'dist', '_expo', 'static', 'js', 'web'),
    path.join(__dirname, '..', 'android', 'app', 'build'),
];

async function walk(dir, fileList = []) {
    let entries;
    try {
        entries = await fs.readdir(dir, { withFileTypes: true });
    } catch (err) {
        return fileList;
    }
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            await walk(full, fileList);
        } else if (/\.js$|\.map$|\.bundle$/.test(entry.name)) {
            fileList.push(full);
        }
    }
    return fileList;
}

async function sanitizeFile(filePath) {
    try {
        const raw = await fs.readFile(filePath, 'utf8');
        const replaced = raw.replace(/import\.meta\.env/g, '(globalThis.__import_meta_fallback_env||{})');
        if (replaced !== raw) {
            await fs.writeFile(filePath, replaced, 'utf8');
            console.log('Sanitized:', filePath);
            return 1;
        }
    } catch (err) {
        console.warn('Failed to sanitize', filePath, err.message);
    }
    return 0;
}

async function run() {
    const targets = (process.argv.slice(2).length ? process.argv.slice(2) : DEFAULT_DIRS)
        .map(p => path.resolve(p));

    let total = 0;
    for (const dir of targets) {
        const files = await walk(dir);
        for (const f of files) {
            total += await sanitizeFile(f);
        }
    }
    if (total === 0) console.log('No occurrences replaced.');
    else console.log(`Replaced occurrences in ${total} file(s).`);
}

run().catch(err => { console.error(err); process.exit(1); });
