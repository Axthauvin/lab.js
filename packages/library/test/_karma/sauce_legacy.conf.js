// Karma configuration

const customLaunchers = {
  sl_ie_11: {
    base: 'SauceLabs',
    browserName: 'internet explorer',
    version: '11',
    platform: 'Windows 10',
  },
}

module.exports = (config) => {
  config.set({
    // Root / base path
    basePath: '../../',

    // Frameworks to use
    // (see https://npmjs.org/browse/keyword/karma-adapter)
    frameworks: ['mocha', 'requirejs', 'chai', 'sinon'],

    // Files or patterns to load in the browser
    files: [
      'test/_karma/bootstrap.js',
      { pattern: 'packages/library/test/static/*.*', included: false },
      { pattern: 'dist/lab.legacy.js', included: false },
      { pattern: 'node_modules/lodash/lodash.min.js', included: false },
      { pattern: 'test/**/*.js', included: false },
    ],

    // List of files to exclude
    exclude: [
      'test/_karma/[^bootstrap].js',
    ],

    proxies: {
      "/static/": "/base/packages/library/test/static/"
    },

    client: {
      args: ['flavor-legacy'],
    },

    // Local web server port
    port: 9876,

    // Preprocess test files
    // (c.f. https://npmjs.org/browse/keyword/karma-preprocessor)
    preprocessors: {
      'test/**/*.js': ['babel'],
    },

    babelPreprocessor: {
      options: {
        presets: ['env'],
        sourceMap: 'inline',
        plugins: [
          'transform-object-rest-spread',
        ],
      },
      filename: file => file.originalPath.replace(/\.js$/, '.es5.js'),
      sourceFileName: file => file.originalPath,
    },

    // Test results reporter to use
    // (see https://npmjs.org/browse/keyword/karma-reporter for more)
    reporters: ['dots', 'saucelabs'],

    // Enable colors in the output (reporters and logs)
    colors: true,

    // Log level
    // (DISABLE || ERROR || WARN || INFO || DEBUG)
    logLevel: config.LOG_INFO,

    // Disable watching file
    autoWatch: false,

    // SL-specific configuration
    sauceLabs: {
      testName: 'lab.js browser compatibility tests',
      connectOptions: {
        port: 5757,
        logfile: 'sauce_connect.log'
      },
    },

    customLaunchers: customLaunchers,
    browsers: Object.keys(customLaunchers),

    // Increase timeouts to prevent disconnects (w/ defaults)
    browserDisconnectTimeout: 10000, // (2000)
    browserDisconnectTolerance: 1, // (0)
    browserNoActivityTimeout: 4*60*1000, // (10000)
    captureTimeout: 4*60*1000, // (60000)

    // Continuous integration mode (quit after run)
    singleRun: true,

    // Concurrency level (browsers tested in parallel)
    concurrency: 5,
  })
}
