import antfu from '@antfu/eslint-config'

export default antfu({
  yaml: false,
  ignores: [
    'node_modules',
    'dist',
    'src/data/*.js',
    '*.md',
    '.github',
  ],
  rules: {
    'no-console': 'off',
    'unicorn/prefer-dom-node-text-content': 'off',
    'vue/html-self-closing': 'off',
  },
})
