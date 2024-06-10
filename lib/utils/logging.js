const log4js = require('log4js');

const { logging } = require('../configs/core.js').config;

// Log4js global configuration
log4js.configure({
  appenders: {
    file: {
      type: 'file',
      filename: logging.file,
      layout: {
        type: 'pattern',
        pattern: '%d{yyyy-MM-dd hh:mm:ss.SSS} [%p] %f{2}:%l:%o "%m"',
      },
    },
    console: {
      type: 'console',
    },
  },
  categories: {
    default: { appenders: ['file'], level: logging.level, enableCallStack: true },
    console: { appenders: ['console'], level: logging.level },
    all: {
      appenders: ['file', 'console'],
      level: logging.level,
      enableCallStack: true,
    },
  },
});

class LoggerFactory {
  init() {
    return log4js.getLogger(logging.category);
  }
}

module.exports = new LoggerFactory();
module.exports.LoggerFactory = LoggerFactory;
