module.exports = {
    verbose: true,
    transform: {
        "^.+\\.tsx?$": ['ts-jest', {}]
    },
    testPathIgnorePatterns: [
        "<rootDir>/build/",
        "/node_modules/",
    ],
    testRegex: '/__tests__/.*\\.test\\.ts$',
    moduleFileExtensions: [
        'ts',
        'tsx',
        'js',
        'jsx',
        'json',
        'node'
    ],
    globals: {
    },
    testEnvironment: 'node'
}
