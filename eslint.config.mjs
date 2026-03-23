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
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-require-imports': 'off',
            'no-undef': 'off', // TypeScript handles this
            '@typescript-eslint/no-unused-vars': 'off',
            'no-empty': 'off',
            'no-case-declarations': 'off',
            'prefer-const': 'off',
            'no-useless-escape': 'off',
            'preserve-caught-error': 'off',
            '@typescript-eslint/ban-ts-comment': 'off'
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
);
