/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/test'],
    testMatch: ['**/*.test.ts'],
    clearMocks: true,
    globals: {
      'ts-jest': {
          isolatedModules: true
      }
    },
  };
  