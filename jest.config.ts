export default {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/src/__mocks__/fileMock.ts'
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: '<rootDir>/emerald-observatory-web/tsconfig.test.json'
    }]
  },
  testMatch: [
    '<rootDir>/emerald-observatory-web/src/**/__tests__/**/*.(ts|tsx)',
    '<rootDir>/emerald-observatory-web/src/**/*.(test|spec).(ts|tsx)'
  ],
  collectCoverageFrom: [
    '<rootDir>/emerald-observatory-web/src/**/*.(ts|tsx)',
    '!<rootDir>/emerald-observatory-web/src/**/*.d.ts'
  ]
}; 