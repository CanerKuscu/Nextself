const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();

const dirsToProcess = [
    path.join(rootDir, 'screens'),
    path.join(rootDir, 'components'),
    path.join(rootDir, 'store'),
    path.join(rootDir, 'services'),
    path.join(rootDir, 'navigation'),
    path.join(rootDir, 'utils'),
    path.join(rootDir, 'web', 'dashboard', 'src')
];

function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(fullPath));
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
            results.push(fullPath);
        }
    });
    return results;
}

const targetFiles = dirsToProcess.flatMap(d => walk(d));
let changedCount = 0;

targetFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    const regexps = [
        /from\s+['"](?:\.\.\/)+services\/supabase['"]/g,
        /from\s+['"](?:\.\.\/)+utils\/validation['"]/g,
        /from\s+['"](?:\.\.\/)+utils\/ValidationUtils['"]/g,
        /from\s+['"](?:\.\.\/)+types['"]/g,
        /from\s+['"](?:\.\.\/)+types\/index['"]/g,
        /from\s+['"](?:\.\.\/)+config\/config['"]/g,
        /from\s+['"](?:\.\.\/)+utils\/platformStorage['"]/g,
        /from\s+['"](?:\.\.\/)+utils\/secureStoreAdapter['"]/g,
        
        /from\s+['"](?:\.\/)+services\/supabase['"]/g,
        /from\s+['"](?:\.\/)+types['"]/g,
        /from\s+['"](?:\.\/)+config\/config['"]/g,
        /from\s+['"](?:\.\/)+utils\/validation['"]/g,
    ];

    regexps.forEach(rx => {
        content = content.replace(rx, "from '@nextself/shared'");
    });
    
    // specifically handle imports that had specific bindings from types like `import { Exercise } from '@nextself/shared'`
    // The above regex handles standard matching without touching the bindings.

    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        changedCount++;
    }
});

// Update references inside `@nextself/shared/src` itself (e.g. they should use relative instead of `@nextself/shared`)
const sharedSrc = path.join(rootDir, 'packages', 'shared', 'src');
const sharedFiles = walk(sharedSrc);
sharedFiles.forEach(file => {
   let content = fs.readFileSync(file, 'utf8');
   let original = content;
   // The moved files might import from each other via relative paths like `../utils/platformStorage`
   // Since we moved them to `shared/src`, `config/config.ts` might be accessed via `../config/config`.
   // Since they are inside the same src folder now, the relative paths mostly remain the same or break.
   // They exported them from `index.ts`.
   if (content !== original) {
       fs.writeFileSync(file, content, 'utf8');
   }
});

console.log(`Refactored imports in ${changedCount} files.`);
