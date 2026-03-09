const { spawn } = require('child_process');
const path = require('path');

function run(cmd, args, opts = {}) {
    return new Promise((resolve, reject) => {
        const p = spawn(cmd, args, Object.assign({ stdio: 'inherit', shell: true }, opts));
        p.on('close', (code) => (code === 0 ? resolve(0) : reject(code)));
        p.on('error', (err) => reject(err));
    });
}

(async () => {
    try {
        const args = process.argv.slice(2);
        console.log('Running EAS build (wrapper) with args:', args.join(' '));
        await run('npx', ['eas', 'build', ...args]);
        console.log('\nEAS build finished successfully — running sanitizer...');
        await run('npm', ['run', 'sanitize-dist']);
        console.log('\nSanitizer finished. Build artifacts are now sanitized.');
        process.exit(0);
    } catch (err) {
        console.error('\nBuild or sanitizer failed with code/error:', err);
        process.exit(typeof err === 'number' ? err : 1);
    }
})();
