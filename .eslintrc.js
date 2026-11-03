module.exports = {
	root: true,
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaVersion: 2020,
		sourceType: 'module',
	},
	plugins: ['@typescript-eslint', 'n8n-nodes-base'],
	extends: [
		'eslint:recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:n8n-nodes-base/nodes',
	],
	rules: {
		'@typescript-eslint/no-explicit-any': 'warn',
		'@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
		// A limit's maxValue is the API's own maximum: the editor stops a value the API would refuse.
		'n8n-nodes-base/node-param-type-options-max-value-present': 'off',
	},
	overrides: [
		{
			// These defaults come from `utils/constants.ts`; the rule only sees literal defaults.
			files: ['utils/*.properties.ts', 'utils/versioned-write.helpers.ts'],
			rules: { 'n8n-nodes-base/node-param-default-missing': 'off' },
		},
		{
			// Test fixtures, not node parameters.
			files: ['__tests__/**/*.ts'],
			rules: { 'n8n-nodes-base/node-param-display-name-miscased': 'off' },
		},
	],
};
