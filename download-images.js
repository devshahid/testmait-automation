const axios = require('axios');
const fs = require('fs');
const path = require('path');
const outputDir = './dct-images';
async function downloadImage(url, filePath) {
  try {
    // Make a request for the image
    const response = await axios({
      url,
      responseType: 'stream',
    });

    // Create a write stream to save the file
    const writer = fs.createWriteStream(filePath);

    // Pipe the response data to the file
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      response.data.on('end', () => {
        console.log(`Image downloaded: ${filePath}`);
        resolve();
      });
      response.data.on('error', (err) => {
        console.error(`Failed to download image: ${err}`);
        reject(err);
      });
    });
  } catch (error) {
    console.error(`Error downloading the image: ${error}`);
  }
}

module.exports = { downloadImage };

// const downloadImagefromJson = async () => {
//   const rootFolderPath = path.join(__dirname, './scrapped-data');
//   const folderPath = path.resolve(__dirname, 'dct-images');

//   if (!fs.existsSync(folderPath)) {
//     fs.mkdirSync(folderPath);
//   }

//   for (let data of jsonData) {
//     //   Downloading the main image
//     if (data.carImage && data.carImage.trim().length > 0) {
//       const match = data.carImage.match(/\.(jpg|png)/i);
//       let extension = '.png';
//       if (match) extension = match[0];

//       const fileName =
//         data.category.replace(/^[^a-zA-Z0-9]+/, '').replace(/[\s\W]+/g, '_') +
//         data.attributes.color.replace(/^[^a-zA-Z0-9]+/, '').replace(/[\s\W]+/g, '_') +
//         extension;

//       const filePath = path.join(folderPath, fileName);

//       await downloadImage(data.carImage, filePath);
//       console.log(`Image Downloaded for ${fileName}`);
//     }
//   }
// };
// downloadImagefromJson();

// Function to read JSON files recursively from a directory
function readJsonFilesFromDir(dir) {
  let mergedData = [];

  // Read the contents of the directory
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const fullPath = path.join(dir, file);

    // Check if it's a directory, if so recurse into the directory
    if (fs.statSync(fullPath).isDirectory()) {
      mergedData = mergedData.concat(readJsonFilesFromDir(fullPath));
    } else if (path.extname(fullPath) === '.json') {
      // If it's a JSON file, read and parse the JSON content
      const fileData = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));

      // Check if the JSON content is an array or object, and merge appropriately
      if (Array.isArray(fileData)) {
        mergedData = mergedData.concat(fileData); // Flatten arrays into the main array
      } else {
        mergedData.push(fileData); // Push object directly
      }
    }
  });

  return mergedData;
}

const parentDir = path.join(__dirname, './scrapped-data');

// Call the function and merge the JSON data

// Process each year folder
async function processYearFolders(years) {
  for (let year of years) {
    const yearFolderPath = path.join(parentDir, year);

    // Check if folder exists and starts with the year
    if (fs.existsSync(yearFolderPath) && fs.statSync(yearFolderPath).isDirectory()) {
      // Step 1: Merge JSON files for the year
      const mergedJsonData = readJsonFilesFromDir(yearFolderPath);

      // Create year folder in the output directory
      const yearOutputDir = path.join(outputDir, year);
      if (!fs.existsSync(yearOutputDir)) {
        fs.mkdirSync(yearOutputDir, { recursive: true });
      }

      // // Step 2: Write the merged JSON to the year folder
      // const mergedJsonPath = path.join(yearOutputDir, `${year}_merged.json`);
      // // fs.writeFileSync(mergedJsonPath, JSON.stringify(mergedJsonData, null, 2));

      for (let i = 0; i < mergedJsonData.length; i++) {
        if (mergedJsonData[i].carImage && mergedJsonData[i].carImage.trim().length > 0) {
          const match = mergedJsonData[i].carImage.match(/\.(jpg|png)/i);
          let extension = '.png';
          if (match) extension = match[0];

          let fileName;
          if (mergedJsonData[i].category && mergedJsonData[i].attributes.color) {
            fileName =
              mergedJsonData[i].category?.replace(/^[^a-zA-Z0-9]+/, '').replace(/[\s\W]+/g, '_') +
              mergedJsonData[i].attributes.color
                ?.replace(/^[^a-zA-Z0-9]+/, '')
                .replace(/[\s\W]+/g, '_') +
              extension;
          } else {
            //  generate random name
            fileName = `car_${Math.floor(Math.random() * 1000000)}${extension}`;
          }

          const filePath = path.join(yearOutputDir, fileName);

          await downloadImage(mergedJsonData[i].carImage, filePath);
          console.log(`Image Downloaded for ${mergedJsonData[i].category}`);
        }
      }
    }
  }
}

const years = ['1970', '1971', '1974', '1975', '1976', '1977'];
processYearFolders(years);
