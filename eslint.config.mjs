import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

const strictSecurityFiles = [
    'supabase/functions/deepseek-chat/**/*.{ts,tsx}',
    'supabase/functions/process-client-activation/**/*.{ts,tsx}',
    'utils/security*.ts',
    'services/webSession.ts',
    'screens/ProfessionalCheckoutScreen.tsx',
];

export default tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommended,
    {
        ignores: [
            'node_modules/**',
            'android/**',
            'ios/**',
            'web/**',
            '.expo/**',
            '**/*.js',
            'lint-report.json',
            'supabase/functions/**/deno-std.d.ts',
        ],
    },
    {
        files: ['**/*.{ts,tsx}'],
        rules: {
            'no-undef': 'off', // TypeScript handles this
            'no-useless-escape': 'off',
            'no-case-declarations': 'off',
            'no-empty': 'off',
            'preserve-caught-error': 'off',
            'no-unused-vars': 'off',
            '@typescript-eslint/ban-ts-comment': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-require-imports': 'off',
            '@typescript-eslint/no-namespace': 'off',
            '@typescript-eslint/no-empty-object-type': 'off',
            '@typescript-eslint/no-unused-vars': 'off'
        },
    },
    {
        files: strictSecurityFiles,
        rules: {
            '@typescript-eslint/ban-ts-comment': 'warn',
            'no-empty': 'warn',
            'no-case-declarations': 'warn',
            'prefer-const': 'warn',
            'preserve-caught-error': 'warn',
            'no-eval': 'warn',
            'no-implied-eval': 'warn',
            'eqeqeq': ['warn', 'always'],
            'no-throw-literal': 'warn',
        },
    },
    {
        files: ['supabase/functions/**/*.{ts,tsx}'],
        rules: {
            '@typescript-eslint/triple-slash-reference': 'off',
        },
    },
);
