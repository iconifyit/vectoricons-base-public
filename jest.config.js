/** @type {import('jest').Config} */
const base = {
    rootDir: './',
    clearMocks: true,
    testEnvironment: 'node',
    setupFiles: [],
    moduleFileExtensions: ['js', 'json', 'node'],
    transform: {},
    testPathIgnorePatterns: ['/node_modules/', '/dist/'],
};

// Project: unit tests (coverage enforced)
const units = {
    displayName: 'units',
    ...base,
    // units project
    testMatch: [
        '**/__tests__/**/*.test.js',
        '**/?(*.)+(spec|test).js',
        '!**/*contract.test.js',
        '!**/entity.test.js',
        '!**/repository.test.js',
        '!**/service.test.js',
    ],
    // keep these here; Jest 25 accepts them in a project block
    collectCoverageFrom: [
        'src/**/*.js',
        '!src/**/__tests__/**',
        '!src/__tests__/contracts/**',
        '!src/**/backup/**',
        '!src/**/archive/**',
        '!src/**/scratch/**',
        '!src/**/tmp/**',
        '!src/**/dist/**',
    ],
    coverageThreshold: {
        global: {
            statements: 60,
            branches: 40,
            functions: 50,
            lines: 60,
        },
        'src/common/**': {
            statements: 90,
            branches: 80,
            functions: 90,
            lines: 90,
        },
    },
};

const entities = {
    displayName: 'entities',
    ...base,
    testMatch: ['<rootDir>/src/**/__tests__/entity.test.js'],
};

const repositories = {
    displayName: 'repositories',
    ...base,
    testMatch: ['<rootDir>/src/**/__tests__/repository.test.js'],
};

const services = {
    displayName: 'services',
    ...base,
    testMatch: ['<rootDir>/src/**/__tests__/service.test.js'],
};

// Project: contract tests (no coverage)
const contracts = {
    displayName: 'contracts',
    ...base,
    testMatch: ['<rootDir>/src/**/__tests__/*contract.test.js'],
};

module.exports = {
    // put these at the root for Jest 25
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov'],
    projects: [units, contracts, entities, repositories, services],
};