// Why not type-aware linting? The failures worth catching in CI (unused
// imports, hook misuse) do not need type information, and keeping the config
// parser-only avoids loading the TS program on every lint run.
import js from '@eslint/js'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  {
    ignores: ['dist/**', 'node_modules/**', 'src/routeTree.gen.ts'],
  },
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    ...reactHooks.configs.flat['recommended-latest'],
  },
)
