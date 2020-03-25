/* eslint-disable @typescript-eslint/no-unused-vars */
const p = require('pdf2json');
const h = require('html-pdf');

module.exports = {
    preset: 'ts-jest',
    setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
    testEnvironment: 'node',
    testMatch: ['**/*.test.ts'],
};
