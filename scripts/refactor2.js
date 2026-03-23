const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();

// Gather ALL .ts/.tsx files except those in node_modules, packages/shared, web/dashboard, and .expo
function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) { 
            if (file !== 'node_modules' && file !== 'packages' && file !== 'web' && file !== '.expo' && file !== '.git') {
                results = results.concat(walk(fullPath));
            }
        } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx') || fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
            results.push(fullPath);
        }
    });
    return results;
}

const targetFiles = walk(rootDir); // this includes App.tsx, contexts, hooks, navigation, hooks, __tests__ etc

let changedCount = 0;

targetFiles.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let original = content;

    // Specifically catch exact strings that missed the first pass.
    
    // Catch sibling imports: 
    // from './supabase' (if inside services/) -> from '@nextself/shared'
    if (file.includes(path.join('services'))) {
        content = content.replace(/from\s+['"]\.\/supabase['"]/g, "from '@nextself/shared'");
    }
    // from '@nextself/shared' -> from '@nextself/shared'
    content = content.replace(/from\s+['"](?:\.\.\/)+types\/rating['"]/g, "from '@nextself/shared'");
    
    // from '@nextself/shared' or similar combinations
    const regexps = [
        /from\s+['"](?:\.\.\/)*services\/supabase['"]/g,
        /from\s+['"](?:\.\.\/)*utils\/validation['"]/g,
        /from\s+['"](?:\.\.\/)*utils\/ValidationUtils['"]/g,
        /from\s+['"](?:\.\.\/)*types['"]/g,
        /from\s+['"](?:\.\.\/)*types\/index['"]/g,
        /from\s+['"](?:\.\.\/)*config\/config['"]/g,
        /from\s+['"](?:\.\.\/)*utils\/platformStorage['"]/g,
        /from\s+['"](?:\.\.\/)*utils\/secureStoreAdapter['"]/g,
        
        /from\s+['"]\.\/config\/config['"]/g,
        /from\s+['"]\.\/services\/supabase['"]/g,
        /from\s+['"]\.\/utils\/platformStorage['"]/g,
    ];

    regexps.forEach(rx => {
        content = content.replace(rx, "from '@nextself/shared'");
    });
    
    // App.tsx has: `import { CONFIG } from '@nextself/shared'` which the last pass matched.
    // Ensure TS1192 error fixes: "Module '@nextself/shared/src/index' has no default export"
    // Wait, some places did `import PlatformStorage from '@nextself/shared'` which is a default import.
    // If I replaced it with `from '@nextself/shared'`, then the default import becomes `import PlatformStorage from '@nextself/shared'`.
    // BUT `@nextself/shared` exports * from `./utils/platformStorage`! 
    // And `platformStorage.ts` exports default: `export default PlatformStorage;`
    // BUT `export * from './url'` doesn't re-export defaults!
    // So the default export is lost! 
    // I need to change `import PlatformStorage from '@nextself/shared'` to `import { PlatformStorage } from '@nextself/shared'`
    // Oh wait, `platformStorage.ts` default export is an object. If I don't change how it exports, I have to re-export it in shared `index.ts`.
    
    if (content !== original) {
        fs.writeFileSync(file, content, 'utf8');
        changedCount++;
    }
});

console.log(`Refactored deeper imports in ${changedCount} files.`);
