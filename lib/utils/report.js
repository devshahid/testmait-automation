const fs = require('fs');
const { execSync } = require('child_process');
const { join } = require('path');

const { plugins } = require('../configs/core.js').config;

function archiveAllureResults() {
  let archiveDir = plugins.allure.archiveDir;
  let resultsDir = plugins.allure.resultsDir;

  // Check if allure results folder exists
  if (fs.existsSync(resultsDir)) {
    if (!fs.existsSync(archiveDir)) {
      fs.mkdirSync(archiveDir);
    }

    // Create archive directory
    let curDir = join(
      archiveDir,
      `${new Date().toISOString().replace(/[:-]/g, '_')}_execution_results`,
    );
    fs.mkdirSync(curDir);

    // Copy all files from the allure results folder to allure results archive
    fs.readdirSync(resultsDir).forEach((file) => {
      let curSrcPath = join(resultsDir, file);
      let curDestPath = join(curDir, file);
      if (fs.statSync(curSrcPath).isFile()) {
        fs.copyFileSync(curSrcPath, curDestPath);
      }
    });

    return curDir;
  }
}

function copyAllureHistory() {
  // Allure report history works properly when the contents of the
  // report history folder is copied to the results history folder
  let reportDir = join(plugins.allure.reportDir, 'history');
  let resultsDir = join(plugins.allure.resultsDir, 'history');

  if (fs.existsSync(reportDir) && fs.statSync(reportDir).isDirectory()) {
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir);
    }
    fs.readdirSync(reportDir).forEach((file) => {
      if (fs.statSync(join(reportDir, file)).isFile()) {
        fs.copyFileSync(join(reportDir, file), join(resultsDir, file));
      }
    });
  }
}

function deleteFolder(folderPath) {
  if (fs.existsSync(folderPath) && fs.lstatSync(folderPath).isDirectory()) {
    fs.readdirSync(folderPath).forEach((file) => {
      let curPath = join(folderPath, file);
      if (fs.lstatSync(curPath).isDirectory()) {
        // Recursively delete folders
        deleteFolder(curPath);
        // Remove empty directories
        fs.rmdirSync(curPath);
      } else {
        // Remove files
        fs.unlinkSync(curPath);
      }
    });
  }
}

function generateAllureReport() {
  execSync(
    `npx allure generate "${plugins.allure.resultsDir}" --clean --report-dir "${plugins.allure.reportDir}"`,
    { stdio: 'inherit' },
  );
}

function prepareReport() {
  // console.log(`Allure results folder path: ${plugins.allure.resultsDir}`);
  //  console.log(`Allure report folder path: ${plugins.allure.reportDir}`);
  if (!plugins.allure.append) deleteFolder(plugins.allure.resultsDir);
  if (!plugins.allure.append) {
    deleteFolder(plugins.allure.resultsDir);
    deleteFolder(plugins.allure.videoDir);
  }
  copyAllureHistory();
}

function finishReport() {
  generateAllureReport();
  archiveAllureResults();
  //let archiveDirPath = archiveAllureResults();
  //  console.log(`Results archived to: ${archiveDirPath}`);
}

module.exports = {
  prepareReport: prepareReport,
  finishReport: finishReport,
};
