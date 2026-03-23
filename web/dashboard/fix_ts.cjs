const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
            results.push(file);
        }
    });
    return results;
}

const files = walk('./src');
files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    const replacements = [
        { regex: /const handleChange = \(e\) =>/g, rep: `const handleChange = (e: any) =>` },
        { regex: /const handleSubmit = async \(e\) =>/g, rep: `const handleSubmit = async (e: any) =>` },
        { regex: /const handleSubmit = \(e\) =>/g, rep: `const handleSubmit = (e: any) =>` },
        { regex: /mode: 'index'/g, rep: "mode: 'index' as const" },
        { regex: /mode: 'nearest'/g, rep: "mode: 'nearest' as const" },
        { regex: /position: 'top'/g, rep: "position: 'top' as const" },
        { regex: /position: 'bottom'/g, rep: "position: 'bottom' as const" },
        { regex: /useState\(\[\]\)/g, rep: "useState<any[]>([])" },
        { regex: /useState\(\{\}\)/g, rep: "useState<any>({})" },
        { regex: /useState\(null\)/g, rep: "useState<any>(null)" },
        { regex: /colSpan="(\d+)"/g, rep: "colSpan={$1}" },
        { regex: /filters = \{\}/g, rep: "filters: any = {}" },
        { regex: /const dailyStats = \{\};/g, rep: "const dailyStats: any = {};" },
        { regex: /const clientMap = \{\};/g, rep: "const clientMap: any = {};" },
        { regex: /catch \(error\) \{/g, rep: "catch (error: any) {" },
        { regex: /catch \(err\) \{/g, rep: "catch (err: any) {" },
    ];

    replacements.forEach(({ regex, rep }) => {
        if (content.match(regex)) {
            content = content.replace(regex, rep);
            changed = true;
        }
    });

    if (file.includes('ErrorBoundary.tsx') && content.includes('class ErrorBoundary extends React.Component {')) {
        content = content.replace(/class ErrorBoundary extends React.Component \{/g, "class ErrorBoundary extends React.Component<any, any> {");
        changed = true;
    }

    if (file.includes('Login.tsx') && content.match(/const handleSubmit = async \(e\)/)) {
        content = content.replace(/const handleSubmit = async \(e\)/g, "const handleSubmit = async (e: any)");
        changed = true;
    }

    if (file.includes('supabase.tsx')) {
        if (!content.includes('signUp:')) {
            content = content.replace(/signIn: async/g, "signUp: async (email: string, password: string) => { const { data, error } = await supabase.auth.signUp({ email, password }); return { data, error }; },\n    signIn: async");
            changed = true;
        }
        if (!content.includes('export const auth: any')) {
            content = content.replace(/export const auth = \{/g, "export const auth: any = {");
            changed = true;
        }
        if (!content.includes('export const db: any')) {
            content = content.replace(/export const db = \{/g, "export const db: any = {");
            changed = true;
        }
    }

    if (changed) {
        fs.writeFileSync(file, content, 'utf8');
        console.log(`Fixed ${file}`);
    }
});
