const fs = require('fs');
const path = require('path');
const { promisify } = require('util');
const readdir = promisify(fs.readdir);
const readFile = promisify(fs.readFile);
const mkdir = promisify(fs.mkdir);
const writeFile = promisify(fs.writeFile);

const SPECIAL_CHAR_REGEX = /[^a-zA-Z0-9]/g;

/**
 * Convert special characters in filenames to underscores.
 */
const sanitizeFileName = (name) => name.replace(SPECIAL_CHAR_REGEX, '_');

/**
 * Recursively get all JSON files under a directory.
 */
async function getJsonFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);
      return entry.isDirectory() ? getJsonFiles(fullPath) : fullPath;
    }),
  );
  return Array.prototype.concat(...files).filter((file) => file.endsWith('.json'));
}

/**
 * Process a single JSON file: group content by version and save in versioned files.
 */
async function processFile(filePath, outputBasePath) {
  const data = JSON.parse(await readFile(filePath, 'utf8'));
  const versionMap = data.reduce((acc, item) => {
    const version = item.versionName || 'unknown'; // Handle cases without a version
    if (!acc[version]) acc[version] = [];
    acc[version].push(item);
    return acc;
  }, {});

  const originalFileName = path.basename(filePath, '.json');
  const sanitizedFileName = sanitizeFileName(originalFileName);
  const outputFolder = path.join(outputBasePath, sanitizedFileName);

  // Create output folder for this file
  await mkdir(outputFolder, { recursive: true });

  // Write each version's data to a new file
  for (const [version, items] of Object.entries(versionMap)) {
    const versionedFileName = `${sanitizedFileName}_${sanitizeFileName(version)}.json`;
    const versionedFilePath = path.join(outputFolder, versionedFileName);
    await writeFile(versionedFilePath, JSON.stringify(items, null, 2));
    console.log(`Created: ${versionedFilePath}`);
  }
}

/**
 * Main function: Read all JSON files under a given year and process them.
 */
async function processYearData(year) {
  const inputBasePath = path.resolve('scrapped-data', year);
  const outputBasePath = path.join(__dirname, 'output', year);

  try {
    const jsonFiles = await getJsonFiles(inputBasePath);
    console.log(`Found ${jsonFiles.length} JSON files under ${inputBasePath}`);

    for (const file of jsonFiles) {
      await processFile(file, outputBasePath);
    }

    console.log('Processing completed.');
  } catch (error) {
    console.error('Error processing files:', error);
  }
}

for (let i = 2024; i <= 2024; i++) {
  // Run the script with the desired year
  processYearData(`${i}`);
}
