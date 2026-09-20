import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['node_modules/**', '.expo/**', 'dist/**', 'coverage/**', 'src/core-react/api/schema.d.ts', 'babel.config.js'] },
  ...tseslint.configs.recommended,
  { rules: { '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }] } },
  { files: ['tests/**'], rules: { '@typescript-eslint/no-require-imports': 'off' } },
);
