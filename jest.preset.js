const nxPreset = require('@nx/jest/preset').default;

module.exports = {
  ...nxPreset,
  moduleNameMapper: {
    '^@two-services/shared$': '<rootDir>/shared/index.ts',
    '^@two-services/shared/(.*)$': '<rootDir>/shared/$1',
    ...nxPreset.moduleNameMapper
  }
};
