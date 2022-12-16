import type {Config} from '@jest/types';

const config: Config.InitialOptions = {
  verbose: false,
  roots: ['<rootDir>'],
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.+(ts|tsx)', '**/?(*.)+(spec|test).+(ts|tsx)'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  testTimeout: 300000,
};
export default config;
