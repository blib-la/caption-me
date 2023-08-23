/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */

import type { Config } from "jest";

const config: Config = {
	clearMocks: true,
	collectCoverage: true,
	coverageDirectory: "./coverage",
	coverageProvider: "v8",
	coverageReporters: ["lcov", "text"],
	coveragePathIgnorePatterns: ["node_modules"],
	moduleFileExtensions: ["js", "mjs", "cjs", "jsx", "ts", "tsx", "json", "node"],
	testEnvironment: "jsdom",
	setupFiles: ["<rootDir>/jest.setup.js"],
	transform: {
		"\\.[jt]sx?$": "@swc/jest",
	},
	transformIgnorePatterns: [],
	moduleNameMapper: {
		"^@/(.*)$": "<rootDir>/client/$1",
		"^~/(.*)$": "<rootDir>/public/$1",
	},
	extensionsToTreatAsEsm: [".ts"],
};

export default config;
