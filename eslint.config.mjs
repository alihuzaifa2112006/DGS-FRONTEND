import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

const config = [
  { ignores: ['.next/**', 'out/**', 'node_modules/**', 'next-env.d.ts'] },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // Copy uses real typographic quotes/apostrophes, and the hero SVG renders
      // literal JSON with quotes. Escaping every one hurts readability.
      'react/no-unescaped-entities': 'off',
    },
  },
]

export default config
