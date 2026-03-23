const fs = require('fs');
const path = require('path');

const rootDir = process.cwd();
const sharedDir = path.join(rootDir, 'packages', 'shared');
const sharedSrc = path.join(sharedDir, 'src');

// 1. Create Monorepo Structure
fs.mkdirSync(path.join(sharedSrc, 'types'), { recursive: true });
fs.mkdirSync(path.join(sharedSrc, 'services'), { recursive: true });
fs.mkdirSync(path.join(sharedSrc, 'utils'), { recursive: true });
fs.mkdirSync(path.join(sharedSrc, 'config'), { recursive: true });

// Helper to move file
function moveFile(from, to) {
    if (fs.existsSync(from)) {
        fs.renameSync(from, to);
        console.log(`Moved: ${from} -> ${to}`);
    } else {
        console.warn(`WARN: ${from} does not exist.`);
    }
}

// 2. Move Files
// Types
const typeFiles = fs.existsSync('types') ? fs.readdirSync('types') : [];
typeFiles.forEach(file => {
    moveFile(path.join('types', file), path.join(sharedSrc, 'types', file));
});

// Services
moveFile('services/supabase.ts', path.join(sharedSrc, 'services', 'supabase.ts'));

// Utils
const utilsToMove = ['validation.ts', 'ValidationUtils.ts', 'platformStorage.ts', 'secureStoreAdapter.ts'];
utilsToMove.forEach(u => moveFile(path.join('utils', u), path.join(sharedSrc, 'utils', u)));

// Configs
moveFile('config/config.ts', path.join(sharedSrc, 'config', 'config.ts'));

// 3. Create packages/shared/package.json
const sharedPkg = {
  name: "@nextself/shared",
  version: "1.0.0",
  main: "src/index.ts",
  types: "src/index.ts",
  dependencies: {
    "@supabase/supabase-js": "^2.45.7",
    "zod": "^3.25.76",
    "@react-native-async-storage/async-storage": "^2.2.0"
  },
  peerDependencies: {
    "expo-secure-store": "*",
    "react-native": "*"
  }
};
fs.writeFileSync(path.join(sharedDir, 'package.json'), JSON.stringify(sharedPkg, null, 2));

// Create packages/shared/src/index.ts
const indexTs = `
export * from './types';
export * from '@nextself/shared';
export * from './utils/validation';
export * from '@nextself/shared';
export * from './utils/secureStoreAdapter';
export * from '@nextself/shared';
`;
fs.writeFileSync(path.join(sharedSrc, 'index.ts'), indexTs.trim());

// 4. Update Root package.json
const rootPkgPath = path.join(rootDir, 'package.json');
const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf8'));
rootPkg.workspaces = ["web/dashboard", "packages/*"];
rootPkg.dependencies["@nextself/shared"] = "*";
fs.writeFileSync(rootPkgPath, JSON.stringify(rootPkg, null, 2));

// 5. Update web/dashboard/package.json
const webPkgPath = path.join(rootDir, 'web', 'dashboard', 'package.json');
if (fs.existsSync(webPkgPath)) {
    const webPkg = JSON.parse(fs.readFileSync(webPkgPath, 'utf8'));
    webPkg.dependencies = webPkg.dependencies || {};
    webPkg.dependencies["@nextself/shared"] = "*";
    fs.writeFileSync(webPkgPath, JSON.stringify(webPkg, null, 2));
}

console.log("Monorepo setup complete.");
