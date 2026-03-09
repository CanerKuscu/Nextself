import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

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
        ],
    },
    {
        files: ['**/*.{ts,tsx}'],
        rules: {
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/no-require-imports': 'off',
            'no-undef': 'off', // TypeScript handles this
            '@typescript-eslint/no-unused-vars': 'warn',
            'no-empty': 'warn',
            'no-case-declarations': 'warn',
            'prefer-const': 'warn',
            'no-useless-escape': 'warn',
            'preserve-caught-error': 'warn',
            '@typescript-eslint/ban-ts-comment': 'warn'
        },
    },
);
