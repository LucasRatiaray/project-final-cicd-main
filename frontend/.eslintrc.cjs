/* eslint-env node */
module.exports = {
    root: true,
    // Le frontend contient aussi le serveur Express et la configuration Vite.
    env: {
      browser: true,
      node: true,
      es2022: true
    },
    extends: [
      'plugin:vue/vue3-essential',
      'eslint:recommended'
    ],
    parserOptions: {
      ecmaVersion: 'latest'
    },
    overrides: [
      {
        files: ['vite.config.js'],
        rules: {
          // Les callbacks Vite recoivent des parametres imposes par l'API.
          'no-unused-vars': ['error', { args: 'none' }]
        }
      },
      {
        files: ['src/components/ProductList.vue'],
        rules: {
          // Ces services sont conserves pour l'evolution du composant.
          'no-unused-vars': 'off'
        }
      }
    ]
  }