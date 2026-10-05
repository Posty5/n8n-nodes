module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	roots: ['<rootDir>'],
	testMatch: ['**/__tests__/**/*.test.ts'],
	// `utils/constants.ts` imports package.json, so tsc copies it to dist/; keep the
	// compiled copy out of jest's module map (it would collide with the root one).
	modulePathIgnorePatterns: ['<rootDir>/dist/'],
	collectCoverageFrom: [
		'nodes/**/*.ts',
		'utils/**/*.ts',
		'!**/*.d.ts',
		'!**/node_modules/**',
		'!**/dist/**',
	],
	moduleNameMapper: {
		'^n8n-workflow$': '<rootDir>/__mocks__/n8n-workflow.ts',
	},
	transform: {
		'^.+\\.ts$': ['ts-jest', {
			tsconfig: {
				esModuleInterop: true,
				allowSyntheticDefaultImports: true,
			},
		}],
	},
};
