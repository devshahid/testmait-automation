const _ = require('lodash');
const event = require('../testmait/').event;

const { context } = require('../utils/context.js');
const fs = require('fs');
const { join } = require('path');
const { globals } = require('../configs/core.js').config;
// const Helper = require('@testmait/helper');
const { container } = require('../testmait');

module.exports = () => {
  event.dispatcher.on(event.suite.before, (suite) => {
    context.feature.description = suite.comment;
    context.feature.tags = suite.tags;
    // Cut the automatically appended tags from the end of the title
    context.feature.title = _.replace(suite.title, /( @\w+)+/g, '');
  });
  event.dispatcher.on(event.test.before, (test) => {
    context.scenario.tags = test.tags;
    // Cut the automatically appended tags from the end of the title
    context.scenario.title = _.replace(test.title, /( @\w+)+/g, '');
  });

  event.dispatcher.on(event.test.passed, () => {
    if (process.env.AI_PW === 'true') {
      Helper.prototype.helpers.Playwright.browserContext.close();
      const pathdir = join(globals.outputDir, 'videos');
      const FORMAT = 'video/webm';
      const TITLE = context.scenario.title;
      let files = fs.readdirSync(pathdir);
      let videoFile = '';
      let ext = 'webm';

      // console.log('spoo', files);
      for (let file of files) {
        if (file.substr(-1 * (ext.length + 1)) == '.' + ext) {
          // console.log('', file);
          videoFile = join(pathdir, file);
        }
      }
      // console.log(videoFile);
      // Save recorded video to the test
      container.plugins('allure').addAttachment(TITLE, fs.readFileSync(videoFile), FORMAT);
      fs.unlink(videoFile, (err) => {
        if (err) {
          console.error(err);
        }
      });
    }
  });
  event.dispatcher.on(event.test.failed, () => {
    if (process.env.AI_PW === 'true') {
      Helper.prototype.helpers.Playwright.browserContext.close();
      const pathdir = join(globals.outputDir, 'videos');
      const FORMAT = 'video/webm';
      const TITLE = context.scenario.title;
      let files = fs.readdirSync(pathdir);
      let videoFile = '';
      let ext = 'webm';

      // console.log('spoo', files);
      for (let file of files) {
        if (file.substr(-1 * (ext.length + 1)) == '.' + ext) {
          // console.log('', file);
          videoFile = join(pathdir, file);
        }
      }
      // console.log(videoFile);
      // Save recorded video to the test
      container.plugins('allure').addAttachment(TITLE, fs.readFileSync(videoFile), FORMAT);
      fs.unlink(videoFile, (err) => {
        if (err) {
          console.error(err);
        }
      });
    }
  });
};
