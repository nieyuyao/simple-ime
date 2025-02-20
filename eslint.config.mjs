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
    'unicorn/prefer-dom-node-text-content': 'off',
    'vue/html-self-closing': 'off',
  },
})
