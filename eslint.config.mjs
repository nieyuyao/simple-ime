import antfu from '@antfu/eslint-config'

export default antfu({
  yaml: false,
  rules: {
    'no-console': 'off',
    'unicorn/prefer-dom-node-text-content': 'off',
    'vue/html-self-closing': 'off',
  },
})
