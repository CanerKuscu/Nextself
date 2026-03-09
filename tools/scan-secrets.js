const fs = require('fs');
const path = require('path');

const repoRoot = path.resolve(__dirname, '..');
const excludeDirs = ['node_modules', '.git', 'build', 'dist', 'web-build', 'android', 'ios'];

const secretPatterns = [
    /SUPABASE_SERVICE_ROLE_KEY/i,
    /DEEPSEEK_API_KEY/i,
    /IYZICO_SECRET_KEY/i,
    /EXPO_PUBLIC_ENCRYPTION_KEY/i,
    /sk-[A-Za-z0-9_-]{20,}/i, // openai-like keys
    /-----BEGIN PRIVATE KEY-----/i,
    /AIza[0-9A-Za-z-_]{35}/i, // google api key pattern
    /[A-Za-z0-9-_]{20,}\.[A-Za-z0-9-_]{20,}\.[A-Za-z0-9-_]{20,}/, // jwt-like
];

let findings = [];

function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (excludeDirs.includes(entry.name)) continue;
        if (entry.isDirectory()) {
            walk(full);
            continue;
        }
        if (entry.name.endsWith('.png') || entry.name.endsWith('.jpg') || entry.name.endsWith('.jpeg') || entry.name.endsWith('.map')) continue;
        try {
            const content = fs.readFileSync(full, 'utf8');
            secretPatterns.forEach((pat) => {
                if (pat.test(content)) {
                    findings.push({ file: path.relative(repoRoot, full), match: pat.toString() });
                }
            });
        } catch (e) {
            // binary or unreadable
        }
    }
}

walk(repoRoot);

if (findings.length > 0) {
    console.error('Potential secrets found:');
    findings.forEach(f => console.error(` - ${f.file}  matches ${f.match}`));
    process.exitCode = 2;
} else {
    console.log('No obvious secrets found.');
}
